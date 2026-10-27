#!/usr/bin/env python3
"""Fail-fast consistency checks for the static AVERIS site (standard library only)."""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class ResourceParser(HTMLParser):
    """Collect local resources actually referenced by the HTML shell."""

    def __init__(self) -> None:
        super().__init__()
        self.resources: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        candidates: list[str] = []
        if tag in {"script", "img", "source"} and values.get("src"):
            candidates.append(values["src"] or "")
        if tag == "link" and values.get("href"):
            candidates.append(values["href"] or "")
        for value in candidates:
            if value and not value.startswith(("#", "http://", "https://", "//", "data:", "mailto:")):
                self.resources.append(value)


def local_file(reference: str) -> Path:
    path = unquote(urlsplit(reference).path)
    if path.startswith("./"):
        path = path[2:]
    else:
        path = path.lstrip("/")
    return ROOT / path


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    html_path = ROOT / "index.html"
    app_path = ROOT / "app.js"
    css_path = ROOT / "styles.css"
    sw_path = ROOT / "sw.js"
    for path in (html_path, app_path, css_path, sw_path, ROOT / "manifest.json"):
        if not path.is_file():
            fail(f"required file is missing: {path.relative_to(ROOT)}")

    html = html_path.read_text(encoding="utf-8")
    sw = sw_path.read_text(encoding="utf-8")
    parser = ResourceParser()
    parser.feed(html)
    missing = sorted({str(ref) for ref in parser.resources if not local_file(ref).is_file()})
    if missing:
        fail("HTML references missing local resources: " + ", ".join(missing))

    cache_match = re.search(r"const CACHE=['\"]averis-by-mahi-v(\d+)['\"]", sw)
    if not cache_match:
        fail("service-worker cache name must include the AVERIS vN version")
    cache_version = cache_match.group(1)

    core_match = re.search(r"const CORE=\[(.*?)\];", sw, re.S)
    if not core_match:
        fail("service-worker CORE precache list was not found")
    core = re.findall(r"['\"]([^'\"]+)['\"]", core_match.group(1))
    if not core:
        fail("service-worker CORE precache list is empty")
    missing_core = sorted({ref for ref in core if ref != "./" and not local_file(ref).is_file()})
    if missing_core:
        fail("service-worker precaches missing local resources: " + ", ".join(missing_core))

    for filename in ("app.js", "styles.css"):
        html_versions = re.findall(rf"(?:src|href)=['\"]\./{re.escape(filename)}\?v=(\d+)['\"]", html)
        sw_versions = re.findall(rf"['\"]\./{re.escape(filename)}\?v=(\d+)['\"]", core_match.group(1))
        if not html_versions or not sw_versions:
            fail(f"missing versioned {filename} reference in index.html or sw.js")
        if len(set(html_versions)) != 1 or len(set(sw_versions)) != 1:
            fail(f"inconsistent duplicate version references for {filename}")
        if html_versions[0] != sw_versions[0]:
            fail(f"{filename} version mismatch between index.html and sw.js")
        if html_versions[0] != cache_version:
            fail(f"{filename} version v{html_versions[0]} does not match service-worker cache v{cache_version}")

    header_rules = (ROOT / "_headers").read_text(encoding="utf-8")
    redirects = (ROOT / "_redirects").read_text(encoding="utf-8")
    netlify_config = (ROOT / "netlify.toml").read_text(encoding="utf-8")
    required_headers = (
        ("/", "Cache-Control: no-cache, no-store, must-revalidate"),
        ("/index.html", "Cache-Control: no-cache, no-store, must-revalidate"),
        ("/app.js", "Cache-Control: public, max-age=31536000, immutable"),
        ("/styles.css", "Cache-Control: public, max-age=31536000, immutable"),
        ("/sw.js", "Cache-Control: no-cache, no-store, must-revalidate"),
        ("/build-revision.txt", "Cache-Control: no-cache, no-store, must-revalidate"),
        ("/api/*", "Cache-Control: no-store"),
    )
    for route, header in required_headers:
        if f"{route}\\n  {header}" not in header_rules:
            fail(f"missing cache policy for {route}: {header}")
    expected_api_target = "https://zspustvmjtdsnfkprbvv.supabase.co/functions/v1/averis-api/api/:splat"
    if expected_api_target not in redirects or expected_api_target not in netlify_config:
        fail("Netlify API rewrite must consistently target the Supabase production API")
    if "averis-platform-api-mahi.onrender.com/api/:splat" in redirects:
        fail("stale /api rewrite still points to the inference-only Render service")

    image_preloads = re.findall(r"<link\b(?=[^>]*\bas=['\"]image['\"])[^>]*>", html, re.I)
    if len(image_preloads) > 1:
        fail(f"found {len(image_preloads)} image preloads; keep only the initial hero image prioritized")

    print(
        "OK: "
        f"{len(set(parser.resources))} local HTML resources, "
        f"{len(core)} service-worker precache entries, "
        f"matching asset/cache version v{cache_version}, "
        f"{len(image_preloads)} image preload."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
