# AVERIS — Healthcare operations coordination SaaS

AVERIS is a multi-tenant **healthcare operations coordination demo** with a responsive web frontend, server-side authentication, organization-scoped ERP records, PostgreSQL persistence, and a separate Python ML service for synthetic operational workflows. It is not a patient-record, diagnosis, treatment, or clinical decision-support system.

## Live deployments

- **Primary frontend:** https://averis-tau.vercel.app/
- **GitHub Pages showcase:** https://mahitech580.github.io/averis/
- **Repository:** https://github.com/mahitech580/averis
- **Supabase project:** https://supabase.com/dashboard/project/zspustvmjtdsnfkprbvv
- **Render Python ML service:** https://averis-platform-api-mahi.onrender.com

The existing Netlify site is optional and may be behind the current main commit while the GitHub secret NETLIFY_AUTH_TOKEN is not configured. Do not assume that the Netlify URL serves the newest build until its deployment commit is checked.

> **Data boundary:** use synthetic/demo data only. Never enter real patient information, diagnoses, treatment plans, production customer records, or other sensitive information into a public preview.

## Product capabilities

- Responsive operations workspace with keyboard-accessible navigation, mobile layout, focus states, reduced-motion support, and dark/light UI treatments.
- Browser-local demo mode and a cloud demo mode that creates an isolated organization and seeds **313 synthetic ERP records across 15 modules**.
- Server-side registration/sign-in, password hashing, expiring/revocable sessions, organization membership checks, and server audit events.
- ERP search, summary counts, low-stock signals, CRUD operations, input validation, duplicate SKU checks, and organization-level data isolation.
- Shared workspace snapshots with optimistic revision checks, so stale writes do not silently overwrite newer state.
- A Python ML service that classifies short synthetic operational notes and screens inventory for reorder risks/anomalies. Its public service mode does not expose account or ERP routes and has no database credentials.
- Postman/Newman integration tests, pytest coverage, Chromium UI smoke tests, production service checks, and static-only publishing.

## ERP modules

| Area | Modules |
| --- | --- |
| Inventory and supply | Products, suppliers, purchase orders, stock movements |
| Commercial | Customers, sales orders, invoices, leads |
| Finance | Journal entries |
| People and delivery | Employees, projects, assets |
| Operations | Support tickets, production orders, quality checks |

The broader workspace also includes navigation for people, journeys, workflow, schedule, capacity, workforce, diagnostics, pharmacy, finance, messages, incidents, quality, insights, assistant, reports, workspace, audit, and settings. These workspace screens include simulated/local interactions; they should not be mistaken for live integrations with external clinical or business systems.

## Production architecture

- **Frontend:** vanilla JavaScript, responsive CSS, semantic HTML, photo-led imagery with bundled SVG fallbacks, a service worker, and a static-only build output.
- **Production app API and data:** the averis-api Supabase Edge Function at https://zspustvmjtdsnfkprbvv.supabase.co/functions/v1/averis-api talks to the Supabase PostgreSQL database. The function uses the managed server-side SUPABASE_SERVICE_ROLE_KEY; the service-role key is not included in frontend code or this repository.
- **Authentication:** the server hashes passwords and stores only a hash of each random session token in auth_sessions. The API issues an HttpOnly cookie and also returns an opaque access token for static-hosting clients; the frontend keeps that token in sessionStorage and sends it as a Bearer token. Browser storage is JavaScript-accessible, so standard XSS precautions still matter.
- **Tenant isolation:** authenticated API handlers derive the organization from the verified server-side session. ERP reads and mutations are scoped to that organization. Public database roles are not intended to read application tables directly.
- **Python ML service:** Render runs FastAPI with AI_ONLY=true. It provides health and bounded non-clinical inference routes only. It has no database connection and cannot handle account, workspace, or ERP endpoints.
- **AI data boundary:** the Edge API forwards only the required operational text or synthetic product values for inference. Triage text is processed in memory and is not persisted; audit entries record model/classification metadata rather than the raw note.
- **Local/test backend:** the full FastAPI application can run locally with SQLite or a PostgreSQL DATABASE_URL. This local backend is also exercised by the Python and Postman tests; it is not the production data plane for the hosted static frontends.

### Production API routes

The Supabase Edge Function exposes the application API through the /api prefix:

| Route | Purpose |
| --- | --- |
| GET /api/health | Health check and PostgreSQL persistence status |
| POST /api/auth/register | Create an account and organization |
| POST /api/auth/login | Start a session |
| GET /api/auth/me | Read the current identity |
| PUT /api/auth/profile | Update the profile |
| POST /api/auth/logout | Revoke the session |
| POST /api/auth/demo | Create an isolated synthetic demo workspace |
| GET /api/organization | Read organization/member summary |
| POST /api/organization/join | Join with an invitation code |
| POST /api/organization/rotate-invite | Rotate the owner invitation code |
| GET / PUT /api/workspace | Read or save a versioned workspace snapshot |
| GET /api/activity | Read the organization-scoped audit feed |
| GET /api/erp/modules | List supported ERP modules and fields |
| GET /api/erp/summary | Read module counts and operational summaries |
| GET /api/erp/search | Search organization-scoped ERP records |
| GET /api/erp/{collection} | List/filter records |
| POST /api/erp/{collection} | Create a record |
| PUT /api/erp/{collection}/{record_key} | Update a record |
| DELETE /api/erp/{collection}/{record_key} | Delete a record |
| POST /api/ai/triage | Classify a short synthetic operations note |
| GET /api/ai/inventory/anomalies | Screen the current organization's inventory |
| GET /api/ai/capabilities | List enabled models and data-retention boundaries |

The Render service's separate public inference routes are limited to POST /api/ai/triage-public and POST /api/ai/inventory/anomalies-public, plus GET /api/health.

## Run locally on Windows

Open PowerShell in the repository root:

~~~powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
$env:APP_ENV = "development"
$env:DATABASE_URL = "sqlite:///./averis.db"
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
~~~

In a second terminal, serve the static frontend:

~~~powershell
python -m http.server 4173 --bind 127.0.0.1
~~~

Open http://127.0.0.1:4173/. On localhost and 127.0.0.1, the frontend targets the local FastAPI backend at http://127.0.0.1:8000/api. With no local API running, the browser-only demo remains available. The hosted frontend instead targets the production Supabase Edge API.

## Test and build

~~~powershell
python -m pip install -r backend/requirements.txt
python -m pytest -q
node --check app.js
python scripts/validate_site.py
python scripts/build_pages.py --output dist
~~~

The GitHub Actions workflow runs JavaScript/Python validation, pytest, the Postman collection through Newman against a temporary SQLite database, Chromium UI smoke tests, production Supabase API health checks, live Python ML endpoint checks, a static-only build, and a post-publish check of the actual GitHub Pages assets. It deploys only the generated dist/ website artifact, not backend or test source.

Postman collection: postman/AVERIS-ERP.postman_collection.json

## Deployment and operations

- Pushes to **main** run the verification-and-deployment workflow for GitHub Pages. Vercel is connected to the repository's main branch and has a production deployment alias at https://averis-tau.vercel.app/.
- The Edge Function uses its managed Supabase environment for server credentials. No database password or service-role key should be committed to source control or placed in browser code.
- Render is set to AI_ONLY=true, APP_ENV=production, with auto-deploy from main. Do not add a database secret to this service; it is meant to run only the Python inference layer.
- Netlify production publishing from GitHub Actions requires the repository secret NETLIFY_AUTH_TOKEN. To enable it, add that secret in https://github.com/mahitech580/averis/settings/secrets/actions. The workflow deliberately skips Netlify publishing when the token is absent.
- The GitHub Pages workflow checks the real production Edge API and the Render inference routes before publishing. After deployment it also fetches the published HTML, JavaScript, CSS, and service-worker files and checks the asset-version contract.
- Never claim a host is current solely because its URL responds. Check the published deployment's source commit before relying on it.

## Visual design system

Space Grotesk headlines, Manrope body text, and DM Mono metadata; midnight-violet and lavender surfaces with restrained operational blue/green/red accents; 8px-based spacing; responsive controls; subtle transitions and scroll reveals; reduced-motion preferences respected.

## Official references

- [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/orm/)
- [Supabase PostgreSQL connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Postman/Newman](https://learning.postman.com/docs/collections/using-newman-cli/installing-running-newman)
- [Playwright browser testing](https://playwright.dev/docs/intro)
- [Netlify redirects and rewrites](https://docs.netlify.com/routing/redirects/)

AVERIS is a demonstration of synthetic operational workflows, not a clinical system. Do not use it for diagnoses, treatment decisions, real patient data, or other high-stakes clinical work.
