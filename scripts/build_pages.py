#!/usr/bin/env python3
"""Build a safe static-only site artifact for GitHub Pages and Netlify."""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATIC_FILES = (
    "index.html",
    "app.js",
    "styles.css",
    "sw.js",
    "manifest.json",
    "_headers",
    "_redirects",
)
STATIC_DIRECTORIES = ("assets",)


def build(output: Path) -> int:
    destination = output if output.is_absolute() else ROOT / output
    destination = destination.resolve()
    if destination == ROOT or ROOT not in destination.parents:
        print("FAIL: output must be a child directory of the repository root", file=sys.stderr)
        return 2
    missing = [name for name in STATIC_FILES if not (ROOT / name).is_file()]
    missing.extend(name for name in STATIC_DIRECTORIES if not (ROOT / name).is_dir())
    if missing:
        print("FAIL: required static site entries are missing: " + ", ".join(missing), file=sys.stderr)
        return 2

    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    for name in STATIC_FILES:
        shutil.copy2(ROOT / name, destination / name)
    for name in STATIC_DIRECTORIES:
        shutil.copytree(ROOT / name, destination / name)

    # Disable implicit Jekyll processing on GitHub Pages.
    (destination / ".nojekyll").write_text("", encoding="utf-8")

    prohibited = {"backend", "database", "frameworks", "postman", "tests", "scripts", ".github", "node_modules"}
    actual_roots = {p.name for p in destination.iterdir()}
    leaked = sorted(actual_roots & prohibited)
    if leaked:
        print("FAIL: private/source directories included in static output: " + ", ".join(leaked), file=sys.stderr)
        return 2
    print(
        "OK: static-only artifact created at "
        + str(destination)
        + " ("
        + str(sum(1 for p in destination.rglob("*") if p.is_file()))
        + " files; no backend/test source)."
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="dist", help="output directory relative to repository root")
    args = parser.parse_args()
    return build(Path(args.output))


if __name__ == "__main__":
    raise SystemExit(main())
