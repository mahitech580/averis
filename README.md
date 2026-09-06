# Averis (mini build)

**Better care starts with better coordination.**

A trimmed-down, single-page version of the Averis healthcare coordination platform. Everything the live site needs is **3 files** — `index.html`, `styles.css`, `app.js` — plus two non-executing extras (`schema.sql`, `generate_data.py`) and this README, as requested.

## What's actually live on GitHub Pages

| File | Role |
|---|---|
| `index.html` | The entire app shell: auth screen, sidebar, topbar, and all 10 views (Overview, Patients, Appointments, Care Hub, Providers, Messages, Tasks, Analytics, AI Insights, Settings). |
| `styles.css` | Full design system — tokens, dark/light themes, motion, layout, components. |
| `app.js` | All logic: synthetic data generation, routing, rendering, localStorage persistence, deterministic AI/ML demos, command palette. |
| `manifest.json` | Optional web-app manifest (icon/name for "Add to Home Screen"). Not required for the site to work. |

**Nothing else is required.** No build step, no `npm install`, no server. Open `index.html` directly or push the folder to GitHub Pages.

## Files that are documentation/utilities only

GitHub Pages only serves static files — it can't run SQL or Python. These two files are included because they were requested, but they are **not loaded or executed by the site**:

- **`schema.sql`** — a reference relational schema showing how the same patients/providers/appointments/tasks model would look in a real database, if Averis were ever connected to one.
- **`generate_data.py`** — a standalone, dependency-free script you can run locally (`python3 generate_data.py --patients 250 --out data.json`) to produce a bigger or different synthetic dataset than the one `app.js` generates in-browser. It's a dev convenience, not part of the deployed app.

## Running it

**Locally:** open `index.html` in a browser, or serve the folder with any static server (`python3 -m http.server`) and visit it.

**GitHub Pages:**
1. Push this folder to a repo.
2. Repo Settings → Pages → deploy from the branch/folder containing these files.
3. Visit `https://USERNAME.github.io/REPOSITORY/`.

All asset paths are relative (`styles.css`, `app.js`), so it works at any sub-path.

## Demo login

```
Email:    admin@averis.demo
Password: averis123
```
Or use "Create a workspace" to sign up with your own demo org (stored only in your browser).

## What's simulated

- **Auth** — localStorage-based, no real backend or password hashing.
- **AI Insights ("Averis Intelligence")** — a deterministic engine that reads the actual in-browser synthetic data (no-show rates, provider workload, overdue follow-ups) and returns a grounded answer, a recommended action, and a confidence score. It does not call any LLM API and does not give diagnostic or treatment advice.
- **ML demos** — no-show risk and provider-workload scoring use small, transparent formulas over synthetic attributes (attendance rate, lead time, prior cancellations, appointment/task counts). They're labeled as demonstration models in the UI.
- **Data** — 24 providers, 128 patients, ~160 appointments, 42 tasks, 26 care-coordination items, all fabricated. No real patient information is used anywhere.

## Resetting demo data

Settings → Security → **Reset demo data** clears everything in localStorage and regenerates a fresh synthetic dataset.

## Notable interactions

- `Ctrl/Cmd + K` — command palette (navigate, create patient/appointment, toggle theme, or search patients/providers/tasks by name).
- Sidebar footer role pill — cycles through Organization Admin / Doctor / Care Coordinator / Receptionist / Patient, which changes which nav items are visible.
- Care Hub cards are drag-and-drop between stages.
- Theme toggle (top right) persists light/dark to localStorage; a subtle cursor-follow glow and slow background texture respect `prefers-reduced-motion`.
