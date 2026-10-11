"""
The fallback model: used only when Bedrock fails, and always recorded as such (model_provider="fallback").

Groq's OpenAI-compatible chat API over plain HTTPS (no extra dependency in the Lambda bundle). Disabled unless
FALLBACK_MODEL_API_KEY is set. Like bedrock.converse it never raises: failures come back as an error code.
"""

import json
import logging
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

FALLBACK_MODEL_ID = os.environ.get("FALLBACK_MODEL_ID", "llama-3.3-70b-versatile")
FALLBACK_URL = os.environ.get("FALLBACK_MODEL_URL", "https://api.groq.com/openai/v1/chat/completions")
FALLBACK_PROVIDER = "groq"
MIN_BUDGET_S = 3


def label() -> str:
    """How the fallback appears in provenance, e.g. 'groq/llama-3.3-70b-versatile'."""
    return f"{FALLBACK_PROVIDER}/{FALLBACK_MODEL_ID}"


def configured() -> bool:
    return bool(os.environ.get("FALLBACK_MODEL_API_KEY"))


def complete(prompt: str, inference_config: Dict[str, Any], deadline: float, read_timeout: float,
             system: Optional[str] = None) -> Dict[str, Any]:
    """Returns {"text", "error", "latency_ms"}; exactly one of text and error is set."""
    started = time.monotonic()

    def done(**kw):
        return {"text": None, "error": None, **kw, "latency_ms": round((time.monotonic() - started) * 1000)}

    key = os.environ.get("FALLBACK_MODEL_API_KEY")
    if not key:
        return done(error="FallbackNotConfigured")
    remaining = deadline - time.monotonic()
    if remaining < MIN_BUDGET_S:
        return done(error="DeadlineReached")

    messages = ([{"role": "system", "content": system}] if system else []) + [{"role": "user", "content": prompt}]
    body = {"model": FALLBACK_MODEL_ID, "messages": messages,
            "temperature": inference_config.get("temperature", 0.3),
            "max_tokens": inference_config.get("maxTokens", 300)}
    if "topP" in inference_config:
        body["top_p"] = inference_config["topP"]
    request = urllib.request.Request(FALLBACK_URL, data=json.dumps(body).encode("utf-8"), method="POST", headers={
        "Authorization": f"Bearer {key}", "Content-Type": "application/json",
        "User-Agent": "saans/1.0"})  # the default Python agent is refused by the provider's edge
    try:
        with urllib.request.urlopen(request, timeout=min(read_timeout, remaining)) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        logger.warning("Fallback model HTTP %s", e.code)
        return done(error=f"HTTP{e.code}")
    except Exception as e:  # timeout, DNS, TLS, bad JSON
        logger.warning("Fallback model failed (%s)", type(e).__name__)
        return done(error=type(e).__name__)
    choices = data.get("choices") or [{}]
    text = ((choices[0].get("message") or {}).get("content") or "").strip()
    return done(text=text) if text else done(error="EmptyResponse")
