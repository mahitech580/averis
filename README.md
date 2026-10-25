# AVERIS by Mahi · Operations OS

> **A browser-local healthcare operations website for understanding, coordinating and simulating a complex operational environment.**

**Live website (Netlify):** https://averis-saas.netlify.app  
**GitHub Pages:** https://mahitech580.github.io/averis/  
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

AVERIS uses a static HTML/CSS/JavaScript frontend and an optional FastAPI service for real accounts and shared workspaces. The GitHub Pages version remains a browser-local synthetic preview.

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

AVERIS is a static client-side application and is published at these URLs:

- **Netlify:** https://averis-saas.netlify.app
- **GitHub Pages:** https://mahitech580.github.io/averis/

GitHub Pages is deployed by `.github/workflows/pages.yml` from `main`. Netlify publishes a separate deployment, so verify that deployment independently when a change must appear on both hosts. No application server is required.

---

## 14. Project structure

```text
averis/
├── index.html
├── styles.css
├── app.js
├── sw.js
├── manifest.json
├── scripts/
│   └── validate_site.py
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

### `manifest.json`

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

The GitHub Actions workflow validates JavaScript and Python syntax, checks local asset references and service-worker cache versions, and then publishes the static site.

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
- `python scripts/validate_site.py`
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

In local-preview mode the project does not send synthetic state to a server. In cloud mode, authenticated synthetic workspace state is intentionally stored server-side and shared within an organization. Login and registration demonstrate a local-only interaction flow, not real authentication: account data is kept in `localStorage`, and the current password hash is a simple non-cryptographic demo hash. Browser storage and client-side checks can be inspected or changed by the user, so this must never be used for real accounts, secrets, or patient information.

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

**Netlify deployment:**  
https://averis-saas.netlify.app

**GitHub Pages website:**  
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
**Deployment:** Netlify and GitHub Pages (static snapshots)  
**Runtime:** Browser-local  
**Data:** Synthetic  
**Architecture:** Static client-side application


## Real-time SaaS architecture

The Netlify frontend is configured to proxy \`/api/*\` to a Render FastAPI service. Accounts use Argon2 password hashes and server-side HttpOnly sessions. Organizations can share an invite code; workspace state is stored in SQL JSON columns with optimistic revisions and a five-second polling interval. Non-conflicting record changes are merged; edits to the same record use last-write-wins behavior.

Run the backend locally with the instructions in [backend/README.md](backend/README.md). SQLite is the local default; MySQL via \`mysql+pymysql://...\` and PostgreSQL via \`postgresql+psycopg://...\` are supported through \`DATABASE_URL\`. API health and docs are available at \`/api/health\` and \`/api/docs\` when the Render service is deployed.

The Render Blueprint now asks for an external DATABASE_URL rather than trying to create a second free Render PostgreSQL database. Create a dedicated database for Averis and provide its PostgreSQL connection string when applying the Blueprint. Do not reuse the connection string from another project. Free Render web services can sleep when inactive, so use a suitable compute plan for production responsiveness.

### Product and engineering references

- [Linear search patterns](https://linear.app/docs/search) — command search, keyboard navigation and global filtering.
- [FastAPI SQL database tutorial](https://fastapi.tiangolo.com/tutorial/sql-databases/) — SQLAlchemy and SQL database support.
- [Render FastAPI deployment](https://render.com/docs/deploy-fastapi) — service setup and health checks.
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — Argon2 password hashing guidance.
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — secure cookie/session patterns.

These references inform implementation patterns; they do not imply vendor affiliation or healthcare compliance.


## Unified ERP suite

The shared platform now includes business modules for Inventory/Stock, Suppliers, Procurement, Customers, Sales Orders, Invoices & Finance, HR & Employees, CRM Leads, Projects, Assets, Accounting Journals, Support Tickets, Manufacturing Orders and Quality Checks. Each module has a tenant-scoped CRUD REST API under \`/api/erp/{module}\`, search, validation, audit events and a dashboard summary endpoint at \`/api/erp/summary\`. MySQL, SQLite and PostgreSQL use the same SQLAlchemy models. The browser interface uses HTML5, responsive CSS, JavaScript, Bootstrap utilities, and JSON API calls.

The repo also maintains separate small framework adapters for Flask, Django templates and Streamlit that consume the same FastAPI API; FastAPI remains the primary backend to avoid multiple authorities over ERP data. Postman request examples, Docker and pytest checks are included as engineering/learning assets. These companion adapters are not separately deployed unless configured.


## ERP modules and UI

The ERP Suite route now includes an interactive dashboard plus 15 module workspaces: Inventory, Suppliers, Purchasing, Customers, Sales, Invoices & Finance, HR & Employees, CRM, Projects, Assets, Accounting, Support, Manufacturing, Stock Ledger and Quality. Each module has search, create, edit, delete, and per-module JSON export. When the API is connected, these actions use the tenant-scoped FastAPI CRUD routes; the offline preview uses a separate browser-local demo dataset.

Bootstrap 5 CSS is loaded only when the ERP Suite is opened, rather than blocking the initial site load. The suite uses responsive tables, forms, status indicators, and module cards.


## Full-stack ERP stack

The ERP Suite includes 15 business modules and tenant-scoped CRUD/search APIs. FastAPI and SQLAlchemy are the central API and ORM; Argon2-backed account sessions, revisioned JSON workspace state, SQL JSON ERP records, audit events and reorder-priority logic are implemented. SQLite is the local default; MySQL and PostgreSQL are selectable via `DATABASE_URL`.

The frontend uses HTML5, CSS3, JavaScript, responsive layouts and Bootstrap 5 inside ERP screens. Companion demos show Flask/Jinja, Django templates, Streamlit analytics with Pandas, NumPy, Matplotlib and scikit-learn, plus an optional TensorFlow toy model on generated data. Developer assets include `database/schema.sql`, a Postman collection, Docker, and CI checks. The companion apps call the same FastAPI API and are not separately deployed.


## ERP product-design references

- [ERPNext documentation](https://docs.erpnext.com/index) — Accounting, HR, CRM, Manufacturing, Order Management and Asset Management.
- [Odoo open-source app suite](https://github.com/odoo/odoo) — CRM, Warehouse, Project Management, Billing & Accounting, HR, Marketing and Manufacturing.
- [Netlify rewrites and API proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/) — same-origin /api proxy behavior.
- [Render free-tier limitations](https://render.com/docs/free) — free compute/database resources are suitable for testing, not reliable long-term production storage.

Optional adapters in frameworks/optional_archives.py demonstrate MongoDB audit archiving and S3 JSON backup uploads. They are opt-in; SQL remains the source of truth.


## Hosting and deployment wiring

The Render Blueprint provisions the API service and prompts for a dedicated external PostgreSQL DATABASE_URL. The Netlify frontend uses the same-origin /api proxy to the Render host. A GitHub Actions Netlify deployment step is optional and runs only if the NETLIFY_AUTH_TOKEN repository secret is configured; GitHub Pages deploys independently from main.


## Cloud database setup

A dedicated Supabase project was created for AVERIS in the Mumbai region. Its core tables are provisioned with row-level security enabled; direct public/anonymous table grants are revoked, and the application accesses SQL through the FastAPI server. Render uses a separate \`DATABASE_URL\` secret. For Render's IPv4 network, open the Supabase dashboard → **Connect** → choose the **Session pooler** string, then enter it as \`DATABASE_URL\` while applying the Render Blueprint. Never commit the password or paste it into public source. The Render Blueprint intentionally does not create or reuse another project's database.

Open the [Supabase dashboard for averis-erp-prod](https://supabase.com/dashboard/project/zspustvmjtdsnfkprbvv) and the [Render Blueprint setup](https://dashboard.render.com/blueprint/new?repo=https://github.com/mahitech580/averis). The API is not live until that dedicated connection string is supplied and the Render deploy passes its health check.


### Reproducible database migrations

The Supabase schema changes are also checked into `database/migrations/` with their applied version timestamps. `database/schema.sql` is a clean final-state reference; the timestamped files preserve the applied change order. All six tables use RLS, and `anon`/`authenticated` have no direct table grants plus explicit deny policies. The FastAPI application uses the server-side PostgreSQL connection and applies tenant isolation in the API.

**Finish the Render connection:** open [Supabase Connect settings](https://supabase.com/dashboard/project/zspustvmjtdsnfkprbvv), copy the *Session pooler* connection string (Render uses IPv4), then open the [Render Blueprint](https://dashboard.render.com/blueprint/new?repo=https://github.com/mahitech580/averis) and supply that string for `DATABASE_URL`. Then apply the Blueprint and wait for `/api/health` to pass. Do not paste database passwords into source files or GitHub commits.

**Finish the Netlify update:** create a Netlify personal access token and add it as the `NETLIFY_AUTH_TOKEN` repository secret under GitHub → Settings → Secrets and variables → Actions. The next main-branch CI run will deploy the latest static site to Netlify. Without this secret, the workflow deliberately skips the Netlify publish step.


## Release v32: resilient UI, isolated cloud demo, expanded API tests

- Theme state is respected by every render. Light/dark mode is available in Settings and from the sticky site header.
- All auth hero imagery is now local SVG artwork rather than fragile third-party photo URLs; the service worker caches release-matched assets.
- The API's public demo action creates a dedicated synthetic tenant per run, seeds 313 ERP records across all 15 modules, and never returns a reusable password. Demo creation has per-network and global rolling-window limits.
- Production cookies use Secure/HttpOnly/SameSite=None for browser-to-API flows; frontend fetch sends cookies with \`credentials: include\`. Netlify proxies \`/api/*\` to the Render API to keep the primary deployment on one origin.
- Postman collection now checks health, private demo creation, session identity, 15 module catalogue, summary, ERP CRUD, search, snapshot versioning, organization, audit events and logout.
- Accessibility includes visible focus outlines, reduced-motion support, skip navigation and small-height viewport adjustments. Prefer a same-origin API proxy for reliable browser session cookies.

### Current deployment secret requirements
1. Apply the [Render Blueprint](https://dashboard.render.com/blueprint/new?repo=https://github.com/mahitech580/averis) and supply \`DATABASE_URL\` using the dedicated Supabase project's Session Pooler connection string. Never commit that secret.
2. For the current Netlify project, configure the \`NETLIFY_AUTH_TOKEN\` GitHub Actions secret so CI publishes the latest frontend.
3. The GitHub Pages preview falls back to local demo if the Render API is not reachable. The intended cloud-first host is Netlify with its same-origin \`/api\` proxy.

Supabase security note: connection strings and database passwords remain in dashboard secret fields only. Public \`anon\` and \`authenticated\` roles do not have access to AVERIS business tables; the FastAPI database connection is the trusted server access boundary.


### Link and asset integrity release check

The delegated click handler now preserves normal anchor navigation and external destinations instead of swallowing link clicks. Marketing/auth imagery resolves to repository-local SVGs, avoiding third-party image-host dependence and extra third-party image requests. A persistent theme toggle is wired in the header and Settings, with browser theme-color metadata updated on change.


### Release v33 — resilient imagery + light theme

All CSS background-image references now use repository-local SVGs instead of third-party photo hosts, including landing, capacity, workflow, product-showcase and CTA sections. The complete landing-page light theme received its own surface, overlay, text, card and media contrast rules. Asset links are versioned v33 together with the service-worker cache.


### Browser-level release gate

The main GitHub Actions workflow runs a pinned Chromium/Playwright smoke test against a local static server. It scrolls the sticky header, toggles light/dark and reloads, visits every footer navigation route, checks visible local imagery, opens the offline demo and completes the synthetic signup flow, checks the narrow mobile viewport for horizontal document overflow, and fails on uncaught browser exceptions. This complements the FastAPI pytest suite and Postman API collection.


### Safer static publishing

CI builds a clean `dist/` allowlist containing only the HTML app shell, versioned JavaScript/CSS, service worker, web manifest, local SVG assets, Netlify headers/redirect rules, and a `.nojekyll` marker. GitHub Pages and Netlify publish that output instead of the repository root, keeping backend code, migrations, tests, tooling and temporary SQLite test files out of the public site artifact. The build allowlist itself is covered by pytest.

### API regression suite

The release workflow starts FastAPI against a fresh temporary SQLite database and runs the checked-in Postman collection with Newman. It exercises a server-created isolated demo, session authentication, all 15 ERP modules, summary/search, create/update/delete, workspace revisions, organization, audit feed, logout and rejection of expired access. The suite uses synthetic data and is isolated from the dedicated Supabase database.


The Chromium test revealed the source of sticky-header drift: hidden horizontal overflow on the root/body created a non-viewport scroll ancestor. The final header fix uses `overflow-x: clip` at the document root so horizontal clipping remains without converting the vertical scroll container; the browser smoke test guards the sticky behavior.


Release v34: updated the static asset/service-worker version to force the sticky-header fix into existing browsers; the Chromium smoke test exercises routes from the persistent header and now reports ancestor layout/overflow details if sticky behavior regresses.


Sticky-header fix validation: the header is now viewport-fixed and uses a measured CSS variable to keep page content below it at desktop and mobile breakpoints. This avoids CSS sticky scroll-ancestor edge cases while guaranteeing it remains visible during long page scrolls and route transitions.


Release v35 updates the service-worker and HTML asset references together so browsers do not keep a stale stylesheet or JavaScript bundle after the viewport-fixed header repair.


The Chromium route sweep now authenticates through the browser-local demo before visiting its full persistent footer navigation set, so protected pages are tested as rendered ERP views instead of being masked by the unauthenticated redirect.


The browser signup smoke test asserts the serialized local account/profile record rather than looking for a profile label that is not part of the site header, verifying the actual persistence contract of offline signup.


Release v36: the sign-in screen exposes both the isolated cloud-demo launcher and a browser-only demo at the same time, so a cloud API issue does not hide demo access. The browser smoke test explicitly opens the login route before clicking the offline-demo control, independent of saved browser sessions. Asset version and service-worker cache were advanced together.
