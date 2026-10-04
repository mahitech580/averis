#!/usr/bin/env python3
"""Averis by Mahi — V11 synthetic healthcare data generator.

Python 3 standard library only.
Generated records are fictional and intended for portfolio/demo use.
"""

from __future__ import annotations

import argparse
import json
import random
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

BASE_DATE = date(2026, 10, 4)
NAMES = [
    "Aarav Sharma","Maya Patel","Noah Williams","Olivia Chen","Arjun Rao",
    "Sophia Bennett","Ethan Brooks","Isabella Martin","Kabir Mehta","Amelia Jones",
    "Rohan Kapoor","Emma Davis","Vihaan Reddy","Mia Wilson","Aditya Nair",
    "Ava Thomas","Reyansh Gupta","Liam Anderson","Anaya Singh","Lucas Brown",
]
PROVIDERS = [
    ("Dr. Maya Chen","Cardiology","North Tower"),
    ("Dr. Arjun Rao","General Medicine","Central Campus"),
    ("Dr. Sofia Martinez","Neurology","Riverside"),
    ("Dr. Ethan Lee","Pediatrics","North Tower"),
    ("Dr. Priya Nair","Orthopedics","Central Campus"),
    ("Dr. Daniel Brooks","Oncology","Riverside"),
    ("Dr. Kavya Singh","Dermatology","North Tower"),
    ("Dr. Noah Carter","Radiology","Central Campus"),
]
CONDITIONS = ["Hypertension","Type 2 Diabetes","Asthma","Arrhythmia","Migraine","Arthritis","Recovery","Routine review"]


def day(offset: int) -> str:
    return (BASE_DATE + timedelta(days=offset)).isoformat()


def timestamp(offset_minutes: int = 0) -> str:
    base = datetime(2026, 10, 4, 10, 45, tzinfo=timezone.utc)
    return (base + timedelta(minutes=offset_minutes)).isoformat()


def build(seed: int, patients_count: int, appointments_count: int) -> dict:
    rng = random.Random(seed)

    providers = [
        {
            "id": f"PR-{100+i}",
            "name": name,
            "specialty": specialty,
            "location": location,
            "capacity": rng.randint(10, 18),
            "today_booked": rng.randint(4, 14),
            "utilization": rng.randint(48, 94),
            "status": "Busy" if i % 4 == 0 else "Available",
        }
        for i, (name, specialty, location) in enumerate(PROVIDERS)
    ]

    patients = []
    for i in range(patients_count):
        provider = providers[i % len(providers)]
        patients.append(
            {
                "id": f"AV-{26000+i}",
                "name": NAMES[i % len(NAMES)] if i < len(NAMES) else f"Mahi Patient {i:03d}",
                "age": rng.randint(21, 81),
                "condition": CONDITIONS[i % len(CONDITIONS)],
                "department": provider["specialty"],
                "provider_id": provider["id"],
                "status": ["Active","Stable","Needs Attention","Active"][i % 4],
                "risk": ["Low","Low","Medium","High"][i % 4],
                "attendance": rng.randint(80, 99),
                "last_visit": day(-rng.randint(2, 42)),
                "next_visit": day(rng.randint(1, 18)),
            }
        )

    slots = ["08:30","09:15","10:00","10:45","11:30","12:15","13:30","14:15","15:00"]
    visit_types = ["Consultation","Follow-up","Screening","Review","Telehealth"]
    appointments = []
    for i in range(appointments_count):
        patient = patients[i % len(patients)]
        provider = providers[i % len(providers)]
        offset = rng.randint(-3, 14)
        if offset < 0:
            status = "No Show" if i % 11 == 0 else "Completed"
        else:
            status = "Confirmed" if i % 3 == 0 else "Scheduled"
        appointments.append(
            {
                "id": f"AP-{4200+i}",
                "date": day(offset),
                "time": slots[i % len(slots)],
                "patient_id": patient["id"],
                "provider_id": provider["id"],
                "type": visit_types[i % len(visit_types)],
                "status": status,
            }
        )

    tasks = [
        {
            "id": f"TK-{7000+i}",
            "title": [
                "Call patient about lab result",
                "Review discharge plan",
                "Verify insurance documents",
                "Confirm specialist referral",
                "Medication reconciliation",
            ][i % 5],
            "patient_id": patients[i % len(patients)]["id"],
            "owner": ["Mahi","Care Team","Front Desk","Clinical Lead"][i % 4],
            "priority": ["Low","Medium","High","Urgent"][i % 4],
            "status": ["To Do","To Do","In Progress","Completed"][i % 4],
            "due": day(rng.randint(-2, 9)),
        }
        for i in range(max(32, min(patients_count, 180)))
    ]

    care_items = [
        {
            "id": f"CH-{9000+i}",
            "patient_id": patients[i % len(patients)]["id"],
            "issue": ["Overdue follow-up","Referral pending","Care-plan review","Unresolved result","Discharge coordination"][i % 5],
            "stage": ["New","Assigned","In Progress","Waiting","Resolved"][i % 5],
            "priority": ["Normal","Normal","High","Urgent"][i % 4],
            "age_minutes": rng.randint(10, 240),
        }
        for i in range(max(25, min(patients_count, 160)))
    ]

    beds = [
        {
            "id": f"{'ABCD'[i % 4]}-{101+i}",
            "ward": ["ICU","General","Cardiology","Pediatrics"][i % 4],
            "status": ["Occupied","Occupied","Available","Cleaning","Occupied","Available","Isolation"][i % 7],
            "patient_id": patients[i % len(patients)]["id"] if i % 7 in (0,1,4,6) else None,
        }
        for i in range(max(48, min(patients_count, 220)))
    ]

    lab_orders = [
        {
            "id": f"LAB-{5000+i}",
            "patient_id": patients[i % len(patients)]["id"],
            "test": ["CBC","HbA1c","Troponin I","Lipid profile"][i % 4],
            "priority": ["Routine","Routine","High","Critical"][i % 4],
            "status": "Awaiting review" if i % 3 == 0 else "Resulted",
        }
        for i in range(max(40, min(patients_count, 140)))
    ]

    invoices = [
        {
            "id": f"INV-{2400+i}",
            "patient_id": patients[i % len(patients)]["id"],
            "amount": [24800,12400,48600,8900][i % 4],
            "payer": ["Insurance","Self pay","Insurance","Self pay"][i % 4],
            "status": ["Pending","Paid","Review","Paid"][i % 4],
        }
        for i in range(max(20, min(patients_count, 100)))
    ]

    inventory = [
        {"name":"Metformin 500 mg","category":"Oral medication","stock":84,"reorder":30,"unit":"packs"},
        {"name":"Insulin Glargine","category":"Insulin","stock":18,"reorder":24,"unit":"vials"},
        {"name":"Amoxicillin 500 mg","category":"Antibiotic","stock":62,"reorder":20,"unit":"packs"},
        {"name":"Paracetamol 650 mg","category":"Analgesic","stock":120,"reorder":40,"unit":"packs"},
        {"name":"Normal Saline 500 ml","category":"IV fluid","stock":31,"reorder":28,"unit":"bags"},
    ]

    return {
        "meta": {
            "product": "Averis",
            "brand": "Averis by Mahi",
            "owner": "Mahi",
            "workspace": "Mahi Health",
            "synthetic": True,
            "seed": seed,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        "providers": providers,
        "patients": patients,
        "appointments": appointments,
        "tasks": tasks,
        "care_items": care_items,
        "beds": beds,
        "lab_orders": lab_orders,
        "inventory": inventory,
        "invoices": invoices,
        "system_events": [
            {"type":"appointment.confirmed","level":"info","occurred_at":timestamp()},
            {"type":"lab.critical","level":"critical","occurred_at":timestamp(-6)},
            {"type":"bed.status_changed","level":"warning","occurred_at":timestamp(-10)},
            {"type":"care.updated","level":"info","occurred_at":timestamp(-14)},
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic Averis by Mahi records.")
    parser.add_argument("--seed", type=int, default=804)
    parser.add_argument("--patients", type=int, default=250)
    parser.add_argument("--appointments", type=int, default=600)
    parser.add_argument("--out", type=Path, default=Path("averis-data.json"))
    args = parser.parse_args()

    if args.patients < 1 or args.appointments < 1:
        raise SystemExit("patients and appointments must be positive")

    payload = build(args.seed, args.patients, args.appointments)
    args.out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {args.out}: {len(payload['patients'])} patients, {len(payload['appointments'])} appointments.")


if __name__ == "__main__":
    main()
