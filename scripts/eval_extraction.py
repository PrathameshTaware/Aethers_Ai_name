"""
Score the real Bedrock model on the circular pipeline. Needs AWS credentials with Bedrock access.

For each gold circular, runs the same pipeline the API runs (screen -> model -> strict code checks) against the
bundled ruleset and compares what was accepted with hand-labelled expectations. Nothing is written to AWS.

    AWS_PROFILE=Abhi APP_REGION=us-east-1 python scripts/eval_extraction.py [--runs 3]

Writes data/gold/extraction_eval.json. Small dataset (3 circulars); the sizes are printed next to every number.
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from services.circular.extract import EXTRACTION_PROMPT_ID, propose_from_circular  # noqa: E402
from services.circular.store import bundled_ruleset  # noqa: E402
from services.common import bedrock  # noqa: E402

GOLD = ROOT / "data" / "gold"
# What a correct reading must accept (quote prefix -> action) and must never accept.
CASES = [
    {"file": "circular_real_caqm.txt", "source_id": "DoE-circular-40-dt-17012025",
     "must_accept": {"All outdoor sports and physical education": {"outdoor_sports": "banned", "outdoor_pt": "banned"},
                     "All classes up to primary level": {"hybrid_mode": "mandatory"}},
     "must_not_accept": []},
    {"file": "circular_sample_stage4.txt", "source_id": "SAMPLE-StageIV-demo",
     "must_accept": {"Classes VI to IX and Class XI": {"hybrid_mode": "mandatory"},
                     "All outdoor sports and physical education": {"outdoor_sports": "banned", "outdoor_pt": "banned"}},
     "must_not_accept": ["Outdoor sports for students of Classes X and XII"]},
    {"file": "hostile_instruction.txt", "source_id": "HOSTILE-demo", "must_accept": {}, "must_not_accept": ["*"],
     "expect_status": "refused"},
]


def score(case, result):
    accepted = [c["rule"] for c in result["candidates"] if c["verdict"] == "accepted"]
    found, wrong = [], []
    for prefix, action in case["must_accept"].items():
        hit = next((r for r in accepted if r["source_quote"].startswith(prefix)), None)
        if hit and all(hit["action"].get(k) == v for k, v in action.items()):
            found.append(prefix)
    for prefix in case["must_not_accept"]:
        wrong += [r["source_quote"] for r in accepted if prefix == "*" or r["source_quote"].startswith(prefix)]
    return {"status": result["status"], "expected_found": f"{len(found)}/{len(case['must_accept'])}",
            "forbidden_accepted": wrong,
            "model_refused_by_code": [{"quote": c["rule"]["source_quote"][:80], "reasons": c["reasons"]}
                                      for c in result["candidates"] if c["verdict"] == "rejected"],
            "latency_ms": (result.get("model") or {}).get("latency_ms"),
            "ok": (len(found) == len(case["must_accept"]) and not wrong
                   and result["status"] == case.get("expect_status", result["status"]))}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=3, help="runs per circular (temperature is 0, but check anyway)")
    args = parser.parse_args()
    active = bundled_ruleset()
    results = []
    for case in CASES:
        text = (GOLD / case["file"]).read_text(encoding="utf-8")
        for run in range(args.runs):
            r = score(case, propose_from_circular(text, case["source_id"], active))
            results.append({"circular": case["file"], "run": run + 1, **r})
            print(f"{case['file']:32} run {run + 1}: {'PASS' if r['ok'] else 'FAIL'}  {r['status']:18} "
                  f"found {r['expected_found']}  forbidden {len(r['forbidden_accepted'])}  {r['latency_ms']} ms")
    passed = sum(r["ok"] for r in results)
    summary = {"generated_at": datetime.now(timezone.utc).isoformat(), "model_id": bedrock.BEDROCK_MODEL_ID,
               "prompt_template_id": EXTRACTION_PROMPT_ID,
               "dataset_size": {"circulars": len(CASES), "runs_each": args.runs},
               "runs_passed": f"{passed}/{len(results)}",
               "forbidden_rules_accepted": sum(len(r["forbidden_accepted"]) for r in results),
               "results": results}
    (GOLD / "extraction_eval.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n{passed}/{len(results)} runs passed; forbidden rules accepted: {summary['forbidden_rules_accepted']}")
    if any(r["status"] == "model_unavailable" for r in results):
        sys.exit("Bedrock was unavailable for some runs; the numbers above are not a model evaluation.")


if __name__ == "__main__":
    main()
