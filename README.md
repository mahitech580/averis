# Averis by Mahi — Care Operations OS

> **See the hospital clearly. Move care with confidence.**

Averis is Mahi's portfolio-grade healthcare operations workspace. It brings patient flow, appointments, emergency triage, Patient 360, care coordination, clinical monitoring, providers, beds, laboratory, pharmacy, billing, communication, tasks, analytics, reporting and AI decision support into one coherent operating surface.

**Live:** https://mahitech580.github.io/averis/
**Repository:** https://github.com/mahitech580/averis

## Full rebuild

This release replaces the previous application rather than layering more patches onto it.

The project rebuilds the application shell, visual system, client-side state, navigation, local profile flow, synthetic records, operational modules, forms, reports, reference schema, data generator, PWA metadata and local SVG assets around one identity:

**AVERIS BY MAHI**

The UX takes conceptual reference from the premium workspace approach used in Mahi's other portfolio work: strong entry experience, persistent atmosphere, glass navigation, compact information architecture, focused primary actions, smooth responsive behavior and clear ownership.

## Modules

| Area | Workspace |
| --- | --- |
| Command | Command Center · Analytics · AI Copilot |
| Patient flow | Patients · Patient 360 · Live Queue · Appointments · Emergency |
| Clinical operations | Care Hub · Clinical Monitor · Providers · Bed Board |
| Hospital services | Laboratory · Pharmacy · Billing · Messages · Tasks · Reports |
| System | Mahi Workspace · Theme · Live simulation · Local profile |

## Working interactions

- local profile creation and sign-in
- browser-local session persistence
- patient search and Patient 360 selection
- appointment creation
- care-item and task creation
- emergency arrival registration
- invoice and inventory entry flows
- laboratory order creation
- local messaging
- notifications and unread state
- command search with Ctrl K / Cmd K
- light and dark clinical themes
- CSV exports
- responsive sidebar/navigation
- live clock, latency and activity simulation

The LIVE layer is a browser-side simulation. It is intentionally not presented as a connection to a real hospital system.

## Visual direction

Averis uses a clinical foundation rather than a generic admin-dashboard appearance:

- deep medical navy for high-focus areas
- medical blue for primary actions and navigation
- healthcare teal for positive flow
- red for emergency signals
- gold for priority and attention
- layered glass surfaces over a persistent background system
- healthcare photography as optional atmosphere
- readable tables, queue rows, patient journeys and ward boards
- animations that update operational details without hiding the application

A local fallback scene remains underneath the remote photo layer, so the workspace does not depend on a successful image request.

## Project structure

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

### index.html

Owns the complete page shell: access experience, persistent scene, sidebar, topbar, module containers, profile controls and overlay roots.

### styles.css

Owns the new clinical visual system, responsive behavior, glass surfaces, hero composition, charts, tables, queues, bed board, forms, modals, notifications and themes.

### app.js

Owns local data, profile/session behavior, routing, rendered modules, forms, notifications, command search, exports and the browser-side live simulation.

### schema.sql

Reference PostgreSQL design for a future authenticated backend. The public GitHub Pages build never executes this schema.

### generate_data.py

Standard-library-only generator for larger synthetic Averis datasets.

### manifest.json

PWA identity and launch metadata for Averis by Mahi.

## Run locally

No package manager or build step is required.

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Generate a larger demo dataset:

```bash
python generate_data.py --seed 804 --patients 250 --appointments 600 --out averis-data.json
```

## Production architecture

The public build is deliberately front-end only. A production Averis service would replace browser storage and simulated events with authenticated, auditable infrastructure:

```text
Averis by Mahi UI
        ↓
Authenticated API
        ↓
Healthcare domain services
        ↓
PostgreSQL
   ↙            ↘
Audit log     Event store
        ↓
WebSocket / Server-Sent Events
        ↓
Role-based live workspace
```

A real deployment would also require validated access controls, encryption, secrets management, auditability, observability, backup/recovery, integration boundaries and applicable healthcare compliance work.

## Data boundary

All patient, clinical, operational, billing and inventory records in this public portfolio application are synthetic.

Do not enter real patient information.

## Author

**Mahi**

**Averis by Mahi** is presented as a healthcare product design and engineering portfolio project.

---

<p align="center">
  <strong>AVERIS BY MAHI</strong><br>
  Care Operations OS
</p>