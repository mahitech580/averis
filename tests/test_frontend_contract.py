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


def test_dark_only_mode_is_enforced_across_shell_and_settings():
    app = read("app.js")
    html = read("index.html")
    css = read("styles.css")
    render_start = app.index("function render(){")
    render_end = app.index("function pulse(){", render_start)
    render = app[render_start:render_end]
    assert 'state.theme="dark";document.documentElement.dataset.theme="dark"' in render
    assert 'document.documentElement.style.colorScheme="dark"' in render
    assert 'name="color-scheme" content="dark"' in html
    assert 'data-theme="dark"' in html
    assert 'id="theme-trigger"' not in html
    assert 'data-action="toggle-theme"' not in html
    assert 'btn("toggle-theme"' not in app
    assert 'if(a==="toggle-theme")' in app
    assert 'state.theme="dark"' in app[app.index('if(a==="toggle-theme")'):app.index('if(a==="toggle-theme")') + 240]
    assert 'html{color-scheme:dark!important}' in css


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
    assert "data-fallback=\"'+x[4]+'\"" in app
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
    assert 'to = "https://averis-platform-api-mahi.onrender.com/api/:splat"' in netlify
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
