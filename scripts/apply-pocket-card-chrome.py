#!/usr/bin/env python3
"""Apply pocket-card header, footer and /style.css to the 50 live guides.

The storefront homepage (index.html) is the delivered pocket-card chrome.
This script copies that header and footer onto each guides/<slug>/index.html
and swaps the old stylesheets for /style.css.

Kept byte-for-byte: <title>, meta description, canonical, Open Graph,
JSON-LD, analytics and checkout scripts, and the <main> article (kit CTAs,
free PDF, FAQ, sources, related guides).

Safe to re-run. Guides that already use the pocket-card header are left as-is.
"""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDES = ROOT / "guides"
HOME = ROOT / "index.html"

OLD_STYLE_RE = re.compile(
    r'\s*<link rel="stylesheet" href="/(?:styles\.css|guides/guides\.css|assets/nav\.css)">',
)
OLD_NAV_JS_RE = re.compile(r'\s*<script defer src="/assets/nav\.js"></script>')
HEADER_RE = re.compile(
    r'<a class="skip" href="#main">Skip to content</a>\s*<header\b.*?</header>',
    re.S,
)
FOOTER_RE = re.compile(r"<footer\b.*?</footer>", re.S)
MAIN_RE = re.compile(r"(<main id=\"main\">.*</main>)", re.S)
TITLE_RE = re.compile(r"<title>([^<]*)</title>")


def chrome_from_home() -> tuple[str, str]:
    home = HOME.read_text(encoding="utf-8")
    header = HEADER_RE.search(home)
    footer = FOOTER_RE.search(home)
    if not header or not footer:
        sys.exit("index.html is missing the pocket-card header or footer")
    if 'href="/style.css"' not in home:
        sys.exit("index.html is not the pocket-card storefront (no /style.css)")
    if "noindex" in home:
        sys.exit("refusing to copy chrome from a noindex homepage")
    return header.group(0), footer.group(0)


def main_bytes(html: str) -> str:
    match = MAIN_RE.search(html)
    if not match:
        sys.exit("guide is missing <main id=\"main\">")
    return match.group(1)


def apply_one(path: Path, header: str, footer: str) -> str:
    original = path.read_text(encoding="utf-8")
    title = TITLE_RE.search(original)
    if not title:
        sys.exit(f"{path} has no title")
    title_text = title.group(1)
    if "noindex" in original:
        sys.exit(f"{path} unexpectedly contains noindex")

    # Already on the new chrome.
    if (
        'href="/style.css"' in original
        and 'href="/styles.css"' not in original
        and 'class="header wrap"' not in original
        and header in original
        and footer in original
    ):
        return title_text

    before_main = main_bytes(original)
    updated = OLD_STYLE_RE.sub("", original)
    updated = OLD_NAV_JS_RE.sub("", updated)
    if 'href="/style.css"' not in updated:
        updated = updated.replace(
            '<script defer src="/analytics.js"></script>',
            '<link rel="stylesheet" href="/style.css">\n  <script defer src="/analytics.js"></script>',
            1,
        )
    updated, n_header = HEADER_RE.subn(header, updated, count=1)
    updated, n_footer = FOOTER_RE.subn(footer, updated, count=1)
    if n_header != 1 or n_footer != 1:
        sys.exit(f"{path} header/footer replace counts: {n_header}, {n_footer}")
    if main_bytes(updated) != before_main:
        sys.exit(f"{path} main content changed")
    if TITLE_RE.search(updated).group(1) != title_text:
        sys.exit(f"{path} title changed")
    for needle in (
        'name="description"',
        'rel="canonical"',
        'property="og:title"',
        '"@type": "Article"',
        '"@type": "FAQPage"',
        "/analytics.js",
        "/assets/checkout.js",
        "kit-cta-top",
        "kit-cta-end",
    ):
        if needle not in updated:
            sys.exit(f"{path} lost {needle}")
    if "noindex" in updated or 'href="/styles.css"' in updated or "nav.js" in updated:
        sys.exit(f"{path} still has old chrome or noindex")
    path.write_text(updated, encoding="utf-8")
    return title_text


def main() -> None:
    header, footer = chrome_from_home()
    titles = []
    for directory in sorted(p for p in GUIDES.iterdir() if p.is_dir()):
        page = directory / "index.html"
        if not page.exists():
            continue
        titles.append((directory.name, apply_one(page, header, footer)))
    if len(titles) != 50:
        sys.exit(f"expected 50 guides, found {len(titles)}")
    digest = hashlib.sha256("\n".join(f"{slug}\t{title}" for slug, title in titles).encode()).hexdigest()
    print(f"applied pocket-card chrome to {len(titles)} guides")
    print(f"title-digest {digest}")


if __name__ == "__main__":
    main()
