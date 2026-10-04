# AVERIS by Mahi · Operations OS

> **A browser-local healthcare operations website for understanding, coordinating and simulating a complex operational environment.**

**Live website:** https://mahitech580.github.io/averis/  
**Repository:** https://github.com/mahitech580/averis  
**Environment:** `SIMULATED / LOCAL`  
**Owner:** Mahi

---

## 1. What AVERIS is

AVERIS is a portfolio-grade static website that demonstrates how a complex healthcare-operations environment can be presented as one connected operating surface.

The product is intentionally designed as a **website first**, not as a generic admin dashboard. The first route is **Website Overview**, which explains the complete product before visitors enter an individual workspace.

The website connects operational concepts that are often shown as separate tools:

- people and coordination
- journeys and handoffs
- workflow and queue management
- schedules and appointments
- capacity and resources
- workforce balance
- diagnostics workflow tracking
- pharmacy inventory
- finance records
- local communication
- incident lifecycle
- quality assurance
- operational intelligence
- deterministic assistant responses
- reports and exports
- local audit history
- settings and persistence

Everything in the operational dataset is synthetic and stays inside the browser.

---

## 2. Product promise

AVERIS is built around one simple idea:

> **Understand the operating environment first, then move deliberately into the work that needs attention.**

The experience follows this flow:

**Understand → Coordinate → Prioritize → Act locally → Review → Govern**

The Website Overview provides the map. The workspaces provide the detail. Local state connects the interactions so the application behaves like a coherent product instead of a collection of static screens.

---

## 3. Website Overview

The home route is `#/today` and is intentionally structured as a real product website.

### What the visitor sees

**Website Overview**  
Explains what AVERIS contains, how the 18 workspaces connect, and where to go next.

**Capabilities**  
Introduces the major operating areas before asking the visitor to open a workspace.

**How it Works**  
Shows a simple three-step model:

1. **SEE** — bring the signal into focus.
2. **PRIORITIZE** — decide what matters next.
3. **ACT LOCALLY** — change the synthetic state.

**Operational Layers**  
Connects the overview to scheduling, workforce, diagnostics, pharmacy, finance, messaging, incidents and quality.

**Environment**  
Uses representative healthcare photography for presentation while keeping all operational records synthetic.

**Built-in Boundary**  
Makes the local simulation boundary explicit. The interface never presents synthetic workflow data as real clinical data.

**Start Here**  
Provides direct actions into operational workspaces, intelligence and settings.

The overview avoids redundant hero KPI cards and floating metric noise. Its primary job is to explain the product clearly.

---

## 4. The 18 connected workspaces

| Workspace | Group | What it demonstrates |
|---|---|---|
| Website Overview | Entry | Complete product map and navigation |
| People | Coordination | People records, ownership, attention and context |
| Journeys | Coordination | Journey stages, handoffs and movement |
| Queue | Execution | Prioritized operational work and blockers |
| Schedule | Execution | Appointments, time slots and local movement |
| Capacity | Execution | Resource state, utilization and pressure |
| Workforce | Execution | Workload, role balance and coverage |
| Diagnostics | Execution | Synthetic workflow result tracking |
| Pharmacy | Execution | Inventory quantities, thresholds and adjustments |
| Finance | Execution | Synthetic ledger and transaction workflows |
| Messages | Coordination | Local message threads and replies |
| Incidents | Governance | Severity, lifecycle and containment states |
| Quality | Assurance | Synthetic workflow-quality indicators |
| Insights | Intelligence | Derived metrics, trends and operational signals |
| Assistant | Intelligence | Deterministic, browser-local operational summaries |
| Reports | Intelligence | Preview, run and export reporting workflows |
| Audit | Governance | Local history of user-triggered changes |
| Settings | Governance | Profile, density, notifications, persistence and reset |

---

## 5. Navigation

The global website navigation is intentionally small and clear:

**Website Overview · People · Journeys · Workflow · Capacity · Insights · Reports**

The detailed workspaces remain reachable through overview sections, command search, workflow links and explicit actions.

This keeps the top navigation understandable on desktop, tablet and mobile rather than exposing every internal workspace at once.

---

## 6. Interaction model

AVERIS follows an explicit-interaction design.

### Click behavior

Decorative surfaces are not treated as accidental actions.

Clicking empty page space, headings, images, background areas or decorative surfaces does not trigger navigation or workflow changes.

Application interactions are performed through deliberate controls:

- buttons
- form controls
- command-search controls
- submit controls
- explicit inspect/open controls
- explicit create/edit/save controls
- explicit workflow transition controls

This is intentionally strict so the interface feels controlled rather than making every visual block appear clickable.

### Keyboard behavior

**Ctrl + K** opens command search on Windows/Linux.

**Cmd + K** opens command search on macOS.

**Escape** closes active overlays/drawers.

Command search supports keyboard navigation with:

- Arrow Up
- Arrow Down
- Enter
- Escape

---

## 7. Local-first state model

AVERIS uses browser storage instead of a remote application server.

### Local state includes

- profile information
- synthetic people
- tasks
- appointments
- resources
- workforce records
- diagnostic records
- pharmacy inventory
- finance records
- messages
- incidents
- audit history
- preferences
- interface settings

State changes are persisted to the browser and reflected throughout the connected workspaces.

This allows the project to demonstrate real application behavior on GitHub Pages without exposing operational state to an external backend.

---

## 8. Synthetic data boundary

AVERIS is a simulation and portfolio project.

### The system is intentionally limited to

- synthetic records
- browser-local state
- deterministic local logic
- static hosting
- presentation-only healthcare imagery
- workflow and operations concepts

### The system does not provide

- real patient records
- production healthcare integrations
- diagnosis
- treatment recommendations
- clinical decision support
- real patient messaging
- real appointments
- real financial transactions
- external AI API calls
- production automation
- real-world medical advice

The interface is an engineering and product demonstration, not a clinical system.

---

## 9. Core workflows

### People workflow

Search people by:

- name
- ID
- cluster
- attention

Sort and inspect a record, review related work, and open synthetic context.

### Journey workflow

View synthetic journey stages and inspect where people sit in the operating flow.

### Queue workflow

Search work, filter by:

- all
- critical
- blocked
- open

Then inspect tasks or deliberately advance their synthetic state.

### Schedule workflow

Inspect an appointment or use the explicit **Move +30m** action to change its local simulated time.

### Capacity workflow

Inspect resources, review utilization and add synthetic resources.

### Workforce workflow

Review workload distribution and create additional synthetic workforce records.

### Diagnostics workflow

Create and inspect workflow-result records.

### Pharmacy workflow

Inspect inventory, adjust quantity, and create local inventory entries.

### Finance workflow

Inspect transactions, create new synthetic records and export JSON.

### Messages workflow

Open local threads, compose messages and send simulated replies.

### Incidents workflow

Inspect incidents and advance their lifecycle through explicit state transitions.

### Quality workflow

Run a local quality pass against the synthetic operating state.

### Insights workflow

Review derived operational metrics and export analytics as JSON.

### Assistant workflow

Use deterministic presets such as:

- What needs attention?
- Summarize today
- What are AVERIS boundaries?

Responses are generated from the current browser-local state.

### Reports workflow

Preview reports, run reports and export report data.

### Audit workflow

Review locally recorded changes created by supported actions.

### Settings workflow

Manage profile details, display density, notification preference, export and reset behavior.

---

## 10. Responsive website behavior

AVERIS is designed to remain usable across:

**Desktop / Laptop**  
Wide content areas, multi-column layouts, tables, navigation and detailed workspaces.

**Tablet**  
Reduced density, wrapping navigation, flexible grids and horizontally scrollable data tables where needed.

**Mobile**  
Single-column layouts, readable typography, touch-sized controls, wrapped content, responsive tables and compact navigation.

The responsive design goal is not simply to shrink desktop content. Components reflow based on available width so text remains readable and controls remain accessible.

---

## 11. Visual system

AVERIS uses a cinematic healthcare-operations aesthetic without turning the interface into a generic SaaS template.

### Visual principles

- strong editorial hierarchy
- readable body copy
- controlled dark interface
- high-contrast controls
- restrained glass surfaces
- healthcare environment imagery
- section-level background photography
- consistent spacing
- clear interaction states
- responsive content widths
- explicit simulation boundary

The Website Overview uses image-backed sections to create a website-like storytelling flow.

---

## 12. Accessibility and usability intent

The implementation emphasizes:

- semantic button controls
- explicit button labels
- `type="button"` on non-submit buttons
- readable text sizing
- visible state changes
- predictable keyboard controls
- alt text for presentation imagery
- responsive wrapping
- horizontal overflow for wide tables
- deliberate click targets
- reduced accidental interactions

The project remains a portfolio simulation, so this is not a claim of formal WCAG certification.

---

## 13. Technical architecture

AVERIS is a static client-side application.

### Front end

**HTML**
- application shell
- site header
- global navigation
- workspace root
- overlays
- drawers
- footer
- semantic controls

**CSS**
- global reset and base styling
- responsive layout system
- website landing sections
- workspace cards
- tables
- forms
- drawers
- command search
- mobile breakpoints
- dark visual system
- interaction states

**JavaScript**
- routing
- rendering
- local state
- localStorage persistence
- command search
- forms
- workspace interactions
- synthetic state transitions
- reports
- exports
- notifications
- profile drawer
- focus mode
- audit trail
- PWA registration

### Hosting

The project is intended for:

**GitHub Pages**

No application server is required.

---

## 14. Project structure

```text
averis/
├── index.html
├── styles.css
├── app.js
├── sw.js
├── manifest.webmanifest
├── README.md
└── .github/
    └── workflows/
        └── pages.yml
```

### `index.html`

Defines the stable application shell and global website structure.

### `styles.css`

Contains the visual system, responsive layout rules, landing-page presentation and workspace styling.

### `app.js`

Contains application routing, rendering, state, persistence and interactions.

### `sw.js`

Registers the service worker and maintains the static cache for the GitHub Pages experience.

### `manifest.webmanifest`

Defines the installable web-app metadata.

### `.github/workflows/pages.yml`

Builds and deploys the static project to GitHub Pages.

---

## 15. Routing model

AVERIS uses browser hash routing so it works on static GitHub Pages hosting.

Examples:

```text
#/today
#/people
#/journeys
#/queue
#/schedule
#/capacity
#/workforce
#/diagnostics
#/pharmacy
#/finance
#/messages
#/incidents
#/quality
#/insights
#/assistant
#/reports
#/audit
#/settings
```

The application can move between these routes without requiring a server-side router.

---

## 16. Persistence model

The application uses `localStorage` for client-side persistence.

The pattern is:

```text
UI action
   ↓
state mutation
   ↓
audit entry when applicable
   ↓
save()
   ↓
render()
   ↓
updated interface
```

This makes the demo behave like an actual local application while retaining static hosting.

---

## 17. Export model

Supported areas can export browser-generated JSON snapshots.

Exports are intended for demonstration and debugging.

They are not connected to a real healthcare information system.

---

## 18. Service worker and cache versioning

The service worker keeps a named cache for the static application assets.

Cache-busting query versions are used on core JavaScript/CSS references so updated deployments can invalidate stale browser resources.

When changing core front-end assets:

1. update the asset query version
2. update the service-worker cache name
3. deploy
4. verify the generated GitHub Pages workflow

This project is intentionally static, so cache hygiene matters.

---

## 19. Deployment

The intended deployment target is:

**GitHub Pages**

The GitHub Actions workflow runs syntax validation before publishing the static site.

A successful deployment should result in:

https://mahitech580.github.io/averis/

### Typical deployment flow

```text
Commit
  ↓
GitHub Actions
  ↓
JavaScript syntax check
  ↓
GitHub Pages upload
  ↓
Live static website
```

---

## 20. Quality assurance checklist

Before considering a release complete, verify:

### Code health

- `node --check app.js`
- no invalid JavaScript literals
- no broken asset references
- no malformed HTML generated by JavaScript
- no stale cache versions
- no accidental duplicate controls

### Navigation

- Website Overview opens
- People opens
- Journeys opens
- Workflow opens
- Capacity opens
- Insights opens
- Reports opens
- detailed workspace routes remain reachable

### Buttons

Each explicit button should either:

- navigate
- open a drawer
- open a modal
- submit a form
- update local state
- export data
- refresh the view
- open command search
- close an active surface

### Interaction safety

- clicking empty areas does nothing
- clicking images does nothing
- clicking headings does nothing
- clicking decorative surfaces does nothing
- form controls remain usable
- buttons retain their intended actions

### Responsive QA

Test at:

- wide desktop
- laptop
- tablet portrait
- tablet landscape
- mobile portrait
- narrow mobile

Check for:

- clipped headings
- overlapping text
- broken buttons
- horizontal overflow outside intended table containers
- hidden form labels
- unreadable typography
- navigation collision
- image cropping that hides content
- drawer overflow
- modal overflow

---

## 21. Interaction coverage

The project contains explicit handling for major action groups including:

```text
go-*
new-*
edit-person:*
save-*
task-state:*
reopen-task:*
move-appointment:*
reply:*
incident:*
export-*
run-quality
refresh-view
assistant-run
logout
toggle-password
open-login
open-register
login-demo
```

The implementation uses both direct button IDs and `data-action` routing for predictable event handling.

---

## 22. Command search coverage

The command interface can surface:

- workspaces
- people
- tasks

Results are explicit button controls and can be activated with mouse/touch or keyboard navigation.

This keeps command-search behavior compatible with the site's intentional button-first interaction model.

---

## 23. Why the home page is not a dashboard

A traditional dashboard often begins with a grid of metrics.

AVERIS starts differently.

The first page answers:

**What is this website?**  
**What areas does it contain?**  
**How do those areas connect?**  
**Where should the visitor go next?**

Metrics still exist inside the operational workspaces where they are meaningful.

The homepage instead behaves like a product introduction and operating-model map.

---

## 24. Portfolio engineering value

AVERIS demonstrates several engineering skills in a single static project:

- responsive front-end architecture
- semantic HTML
- component-like rendering helpers
- client-side routing
- state modeling
- local persistence
- CRUD-style interactions
- deterministic business logic
- search and filtering
- command palette UX
- workflow transitions
- export flows
- audit tracking
- PWA/service-worker integration
- responsive tables
- mobile adaptation
- GitHub Pages deployment
- CI syntax validation
- product-oriented information architecture

---

## 25. Healthcare presentation boundary

Healthcare imagery is used only to establish visual context.

The presence of healthcare environments does not mean AVERIS is connected to:

- hospitals
- clinics
- laboratories
- pharmacies
- insurers
- patient portals
- electronic health records

All such operational records displayed by the website are synthetic.

---

## 26. Security and privacy model

There is no remote data service in the application.

The intended privacy boundary is:

```text
Browser
 ├── UI
 ├── synthetic state
 ├── localStorage
 ├── deterministic logic
 └── optional service-worker cache
```

The project does not send its synthetic operational state to an application server.

This should not be confused with a formal security audit or production healthcare compliance certification.

---

## 27. Development notes

When extending the project:

### Add a workspace

1. add the route metadata
2. add the navigation entry when appropriate
3. add a renderer function
4. connect the route to the render switch
5. add explicit buttons
6. add action handling
7. add state only when needed
8. add responsive CSS
9. add audit behavior for meaningful mutations
10. run syntax validation

### Add a new action

Prefer:

```html
<button type="button" data-action="example-action">
  Example action
</button>
```

Then handle the action centrally.

### Avoid accidental interactions

Do not make an entire visual card clickable unless that interaction is a deliberate product decision. Prefer a clear button such as:

```html
<button type="button">Open profile</button>
```

---

## 28. Current product identity

**AVERIS**  
**by Mahi**  
**OPERATIONS OS**

The project is positioned as a modern browser-local operating surface for complex healthcare coordination and operational workflows.

It is designed to be understood quickly, explored deeply and run entirely as a static website.

---

## 29. Live links

**Website:**  
https://mahitech580.github.io/averis/

**Website Overview:**  
https://mahitech580.github.io/averis/#/today

**GitHub repository:**  
https://github.com/mahitech580/averis

---

## 30. Final boundary

AVERIS is a **synthetic healthcare-operations portfolio simulation**.

Use it to demonstrate:

**product thinking · UI engineering · workflow modeling · front-end architecture · responsive design · browser-local persistence · operational storytelling**

Do not use it as:

**a clinical system · patient record system · medical decision tool · production healthcare integration**

---

## 31. Credits

**Project:** AVERIS  
**Creator:** Mahi  
**Deployment:** GitHub Pages  
**Runtime:** Browser-local  
**Data:** Synthetic  
**Architecture:** Static client-side application
