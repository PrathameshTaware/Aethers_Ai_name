"""
POST /runs: start a decision run over HTTP (admin key), so a demo does not need someone at a CLI.

It only forwards to the Trigger Lambda's own logic, so every guarantee there still holds: one
execution per tenant, date and session, with a duplicate reported honestly instead of re-run.
Body (all optional): {"tenant_id", "date", "session", "stage", "forecast_source", "rerun_label"}.
Runs started here default to the labelled replay forecast; pass "forecast_source": "live" for the real one.
"""

from typing import Any, Dict

from services.common.auth import require_admin
from services.common.http import ApiError, guarded, json_body, respond
from services.workflow.trigger import trigger_handler

RUN_FIELDS = ("tenant_id", "date", "session", "stage", "forecast_source", "rerun_label")


@guarded
def runs_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    require_admin(event)
    body = json_body(event)
    run = {k: body[k] for k in RUN_FIELDS if body.get(k) is not None}
    run.setdefault("forecast_source", "replay")
    try:
        result = trigger_handler(run, context)
    except ValueError as e:
        raise ApiError(400, "invalid_input", str(e))
    # 202: a new execution is running. 200: this decision already has one (nothing was started).
    return respond(202 if result["status"] == "started" else 200, result)
