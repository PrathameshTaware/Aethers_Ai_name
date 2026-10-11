"""
Demo delivery of approved parent notices over WhatsApp.

Two providers, chosen by configuration (Meta first when both are set):
- Meta WhatsApp Cloud API (META_WA_TOKEN, META_WA_PHONE_NUMBER_ID): free test number, free text to verified phones
  within 24 hours of the phone's last message to it.
- Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM): a trial account sends only Twilio's templates
  (TWILIO_CONTENT_SID); free text needs an upgraded account.
Both need DEMO_WHATSAPP_TO. This is a delivery demo; parents are still reached through the class teacher's
click-to-share link. It never raises: every send comes back with a status, and a failure never fails the run.

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
# Unversioned by default (the app's own Graph API version); META_WA_API_VERSION pins one, e.g. "v23.0".
META_API = "https://graph.facebook.com/{version}{phone_number_id}/messages"
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


def provider() -> str:
    """"meta", "twilio", or "" when delivery is off."""
    if not recipients():
        return ""
    if _env("META_WA_TOKEN") and _env("META_WA_PHONE_NUMBER_ID"):
        return "meta"
    if all(_env(k) for k in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM")):
        return "twilio"
    return ""


def configured() -> bool:
    return bool(provider())


def channel() -> str:
    """How the delivery is labelled in the audit chain."""
    return {"meta": "whatsapp_meta_cloud_api", "twilio": "whatsapp_twilio_sandbox"}.get(provider(), "")


def template_mode() -> bool:
    """Twilio trial accounts may only send Twilio's pre-approved templates (a ContentSid), never free text."""
    return provider() == "twilio" and bool(_env("TWILIO_CONTENT_SID"))


def template_variables(values: Dict[str, str]) -> str:
    """TWILIO_CONTENT_VARIABLES with {receipt_url}, {date}, {stage} filled in, e.g. '{"1": "{date}", "2": "{receipt_url}"}'."""
    raw = _env("TWILIO_CONTENT_VARIABLES") or "{}"
    try:
        spec = json.loads(raw)
    except ValueError:
        logger.warning("TWILIO_CONTENT_VARIABLES is not JSON; sending the template without variables")
        return "{}"
    filled = {}
    for k, v in spec.items():
        text = str(v)
        for name, value in values.items():
            text = text.replace("{" + name + "}", value or "")
        filled[str(k)] = text
    return json.dumps(filled, ensure_ascii=False)


def send_meta(to: str, body: str, timeout: float) -> Dict[str, Any]:
    """One free-text message through the Meta Cloud API. Returns {"status", "message_sid", "error"}."""
    version = _env("META_WA_API_VERSION")
    url = META_API.format(version=f"{version}/" if version else "", phone_number_id=_env("META_WA_PHONE_NUMBER_ID"))
    digits = "".join(ch for ch in to.replace("whatsapp:", "") if ch.isdigit())  # Meta wants 91XXXXXXXXXX
    payload = {"messaging_product": "whatsapp", "recipient_type": "individual", "to": digits, "type": "text",
               "text": {"body": body, "preview_url": True}}
    request = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), method="POST", headers={
        "Authorization": f"Bearer {_env('META_WA_TOKEN')}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as resp:
            reply = json.loads(resp.read().decode("utf-8"))
        message_id = ((reply.get("messages") or [{}])[0]).get("id")
        return {"status": "accepted" if message_id else "unknown", "message_sid": message_id, "error": None}
    except urllib.error.HTTPError as e:
        try:  # e.g. 131047: more than 24 hours since the phone last messaged; 131030: phone not on the allowed list
            detail = json.loads(e.read().decode("utf-8")).get("error") or {}
            error = f"HTTP{e.code} meta:{detail.get('code')}"
        except Exception:
            error = f"HTTP{e.code}"
        logger.warning("WhatsApp (Meta) send failed (%s)", error)
        return {"status": "failed", "message_sid": None, "error": error}
    except Exception as e:
        logger.warning("WhatsApp (Meta) send failed (%s)", type(e).__name__)
        return {"status": "failed", "message_sid": None, "error": type(e).__name__}


def send(to: str, body: str, timeout: float, content_variables: str = "") -> Dict[str, Any]:
    """One message. Returns {"status", "message_sid", "error"}; status is Twilio's (queued, sent, ...) or "failed".

    In template mode `body` is ignored and the ContentSid template is sent with `content_variables`.
    """
    if provider() == "meta":
        return send_meta(to, body, timeout)
    sid, token = _env("TWILIO_ACCOUNT_SID"), _env("TWILIO_AUTH_TOKEN")
    form = {"From": _wa(_env("TWILIO_WHATSAPP_FROM")), "To": to}
    if template_mode():
        form["ContentSid"] = _env("TWILIO_CONTENT_SID")
        if content_variables and content_variables != "{}":
            form["ContentVariables"] = content_variables
    else:
        form["Body"] = body
    data = urllib.parse.urlencode(form).encode()
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


def deliver(package: Dict[str, Any], deadline: float, values: Dict[str, str] = None) -> List[Dict[str, Any]]:
    """Sends the approved parent notices to every demo recipient, within `deadline` (a time.monotonic() value).

    Free text: the English and Hindi notices, one message each. Template mode (Twilio trial): one template message
    per recipient, its variables filled from `values` ({receipt_url}, {date}, {stage}); the notice text itself is
    not in it, and the audit row says so ("mode": "template").
    """
    results = []
    notices = DELIVERED_NOTICES[:1] if template_mode() else DELIVERED_NOTICES
    variables = template_variables(values or {}) if template_mode() else ""
    for i, to in enumerate(recipients(), start=1):
        for key in notices:
            notice = package[key]
            remaining = deadline - time.monotonic()
            if remaining < MIN_BUDGET_S:
                result = {"status": "skipped", "message_sid": None, "error": "DeadlineReached"}
            else:
                result = send(to, notice["notice_text"], timeout=min(SEND_TIMEOUT_S, remaining),
                              content_variables=variables)
            entry = {"recipient": f"demo-{i}", "provider": provider(),
                     "mode": "template" if template_mode() else "text", **result}
            if template_mode():
                entry["content_sid"] = _env("TWILIO_CONTENT_SID")
            else:
                entry.update(language=notice["language"], text_sha256=notice["text_sha256"])
            results.append(entry)
    return results
