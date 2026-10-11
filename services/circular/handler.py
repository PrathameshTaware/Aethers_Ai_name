"""
Circular reading API
- GET  /circulars                      public page: paste a circular, watch each step, approve the diff
- POST /circulars                      admin key: screen -> model extracts -> code validates -> candidate + diff
- POST /rulesets/{candidateId}/approve admin key: the candidate becomes the active ruleset the planner uses
- GET  /rulesets/active?tenant=demo    public: the active ruleset, its hash and where it came from

Every read of a circular (refused, failed or proposed) and every approval is appended to the audit chain.
"""

import json
import os
import re
import time
from pathlib import Path
from typing import Any, Dict, Optional

import boto3

from services.audit.store import append_audit
from services.circular import store
from services.circular.diff_engine import compute_ruleset_hash
from services.circular.extract import MAX_CIRCULAR_CHARS, propose_from_circular
from services.common.auth import require_admin
from services.common.http import ApiError, guarded, json_body, respond

TENANT_RE = re.compile(r"^[a-z0-9_-]{1,40}$")
SOURCE_ID_RE = re.compile(r"^[A-Za-z0-9 ._/()#:-]{1,80}$")
CANDIDATE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{8,32}$")
API_GATEWAY_LIMIT_S = 29
RESERVE_S = 4  # validation, two DynamoDB writes and the response
PAGE = Path(__file__).with_name("circular_page.html")
GOLD = Path(__file__).resolve().parent.parent.parent / "data" / "gold"
SAMPLES = (("Real: DoE Delhi circular No. 40 (Stage III)", "DoE-circular-40-dt-17012025", "circular_real_caqm.txt"),
           ("Sample: Stage IV circular with a relaxation", "SAMPLE-StageIV-demo", "circular_sample_stage4.txt"),
           ("Hostile: injected override", "HOSTILE-demo", "hostile_instruction.txt"))


def _table():
    return boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


def _tenant(value: Optional[str]) -> str:
    tenant = value or "demo"
    if not TENANT_RE.match(tenant):
        raise ApiError(400, "invalid_tenant", "tenant must match [a-z0-9_-]{1,40}.")
    return f"TENANT#{tenant}"


def _deadline(context: Any) -> Optional[float]:
    if context is None or not hasattr(context, "get_remaining_time_in_millis"):
        return None
    budget = min(context.get_remaining_time_in_millis() / 1000, API_GATEWAY_LIMIT_S)
    return time.monotonic() + budget - RESERVE_S


def _audit_payload(result: Dict[str, Any], candidate_id: Optional[str]) -> Dict[str, Any]:
    """What was read, by which model and prompt, what code accepted or refused and why. No personal data."""
    cand = result.get("candidate_ruleset")
    diff = result.get("diff") or {}
    return {
        "status": result["status"], "source_id": result["source_id"], "circular_sha256": result["circular_sha256"],
        "steps": result["steps"], "model": result["model"],
        "base_version": result["base_version"], "base_sha256": result["base_sha256"],
        "candidate_id": candidate_id,
        "candidate_version": cand.get("ruleset_version") if cand else None,
        "candidate_sha256": compute_ruleset_hash(cand) if cand else None,
        "accepted": [{k: c["rule"][k] for k in ("rule_id", "class_band", "condition", "action", "source_quote")}
                     for c in result["candidates"] if c["verdict"] == "accepted"],
        "rejected": [{"rule_id": c["rule"]["rule_id"], "action": c["rule"]["action"], "reasons": c["reasons"]}
                     for c in result["candidates"] if c["verdict"] == "rejected"],
        "diff": {k: [r["rule_id"] for r in diff.get(f"{k}_rules", [])] for k in ("added", "changed", "removed")},
    }


def circular_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    route = (event.get("httpMethod"), event.get("resource"))
    if route == ("GET", "/circulars"):
        return page_handler(event, context)
    if route == ("POST", "/circulars"):
        return _read_circular(event, context)
    if route == ("POST", "/rulesets/{candidateId}/approve"):
        return _approve(event, context)
    if route == ("GET", "/rulesets/active"):
        return _active(event, context)
    return respond(404, {"error": {"code": "not_found", "message": "No such route."}})


def page_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    samples = [{"label": label, "source_id": sid, "text": (GOLD / name).read_text(encoding="utf-8")}
               for label, sid, name in SAMPLES]
    # Inline JSON inside <script>: "</" must not appear, or the text could close the script element.
    html = PAGE.read_text(encoding="utf-8").replace("/*SAMPLES*/[]", json.dumps(samples).replace("</", "<\\/"))
    return {"statusCode": 200, "headers": {"Content-Type": "text/html; charset=utf-8",
                                           "Content-Security-Policy": "default-src 'self'; script-src 'unsafe-inline'; "
                                                                      "style-src 'unsafe-inline'; connect-src 'self'"},
            "body": html}


@guarded
def _read_circular(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    require_admin(event)
    body = json_body(event)
    tenant_id = _tenant(body.get("tenant"))
    text = body.get("text")
    if not isinstance(text, str) or not text.strip():
        raise ApiError(400, "missing_text", "'text' must be the circular's text.")
    if len(text) > MAX_CIRCULAR_CHARS:
        raise ApiError(413, "too_long", f"Circulars over {MAX_CIRCULAR_CHARS} characters are not accepted.")
    source_id = str(body.get("source_id") or "unlabelled-circular")
    if not SOURCE_ID_RE.match(source_id):
        raise ApiError(400, "invalid_source_id", "source_id may use letters, digits, spaces and ._/()#:- (max 80).")

    table = _table()
    active, origin = store.load_active_ruleset(table, tenant_id)
    result = propose_from_circular(text, source_id, active, deadline=_deadline(context))
    candidate_id = store.save_candidate(table, tenant_id, result) if result["status"] == "proposed" else None
    row = append_audit(table, tenant_id, "admin:circular", "CIRCULAR_READ", _audit_payload(result, candidate_id))
    return respond(200, {**result, "candidate_id": candidate_id, "active_origin": origin, "audit_seq": row["seq"]})


@guarded
def _approve(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    require_admin(event)
    candidate_id = (event.get("pathParameters") or {}).get("candidateId", "")
    if not CANDIDATE_ID_RE.match(candidate_id):
        raise ApiError(400, "invalid_candidate_id", "Candidate ID is malformed.")
    tenant_id = _tenant(json_body(event).get("tenant"))
    table = _table()
    try:
        approved = store.approve_candidate(table, tenant_id, candidate_id, approver="admin")
    except store.CandidateNotPending:
        raise ApiError(404, "candidate_not_pending", "No pending candidate with that ID (expired or already decided).")
    except store.StaleCandidate:
        raise ApiError(409, "stale_candidate", "The active ruleset changed since this was proposed. Read the circular again.")
    diff = approved["diff"]
    row = append_audit(table, tenant_id, "admin", "RULESET_APPROVED", {
        "candidate_id": candidate_id, "version": approved["ruleset"].get("ruleset_version"),
        "sha256": approved["sha256"], "previous_sha256": approved["previous_sha256"],
        "source_id": approved["source_id"], "circular_sha256": approved["circular_sha256"],
        "diff": {k: [r["rule_id"] for r in diff.get(f"{k}_rules", [])] for k in ("added", "changed", "removed")},
    })
    return respond(200, {"status": "approved", "version": approved["ruleset"].get("ruleset_version"),
                         "sha256": approved["sha256"], "audit_seq": row["seq"]})


@guarded
def _active(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    tenant_id = _tenant((event.get("queryStringParameters") or {}).get("tenant"))
    ruleset, origin = store.load_active_ruleset(_table(), tenant_id)
    return respond(200, {"origin": origin, "version": ruleset.get("ruleset_version"),
                         "sha256": compute_ruleset_hash(ruleset), "ruleset": ruleset})
