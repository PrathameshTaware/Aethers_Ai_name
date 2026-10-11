#!/usr/bin/env python3
"""
Generates a realistic sample decision brief for visitors to /today.
Runs the real planner and notice drafting locally and saves to public/snapshot/demo_brief.json.
Notice links point to a sample receipt ID that is clearly labelled.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from services.notify.drafting import generate_parent_broadcast_package
from services.planner.csv_loader import load_timetable_csv
from services.planner.planner import plan_schedule


def main():
    with open(ROOT / "data/demo/timetable_sample.csv", "r", encoding="utf-8") as f:
        timetable, _ = load_timetable_csv(f.read())
    with open(ROOT / "data/demo/forecast_stage3_sample.json", "r", encoding="utf-8") as f:
        forecast = json.load(f)
    with open(ROOT / "data/demo/ruleset_v1.json", "r", encoding="utf-8") as f:
        ruleset = json.load(f)

    decision_id = "TENANT#demo#2026-10-12#MORN"
    receipt_id = "demo-sample-receipt"

    plan = plan_schedule(
        timetable=timetable,
        forecast=forecast,
        ruleset=ruleset,
        declared_stage="III",
        decision_id=decision_id,
    )

    package = generate_parent_broadcast_package(plan, stage="III", receipt_id=receipt_id)

    brief = {
        "decision_id": decision_id,
        "status": "APPROVED_AND_NOTIFIED",
        "decided_by_role": "principal",
        "decided_at": "2026-10-11T19:32:00Z",
        "plan": plan,
        "receipt_id": receipt_id,
        "approval": None,
        "notices": {
            "english": package["english"],
            "hindi": package["hindi"],
            "teacher": package["teacher"],
        },
    }

    out_path = ROOT / "public" / "snapshot" / "demo_brief.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(brief, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote demo brief to {out_path}")


if __name__ == "__main__":
    main()
