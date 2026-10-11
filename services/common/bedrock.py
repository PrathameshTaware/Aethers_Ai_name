"""
One Bedrock Converse call with short timeouts, a deadline and one retry for transient errors.

Used by notice drafting and circular extraction. It never raises: a failure comes back as an error code, so each
caller decides its own fallback (the static notice template, or "nothing changes" for a circular).
"""

import logging
import os
import time
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "amazon.nova-lite-v1:0")
BEDROCK_REGION = os.environ.get("APP_REGION", "ap-south-1")

# Lambdas time out at 30 s (API Gateway at 29 s), so a call must give up well before that and leave time for the
# fallback and the audit write. boto3's default 60 s read timeout did not.
BEDROCK_CONNECT_TIMEOUT_S = 2
BEDROCK_READ_TIMEOUT_S = 8
BEDROCK_MAX_ATTEMPTS = 2  # one retry, and only for transient errors
MIN_ATTEMPT_BUDGET_S = 3  # not worth starting a call with less time than this left
DEFAULT_BUDGET_S = 20
TRANSIENT_ERRORS = {"ReadTimeoutError", "ConnectTimeoutError", "EndpointConnectionError", "ConnectionClosedError",
                    "ThrottlingException", "ServiceUnavailableException", "InternalServerException",
                    "ModelTimeoutException", "ModelNotReadyException"}


def error_code(e: Exception) -> str:
    return (getattr(e, "response", None) or {}).get("Error", {}).get("Code") or type(e).__name__


def converse(prompt: str, inference_config: Dict[str, Any], deadline: Optional[float] = None,
             read_timeout: float = BEDROCK_READ_TIMEOUT_S, system: Optional[str] = None) -> Dict[str, Any]:
    """Returns {"text", "error", "latency_ms", "attempts"}; exactly one of text and error is set.

    Each attempt is capped at `read_timeout` and at the time left before `deadline` (a time.monotonic() value).
    """
    started = time.monotonic()
    result: Dict[str, Any] = {"text": None, "error": None, "latency_ms": 0, "attempts": 0}

    def done(**kw):
        result.update(kw, latency_ms=round((time.monotonic() - started) * 1000))
        return result

    try:
        import boto3
        from botocore.config import Config
    except ImportError:
        return done(error="BotoUnavailable")

    if deadline is None:
        deadline = started + DEFAULT_BUDGET_S
    for attempt in range(1, BEDROCK_MAX_ATTEMPTS + 1):
        remaining = deadline - time.monotonic()
        if remaining < MIN_ATTEMPT_BUDGET_S:
            logger.warning("No time left for a Bedrock call (%.1fs)", remaining)
            return done(error=result["error"] or "DeadlineReached")
        result["attempts"] = attempt
        request = {"modelId": BEDROCK_MODEL_ID, "inferenceConfig": inference_config,
                   "messages": [{"role": "user", "content": [{"text": prompt}]}]}
        if system:
            request["system"] = [{"text": system}]
        try:
            client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION, config=Config(
                connect_timeout=BEDROCK_CONNECT_TIMEOUT_S,
                read_timeout=min(read_timeout, remaining - BEDROCK_CONNECT_TIMEOUT_S),
                retries={"total_max_attempts": 1}))  # retries are ours, so they respect the deadline
            # Converse has one request shape for Nova, Claude and the other Bedrock text models.
            response = client.converse(**request)
        except Exception as e:
            code = error_code(e)
            if code in TRANSIENT_ERRORS and attempt < BEDROCK_MAX_ATTEMPTS:
                logger.warning("Bedrock attempt %d failed (%s); retrying", attempt, code)
                result["error"] = code
                continue
            logger.warning("Bedrock invocation failed (%s: %s)", code, str(e)[:200])
            return done(error=code)
        content = response.get("output", {}).get("message", {}).get("content") or [{}]
        text = (content[0].get("text") or "").strip()
        return done(text=text, error=None) if text else done(error="EmptyResponse")
    return done()
