#!/usr/bin/env python3
"""
Averis — synthetic operations dataset generator
===============================================

Offline developer utility for generating reproducible healthcare
operations records. The output contains fabricated data only.

Examples:
    python generate_data.py --seed 804 --patients 250 --out data.json
    python generate_data.py --seed 804 --patients 500 --appointments 1200 --out data.json

The browser application does not depend on this file at runtime.
It is intentionally kept aligned with the reference schema and the
front-end's operational concepts so a future backend can consume
the same domain model.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import random
import uuid
from pathlib import Path
from typing import Any

FIRST = [
    "Aarav", "Maya", "Noah", "Olivia", "Arjun", "Sophia", "Ethan", "Isabella",
    "Kabir", "Amelia", "Rohan", "Emma", "Vihaan", "Mia", "Aditya", "Ava",
    "Reyansh", "Liam", "Anaya", "Lucas", "Ishaan", "Ella", "Saanvi", "James",
    "Diya", "Daniel", "Nisha", "Ryan", "Kavya", "Leo", "Meera", "Adam"
]
LAST = [
    "Sharma", "Patel", "Williams", "Chen", "Rao", "Bennett", "Brooks",
    "Martin", "Mehta", "Jones", "Kapoor", "Davis", "Reddy", "Wilson",
    "Nair", "Thomas", "Gupta", "Anderson", "Singh", "Brown", "Verma",
    "Clark", "Iyer", "Miller"
]
SPECIALTIES = [
    "Cardiology", "Internal Medicine", "Neurology", "Pediatrics",
    "Orthopedics", "Oncology", "Radiology", "Dermatology", "Endocrinology"
]
DEPARTMENTS = [
    ("General Medicine", "GM"),
    ("Cardiology", "CARD"),
    ("Neurology", "NEUR"),
    ("Pediatrics", "PED"),
    ("Orthopedics", "ORTHO"),
    ("Diagnostics", "DIAG"),
    ("Emergency", "ED")
]
LOCATIONS = [
    ("Averis Central Hospital", "ACH-01", "Hyderabad", "Telangana"),
    ("Averis Riverside Campus", "ARC-02", "Hyderabad", "Telangana"),
    ("Averis North Medical Centre", "ANM-03", "Hyderabad", "Telangana"),
]
APPOINTMENT_TYPES = ["Follow-up", "Consultation", "Check-up", "Screening", "Telehealth", "Procedure"]
STATUSES = ["active", "stable", "needs_attention", "critical"]
RISKS = ["low", "low", "medium", "high"]
TASK_TITLES = [
    "Review lab results", "Confirm referral", "Call for follow-up",
    "Update care plan", "Prepare discharge summary", "Verify medication list",
    "Schedule screening", "Coordinate transport", "Confirm insurance documents"
]
CARE_ISSUES = [
    "Overdue follow-up", "Referral pending", "Care plan review",
    "Unresolved lab query", "Discharge coordination", "Medication reconciliation"
]
MEDICATIONS = [
    ("Metformin", "500 mg", "Tablet", 24),
    ("Amoxicillin", "500 mg", "Capsule", 18),
    ("Atorvastatin", "20 mg", "Tablet", 20),
    ("Insulin Glargine", "100 units/mL", "Injection", 12),
    ("Amlodipine", "10 mg", "Tablet", 22),
    ("Salbutamol", "100 mcg", "Inhaler", 15),
    ("Losartan", "50 mg", "Tablet", 20),
    ("Pantoprazole", "40 mg", "Tablet", 25),
]
LAB_TESTS = [
    ("CBC", "Hematology"), ("HbA1c", "Chemistry"), ("Lipid panel", "Chemistry"),
    ("BMP", "Chemistry"), ("TSH", "Endocrinology"), ("Troponin", "Cardiac"),
    ("LFT", "Chemistry"), ("Urinalysis", "Pathology")
]
EVENT_TYPES = [
    "patient_created", "appointment_created", "appointment_updated",
    "appointment_checked_in", "appointment_completed", "care_item_created",
    "care_item_updated", "task_created", "task_updated", "lab_result_posted",
    "medication_updated", "bed_status_changed", "message_sent",
    "notification_created", "system_health"
]

def uid() -> str:
    return str(uuid.uuid4())

def name(rng: random.Random) -> str:
    return f"{rng.choice(FIRST)} {rng.choice(LAST)}"

def iso_date(day: dt.date) -> str:
    return day.isoformat()

def iso_datetime(day: dt.date, hour: int, minute: int = 0) -> str:
    return dt.datetime.combine(day, dt.time(hour, minute)).isoformat() + "+05:30"

def pick_role(index: int) -> str:
    roles = [
        "organization_admin", "clinical_admin", "doctor", "nurse",
        "care_coordinator", "receptionist", "pharmacist",
        "lab_technician", "operations", "analyst"
    ]
    return roles[index % len(roles)]

def build_dataset(args: argparse.Namespace) -> dict[str, Any]:
    rng = random.Random(args.seed)
    today = dt.date.today()

    organization_id = uid()
    organization = {
        "id": organization_id,
        "name": "Averis Health Network",
        "legal_name": "Averis Health Network Private Limited",
        "organization_type": "Hospital Network",
        "timezone": "Asia/Kolkata",
        "plan": "enterprise",
        "active": True,
    }

    locations = []
    for display_name, code, city, region in LOCATIONS:
        locations.append({
            "id": uid(), "organizationId": organization_id, "name": display_name,
            "code": code, "city": city, "region": region, "country": "IN",
            "timezone": "Asia/Kolkata", "active": True
        })

    departments = []
    for i, (display_name, code) in enumerate(DEPARTMENTS):
        departments.append({
            "id": uid(), "organizationId": organization_id,
            "locationId": locations[i % len(locations)]["id"],
            "name": display_name, "code": code,
            "specialty": display_name if display_name != "General Medicine" else "Internal Medicine",
            "active": True
        })

    users = []
    for i in range(max(args.providers, 24)):
        users.append({
            "id": uid(), "organizationId": organization_id,
            "fullName": f"Dr. {name(rng)}" if i < args.providers else name(rng),
            "email": f"staff{i+1}@averis.local",
            "role": "doctor" if i < args.providers else pick_role(i),
            "phone": f"+91-9{rng.randint(100000000, 999999999)}",
            "active": True
        })

    providers = []
    doctor_users = [u for u in users if u["role"] == "doctor"]
    for i, user in enumerate(doctor_users[: args.providers]):
        dep = departments[i % len(departments)]
        providers.append({
            "id": uid(), "organizationId": organization_id,
            "userId": user["id"], "departmentId": dep["id"],
            "fullName": user["fullName"], "specialty": SPECIALTIES[i % len(SPECIALTIES)],
            "locationId": dep.get("locationId"),
            "capacityPerDay": rng.randint(10, 18),
            "active": True
        })

    patients = []
    for i in range(args.patients):
        provider = providers[i % len(providers)]
        dob = today - dt.timedelta(days=rng.randint(18 * 365, 84 * 365))
        status = rng.choice(STATUSES)
        patients.append({
            "id": uid(), "organizationId": organization_id,
            "medicalRecordNumber": f"AV-{20000 + i}",
            "fullName": name(rng),
            "dateOfBirth": dob.isoformat(),
            "gender": rng.choice(["Female", "Male", "Other"]),
            "phone": f"+91-9{rng.randint(100000000, 999999999)}",
            "email": f"patient{i+1}@synthetic.invalid",
            "primaryProviderId": provider["id"],
            "primaryDepartmentId": provider["departmentId"],
            "status": status,
            "riskLevel": rng.choice(RISKS),
            "attendanceRate": round(rng.uniform(72, 99), 2),
            "priorCancellations": rng.randint(0, 4),
            "lastVisitAt": iso_datetime(today - dt.timedelta(days=rng.randint(2, 90)), rng.randint(8, 17), rng.choice([0, 15, 30, 45])),
            "createdAt": iso_datetime(today - dt.timedelta(days=rng.randint(30, 365)), 10),
        })

    appointments = []
    for i in range(args.appointments):
        patient = patients[i % len(patients)]
        provider = providers[i % len(providers)]
        day_offset = rng.randint(-14, 30)
        day = today + dt.timedelta(days=day_offset)
        hour = rng.randint(8, 17)
        minute = rng.choice([0, 15, 30, 45])
        start = iso_datetime(day, hour, minute)
        end_dt = dt.datetime.fromisoformat(start).replace(tzinfo=None) + dt.timedelta(minutes=rng.choice([20, 30, 45, 60]))
        end = end_dt.isoformat() + "+05:30"
        status = rng.choice(["completed", "completed", "completed", "no_show", "cancelled"]) if day_offset < 0 else rng.choice(["scheduled", "scheduled", "confirmed"])
        appointments.append({
            "id": uid(), "organizationId": organization_id,
            "patientId": patient["id"], "providerId": provider["id"],
            "departmentId": provider["departmentId"],
            "locationId": next((d["locationId"] for d in departments if d["id"] == provider["departmentId"]), None),
            "appointmentType": rng.choice(APPOINTMENT_TYPES),
            "startsAt": start, "endsAt": end, "status": status,
            "confirmationState": "confirmed" if status in {"confirmed", "completed"} else "pending",
            "notes": ""
        })

    encounters = []
    for a in appointments:
        if a["status"] != "cancelled" and rng.random() < 0.75:
            encounters.append({
                "id": uid(), "organizationId": organization_id,
                "patientId": a["patientId"], "providerId": a["providerId"],
                "departmentId": a["departmentId"], "locationId": a["locationId"],
                "encounterType": a["appointmentType"],
                "startedAt": a["startsAt"], "endedAt": a["endsAt"],
                "disposition": "Home"
            })

    care_plans = []
    care_goals = []
    for i, patient in enumerate(patients[: max(20, args.patients // 4)]):
        cp_id = uid()
        progress = rng.randint(35, 96)
        care_plans.append({
            "id": cp_id, "organizationId": organization_id, "patientId": patient["id"],
            "providerId": patient["primaryProviderId"], "title": "Continuity of care plan",
            "diagnosisContext": patient["status"], "progressPct": progress,
            "startDate": (today - dt.timedelta(days=rng.randint(7, 60))).isoformat(),
            "reviewDate": (today + dt.timedelta(days=rng.randint(2, 30))).isoformat(),
            "active": True
        })
        for j in range(3):
            care_goals.append({
                "id": uid(), "carePlanId": cp_id,
                "goal": ["Complete follow-up", "Review medication response", "Confirm next care milestone"][j],
                "targetDate": (today + dt.timedelta(days=rng.randint(3, 45))).isoformat(),
                "completed": rng.random() < progress / 120
            })

    care_items = []
    for i in range(args.care_items):
        patient = patients[i % len(patients)]
        care_items.append({
            "id": uid(), "organizationId": organization_id,
            "patientId": patient["id"], "assignedUserId": users[(i + 1) % len(users)]["id"],
            "carePlanId": care_plans[i % len(care_plans)]["id"],
            "title": rng.choice(["Follow-up coordination", "Referral workflow", "Result review", "Discharge readiness"]),
            "issue": rng.choice(CARE_ISSUES), "stage": rng.choice(["new", "assigned", "in_progress", "waiting", "resolved"]),
            "priority": rng.choice(["low", "medium", "high", "urgent"]),
            "dueAt": iso_datetime(today + dt.timedelta(days=rng.randint(-2, 7)), rng.randint(8, 17), rng.choice([0,15,30,45]))
        })

    tasks = []
    for i in range(args.tasks):
        patient = patients[i % len(patients)]
        due = today + dt.timedelta(days=rng.randint(-3, 10))
        tasks.append({
            "id": uid(), "organizationId": organization_id, "patientId": patient["id"],
            "createdBy": users[i % len(users)]["id"], "assignedTo": users[(i + 2) % len(users)]["id"],
            "title": rng.choice(TASK_TITLES), "description": "Synthetic operational work item.",
            "status": rng.choice(["todo", "todo", "in_progress", "completed"]),
            "priority": rng.choice(["low", "medium", "high", "urgent"]),
            "dueAt": iso_datetime(due, rng.randint(8,17), 0)
        })

    beds = []
    for i in range(args.beds):
        loc = locations[i % len(locations)]
        dep = departments[i % len(departments)]
        state = rng.choice(["occupied", "occupied", "available", "cleaning", "available", "isolation"])
        beds.append({
            "id": uid(), "organizationId": organization_id, "locationId": loc["id"],
            "departmentId": dep["id"], "unitName": f"{chr(65 + i % 4)} Wing",
            "bedNumber": f"{chr(65 + i % 4)}-{101 + i}",
            "status": state, "isolationType": "Airborne" if state == "isolation" else None
        })

    medications = []
    inventories = []
    for i, (generic, strength, form, reorder) in enumerate(MEDICATIONS):
        med_id = uid()
        medications.append({
            "id": med_id, "organizationId": organization_id,
            "genericName": generic, "strength": strength, "form": form,
            "sku": f"AV-MED-{1000+i}", "reorderLevel": reorder, "active": True
        })
        for loc in locations:
            quantity = rng.randint(5, 120)
            inventories.append({
                "id": uid(), "medicationId": med_id, "locationId": loc["id"],
                "quantity": quantity, "reservedQuantity": rng.randint(0, min(quantity, 8))
            })

    lab_orders = []
    lab_results = []
    for i in range(args.lab_orders):
        patient = patients[i % len(patients)]
        ordered = today - dt.timedelta(minutes=rng.randint(5, 240))
        test_name, category = LAB_TESTS[i % len(LAB_TESTS)]
        order_id = uid()
        lab_orders.append({
            "id": order_id, "organizationId": organization_id, "patientId": patient["id"],
            "providerId": patient["primaryProviderId"], "testName": test_name,
            "priority": rng.choice(["low", "medium", "high", "urgent"]),
            "status": rng.choice(["ordered", "collected", "resulted"]),
            "orderedAt": iso_datetime(ordered.date(), ordered.hour, ordered.minute)
        })
        if rng.random() < 0.86:
            critical = rng.random() < 0.06
            lab_results.append({
                "id": uid(), "labOrderId": order_id,
                "analyte": category, "valueText": "Review required" if critical else "Within expected range",
                "numericValue": round(rng.uniform(3.0, 120.0), 2), "unit": "unit",
                "referenceRange": "Synthetic reference", "interpretation": "Critical" if critical else "Normal",
                "critical": critical, "reviewed": not critical and rng.random() < .55
            })

    conversations = []
    conversation_members = []
    messages = []
    for i in range(args.conversations):
        cid = uid()
        conversations.append({
            "id": cid, "organizationId": organization_id,
            "subject": ["Care Coordination", "Cardiology Queue", "Riverside Scheduling", "Lab Review"][i % 4],
            "createdBy": users[i % len(users)]["id"]
        })
        member_ids = [users[i % len(users)]["id"], users[(i + 2) % len(users)]["id"]]
        for member_id in member_ids:
            conversation_members.append({"conversationId": cid, "userId": member_id})
        for j in range(3):
            messages.append({
                "id": uid(), "conversationId": cid, "senderUserId": member_ids[j % 2],
                "body": [
                    "Can you confirm the schedule?",
                    "Yes, the slot is held and the care team is notified.",
                    "Perfect. I’ll review the next step."
                ][j],
                "sentAt": iso_datetime(today, 8 + i, 20 + j * 5)
            })

    notifications = []
    for i in range(args.notifications):
        notifications.append({
            "id": uid(), "organizationId": organization_id,
            "userId": users[i % len(users)]["id"], "type": EVENT_TYPES[i % len(EVENT_TYPES)],
            "title": ["Care coordination alert", "Schedule update", "Lab result posted", "Bed movement", "System health"][i % 5],
            "body": "Synthetic operational notification generated for the Averis workspace.",
            "severity": rng.choice(["low", "medium", "high", "urgent"])
        })

    events = []
    for i in range(args.events):
        events.append({
            "id": i + 1, "organizationId": organization_id,
            "eventType": rng.choice(EVENT_TYPES),
            "entityType": rng.choice(["patient", "appointment", "care_hub_item", "task", "bed", "lab_result", "message"]),
            "entityId": rng.choice(patients)["id"],
            "payload": {"source": "synthetic_generator", "sequence": i + 1},
            "occurredAt": iso_datetime(today, 9 + (i % 8), (i * 7) % 60)
        })

    return {
        "meta": {
            "generator": "Averis generate_data.py",
            "version": "2.0",
            "generatedAt": dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30))).isoformat(),
            "seed": args.seed,
            "synthetic": True
        },
        "organization": organization,
        "locations": locations,
        "departments": departments,
        "users": users,
        "providers": providers,
        "patients": patients,
        "encounters": encounters,
        "appointments": appointments,
        "carePlans": care_plans,
        "carePlanGoals": care_goals,
        "careHubItems": care_items,
        "tasks": tasks,
        "beds": beds,
        "medications": medications,
        "medicationInventory": inventories,
        "labOrders": lab_orders,
        "labResults": lab_results,
        "conversations": conversations,
        "conversationMembers": conversation_members,
        "messages": messages,
        "notifications": notifications,
        "systemEvents": events
    }

def positive_int(value: str) -> int:
    number = int(value)
    if number <= 0:
        raise argparse.ArgumentTypeError("must be greater than zero")
    return number

def main() -> None:
    ap = argparse.ArgumentParser(description="Generate reproducible synthetic Averis operations data.")
    ap.add_argument("--patients", type=positive_int, default=180)
    ap.add_argument("--providers", type=positive_int, default=20)
    ap.add_argument("--appointments", type=positive_int, default=420)
    ap.add_argument("--tasks", type=positive_int, default=80)
    ap.add_argument("--care-items", type=positive_int, default=45)
    ap.add_argument("--beds", type=positive_int, default=48)
    ap.add_argument("--lab-orders", type=positive_int, default=120)
    ap.add_argument("--conversations", type=positive_int, default=10)
    ap.add_argument("--notifications", type=positive_int, default=24)
    ap.add_argument("--events", type=positive_int, default=120)
    ap.add_argument("--seed", type=int, default=804)
    ap.add_argument("--out", type=Path, default=Path("data.json"))
    args = ap.parse_args()

    payload = build_dataset(args)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    print(
        f"Generated synthetic Averis dataset → {args.out}\n"
        f"patients={len(payload['patients'])} "
        f"providers={len(payload['providers'])} "
        f"appointments={len(payload['appointments'])} "
        f"tasks={len(payload['tasks'])} "
        f"care_items={len(payload['careHubItems'])} "
        f"beds={len(payload['beds'])} "
        f"lab_orders={len(payload['labOrders'])}"
    )

if __name__ == "__main__":
    main()
