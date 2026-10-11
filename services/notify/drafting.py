"""
Notice Drafting & Notification Dispatch Module
Supports:
1. Hindi and English notice generation for Parents and Teachers
2. WhatsApp click-to-share link builder for class teachers
3. Bedrock LLM generation with automatic static template fallback (circuit breaker)
4. Link to the public receipt page (PUBLIC_BASE_URL/verify/{receipt_id}) so anyone can check the decision

Every fact in a notice comes from the approved plan. The only link is our own receipt page; when
PUBLIC_BASE_URL or the receipt ID is missing, the notice simply has no link.
"""

import hashlib
import os
import logging
import re
import time
import urllib.parse
from typing import Dict, Any, List, Optional

from services.common import bedrock, fallback_model
from services.common.bedrock import (  # noqa: F401  (re-exported for callers and tests)
    BEDROCK_CONNECT_TIMEOUT_S, BEDROCK_MAX_ATTEMPTS, BEDROCK_MODEL_ID, BEDROCK_READ_TIMEOUT_S, DEFAULT_BUDGET_S)

logger = logging.getLogger(__name__)

# Recorded in the audit chain next to the prompt hash, so a notice traces to the exact template and settings.
# Bump the version whenever build_prompt's wording changes.
PROMPT_TEMPLATE_ID = "notice-prompt-v2"
INFERENCE_CONFIG = {"maxTokens": 300, "temperature": 0.3, "topP": 0.9}
DEFAULT_PACKAGE_BUDGET_S = DEFAULT_BUDGET_S


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

STATIC_NOTICES = {
    "english": {
        "parents_plan_b": (
            "Dear Parents, In compliance with GRAP Stage {stage} directives, outdoor sports and physical education "
            "today are replaced by indoor physical sessions (yoga, table tennis, fitness circuits) so children stay "
            "active away from polluted air.{indoor_sentence}{verify_line}"
        ),
        "parents_plan_a": (
            "Dear Parents, Because of high air pollution under GRAP Stage {stage}, some outdoor physical activity "
            "periods today have been moved to times with lower forecast pollution. No classes are cancelled.{indoor_sentence}{verify_line}"
        ),
        "teachers": (
            "Notice to Teachers: Today's timetable ({date}) has been updated under GRAP Stage {stage}. "
            "PE staff: please run the assigned indoor physical sessions in the indoor venues listed in today's plan.{teacher_sentence}{verify_line}"
        ),
        "indoor_sentence": " Indoor sessions are in rooms with an estimated {pct}% lower PM2.5 than outdoors (modelled from ventilation type, not measured).",
        "teacher_sentence": " Stricter limits applied to {count} classes with sensitive students.",
        "verify_line": " Verify this decision: {url}",
    },
    "hindi": {
        "parents_plan_b": (
            "आदरणीय अभिभावक, ग्रैप स्टेज {stage} के निर्देशों के अनुसार, "
            "आज खेल-कूद की बाहरी गतिविधियों की जगह इनडोर शारीरिक सत्र (योग, टेबल टेनिस, व्यायाम) होंगे, "
            "ताकि बच्चे प्रदूषित हवा से दूर सक्रिय रहें।{indoor_sentence}{verify_line}"
        ),
        "parents_plan_a": (
            "आदरणीय अभिभावक, ग्रैप स्टेज {stage} के तहत वायु प्रदूषण अधिक होने के कारण आज कुछ शारीरिक गतिविधि के पीरियड "
            "कम प्रदूषण वाले समय पर किए गए हैं। कोई कक्षा रद्द नहीं की गई है।{indoor_sentence}{verify_line}"
        ),
        "teachers": (
            "शिक्षकों के लिए सूचना: ग्रैप स्टेज {stage} के अनुसार आज ({date}) की समय सारिणी अपडेट की गई है। "
            "पीई शिक्षक आज की योजना में दिए गए इनडोर सत्र लें।{teacher_sentence}{verify_line}"
        ),
        "indoor_sentence": " इनडोर सत्र ऐसे कमरों में होंगे जहाँ बाहर की तुलना में अनुमानित {pct}% कम PM2.5 है (वेंटिलेशन के आधार पर अनुमान, मापा नहीं गया)।",
        "teacher_sentence": " संवेदनशील छात्रों वाली {count} कक्षाओं के लिए सख्त सीमाएँ लागू की गई हैं।",
        "verify_line": " इस निर्णय की जाँच करें: {url}",
    }
}


def verify_url(receipt_id: Optional[str], public_base_url: Optional[str] = None) -> Optional[str]:
    base = (public_base_url if public_base_url is not None else os.environ.get("PUBLIC_BASE_URL", "")).rstrip("/")
    return f"{base}/verify/{receipt_id}" if base and receipt_id else None


def plan_facts(plan: Dict[str, Any]) -> Dict[str, Any]:
    """The only facts a notice may state, all read from the approved plan."""
    pe = plan.get("pe_minutes") or {}

    # Calculate indoor_air_reduction_pct_modelled over Plan B sessions with chosen venue
    reductions = []
    for b in plan.get("plan_b", []):
        vc = b.get("venue_choice") or {}
        chosen = vc.get("chosen")
        outdoor = vc.get("outdoor_pm25_forecast")
        if chosen and outdoor and float(outdoor) > 0:
            indoor = float(chosen.get("indoor_pm25_modelled", outdoor))
            reductions.append((float(outdoor) - indoor) / float(outdoor) * 100.0)

    indoor_reduction = round(sum(reductions) / len(reductions)) if reductions else None

    # Distinct classes whose plan used a stricter (sensitive-student) limit. The planner records this per
    # flagged period in decision_trace[].sensitivity; it has no top-level "sensitivity" key.
    classes_with_stricter = len({t.get("class") for t in plan.get("decision_trace", []) if t.get("sensitivity")})

    exposure = plan.get("exposure_averted_modelled") or {}
    return {
        "periods_moved": len(plan.get("plan_a", [])),
        "periods_replaced_indoor": len(plan.get("plan_b", [])),
        "pe_minutes_scheduled": pe.get("scheduled"),
        "pe_minutes_kept_active": pe.get("kept_active"),
        "modelled_exposure_reduction_pct": plan.get("exposure_reduction_pct"),
        "indoor_air_reduction_pct_modelled": indoor_reduction,
        "classes_with_stricter_limits": classes_with_stricter,
        "exposure_averted_ug_m3_min_modelled": exposure.get("value"),
    }


ROMAN_STAGES = {"I": "1", "II": "2", "III": "3", "IV": "4"}


def _fact_lines(stage: str, plan: Dict[str, Any]) -> List[str]:
    """The facts given to the model, one per line. The output check allows only the numbers in these.

    A change that did not happen is left out rather than stated as zero: given "0 periods were moved", a live model
    wrote that all activities were moved. What is not in the prompt cannot be misstated, and a "0" in the reply is
    then an invented number.
    """
    facts = plan_facts(plan)
    lines = [f"GRAP Stage {stage} is in force in Delhi-NCR."]
    if facts["periods_moved"]:
        lines.append(f"{facts['periods_moved']} outdoor activity periods were moved to times with lower forecast pollution.")
    if facts["periods_replaced_indoor"]:
        lines.append(f"{facts['periods_replaced_indoor']} outdoor activity periods were replaced by indoor physical sessions.")
    lines.append(f"{facts['pe_minutes_kept_active']} of {facts['pe_minutes_scheduled']} scheduled PE minutes stay physically active.")
    return lines


def build_prompt(audience: str, language: str, stage: str, plan: Dict[str, Any], link: Optional[str]) -> str:
    lang_instruction = "in Hindi (Devanagari script)" if language == "hindi" else "in English"
    audience_instruction = "parents of school children" if audience == "parents" else "PE and subject teachers"
    return (
        f"You are drafting an official school safety notice {lang_instruction} for {audience_instruction}.\n\n"
        f"Facts (use only these):\n"
        + "".join(f"- {line}\n" for line in _fact_lines(stage, plan))
        + (f"- Anyone can verify this decision at: {link}\n" if link else "")
        + "\nWrite a concise, factual notice (max 3 sentences). Describe only the changes listed above, and do not "
        "mention any other kind of change. Do not add any other numbers, regulations, health claims or links."
        + (" Include the verification link exactly as given." if link else "")
    )


# --- Output check: the model proposes a notice, this code decides whether it may be sent. ---

_URL = re.compile(r"(?i)\b(?:https?://|www\.)\S+")
_NUMBER = re.compile(r"\d+(?:\.\d+)?")
_DEVANAGARI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")
MAX_NOTICE_CHARS = 700
MIN_HINDI_DEVANAGARI_SHARE = 0.7
MIN_ENGLISH_LATIN_SHARE = 0.9


def _numbers(text: str) -> List[str]:
    """Every number in the text, normalised: Devanagari digits, thousands commas and trailing zeros removed."""
    text = re.sub(r"(?<=\d),(?=\d{3})", "", text.translate(_DEVANAGARI_DIGITS))
    return [n.rstrip("0").rstrip(".") if "." in n else (n.lstrip("0") or "0") for n in _NUMBER.findall(text)]


def check_notice(text: str, stage: str, plan: Dict[str, Any], link: Optional[str], language: str) -> List[str]:
    """Reasons to reject a model-written notice; empty when it may be sent.

    Only numbers from the facts the model was given, only our own receipt link (which must be present when
    there is one), the requested script and a bounded length. Anything else falls back to the static template.
    """
    reasons = []
    urls = [u.rstrip(".,;:!?)'\"।") for u in _URL.findall(text)]
    if any(u != link for u in urls):
        reasons.append("foreign_link")
    if link and link not in urls:
        reasons.append("missing_receipt_link")

    body = _URL.sub(" ", text)
    allowed = set(_numbers(" ".join(_fact_lines(stage, plan))))
    if stage in ROMAN_STAGES:
        allowed.add(ROMAN_STAGES[stage])  # "Stage 3" for "Stage III"
    invented = sorted(set(_numbers(body)) - allowed)
    if invented:
        reasons.append("invented_number:" + ",".join(invented))

    letters = [c for c in body if c.isalpha()]
    if letters:
        devanagari = sum("ऀ" <= c <= "ॿ" for c in letters) / len(letters)
        latin = sum(c.isascii() for c in letters) / len(letters)
        if language == "hindi" and devanagari < MIN_HINDI_DEVANAGARI_SHARE:
            reasons.append("wrong_script")
        elif language != "hindi" and latin < MIN_ENGLISH_LATIN_SHARE:
            reasons.append("wrong_script")
    if len(text) > MAX_NOTICE_CHARS:
        reasons.append("too_long")
    return reasons


def _invoke_bedrock(prompt: str, deadline: Optional[float] = None) -> Optional[str]:
    """Returns the model's notice text, or None on any failure (triggering the static fallback)."""
    reply = bedrock.converse(prompt, INFERENCE_CONFIG, deadline)
    text = reply["text"]
    if text and len(text) > 20:
        logger.info("Bedrock %s generated notice (len=%d, %d ms)", BEDROCK_MODEL_ID, len(text), reply["latency_ms"])
        return text
    logger.warning("No usable Bedrock notice (%s)", reply["error"] or "too short")
    return None


def _invoke_model(prompt: str, deadline: Optional[float] = None, skip_primary: bool = False) -> Optional[Dict[str, Any]]:
    """Bedrock first; the labelled fallback model only if Bedrock gave nothing. None: use the static template.

    Returns {"text", "model_provider": "bedrock"|"fallback", "model_id", "primary_error"}.
    """
    if not skip_primary:
        text = _invoke_bedrock(prompt, deadline)
        if text:
            return {"text": text, "model_provider": "bedrock", "model_id": BEDROCK_MODEL_ID, "primary_error": None}
    if not fallback_model.configured():
        return None
    reply = fallback_model.complete(prompt, INFERENCE_CONFIG,
                                    deadline if deadline is not None else time.monotonic() + DEFAULT_BUDGET_S,
                                    BEDROCK_READ_TIMEOUT_S)
    if reply["text"] and len(reply["text"]) > 20:
        logger.info("Fallback model %s generated notice (Bedrock unavailable)", fallback_model.label())
        return {"text": reply["text"], "model_provider": "fallback", "model_id": fallback_model.label(),
                "primary_error": "BedrockUnavailable"}
    logger.warning("No usable fallback notice (%s); using static template", reply["error"] or "too short")
    return None


def draft_notice(
    plan: Dict[str, Any],
    audience: str = "parents", # "parents" or "teachers"
    language: str = "english", # "english" or "hindi"
    stage: str = "III",
    date_str: Optional[str] = None,
    receipt_id: Optional[str] = None,
    public_base_url: Optional[str] = None,
    force_fallback: bool = False,
    deadline: Optional[float] = None,
    skip_primary: bool = False,
) -> Dict[str, Any]:
    """
    Drafts an official safety notice.
    Attempts Bedrock (Nova Lite) generation first. If Bedrock fails (AccessDeniedException, throttle, timeout),
    the labelled fallback model is tried when configured. If no model answers, or the model's text fails
    check_notice, falls back to pre-validated static bilingual templates (circuit breaker pattern).
    `deadline` is a time.monotonic() value no model call may run past.
    """
    link = verify_url(receipt_id, public_base_url)
    if date_str is None:  # the decision's own date, e.g. TENANT#demo#2026-10-12#MORN
        m = re.search(r"#(\d{4}-\d{2}-\d{2})#", plan.get("decision_id", ""))
        date_str = m.group(1) if m else "today"
    has_swaps = len(plan.get("plan_a", [])) > 0
    model_used = "STATIC_TEMPLATE_FALLBACK"
    notice_text = None
    prompt_sha256 = None
    template_id = None
    fallback_reason = "forced" if force_fallback else None
    rejected_reasons: List[str] = []
    rejected_text_sha256 = None
    model = None

    # 1. Attempt model generation (unless force_fallback is set); the model proposes, check_notice decides.
    if not force_fallback:
        prompt = build_prompt(audience, language, stage, plan, link)
        model = _invoke_model(prompt, deadline, skip_primary)
        if model is None:
            fallback_reason = "model_unavailable"
        else:
            prompt_sha256 = sha256_text(prompt)
            rejected_reasons = check_notice(model["text"], stage, plan, link, language)
            if rejected_reasons:
                fallback_reason = "output_rejected"
                rejected_text_sha256 = sha256_text(model["text"])
                logger.warning("Model notice rejected (%s); falling back to static template", rejected_reasons)
            else:
                notice_text = model["text"]
                model_used = (f"Bedrock-{model['model_id']}" if model["model_provider"] == "bedrock"
                              else f"Fallback-{model['model_id']}")

    # 2. Static template fallback (circuit breaker)
    facts = plan_facts(plan)
    fallback_used = notice_text is None
    if fallback_used:
        lang_dict = STATIC_NOTICES.get(language, STATIC_NOTICES["english"])
        verify_line = lang_dict["verify_line"].format(url=link) if link else ""

        pct = facts["indoor_air_reduction_pct_modelled"]
        count = facts["classes_with_stricter_limits"]
        indoor_sentence = (lang_dict["indoor_sentence"].format(pct=pct)) if pct is not None else ""
        teacher_sentence = (lang_dict["teacher_sentence"].format(count=count)) if count > 0 else ""

        if audience == "parents":
            key = "parents_plan_a" if has_swaps else "parents_plan_b"
            notice_text = lang_dict[key].format(stage=stage, indoor_sentence=indoor_sentence, verify_line=verify_line)
        else:
            key = "teachers"
            notice_text = lang_dict[key].format(stage=stage, date=date_str, teacher_sentence=teacher_sentence, verify_line=verify_line)
        template_id = f"static:{language if language in STATIC_NOTICES else 'english'}:{key}"

    # Build WhatsApp Click-to-Share link
    encoded_text = urllib.parse.quote(notice_text)
    whatsapp_share_url = f"https://api.whatsapp.com/send?text={encoded_text}"

    return {
        "audience": audience,
        "language": language,
        "notice_text": notice_text,
        "whatsapp_click_to_share_url": whatsapp_share_url,
        "verify_url": link,
        "facts": facts,
        "model_used": model_used,
        "fallback_used": fallback_used,
        "model_id": None if fallback_used else model["model_id"],
        # Which model answered: "bedrock" (primary) or "fallback" (only when Bedrock failed). None: template.
        "model_provider": None if fallback_used else model["model_provider"],
        # Set whenever Bedrock was skipped or failed, even if the text then came from the template.
        "primary_error": model["primary_error"] if model else (None if force_fallback else "BedrockUnavailable"),
        "template_id": template_id,
        "fallback_reason": fallback_reason,
        "rejected_reasons": rejected_reasons,
        "rejected_text_sha256": rejected_text_sha256,
        # Set whenever the model replied, so a sent or rejected model text traces to its exact prompt.
        "prompt_sha256": prompt_sha256,
        "prompt_template_id": PROMPT_TEMPLATE_ID if prompt_sha256 else None,
        "inference_config": dict(INFERENCE_CONFIG) if prompt_sha256 else None,
        "text_sha256": sha256_text(notice_text),
    }


def generate_parent_broadcast_package(
    plan: Dict[str, Any],
    stage: str = "III",
    receipt_id: Optional[str] = None,
    deadline: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Creates complete bilingual notice package for WhatsApp distribution.
    All three notices share one deadline. Once Bedrock fails the rest go straight to the fallback model, and once
    no model answers the rest go straight to the template.
    """
    if deadline is None:
        deadline = time.monotonic() + DEFAULT_PACKAGE_BUDGET_S
    notices = []
    skip_primary = False
    for audience, language in (("parents", "english"), ("parents", "hindi"), ("teachers", "english")):
        notice = draft_notice(plan, audience=audience, language=language, stage=stage, receipt_id=receipt_id,
                              deadline=deadline, skip_primary=skip_primary)
        if notice["primary_error"]:
            skip_primary = True  # don't wait on Bedrock again in this run
        if notice["fallback_reason"] == "model_unavailable":
            deadline = 0.0  # circuit open: no model answered
        notices.append(notice)
    eng_notice, hin_notice, teacher_notice = notices

    return {
        "english": eng_notice,
        "hindi": hin_notice,
        "teacher": teacher_notice,
        "whatsapp_url_english": eng_notice["whatsapp_click_to_share_url"],
        "whatsapp_url_hindi": hin_notice["whatsapp_click_to_share_url"]
    }
