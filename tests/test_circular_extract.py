"""
Circular -> rules: the model proposes, code validates, a person approves, the chain records.
Runs without Bedrock: model replies are scripted.
"""

import functools
import json
import os
import unittest
from pathlib import Path
from unittest import mock

os.environ.setdefault("AWS_DEFAULT_REGION", "ap-south-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")

from moto import mock_aws  # noqa: E402

from services.audit.hash_chain import verify_audit_chain  # noqa: E402
from services.audit.store import read_chain  # noqa: E402
from services.circular import extract, handler, store  # noqa: E402
from tests.test_audit_store import make_table  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
GOLD = ROOT / "data" / "gold"
REAL = (GOLD / "circular_real_caqm.txt").read_text(encoding="utf-8")
SAMPLE4 = (GOLD / "circular_sample_stage4.txt").read_text(encoding="utf-8")
HOSTILE = (GOLD / "hostile_instruction.txt").read_text(encoding="utf-8")
R017_QUOTE = "All outdoor sports and physical education activities in schools shall remain strictly suspended under Stage III of GRAP."
R018_QUOTE = "All classes up to primary level (Nursery to Class V) shall run in hybrid mode (both physical and online options where feasible)."
ADMIN = "circular-admin-key-0123456789"

STAGE4_REPLY = {"rules": [
    {"class_band": ["middle", "secondary", "senior_secondary"], "stage_at_least": "IV",
     "action": {"hybrid_mode": "mandatory"},
     "source_quote": "Classes VI to IX and Class XI shall run in hybrid mode, with online classes wherever feasible."},
    {"class_band": ["secondary", "senior_secondary"], "stage_at_least": "IV",
     "action": {"outdoor_sports": "allowed"},
     "source_quote": "Outdoor sports for students of Classes X and XII preparing for board practicals may be held in the afternoon."},
    {"class_band": ["all"], "stage_at_least": "IV",
     "action": {"outdoor_sports": "banned", "outdoor_pt": "banned"},
     "source_quote": "All outdoor sports and physical education activities in schools shall remain suspended under Stage IV of GRAP."},
]}


def model(reply=None, error=None):
    """A scripted bedrock.converse: returns `reply` (dict -> JSON text) and records each call."""
    calls = []

    def invoke(prompt, config, deadline=None, read_timeout=None, system=None):
        calls.append({"prompt": prompt, "config": config, "system": system, "read_timeout": read_timeout})
        if error:
            return {"text": None, "error": error, "latency_ms": 5, "attempts": 1}
        text = reply if isinstance(reply, str) else json.dumps(reply)
        return {"text": text, "error": None, "latency_ms": 1200, "attempts": 1}
    invoke.calls = calls
    return invoke


def by_quote(result, quote_start):
    return next(c for c in result["candidates"] if c["rule"]["source_quote"].startswith(quote_start))


class TestPipeline(unittest.TestCase):

    def setUp(self):
        self.active = store.bundled_ruleset()

    def propose(self, text, invoke, source_id="test-circular"):
        return extract.propose_from_circular(text, source_id, self.active, invoke=invoke)

    def test_stage4_sample_accepts_new_rules_and_refuses_the_relaxation(self):
        res = self.propose(SAMPLE4, model(STAGE4_REPLY))
        self.assertEqual(res["status"], "proposed")
        self.assertEqual(by_quote(res, "Classes VI")["verdict"], "accepted")
        self.assertEqual(by_quote(res, "All outdoor")["verdict"], "accepted")
        relax = by_quote(res, "Outdoor sports for students")
        self.assertEqual(relax["verdict"], "rejected")
        self.assertIn("Relaxes a restriction", relax["reasons"][0])
        self.assertEqual(res["diff"]["total_added"], 2)
        self.assertEqual((res["diff"]["total_changed"], res["diff"]["total_removed"]), (0, 0))
        added = [r["rule"]["source_quote"] for r in res["diff"]["added_rules"]]
        self.assertNotIn(relax["rule"]["source_quote"], added)
        self.assertEqual(len(res["candidate_ruleset"]["rules"]), len(self.active["rules"]) + 2)

    def test_injection_is_refused_before_the_model_sees_it(self):
        invoke = model(STAGE4_REPLY)
        res = self.propose(HOSTILE, invoke)
        self.assertEqual(res["status"], "refused")
        self.assertFalse(res["steps"]["injection_screen"]["ok"])
        self.assertEqual(invoke.calls, [])
        self.assertIsNone(res["candidate_ruleset"])

    def test_real_circular_already_in_the_ruleset_needs_no_approval(self):
        reply = {"rules": [
            {"class_band": ["all"], "stage_at_least": "III",
             "action": {"outdoor_sports": "banned", "outdoor_pt": "banned"}, "source_quote": R017_QUOTE},
            {"class_band": ["primary"], "stage_at_least": "III", "action": {"hybrid_mode": "mandatory"},
             "source_quote": R018_QUOTE}]}
        res = self.propose(REAL, model(reply))
        self.assertEqual(res["status"], "no_changes")
        self.assertTrue(all(c["matches_active_rule"] and c["verdict"] == "accepted" for c in res["candidates"]))
        self.assertEqual([c["rule"]["rule_id"] for c in res["candidates"]], ["r-017", "r-018"])

    def test_invented_quote_is_refused(self):
        reply = {"rules": [{"class_band": ["all"], "stage_at_least": "III", "action": {"outdoor_sports": "banned"},
                            "source_quote": "Outdoor sports are banned for all students until March."}]}
        res = self.propose(REAL, model(reply))
        self.assertEqual(res["status"], "nothing_accepted")
        self.assertIn("Invented/Hallucinated", res["candidates"][0]["reasons"][0])

    def test_quote_must_support_the_action(self):
        # The old "2 of 3 unsupported" gap: a hybrid-mode sentence cannot ban outdoor sports.
        reply = {"rules": [{"class_band": ["primary"], "stage_at_least": "III",
                            "action": {"hybrid_mode": "mandatory", "outdoor_sports": "banned"},
                            "source_quote": R018_QUOTE}]}
        res = self.propose(REAL, model(reply))
        reasons = res["candidates"][0]["reasons"]
        self.assertEqual(res["candidates"][0]["verdict"], "rejected")
        self.assertTrue(any("does not support action" in r and "outdoor_sports" in r for r in reasons), reasons)

    def test_loosening_an_active_rule_is_refused(self):
        for action, cond, expect in (({"outdoor_sports": "restricted"}, "III", "outdoor_sports: banned -> restricted"),
                                     ({"outdoor_sports": "banned"}, "IV", "stage_at_least: III -> IV")):
            with self.subTest(expect):
                reply = {"rules": [{"class_band": ["all"], "stage_at_least": cond, "action": action,
                                    "source_quote": R017_QUOTE}]}
                res = self.propose(REAL, model(reply))
                self.assertEqual(res["status"], "nothing_accepted")
                self.assertIn(expect, res["candidates"][0]["reasons"][0])

    def test_unknown_action_and_bad_values_are_refused(self):
        reply = {"rules": [{"class_band": ["all"], "stage_at_least": "III",
                            "action": {"outdoor_sports": "forbidden", "close_school": "yes"}, "source_quote": R017_QUOTE}]}
        reasons = self.propose(REAL, model(reply))["candidates"][0]["reasons"]
        self.assertTrue(any("Unknown action" in r for r in reasons), reasons)
        self.assertTrue(any("Invalid" in r for r in reasons), reasons)

    def test_code_assigns_ids_and_source_not_the_model(self):
        reply = {"rules": [{**STAGE4_REPLY["rules"][0], "rule_id": "r-017", "source_id": "Official-Order-999"}]}
        res = self.propose(SAMPLE4, model(reply), source_id="SAMPLE-StageIV-demo")
        rule = res["candidates"][0]["rule"]
        self.assertNotEqual(rule["rule_id"], "r-017")  # cannot overwrite an active rule by naming it
        self.assertTrue(rule["rule_id"].startswith("r-"))
        self.assertEqual(rule["source_id"], "SAMPLE-StageIV-demo")

    def test_model_failures_change_nothing(self):
        for invoke, status in ((model(error="AccessDeniedException"), "model_unavailable"),
                               (model("Sure! Here are the rules: none."), "unparseable_reply")):
            with self.subTest(status):
                res = self.propose(SAMPLE4, invoke)
                self.assertEqual(res["status"], status)
                self.assertIsNone(res["candidate_ruleset"])

    def test_fenced_json_reply_is_parsed(self):
        res = self.propose(SAMPLE4, model("```json\n" + json.dumps(STAGE4_REPLY) + "\n```"))
        self.assertEqual(res["status"], "proposed")

    def test_prompt_treats_the_circular_as_data_and_records_provenance(self):
        invoke = model(STAGE4_REPLY)
        res = self.propose(SAMPLE4, invoke)
        call = invoke.calls[0]
        self.assertIn("untrusted data", call["system"])
        self.assertIn("<circular>\n" + SAMPLE4, call["prompt"])
        self.assertEqual(call["config"]["temperature"], 0.0)
        self.assertEqual(res["model"]["prompt_template_id"], extract.EXTRACTION_PROMPT_ID)
        self.assertEqual(res["model"]["reply_sha256"], extract.sha256_text(json.dumps(STAGE4_REPLY)))


@mock_aws
class TestApi(unittest.TestCase):

    def setUp(self):
        os.environ.update(TABLE_NAME="SaansStateTable", ADMIN_API_KEY=ADMIN)
        self.table = make_table()

    def call(self, method, resource, body=None, key=ADMIN, path=None, query=None):
        event = {"httpMethod": method, "resource": resource, "headers": {"x-saans-admin-key": key} if key else {},
                 "body": json.dumps(body) if body is not None else None, "pathParameters": path,
                 "queryStringParameters": query}
        resp = handler.circular_handler(event, None)
        return resp["statusCode"], (json.loads(resp["body"]) if resp["headers"]["Content-Type"] == "application/json"
                                    else resp["body"])

    def read(self, text=SAMPLE4, reply=None):
        invoke = model(reply or STAGE4_REPLY)
        with mock.patch.object(handler, "propose_from_circular",
                               functools.partial(extract.propose_from_circular, invoke=invoke)):
            return self.call("POST", "/circulars", {"text": text, "source_id": "SAMPLE-StageIV-demo"})

    def test_admin_key_is_required(self):
        status, body = self.call("POST", "/circulars", {"text": SAMPLE4}, key="wrong-key-but-long-enough")
        self.assertEqual(status, 401)

    def test_propose_approve_and_the_planner_uses_it(self):
        status, res = self.read()
        self.assertEqual((status, res["status"]), (200, "proposed"))
        self.assertTrue(res["candidate_id"])
        self.assertEqual(store.load_active_ruleset(self.table, "TENANT#demo")[1], "bundled")  # nothing changed yet

        status, ok = self.call("POST", "/rulesets/{candidateId}/approve", {}, path={"candidateId": res["candidate_id"]})
        self.assertEqual((status, ok["status"]), (200, "approved"))
        active, origin = store.load_active_ruleset(self.table, "TENANT#demo")
        self.assertEqual(origin, "approved")
        self.assertEqual(active["ruleset_version"], ok["version"])
        self.assertEqual(len(active["rules"]), len(store.bundled_ruleset()["rules"]) + 2)

        status, pub = self.call("GET", "/rulesets/active", key=None, query={"tenant": "demo"})
        self.assertEqual((status, pub["origin"], pub["sha256"]), (200, "approved", ok["sha256"]))

        rows = read_chain(self.table, "TENANT#demo")
        self.assertEqual([r["event"] for r in rows], ["CIRCULAR_READ", "RULESET_APPROVED"])
        self.assertTrue(verify_audit_chain(rows)[0])
        read_row = rows[0]["payload"]
        self.assertEqual(read_row["candidate_id"], res["candidate_id"])
        self.assertEqual(len(read_row["accepted"]), 2)
        self.assertIn("Relaxes a restriction", read_row["rejected"][0]["reasons"][0])
        self.assertEqual(read_row["model"]["prompt_template_id"], extract.EXTRACTION_PROMPT_ID)

        status, again = self.call("POST", "/rulesets/{candidateId}/approve", {}, path={"candidateId": res["candidate_id"]})
        self.assertEqual(status, 404)  # one approval per candidate

    def test_stale_candidate_is_refused(self):
        _, first = self.read()
        _, second = self.read(reply={"rules": [STAGE4_REPLY["rules"][0]]})
        self.call("POST", "/rulesets/{candidateId}/approve", {}, path={"candidateId": first["candidate_id"]})
        status, body = self.call("POST", "/rulesets/{candidateId}/approve", {}, path={"candidateId": second["candidate_id"]})
        self.assertEqual((status, body["error"]["code"]), (409, "stale_candidate"))

    def test_refusals_are_recorded_too(self):
        status, res = self.read(text=HOSTILE)
        self.assertEqual((status, res["status"], res["candidate_id"]), (200, "refused", None))
        row = read_chain(self.table, "TENANT#demo")[0]
        self.assertEqual((row["event"], row["payload"]["status"]), ("CIRCULAR_READ", "refused"))

    def test_page_embeds_the_samples_safely(self):
        status, html = self.call("GET", "/circulars", key=None)
        self.assertEqual(status, 200)
        self.assertNotIn("/*SAMPLES*/[]", html)
        self.assertIn("DoE-circular-40-dt-17012025", html)
        script = html.split("const SAMPLES = ", 1)[1].split(";\n", 1)[0]
        self.assertNotIn("</", script)
        self.assertEqual(len(json.loads(script)), 3)


if __name__ == "__main__":
    unittest.main()
