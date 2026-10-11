"""
Lambda handler for Bilingual Notification Drafting and WhatsApp Dispatch

- Step Functions (DraftAndDispatchNotices): drafts the approved plan's notices and appends a
  NOTICES_DRAFTED audit row recording, per notice, whether Bedrock or the static template wrote
  it and a digest of the exact text, so a fallback is always visible in the chain.
- Direct HTTP invocation: drafts only, no audit. (No public API route: only the workflow drafts notices.)
Notices are drafted and returned as WhatsApp click-to-share links; nothing is pushed to phones.
"""

import json
import logging
import os
import time
from typing import Dict, Any, Optional

import boto3

from services.audit.store import append_audit
from services.common.http import ApiError, guarded, is_http_event, json_body, respond
from services.notify.drafting import generate_parent_broadcast_package
from services.planner.handler import normalise_stage
from services.workflow.decision_store import decision_key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

LAMBDA_RESERVE_S = 5
STORED_NOTICE_FIELDS = ("audience", "language", "notice_text", "whatsapp_click_to_share_url", "fallback_used",
                        "model_id", "template_id", "prompt_sha256", "text_sha256")


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
             "model_id": n["model_id"], "template_id": n["template_id"],
             "prompt_sha256": n["prompt_sha256"], "prompt_template_id": n["prompt_template_id"],
             "inference_config": n["inference_config"], "text_sha256": n["text_sha256"]}
            for n in (package["english"], package["hindi"], package["teacher"])]


def _deadline(context: Any) -> Optional[float]:
    """Model calls must finish this many seconds before the Lambda's own timeout, leaving room for the audit write."""
    if context is None or not hasattr(context, "get_remaining_time_in_millis"):
        return None
    return time.monotonic() + context.get_remaining_time_in_millis() / 1000 - LAMBDA_RESERVE_S


def notify_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    if is_http_event(event):
        return _notify_http(event, context)

    tenant_id, decision_id = event.get("tenant_id"), event.get("decision_id")
    if not tenant_id or not decision_id:
        raise ValueError("tenant_id and decision_id are required")
    stage = normalise_stage(event.get("stage", "III"))
    package = generate_parent_broadcast_package(event.get("plan") or {}, stage=stage,
                                                receipt_id=event.get("receipt_id"), deadline=_deadline(context))
    notices = _summary(package)

    table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
    row = append_audit(table, tenant_id, "workflow:notify", "NOTICES_DRAFTED",
                       {"decision_id": decision_id, "approval": event.get("approval"), "notices": notices,
                        "facts_given_to_writer": package["english"]["facts"]},
                       idempotency_key=f"{event['execution']}#NOTICES_DRAFTED" if event.get("execution") else None)
    _store_notices(table, decision_id, package)
    logger.info("Notices drafted for %s (fallback used: %s)", decision_id,
                [n["fallback_used"] for n in notices])
    return {"status": "drafted", "notices": notices, "broadcast_package": package, "audit_seq": row["seq"]}


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
