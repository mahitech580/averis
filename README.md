# AVERIS by Mahi

**SIMULATED / LOCAL**

AVERIS is a browser-local healthcare operations website that gives a clear view of how a complex healthcare operating environment fits together. The Home page explains the product at a glance, while the individual workspaces let you explore people, journeys, workflow, schedules, capacity, communication, incidents, intelligence, reports and governance in more detail. Everything is synthetic and runs locally in the browser.

## Live
https://mahitech580.github.io/averis/

## Safety boundary
All visible records are synthetic. AVERIS does not connect to real patients, healthcare systems, laboratories, pharmacies, payment processors or external AI providers. It does not diagnose, recommend treatment, make clinical decisions, or send messages outside the browser.

The Diagnostics and Pharmacy workspaces demonstrate operational workflows only. The People drawer can show synthetic medication/pharmacy context, explicitly marked as non-clinical operational data.

## Product experience
The interface uses a cinematic healthcare-control-room presentation with realistic healthcare photography, responsive cards, larger readability-focused typography, dark mode, light mode, live operational signals, and local interactive workflows. Visual imagery is used as contextual presentation only; the application remains synthetic and non-clinical.

## Product structure
- Home / Website Overview — the clear starting page for the entire website. It explains what AVERIS is, what each workspace does, how the operational layers connect, and where to go next.
- People — search, filter, sort, profiles, journeys, work, appointments, diagnostic workflow, synthetic medication context, messages and activity.
- Journeys — stage, progress, ownership and person counts.
- Queue — create/edit, owner assignment, priority, state, complete/reopen and blocked movement.
- Schedule — create/edit, inspect, state changes and explicit +60 minute synthetic move.
- Capacity — resources, occupancy, availability, synthetic person linkage and state transitions.
- Workforce — add/edit, state and workload.
- Diagnostics — create/edit, inspect, workflow state and synthetic result note.
- Pharmacy — quantity, minimum, low-stock state, variance and local adjustment.
- Finance — create/edit, inspect, state progression and local export.
- Messages — compose/send, open, read/unread and reply locally.
- Incidents — open, contain, monitor, resolve and inspect.
- Quality — transparent arithmetic quality checks, not clinical quality measures.
- Insights — synthetic trends and explainable signals.
- Assistant — deterministic rules over local state; no external model call.
- Reports — preview, run, ready/exported state and local JSON export.
- Audit — local history.
- Settings — theme, profile, density, notifications, export and deterministic reset.

## Visual system
- Dark-only cinematic interface with persistent browser-local application state.
- Responsive command-center layout for desktop, tablet and mobile.
- Realistic healthcare imagery with readability overlays across major workspaces.
- Local interaction patterns: drawers, modals, command search, forms, state transitions, exports and toasts.
- No rotating rainbow button effect; controls use restrained operational emphasis.

## Architecture
The application is framework-free and deployed as static files to GitHub Pages.

`index.html` is the accessible shell.  
`styles.css` is the visual system.  
`app.js` owns routing, state, rendering and local workflows.  
`manifest.json` and `sw.js` provide PWA metadata and caching.  
`assets/` contains local SVG artwork.  
`generate_data.py` creates deterministic JSON/CSV/SQLite synthetic fixtures.  
`schema.sql` defines relational tables, constraints, indexes, views, triggers and reporting queries.

All asset paths are relative so the project is portable under `/averis/`.

## Persistence
State is stored in browser `localStorage` under a versioned AVERIS key. The runtime:
1. seeds deterministic synthetic records when empty,
2. repairs missing collections during migration,
3. recovers from corrupted JSON,
4. records local audit events for workflow changes,
5. exports browser-local JSON,
6. resets the browser state without modifying GitHub.

The clock updates once per second without replacing the workspace DOM.

## QA
The Pages workflow validates JavaScript with `node --check app.js` and Python with `python -m py_compile generate_data.py` before uploading the Pages artifact. Manual browser QA should verify routes, forms, filters, sort, drawers, state transitions, search, persistence, export, responsive layouts and the synthetic-only boundary.

## Repository
GitHub: https://github.com/mahitech580/averis  
Author: **Mahi**


## Website overview
Start on **Home** for the clearest explanation of the entire AVERIS website. The page introduces what AVERIS is, what each workspace does, how the operating layers connect, the synthetic-only boundary, and where to explore next. From there, move into **People, Journeys, Queue, Schedule, Capacity, Workforce, Diagnostics, Pharmacy, Finance, Messages, Incidents, Quality, Insights, Assistant, Reports, Audit and Settings**. Every workspace uses synthetic data stored locally in the browser.

## Positioning
AVERIS demonstrates how a complex healthcare operation can be presented as one understandable operating environment. The website begins with a dedicated overview, then separates the detailed workspaces into clear areas for coordination, execution, capacity, communication, intelligence and governance.
