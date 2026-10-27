# AVERIS application audit and implementation map

**Audit snapshot:** 2026-10-27  
**Repository:** `mahitech580/averis`  
**Branch:** `main`  
**Source revision at audit write:** `322c73b9ac85d0239c8542a73a2237bc88580eea`  
**Production site:** https://averis-saas.netlify.app/  
**Purpose:** Record the implemented architecture, authorization boundaries, feature-to-API map, test coverage, verified defects, and unresolved production release blocker.

> **Data boundary:** AVERIS is a synthetic healthcare-operations coordination demo. It is not a patient-record system, clinical decision-support tool, diagnosis or treatment application. Do not enter real patient data or sensitive production information.

## 1. Repository inventory

The repository has 82 tracked paths at the audit snapshot, including the single-page frontend, static-site build/configuration, FastAPI reference/test backend, a Supabase production Edge Function, PostgreSQL schema/migrations, a Render-hosted inference service configuration, browser/API tests, and optional framework demonstrations.

| Area | Principal files | Responsibility |
| --- | --- | --- |
| Browser shell and routes | `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.json` | Single-page application, visual system, theme state, navigation, local demo state, cloud API calls, service-worker cache |
| Static production build | `netlify.toml`, `_headers`, `_redirects`, `scripts/build_pages.py`, `scripts/validate_site.py` | Clean static-only output, same-origin API rewrite, cache policy and source-revision marker |
| Production API | `supabase/functions/averis-api/index.ts`, `supabase/config.toml` | Server-side authentication/session validation, organization scoping, workspace snapshots, ERP CRUD, activity/audit and model proxy |
| Database | `database/schema.sql`, `database/migrations/*.sql`, `schema.sql` | Postgres schema, foreign keys/indexes, RLS and denial of direct public-role access |
| Test/reference FastAPI | `backend/main.py`, `backend/services/ai_engine.py`, `backend/services/prioritization.py`, `backend/requirements.txt` | Full local/test API, SQLite or configured SQL database, deterministic validation and synthetic ML helpers |
| ML service configuration | `render.yaml`, `requirements-ai.txt` | Isolated hosted inference runtime; production Render mode is configured for AI-only routes |
| Test suites | `tests/test_api.py`, `tests/test_ai_engine.py`, `tests/test_prioritization.py`, `tests/test_frontend_contract.py`, `scripts/ui-smoke.mjs`, `postman/AVERIS-ERP.postman_collection.json` | API/security/data tests, model tests, front-end source contracts, Chromium user journeys and Newman API integration |
| Optional demos | `frameworks/` | Independent Flask/Django/Streamlit/TensorFlow examples; not the Netlify production runtime |

## 2. Production data path and environment boundaries

```text
Browser SPA
  └─ same-origin /api/* on Netlify
      └─ rewrite to Supabase Edge Function: averis-api
          ├─ verifies bearer/session token and organization membership
          ├─ reads and mutates server-side Postgres records
          ├─ serves versioned shared-workspace snapshots and audit events
          └─ calls Render's isolated Python inference service for permitted AI analysis
```

- **Netlify** serves static HTML/CSS/JS/assets. It is not the Python API runtime and does not host the application database.
- **Supabase Edge Function** `averis-api` is the hosted application API. It uses a server-side service key; the service-role key must never be put in a browser bundle or committed source.
- **Supabase PostgreSQL** stores organizations, users, hashed session tokens/expiry/revocation, workspace snapshots, audit events and normalized ERP record envelopes.
- **Render** runs a separate Python inference service with `AI_ONLY=true`; its public routes are deliberately limited to health and synthetic non-clinical inference. It cannot serve the account/ERP API.
- **FastAPI in `backend/main.py`** is exercised by local/CI tests using an isolated SQLite database (and supports a configured SQL URL). It is not the live Netlify data plane.
- **Browser-only/local mode** intentionally supports offline preview behavior. Local workspace records are not evidence of a write to the hosted SQL database.
- Hosted AI is synthetic operational routing/inventory screening only; it is not a clinical model and must be human-reviewed.

## 3. Frontend route inventory

The `app.js` SPA defines the following view routes. `today` is the public overview; `login` and `register` are public authentication screens. Other workspace destinations are client-gated to an authenticated local/cloud session. The server API remains the authority for cloud authorization.

| Route | Principal UI view | Data and behavior observed in source | Hosted API / persistence |
| --- | --- | --- | --- |
| `today` | Public website overview / dashboard | Editorial landing page, capabilities/process sections, CTAs, seeded synthetic summaries | Public route; CTAs navigate to auth or workspace screens |
| `login`, `register` | Sign-in and registration | Local browser account/demo path; cloud login/register when API is reachable; validation and user-facing errors | `POST /api/auth/login`, `POST /api/auth/register`; cloud sessions/server organization when selected |
| `people` | People list | Search/sort seeded or workspace people, profile drawer, add/edit person | Workspace snapshot when cloud authenticated; otherwise local browser state |
| `journeys` | Journey stages | Derived view over synthetic people/journey fields | Workspace snapshot/local state |
| `queue` | Task list | Search/filter UI, inspect task, advance/reopen status, add task | Workspace snapshot/local state |
| `schedule` | Appointments | Inspect and move appointment time; add synthetic appointment | Workspace snapshot/local state |
| `capacity` | Resource/capacity | Resource utilization, inspect/add resource | Workspace snapshot/local state |
| `workforce` | Workforce | Workload summaries and add/inspect workforce data | Workspace snapshot/local state |
| `diagnostics` | Workflow status | Synthetic workflow/result records | Workspace snapshot/local state; not connected to clinical devices/systems |
| `pharmacy` | Inventory alerts | Synthetic items, thresholds and local adjust/add interactions | Workspace snapshot/local state; not a medication/dispensing integration |
| `finance` | Finance list | Synthetic financial entries and local create/state views | Workspace snapshot/local state; not an accounting-system integration |
| `messages` | Messages | Local/synthetic message list and read state | Workspace snapshot/local state; not email/SMS delivery |
| `incidents` | Incident view | Synthetic incident records, creation and status UI | Workspace snapshot/local state |
| `quality` | Quality checks | Quality indicators and synthetic demo records | Workspace snapshot/local state |
| `insights` | Operational analytics | Derived counts, capacity/attention/stock signals | In-page calculations over synthetic/workspace state |
| `assistant` | Assistant and operational triage | Local deterministic assistant; cloud ML call only in authenticated mode | `POST /api/ai/triage` when cloud-connected; user text is not meant to be persisted |
| `reports` | Report templates | Local report building/export and synthetic report state | Workspace snapshot/local state; not an external BI connector |
| `audit` | Change history | Local state audit view; a separate server activity list is available in the workspace screen | `GET /api/activity` for server audit activity |
| `erp` | ERP suite | 15 CRUD collections, search, summary, validated forms, export | ERP API endpoints listed below; tenant-scoped Postgres records when authenticated |
| `workspace` | Live workspace / platform | Health indicator, organization/member/invite management, shared snapshot sync/export and server activity | `/api/health`, `/api/auth/me`, `/api/organization`, `/api/workspace`, `/api/activity`, invite routes |
| `settings` | Settings/preferences | Theme, density, notification preference, profile and export controls | `PUT /api/auth/profile` for cloud name update; other settings/local workspace state as implemented |

**Important interpretation:** several screens contain intentionally synthetic, in-page workflows rather than integrations with external hospital, pharmacy, messaging, finance or clinical systems. The repository describes this boundary; these screens should not be presented as real-world clinical functionality. Cloud workspace state synchronizes an allow-listed set of UI fields into a versioned JSON snapshot; ERP data uses its separate record API.

## 4. Hosted API and test API map

The production Edge Function exposes the `/api` contract below. The local/test FastAPI app implements the same core product contract; use the deployed Edge Function for production and the FastAPI client/tests for isolated API regression checks.

| Endpoint | Purpose | Authentication / scope |
| --- | --- | --- |
| `GET /api/health` | Service/database health; PostgreSQL driver/persistence contract | Public health check; probes database availability |
| `POST /api/auth/register` | Create user and organization | Public; rate-limited and validated |
| `POST /api/auth/login` | Verify credentials and start a session | Public; rate-limited |
| `POST /api/auth/demo` | Create an isolated synthetic demo organization/session | Public, bounded/rate-limited |
| `GET /api/auth/me` | Return current identity | Authenticated session/token |
| `PUT /api/auth/profile` | Update profile name | Authenticated user |
| `POST /api/auth/logout` | Revoke session | Current session |
| `GET /api/organization` | Organization and member summary | Authenticated, server-derived organization |
| `POST /api/organization/join` | Join by invite code | Authenticated; organization membership changed server-side |
| `POST /api/organization/rotate-invite` | Rotate invitation code | Authenticated owner only |
| `GET /api/workspace` | Read shared allow-listed workspace snapshot/revision | Authenticated organization |
| `PUT /api/workspace` | Save allow-listed snapshot with revision conflict checks | Authenticated organization; no client-selected tenant authority |
| `GET /api/activity` | Server audit feed | Authenticated organization |
| `GET /api/erp/modules` | Describe supported ERP modules | Authenticated in app use |
| `GET /api/erp/summary` | ERP counts, low-stock and finance summary | Authenticated organization |
| `GET /api/erp/search` | Cross-collection search | Authenticated organization |
| `GET /api/erp/{collection}` | List/filter records | Authenticated, validated collection and tenant scope |
| `POST /api/erp/{collection}` | Create an ERP record | Authenticated, validated collection and tenant scope |
| `PUT /api/erp/{collection}/{record_key}` | Update an ERP record | Authenticated and tenant-scoped; missing foreign-tenant records do not resolve |
| `DELETE /api/erp/{collection}/{record_key}` | Delete an ERP record | Authenticated and tenant-scoped |
| `POST /api/ai/triage` | Classify operational note | Authenticated; text is sent for transient inference, not persisted |
| `GET /api/ai/inventory/anomalies` | Analyze the organization's inventory | Authenticated tenant scope |
| `GET /api/ai/capabilities` | Describe enabled inference models and data boundaries | Authenticated |
| `POST /api/ai/triage-public` | Public service-only non-clinical triage | Public inference endpoint; bounded synthetic payload, no application identity |
| `POST /api/ai/inventory/anomalies-public` | Public service-only sample inventory screening | Public inference endpoint; bounded synthetic records, no application identity |

The FastAPI backend has **23 explicitly detected decorators in the inspected source scan**, plus create/register endpoints with extra decorator parameters; the complete route contract is exercised through the FastAPI test suite and Postman collection. In cloud mode, UI helpers use a same-origin `/api` path on Netlify and attach the publishable key plus an optional bearer session token. The key is a publishable/browser key, not a service-role credential.

### ERP collections

The source defines 15 collections: `products`, `suppliers`, `purchase_orders`, `customers`, `sales_orders`, `invoices`, `employees`, `projects`, `assets`, `support_tickets`, `production_orders`, `quality_checks`, `leads`, `stock_movements`, and the supported related list/config entries in the module catalog. Verify the canonical list from `ERP_FIELDS` / `ERP_MODULES` when editing schemas; do not accept arbitrary collection names or unchecked record fields.

## 5. Database and data-integrity inventory

Verified through the connected Supabase project read-only tools on 2026-10-27:

| Table | Purpose | Observed row count at audit time |
| --- | --- | ---: |
| `public.organizations` | Tenant/org identity and invitation fields | 1 |
| `public.users` | User, org membership, password hash, role and active status | 1 |
| `public.auth_sessions` | Token hash, user ID, creation/expiry and revocation | 1 |
| `public.workspace_snapshots` | Organization-keyed JSON snapshot, revision and update metadata | 1 |
| `public.server_audit_events` | Organization/actor-scoped server actions | 2 |
| `public.erp_business_records` | Organization, collection, record key, JSON payload and creator/updater metadata | 313 |

- PostgreSQL 17.11 is active and healthy in Supabase region `ap-south-1`.
- The four expected migrations are present: core schema, FK/audit indexes, audit ID type alignment, and public-role deny policies.
- All six listed core tables report row-level security enabled.
- Read-only `pg_policies` inspection returned `deny_public_api_access` policies for `anon` and `authenticated` with `USING(false)` and `WITH CHECK(false)` on each core table.
- The inspected grants query returned no direct `anon` / `authenticated` table grants for those tables; `service_role` holds its privileged grants. Keep privileged calls server-side.
- The Supabase security advisor result contained no lints at the time of inspection. Performance advisor returned informational `unused_index` notices on a small/new database; these were not removed because there is insufficient workload evidence to justify dropping indexes.
- No migration was applied as part of this audit. Do not reset or drop production data as a troubleshooting shortcut.

## 6. Authentication, security and verified fixes

### Existing boundaries verified in source / production metadata

- FastAPI sessions store a digest of an opaque random token, expire/revoke server-side, and use HttpOnly cookies; production cookie settings set Secure and SameSite=None for cross-origin static-hosting compatibility.
- The production Edge Function recognizes an explicit session or bearer token, validates it against server-held session/user data, and derives the organization on the server. Record CRUD predicates include the verified organization ID.
- Organization invitation rotation is owner-only; workspace snapshots use optimistic revision checks. ERP payloads use an allow-list of collections/fields and SKU duplicate validation.
- The Supabase service key is read from the Edge Function runtime environment and is not needed in the public browser app.
- The Edge Function's deployed content was retrieved and compared with the repository source; it was identical at audit time.
- In the FastAPI test suite, existing cases cover invalid origin rejection, auth/session/logout, snapshot allow-list and revision conflicts, invite sharing, ERP CRUD/search/tenant isolation, field validation, SKU uniqueness, non-clinical model output and inventory scope.
- The service is explicitly synthetic/non-clinical. ML output is a routing aid and inventory statistical screen; it is not medical decision-making.

### Defects repaired in source

| ID | Finding / severity | Root cause | Repair | Regression verification |
| --- | --- | --- | --- | --- |
| AVERIS-DEPLOY-01 — Critical release blocker | Netlify production serves stale v30 JS/CSS while the repository source was already on v50 | Current Netlify deploy metadata identifies an API/manual deploy of the old commit; GitHub Actions had no `NETLIFY_AUTH_TOKEN`, and the workflow previously assumed a Git auto-deploy that was not evidenced | Workflow no longer treats an empty token as a deploy; static build adds a source-revision marker, and the production smoke test validates revision, asset versions and caching | Fails explicitly until live Netlify is updated; still unresolved externally |
| AVERIS-API-01 — High functional integration defect | Old static `_redirects` sent `/api/*` to Render's inference-only service | One rewrite target incorrectly conflated ML-only service with app API | `_redirects` now agrees with `netlify.toml` and targets the Supabase `averis-api` function | Source contract test and static validator; production rewrite awaits publication |
| AVERIS-CACHE-01 — High availability/staleness risk | HTML/service worker were not explicitly configured to revalidate and an old immutable bundle could persist | Previous cache rules were broad and asset freshness wasn't checked against exact revision | Explicit per-path cache-control, versioned v52 app/css/service-worker keys, revision marker and live header checks | Static validator; live cache check awaits publication |
| AVERIS-CORS-01 — Medium functional defect | FastAPI's cross-origin preflight rejected browser `apikey` and `Authorization` headers used by the SPA | CORS allowed only `Content-Type` and `X-Averis-Request` despite `apiRequest()` sending credentials and a publishable key | Explicitly allow `Authorization` and `apikey` in the local/test FastAPI CORS middleware; expanded the static-preview preflight regression to assert all four headers | Current CI pytest must pass the enhanced test; this fixes local/test CORS, not the stale Netlify site |\n| AVERIS-XSS-01 — High security defect | 142 direct data-property interpolations rendered workspace values without HTML escaping; user-controlled shared record strings could inject markup | Concatenated HTML templates treated data as trusted markup | Escaped direct property interpolations, sanitized the primary main/drawer/modal markup sinks, and replaced inline image fallback handlers with a delegated safe handler | Added pytest contract test and Chromium XSS regression test. The browser run also exposed the drawer close button being intercepted by the sticky header; its z-index is now raised and the E2E test asserts layering before performing a real click. Verify the final run result from Actions before declaring these regressions passed |

### Known limitations / still to verify

- The production UI and local/test FastAPI behavior are not substitutes for exercising every hosted authenticated endpoint with a dedicated disposable account. The live audit did not perform destructive writes to production data.
- Some UI modules intentionally represent synthetic operations and do not integrate external hospital/pharmacy/messaging/accounting devices or vendors.
- `AI_ONLY=true` means the Render process is an inference service, not the main ERP API.
- This review did not apply schema changes or alter production rows.
- Do not describe the system as clinically validated or production-ready for patient care.

## 7. Test inventory and observed results

| Suite / check | Main coverage | Latest verified observation |
| --- | --- | --- |
| `node --check app.js` | JavaScript parse validation | Passed on v52 source in the current CI run (verify current run before finalizing) |
| `python -m compileall -q generate_data.py backend frameworks tests` | Python module syntax | Passed on the current source revision in the current CI run (verify final run) |
| `python scripts/validate_site.py` | HTML local dependencies, precache/version agreement, expected API rewrite/cache headers | Passed on the current source revision in the current CI run (verify final run) |
| `pytest -q` with isolated SQLite | Backend auth, validation, workspace, ERP CRUD, tenant and ML contracts plus source regressions | The previous complete run reported 36 passed and 3 warnings; the current source adds a new injection contract test |
| Postman/Newman collection | Health, demo/auth/session, ERP list/create/update/search/delete, workspace/org/activity and logout denial | Passed in the previous complete run |
| Chromium `scripts/ui-smoke.mjs` | Public route, route CTAs, auth/local demo, theme persistence, fixed nav, images, footer routes, mobile overflow | Passed in the previous complete run; v52 adds a stored-injection regression that must be checked in the current run |
| Supabase production health | Edge function and database health contract | Passed in prior CI: PostgreSQL persistence confirmed |
| Render ML endpoints | Non-clinical triage and synthetic inventory response contracts | Passed in prior CI |
| Netlify production verification | Live HTML references, actual JS/CSS response, cache policy, service worker version, source SHA marker and same-origin API health | Failed on prior release: expected v50, live app/css v30; must be rerun after publication |

**Latest full workflow:** https://github.com/mahitech580/averis/actions/runs/40470037048  
The workflow is authoritative for the current v52 commit. Do not mark the new injection regression as passed until that run actually completes.

## 8. Release blocker and recovery condition

Source and test changes are committed to `main`. The Netlify integration currently available to this agent supports project/deploy reads but does not expose an authenticated publish or Git-link operation. GitHub Actions reported `NETLIFY_AUTH_TOKEN` absent, so the CLI deploy is skipped and post-publish validation fails honestly when the live site remains stale.

The release is **not live verified** until either (a) the GitHub Actions repository secret `NETLIFY_AUTH_TOKEN` exists and a production CLI deploy completes, or (b) the Netlify project is actually connected to this GitHub repository and `main` so Git continuous deployment runs. Do not paste tokens into source code, commits or chat. After publication, rerun the workflow and check the live `build-revision.txt`, app.js/css v52, service-worker v52, HTTP cache headers and `/api/health` contract.

**Audit conclusion:** source audit and focused repairs have been applied to the repository. This is not a claim that every feature has been individually proven in production. Current production release remains blocked by the disconnected/missing deploy authorization described above.


### Additional UI repair after initial v51 smoke

The first v51 Chromium run failed at the real-user click on `#drawer-close`: the sticky header intercepted pointer events over the top of the drawer. This was a reproducible interaction defect. The v52 source raises `.drawer` to z-index 110 and `.drawer-scrim` to 100; the smoke test now asserts the drawer stacks above the header and then clicks its close button normally. The current CI run on the v52 change is the verification authority.


### Local FastAPI CORS follow-up

On 2026-10-27, source inspection confirmed `apiRequest()` always supplies `apikey`, optionally supplies `Authorization`, and includes credentials; FastAPI's CORSMiddleware had allowed only `Content-Type` and `X-Averis-Request`. The local static-preview preflight test now requests all four headers and asserts all four are allowed. This affects the local/test FastAPI cross-origin path; the hosted production request still traverses Supabase's Edge Function and Netlify's same-origin rewrite.
