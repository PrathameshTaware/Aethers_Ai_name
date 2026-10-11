"""
Circular-to-Rules Validator & Hostile Input Refusal Module
Code validates every candidate:
1. Schema & typed enum validation
2. Verbatim quote substring check against source circular text
3. Refusal moment: Rejects hallucinated quotes and prompt injection attacks
4. Strict mode (model-extracted rules): the quote must support each action, and no rule may relax
   outdoor activity at Stage III or IV
"""

import re
from typing import Dict, Any, List, Tuple

VALID_STAGES = {"I", "II", "III", "IV"}
VALID_CLASS_BANDS = {"primary", "middle", "secondary", "senior_secondary", "all"}
VALID_ACTIONS = {"allowed", "advisory", "restricted", "banned"}

INJECTION_PATTERNS = [
    "ignore previous instructions",
    "system override",
    "disregard all prior",
    "ignore all safety",
    "approve outdoor activities immediately"
]

# What a quote must mention before it can justify each action. Unknown action keys are refused in strict mode.
ACTION_SUPPORT = {
    "outdoor_sports": re.compile(r"\b(sports?|games|outdoor activit)", re.I),
    "outdoor_pt": re.compile(r"\b(physical education|physical training|p\.?e|p\.?t)\b", re.I),
    "hybrid_mode": re.compile(r"\b(hybrid|online)\b", re.I),
}
VALID_HYBRID = {"optional", "mandatory"}
# Strictest last. A model-proposed change may keep or tighten an action, never loosen it.
STRICTNESS = {"allowed": 0, "advisory": 1, "restricted": 2, "banned": 3, "optional": 0, "mandatory": 1}


def unsupported_actions(rule: Dict[str, Any]) -> List[str]:
    """Action keys whose value the rule's own quote does not mention."""
    quote = rule.get("source_quote", "")
    return [k for k in (rule.get("action") or {}) if k in ACTION_SUPPORT and not ACTION_SUPPORT[k].search(quote)]


def strict_errors(rule: Dict[str, Any]) -> List[str]:
    """Extra checks for rules a model proposed: the code, not the model, decides what a quote can justify."""
    errors = []
    action = rule.get("action") or {}
    unknown = sorted(k for k in action if k not in ACTION_SUPPORT)
    if unknown:
        errors.append(f"REFUSED (Unknown action): {', '.join(unknown)} is not an action Saans understands.")
    for key in unsupported_actions(rule):
        errors.append(f"REFUSED (Quote does not support action): the quote never mentions what '{key}' controls.")
    bad_values = sorted(k for k in ("outdoor_sports", "outdoor_pt") if k in action and action[k] not in VALID_ACTIONS)
    if action.get("hybrid_mode") not in (None, *VALID_HYBRID):
        bad_values.append("hybrid_mode")
    if bad_values:
        errors.append(f"REFUSED (Invalid value): {', '.join(bad_values)} has a value Saans does not accept.")
    relaxed = sorted(k for k in ("outdoor_sports", "outdoor_pt") if action.get(k) == "allowed")
    if relaxed:
        stage = (rule.get("condition") or {}).get("stage_at_least") or "any"
        errors.append(f"REFUSED (Relaxes a restriction): '{relaxed[0]}: allowed' at Stage {stage} can only be "
                      "entered by a person, never extracted by a model.")
    return errors


class ValidationError(Exception):
    pass

class HostileInstructionDetected(ValidationError):
    pass

class InventedQuoteError(ValidationError):
    pass


def sanitize_and_check_hostile_input(circular_text: str):
    """
    Scans untrusted circular text for malicious prompt injection attempts.
    Visibly raises HostileInstructionDetected if detected.
    """
    lower_text = circular_text.lower()
    for pattern in INJECTION_PATTERNS:
        if pattern in lower_text:
            raise HostileInstructionDetected(
                f"SYSTEM VISIBLY REFUSED: Prompt injection attempt detected in circular text: '{pattern}'"
            )


def validate_candidate_rule(
    rule: Dict[str, Any],
    circular_text: str,
    target_jurisdiction: str = "Delhi",
    strict: bool = False,
) -> Tuple[bool, List[str]]:
    """
    Validates a single candidate rule extracted by the LLM.
    Returns (is_valid, error_messages).
    """
    errors = []

    # 1. Rule ID check
    if not rule.get("rule_id"):
        errors.append("Missing 'rule_id'")

    # 2. Stage enum check
    cond = rule.get("condition", {})
    min_stage = cond.get("stage_at_least")
    if min_stage and min_stage not in VALID_STAGES:
        errors.append(f"Invalid stage '{min_stage}'. Must be one of: {VALID_STAGES}")

    # 3. Class band enum check
    class_bands = rule.get("class_band", [])
    for cb in class_bands:
        if cb not in VALID_CLASS_BANDS:
            errors.append(f"Invalid class band '{cb}'. Must be one of: {VALID_CLASS_BANDS}")

    # 4. Action enum check
    action = rule.get("action", {})
    for act_key in ["outdoor_sports", "outdoor_pt"]:
        val = action.get(act_key)
        if val and val not in VALID_ACTIONS:
            errors.append(f"Invalid action '{val}' for '{act_key}'. Must be one of: {VALID_ACTIONS}")

    # 5. CRITICAL: Verbatim quote substring check
    source_quote = rule.get("source_quote", "").strip()
    if not source_quote:
        errors.append("Rule must provide a verbatim 'source_quote'.")
    else:
        # Check if source_quote is an exact substring in circular_text (ignoring minor whitespace normalize)
        clean_quote = " ".join(source_quote.split())
        clean_circ = " ".join(circular_text.split())
        if clean_quote not in clean_circ:
            errors.append(
                f"REFUSED (Invented/Hallucinated Quote): Quote '{source_quote}' was NOT found in source circular text!"
            )

    if strict:
        errors.extend(strict_errors(rule))
    return (len(errors) == 0, errors)


def validate_ruleset_candidates(
    candidate_rules: List[Dict[str, Any]],
    circular_text: str,
    target_jurisdiction: str = "Delhi",
    strict: bool = False,
) -> Dict[str, Any]:
    """
    Validates an entire batch of candidate rules extracted from a circular.
    Returns:
    {
        "status": "approved" | "refused",
        "valid_rules": [...],
        "rejected_rules": [{"rule": ..., "errors": [...]}],
        "refusal_reason": None | str
    }
    """
    # First check for hostile prompt injection in circular
    try:
        sanitize_and_check_hostile_input(circular_text)
    except HostileInstructionDetected as e:
        return {
            "status": "refused",
            "refusal_type": "hostile_injection",
            "refusal_reason": str(e),
            "valid_rules": [],
            "rejected_rules": [{"rule": r, "errors": [str(e)]} for r in candidate_rules]
        }

    valid_rules = []
    rejected_rules = []

    for rule in candidate_rules:
        is_valid, errors = validate_candidate_rule(rule, circular_text, target_jurisdiction, strict)
        if is_valid:
            valid_rules.append(rule)
        else:
            rejected_rules.append({
                "rule": rule,
                "errors": errors
            })

    status = "approved" if (len(rejected_rules) == 0 and len(valid_rules) > 0) else "partial_or_refused"
    if len(rejected_rules) > 0 and len(valid_rules) == 0:
        status = "refused"

    return {
        "status": status,
        "refusal_type": "quote_mismatch" if any("Invented/Hallucinated" in str(e) for r in rejected_rules for e in r["errors"]) else None,
        "valid_rules": valid_rules,
        "rejected_rules": rejected_rules,
        "refusal_reason": rejected_rules[0]["errors"][0] if rejected_rules else None
    }
