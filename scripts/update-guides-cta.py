#!/usr/bin/env python3
"""
Update every guide under /guides/<slug>/:
  - Add free PDF download blocks (after intro + at end)
  - Rewrite kit CTAs off Etsy onto /kits/ via data-product
  - Strip remaining etsy.com hrefs in body/kit-note copy
  - Ensure checkout-config + checkout.js are loaded
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDES = ROOT / "guides"

PRODUCT_COPY = {
    "speech": {
        "name": "Best Man Speech Kit",
        "desc": "A speech-writing guide, an editable Word workbook, a final-speech document and six large cue cards, in A4 and US Letter. You bring the stories. Digital download.",
        "button": "Get the Speech Kit",
        "aria": "Best Man Speech Kit",
        "note_lead": "Want a structure to work through?",
        "note_body": "The Best Man Speech Kit has a speech-writing guide, an editable Word workbook and printable cue cards in A4 and US Letter. You still bring the stories.",
        "note_link": "See the Best Man Speech Kit",
    },
    "duties": {
        "name": "Best Man Duties Kit",
        "desc": "A duties handbook, an editable Word planner and a printable planner with 14 planning sections, plus a wedding-day sheet and four pocket carry cards, in A4 and US Letter. Digital download.",
        "button": "Get the Duties Kit",
        "aria": "Best Man Duties Kit",
        "note_lead": "Want it all in one plan?",
        "note_body": "The Best Man Duties Kit brings the planning together in an editable Word planner or printable planner, with a wedding-day sheet and four printable carry cards, in A4 and US Letter.",
        "note_link": "See the Best Man Duties Kit",
    },
    "playbook": {
        "name": "Stag Do &amp; Bachelor Party Playbook",
        "desc": "Eight stag do games, a groom quiz, challenge cards and the Stag Awards, editable in Word or printable, in UK and US editions. Digital download.",
        "button": "Get the Playbook",
        "aria": "Stag Do and Bachelor Party Playbook",
        "note_lead": "Planning the night itself?",
        "note_body": "The Stag Do &amp; Bachelor Party Playbook has games, a groom quiz and awards that work with or without a drink. Budgets and guest payments sit in the Duties Kit.",
        "note_link": "See the Playbook",
    },
}

PRODUCT_BY_SLUG = {
    "3-prompts-to-start-your-best-man-speech": "speech",
    "best-man-duties-checklist": "duties",
    "best-man-duties-timeline": "duties",
    "best-man-speech-examples": "speech",
    "best-man-speech-for-a-best-friend": "speech",
    "best-man-speech-for-a-brother": "speech",
    "best-man-speech-jokes": "speech",
    "best-man-speech-nerves": "speech",
    "best-man-speech-opening-lines": "speech",
    "best-man-speech-template": "speech",
    "best-man-toast": "speech",
    "best-man-vs-groomsmen-vs-ushers": "duties",
    "best-mans-job": "duties",
    "best-woman-speech": "speech",
    "funny-best-man-speech": "speech",
    "how-long-should-a-best-man-speech-be": "speech",
    "how-to-end-a-best-man-speech": "speech",
    "how-to-plan-a-stag-do": "duties",
    "how-to-write-a-best-man-speech": "speech",
    "joint-best-man-speech": "speech",
    "non-drinking-stag-do-ideas": "playbook",
    "rehearsal-dinner-toast": "speech",
    "short-best-man-speech": "speech",
    "stag-do-budget": "duties",
    "stag-do-games": "playbook",
    "wedding-speech-order": "speech",
    "what-does-the-best-man-do-on-the-wedding-day": "duties",
    "what-does-the-best-man-pay-for": "duties",
    "what-not-to-say-in-a-best-man-speech": "speech",
}


def free_block(slug: str, position: str) -> str:
    pdf = f"/downloads/{slug}-checklist.pdf"
    cls = "free-download free-download-top" if position == "top" else "free-download free-download-end"
    return (
        f'<aside class="{cls}" data-free-download="{position}" aria-label="Free printable checklist">'
        f'<p class="eyebrow">FREE PRINTABLE PDF</p>'
        f'<p><strong>Get the free printable checklist (PDF)</strong> — a short checklist summary of this guide. Instant download, no email needed.</p>'
        f'<p><a class="button" href="{pdf}" download>Get the free printable checklist (PDF)</a></p>'
        f"</aside>"
    )


def top_cta(product: str, slug: str) -> str:
    meta = PRODUCT_COPY[product]
    return (
        f'<aside class="kit-cta kit-cta-top" aria-label="{meta["aria"]}">'
        f'<p class="eyebrow">FROM BEST MAN BACKUP</p>'
        f'<p><strong>{meta["name"]}:</strong> {meta["desc"]}</p>'
        f'<p><a class="button" data-product="{product}" href="/kits/#{product}">{meta["button"]}</a></p>'
        f"</aside>"
    )


def end_cta(product: str, slug: str) -> str:
    meta = PRODUCT_COPY[product]
    return (
        f'<aside class="kit-cta kit-cta-end" aria-label="Best Man Backup kits">'
        f'<p class="eyebrow">READY WHEN YOU ARE</p>'
        f'<p><strong>{meta["name"]}:</strong> {meta["desc"]}</p>'
        f'<p class="kit-cta-actions">'
        f'<a class="button" data-product="{product}" href="/kits/#{product}">{meta["button"]}</a> '
        f'<a class="button secondary" data-product="bundle" href="/kits/#bundle">Get the Best Man Bundle</a>'
        f"</p>"
        f'<p class="kit-cta-small">The Best Man Bundle puts the Duties, Stag &amp; Bachelor Party and Speech Kits in one download.</p>'
        f"</aside>"
    )


def kit_note(product: str) -> str:
    meta = PRODUCT_COPY[product]
    return (
        f'<aside class="kit-note" aria-label="From Best Man Backup">'
        f'<p class="eyebrow">FROM BEST MAN BACKUP</p>'
        f'<p><strong>{meta["note_lead"]}</strong> {meta["note_body"]} '
        f'<a data-product="{product}" href="/kits/#{product}">{meta["note_link"]}</a>.</p>'
        f"</aside>"
    )


def ensure_scripts(html: str) -> str:
    if "/assets/checkout-config.js" in html:
        return html
    inject = (
        '  <script defer src="/assets/checkout-config.js"></script>\n'
        '  <script defer src="/assets/checkout.js"></script>\n'
    )
    if 'src="/analytics.js"' in html:
        return html.replace(
            '<script defer src="/analytics.js"></script>',
            '<script defer src="/analytics.js"></script>\n' + inject.rstrip("\n"),
            1,
        )
    return html.replace("</head>", inject + "</head>", 1)


def strip_etsy_links(html: str) -> str:
    # Replace etsy listing anchors with kits anchors, preserving data-product when present
    def repl(m: re.Match) -> str:
        full = m.group(0)
        product_m = re.search(r'data-product="(\w+)"', full)
        product = product_m.group(1) if product_m else "bundle"
        if product == "set":
            product = "bundle"
        text = re.sub(r"<[^>]+>", "", m.group(0))
        text = re.sub(r"\s*\(opens in a new tab\)\s*", "", text)
        text = text.replace(" on Etsy", "").replace(" from our Etsy shop", "")
        text = re.sub(r"\s+", " ", text).strip()
        if not text:
            text = "See the kit"
        return f'<a data-product="{product}" href="/kits/#{product}">{text}</a>'

    html = re.sub(
        r'<a[^>]*href="https://www\.etsy\.com/[^"]*"[^>]*>.*?</a>',
        repl,
        html,
        flags=re.S | re.I,
    )
    # Clean leftover Etsy wording in visible copy
    html = html.replace(" on Etsy", "")
    html = html.replace(" from our Etsy shop", "")
    html = html.replace(", ON ETSY", "")
    html = html.replace("Best Man Backup kits on Etsy", "Best Man Backup kits")
    html = html.replace("Best Man Speech Kit on Etsy", "Best Man Speech Kit")
    html = html.replace("Best Man Duties Kit on Etsy", "Best Man Duties Kit")
    html = html.replace("Stag Do and Bachelor Party Playbook on Etsy", "Stag Do and Bachelor Party Playbook")
    html = html.replace("Digital download from our Etsy shop.", "Digital download.")
    return html


def update_guide(path: Path) -> bool:
    slug = path.parent.name
    product = PRODUCT_BY_SLUG.get(slug)
    if not product:
        print(f"skip unknown slug: {slug}")
        return False

    html = path.read_text(encoding="utf-8")
    original = html
    html = ensure_scripts(html)

    # Remove existing free-download blocks so re-runs are idempotent
    html = re.sub(
        r'<aside class="free-download[^"]*"[^>]*>.*?</aside>\s*',
        "",
        html,
        flags=re.S,
    )

    # Replace existing top CTA or insert after answer / before guide-body
    top = top_cta(product, slug)
    free_top = free_block(slug, "top")
    if re.search(r'<aside class="kit-cta kit-cta-top"', html):
        html = re.sub(
            r'<aside class="kit-cta kit-cta-top"[^>]*>.*?</aside>',
            top,
            html,
            count=1,
            flags=re.S,
        )
    else:
        # Insert before guide-body
        html = html.replace(
            '<div class="guide-body">',
            top + '\n      <div class="guide-body">',
            1,
        )

    # Insert free download after answer (before guide-body or top CTA)
    if re.search(r'<div class="answer">.*?</div>', html, re.S):
        html = re.sub(
            r'(</div>\s*)(<aside class="kit-cta kit-cta-top"|<div class="guide-body">)',
            r"\1" + free_top + "\n      " + r"\2",
            html,
            count=1,
            flags=re.S,
        )
    else:
        html = html.replace(top, free_top + "\n      " + top, 1)

    # Kit note
    note = kit_note(product)
    if re.search(r'<aside class="kit-note"', html):
        html = re.sub(
            r'<aside class="kit-note"[^>]*>.*?</aside>',
            note,
            html,
            count=1,
            flags=re.S,
        )

    # End CTA
    end = end_cta(product, slug)
    free_end = free_block(slug, "end")
    if re.search(r'<aside class="kit-cta kit-cta-end"', html):
        html = re.sub(
            r'<aside class="kit-cta kit-cta-end"[^>]*>.*?</aside>',
            free_end + "\n      " + end,
            html,
            count=1,
            flags=re.S,
        )
    else:
        # Insert before closing </article>
        html = html.replace(
            "</article>",
            free_end + "\n      " + end + "\n    </article>",
            1,
        )

    html = strip_etsy_links(html)

    # Fix homepage speech anchors that still work
    html = re.sub(
        r'href="/#speech"',
        'href="/kits/#speech"',
        html,
    )
    html = re.sub(
        r'href="/#duties"',
        'href="/kits/#duties"',
        html,
    )
    html = re.sub(
        r'href="/#party"',
        'href="/kits/#playbook"',
        html,
    )
    html = re.sub(
        r'href="/#the-set"',
        'href="/kits/#bundle"',
        html,
    )

    if html != original:
        path.write_text(html, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed = 0
    for path in sorted(GUIDES.glob("*/index.html")):
        if update_guide(path):
            changed += 1
            print(f"updated {path.parent.name}")
        else:
            print(f"unchanged {path.parent.name}")
    print(f"Done: {changed} guides updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
