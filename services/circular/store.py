"""
Active ruleset and pending candidates, per tenant, in the single table.

  PK=<tenant>  SK=RULESET#ACTIVE        the ruleset the planner uses (absent: the bundled data/demo/ruleset_v1.json)
  PK=<tenant>  SK=RULESET#CAND#<id>     a proposal from a circular, waiting for a person (expires after 7 days)

A candidate records the hash of the ruleset it was built on, so approving it after the active ruleset changed is
refused instead of silently overwriting the newer rules.
"""

import json
import os
import secrets
import time
from typing import Any, Dict, Optional, Tuple

from botocore.exceptions import ClientError

from services.circular.diff_engine import compute_ruleset_hash

BUNDLED_RULESET = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                               "data", "demo", "ruleset_v1.json")
CANDIDATE_TTL_S = 7 * 24 * 3600
ACTIVE_SK = "RULESET#ACTIVE"


class StaleCandidate(Exception):
    pass


class CandidateNotPending(Exception):
    pass


def bundled_ruleset() -> Dict[str, Any]:
    with open(BUNDLED_RULESET, "r", encoding="utf-8") as f:
        return json.load(f)


def load_active_ruleset(table, tenant_id: str) -> Tuple[Dict[str, Any], str]:
    """(ruleset, origin): origin is "approved" for a ruleset a person approved, else "bundled"."""
    if table is not None:
        item = table.get_item(Key={"PK": tenant_id, "SK": ACTIVE_SK}).get("Item")
        if item:
            return json.loads(item["ruleset_json"]), "approved"
    return bundled_ruleset(), "bundled"


def save_candidate(table, tenant_id: str, proposal: Dict[str, Any]) -> str:
    candidate_id = secrets.token_urlsafe(9)
    table.put_item(Item={
        "PK": tenant_id, "SK": f"RULESET#CAND#{candidate_id}", "status": "pending",
        "ruleset_json": json.dumps(proposal["candidate_ruleset"], sort_keys=True),
        "diff_json": json.dumps(proposal["diff"], sort_keys=True, default=str),
        "base_sha256": proposal["base_sha256"], "circular_sha256": proposal["circular_sha256"],
        "source_id": proposal["source_id"], "created_at": int(time.time()),
        "ttl": int(time.time()) + CANDIDATE_TTL_S,
    }, ConditionExpression="attribute_not_exists(SK)")
    return candidate_id


def get_candidate(table, tenant_id: str, candidate_id: str) -> Optional[Dict[str, Any]]:
    return table.get_item(Key={"PK": tenant_id, "SK": f"RULESET#CAND#{candidate_id}"}).get("Item")


def approve_candidate(table, tenant_id: str, candidate_id: str, approver: str) -> Dict[str, Any]:
    """Makes the candidate the active ruleset. Raises CandidateNotPending or StaleCandidate."""
    cand = get_candidate(table, tenant_id, candidate_id)
    if not cand or cand.get("status") != "pending":
        raise CandidateNotPending(candidate_id)
    current, _ = load_active_ruleset(table, tenant_id)
    current_sha = compute_ruleset_hash(current)
    if current_sha != cand["base_sha256"]:
        raise StaleCandidate(candidate_id)

    ruleset = json.loads(cand["ruleset_json"])
    new_sha = compute_ruleset_hash(ruleset)
    active_key = {"PK": tenant_id, "SK": ACTIVE_SK}
    # Both writes or neither; the active ruleset must still be the one the candidate was built on.
    put_active = {"TableName": table.name, "Item": {
        **active_key, "ruleset_json": cand["ruleset_json"], "sha256": new_sha,
        "version": ruleset.get("ruleset_version"), "candidate_id": candidate_id, "approved_by": approver,
        "approved_at": int(time.time())}}
    exists = table.get_item(Key=active_key).get("Item") is not None
    if exists:
        put_active["ConditionExpression"] = "sha256 = :base"
        put_active["ExpressionAttributeValues"] = {":base": current_sha}
    else:
        put_active["ConditionExpression"] = "attribute_not_exists(SK)"
    try:
        table.meta.client.transact_write_items(TransactItems=[
            {"Put": put_active},
            {"Update": {"TableName": table.name, "Key": {"PK": tenant_id, "SK": f"RULESET#CAND#{candidate_id}"},
                        "UpdateExpression": "SET #s = :approved",
                        "ConditionExpression": "#s = :pending",
                        "ExpressionAttributeNames": {"#s": "status"},
                        "ExpressionAttributeValues": {":approved": "approved", ":pending": "pending"}}},
        ])
    except ClientError as e:
        if e.response["Error"]["Code"] == "TransactionCanceledException":
            raise StaleCandidate(candidate_id)
        raise
    return {"ruleset": ruleset, "sha256": new_sha, "previous_sha256": current_sha,
            "diff": json.loads(cand["diff_json"]), "source_id": cand.get("source_id"),
            "circular_sha256": cand.get("circular_sha256")}
