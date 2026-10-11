"""
Lambda handler for Bilingual Notification Drafting and WhatsApp Dispatch

- Step Functions (DraftAndDispatchNotices): drafts the approved plan's notices and appends a
  NOTICES_DRAFTED audit row recording, per notice, whether Bedrock or the static template wrote
  it and a digest of the exact text, so a fallback is always visible in the chain.
- Direct HTTP invocation: drafts only, no audit. (No public API route: only the workflow drafts notices.)
Notices are drafted and returned as WhatsApp click-to-share links. When the Twilio sandbox is configured, the
approved parent notices are also sent to the demo phones (whatsapp.py) and a NOTICE_DELIVERED row records it.
"""

import json
import logging
import os
import time
from typing import Dict, Any, Optional

import boto3

from services.audit.store import append_audit
from services.common.http import ApiError, guarded, is_http_event, json_body, respond
from services.notify import whatsapp
from services.notify.drafting import generate_parent_broadcast_package
from services.planner.handler import normalise_stage
from services.workflow.decision_store import decision_key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

LAMBDA_RESERVE_S = 5
DELIVERY_RESERVE_S = 12  # two messages per demo phone at up to 5 s each
STORED_NOTICE_FIELDS = ("audience", "language", "notice_text", "whatsapp_click_to_share_url", "fallback_used",
                        "fallback_reason", "rejected_reasons", "model_id", "model_provider", "primary_error",
                        "template_id", "prompt_sha256",
                        "prompt_template_id", "text_sha256")


def _store_notices(table, decision_id: str, package: Dict[str, Any]) -> None:
    """
    Keeps the drafted text on the decision so the principal's Brief (GET /decisions, admin key) can show
    and share it. The audit row is the record; this copy is a convenience, so a failure here is logged
    and never fails a run whose notices were already drafted and audited.
    """
    notices = {k: {f: package[k].get(f) for f in STORED_NOTICE_FIELDS} for k in ("english", "hindi", "teacher")}
    try:
        table.update_item(Key=decision_key(decision_id), UpdateExpression="SET notices_json = :n",
                          ConditionExpression="attribute_exists(PK)",
                          ExpressionAttributeValues={":n": json.dumps(notices, ensure_ascii=False)})
    except Exception:
        logger.exception("Could not store drafted notices on decision %s", decision_id)


def _summary(package: Dict[str, Any]):
    """Provenance per notice: which model or template wrote it, from which prompt, and the exact text's digest."""
    return [{"audience": n["audience"], "language": n["language"], "model_used": n["model_used"],
             "fallback_used": n["fallback_used"], "fallback_reason": n["fallback_reason"],
             "rejected_reasons": n["rejected_reasons"], "rejected_text_sha256": n["rejected_text_sha256"],
             "model_id": n["model_id"], "model_provider": n["model_provider"], "primary_error": n["primary_error"],
             "template_id": n["template_id"],
             "prompt_sha256": n["prompt_sha256"], "prompt_template_id": n["prompt_template_id"],
             "inference_config": n["inference_config"], "text_sha256": n["text_sha256"]}
            for n in (package["english"], package["hindi"], package["teacher"])]


def _deadline(context: Any, reserve_s: float = LAMBDA_RESERVE_S) -> Optional[float]:
    """Model calls must finish this many seconds before the Lambda's own timeout, leaving room for the audit write."""
    if context is None or not hasattr(context, "get_remaining_time_in_millis"):
        return None
    return time.monotonic() + context.get_remaining_time_in_millis() / 1000 - reserve_s


def _deliver(table, tenant_id: str, decision_id: str, execution: Optional[str], package: Dict[str, Any],
             context: Any, stage: str = "") -> Optional[Dict[str, Any]]:
    """
    Demo WhatsApp delivery of the approved parent notices, at most once per execution: Step Functions may retry
    this step, and a parent must never get the same notice twice. A crash after the claim means no message,
    which is the safe side. Returns the NOTICE_DELIVERED audit payload, or None when delivery is off or done.
    """
    if not whatsapp.configured():
        return None
    claim = f"DELIVERY#{execution or decision_id}"
    try:
        table.put_item(Item={"PK": tenant_id, "SK": claim, "ttl": int(time.time()) + 7 * 86400},
                       ConditionExpression="attribute_not_exists(SK)")
    except table.meta.client.exceptions.ConditionalCheckFailedException:
        logger.info("Notices for %s were already delivered by an earlier attempt", decision_id)
        return None
    deadline = _deadline(context, reserve_s=LAMBDA_RESERVE_S / 2) or time.monotonic() + DELIVERY_RESERVE_S
    # Values a Twilio trial template may carry (template mode); free-text mode sends the notices themselves.
    values = {"receipt_url": package["english"].get("verify_url") or "", "stage": stage,
              "date": decision_id.split("#")[2] if decision_id.count("#") >= 3 else ""}
    results = whatsapp.deliver(package, deadline, values)
    return {"decision_id": decision_id, "channel": whatsapp.channel(), "deliveries": results,
            "sent": sum(r["status"] not in ("failed", "skipped") for r in results), "attempted": len(results)}


def notify_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    if is_http_event(event):
        return _notify_http(event, context)

    tenant_id, decision_id = event.get("tenant_id"), event.get("decision_id")
    if not tenant_id or not decision_id:
        raise ValueError("tenant_id and decision_id are required")
    stage = normalise_stage(event.get("stage", "III"))
    # With delivery on, drafting stops earlier so the messages always have time to go out.
    reserve = LAMBDA_RESERVE_S + (DELIVERY_RESERVE_S if whatsapp.configured() else 0)
    package = generate_parent_broadcast_package(event.get("plan") or {}, stage=stage,
                                                receipt_id=event.get("receipt_id"), deadline=_deadline(context, reserve))
    notices = _summary(package)

    table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
    row = append_audit(table, tenant_id, "workflow:notify", "NOTICES_DRAFTED",
                       {"decision_id": decision_id, "approval": event.get("approval"), "notices": notices,
                        "facts_given_to_writer": package["english"]["facts"]},
                       idempotency_key=f"{event['execution']}#NOTICES_DRAFTED" if event.get("execution") else None)
    _store_notices(table, decision_id, package)
    logger.info("Notices drafted for %s (fallback used: %s)", decision_id,
                [n["fallback_used"] for n in notices])

    delivery = _deliver(table, tenant_id, decision_id, event.get("execution"), package, context, stage)
    if delivery:
        append_audit(table, tenant_id, "workflow:notify", "NOTICE_DELIVERED", delivery,
                     idempotency_key=f"{event['execution']}#NOTICE_DELIVERED" if event.get("execution") else None)
        logger.info("WhatsApp demo delivery for %s: %d of %d sent", decision_id, delivery["sent"], delivery["attempted"])
    return {"status": "drafted", "notices": notices, "broadcast_package": package, "audit_seq": row["seq"],
            "delivery": delivery}


@guarded
def _notify_http(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    body = json_body(event)
    try:
        stage = normalise_stage(body.get("stage", "III"))
    except ValueError as e:
        raise ApiError(400, "invalid_stage", str(e))
    plan = body.get("plan") or {}
    if not isinstance(plan, dict):
        raise ApiError(400, "invalid_plan", "'plan' must be an object.")
    package = generate_parent_broadcast_package(plan, stage=stage, deadline=_deadline(context))
    return respond(200, {"status": "drafted", "broadcast_package": package, "notices": _summary(package)})
