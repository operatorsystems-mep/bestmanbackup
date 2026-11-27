#!/usr/bin/env python3
"""
Generate printable 1–2 page checklist PDFs for every guide topic under /guides/.

Usage (from repo root):
  python3 scripts/generate-guide-pdfs.py

Requires: pip install -r scripts/requirements-pdf.txt
Outputs: downloads/<slug>-checklist.pdf
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from fpdf import FPDF

import json, os
from datetime import datetime, timezone
ROOT = Path(os.environ.get("BMB_REPO", Path(__file__).resolve().parents[1]))
CHECKLISTS = Path(os.environ.get("BMB_CHECKLISTS", ROOT / "scripts" / "guide-checklists.json"))
OUTDIR = Path(os.environ.get("BMB_OUT", ROOT / "downloads"))
GUIDES = ROOT / "guides"
DOWNLOADS = ROOT / "downloads"
LOGO = ROOT / "assets" / "bmb-horizontal-navy.svg"
FONT_DIR = Path(os.environ.get("BMB_FONT_DIR", ROOT / "fonts"))
FONT_SANS = FONT_DIR / "NimbusSans-Regular.ttf"
FONT_SANS_BOLD = FONT_DIR / "NimbusSans-Bold.ttf"

NAVY = (16, 27, 43)  # #101B2B
GOLD = (173, 135, 73)  # #AD8749
INK = (23, 38, 61)
MUTED = (89, 97, 108)
IVORY = (250, 246, 236)  # #FAF6EC

PRODUCT_BY_SLUG = {
    "3-prompts-to-start-your-best-man-speech": "speech",
    "asked-to-be-best-man": "duties",
    "bachelor-party-checklist": "playbook",
    "best-man-checklist-week-before": "duties",
    "best-man-duties-checklist": "duties",
    "best-man-duties-timeline": "duties",
    "best-man-gift-ideas": "duties",
    "best-man-outfit": "duties",
    "best-man-rehearsal-responsibilities": "duties",
    "best-man-rings": "duties",
    "best-man-speech-cue-cards": "speech",
    "best-man-speech-dont-know-the-bride": "speech",
    "best-man-speech-examples": "speech",
    "best-man-speech-for-a-best-friend": "speech",
    "best-man-speech-for-a-brother": "speech",
    "best-man-speech-for-a-colleague": "speech",
    "best-man-speech-for-a-cousin": "speech",
    "best-man-speech-for-a-second-marriage": "speech",
    "best-man-speech-jokes": "speech",
    "best-man-speech-mistakes": "speech",
    "best-man-speech-nerves": "speech",
    "best-man-speech-opening-lines": "speech",
    "best-man-speech-same-sex-wedding": "speech",
    "best-man-speech-template": "speech",
    "best-man-speech-thanking-parents": "speech",
    "best-man-speech-without-notes": "speech",
    "best-man-toast": "speech",
    "best-man-vs-groomsmen-vs-ushers": "duties",
    "best-mans-job": "duties",
    "cheap-stag-do-ideas": "playbook",
    "dad-as-best-man": "speech",
    "funny-best-man-speech": "speech",
    "funny-best-man-speech-stories": "speech",
    "heartfelt-best-man-speech": "speech",
    "how-long-should-a-best-man-speech-be": "speech",
    "how-to-end-a-best-man-speech": "speech",
    "how-to-plan-a-stag-do": "playbook",
    "how-to-write-a-best-man-speech": "speech",
    "joint-best-man-speech": "speech",
    "last-minute-best-man-speech": "speech",
    "non-drinking-stag-do-ideas": "playbook",
    "rehearsal-dinner-toast": "speech",
    "short-best-man-speech": "speech",
    "stag-do-budget": "playbook",
    "stag-do-destinations": "playbook",
    "stag-do-games": "playbook",
    "wedding-speech-order": "speech",
    "what-does-the-best-man-do-on-the-wedding-day": "duties",
    "what-does-the-best-man-pay-for": "duties",
    "what-not-to-say-in-a-best-man-speech": "speech",
}

PRODUCT_META = {
    "speech": {
        "name": "The Speech Kit",
        "blurb": "Speech-writing guide, editable workbook and six large cue cards.",
        "price": "£14.99",
    },
    "duties": {
        "name": "The Duties Kit",
        "blurb": "Duties handbook, planner, wedding-day sheet and pocket carry cards.",
        "price": "£9.99",
    },
    "playbook": {
        "name": "The Stag Playbook",
        "blurb": "Eight games, groom quiz, challenge cards and Stag Awards.",
        "price": "£9.99",
    },
}

# Owner-facing names on the four-product block. Prices and live Payment
# Links come from assets/checkout-config.js, not from these labels.
CATALOGUE = (
    ("speech", "The Speech Kit"),
    ("duties", "The Duties Kit"),
    ("playbook", "The Stag Playbook"),
    ("bundle", "The Best Man Set"),
)
CHECKOUT_CONFIG = ROOT / "assets" / "checkout-config.js"


def load_live_checkout() -> dict:
    """Read checkoutUrlLive and price for each kit. Single source of truth."""
    text = CHECKOUT_CONFIG.read_text(encoding="utf-8")
    products = {}
    for product_id, label in CATALOGUE:
        block = re.search(
            rf"\b{product_id}:\s*Object\.freeze\(\{{(.*?)\n    \}}\)",
            text,
            re.S,
        )
        if not block:
            raise SystemExit(f"checkout-config.js has no {product_id} product")
        body = block.group(1)
        price = re.search(r"price:\s*'([^']+)'", body)
        url = re.search(r"checkoutUrlLive:\s*'([^']+)'", body)
        if not price or not url:
            raise SystemExit(f"checkout-config.js is missing price or live URL for {product_id}")
        live = url.group(1)
        if not live.startswith("https://buy.stripe.com/") or "/test_" in live:
            raise SystemExit(f"{product_id} checkoutUrlLive is not a live Payment Link: {live}")
        products[product_id] = {"id": product_id, "label": label, "price": price.group(1), "url": live}
    return products


def strip_tags(text: str) -> str:
    # v2.1: list items become one bulleted line each (v2 glued them: "...wordsMain UK speaker")
    text = re.sub(r"<li[^>]*>", "\n\u2022 ", text, flags=re.I)
    text = re.sub(r"</(li|ul|ol)\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _similar(a: str, b: str) -> bool:
    import difflib
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio() > 0.68


DROPPED: list[str] = []


def clean_answer(answer: str) -> str:
    """v2.1: print-only tidy of the short answer.
    - drop on-screen navigation sentences/clauses ("Jump to ...") that mean nothing on paper
    - drop a paragraph whose every sentence is repeated (near-verbatim) in another paragraph
    - list items on their own lines, paragraphs separated by a blank line"""
    answer = re.sub(r"Jump to [^.]*?, or use", "Use", answer)
    answer = re.sub(r"(^|(?<=[.!?] ))Jump to [^.]*\.\s*", "", answer)
    paras = [p.strip() for p in re.split(r"\n\s*\n|\n(?!\u2022)", answer) if p.strip()]
    # re-split so bullet runs stay together as one block
    blocks: list[str] = []
    for line in answer.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("\u2022") and blocks and blocks[-1].startswith("\u2022"):
            blocks[-1] += "\n" + line
        else:
            blocks.append(line)
    sent = lambda t: [x for x in re.split(r"(?<=[.!?])\s+", t) if len(x) > 20]
    keep = []
    for i, b in enumerate(blocks):
        others = [s for j, o in enumerate(blocks) if j != i and j not in [k for k, _ in keep if False] for s in sent(o)]
        ss = sent(b)
        rep = sum(1 for x in ss if any(_similar(x, y) for y in others))
        if ss and not b.startswith("\u2022") and rep >= 2 and rep / len(ss) >= 0.6 and i < len(blocks) - 1 and any(len(o) >= len(b) for j, o in enumerate(blocks) if j > i):
            DROPPED.append(b[:70])
            continue  # mostly repeated by a later, fuller paragraph
        keep.append((i, b))
    return "\n\n".join(b for _, b in keep)


def extract_guide(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    title_m = re.search(r"<h1[^>]*>(.*?)</h1>", raw, re.S | re.I)
    title = strip_tags(title_m.group(1)) if title_m else path.parent.name

    answer_m = re.search(
        r'<div class="answer">(.*?)</div>', raw, re.S | re.I
    )
    answer = strip_tags(answer_m.group(1)) if answer_m else ""
    # Drop the SHORT ANSWER eyebrow from the printable body
    answer = re.sub(r"^THE SHORT ANSWER\s*", "", answer, flags=re.I).strip()
    answer = clean_answer(answer)

    body_m = re.search(r'<div class="guide-body">(.*?)</div>\s*<section class="guide-faq"', raw, re.S | re.I)
    if not body_m:
        body_m = re.search(r'<div class="guide-body">(.*)</div>', raw, re.S | re.I)
    body = body_m.group(1) if body_m else ""

    # Prefer checklist <li> items; fall back to H2 headings and short bullets
    checklist = [strip_tags(x) for x in re.findall(r'<ul class="checklist">.*?</ul>', body, re.S | re.I)]
    items: list[str] = []
    if checklist:
        for block in checklist:
            # re-parse from original for lis
            pass
    li_in_checklist = re.findall(
        r'<ul class="checklist">\s*(.*?)\s*</ul>', body, re.S | re.I
    )
    for block in li_in_checklist:
        for li in re.findall(r"<li[^>]*>(.*?)</li>", block, re.S | re.I):
            t = strip_tags(li)
            if t:
                items.append(t)

    if len(items) < 5:
        for h2 in re.findall(r"<h2[^>]*>(.*?)</h2>", body, re.S | re.I):
            t = strip_tags(h2)
            if t and t.lower() not in {"sources", "frequently asked questions"}:
                items.append(t)
        # Supplement with strong-led list items
        for li in re.findall(r"<li[^>]*>\s*<strong>(.*?)</strong>(.*?)</li>", body, re.S | re.I):
            t = strip_tags(li[0] + li[1])
            if t and t not in items:
                items.append(t)
            if len(items) >= 14:
                break

    # Cap for a 1–2 page printable
    items = [i for i in items if len(i) < 280][:16]
    if not items and answer:
        items = [s.strip() for s in re.split(r"[.!?]\s+", answer) if len(s.strip()) > 20][:8]

    override = json.loads(CHECKLISTS.read_text(encoding="utf-8")) if CHECKLISTS.exists() else {}
    if path.parent.name in override:
        items = override[path.parent.name]

    return {
        "slug": path.parent.name,
        "title": title,
        "answer": answer,
        "items": items,
        "url": f"https://bestmanbackup.com/guides/{path.parent.name}/",
        "product": PRODUCT_BY_SLUG.get(path.parent.name, "speech"),
    }


class ChecklistPDF(FPDF):
    def __init__(self, guide: dict, checkout: dict, fmt: str = "A4"):
        super().__init__(orientation="P", unit="mm", format=fmt)
        self.cw = self.w - 24  # content width between 12 mm margins
        self.set_title(guide["title"] + " - free printable checklist")
        self.set_author("Best Man Backup")
        self.set_subject("Free printable checklist from bestmanbackup.com")
        self.set_creator("Best Man Backup")
        self.set_lang("en-GB")
        self.guide = guide
        self.checkout = checkout
        # Pin CreationDate, the file ID and the XMP dates. fpdf2 otherwise
        # stamps the current time, so two builds of the same text get different md5s.
        raw_epoch = os.environ.get("SOURCE_DATE_EPOCH")
        if raw_epoch:
            built = datetime.fromtimestamp(int(raw_epoch), timezone.utc)
        else:
            built = datetime(2026, 11, 27, tzinfo=timezone.utc)
        self.set_creation_date(built)
        # Leave room for the two-line footer (buy line + guide URL).
        self.set_auto_page_break(auto=True, margin=26)
        if FONT_SANS.exists() and FONT_SANS_BOLD.exists():
            self.add_font("Nimbus", "", str(FONT_SANS))
            self.add_font("Nimbus", "B", str(FONT_SANS_BOLD))
            self.font_family = "Nimbus"
        else:
            raise SystemExit("Nimbus TTF fonts not found in " + str(FONT_DIR))

    def header(self):
        # Ivory band and the pocket-card wordmark. Checklist copy is unchanged.
        self.set_fill_color(250, 246, 236)
        self.rect(0, 0, self.w, 26, "F")
        if LOGO.exists():
            self.image(str(LOGO), 12, 6, 64)
        self.set_xy(80, 11)
        self.set_text_color(173, 135, 73)
        self.set_font(self.font_family, "B", 9)
        self.cell(0, 5, "Free printable checklist")
        self.set_draw_color(207, 200, 184)
        self.set_line_width(0.35)
        self.line(0, 26, self.w, 26)
        self.set_y(32)

    def _text_link(self, text: str, url: str, height: float) -> None:
        """Draw text and a /URI annotation exactly over those glyphs."""
        width = self.get_string_width(text)
        x = self.get_x()
        y = self.get_y()
        self.cell(width, height, text)
        self.link(x, y, width, height, url)

    def footer(self):
        product = PRODUCT_META[self.guide["product"]]
        live = self.checkout[self.guide["product"]]
        self.set_y(-22)
        self.set_draw_color(*GOLD)
        self.set_line_width(0.4)
        self.line(12, self.get_y(), self.w - 12, self.get_y())
        self.ln(1.6)

        buy = f"Buy the kit  ·  {product['name']}  ·  {live['price']}"
        self.set_font(self.font_family, "B", 8)
        self.set_text_color(*NAVY)
        buy_w = self.get_string_width(buy)
        self.set_x((self.w - buy_w) / 2)
        self._text_link(buy, live["url"], 4)
        self.ln(4.2)

        url = self.guide["url"]
        page = f"   ·   Page {self.page_no()}"
        self.set_font(self.font_family, "", 8)
        self.set_text_color(*MUTED)
        url_w = self.get_string_width(url)
        page_w = self.get_string_width(page)
        self.set_x((self.w - url_w - page_w) / 2)
        self._text_link(url, url, 4)
        self.cell(page_w, 4, page)

    def build(self):
        self.add_page()
        self.set_text_color(*NAVY)
        self.set_font(self.font_family, "B", 18)
        self.multi_cell(0, 8, self.guide["title"])
        self.ln(2)

        if self.guide["answer"]:
            self.set_fill_color(*IVORY)
            self.set_draw_color(*GOLD)
            x = self.get_x()
            y = self.get_y()
            self.set_font(self.font_family, "", 10)
            # Measure without drawing, so the text layer is written once.
            lines = self.multi_cell(self.cw - 12, 5, self.guide["answer"], dry_run=True, output="LINES")
            height = len(lines) * 5 + 8
            self.set_fill_color(*IVORY)
            self.rect(x, y, self.cw, height, "F")
            self.set_fill_color(*GOLD)
            self.rect(x, y, 2.5, height, "F")
            self.set_xy(x + 6, y + 4)
            self.set_text_color(*INK)
            self.set_font(self.font_family, "", 10)
            self.multi_cell(self.cw - 12, 5, self.guide["answer"])
            self.set_y(y + height)
            self.ln(5)

        self.set_text_color(*NAVY)
        self.set_font(self.font_family, "B", 12)
        self.cell(0, 8, "Checklist", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*GOLD)
        self.set_line_width(0.6)
        self.line(12, self.get_y(), 70, self.get_y())
        self.ln(4)

        self.set_font(self.font_family, "", 10)
        self.set_text_color(*INK)
        for item in self.guide["items"]:
            if self.get_y() > self.h - 47:
                self.add_page()
                self.set_font(self.font_family, "B", 12)
                self.set_text_color(*NAVY)
                self.cell(0, 8, "Checklist (continued)", new_x="LMARGIN", new_y="NEXT")
                self.ln(2)
                self.set_font(self.font_family, "", 10)
                self.set_text_color(*INK)
            y = self.get_y()
            self.set_draw_color(*NAVY)
            self.set_line_width(0.5)
            self.rect(14, y + 1, 4, 4)
            self.set_xy(22, y)
            self.multi_cell(self.cw - 14, 5, item)
            self.ln(2)

        # Compact navy block: all four kits, each linked straight to Stripe.
        line_h = 5
        box_h = 8 + line_h * len(CATALOGUE) + 3
        box_h += 5  # Set saving line
        if self.get_y() + box_h > self.h - 26:
            self.add_page()
        self.ln(3)
        box_y = self.get_y()
        self.set_fill_color(*NAVY)
        self.rect(12, box_y, self.cw, box_h, "F")

        self.set_xy(16, box_y + 3)
        self.set_text_color(*IVORY)
        self.set_font(self.font_family, "B", 8)
        self.cell(0, 4, "BUY DIRECT", new_x="LMARGIN", new_y="NEXT")

        self.set_font(self.font_family, "B", 9)
        for product_id, _label in CATALOGUE:
            item = self.checkout[product_id]
            self.set_x(16)
            self.set_text_color(*IVORY)
            self._text_link(f"{item['label']}  ·  {item['price']}", item["url"], line_h)
            self.ln(line_h)
        self.set_x(16)
        self.set_font(self.font_family, "", 8)
        self.cell(0, line_h, "The Best Man Set: all three kits, worth £34.97 separately. Save £14.98.", new_x="LMARGIN", new_y="NEXT")


def main() -> int:
    fmt = os.environ.get("BMB_FORMAT", "A4")
    OUTDIR.mkdir(parents=True, exist_ok=True)
    guides = sorted(
        p for p in GUIDES.glob("*/index.html") if p.parent.name != ""
    )
    if not guides:
        print("No guides found", file=sys.stderr)
        return 1

    checkout = load_live_checkout()
    written = []
    for path in guides:
        guide = extract_guide(path)
        pdf = ChecklistPDF(guide, checkout, fmt)
        pdf.build()
        out = OUTDIR / f"{guide['slug']}-checklist.pdf"
        pdf.output(str(out))
        written.append(out.name)
        print(f"wrote {out} ({len(guide['items'])} items, {pdf.pages_count} pages)")

    print(f"Done: {len(written)} PDFs in downloads/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
