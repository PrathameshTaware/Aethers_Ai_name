"""
Demo delivery of approved parent notices over WhatsApp, through Twilio's WhatsApp sandbox.

Off unless TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM and DEMO_WHATSAPP_TO are all set. The sandbox
only reaches phones that sent it their "join" code, so this is a delivery demo; parents are still reached through the
class teacher's click-to-share link. It never raises: every send comes back with a status, and a failure never
fails the run.

No phone number is stored or audited. Recipients are recorded as "demo-1", "demo-2", ... in DEMO_WHATSAPP_TO order.
"""

import base64
import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

TWILIO_API = "https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
CHANNEL = "whatsapp_twilio_sandbox"
SEND_TIMEOUT_S = 5
MIN_BUDGET_S = 2
# The parent notices are what a parent would receive; the teacher notice goes to staff through the brief.
DELIVERED_NOTICES = ("english", "hindi")


def _env(name: str) -> str:
    return (os.environ.get(name) or "").strip()


def _wa(number: str) -> str:
    return number if number.startswith("whatsapp:") else f"whatsapp:{number}"


def recipients() -> List[str]:
    return [_wa(n.strip()) for n in _env("DEMO_WHATSAPP_TO").split(",") if n.strip()]


def configured() -> bool:
    return all(_env(k) for k in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM")) and bool(recipients())


def send(to: str, body: str, timeout: float) -> Dict[str, Any]:
    """One message. Returns {"status", "message_sid", "error"}; status is Twilio's (queued, sent, ...) or "failed"."""
    sid, token = _env("TWILIO_ACCOUNT_SID"), _env("TWILIO_AUTH_TOKEN")
    data = urllib.parse.urlencode({"From": _wa(_env("TWILIO_WHATSAPP_FROM")), "To": to, "Body": body}).encode()
    auth = base64.b64encode(f"{sid}:{token}".encode()).decode()
    request = urllib.request.Request(TWILIO_API.format(sid=sid), data=data, method="POST", headers={
        "Authorization": f"Basic {auth}", "Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as resp:
            reply = json.loads(resp.read().decode("utf-8"))
        return {"status": reply.get("status", "unknown"), "message_sid": reply.get("sid"), "error": None}
    except urllib.error.HTTPError as e:
        try:  # Twilio explains itself, e.g. code 63015: the recipient has not joined the sandbox
            detail = json.loads(e.read().decode("utf-8"))
            error = f"HTTP{e.code} twilio:{detail.get('code')}"
        except Exception:
            error = f"HTTP{e.code}"
        logger.warning("WhatsApp send failed (%s)", error)
        return {"status": "failed", "message_sid": None, "error": error}
    except Exception as e:
        logger.warning("WhatsApp send failed (%s)", type(e).__name__)
        return {"status": "failed", "message_sid": None, "error": type(e).__name__}


def deliver(package: Dict[str, Any], deadline: float) -> List[Dict[str, Any]]:
    """Sends the approved parent notices to every demo recipient, within `deadline` (a time.monotonic() value)."""
    results = []
    for i, to in enumerate(recipients(), start=1):
        for key in DELIVERED_NOTICES:
            notice = package[key]
            remaining = deadline - time.monotonic()
            if remaining < MIN_BUDGET_S:
                result = {"status": "skipped", "message_sid": None, "error": "DeadlineReached"}
            else:
                result = send(to, notice["notice_text"], timeout=min(SEND_TIMEOUT_S, remaining))
            results.append({"recipient": f"demo-{i}", "language": notice["language"],
                            "text_sha256": notice["text_sha256"], **result})
    return results
