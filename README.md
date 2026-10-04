# Averis — Care Command Center

> Better care starts with better coordination.

Averis is an advanced healthcare operations command center for patient flow, appointments, care coordination, clinical signals, provider capacity, beds, pharmacy, laboratory operations, team communication, tasks, analytics, reporting and operational decision support.

The public GitHub Pages build is fully client-side. Its "LIVE" layer is a browser-side event simulation that continuously updates operational telemetry, activity, freshness and notifications. All patient, clinical, inventory and operational records are synthetic.

**Live:** https://mahitech580.github.io/averis/  
**Repository:** https://github.com/mahitech580/averis

## Product areas

### Command
- Command Center
- Analytics
- AI Copilot

### Care operations
- Patients
- Appointments
- Care Hub
- Clinical Monitor
- Providers
- Bed Board

### Hospital services
- Pharmacy
- Laboratory
- Messages
- Tasks
- Reports

### System
- Light/dark clinical theme
- Real-time clock and freshness indicators
- Live activity and notifications
- Ctrl/Cmd + K command search
- Responsive mobile navigation
- Browser persistence
- CSV export flows
- Reduced-motion support

## Design language

The UI uses a clinical-first palette with high-contrast cinematic energy inspired by Marvel-style interface aesthetics:

| Role | Color |
|---|---|
| Medical blue | #1565C0 |
| Deep blue | #0D47A1 |
| Healthcare teal | #00897B |
| Signal red | #E23636 |
| Priority gold | #FFC107 |
| Positive green | #2E7D32 |
| Clinical surface | #F4F8FC |
| Medical navy | #172B4D |

The product remains healthcare-focused rather than superhero-themed.

## Motion and atmosphere

Averis includes:
- Layered animated fog
- Ambient particles
- Pointer-responsive atmosphere
- Hero image drift
- Soft hover haze
- Live pulse indicators
- Animated clinical telemetry
- Smooth navigation transitions
- Reduced-motion handling

Local SVG assets provide the brand mark and ambient visual system.

## Healthcare imagery

Selected healthcare photography is sourced from Pexels:

- [Doctors and Nurses in a Hospital](https://www.pexels.com/photo/doctors-and-nurses-in-a-hospital-6129507/)
- [Doctors Working Together](https://www.pexels.com/photo/doctors-working-together-6129207/)
- [Doctor and Patient Talking in Office](https://www.pexels.com/photo/doctor-and-patient-talking-in-office-8413204/)

## Repository structure

\`\`\`text
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
\`\`\`

**index.html** — application shell, navigation, content hosts, overlays, PWA metadata and accessibility entry points.

**styles.css** — clinical design system, responsive layouts, charts, tables, monitoring cards, atmospheric effects, hover states and light/dark themes.

**app.js** — state management, synthetic data, live simulation, navigation, search, patient profiles, schedules, care workflows, clinical monitor, providers, pharmacy, laboratory, beds, messages, tasks, analytics, reports and AI Copilot.

**manifest.json** — PWA identity, scope, theme and install metadata.

**schema.sql** — reference PostgreSQL architecture covering organizations, locations, departments, users, providers, patients, encounters, appointments, care plans, tasks, beds, pharmacy, laboratory, conversations, notifications, system events, audit logging and integrations.

**generate_data.py** — deterministic offline generator for larger synthetic datasets aligned with the domain model.

## Synthetic data generator

Requires only Python 3:

\`\`\`bash
python generate_data.py --seed 804 --patients 250 --appointments 600 --out data.json
\`\`\`

The generator produces domains including patients, providers, appointments, encounters, care plans, care items, tasks, beds, medications, inventories, lab orders/results, conversations, messages, notifications and system events.

## Local development

\`\`\`bash
python -m http.server 8000
\`\`\`

Open `http://localhost:8000`.

No framework, package manager or build step is required.

## Real-time architecture

The current browser build simulates the real-time experience. A production implementation can replace it with:

\`\`\`text
UI
 ↓
Authenticated API
 ↓
Application services
 ↓
PostgreSQL + event store
 ↓
WebSocket / Server-Sent Events
 ↓
Live subscriptions
\`\`\`

The upgraded `schema.sql` is designed around this evolution.

## Security boundary

This public portfolio implementation does not provide production authentication, PHI controls, HIPAA compliance, server-side authorization, encrypted clinical storage, real EHR integrations or backend real-time infrastructure.

Do not use the public build with real patient information.

## Author

**Mahendra Sai Kondaveeti**

GitHub: https://github.com/mahitech580

---

<p align="center">
  <strong>Averis Care Command</strong><br>
  Better care starts with better coordination.
</p>
