# [AVERIS](https://mahitech580.github.io/averis/#/today) by Mahi · OPERATIONS OS

> **A browser-local healthcare operations website for understanding, coordinating and simulating complex operational workflows.**

**Environment:** `SIMULATED / LOCAL`  
**Live website:** https://mahitech580.github.io/averis/  
**Repository:** https://github.com/mahitech580/averis

---

## What is AVERIS?

AVERIS is a complete static healthcare-operations website designed as a portfolio-grade simulation of how a complex operating environment can be understood from one clear starting point and then explored through connected workspaces.

The **Website Overview** is the front door of the product. It explains the entire site, the operating model, the major operational layers, the intelligence layer and the governance boundary before the visitor enters an individual workspace.

The website is intentionally **browser-local and synthetic**. It demonstrates information architecture, responsive UI engineering, workflow state management, local persistence, operational analytics, reporting, search, forms and governance concepts without connecting to real healthcare infrastructure.

AVERIS does **not** diagnose, recommend treatment, make clinical decisions, communicate with real patients, or call external AI services.

---

## Core product story

AVERIS follows a simple operational loop:

**Understand → Coordinate → Prioritize → Act locally → Review → Govern**

The website separates that story into 18 connected workspaces:

| Area | Workspace | Purpose |
|---|---|---|
| Entry | **Website Overview** | Understand the entire product, operating model and navigation |
| Coordination | **People** | Search people records, attention, ownership and context |
| Coordination | **Journeys** | Follow synthetic stages, handoffs and progress |
| Execution | **Queue / Workflow** | Work through open, overdue, blocked and in-progress tasks |
| Execution | **Schedule** | Explore appointment flow and controlled local movement |
| Execution | **Capacity** | Inspect resources, occupancy and utilization |
| Execution | **Workforce** | Understand workload and synthetic workforce balance |
| Execution | **Diagnostics** | Demonstrate operational diagnostic workflow tracking |
| Execution | **Pharmacy** | Demonstrate inventory and threshold workflows |
| Execution | **Finance** | Explore synthetic operational finance records |
| Coordination | **Messages** | Read, compose and reply to local synthetic threads |
| Governance | **Incidents** | Progress incident lifecycle states |
| Governance | **Quality** | Run transparent synthetic workflow-quality checks |
| Intelligence | **Insights** | Explore trends, metrics and explainable signals |
| Intelligence | **Assistant** | Ask deterministic questions about current local state |
| Intelligence | **Reports** | Preview, run and export synthetic reports |
| Governance | **Audit** | Review local changes made during the session |
| Governance | **Settings** | Manage profile, density, notifications, persistence and reset |

---

## Website Overview

The home route is deliberately different from a traditional administration dashboard.

It acts as a **website-level product introduction**:

### 01 · Complete website picture
A concise explanation of what AVERIS is, what it contains and how the major workspace groups connect.

### 02 · Capabilities
The site introduces the core operational capabilities before sending the visitor into the detailed workspaces.

### 03 · How it works
The operating model is shown as three understandable moves:

**SEE** → understand the signal  
**PRIORITIZE** → decide what matters next  
**ACT LOCALLY** → modify the synthetic operational state

### 04 · Operational layers
The overview connects the high-level story to schedules, workforce, diagnostics, pharmacy, finance, messages, incidents and quality.

### 05 · Environment
Healthcare imagery is presentation-only. The underlying records remain synthetic.

### 06 · Boundary & privacy
The product makes the simulation boundary explicit instead of making the interface look like a live clinical system.

### 07 · Start here
Clear actions move directly into operational workspaces, intelligence and settings.

The overview intentionally avoids fake dashboard noise such as redundant KPI cards. The hero focuses on **what AVERIS is and where the visitor should go next**.

---

## Interaction model

AVERIS is designed so that the interface does not make every card or visual surface appear clickable.

### Explicit controls
Application actions are triggered by deliberate controls such as:

- navigation buttons
- action buttons
- form submission controls
- command-search results
- explicit create/edit/save controls
- explicit workflow transition controls

Decorative cards, headings, images and empty page regions are not treated as application buttons.

### Command search

Use:

**Ctrl + K** on Windows/Linux  
**Cmd + K** on macOS

The command surface searches the local AVERIS environment and provides direct workspace navigation.

### Drawers and modals

The interface uses contained drawers and modal forms for:

- person inspection
- task inspection
- appointment inspection
- resource inspection
- workforce inspection
- diagnostic inspection
- finance inspection
- message threads
- incidents
- profile/settings actions
- record creation and editing

### Local state changes

Workflow controls can change the synthetic state in this browser, including:

- task state progression and reopening
- appointment movement
- incident lifecycle progression
- inventory quantity adjustment
- message read/reply state
- report state
- profile and preference updates
- local audit entries

---

## Button and interaction QA

The current source was checked for action wiring after the recent interaction changes.

### Static checks completed

- **18/18 navigation route IDs** are represented in the route map.
- **39 exact button action IDs** used by generated/static buttons have matching handlers.
- **No unhandled exact action IDs** were found in the current `app.js`.
- Dynamic action families are handled for people editing, task transitions, appointment movement, message replies and incident transitions.
- The global click guard recognizes an actual `button` before allowing an application action.
- Non-control page clicks are prevented from triggering application behavior.
- The removed hero KPI cards (**10 open work** and **59% resource load**) are no longer rendered.
- The removed **AVERIS CONTROL LAYER / browser local** hero panel is no longer rendered.
- The current `app.js` contains no literal escaped-newline corruption from the previous failed click-handler edit.

### CI validation

The GitHub Pages workflow validates the application JavaScript with:

```bash
node --check app.js
```

and validates the synthetic data generator with:

```bash
python -m py_compile generate_data.py
```

A full browser smoke test should still be used when making large UI changes, especially across real desktop, tablet and mobile browsers.

---

## Responsive design

AVERIS is intended to remain usable across:

**Desktop · Laptop · Tablet · Mobile**

The layout uses flexible grids, fluid widths, responsive navigation, contained media, flexible controls and breakpoint-specific spacing rather than relying on a single fixed desktop canvas.

The current shell is designed around:

- sticky website header
- responsive primary navigation
- flexible workspace content
- responsive image containers
- drawer/modal containment
- horizontal scrolling for dense tables instead of page-level overflow
- readable text widths
- touch-friendly controls on smaller screens
- portrait and landscape adaptation
- viewport-safe sizing
- reduced visual density where needed

The website should be checked at narrow mobile widths as well as larger desktop widths because the application contains tables, forms, drawers and command interfaces in addition to the marketing-style overview.

---

## Accessibility and usability

The shell includes:

- semantic header, navigation, main and footer structure
- a **Skip to workspace** link
- explicit button types
- visible focus treatment
- accessible labels for icon-only top actions
- dialog semantics for command search and modal surfaces
- `aria-live` for toast notifications
- readable text hierarchy
- controlled content widths to reduce overlapping text

The visual system prioritizes clear hierarchy rather than relying only on color.

---

## Safety boundary

AVERIS is a **portfolio simulation**, not a clinical application.

### Synthetic only

All records are synthetic examples created for demonstration.

### Browser local

Application state is kept in the browser through local persistence.

### No real patient integration

AVERIS does not connect to:

- hospital information systems
- electronic health records
- real laboratories
- real pharmacies
- payment processors
- patient communication providers
- production scheduling systems
- external clinical decision systems

### No clinical decisioning

Diagnostics and Pharmacy demonstrate **operational workflows only**. Their data must not be interpreted as medical advice, a diagnosis, treatment guidance or clinical recommendations.

### No external AI calls

The Assistant uses deterministic local rules over the current synthetic state. It is not an external AI service and does not transmit the local simulation to an AI provider.

---

## Architecture

AVERIS is intentionally framework-free and deployable as static files.

### `index.html`

The application shell and accessible page structure.

Contains the website header, primary navigation, workspace mount point, footer, overlays, modal containers, drawer container and client-side script/style references.

### `styles.css`

The visual system.

Responsible for:

- dark interface foundations
- typography
- responsive grids
- workspace components
- cards and tables
- forms
- drawers and modals
- website-style overview sections
- healthcare image presentation
- mobile/tablet breakpoints
- focus and interaction states
- responsive overflow containment

### `app.js`

The application runtime.

Responsible for:

- route definitions
- hash navigation
- synthetic state
- rendering
- local persistence
- migrations/repair logic
- workspace actions
- forms
- command search
- drawers
- modals
- toasts
- exports
- audit events
- assistant rules
- local workflow transitions

### `manifest.json`

PWA metadata for installable/app-like browser behavior.

### `sw.js`

Service-worker caching for the static website shell and local assets.

### `assets/`

Local interface artwork such as the AVERIS orbit mark.

### `generate_data.py`

Deterministic synthetic fixture generation for development/demo data.

### `schema.sql`

Relational schema reference containing synthetic operational entities, constraints and reporting-oriented database structures.

---

## Local persistence model

The application uses versioned browser storage.

The runtime is designed to:

1. create a deterministic synthetic dataset when no local state exists,
2. restore missing collections during state repair,
3. recover from malformed local JSON,
4. persist workflow changes locally,
5. add audit records for relevant changes,
6. export local state to JSON,
7. reset the synthetic workspace back to a clean seed.

Resetting the application changes only the current browser state. It does not modify the GitHub repository.

---

## Workspace behavior

### People
Search and sort synthetic people records, inspect operational context, open journeys, review tasks and related activity, and create/edit records.

### Journeys
View synthetic progression across journey stages and operational handoffs.

### Queue
Search, filter and inspect work; advance task states, reopen tasks and create new work.

### Schedule
Inspect appointments, create records and move a synthetic appointment forward by 30 minutes.

### Capacity
Inspect resource state, utilization and ownership; add resources.

### Workforce
Inspect workforce state and load; add workforce records.

### Diagnostics
Create and inspect operational diagnostic workflow records and their synthetic state.

### Pharmacy
Inspect inventory and adjust local synthetic quantities.

### Finance
Inspect synthetic finance records, progress their state and export finance data.

### Messages
Open local threads, mark messages read and send simulated replies.

### Incidents
Inspect incidents and advance the lifecycle from open through investigation, containment and resolution.

### Quality
Run transparent synthetic quality checks without presenting clinical quality claims.

### Insights
Review synthetic operational metrics and export local analytics JSON.

### Assistant
Use deterministic local prompts to surface attention, brief operational summaries and the synthetic/local boundary.

### Reports
Preview reports, run them locally and export report/state information.

### Audit
Review browser-local change history.

### Settings
Update local profile information, notification preference, display density, export state and reset the demo.

---

## Data and exports

The application can export browser-local information without sending it to a server.

Examples include:

```
averis-state.json
averis-audit.json
averis-finance.json
averis-analytics.json
```

These files represent synthetic demo state and should be treated as development/portfolio artifacts, not production healthcare records.

---

## Visual direction

The visual system is built around a **dark operational environment** with healthcare-context imagery and restrained interface emphasis.

Key principles:

- website-style introduction first
- operational workspaces second
- clear text hierarchy
- realistic but presentation-only healthcare imagery
- responsive layouts instead of fixed desktop compositions
- controlled glass/surface treatments
- restrained motion
- clear action hierarchy
- no decorative interaction that behaves like an invisible button
- no rotating rainbow button effect
- no fake clinical claims

The Overview is intentionally more editorial and explanatory than the detailed operational workspaces.

---

## GitHub Pages deployment

AVERIS is designed for static hosting on GitHub Pages.

Live target:

https://mahitech580.github.io/averis/

All runtime asset paths are relative so the project remains portable under:

```
/averis/
```

The Pages workflow validates the JavaScript and Python sources before publishing the static site.

---

## Recommended development workflow

For a UI or interaction change:

1. update the relevant source file,
2. keep route/action IDs consistent,
3. run JavaScript syntax validation,
4. inspect responsive behavior,
5. verify the affected control flow,
6. verify persistence and state transitions where applicable,
7. update documentation when product behavior changes,
8. deploy through GitHub Pages.

For larger changes, test the Website Overview and at least one workspace from each major group: coordination, execution, intelligence and governance.

---

## Project identity

**AVERIS**  
**by Mahi · OPERATIONS OS**

A portfolio project demonstrating how a complex healthcare operational environment can be made understandable, navigable and interactive without using real healthcare data or production integrations.

---

## Links

**Live:** https://mahitech580.github.io/averis/  
**GitHub:** https://github.com/mahitech580/averis  
**Home / Website Overview:** https://mahitech580.github.io/averis/#/today

---

## License / usage

This project is a portfolio and demonstration application. The healthcare terminology, records and operational signals are synthetic and intended only to demonstrate interface and workflow concepts.
