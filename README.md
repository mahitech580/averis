# AVERIS by Mahi

**SIMULATED / LOCAL**

AVERIS is an advanced browser-only portfolio simulation for healthcare coordination and operational intelligence. The product model is operational: people, journeys, work, scheduling, capacity, workforce, diagnostics workflow, inventory, administration, communication, incidents, quality, insights, reporting and audit.

## Live
https://mahitech580.github.io/averis/

## Safety boundary
All visible records are synthetic. AVERIS does not connect to real patients, healthcare systems, laboratories, pharmacies, payment processors or external AI providers. It does not diagnose, recommend treatment, make clinical decisions, or send messages outside the browser.

The Diagnostics and Pharmacy workspaces demonstrate operational workflows only. The People drawer can show synthetic medication/pharmacy context, explicitly marked as non-clinical portfolio data.

## Product structure
- Today — editorial decision surface: What matters right now?
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
