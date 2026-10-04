#!/usr/bin/env python3
"""Averis by Mahi — deterministic synthetic healthcare data generator.

Standard library only. Output is for portfolio/demo use and contains no real
patient information.
"""

from __future__ import annotations

import argparse
import json
import random
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


BASE_DATE = date(2026, 10, 4)

PROVIDERS = [
    ("Dr. Maya Chen", "Cardiology", "North Tower"),
    ("Dr. Arjun Rao", "General Medicine", "Central Campus"),
    ("Dr. Sofia Martinez", "Neurology", "Riverside"),
    ("Dr. Ethan Lee", "Pediatrics", "North Tower"),
    ("Dr. Priya Nair", "Orthopedics", "Central Campus"),
    ("Dr. Daniel Brooks", "Oncology", "Riverside"),
    ("Dr. Kavya Singh", "Dermatology", "North Tower"),
    ("Dr. Noah Carter", "Radiology", "Central Campus"),
]

NAMES = [
    "Aarav Sharma", "Maya Patel", "Noah Williams", "Olivia Chen", "Arjun Rao",
    "Sophia Bennett", "Ethan Brooks", "Isabella Martin", "Kabir Mehta", "Amelia Jones",
    "Rohan Kapoor", "Emma Davis", "Vihaan Reddy", "Mia Wilson", "Aditya Nair",
    "Ava Thomas", "Reyansh Gupta", "Liam Anderson", "Anaya Singh", "Lucas Brown",
]

CONDITIONS = [
    "Hypertension", "Type 2 Diabetes", "Asthma", "Arrhythmia",
    "Migraine", "Arthritis", "Recovery", "Routine review",
]
DEPARTMENTS = ["Cardiology", "General Medicine", "Neurology", "Pediatrics", "Orthopedics"]


def day(offset: int) -> str:
    return (BASE_DATE + timedelta(days=offset)).isoformat()


def timestamp(offset_minutes: int = 0) -> str:
    anchor = datetime(2026, 10, 4, 10, 45, tzinfo=timezone.utc)
    return (anchor + timedelta(minutes=offset_minutes)).isoformat()


def build(seed: int, patient_count: int, appointment_count: int) -> dict:
    rng = random.Random(seed)

    providers = []
    for idx, (name, specialty, location) in enumerate(PROVIDERS):
        providers.append(
            {
                "id": f"PR-{100 + idx}",
                "name": name,
                "specialty": specialty,
                "location": location,
                "daily_capacity": rng.randint(10, 18),
                "today_booked": rng.randint(4, 14),
                "utilization": rng.randint(48, 94),
                "active": True,
            }
        )

    patients = []
    for idx in range(patient_count):
        provider = providers[idx % len(providers)]
        patients.append(
            {
                "id": f"AV-{26000 + idx}",
                "name": NAMES[idx % len(NAMES)] if idx < len(NAMES) else f"Mahi Patient {idx:03d}",
                "age": rng.randint(21, 81),
                "condition": CONDITIONS[idx % len(CONDITIONS)],
                "department": provider["specialty"],
                "provider_id": provider["id"],
                "status": ["Active", "Stable", "Needs Attention", "Active"][idx % 4],
                "risk": ["Low", "Low", "Medium", "High"][idx % 4],
                "attendance": rng.randint(78, 99),
                "last_visit": day(-rng.randint(2, 42)),
                "next_visit": day(rng.randint(1, 18)),
            }
        )

    appointments = []
    visit_types = ["Consultation", "Follow-up", "Screening", "Review", "Telehealth"]
    slots = ["08:30", "09:15", "10:00", "10:45", "11:30", "12:15", "13:30", "14:15", "15:00"]
    for idx in range(appointment_count):
        patient = patients[idx % len(patients)]
        provider = providers[idx % len(providers)]
        offset = rng.randint(-4, 14)
        if offset < 0:
            status = "No Show" if idx % 11 == 0 else "Completed"
        else:
            status = "Confirmed" if idx % 3 == 0 else "Scheduled"
        appointments.append(
            {
                "id": f"AP-{4300 + idx}",
                "date": day(offset),
                "time": slots[idx % len(slots)],
                "patient_id": patient["id"],
                "provider_id": provider["id"],
                "type": visit_types[idx % len(visit_types)],
                "status": status,
            }
        )

    encounters = [
        {
            "id": f"ENC-{8000 + idx}",
            "patient_id": patients[idx % len(patients)]["id"],
            "provider_id": providers[idx % len(providers)]["id"],
            "type": ["OPD", "Emergency", "Follow-up"][idx % 3],
            "started_at": timestamp(-idx * 7),
        }
        for idx in range(min(patient_count, 120))
    ]

    care_items = [
        {
            "id": f"CH-{9000 + idx}",
            "patient_id": patients[idx % len(patients)]["id"],
            "issue": ["Overdue follow-up", "Referral pending", "Care-plan review", "Result query", "Discharge coordination"][idx % 5],
            "stage": ["New", "Assigned", "In Progress", "Waiting", "Resolved"][idx % 5],
            "priority": ["Normal", "Normal", "High", "Urgent"][idx % 4],
            "age_minutes": rng.randint(10, 240),
        }
        for idx in range(max(25, min(patient_count, 150)))
    ]

    tasks = [
        {
            "id": f"TK-{7000 + idx}",
            "title": ["Call patient about lab result", "Review discharge plan", "Verify insurance documents", "Confirm specialist referral", "Medication reconciliation"][idx % 5],
            "patient_id": patients[idx % len(patients)]["id"],
            "owner": ["Mahi", "Care Team", "Front Desk", "Clinical Lead"][idx % 4],
            "priority": ["Low", "Medium", "High", "Urgent"][idx % 4],
            "status": ["To Do", "To Do", "In Progress", "Completed"][idx % 4],
            "due": day(rng.randint(-2, 9)),
        }
        for idx in range(max(32, min(patient_count, 180)))
    ]

    beds = [
        {
            "id": f"{'ABCD'[idx % 4]}-{101 + idx}",
            "ward": ["ICU", "General", "Cardiology", "Pediatrics"][idx % 4],
            "status": ["Occupied", "Occupied", "Available", "Cleaning", "Occupied", "Available", "Isolation"][idx % 7],
            "patient_id": patients[idx % len(patients)]["id"] if idx % 7 in (0, 1, 4, 6) else None,
        }
        for idx in range(max(40, min(patient_count, 220)))
    ]

    inventory = [
        {"name": "Metformin 500 mg", "category": "Oral medication", "stock": 84, "reorder": 30, "unit": "packs"},
        {"name": "Insulin Glargine", "category": "Insulin", "stock": 18, "reorder": 24, "unit": "vials"},
        {"name": "Amoxicillin 500 mg", "category": "Antibiotic", "stock": 62, "reorder": 20, "unit": "packs"},
        {"name": "Paracetamol 650 mg", "category": "Analgesic", "stock": 120, "reorder": 40, "unit": "packs"},
        {"name": "Normal Saline 500 ml", "category": "IV fluid", "stock": 31, "reorder": 28, "unit": "bags"},
    ]

    lab_orders = [
        {
            "id": f"LAB-{5000 + idx}",
            "patient_id": patients[idx % len(patients)]["id"],
            "test": ["CBC", "HbA1c", "Troponin I", "Lipid profile"][idx % 4],
            "priority": ["Routine", "Routine", "High", "Critical"][idx % 4],
            "status": "Resulted" if idx % 3 else "Awaiting review",
        }
        for idx in range(max(36, min(patient_count, 140)))
    ]

    invoices = [
        {
            "id": f"INV-{2400 + idx}",
            "patient_id": patients[idx % len(patients)]["id"],
            "amount": [24800, 12400, 48600, 8900][idx % 4],
            "payer": ["Insurance", "Self pay", "Insurance", "Self pay"][idx % 4],
            "status": ["Pending", "Paid", "Review", "Paid"][idx % 4],
        }
        for idx in range(max(20, min(patient_count, 100)))
    ]

    events = [
        {"type": "care.updated", "level": "info", "occurred_at": timestamp(0)},
        {"type": "lab.critical", "level": "critical", "occurred_at": timestamp(-6)},
        {"type": "bed.status_changed", "level": "warning", "occurred_at": timestamp(-10)},
        {"type": "appointment.confirmed", "level": "info", "occurred_at": timestamp(-14)},
    ]

    return {
        "meta": {
            "product": "Averis",
            "owner": "Mahi",
            "workspace": "Mahi Health",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "seed": seed,
            "synthetic": True,
        },
        "organization": {
            "id": "org-averis-mahi",
            "name": "Mahi Health",
            "product": "Averis Care Operations OS",
        },
        "providers": providers,
        "patients": patients,
        "encounters": encounters,
        "appointments": appointments,
        "care_items": care_items,
        "tasks": tasks,
        "beds": beds,
        "inventory": inventory,
        "lab_orders": lab_orders,
        "invoices": invoices,
        "system_events": events,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate deterministic synthetic data for Averis by Mahi."
    )
    parser.add_argument("--seed", type=int, default=804)
    parser.add_argument("--patients", type=int, default=250)
    parser.add_argument("--appointments", type=int, default=600)
    parser.add_argument("--out", type=Path, default=Path("averis-data.json"))
    args = parser.parse_args()

    if args.patients < 1 or args.appointments < 1:
        raise SystemExit("patient and appointment counts must be positive")

    payload = build(args.seed, args.patients, args.appointments)
    args.out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(
        f"Wrote {args.out}: "
        f"{len(payload['patients'])} patients, "
        f"{len(payload['appointments'])} appointments."
    )


if __name__ == "__main__":
    main()
