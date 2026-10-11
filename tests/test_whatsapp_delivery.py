"""
Demo WhatsApp delivery through the Twilio sandbox: off unless configured, at most once per execution,
never fails the run, and no phone number reaches the audit chain.
"""

import io
import json
import os
import unittest
import urllib.error
import urllib.parse
from unittest import mock

os.environ.setdefault("AWS_DEFAULT_REGION", "ap-south-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")

from moto import mock_aws  # noqa: E402

from services.audit.store import read_chain  # noqa: E402
from services.notify import drafting, whatsapp  # noqa: E402
from services.notify.handler import notify_handler  # noqa: E402
from tests.test_audit_store import make_table  # noqa: E402
from tests.test_notice_output_check import GOLD  # noqa: E402

PHONE = "+919800000001"
TWILIO_ENV = {"TWILIO_ACCOUNT_SID": "AC" + "0" * 32, "TWILIO_AUTH_TOKEN": "test-token",
              "TWILIO_WHATSAPP_FROM": "whatsapp:+14155238886", "DEMO_WHATSAPP_TO": f"whatsapp:{PHONE}"}
EVENT = {"tenant_id": "TENANT#demo", "decision_id": "TENANT#demo#2026-10-12#MORN", "stage": "III",
         "plan": GOLD["plan"], "receipt_id": "AbCdEfGh1234", "execution": "exec-1"}


class FakeTwilio:
    def __init__(self, error=None):
        self.error, self.sent = error, []

    def __call__(self, request, timeout=None):
        form = dict(urllib.parse.parse_qsl(request.data.decode()))
        self.sent.append({"url": request.full_url, "auth": request.get_header("Authorization"), **form})
        if self.error:
            raise self.error
        return io.BytesIO(json.dumps({"sid": f"SM{len(self.sent):032d}", "status": "queued"}).encode())


@mock_aws
class TestDelivery(unittest.TestCase):

    def setUp(self):
        os.environ["TABLE_NAME"] = "SaansStateTable"
        self.table = make_table()
        patcher = mock.patch.object(drafting, "_invoke_bedrock", return_value=None)  # template notices
        patcher.start()
        self.addCleanup(patcher.stop)

    def run_notify(self, twilio, env=TWILIO_ENV, event=EVENT):
        with mock.patch.dict(os.environ, env), mock.patch.object(whatsapp.urllib.request, "urlopen", twilio):
            return notify_handler(dict(event), None)

    def test_sends_both_parent_notices_and_records_it(self):
        twilio = FakeTwilio()
        out = self.run_notify(twilio)
        self.assertEqual(len(twilio.sent), 2)
        self.assertEqual({m["To"] for m in twilio.sent}, {f"whatsapp:{PHONE}"})
        self.assertEqual(twilio.sent[0]["From"], "whatsapp:+14155238886")
        self.assertIn("/Accounts/AC" + "0" * 32 + "/Messages.json", twilio.sent[0]["url"])
        self.assertTrue(twilio.sent[0]["auth"].startswith("Basic "))
        pkg = out["broadcast_package"]
        self.assertEqual([m["Body"] for m in twilio.sent], [pkg["english"]["notice_text"], pkg["hindi"]["notice_text"]])
        self.assertEqual((out["delivery"]["sent"], out["delivery"]["attempted"]), (2, 2))

        rows = read_chain(self.table, "TENANT#demo")
        self.assertEqual([r["event"] for r in rows], ["NOTICES_DRAFTED", "NOTICE_DELIVERED"])
        delivered = rows[1]["payload"]
        self.assertEqual(delivered["channel"], "whatsapp_twilio_sandbox")
        self.assertEqual(delivered["deliveries"][0]["recipient"], "demo-1")
        self.assertEqual(delivered["deliveries"][0]["text_sha256"], pkg["english"]["text_sha256"])
        self.assertNotIn(PHONE[3:], json.dumps([r["payload"] for r in rows]))  # no number in the public chain

    def test_a_retried_step_never_sends_twice(self):
        twilio = FakeTwilio()
        self.run_notify(twilio)
        out = self.run_notify(twilio)  # Step Functions retry of the same execution
        self.assertEqual(len(twilio.sent), 2)
        self.assertIsNone(out["delivery"])
        events = [r["event"] for r in read_chain(self.table, "TENANT#demo")]
        self.assertEqual(events.count("NOTICE_DELIVERED"), 1)

    def test_twilio_failure_is_recorded_and_never_fails_the_run(self):
        err = urllib.error.HTTPError("https://api.twilio.com", 400, "bad", {},
                                     io.BytesIO(b'{"code": 63015, "message": "not joined"}'))
        out = self.run_notify(FakeTwilio(error=err))
        self.assertEqual(out["status"], "drafted")
        self.assertEqual(out["delivery"]["sent"], 0)
        self.assertEqual(out["delivery"]["deliveries"][0]["error"], "HTTP400 twilio:63015")

    def test_off_without_configuration(self):
        twilio = FakeTwilio()
        env = {k: "" for k in TWILIO_ENV}
        out = self.run_notify(twilio, env=env)
        self.assertEqual(twilio.sent, [])
        self.assertIsNone(out["delivery"])
        self.assertEqual([r["event"] for r in read_chain(self.table, "TENANT#demo")], ["NOTICES_DRAFTED"])


class TestRecipients(unittest.TestCase):

    def test_numbers_with_or_without_prefix(self):
        with mock.patch.dict(os.environ, {"DEMO_WHATSAPP_TO": "+919800000001, whatsapp:+919800000002"}):
            self.assertEqual(whatsapp.recipients(), ["whatsapp:+919800000001", "whatsapp:+919800000002"])

    def test_no_credentials_in_source(self):
        src = open(whatsapp.__file__, encoding="utf-8").read()
        self.assertNotRegex(src, r"AC[0-9a-f]{32}")


if __name__ == "__main__":
    unittest.main()
