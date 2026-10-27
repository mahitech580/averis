# AVERIS — Healthcare operations coordination SaaS

AVERIS is a multi-tenant healthcare **operations coordination** SaaS demo with a responsive web frontend, FastAPI REST API, SQLAlchemy persistence, PostgreSQL database, organization-scoped records, and authenticated operational ML endpoints. Every public sample is synthetic; it is not a clinical record system.

**Main frontend:** https://averis-saas.netlify.app/  
**Static showcase:** https://mahitech580.github.io/averis/  
**Repository:** https://github.com/mahitech580/averis

> **Data boundary:** never enter real patient information, diagnoses, treatment plans, production customer records, or other sensitive data into the public preview.
## What is included

- Responsive application shell with viewport-fixed navigation, a five-link primary bar with a More submenu, mobile layout, focus states, smooth transitions, reduced-motion support, and a dark-only appearance.
- Photo-led healthcare imagery across hero sections, feature cards, operational layers, login, and signup, with bundled SVG fallbacks when an image host is unavailable.
- Local/browser demo and an isolated cloud-demo route; the cloud demo provisions a dedicated organization per visitor and seeds **313 synthetic records across 15 ERP modules**.
- Server-side registration/sign-in, password hashing, HttpOnly session cookies, logout/revocation, organization-scoped records, shared workspace snapshots, revision checks, and server audit events.
- ERP search, summary counts, low-stock signals, CRUD operations, field validation, duplicate SKU checks, and organization-level isolation.
- Postman collection with Newman CI execution, pytest API coverage, Chromium UI smoke tests, and a static-only publishing build that excludes backend and test source from the website artifact.

## ERP modules

| Area | Modules |
| --- | --- |
| Inventory & supply | Products, suppliers, purchase orders, stock movements |
| Commercial | Customers, sales orders, invoices, leads |
| Finance | Journal entries |
| People & delivery | Employees, projects, assets |
| Operations | Support tickets, production orders, quality checks |

That catalog has 15 ERP modules; the broader operations workspace additionally has navigation for people, journeys, workflow, schedule, capacity, workforce, diagnostics, pharmacy, finance, messages, incidents, quality, insights, assistant, reports, workspace, audit, and settings.

## Architecture

- Frontend: vanilla JavaScript, responsive CSS design system, semantic HTML, photo-led imagery with local SVG fallbacks, service worker, and static-only output.
- API: FastAPI routes under /api, SQLAlchemy ORM, Pydantic input validation, HttpOnly cookie sessions, tenant-scoped authorization, and server-side commits.
- Data: SQLite for local/test runs; PostgreSQL for hosted deployment; MySQL URL parsing is supported by the backend.
- Persistence: each ERP mutation is committed server-side. Shared workspace snapshots are versioned, and the browser polls for cloud state when connected.
- Multi-tenancy: every ERP query and mutation is scoped to the authenticated user's organization. The demo endpoint creates isolated tenants rather than a shared account.
- Database security: the dedicated Supabase project has the core schema, foreign-key indexes, row-level security enabled on all six tables, and no direct table grants to the public API roles. FastAPI is intended to access the database as the trusted server.

## API route groups

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/health | Health check, database driver, persistence mode |
| POST | /api/auth/register | Create account and organization |
| POST | /api/auth/login | Start a session |
| GET | /api/auth/me | Read current identity |
| PUT | /api/auth/profile | Update profile |
| POST | /api/auth/logout | Revoke session |
| POST | /api/auth/demo | Create isolated demo and seed the ERP catalog |
| GET | /api/organization | Organization/member summary |
| POST | /api/organization/join | Join by invite code |
| POST | /api/organization/rotate-invite | Rotate owner invite |
| GET / PUT | /api/workspace | Read or persist versioned workspace snapshot |
| GET | /api/activity | Audit feed |
| GET | /api/erp/modules | Module catalogue |
| GET | /api/erp/summary | Per-module counts and operational summary |
| GET | /api/erp/search | Search across ERP collections |
| GET | /api/erp/{collection} | List/filter records |
| POST | /api/erp/{collection} | Create a record |
| PUT | /api/erp/{collection}/{record_key} | Update a record |
| DELETE | /api/erp/{collection}/{record_key} | Delete a record |

The OpenAPI/Swagger UI is served by FastAPI at /docs when the API is running.

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

Open http://127.0.0.1:4173/. On localhost and 127.0.0.1, the frontend automatically targets http://127.0.0.1:8000/api, so a running local FastAPI process enables server-backed login and data saving. Without the API, the browser-only demo remains available.

## Test and build

~~~powershell
python -m pip install -r backend/requirements.txt
python -m pytest -q
node --check app.js
python scripts/validate_site.py
python scripts/build_pages.py --output dist
~~~

CI also runs the Postman collection via Newman against a temporary SQLite database, starts a static preview, checks browser behavior with Chromium, and deploys only the generated dist/ site artifact.

Postman collection: postman/AVERIS-ERP.postman_collection.json

## Hosted PostgreSQL connection

The dedicated Supabase project is named **averis-erp-prod** in the Mumbai region. Its database is active and the schema is applied, but production records remain empty until the FastAPI service is connected.

1. In Supabase, open the project and choose **Connect → Session pooler**. Copy the full connection URI and replace the password placeholder in the secure dashboard context only. The pooler is suitable for IPv4-hosted app services; do not build the pooler hostname by hand.
2. Open the Render Blueprint for this repository: https://dashboard.render.com/blueprint/new?repo=https://github.com/mahitech580/averis
3. Set the secret environment variable DATABASE_URL to the copied URI. Keep APP_ENV=production. The backend intentionally rejects SQLite in production because an ephemeral service filesystem is not durable.
4. Wait for /api/health to return status=ok and verify database_driver=postgresql. Then server-backed demo, CRUD, and automatic cloud saves will use that PostgreSQL database.
5. To publish Netlify updates through GitHub Actions, configure the repository secret NETLIFY_AUTH_TOKEN at https://github.com/mahitech580/averis/settings/secrets/actions.

The Netlify production deploy is currently skipped when that secret is missing. GitHub Pages publishes the static preview; a Render service/database connection is separate and is not claimed as live until its health route is verified.



## Production SaaS architecture

- **Netlify frontend:** the `averis-saas` site serves the UI and proxies `/api/*` to FastAPI. GitHub Pages remains a static portfolio showcase; cross-site session cookies can be blocked by browsers.
- **Python API:** FastAPI, SQLAlchemy, input validation, server-hashed passwords, revocable HttpOnly sessions, tenant-scoped access, audit events, revision-checked workspace sync, and OpenAPI docs at `/api/docs`.
- **Database:** the existing Mumbai-region Supabase PostgreSQL project `averis-erp-prod`. Six application tables have RLS enabled with public API privileges revoked. The API must connect through the trusted server database URI.
- **AI/ML:** local scikit-learn TF-IDF/logistic-regression classification of non-clinical synthetic operations notes; NumPy/Pandas and IsolationForest inventory anomaly detection. Triage text is not persisted or included in audit logs; only predicted category/priority/model are recorded. No external AI inference calls are made.
- **Optional study stack:** `requirements-ai.txt` documents TensorFlow, PyTorch, LangChain, CrewAI, Sentence Transformers and Jupyter for experiments outside the default production server image.

## ML endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/ai/triage` | Classify a short synthetic operations note; raw text is not retained |
| GET | `/api/ai/inventory/anomalies` | Tenant-scoped inventory anomaly and reorder-risk screen |
| GET | `/api/ai/capabilities` | Enabled models and retention boundaries |

## Visual design system

Space Grotesk headlines, Manrope body copy and DM Mono metadata; light lavender/purple and dark midnight-violet themes; restrained medical blue/green/red accents; 8px-based spacing; 48px minimum buttons; passive scroll-progress tracking, IntersectionObserver reveals, subtle hero motion and a back-to-top button. Reduced-motion preferences are respected.

## Deployment status and required database secret

The frontend is deployed, but a production API has not yet been verified. The connected Render workspace had no Averis web-service resource when last inspected, while the existing Netlify proxy points to `https://averis-platform-api-mahi.onrender.com`; its health route returned 404. Provision the API from `render.yaml`, set the Supabase **Session pooler connection URI** as the secret `DATABASE_URL`, keep `APP_ENV=production`, and verify `/api/health` returns `status=ok` with `database_driver=postgresql`. Never commit the password or use ephemeral SQLite in production. Do not describe production as connected until signup/login and tenant-isolation tests pass.

## Official implementation references

- [MDN: position and sticky/fixed containing blocks](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position)
- [MDN: overflow and clipping behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow)
- [FastAPI: testing with pytest and TestClient](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy 2.0 ORM documentation](https://docs.sqlalchemy.org/en/20/orm/)
- [Supabase: connect to PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Postman: run collections with Newman](https://learning.postman.com/docs/collections/using-newman-cli/installing-running-newman)
- [Playwright: browser testing](https://playwright.dev/docs/intro)
- [Netlify: redirects and rewrites](https://docs.netlify.com/routing/redirects/)
