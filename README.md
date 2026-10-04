# Averis by Mahi — Care Operations OS

> See the hospital clearly. Move care with confidence.

Averis is Mahi's healthcare operations portfolio product: a polished workspace for patient flow, appointments, emergency triage, Patient 360, care coordination, clinical monitoring, bed capacity, laboratory, pharmacy, billing, communication, tasks, analytics, reports and AI-assisted operational guidance.

## Identity

**Product:** Averis
**Brand:** Averis by Mahi
**Workspace:** Mahi Health
**Owner:** Mahi

## V11 rebuild

V11 is a complete application rebuild, not an incremental UI patch. The project replaces the application shell, styling system, state layer, routing, forms, synthetic dataset, PWA metadata, reference database model and visual assets.

The design direction follows the quality principles of Mahi's other polished portfolio work: strong access experience, premium surfaces, clean hierarchy, smooth interaction, responsive navigation, persistence and working actions.

## Modules

| Group | Modules |
| --- | --- |
| Command | Command Center · Analytics · AI Copilot |
| Patient flow | Patients · Patient 360 · Live Queue · Appointments · Emergency |
| Clinical operations | Care Hub · Clinical Monitor · Providers · Bed Board |
| Hospital services | Laboratory · Pharmacy · Billing · Messages · Tasks · Reports |
| System | Mahi Workspace Settings |

## Background imagery

Every major workspace view has an actual healthcare photograph layer with:

- section-specific image assignment
- a readable wash above the image
- a local SVG/gradient fallback beneath it
- error handling for failed remote image requests
- dark-mode image treatment
- no layout dependency on image success

The images are atmospheric portfolio imagery. The application does not use real patient photography as application data.

## Working product behavior

- browser-local profile creation and sign-in
- persistent session and profile storage
- Patient search and Patient 360 selection
- new patient / appointment / task / care / emergency / provider / invoice / stock / lab / message forms
- live queue and bed-board interactions
- actual message submission
- CSV exports
- command search with Ctrl+K / Cmd+K
- notifications and unread state
- light/dark theme
- targeted one-second live telemetry
- responsive sidebar drawer
- route-safe hash navigation
- startup error boundary instead of a blank screen

### Persistence model

All browser data uses a single storage abstraction and one versioned namespace:

```text
MAHI_AVERIS_V11_
```

The app does not mix multiple storage prefixes for different auth paths.

Refresh behavior:

1. Load stored profile and session
2. Restore synthetic records
3. Validate the hash route
4. Activate the selected view
5. Continue the workspace without requiring registration again

## Safety boundary

All patient, clinical, billing, pharmacy and operational records in the public GitHub Pages application are synthetic portfolio records.

This build is not an EHR, medical device, hospital information system or clinical decision system.

Do not enter real patient information.

## Architecture

```text
Averis by Mahi UI
       ↓
Browser-local state
       ↓
Role-oriented operational modules
       ↓
Targeted live DOM updates
       ↓
CSV / report exports
```

The repository also contains a PostgreSQL reference schema showing how a future production system could move browser state behind authenticated APIs, audit logs and event-driven live subscriptions.

## Repository

```text
averis/
├── assets/
│   ├── averis-mark.svg
│   ├── ambient-grid.svg
│   └── care-pattern.svg
├── index.html
├── styles.css
├── app.js
├── manifest.json
├── schema.sql
├── generate_data.py
└── README.md
```

## Local run

No build step is required.

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

Generate a larger synthetic dataset:

```bash
python generate_data.py --seed 804 --patients 250 --appointments 600 --out averis-data.json
```

## Future production direction

A production deployment would replace browser storage and simulated signals with authenticated APIs, role-based authorization, PostgreSQL, audit/event persistence, WebSocket or Server-Sent Events, monitoring, backup/recovery, secrets management and applicable healthcare compliance controls.

## Author

**Mahi**

**Averis by Mahi** is presented as Mahi's healthcare product design and engineering portfolio project.

---

<p align="center"><strong>AVERIS BY MAHI</strong><br>Care Operations OS</p>