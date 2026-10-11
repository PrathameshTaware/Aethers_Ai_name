"""
POST /runs (HTTP run trigger, admin key) and the drafted notices kept on the decision for the Brief.
Step Functions is replaced by a recording stub; DynamoDB is moto's.
"""

import json
import os
import unittest
from unittest import mock

os.environ.setdefault("AWS_DEFAULT_REGION", "ap-south-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")

import boto3  # noqa: E402
from botocore.exceptions import ClientError  # noqa: E402
from moto import mock_aws  # noqa: E402

from services.notify import handler as notify_mod  # noqa: E402
from services.notify.drafting import sha256_text  # noqa: E402
from services.workflow import trigger as trigger_mod  # noqa: E402
from services.workflow.decisions import decisions_handler  # noqa: E402
from services.workflow.runs import runs_handler  # noqa: E402

ADMIN_KEY = "test-admin-key-0123456789"
ARN = "arn:aws:states:ap-south-1:123456789012:stateMachine:SaansWorkflow"
DECISION_ID = "TENANT#demo#2026-10-14#MORN"


class StubSfn:
    """Remembers started executions by name, like Standard workflows do."""

    def __init__(self):
        self.started = {}

    def describe_execution(self, executionArn):
        if executionArn not in self.started:
            raise ClientError({"Error": {"Code": "ExecutionDoesNotExist", "Message": "x"}}, "DescribeExecution")
        return {"status": "RUNNING"}

    def start_execution(self, stateMachineArn, name, input):
        arn = trigger_mod.execution_arn(stateMachineArn, name)
        self.started[arn] = json.loads(input)
        return {"executionArn": arn}


def runs_event(body, key=ADMIN_KEY):
    return {"httpMethod": "POST", "headers": {"x-saans-admin-key": key} if key else {}, "body": json.dumps(body)}


class TestRunsEndpoint(unittest.TestCase):

    def setUp(self):
        self.sfn = StubSfn()
        for p in (mock.patch.dict(os.environ, {"ADMIN_API_KEY": ADMIN_KEY, "STATE_MACHINE_ARN": ARN}),
                  mock.patch.object(trigger_mod, "_sfn", lambda: self.sfn)):
            p.start()
            self.addCleanup(p.stop)

    def test_starts_a_run_with_the_replay_forecast_by_default(self):
        resp = runs_handler(runs_event({"date": "2026-10-14", "stage": "III"}), None)
        self.assertEqual(resp["statusCode"], 202)
        body = json.loads(resp["body"])
        self.assertEqual((body["status"], body["decision_id"]), ("started", DECISION_ID))
        (execution_input,) = self.sfn.started.values()
        self.assertEqual(execution_input["forecast_source"], "replay")
        self.assertEqual(execution_input["stage"], "III")

    def test_second_start_for_the_same_decision_is_reported_not_rerun(self):
        runs_handler(runs_event({"date": "2026-10-14", "stage": "III"}), None)
        resp = runs_handler(runs_event({"date": "2026-10-14", "stage": "III"}), None)
        self.assertEqual(resp["statusCode"], 200)
        self.assertEqual(json.loads(resp["body"])["status"], "duplicate_suppressed")
        self.assertEqual(len(self.sfn.started), 1)

    def test_requires_the_admin_key(self):
        for key in (None, "wrong"):
            resp = runs_handler(runs_event({"date": "2026-10-14", "stage": "III"}, key=key), None)
            self.assertEqual(resp["statusCode"], 401)
        self.assertEqual(self.sfn.started, {})

    def test_bad_input_is_a_clean_400(self):
        for body in ({"date": "14-10-2026", "stage": "III"}, {"date": "2026-10-14", "stage": "V"},
                     {"date": "2026-10-14", "stage": "III", "forecast_source": "guess"},
                     {"date": "2026-10-14", "stage": "III", "rerun_label": "Not OK!"}):
            resp = runs_handler(runs_event(body), None)
            self.assertEqual(resp["statusCode"], 400, body)
            self.assertEqual(json.loads(resp["body"])["error"]["code"], "invalid_input")
        self.assertEqual(self.sfn.started, {})


@mock_aws
class TestNoticesOnTheBrief(unittest.TestCase):

    def setUp(self):
        p = mock.patch.dict(os.environ, {"ADMIN_API_KEY": ADMIN_KEY, "TABLE_NAME": "SaansStateTable"})
        p.start()
        self.addCleanup(p.stop)
        self.table = boto3.resource("dynamodb").create_table(
            TableName="SaansStateTable", BillingMode="PAY_PER_REQUEST",
            AttributeDefinitions=[{"AttributeName": "PK", "AttributeType": "S"},
                                  {"AttributeName": "SK", "AttributeType": "S"}],
            KeySchema=[{"AttributeName": "PK", "KeyType": "HASH"}, {"AttributeName": "SK", "KeyType": "RANGE"}])
        self.table.put_item(Item={"PK": "TENANT#demo", "SK": "DEC#2026-10-14#MORN", "status": "APPROVE_PLAN_B",
                                  "data": json.dumps({"plan_a": [], "plan_b": []})})

    def _brief(self):
        resp = decisions_handler({"httpMethod": "GET", "headers": {"x-saans-admin-key": ADMIN_KEY},
                                  "queryStringParameters": {"tenant": "demo", "date": "2026-10-14"}}, None)
        self.assertEqual(resp["statusCode"], 200)
        return json.loads(resp["body"])

    def _draft(self, decision_id=DECISION_ID):
        return notify_mod.notify_handler({"tenant_id": "TENANT#demo", "decision_id": decision_id, "stage": "III",
                                          "plan": {"plan_a": [], "plan_b": []}, "receipt_id": "AbCdEfGh1234"}, None)

    def test_brief_has_no_notices_before_they_are_drafted(self):
        self.assertIsNone(self._brief()["notices"])

    def test_drafted_notices_reach_the_brief_and_match_the_audited_digest(self):
        audited = {(n["audience"], n["language"]): n["text_sha256"] for n in self._draft()["notices"]}
        notices = self._brief()["notices"]
        self.assertEqual(set(notices), {"english", "hindi", "teacher"})
        for n in notices.values():
            self.assertTrue(n["whatsapp_click_to_share_url"].startswith("https://api.whatsapp.com/send?text="))
            # The text the Brief shows is exactly the text whose digest is in the audit chain.
            self.assertEqual(sha256_text(n["notice_text"]), n["text_sha256"])
            self.assertEqual(n["text_sha256"], audited[(n["audience"], n["language"])])

    def test_a_missing_decision_never_fails_the_drafting_step(self):
        self.assertEqual(self._draft("TENANT#demo#2026-10-20#MORN")["status"], "drafted")
        self.assertIsNone(self._brief()["notices"])


if __name__ == "__main__":
    unittest.main()
