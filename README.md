# Averis — Care Command Center

> **Better care starts with better coordination.**

Averis is a polished healthcare operations command center built for a portfolio-quality product experience. The redesigned interface brings patient operations, scheduling, care coordination, clinical monitoring, staffing, capacity, pharmacy, laboratory, collaboration, tasks, analytics, reporting and an AI operations copilot into one responsive workspace.

The current GitHub Pages build is **100% client-side**. Its live layer is a **browser-side operational simulation** that updates timestamps, activity, capacity signals and clinical telemetry continuously. A production version would replace the simulation with authenticated backend APIs, database events and real-time infrastructure.

> **Portfolio safety:** all patient, clinical, inventory and operational values are synthetic. Averis is not a clinical system and should not be used for real patient care.

---

## 🚀 Live

**Application:** https://mahitech580.github.io/averis/  
**Repository:** https://github.com/mahitech580/averis

Open the site directly — there is no server setup or account creation required for the portfolio build.

---

## ✨ What is inside

### Command Center
- Live operational overview
- Patient flow trend
- Capacity and occupancy snapshot
- Care queue visibility
- Live activity stream
- Network/system health indicator
- Animated healthcare imagery
- Real-time clock and freshness signals

### Care Operations
- Patients
- Appointments
- Care Hub
- Clinical Monitor
- Providers
- Bed Board

### Services
- Pharmacy
- Laboratory
- Messages
- Tasks
- Reports

### Intelligence
- Operational analytics
- Provider workload signals
- No-show and scheduling signals
- Care-cycle metrics
- Explainable AI Copilot

### System
- Light/dark clinical theme
- Live simulation toggle
- Responsive navigation
- Global command/search palette
- Notifications
- Browser persistence with localStorage
- CSV export flows

---

## 🎨 Design direction

The visual system combines **clinical healthcare UI patterns** with a restrained cinematic color language inspired by the energy of Marvel-style interfaces:

- Medical blue for primary navigation and actions
- Healthcare teal for positive/active signals
- Deep red for critical states
- Gold for attention and priority states
- Navy/slate text and surfaces for readability
- Soft glass and atmospheric fog rather than heavy neon effects
- Animated hover haze and subtle lift interactions
- Responsive layouts for desktop, tablet and mobile

The intent is **healthcare first** — not superhero theming.

---

## 🌫️ Motion & atmosphere

Averis includes a lightweight motion layer designed to feel alive without making the interface distracting:

- Animated background fog
- Slow ambient particle movement
- Mouse-following atmosphere
- Hero image drift
- Soft card hover haze
- Button/search hover glow
- Live status pulses
- Animated clinical telemetry
- Periodic activity updates
- Smooth view transitions

The animation system respects `prefers-reduced-motion`.

---

## 🖼️ Healthcare imagery

The redesigned UI uses healthcare photography from **Pexels** for the hero, care and hospital-environment surfaces. The selected source pages are marked as free-use by Pexels:

- Hospital care team image — Pexels photo 6129507 urlSource pagehttps://www.pexels.com/photo/doctors-and-nurses-in-a-hospital-6129507/
- Doctor/patient care image — Pexels photo 6129651 urlSource pagehttps://www.pexels.com/photo/doctor-talking-to-a-patient-6129651/
- Modern hospital interior — Pexels photo 29329917 urlSource pagehttps://www.pexels.com/photo/modern-hospital-interior-with-staircase-and-elevators-29329917/

The photographs are used as visual product surfaces rather than as patient records or clinical evidence.

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| UI | HTML5 |
| Styling | CSS3 |
| Application | Vanilla JavaScript |
| Charts | Inline SVG |
| State | localStorage |
| PWA | Web App Manifest |
| Data | Synthetic browser-side data |
| Deployment | GitHub Pages |
| Backend | None in the current build |

No framework or package manager is required.

---

## 🏗️ Project structure

```text
averis/
├── index.html
├── styles.css
├── app.js
├── manifest.json
├── schema.sql
├── generate_data.py
└── README.md
```

### Main application files

**index.html**  
Application shell, navigation, content views, overlays and modal host.

**styles.css**  
Full clinical design system, responsive layouts, motion, fog atmosphere, image surfaces, tables, charts, cards and component states.

**app.js**  
Synthetic data generation, state management, live simulation, rendering, navigation, command search, patient details, messaging, tasks, analytics, reports and AI Copilot logic.

**schema.sql**  
Reference relational model showing how the client-side concepts could be connected to PostgreSQL in a production architecture.

---

## ⚡ Run locally

Because the current build is static:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Opening `index.html` directly also works in modern browsers.

---

## 🔴 Live data note

The interface intentionally displays **LIVE** indicators and continuously changing operational values, but those values are simulated inside the browser.

A genuinely real-time deployment would require:

```text
Frontend
   ↓
Authenticated API
   ↓
Application services
   ↓
PostgreSQL / event store
   ↓
WebSocket / SSE event stream
   ↓
Live UI updates
```

That architecture is the natural next step for turning the current portfolio build into a production-grade healthcare operations platform.

---

## 🔐 Security & healthcare scope

The current repository does not provide production authentication, HIPAA controls, audit logging, encrypted clinical storage, real patient integrations or server-side authorization.

The correct production path would add secure identity, role-based permissions, audit trails, encryption, consent workflows, validated integrations and a backend event model before real healthcare data is introduced.

---

## 👤 Author

**Mahendra Sai Kondaveeti**

GitHub: https://github.com/mahitech580

---

<p align="center">
  <strong>Averis Care Command</strong><br>
  Better care starts with better coordination.
</p>
