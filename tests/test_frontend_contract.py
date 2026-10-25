from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def test_sticky_header_is_not_disabled_at_short_viewport_heights():
    css = read("styles.css")
    assert re.search(r"\.site-header\s*\{[^}]*position:\s*sticky[^}]*top:\s*0", css)
    assert ".website-shell .site-header{position:sticky;top:0" in css
    assert "@media(max-height:560px) and (min-width:821px)" not in css
    assert re.search(r"html\s*,\s*body\s*\{[^}]*overflow-x:\s*clip", css)


def test_light_dark_theme_is_persistent_and_available_in_both_controls():
    app = read("app.js")
    html = read("index.html")
    css = read("styles.css")
    render_start = app.index("function render(){")
    render_end = app.index("function pulse(){", render_start)
    render = app[render_start:render_end]
    assert 'document.documentElement.dataset.theme=state.theme' in render
    assert 'if(!["dark","light"].includes(state.theme))state.theme="dark";document.documentElement.dataset.theme=state.theme' in render
    assert 'if(a==="toggle-theme")' in app
    assert 'data-action="toggle-theme"' in html
    assert 'btn("toggle-theme"' in app
    assert 'html[data-theme="light"] .website-section-bg' in css
    assert 'html[data-theme="light"] .erp-suite .erp-table tbody td' in css


def test_images_are_local_and_css_has_no_external_background_requests():
    html = read("index.html")
    app = read("app.js")
    css = read("styles.css")
    assert not re.search(r"url\(\s*['\"]?https?://", css, re.IGNORECASE)
    # Frontend source can include the API URL, but it should not depend on remote photo hosts.
    blocked_hosts = (
        "healthtechmagazine.net", "hopkinsmedicine.org", "yahata.saiseikai.or.jp",
        "res.cloudinary.com", "ihhhealthcare.com", "research.com",
        "arizent.brightspotcdn.com", "hfmmagazine.com", "bratislavaliving.sk",
        "d2o532ht0hlr4u.cloudfront.net",
    )
    for host in blocked_hosts:
        assert host not in html
        assert host not in app
        assert host not in css
    assert 'href="./styles.css?v=34"' in html
    assert 'src="./app.js?v=34"' in html


def test_service_worker_and_html_use_one_asset_version():
    html = read("index.html")
    sw = read("sw.js")
    css_v = re.findall(r"styles\.css\?v=(\d+)", html)
    js_v = re.findall(r"app\.js\?v=(\d+)", html)
    cache = re.search(r"const CACHE=['\"]averis-by-mahi-v(\d+)['\"]", sw)
    assert css_v == ["34"]
    assert js_v == ["34"]
    assert cache and cache.group(1) == "34"
    for name in ("styles.css", "app.js"):
        assert f"./{name}?v=34" in sw


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
