#!/usr/bin/env python3
"""
AVERIS — synthetic data generator (offline dev utility)
========================================================
This script is NOT part of the live static site and is never
executed by GitHub Pages (which only serves index.html, styles.css,
and app.js). It's a standalone helper you can run locally with
plain Python 3 (no third-party packages) to regenerate a larger
or differently-shaped synthetic dataset — e.g. if you want to
seed more patients/appointments than the in-browser generator
in app.js produces, or export a one-off dataset for a demo.

Usage:
    python3 generate_data.py --patients 250 --appointments 400 --out data.json

Output is a single JSON file with the same shape the app already
uses internally (patients, providers, appointments, tasks,
care_hub_items). You can paste its contents into the browser
console as window.storage seeds, or adapt app.js's seedData()
to fetch this file instead of generating in-browser.

No real patient data is used or required — every record here is
fabricated for demo purposes only.
"""

import argparse
import json
import random
import datetime as dt

FIRST = ["Olivia","Liam","Emma","Noah","Ava","Ethan","Sophia","Mason","Isabella","Lucas",
         "Mia","Elijah","Amelia","James","Harper","Benjamin","Evelyn","Henry","Luna","Alex",
         "Grace","Owen","Chloe","Wyatt","Ella","Jack","Scarlett","Leo","Nora","Priya",
         "Arjun","Wei","Fatima","Diego","Hana","Kwame","Ingrid","Mateo","Zoe","Aria"]
LAST = ["Bennett","Carter","Diaz","Ellison","Fischer","Grant","Huang","Ibrahim","Jansen",
        "Kapoor","Lindqvist","Moreau","Nakamura","Ortiz","Patel","Quinn","Reyes","Sato",
        "Thompson","Ueda","Vance","Walsh","Xu","Yamamoto","Zimmerman"]
SPECIALTIES = ["Internal Medicine","Family Practice","Cardiology","Endocrinology","Pediatrics",
               "Dermatology","Orthopedics","Psychiatry","Neurology","OB/GYN"]
LOCATIONS = ["Downtown Clinic","Riverside Campus","North Medical Plaza","Harborview Center","Elmwood Practice"]
DEPARTMENTS = ["Primary Care","Cardiology","Diagnostics","Behavioral Health","Pediatrics","Orthopedics"]
APPT_TYPES = ["Check-up","Follow-up","Consultation","Procedure","Screening","Telehealth"]
STAGES = ["New","Assigned","In Progress","Waiting","Resolved"]


def full_name():
    return f"{random.choice(FIRST)} {random.choice(LAST)}"


def gen_providers(n):
    return [{
        "id": f"PR{1000+i}",
        "name": f"Dr. {full_name()}",
        "specialty": random.choice(SPECIALTIES),
        "location": random.choice(LOCATIONS),
        "todayAppts": random.randint(1, 11),
        "activePatients": random.randint(18, 140),
        "openTasks": random.randint(0, 7),
    } for i in range(n)]


def gen_patients(n, providers):
    statuses = ["Active", "Stable", "Needs Attention", "Critical"]
    risks = ["Low", "Medium", "High"]
    out = []
    today = dt.date.today()
    for i in range(n):
        prov = random.choice(providers)
        last_visit = today - dt.timedelta(days=random.randint(1, 190))
        has_next = random.random() > 0.35
        next_appt = today + dt.timedelta(days=random.randint(-2, 30)) if has_next else None
        out.append({
            "id": f"AV-{20400+i}",
            "name": full_name(),
            "age": random.randint(4, 89),
            "gender": random.choice(["Female", "Male", "Other"]),
            "providerId": prov["id"],
            "provider": prov["name"],
            "lastVisit": last_visit.isoformat(),
            "nextAppt": next_appt.isoformat() if next_appt else None,
            "status": random.choice(statuses),
            "risk": random.choice(risks),
            "attendanceRate": random.randint(55, 99),
            "priorCancellations": random.randint(0, 4),
            "archived": False,
        })
    return out


def gen_appointments(n, patients, providers):
    out = []
    today = dt.date.today()
    by_id = {p["id"]: p for p in providers}
    for i in range(n):
        patient = random.choice(patients)
        provider = by_id.get(patient["providerId"], random.choice(providers))
        offset = random.randint(-10, 14)
        date = today + dt.timedelta(days=offset)
        hour = random.randint(8, 17)
        minute = random.choice(["00", "15", "30", "45"])
        status = random.choice(["Completed", "Completed", "Completed", "No Show", "Cancelled"]) \
            if offset < 0 else random.choice(["Scheduled", "Confirmed", "Confirmed"])
        out.append({
            "id": f"AP{5000+i}",
            "patientId": patient["id"],
            "patientName": patient["name"],
            "providerId": provider["id"],
            "providerName": provider["name"],
            "department": random.choice(DEPARTMENTS),
            "date": date.isoformat(),
            "time": f"{hour:02d}:{minute}",
            "duration": random.choice([15, 20, 30, 45, 60]),
            "type": random.choice(APPT_TYPES),
            "status": status,
            "notes": "",
        })
    return out


def gen_tasks(n, patients):
    assignees = ["Jordan P.", "Sam R.", "Casey L.", "Morgan T.", "You"]
    titles = ["Review lab results", "Confirm insurance", "Call for follow-up",
              "Update care plan", "Prep discharge summary", "Verify medication list",
              "Schedule screening"]
    today = dt.date.today()
    return [{
        "id": f"TSK{700+i}",
        "title": random.choice(titles),
        "patient": random.choice(patients)["name"],
        "assignee": random.choice(assignees),
        "priority": random.choice(["Low", "Medium", "High", "Urgent"]),
        "dueDate": (today + dt.timedelta(days=random.randint(-3, 10))).isoformat(),
        "status": random.choice(["To Do", "To Do", "In Progress", "Completed"]),
    } for i in range(n)]


def gen_care_hub(n, patients):
    issues = ["Overdue follow-up", "Unresolved lab query", "Care plan review due",
              "Discharge coordination", "Referral pending", "Medication reconciliation"]
    return [{
        "id": f"CC{300+i}",
        "patient": random.choice(patients)["name"],
        "issue": random.choice(issues),
        "stage": random.choice(STAGES),
    } for i in range(n)]


def main():
    ap = argparse.ArgumentParser(description="Generate synthetic Averis demo data as JSON.")
    ap.add_argument("--patients", type=int, default=150)
    ap.add_argument("--providers", type=int, default=24)
    ap.add_argument("--appointments", type=int, default=200)
    ap.add_argument("--tasks", type=int, default=50)
    ap.add_argument("--care-items", type=int, default=30)
    ap.add_argument("--seed", type=int, default=None, help="Random seed for reproducible output")
    ap.add_argument("--out", type=str, default="data.json")
    args = ap.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    providers = gen_providers(args.providers)
    patients = gen_patients(args.patients, providers)
    appointments = gen_appointments(args.appointments, patients, providers)
    tasks = gen_tasks(args.tasks, patients)
    care_hub_items = gen_care_hub(args.care_items, patients)

    payload = {
        "providers": providers,
        "patients": patients,
        "appointments": appointments,
        "tasks": tasks,
        "careCards": care_hub_items,
    }

    with open(args.out, "w") as f:
        json.dump(payload, f, indent=2)

    print(f"Wrote {len(patients)} patients, {len(providers)} providers, "
          f"{len(appointments)} appointments, {len(tasks)} tasks, "
          f"{len(care_hub_items)} care-hub items -> {args.out}")


if __name__ == "__main__":
    main()
