"""
Bedrock is always tried first. The fallback model answers only when Bedrock fails, every use is labelled
model_provider="fallback", and its output goes through the same code checks.
"""

import io
import json
import os
import unittest
import urllib.error
from unittest import mock

from services.circular import extract, store
from services.common import fallback_model, llm
from services.notify import drafting
from tests.test_notice_output_check import BASE_URL, GOLD, RECEIPT_ID

GOOD = GOLD["cases"][0]["text"].replace("{link}", GOLD["link"])
BAD = f"Dear Parents, AQI is 450 so 6 outdoor periods move indoors. Verify: {GOLD['link']}"


class FakeHttp:
    """Stands in for urllib.request.urlopen; records requests and returns a chat-completions body."""

    def __init__(self, text=None, error=None):
        self.text, self.error, self.requests = text, error, []

    def __call__(self, request, timeout=None):
        self.requests.append({"url": request.full_url, "headers": dict(request.header_items()),
                              "body": json.loads(request.data), "timeout": timeout})
        if self.error:
            raise self.error
        return io.BytesIO(json.dumps({"choices": [{"message": {"content": self.text}}]}).encode())


def with_key(test):
    return mock.patch.dict(os.environ, {"FALLBACK_MODEL_API_KEY": "test-fallback-key"})(test)


class TestNotices(unittest.TestCase):

    def draft(self, bedrock_text, http, **kw):
        with mock.patch.object(drafting, "_invoke_bedrock", return_value=bedrock_text) as primary, \
                mock.patch.object(fallback_model.urllib.request, "urlopen", http):
            n = drafting.draft_notice(GOLD["plan"], receipt_id=RECEIPT_ID, public_base_url=BASE_URL, **kw)
        return n, primary

    @with_key
    def test_bedrock_answers_and_the_fallback_is_never_called(self):
        http = FakeHttp(GOOD)
        n, primary = self.draft(GOOD, http)
        self.assertEqual((n["model_provider"], n["model_id"], n["primary_error"]),
                         ("bedrock", drafting.BEDROCK_MODEL_ID, None))
        self.assertTrue(n["model_used"].startswith("Bedrock-"))
        self.assertEqual(http.requests, [])
        primary.assert_called_once()

    @with_key
    def test_fallback_answers_only_when_bedrock_fails_and_is_labelled(self):
        n, primary = self.draft(None, FakeHttp(GOOD))
        primary.assert_called_once()  # Bedrock was tried first
        self.assertFalse(n["fallback_used"])
        self.assertEqual(n["notice_text"], GOOD)
        self.assertEqual(n["model_provider"], "fallback")
        self.assertEqual(n["model_id"], fallback_model.label())
        self.assertTrue(n["model_id"].startswith("groq/"))
        self.assertTrue(n["model_used"].startswith("Fallback-"))
        self.assertEqual(n["primary_error"], "BedrockUnavailable")

    @with_key
    def test_fallback_output_gets_the_same_code_checks(self):
        n, _ = self.draft(None, FakeHttp(BAD))
        self.assertTrue(n["fallback_used"])
        self.assertEqual(n["fallback_reason"], "output_rejected")
        self.assertEqual(n["rejected_reasons"], ["invented_number:450"])
        self.assertNotIn("450", n["notice_text"])

    def test_without_a_key_the_fallback_is_off(self):
        os.environ.pop("FALLBACK_MODEL_API_KEY", None)
        http = FakeHttp(GOOD)
        n, _ = self.draft(None, http)
        self.assertEqual((n["fallback_used"], n["fallback_reason"], n["model_provider"]),
                         (True, "model_unavailable", None))
        self.assertEqual(http.requests, [])

    @with_key
    def test_both_down_gives_the_static_template(self):
        n, _ = self.draft(None, FakeHttp(error=urllib.error.URLError("down")))
        self.assertEqual((n["fallback_used"], n["fallback_reason"]), (True, "model_unavailable"))
        self.assertEqual(n["primary_error"], "BedrockUnavailable")

    @with_key
    def test_package_stops_waiting_on_bedrock_after_it_fails(self):
        http = FakeHttp(GOOD)
        with mock.patch.object(drafting, "_invoke_bedrock", return_value=None) as primary, \
                mock.patch.object(fallback_model.urllib.request, "urlopen", http):
            pkg = drafting.generate_parent_broadcast_package(GOLD["plan"], receipt_id=RECEIPT_ID)
        self.assertEqual(primary.call_count, 1)  # Bedrock tried once, then skipped for this run
        self.assertEqual(len(http.requests), 3)  # every notice still asked the fallback
        self.assertTrue(all(pkg[k]["primary_error"] == "BedrockUnavailable" for k in ("english", "hindi", "teacher")))
        # This package has no receipt link, so the fallback's link and the English text for Hindi are refused.
        self.assertIn("wrong_script", pkg["hindi"]["rejected_reasons"])


class TestFallbackClient(unittest.TestCase):

    @with_key
    def test_request_shape(self):
        http = FakeHttp("hello there")
        with mock.patch.object(fallback_model.urllib.request, "urlopen", http):
            reply = fallback_model.complete("prompt", drafting.INFERENCE_CONFIG, deadline=float("inf"),
                                            read_timeout=8, system="sys")
        req = http.requests[0]
        self.assertEqual(reply["text"], "hello there")
        self.assertEqual(req["url"], fallback_model.FALLBACK_URL)
        self.assertEqual(req["headers"]["Authorization"], "Bearer test-fallback-key")
        self.assertEqual(req["body"]["messages"][0], {"role": "system", "content": "sys"})
        self.assertEqual(req["body"]["max_tokens"], drafting.INFERENCE_CONFIG["maxTokens"])
        self.assertLessEqual(req["timeout"], 8)

    @with_key
    def test_http_error_and_deadline(self):
        err = urllib.error.HTTPError(fallback_model.FALLBACK_URL, 429, "slow down", {}, None)
        with mock.patch.object(fallback_model.urllib.request, "urlopen", FakeHttp(error=err)):
            self.assertEqual(fallback_model.complete("p", {}, float("inf"), 8)["error"], "HTTP429")
        self.assertEqual(fallback_model.complete("p", {}, 0.0, 8)["error"], "DeadlineReached")

    def test_key_is_never_in_the_source(self):
        src = open(fallback_model.__file__, encoding="utf-8").read()
        self.assertNotRegex(src, r"gsk_[A-Za-z0-9]{20,}")


class TestExtraction(unittest.TestCase):

    @with_key
    def test_circular_read_by_the_fallback_is_recorded_as_such(self):
        from tests.test_circular_extract import SAMPLE4, STAGE4_REPLY
        down = {"text": None, "error": "ValidationException", "latency_ms": 5, "attempts": 1}
        with mock.patch.object(llm.bedrock, "converse", return_value=down) as primary, \
                mock.patch.object(fallback_model.urllib.request, "urlopen", FakeHttp(json.dumps(STAGE4_REPLY))):
            res = extract.propose_from_circular(SAMPLE4, "SAMPLE-StageIV-demo", store.bundled_ruleset())
        primary.assert_called_once()
        self.assertEqual(res["status"], "proposed")
        self.assertEqual(res["model"]["model_provider"], "fallback")
        self.assertEqual(res["model"]["primary_error"], "ValidationException")
        self.assertTrue(res["model"]["model_id"].startswith("groq/"))

    def test_bedrock_reply_is_recorded_as_bedrock(self):
        ok = {"text": '{"rules": []}', "error": None, "latency_ms": 5, "attempts": 1}
        with mock.patch.object(llm.bedrock, "converse", return_value=ok):
            reply = llm.generate("p", {})
        self.assertEqual((reply["model_provider"], reply["primary_error"]), ("bedrock", None))


if __name__ == "__main__":
    unittest.main()
