"""
Model-written notices are checked by code before they can be sent, and a slow model cannot stall the
Lambda past its timeout. Runs without Bedrock: replies are recorded in data/gold/notice_replies.json.
"""

import json
import sys
import time
import types
import unittest
from pathlib import Path
from unittest import mock

from services.notify import drafting

ROOT = Path(__file__).resolve().parent.parent
GOLD = json.loads((ROOT / "data/gold/notice_replies.json").read_text(encoding="utf-8"))
BASE_URL = GOLD["link"].rsplit("/verify/", 1)[0]
RECEIPT_ID = GOLD["link"].rsplit("/", 1)[1]


class ReadTimeoutError(Exception):
    """Stands in for botocore's ReadTimeoutError; the drafter matches on the class name."""


class AccessDenied(Exception):
    response = {"Error": {"Code": "AccessDeniedException"}}


def fake_bedrock(replies):
    """A boto3 stand-in whose converse() returns or raises the next item of `replies`; records each call."""
    calls = []

    class Client:
        def __init__(self, config):
            self.config = config

        def converse(self, **kw):
            calls.append({"config": self.config, **kw})
            reply = replies[min(len(calls), len(replies)) - 1]
            if isinstance(reply, Exception):
                raise reply
            return {"output": {"message": {"content": [{"text": reply}]}}}

    boto3 = types.SimpleNamespace(client=lambda *a, config=None, **k: Client(config))
    config_mod = types.SimpleNamespace(Config=lambda **kw: kw)
    modules = {"boto3": boto3, "botocore": types.SimpleNamespace(config=config_mod), "botocore.config": config_mod}
    return mock.patch.dict(sys.modules, modules), calls


class TestRecordedReplies(unittest.TestCase):

    def test_each_recorded_reply_gets_the_expected_verdict(self):
        for case in GOLD["cases"]:
            with self.subTest(case["id"]):
                text = case["text"].replace("{link}", GOLD["link"])
                reasons = drafting.check_notice(text, GOLD["stage"], GOLD["plan"], GOLD["link"], case["language"])
                self.assertEqual(reasons, case["expect"])

    def test_set_covers_good_and_bad_replies(self):
        verdicts = [bool(c["expect"]) for c in GOLD["cases"]]
        self.assertGreaterEqual(verdicts.count(False), 3)
        self.assertGreaterEqual(verdicts.count(True), 8)

    def test_prompt_wording_numbers_are_not_allowed_facts(self):
        # "max 3 sentences" is in the prompt but is not a fact; at Stage II, a "3" is invented.
        text = f"Dear Parents, 3 outdoor periods are replaced today. Verify: {GOLD['link']}"
        self.assertEqual(drafting.check_notice(text, "II", GOLD["plan"], GOLD["link"], "english"),
                         ["invented_number:3"])

    def test_no_link_expected_and_none_given_passes(self):
        text = "Dear Parents, under GRAP Stage III, 6 outdoor PE periods today are replaced by indoor sessions."
        self.assertEqual(drafting.check_notice(text, "III", GOLD["plan"], None, "english"), [])

    def test_overlong_reply_is_rejected(self):
        text = "Dear Parents, indoor sessions today. " * 30 + GOLD["link"]
        self.assertIn("too_long", drafting.check_notice(text, "III", GOLD["plan"], GOLD["link"], "english"))


class TestRejectedReplyFallsBack(unittest.TestCase):

    def draft(self, reply, language="english"):
        patch, calls = fake_bedrock([reply])
        with patch:
            n = drafting.draft_notice(GOLD["plan"], language=language, receipt_id=RECEIPT_ID,
                                      public_base_url=BASE_URL)
        return n, calls

    def test_invented_number_falls_back_and_is_recorded(self):
        bad = f"Dear Parents, AQI is 450 so 6 outdoor periods move indoors. Verify: {GOLD['link']}"
        n, _ = self.draft(bad)
        self.assertTrue(n["fallback_used"])
        self.assertEqual(n["fallback_reason"], "output_rejected")
        self.assertEqual(n["rejected_reasons"], ["invented_number:450"])
        self.assertEqual(n["rejected_text_sha256"], drafting.sha256_text(bad))
        self.assertNotIn("450", n["notice_text"])
        self.assertIn(GOLD["link"], n["notice_text"])  # the template still links the receipt
        self.assertIsNotNone(n["prompt_sha256"])  # the rejected text still traces to its prompt
        self.assertEqual(n["prompt_template_id"], drafting.PROMPT_TEMPLATE_ID)

    def test_good_reply_is_sent_with_its_provenance(self):
        good = GOLD["cases"][0]["text"].replace("{link}", GOLD["link"])
        n, calls = self.draft(good)
        self.assertFalse(n["fallback_used"])
        self.assertIsNone(n["fallback_reason"])
        self.assertEqual(n["notice_text"], good)
        self.assertEqual(n["prompt_template_id"], drafting.PROMPT_TEMPLATE_ID)
        self.assertEqual(n["inference_config"], drafting.INFERENCE_CONFIG)
        self.assertEqual(calls[0]["inferenceConfig"], drafting.INFERENCE_CONFIG)

    def test_forced_fallback_records_no_prompt(self):
        n = drafting.draft_notice(GOLD["plan"], force_fallback=True)
        self.assertEqual(n["fallback_reason"], "forced")
        self.assertIsNone(n["prompt_sha256"])
        self.assertIsNone(n["prompt_template_id"])
        self.assertIsNone(n["inference_config"])


class TestBedrockTimeouts(unittest.TestCase):

    def test_each_call_has_a_short_timeout_and_no_hidden_retries(self):
        patch, calls = fake_bedrock(["Dear Parents, outdoor PE moves indoors today."])
        with patch:
            drafting._invoke_bedrock("prompt", deadline=time.monotonic() + 60)
        cfg = calls[0]["config"]
        self.assertEqual(cfg["read_timeout"], drafting.BEDROCK_READ_TIMEOUT_S)
        self.assertLessEqual(cfg["read_timeout"], 8)
        self.assertEqual(cfg["connect_timeout"], drafting.BEDROCK_CONNECT_TIMEOUT_S)
        self.assertEqual(cfg["retries"], {"total_max_attempts": 1})

    def test_read_timeout_shrinks_to_fit_the_deadline(self):
        patch, calls = fake_bedrock(["Dear Parents, outdoor PE moves indoors today."])
        with patch:
            drafting._invoke_bedrock("prompt", deadline=time.monotonic() + 5)
        self.assertLess(calls[0]["config"]["read_timeout"], 5 - drafting.BEDROCK_CONNECT_TIMEOUT_S + 0.01)

    def test_transient_error_is_retried_once(self):
        patch, calls = fake_bedrock([ReadTimeoutError("slow"), "Dear Parents, outdoor PE moves indoors today."])
        with patch:
            self.assertIsNotNone(drafting._invoke_bedrock("prompt", deadline=time.monotonic() + 60))
        self.assertEqual(len(calls), 2)

    def test_retry_stops_after_one(self):
        patch, calls = fake_bedrock([ReadTimeoutError("slow")])
        with patch:
            self.assertIsNone(drafting._invoke_bedrock("prompt", deadline=time.monotonic() + 60))
        self.assertEqual(len(calls), drafting.BEDROCK_MAX_ATTEMPTS)

    def test_access_denied_is_not_retried(self):
        patch, calls = fake_bedrock([AccessDenied("no")])
        with patch:
            self.assertIsNone(drafting._invoke_bedrock("prompt", deadline=time.monotonic() + 60))
        self.assertEqual(len(calls), 1)

    def test_no_call_without_time_left(self):
        patch, calls = fake_bedrock(["Dear Parents, outdoor PE moves indoors today."])
        with patch:
            self.assertIsNone(drafting._invoke_bedrock("prompt", deadline=time.monotonic() + 1))
        self.assertEqual(calls, [])

    def test_package_skips_the_model_after_it_fails(self):
        patch, calls = fake_bedrock([ReadTimeoutError("slow")])
        with patch:
            pkg = drafting.generate_parent_broadcast_package(GOLD["plan"], receipt_id=RECEIPT_ID)
        self.assertEqual(len(calls), drafting.BEDROCK_MAX_ATTEMPTS)  # only the first notice waited on the model
        for key in ("english", "hindi", "teacher"):
            self.assertEqual(pkg[key]["fallback_reason"], "model_unavailable")
            self.assertTrue(pkg[key]["notice_text"])

    def test_worst_case_fits_in_the_lambda_timeout(self):
        from services.notify.handler import LAMBDA_RESERVE_S
        tpl = (ROOT / "infra/template.yaml").read_text(encoding="utf-8")
        lambda_timeout = int(tpl.split("    Timeout: ", 1)[1].split()[0])
        worst = drafting.BEDROCK_MAX_ATTEMPTS * (drafting.BEDROCK_CONNECT_TIMEOUT_S + drafting.BEDROCK_READ_TIMEOUT_S)
        self.assertLess(worst, drafting.DEFAULT_PACKAGE_BUDGET_S + 1)
        self.assertLess(drafting.DEFAULT_PACKAGE_BUDGET_S, lambda_timeout - LAMBDA_RESERVE_S + 1)


if __name__ == "__main__":
    unittest.main()
