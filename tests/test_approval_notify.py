"""
Tests for Approval Notifications and Mobile Approval Page
Verifies SNS notifications (Topic/SMS) on approval request,
audit logging of notification dispatch, and the GET /approve/{shortId} page.
"""

import json
import os
import unittest
from unittest import mock

os.environ.setdefault("AWS_DEFAULT_REGION", "ap-south-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")

import boto3
from moto import mock_aws

from services.audit.store import read_chain
from services.workflow.approval_notify import send_approval_notification
from services.workflow.handler import approval_handler, approve_page_handler
from services.workflow.request import request_approval_handler
from tests.test_audit_store import make_table

TENANT = "TENANT#demo"
DECISION_ID = "TENANT#demo#2026-10-12#MORN"


@mock_aws
class TestApprovalNotify(unittest.TestCase):

    def setUp(self):
        os.environ["TABLE_NAME"] = "SaansStateTable"
        os.environ["PUBLIC_BASE_URL"] = "https://api.saans.local/Prod"
        self.table = make_table()
        self.sns = boto3.client("sns", region_name="ap-south-1")
        topic = self.sns.create_topic(Name="SaansApprovalTopic")
        self.topic_arn = topic["TopicArn"]
        os.environ["APPROVAL_TOPIC_ARN"] = self.topic_arn

        # Create decision item
        self.table.put_item(
            Item={
                "PK": TENANT,
                "SK": "DEC#2026-10-12#MORN",
                "status": "PLANNED",
            }
        )

    def test_send_approval_notification_topic(self):
        res = send_approval_notification(
            self.sns,
            topic_arn=self.topic_arn,
            decision_id=DECISION_ID,
            role="principal",
            short_id="xyz123abc456",
            public_base_url="https://api.saans.local/Prod",
            expires_in_seconds=60,
        )
        self.assertTrue(res["sent"])
        self.assertEqual(res["approve_url"], "https://api.saans.local/Prod/approve/xyz123abc456")
        self.assertIn("topic_message_id", res["details"])

    def test_send_approval_notification_sms(self):
        res = send_approval_notification(
            self.sns,
            topic_arn=None,
            decision_id=DECISION_ID,
            role="vice_principal",
            short_id="xyz123abc456",
            public_base_url="https://api.saans.local/Prod",
            expires_in_seconds=60,
            sms_to="+919876543210",
        )
        self.assertTrue(res["sent"])
        self.assertIn("sms_message_id", res["details"])

    def test_send_approval_notification_failure_handled(self):
        broken_sns = mock.MagicMock()
        broken_sns.publish.side_effect = RuntimeError("SNS error")
        res = send_approval_notification(
            broken_sns,
            topic_arn=self.topic_arn,
            decision_id=DECISION_ID,
            role="principal",
            short_id="xyz123abc456",
            public_base_url="https://api.saans.local/Prod",
        )
        self.assertFalse(res["sent"])
        self.assertEqual(res["approve_url"], "https://api.saans.local/Prod/approve/xyz123abc456")

    def test_request_approval_handler_notifies_and_logs_audit(self):
        event = {
            "taskToken": "TASK_TOKEN_12345",
            "tenant_id": TENANT,
            "decision_id": DECISION_ID,
            "execution": "exec_001",
        }
        res = request_approval_handler(event, None)
        self.assertEqual(res["decision_id"], DECISION_ID)
        self.assertTrue(res["notified"])

        # Check audit log
        rows = read_chain(self.table, TENANT)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["event"], "APPROVAL_REQUESTED")
        self.assertTrue(rows[0]["payload"]["notification_sent"])
        # Crucial security check: short ID must NEVER be in audit payload or logs
        self.assertNotIn("short_id", rows[0]["payload"])

    def test_approve_page_serves_html_and_csp(self):
        event = {
            "httpMethod": "GET",
            "pathParameters": {"shortId": "validshortid1"},
        }
        resp = approval_handler(event, None)
        self.assertEqual(resp["statusCode"], 200)
        self.assertIn("text/html", resp["headers"]["Content-Type"])
        self.assertIn("default-src 'none'", resp["headers"]["Content-Security-Policy"])
        self.assertIn("Decision Approval", resp["body"])

    def test_approve_page_does_not_consume_token(self):
        # 1. Issue token
        event = {
            "taskToken": "TOKEN_TO_CONSUME",
            "tenant_id": TENANT,
            "decision_id": DECISION_ID,
            "execution": "exec_002",
        }
        req_res = request_approval_handler(event, None)

        # Extract issued short_id from decision record
        dec = self.table.get_item(Key={"PK": TENANT, "SK": "DEC#2026-10-12#MORN"})["Item"]
        short_id = dec["approval_pending"]["short_id"]

        # 2. GET the approval page (must NOT consume the token)
        get_res = approval_handler({"httpMethod": "GET", "pathParameters": {"shortId": short_id}}, None)
        self.assertEqual(get_res["statusCode"], 200)

        # 3. Decision is still pending
        dec_after_get = self.table.get_item(Key={"PK": TENANT, "SK": "DEC#2026-10-12#MORN"})["Item"]
        self.assertIn("approval_pending", dec_after_get)

        # 4. Mock stepfunctions client and POST the approval
        sfn_mock = mock.MagicMock()
        with mock.patch("services.workflow.handler._sfn", return_value=sfn_mock):
            post_res = approval_handler({
                "httpMethod": "POST",
                "pathParameters": {"shortId": short_id},
                "body": json.dumps({"action": "APPROVE_PLAN_B"}),
            }, None)
        self.assertEqual(post_res["statusCode"], 200)
        sfn_mock.send_task_success.assert_called_once()

        # 5. Subsequent POST fails with 410 (already consumed)
        with mock.patch("services.workflow.handler._sfn", return_value=sfn_mock):
            again = approval_handler({
                "httpMethod": "POST",
                "pathParameters": {"shortId": short_id},
                "body": json.dumps({"action": "APPROVE_PLAN_B"}),
            }, None)
        self.assertEqual(again["statusCode"], 410)


if __name__ == "__main__":
    unittest.main()
