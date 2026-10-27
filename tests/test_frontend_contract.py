from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def test_sticky_header_is_not_disabled_at_short_viewport_heights():
    css = read("styles.css")
    assert re.search(r"#site-header\.site-header\s*\{[^}]*position:\s*fixed!important[^}]*inset:\s*0 0 auto 0", css, re.S)
    assert "function syncHeaderHeight()" in read("app.js")
    assert re.search(r"html\s*,\s*body\s*\{[^}]*overflow-x:\s*clip", css)


def test_light_and_dark_themes_are_supported_across_shell_and_settings():
    app = read("app.js")
    html = read("index.html")
    css = read("styles.css")
    render_start = app.index("function render(){")
    render_end = app.index("function pulse(){", render_start)
    render = app[render_start:render_end]
    assert 'data-theme="dark"' in html
    assert '--bg:#F5F2FF' in css and '--bg:#0E0B20' in css
    assert "Space+Grotesk" in html and "Manrope" in html and "DM+Mono" in html
    assert "function initScrollExperience()" in app
    assert 'window.addEventListener("scroll",update,{passive:true})' in app
    assert 'topButton?.classList.toggle("visible",window.scrollY>620)' in app
    assert 'if(a==="toggle-theme"){state.theme=state.theme==="dark"?"light":"dark"' in app
    assert 'btn("toggle-theme",state.theme==="dark"?' in app


def test_photo_backgrounds_and_images_have_bundled_fallbacks():
    html = read("index.html")
    app = read("app.js")
    css = read("styles.css")

    # Photo backgrounds are intentional, but each remote background declaration
    # must layer bundled SVG artwork behind it so blocked hosts never leave blanks.
    external_backgrounds = []
    for block in re.findall(r"\{([^{}]*)\}", css, re.S):
        for declaration in block.split(";"):
            if re.search(r"url\(\s*['\"]?https?://", declaration, re.I):
                external_backgrounds.append(declaration.strip())
                assert "./assets/" in declaration, "photo background is missing its local fallback: " + declaration[:220]
    assert len(external_backgrounds) >= 20

    # Remote <img> sources are intentionally used to restore the photo-led design.
    # Runtime onerror handlers point to bundled SVG assets as the resilient fallback.
    assert 'data-fallback="' in app
    assert 'onerror="this.onerror=null;this.src=this.dataset.fallback"' in app
    for host in (
        "healthtechmagazine.net", "hopkinsmedicine.org", "yahata.saiseikai.or.jp",
        "res.cloudinary.com", "ihhhealthcare.com", "research.com",
        "arizent.brightspotcdn.com", "hfmmagazine.com", "d2o532ht0hlr4u.cloudfront.net",
    ):
        if host in app:
            assert 'data-fallback="' in app and "this.dataset.fallback" in app

    # All long-form website sections retain photographic backgrounds and local SVG fallbacks.
    for selector in (
        ".hero-bg", ".capabilities-bg", ".process-bg", ".metrics-bg", ".feature-bg",
        ".layers-bg", ".showcase-bg", ".boundary-bg", ".cta-bg",
    ):
        assert selector in css
    assert 'const art=register?' in app and 'artFallback=register?' in app
    assert "data-fallback=\"'+artFallback+'\"" in app
    assert 'id="server-activity-list"' in app
    assert "./assets/healthcare-scene.svg" in app


def test_service_worker_and_html_use_one_asset_version():
    html = read("index.html")
    sw = read("sw.js")
    css_v = re.findall(r"styles\.css\?v=(\d+)", html)
    js_v = re.findall(r"app\.js\?v=(\d+)", html)
    cache = re.search(r"const CACHE=['\"]averis-by-mahi-v(\d+)['\"]", sw)
    assert len(css_v) == 1
    assert len(js_v) == 1
    assert css_v == js_v
    assert cache and cache.group(1) == css_v[0]
    for name in ("styles.css", "app.js"):
        assert f"./{name}?v={css_v[0]}" in sw


def test_anchor_navigation_does_not_swallow_links():
    app = read("app.js")
    assert 'const anchor=e.target.closest("a[href]")' in app
    assert 'if(href.startsWith("#/"))' in app
    assert 'return\n}\nconst nativeControl=e.target.closest("input,select,textarea,label")' in app


def test_netlify_api_proxy_and_cloud_demo_route_are_wired():
    netlify = read("netlify.toml")
    app = read("app.js")
    backend = read("backend/main.py")
    assert 'from = "/api/*"' in netlify
    assert 'to = "https://zspustvmjtdsnfkprbvv.supabase.co/functions/v1/averis-api/api/:splat"' in netlify
    assert 'data-action="cloud-demo"' in app
    assert 'apiRequest("/auth/demo"' in app
    assert '@app.post("/api/auth/demo")' in backend
    assert "seeded_erp_records" in backend


def test_postman_collection_covers_auth_health_and_erp_lifecycle():
    collection = json.loads(read("postman/AVERIS-ERP.postman_collection.json"))
    names = {item["name"] for item in collection["item"]}
    expected = {
        "00 · Health check", "01 · Launch isolated demo", "02 · Current identity",
        "03 · ERP module catalogue", "04 · ERP summary", "05 · Products",
        "06 · Create product", "07 · Update created product", "08 · Global search",
        "09 · Workspace snapshot", "10 · Organization", "11 · Activity log",
        "12 · Delete created product", "13 · Logout",
        "14 · Protected request after logout",
    }
    assert expected <= names
    assert len(collection["item"]) >= 15
    assert all("request" in item for item in collection["item"])


def test_all_15_erp_collections_are_seeded_for_cloud_demo():
    backend = read("backend/main.py")
    block = re.search(r"_DEMO_ROW_COUNTS\s*=\s*\{([^}]+)\}", backend, re.S)
    assert block
    counts = {key: int(value) for key, value in re.findall(r'"([a-z_]+)"\s*:\s*(\d+)', block.group(1))}
    assert len(counts) == 15
    assert sum(counts.values()) == 313


def test_static_publish_artifact_contains_only_frontend_assets(tmp_path):
    import subprocess
    import sys

    output = tmp_path / "averis-site"
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "build_pages.py"), "--output", str(output)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=15,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert (output / "index.html").is_file()
    assert (output / "app.js").is_file()
    assert (output / "styles.css").is_file()
    assert (output / "sw.js").is_file()
    assert (output / ".nojekyll").is_file()
    assert (output / "assets" / "averis-orbit.svg").is_file()
    for private_dir in ("backend", "database", "frameworks", "postman", "tests", "scripts", ".github", "node_modules"):
        assert not (output / private_dir).exists(), private_dir + " must not be published"
    assert not list(output.rglob("*.db"))


def test_netlify_build_uses_the_clean_static_distribution():
    netlify = read("netlify.toml")
    assert re.search(r'(?m)^\s*publish\s*=\s*"dist"\s*$', netlify)
    assert "python scripts/build_pages.py --output dist" in netlify


def test_local_preview_automatically_targets_fastapi():
    app = read("app.js")
    assert '["localhost","127.0.0.1"].includes(location.hostname)' in app
    assert '"http://127.0.0.1:8000/api"' in app


def test_cloud_auth_uses_a_server_session_token_and_durable_edge_api():
    app = read("app.js")
    netlify = read("netlify.toml")
    vercel = read("vercel.json")
    edge = read("supabase/functions/averis-api/index.ts")
    config = read("supabase/config.toml")
    assert "functions/v1/averis-api/api" in app
    assert "SUPABASE_PUBLIC_KEY" in app and '"apikey":SUPABASE_PUBLIC_KEY' in app
    assert 'sessionStorage.getItem("averis_session_token")' in app
    assert 'sessionStorage.setItem("averis_session_token",identity.access_token)' in app
    assert "supabase.co/functions/v1/averis-api/api/:splat" in netlify
    assert "supabase.co/functions/v1/averis-api/api/:path*" in vercel
    assert "SUPABASE_SERVICE_ROLE_KEY" in edge
    assert 'request.headers.get("authorization")' in edge
    assert "verify_jwt = false" in config
    assert "/api/auth/register" in edge and "/api/erp/summary" in edge and "/api/ai/triage" in edge


def test_operations_dashboard_uses_workspace_state_and_live_sync_contract():
    html = read("index.html")
    app = read("app.js")
    css = read("styles.css")

    start = app.index("function today(){")
    end = app.index("\nfunction people(){", start)
    dashboard = app[start:end]
    for marker in (
        "Operations overview", "ops-home-header", "ops-livebar", "ops-kpis",
        "ops-dashboard-grid", "server-activity-list", "SHARED WORKSPACE", "LOCAL PREVIEW",
        'data-open-task="', 'data-open-appointment="', 'data-action="go-queue"',
        "state.tasks.filter", "state.appointments", "state.resources", "state.pharmacy",
    ):
        assert marker in dashboard, f"missing operations dashboard contract: {marker}"
    assert "HOW IT WORKS" not in dashboard
    assert "PostgreSQL + Python APIs" not in dashboard
    assert "A connected operations SaaS for teams behind care" not in dashboard

    for font in ("Space+Grotesk", "Manrope", "DM+Mono"):
        assert font in html
    for token in (
        '--font-display:"Space Grotesk"',
        '--font-body:"Manrope"',
        '--font-mono:"DM Mono"',
        "--accent-purple:#5F3EE8",
        "--accent-purple-strong:#5B35D5",
        "--accent-lavender:#D8CCFF",
        "--healthcare-green:#16834A",
        "--healthcare-red:#CF3E5D",
        "--healthcare-sky:#087EAE",
        "--healthcare-pink:#BE397C",
        "scroll-padding-top:90px",
        ".scroll-progress",
        ".back-to-top",
        "IntersectionObserver",
    ):
        assert token in css or token in app, f"missing design or interaction contract: {token}"
    assert "requestAnimationFrame" in app
    assert 'window.addEventListener("scroll",update,{passive:true})' in app
    assert 'topButton?.addEventListener("click"' in app
    assert ".reveal-on-scroll.is-revealed" in css
    assert "prefers-reduced-motion:reduce" in css
    assert "styles.css?v=56" in html
    assert "app.js?v=56" in html
    assert "averis-by-mahi-v56" in read("sw.js")


def test_dashboard_shows_operational_state_without_technology_marketing_copy():
    app = read("app.js")
    start = app.index("function today(){")
    end = app.index("\nfunction people(){", start)
    dashboard = app[start:end]
    for marker in (
        "Open work", "Active journeys", "Schedule items", "Stock to review",
        "Needs attention", "Movement", "Capacity pulse", "Recent activity",
        "SYNTHETIC RECORDS", "LOCAL PREVIEW", "SHARED WORKSPACE",
    ):
        assert marker in dashboard
    assert "PostgreSQL + Python APIs" not in dashboard
    assert "Human-reviewed ML signals" not in dashboard
    assert "A connected operations SaaS for teams behind care" not in dashboard


def test_public_operations_dashboard_is_visible_without_authentication_but_private_routes_stay_gated():
    app = read("app.js")
    assert 'if(!state.session.authenticated&&route!=="login"&&route!=="register"&&route!=="today")route="login";' in app
    assert 'document.body.classList.toggle("public-mode",!state.session.authenticated&&route==="today")' in app
    assert 'const publicRoute' not in app
    assert 'data-action="open-register"' in app
    assert 'data-action="open-login"' in app
    css = read("styles.css")
    assert ".ops-home{" in css
    assert ".ops-livebar{" in css
    assert ".ops-kpis{" in css
    assert ".ops-dashboard-grid{" in css


def test_netlify_cache_api_and_build_revision_contract():
    headers = read("_headers")
    redirects = read("_redirects")
    netlify = read("netlify.toml")
    build = read("scripts/build_pages.py")
    workflow = read(".github/workflows/pages.yml")

    assert "/app.js\n  Cache-Control: public, max-age=31536000, immutable" in headers
    assert "/styles.css\n  Cache-Control: public, max-age=31536000, immutable" in headers
    assert "/sw.js\n  Cache-Control: no-cache, no-store, must-revalidate" in headers
    assert "/build-revision.txt\n  Cache-Control: no-cache, no-store, must-revalidate" in headers
    assert "supabase.co/functions/v1/averis-api/api/:splat" in redirects
    assert "supabase.co/functions/v1/averis-api/api/:splat" in netlify
    assert "averis-platform-api-mahi.onrender.com/api/:splat" not in redirects
    assert 'os.environ.get("COMMIT_REF")' in build
    assert 'os.environ.get("GITHUB_SHA")' in build
    assert "build-revision.txt" in workflow
    assert "NETLIFY_AUTH_TOKEN is absent; no CLI deployment was performed" in workflow
    assert "Observed live assets:" in workflow
    assert "app_has_workspace_html_sanitizer" in workflow
    assert "css_has_drawer_layer_fix" in workflow
    assert workflow.index("app_js = fetch(urljoin(base, app_ref))") < workflow.index("if app_version != expected_version")



def test_workspace_html_interpolation_is_escaped_and_dynamic_sinks_are_sanitized():
    app = read("app.js")
    assert "function sanitizeMarkup(markup)" in app
    assert 'innerHTML=sanitizeMarkup(view())' in app
    assert 'innerHTML=sanitizeMarkup(body)' in app
    assert 'body.innerHTML=sanitizeMarkup(content)' in app
    assert 'document.addEventListener("error",event=>' in app
    for expression in (
        "esc(p.name)", "esc(p.owner)", "esc(t.title)", "esc(t.person)",
        "esc(a.person)", "esc(r.name)", "esc(w.name)", "esc(d.value)",
        "esc(p.item)", "esc(f.label)", "esc(m.from)", "esc(i.title)",
        "esc(a.target)",
    ):
        assert expression in app, f"missing escaped UI value: {expression}"



def test_drawer_layering_keeps_controls_above_sticky_header():
    css = read("styles.css")
    assert ".drawer-scrim{z-index:100}" in css
    assert ".drawer{z-index:110}" in css


def test_product_sku_migration_enforces_case_insensitive_tenant_uniqueness():
    migration = read("database/migrations/20261027090717_unique_product_sku_per_organization.sql")
    schema = read("database/schema.sql")
    assert "CREATE UNIQUE INDEX IF NOT EXISTS uq_erp_org_product_sku" in migration
    assert "organization_id" in migration
    assert "upper(btrim(payload ->> 'sku'))" in migration
    assert "collection = 'products'" in migration
    assert "NULLIF(btrim(payload ->> 'sku'), '') IS NOT NULL" in migration
    assert "uq_erp_org_product_sku" in schema



def test_local_modal_forms_preserve_data_and_enforce_numeric_constraints():
    app = read("app.js")
    assert 'subject=(document.getElementById("f-message-subject").value||"").trim()' in app
    assert "subject,text:" in app
    assert "Quantity, minimum and variance must be zero or greater." in app
    assert 'field.type==="number"&&value!==null' in app
    assert 'field.type==="email"&&value' in app
    ui = read("scripts/ui-smoke.mjs")
    for marker in (
        "UI CRUD Person", "UI CRUD Task", "UI CRUD Resource", "UI CRUD Workforce",
        "UI CRUD Diagnostic", "UI CRUD Inventory", "UI CRUD Finance", "UI CRUD Subject",
        "UI CRUD Incident", "UI CRUD Report", "UI CRUD ERP Product Updated",
    ):
        assert marker in ui, f"missing browser workflow regression: {marker}"



def test_service_worker_never_persists_same_origin_api_responses():
    sw = read("sw.js")
    api_guard = "if(url.origin===self.location.origin&&(url.pathname==='/api'||url.pathname.startsWith('/api/')))"
    assert api_guard in sw
    assert "fetch(e.request,{cache:'no-store'})" in sw
    assert sw.index(api_guard) < sw.index("const dynamic=")
    assert "averis-by-mahi-v56" in sw
    html = read("index.html")
    assert "app.js?v=56" in html and "styles.css?v=56" in html


def test_operations_dashboard_layout_collapses_cleanly_on_tablet_and_mobile():
    css = read("styles.css")
    assert "@media(max-width:1100px)" in css
    assert ".ops-dashboard-grid,.ops-dashboard-grid-lower{grid-template-columns:minmax(0,1fr)}" in css
    assert "@media(max-width:760px)" in css
    assert "@media(max-width:420px)" in css
    assert ".ops-quick-grid{grid-template-columns:minmax(0,1fr)}" in css
