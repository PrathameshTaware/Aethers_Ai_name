"""
One entry point for model calls: Bedrock first, always. The fallback model is tried only if Bedrock fails and
there is time left, and the result says which one answered so provenance is never guessed.
"""

import time
from typing import Any, Dict, Optional

from services.common import bedrock, fallback_model


def generate(prompt: str, inference_config: Dict[str, Any], deadline: Optional[float] = None,
             read_timeout: float = bedrock.BEDROCK_READ_TIMEOUT_S, system: Optional[str] = None,
             skip_primary: bool = False) -> Dict[str, Any]:
    """bedrock.converse's result plus {"model_provider": "bedrock"|"fallback"|None, "model_id", "primary_error"}.

    `skip_primary` is for a caller that already saw Bedrock fail in this run (no point waiting on it again).
    """
    if deadline is None:
        deadline = time.monotonic() + bedrock.DEFAULT_BUDGET_S

    primary_error = "SkippedAfterFailure"
    if not skip_primary:
        reply = bedrock.converse(prompt, inference_config, deadline, read_timeout=read_timeout, system=system)
        if reply["text"]:
            return {**reply, "model_provider": "bedrock", "model_id": bedrock.BEDROCK_MODEL_ID, "primary_error": None}
        primary_error = reply["error"]

    if fallback_model.configured():
        fb = fallback_model.complete(prompt, inference_config, deadline, read_timeout, system=system)
        if fb["text"]:
            return {**fb, "attempts": 1, "model_provider": "fallback", "model_id": fallback_model.label(),
                    "primary_error": primary_error}
        return {**fb, "attempts": 1, "model_provider": None, "model_id": None, "primary_error": primary_error,
                "error": f"{primary_error}; fallback {fb['error']}"}
    return {"text": None, "error": primary_error, "latency_ms": 0, "attempts": 0,
            "model_provider": None, "model_id": None, "primary_error": primary_error}
