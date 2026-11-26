#!/usr/bin/env python3
"""Generate 10 new SEO guide pages targeting keyword gaps. Run from repo root."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDES = ROOT / "guides"
TODAY = "17 November 2026"
DATE_ISO = "2026-11-17"

PRODUCT_COPY = {
    "speech": {
        "name": "Best Man Speech Kit",
        "desc": "A speech-writing guide, an editable Word workbook, a final-speech document and six large cue cards, in A4 and US Letter. You bring the stories. Digital download.",
        "button": "Get the Speech Kit",
        "aria": "Best Man Speech Kit",
        "note_lead": "Want a structure to work through?",
        "note_body": "The Best Man Speech Kit has a speech-writing guide, an editable Word workbook and printable cue cards in A4 and US Letter. You still bring the stories.",
        "note_link": "See the Best Man Speech Kit",
        "anchor": "speech",
    },
    "duties": {
        "name": "Best Man Duties Kit",
        "desc": "A duties handbook, an editable Word planner and a printable planner with 14 planning sections, plus a wedding-day sheet and four pocket carry cards, in A4 and US Letter. Digital download.",
        "button": "Get the Duties Kit",
        "aria": "Best Man Duties Kit",
        "note_lead": "Want it all in one plan?",
        "note_body": "The Best Man Duties Kit brings the planning together in an editable Word planner or printable planner, with a wedding-day sheet and four printable carry cards, in A4 and US Letter.",
        "note_link": "See the Best Man Duties Kit",
        "anchor": "duties",
    },
    "playbook": {
        "name": "Stag Do &amp; Bachelor Party Playbook",
        "desc": "Eight stag do games, a groom quiz, challenge cards and the Stag Awards, editable in Word or printable, in UK and US editions. Digital download.",
        "button": "Get the Playbook",
        "aria": "Stag Do and Bachelor Party Playbook",
        "note_lead": "Planning the night itself?",
        "note_body": "The Stag Do &amp; Bachelor Party Playbook has games, a groom quiz and awards that work with or without a drink. Budgets and guest payments sit in the Duties Kit.",
        "note_link": "See the Playbook",
        "anchor": "playbook",
    },
}


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def slugify_heading(text: str) -> str:
    s = text.lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    return s


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


def top_cta(product: str) -> str:
    meta = PRODUCT_COPY[product]
    return (
        f'<aside class="kit-cta kit-cta-top" aria-label="{meta["aria"]}">'
        f'<p class="eyebrow">FROM BEST MAN BACKUP · { {"speech": "£14.99", "duties": "£9.99", "playbook": "£9.99"}[product] }</p>'
        f'<p><strong>{meta["name"]}:</strong> {meta["desc"]}</p>'
        f'<p class="cta-buy"><a class="button" data-product="{product}" href="/kits/#{meta["anchor"]}">{meta["button"]}</a></p>'
        f'<p class="trust">Instant private download · Secure Stripe checkout · Problems? <a href="mailto:hello@bestmanbackup.com">hello@bestmanbackup.com</a></p>'
        f"</aside>"
    )


def end_cta(product: str) -> str:
    meta = PRODUCT_COPY[product]
    return (
        f'<aside class="kit-cta kit-cta-end" aria-label="Best Man Backup kits">'
        f'<p class="eyebrow">READY WHEN YOU ARE</p>'
        f'<p><strong>{meta["name"]}:</strong> {meta["desc"]}</p>'
        f'<p class="kit-cta-actions">'
        f'<a class="button" data-product="{product}" href="/kits/#{meta["anchor"]}">{meta["button"]}</a> '
        f'<a class="button secondary" data-product="bundle" href="/kits/#bundle">Get all three · The Best Man Set</a>'
        f"</p>"
        f'<p class="trust">Instant private download · Secure Stripe checkout · Problems? <a href="mailto:hello@bestmanbackup.com">hello@bestmanbackup.com</a></p>'
        f'<p class="kit-cta-small">The £19.99 Best Man Bundle includes the Speech Kit, the Duties Kit and the Stag Do &amp; Bachelor Party Playbook, worth £34.97 separately.</p>'
        f"</aside>"
    )


def kit_note(product: str) -> str:
    meta = PRODUCT_COPY[product]
    return (
        f'<aside class="kit-note" aria-label="From Best Man Backup">'
        f'<p class="eyebrow">FROM BEST MAN BACKUP</p>'
        f'<p><strong>{meta["note_lead"]}</strong> {meta["note_body"]} '
        f'<a href="/kits/#{meta["anchor"]}">{meta["note_link"]}</a>.</p>'
        f"</aside>"
    )


def toc_from_sections(sections: list[dict]) -> str:
    items = []
    for s in sections:
        hid = s.get("id") or slugify_heading(s["h2"])
        items.append(f'<li><a href="#{hid}">{esc(s["h2"])}</a></li>')
    return (
        '<nav class="toc" aria-label="On this page"><p class="eyebrow">ON THIS PAGE</p><ol>'
        + "".join(items)
        + "</ol></nav>"
    )


def body_from_sections(sections: list[dict]) -> str:
    parts = []
    for s in sections:
        hid = s.get("id") or slugify_heading(s["h2"])
        parts.append(f'<h2 id="{hid}">{s["h2"]}</h2>')
        parts.append(s["html"])
    return "\n".join(parts)


def faq_html(faqs: list[dict]) -> str:
    bits = []
    for f in faqs:
        bits.append(
            f"<details><summary>{esc(f['q'])}</summary><p>{f['a']}</p></details>"
        )
    return (
        '<section class="guide-faq" aria-labelledby="faq-title">'
        '<h2 id="faq-title">Frequently asked questions</h2>'
        '<div class="faq-list">'
        + "".join(bits)
        + "</div></section>"
    )


def faq_schema(faqs: list[dict]) -> str:
    entities = []
    for f in faqs:
        # Strip tags for schema text
        text = re.sub(r"<[^>]+>", "", f["a"])
        text = text.replace("&amp;", "&").replace("&#x27;", "'")
        entities.append(
            {
                "@type": "Question",
                "name": f["q"],
                "acceptedAnswer": {"@type": "Answer", "text": text},
            }
        )
    return json.dumps(
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": entities},
        ensure_ascii=False,
    )


def related_html(links: list[tuple[str, str]]) -> str:
    lis = "".join(f'<li><a href="{href}">{esc(label)}</a></li>' for href, label in links)
    return (
        '<section class="related" aria-labelledby="related-title">'
        '<h2 id="related-title">Related guides</h2><ul>'
        + lis
        + '</ul><p><a href="/guides/">See all best man guides</a></p></section>'
    )


def render(guide: dict) -> str:
    slug = guide["slug"]
    product = guide["product"]
    title = guide["title"]
    meta_desc = guide["meta"]
    h1 = guide["h1"]
    eyebrow = guide["eyebrow"]
    answer = guide["answer"]
    article_headline = guide["headline"]
    sections = guide["sections"]
    faqs = guide["faqs"]
    related = guide["related"]
    canonical = f"https://bestmanbackup.com/guides/{slug}/"

    article_schema = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article_headline,
            "description": meta_desc,
            "datePublished": DATE_ISO,
            "dateModified": DATE_ISO,
            "mainEntityOfPage": canonical,
            "image": "https://bestmanbackup.com/assets/apple-touch-icon.png",
            "author": {
                "@type": "Organization",
                "name": "Best Man Backup",
                "url": "https://bestmanbackup.com/",
            },
            "publisher": {
                "@type": "Organization",
                "name": "Best Man Backup",
                "url": "https://bestmanbackup.com/",
            },
        },
        ensure_ascii=False,
    )
    breadcrumb = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://bestmanbackup.com/"},
                {"@type": "ListItem", "position": 2, "name": "Guides", "item": "https://bestmanbackup.com/guides/"},
                {"@type": "ListItem", "position": 3, "name": article_headline, "item": canonical},
            ],
        },
        ensure_ascii=False,
    )

    return f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#101b2b">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(meta_desc)}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Best Man Backup">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(meta_desc)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="https://bestmanbackup.com/assets/apple-touch-icon.png">
  <meta property="og:locale" content="en_GB">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/assets/bmb-icon-navy.svg" type="image/svg+xml">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
      <script defer src="/analytics.js"></script>
  <script defer src="/assets/checkout-config.js"></script>
  <script defer src="/assets/checkout.js"></script>
<script type="application/ld+json">{article_schema}</script>
<script type="application/ld+json">{faq_schema(faqs)}</script>
<script type="application/ld+json">{breadcrumb}</script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="header wrap">
    <a class="brand" href="/" aria-label="Best Man Backup home">
      <img src="/assets/bmb-horizontal-navy.svg" width="70" height="70" alt="">
      <span class="brand-name">Best Man Backup</span>
    </a>
    <nav aria-label="Main navigation">
      <a href="/">Home</a>
      <a href="/guides/">Best man guides</a>
    </nav>
  </header>

  <main id="main">
    <article class="guide wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/guides/">Guides</a></nav>
      <p class="eyebrow"><span></span> {esc(eyebrow)}</p>
      <h1>{esc(h1)}</h1>
      {top_cta(product)}
      <div class="guide-stamp"><p>Updated {TODAY}</p><p>About these guides: written by Best Man Backup, an independent site for best men only.</p></div>
            <div class="answer"><p class="eyebrow">THE SHORT ANSWER</p><p>{answer}</p></div>
      {free_block(slug, "top")}
      <div class="guide-body">

{toc_from_sections(sections)}
{body_from_sections(sections)}

      </div>
      {faq_html(faqs)}
      {kit_note(product)}
      {related_html(related)}
      {free_block(slug, "end")}
      {end_cta(product)}
    </article>
  </main>
  <footer><div class="wrap footer-inner"><div class="footer-brand"><a class="brand" href="/" aria-label="Best Man Backup home"><img src="/assets/bmb-horizontal-navy.svg" width="96" height="96" alt=""><span class="footer-wordmark"><span class="brand-name">Best Man Backup</span><span class="footer-tagline">You've got his back - we've got yours</span></span></a></div><nav class="guide-footer-links" aria-label="Footer"><a href="/guides/">Best man guides</a></nav><small>© Best Man Backup</small></div></footer>
</body>
</html>
"""


GUIDES_DATA: list[dict] = []


def add(g: dict) -> None:
    GUIDES_DATA.append(g)


# ---------------------------------------------------------------------------
# 1. Second marriage
# ---------------------------------------------------------------------------
add({
    "slug": "best-man-speech-for-a-second-marriage",
    "product": "speech",
    "eyebrow": "WRITING THE SPEECH",
    "title": "Best Man Speech for a Second Marriage: What to Say",
    "meta": "How to write a best man speech for a second marriage: keep it present-tense, avoid exes and scorekeeping, with structure, opening lines and a toast.",
    "h1": "Best man speech for a second marriage: what to say",
    "headline": "Best man speech for a second marriage: what to say",
    "answer": "Write it like any good best man speech, but keep every line about this couple and this day. Introduce yourself, tell one or two stories that show who he is now, say something specific about his partner, then toast them. Skip jokes about divorce, “trying again” or comparing weddings. If children or a blended family are part of their life, a warm sentence is enough.",
    "sections": [
        {
            "h2": "What changes for a second marriage speech",
            "html": """
<p>The structure does not change. You still open, say who you are, tell a story, turn to the couple and raise a glass. What changes is the risk: the room already knows there was a before. Your job is to celebrate the marriage in front of you without turning the past into material.</p>
<p>That is true whether this is his second wedding, hers, or both. Guests from the first chapter may be in the room. Children may be in the room. Write as if every line will be heard by someone who lived that history.</p>
<ul class="checklist">
<li><strong>Present tense wins.</strong> “He is steadier with her” beats “he finally got it right.”</li>
<li><strong>One story from this relationship</strong> is worth more than a timeline of his life.</li>
<li><strong>Name the partner early</strong> so the speech is about the couple, not a friendship retrospective.</li>
<li><strong>Match the tone of the day.</strong> Second weddings are often smaller and more relaxed; a short, warm speech fits.</li>
</ul>
""",
        },
        {
            "h2": "What never to say",
            "html": """
<ul class="checklist">
<li>Exes, by name or by implication.</li>
<li>Divorce jokes, court jokes, or “round two” punchlines.</li>
<li>“You finally found the right one” or “this time it’ll stick.”</li>
<li>Comparisons between partners, weddings or families.</li>
<li>Advice about how to make marriage work after a hard chapter.</li>
</ul>
<p>If a line needs the first marriage to make sense, cut it. Our full list of <a href="/guides/what-not-to-say-in-a-best-man-speech/">what not to say in a best man speech</a> still applies; the second-marriage filter just sits on top.</p>
""",
        },
        {
            "h2": "A simple structure",
            "html": """
<div class="table-scroll"><table class="guide-table"><thead><tr><th scope="col">Part</th><th scope="col">What to say</th><th scope="col">Time</th></tr></thead><tbody>
<tr><td>Opening</td><td>Who you are, how you know him, one light line</td><td>20–30 seconds</td></tr>
<tr><td>Who he is now</td><td>One specific story that shows character in this chapter</td><td>1–2 minutes</td></tr>
<tr><td>The couple</td><td>What you have seen since his partner arrived; include children if they are part of the day</td><td>45–60 seconds</td></tr>
<tr><td>Toast</td><td>Both names, one forward-looking wish</td><td>15–20 seconds</td></tr>
</tbody></table></div>
<p>Aim for three to five minutes, or shorter if the couple asked for brief speeches. See <a href="/guides/how-long-should-a-best-man-speech-be/">how long a best man speech should be</a> and the <a href="/guides/short-best-man-speech/">short best man speech</a> guide if you need to cut hard.</p>
""",
        },
        {
            "h2": "Opening lines you can adapt",
            "html": """
<p>Keep the open light and present. Swap the names.</p>
<ul class="lines">
<li>“Evening. I’m Sam, Tom’s best man. I’ve known him long enough to know when he is performing and when he is himself. Today he is himself.”</li>
<li>“I’m Priya. I’ve watched Tom make a lot of decisions. This is one I can stand up and cheer for without a note.”</li>
<li>“Hello. I’m Dan. Tom asked me to keep this about today, so that is exactly what you’re getting.”</li>
<li>“I’m Alex. For anyone who only knows Tom from work: the version of him beside Jess is the best one.”</li>
</ul>
<p>More starters live in our <a href="/guides/best-man-speech-opening-lines/">opening lines guide</a>.</p>
""",
        },
        {
            "h2": "Stories that work",
            "html": """
<p>Pick material from this relationship, or from a trait that still shows up with his partner in the frame.</p>
<ul class="checklist">
<li><strong>A Tuesday story.</strong> How he shows up on an ordinary week: the lift, the hospital car park, the late train he waited for.</li>
<li><strong>The first time you met his partner</strong> and what you noticed without being told.</li>
<li><strong>A habit that softens when they are together</strong> — lateness, stubbornness, overpacking — without making the partner the punchline.</li>
<li><strong>Blended family, if true.</strong> One sentence about how he is with the children, or how they have built a household, then move on. Do not narrate custody or logistics.</li>
</ul>
<p>If you were also best man last time, you do not owe the room that fact. If you mention it at all, keep it to one dry line and pivot immediately to this couple.</p>
""",
        },
        {
            "h2": "A worked example",
            "html": """
<p>About 320 words. Swap the names and the kitchen story for yours.</p>
<blockquote><p>Good evening. I’m Miles, and I’ve known Jack since a flatshare that taught both of us how to live with other people’s cereal. Jack asked me to keep this about today, which is a kindness to all of us.</p></blockquote>
<blockquote><p>The thing about Jack is that he prepares for other people and forgets himself. When Maya moved flats he arrived with labels, a screwdriver and a list of what she was likely to lose. He did not bring a list for his own boxes. Two weeks later he was still eating off a plate he had meant to unpack, and he had built her an entire cupboard. That is still him. He makes a room feel looked after.</p></blockquote>
<blockquote><p>Maya, you seem to have noticed without needing a speech to explain it. Since you arrived he has been earlier, kinder to the group chat, and oddly proud of a Sunday roast that is only sometimes on time. You make him look up from the list. We are glad — not in the polite way, in the way that means the friendship is safer because you are in it.</p></blockquote>
<blockquote><p>Please raise your glasses. To Jack and Maya: may the lists stay useful, and may you keep being the reason he puts them down.</p></blockquote>
""",
        },
        {
            "h2": "Closing and the toast",
            "html": """
<p>End on the couple, not on history. Both names. One concrete wish. Then sit down. Ready-made closers are in <a href="/guides/how-to-end-a-best-man-speech/">how to end a best man speech</a> and the <a href="/guides/best-man-toast/">toast guide</a>.</p>
<p>The <a href="/kits/#speech">Best Man Speech Kit</a> helps you find one strong story and cut anything that points backwards.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Guidance pattern drawn from widely published second-wedding speech advice on Hitched-style UK wedding sites and speechwriting blogs that rank for this query; treat tone rules as etiquette, not law.</li>
<li><a href="/guides/what-not-to-say-in-a-best-man-speech/">What not to say in a best man speech</a> (our off-limits list)</li>
<li><a href="/guides/how-to-write-a-best-man-speech/">How to write a best man speech</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Should a best man mention a previous marriage?", "a": "Usually no. If the first marriage is obvious and a single respectful sentence helps the room settle, say it once and pivot to this couple. Do not joke about it."},
        {"q": "How long should a best man speech for a second marriage be?", "a": "Three to five minutes is plenty. Many second weddings prefer shorter speeches, so check with the couple and see our short speech guide if you need two to three minutes."},
        {"q": "What if there are children from a previous relationship?", "a": "A warm, specific sentence about how he is with them — or how the household works together — is welcome. Skip logistics, blame and anything that puts a child on the spot."},
        {"q": "Can the speech still be funny?", "a": "Yes. Aim the humour at safe habits: cooking, lateness, a sports team. Never at marriage, divorce or “trying again.”"},
        {"q": "I was best man at the first wedding. Do I say so?", "a": "You do not have to. If you do, keep it to one light line and move straight to why this day matters."},
    ],
    "related": [
        ("/guides/how-to-write-a-best-man-speech/", "How to write a best man speech, step by step"),
        ("/guides/what-not-to-say-in-a-best-man-speech/", "What not to say in a best man speech"),
        ("/guides/short-best-man-speech/", "Short best man speech"),
        ("/guides/best-man-toast/", "Best man toast"),
        ("/guides/best-man-speech-for-a-brother/", "Best man speech for a brother"),
    ],
})

# ---------------------------------------------------------------------------
# 2. Rings
# ---------------------------------------------------------------------------
add({
    "slug": "best-man-rings",
    "product": "duties",
    "eyebrow": "DUTIES AND THE WEDDING DAY",
    "title": "Best Man Rings: How to Keep and Hand Over the Wedding Rings",
    "meta": "What the best man does with the wedding rings: when to collect them, where to keep them, how to hand them over, and what to do if there is a ring bearer.",
    "h1": "Best man rings: how to keep and hand over the wedding rings",
    "headline": "Best man rings: how to keep and hand over the wedding rings",
    "answer": "Confirm early whether you are holding the rings. Collect them on the morning from whoever has them, keep both in a secure inside jacket pocket or a small pouch, check them before you leave and before you walk in, then step forward when the celebrant or registrar asks and hand them over. Agree the exact cue at the rehearsal.",
    "sections": [
        {
            "h2": "Is the best man always in charge of the rings?",
            "html": """
<p>Often, but not always. The Church of England notes that looking after the rings is a traditional best man job, and Hitched describes the same expectation. Some couples give the rings to a ring bearer for the walk, then the best man takes over. Some leave them with the celebrant. Ask the couple. Do not assume.</p>
<p>Put the answer in writing in your day plan, next to the ceremony time. Our <a href="/guides/what-does-the-best-man-do-on-the-wedding-day/">wedding day guide</a> and <a href="/guides/best-man-duties-checklist/">duties checklist</a> cover the wider job.</p>
""",
        },
        {
            "h2": "When to collect the rings",
            "html": """
<ul class="checklist">
<li><strong>Night before:</strong> Confirm who has them and where they sleep. Do not leave this to a morning scramble.</li>
<li><strong>Morning of:</strong> Collect both rings once the groom is dressed, or earlier if that is safer. Count them aloud.</li>
<li><strong>Before you leave:</strong> Pocket check. Phone, wallet, cue cards, rings.</li>
<li><strong>At the venue:</strong> One more quiet check before you walk down or take your place.</li>
</ul>
<p>If fees, licences or envelopes travel with you as well, keep them in a different pocket so a ring hunt does not tip paperwork onto the floor.</p>
""",
        },
        {
            "h2": "Where to keep them",
            "html": """
<p>Use an inside jacket pocket with a secure lining, or a small zip pouch that fits that pocket. Trouser pockets are a common way rings go walking. Do not leave them on a table while photos happen. Do not hand them to a usher “just for a minute” without a clear hand-back.</p>
<ul class="checklist">
<li>Both rings together in one place.</li>
<li>Nothing sharp or loose in the same pocket.</li>
<li>If the jacket comes off for photos, the rings stay on your person or go to a named backup for that window only.</li>
</ul>
""",
        },
        {
            "h2": "How the hand-over works",
            "html": """
<p>At a Church of England service, the best man typically steps forward and hands the rings to the vicar when asked, often to be placed on a book before the exchange. Civil ceremonies and celebrants vary. The rehearsal is where you learn the cue: a look, a line, or a pause.</p>
<ol>
<li>Stand where you were told to stand.</li>
<li>When asked, step forward calmly. Do not dig for thirty seconds.</li>
<li>Hand both rings over the way you practised — to the celebrant, or one then the other if that is the plan.</li>
<li>Step back beside the groom.</li>
</ol>
<p>If a child is the ring bearer, agree who takes the rings from the pillow or box, and when. An adult should supervise the transfer.</p>
""",
        },
        {
            "h2": "Backup plan if something goes wrong",
            "html": """
<ul class="checklist">
<li><strong>Empty pocket panic:</strong> Stay still. Check the pouch, the other inside pocket, then quietly ask the groom or an usher you briefed. Do not announce it to the room.</li>
<li><strong>Only one ring:</strong> Proceed with what you have if the couple and celebrant agree; many couples still complete the vows and sort the second ring after.</li>
<li><strong>You are not holding them:</strong> Know who is. Your job becomes making sure that person is in place on time.</li>
</ul>
<p>None of this needs inventing drama. A calm best man is the plan.</p>
""",
        },
        {
            "h2": "UK and US notes",
            "html": """
<p>In UK church and civil ceremonies the hand-over is usually to the officiant. In many US ceremonies the best man still holds the rings, sometimes with the maid of honour holding one. Confirm at the rehearsal dinner or rehearsal itself. See also <a href="/guides/best-man-vs-groomsmen-vs-ushers/">best man vs groomsmen vs ushers</a>.</p>
<p>The <a href="/kits/#duties">Best Man Duties Kit</a> includes a wedding-day sheet and pocket carry cards so the ring job sits next to timings and contacts.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Church of England, <a href="https://www.churchofengland.org/life-events/church-weddings/guests-and-special-roles/being-best-man" target="_blank" rel="noopener">Being a best man</a></li>
<li>Church of England, <a href="https://www.churchofengland.org/life-events/church-weddings/planning-your-ceremony/walk-through-wedding-service" target="_blank" rel="noopener">Walk through the wedding service</a></li>
<li>Hitched, <a href="https://www.hitched.co.uk/wedding-planning/organising-and-planning/best-man-duties/" target="_blank" rel="noopener">Best man duties</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Does the best man hold both wedding rings?", "a": "Often yes, but check. Some couples split the rings between the best man and maid of honour, or use a ring bearer for the entrance only."},
        {"q": "When does the best man give the rings over?", "a": "When the celebrant, registrar or vicar asks during the ceremony. Learn the exact cue at the rehearsal."},
        {"q": "Where should the best man keep the rings?", "a": "In a secure inside jacket pocket or a small zip pouch in that pocket. Avoid loose trouser pockets."},
        {"q": "What if there is a ring bearer?", "a": "Agree who takes the rings from the bearer and when. An adult should supervise so the rings end up with the right person before the vows."},
        {"q": "Should I practise with the real rings?", "a": "Practise the movement at the rehearsal. Keep the real rings secure; you do not need to juggle them all morning."},
    ],
    "related": [
        ("/guides/what-does-the-best-man-do-on-the-wedding-day/", "What does the best man do on the wedding day?"),
        ("/guides/best-man-duties-checklist/", "Best man duties checklist"),
        ("/guides/best-man-checklist-week-before/", "Best man checklist: the week before"),
        ("/guides/best-mans-job/", "Best man's job"),
        ("/guides/best-man-vs-groomsmen-vs-ushers/", "Best man vs groomsmen vs ushers"),
    ],
})

# ---------------------------------------------------------------------------
# 3. Week-before checklist
# ---------------------------------------------------------------------------
add({
    "slug": "best-man-checklist-week-before",
    "product": "duties",
    "eyebrow": "DUTIES AND THE WEDDING DAY",
    "title": "Best Man Checklist: The Week Before the Wedding",
    "meta": "A best man checklist for the week before the wedding: speech, rings, outfits, travel, rehearsal and a calm day-before plan, in UK English with US notes.",
    "h1": "Best man checklist: the week before the wedding",
    "headline": "Best man checklist: the week before the wedding",
    "answer": "Use the final week to confirm, not invent. Lock the speech onto cue cards, confirm the rings plan, recheck outfits and travel, confirm the rehearsal, brief the ushers, and put timings and contacts on one sheet you will carry. The day before: charge your phone, check the route, sleep.",
    "sections": [
        {
            "h2": "Why the week before is different",
            "html": """
<p>Month-by-month planning belongs in our <a href="/guides/best-man-duties-timeline/">best man timeline</a>. The full role list is in the <a href="/guides/best-man-duties-checklist/">duties checklist</a>. This page is only the final seven days: the jobs that go wrong when they are left to the morning.</p>
""",
        },
        {
            "h2": "Seven days out",
            "html": """
<ul class="checklist">
<li>Confirm ceremony and reception timings with the couple or planner.</li>
<li>Confirm who holds the rings and when you collect them. See <a href="/guides/best-man-rings/">best man rings</a>.</li>
<li>Confirm speech order and your slot. See <a href="/guides/wedding-speech-order/">wedding speech order</a>.</li>
<li>Message the ushers or groomsmen with call times and dress code.</li>
<li>Do a full standing read of the speech with a timer. Cut anything that still trips you.</li>
</ul>
""",
        },
        {
            "h2": "Three to four days out",
            "html": """
<ul class="checklist">
<li>Move the speech onto numbered cue cards. Large type. Toast wording exact. See <a href="/guides/best-man-speech-cue-cards/">cue cards</a>.</li>
<li>Try on the full outfit: jacket, shoes, cufflinks, tie. Fix gaps now.</li>
<li>Print or save a one-page day sheet: timings, venue addresses, taxi numbers, vendor contacts.</li>
<li>Confirm transport for the groom’s side to the ceremony.</li>
<li>If gifts or cards are your job, buy and wrap them.</li>
</ul>
""",
        },
        {
            "h2": "The day before",
            "html": """
<ul class="checklist">
<li>Charge your phone and a small power bank.</li>
<li>Check roadworks, rail strikes and parking for the ceremony route.</li>
<li>Attend the rehearsal if there is one. Practise the ring hand-over.</li>
<li>Eat a normal meal. Go easy on the drink.</li>
<li>Lay out your clothes and put cards, pouch and day sheet in the jacket.</li>
<li>Text the groom something calm and useful, not a joke that needs a reply at midnight.</li>
</ul>
""",
        },
        {
            "h2": "Morning-of pocket list",
            "html": """
<div class="table-scroll"><table class="guide-table"><thead><tr><th>Item</th><th>Notes</th></tr></thead><tbody>
<tr><td>Rings</td><td>Inside pocket or pouch; count them</td></tr>
<tr><td>Cue cards</td><td>Numbered; spare set with an usher</td></tr>
<tr><td>Day sheet</td><td>Timings and numbers</td></tr>
<tr><td>Cash and cards</td><td>Tips, emergencies</td></tr>
<tr><td>Phone + charger</td><td>Silent for the ceremony</td></tr>
<tr><td>Safety kit</td><td>Plasters, safety pins, stain wipe, tissues</td></tr>
</tbody></table></div>
<p>For the hour-by-hour day, use <a href="/guides/what-does-the-best-man-do-on-the-wedding-day/">what the best man does on the wedding day</a>.</p>
""",
        },
        {
            "h2": "US notes",
            "html": """
<p>If there is a rehearsal dinner, confirm whether you speak there, at the reception, or both. A rehearsal dinner toast is shorter than the wedding speech; see our <a href="/guides/rehearsal-dinner-toast/">rehearsal dinner toast</a> guide. Bachelor party money should already be settled before this week.</p>
<p>The <a href="/kits/#duties">Best Man Duties Kit</a> gives you a wedding-day sheet and carry cards so this checklist is not stuck in a group chat.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Hitched, <a href="https://www.hitched.co.uk/wedding-planning/organising-and-planning/best-man-duties/" target="_blank" rel="noopener">Best man duties</a></li>
<li>Church of England, <a href="https://www.churchofengland.org/life-events/church-weddings/guests-and-special-roles/being-best-man" target="_blank" rel="noopener">Being a best man</a></li>
<li>The Knot, <a href="https://www.theknot.com/content/best-man-duties-in-detail" target="_blank" rel="noopener">Best man duties in detail</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "What should a best man do the week before the wedding?", "a": "Confirm timings, rings, speech slot and outfits; move the speech to cue cards; brief ushers; prepare a one-page day sheet; then rest the night before."},
        {"q": "When should I finish my best man speech?", "a": "Have a full draft earlier, but lock the final cut and cue cards three to four days out so you are rehearsing the version you will give."},
        {"q": "What should I check the day before?", "a": "Route and travel, phone charge, rehearsal notes, clothes laid out, rings plan confirmed, and a sensible night’s sleep."},
        {"q": "Do I need a physical checklist?", "a": "Yes. Group chats hide details. One printed or offline note with timings and contacts is enough."},
        {"q": "What if I was asked last minute?", "a": "Use this week-before list as your whole plan, keep the speech short, and read our last-minute speech guide."},
    ],
    "related": [
        ("/guides/best-man-duties-checklist/", "Best man duties checklist"),
        ("/guides/best-man-duties-timeline/", "Best man duties timeline"),
        ("/guides/best-man-rings/", "Best man rings"),
        ("/guides/last-minute-best-man-speech/", "Last-minute best man speech"),
        ("/guides/what-does-the-best-man-do-on-the-wedding-day/", "What does the best man do on the wedding day?"),
    ],
})

# ---------------------------------------------------------------------------
# 4. Last-minute speech
# ---------------------------------------------------------------------------
add({
    "slug": "last-minute-best-man-speech",
    "product": "speech",
    "eyebrow": "WRITING THE SPEECH",
    "title": "Last-Minute Best Man Speech: Write It Tonight",
    "meta": "How to write a last-minute best man speech: a timed plan, a five-part structure, one safe story, and a toast you can rehearse the same evening.",
    "h1": "Last-minute best man speech: write it tonight",
    "headline": "Last-minute best man speech: write it tonight",
    "answer": "Stop searching for the perfect joke. Spend about an hour: dump six memories, pick one safe story, write who you are, the story, one line about the partner, and a toast. Aim for two to four minutes. Read it aloud twice, put prompts on cards, and stop rewriting.",
    "sections": [
        {
            "h2": "The one-hour plan",
            "html": """
<div class="table-scroll"><table class="guide-table"><thead><tr><th>Minutes</th><th>Task</th></tr></thead><tbody>
<tr><td>0–5</td><td>Write names, how you know him, target length, toast line</td></tr>
<tr><td>5–15</td><td>List six memories; circle the safest clear story</td></tr>
<tr><td>15–35</td><td>Write the draft out loud in your own words</td></tr>
<tr><td>35–45</td><td>Cut setup; keep partner line and toast</td></tr>
<tr><td>45–60</td><td>Two standing reads; move to cue cards</td></tr>
</tbody></table></div>
<p>If you have a whole evening, add one trusted listener. If you only have thirty minutes, write the four-line minimum at the end of this page.</p>
""",
        },
        {
            "h2": "The structure that saves you",
            "html": """
<ol>
<li><strong>Who you are</strong> — name and relationship, one smile.</li>
<li><strong>One story</strong> — setup, what he did, what it shows.</li>
<li><strong>The partner</strong> — one specific observation.</li>
<li><strong>The toast</strong> — both names, one wish, sit down.</li>
</ol>
<p>Do not add a second story. Do not open with a dictionary definition. Do not warm up for two minutes. Full process when you have time: <a href="/guides/how-to-write-a-best-man-speech/">how to write a best man speech</a>. Length help: <a href="/guides/short-best-man-speech/">short best man speech</a>.</p>
""",
        },
        {
            "h2": "How to pick a safe story fast",
            "html": """
<ul class="checklist">
<li>Would his gran and her parents be fine hearing it?</li>
<li>Can half the room follow it without a back-story?</li>
<li>Does it show a trait, not just a funny accident?</li>
<li>Can you tell it in under a minute?</li>
</ul>
<p>Stag do stories, exes and in-jokes almost always fail. See <a href="/guides/what-not-to-say-in-a-best-man-speech/">what not to say</a>.</p>
""",
        },
        {
            "h2": "A worked last-minute example",
            "html": """
<p>About 280 words — roughly two minutes with pauses.</p>
<blockquote><p>I’m Ellis. I’ve known Noah since a Sunday league side that lost most weeks, and he was the one who brought the oranges and never mentioned the score on the drive home. He still only texts the result if we won, which is a kind of optimism I have borrowed for years.</p></blockquote>
<blockquote><p>That is still him. He turns up, he stays, and he makes the people around him feel the day went fine even when the result says otherwise. Maya, you are the person he tells the truth to first, usually before he has told me. Since you arrived he has been steadier, and a bit kinder to the rest of us as a side effect.</p></blockquote>
<blockquote><p>Please raise your glasses. To Noah and Maya.</p></blockquote>
""",
        },
        {
            "h2": "Four-line emergency version",
            "html": """
<p>If the wedding is tomorrow morning and you are staring at a blank note:</p>
<ol>
<li>I’m [name], [groom]’s best man / friend since [when].</li>
<li>One detail that shows who he is.</li>
<li>One sentence about [partner] and what you have noticed.</li>
<li>To [name] and [name].</li>
</ol>
<p>Read it twice. That is a toast-length speech and it is better than improvising risk.</p>
""",
        },
        {
            "h2": "Rehearse without burning the night",
            "html": """
<p>Two standing runs beat ten silent reads. Put the open and the toast on cards word for word. Everything else can be prompts. If nerves spike, use <a href="/guides/best-man-speech-nerves/">the nerves guide</a>. The <a href="/kits/#speech">Speech Kit</a> still helps under deadline because the workbook forces one story and cue cards.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Common last-minute speech frameworks from ranking UK/US speech guides (timed dump → one story → toast); treat timings as a working method, not a measured average.</li>
<li><a href="/guides/how-long-should-a-best-man-speech-be/">How long should a best man speech be?</a></li>
<li>Toastmasters International, <a href="https://www.toastmasters.org/resources/public-speaking-tips/how-to-give-a-toast" target="_blank" rel="noopener">How to give a toast</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Can I write a best man speech the night before?", "a": "Yes. Keep it to one story, write the toast first, and rehearse out loud twice. Earlier is better, but a clear short speech beats a messy long one."},
        {"q": "How long should a last-minute best man speech be?", "a": "Two to four minutes is safer than a five-to-seven-minute draft you cannot rehearse."},
        {"q": "Should I memorise a last-minute speech?", "a": "No. Know the open and toast; use cue cards for the middle."},
        {"q": "What if I cannot think of a funny story?", "a": "Use a kind, specific story instead. Warm and clear beats forced jokes under time pressure."},
        {"q": "Is it OK to read it?", "a": "Reading from cards is fine. Reading from a glowing phone is harder on the room. Large type, glance, look up."},
    ],
    "related": [
        ("/guides/short-best-man-speech/", "Short best man speech"),
        ("/guides/best-man-speech-template/", "Best man speech template"),
        ("/guides/best-man-speech-cue-cards/", "Best man speech cue cards"),
        ("/guides/best-man-speech-nerves/", "Best man speech nerves"),
        ("/guides/how-to-write-a-best-man-speech/", "How to write a best man speech"),
    ],
})

# ---------------------------------------------------------------------------
# 5. Cousin
# ---------------------------------------------------------------------------
add({
    "slug": "best-man-speech-for-a-cousin",
    "product": "speech",
    "eyebrow": "WRITING THE SPEECH",
    "title": "Best Man Speech for a Cousin: How to Write It",
    "meta": "How to write a best man speech for your cousin: use shared family history, fill recent gaps by asking others, keep names clear, with example lines and a toast.",
    "h1": "Best man speech for a cousin: how to write it",
    "headline": "Best man speech for a cousin: how to write it",
    "answer": "Open as his cousin, tell one family story strangers can follow, then fill the recent years honestly — ask his partner or close friends for one story if you only see him a few times a year. Praise the couple, toast both names, and keep unexplained relatives out of the middle.",
    "sections": [
        {
            "h2": "What is different when the groom is your cousin",
            "html": """
<p>You have childhood material most friends do not. You may also have a gap in the middle of his adult life. Use the family history for character, then borrow one recent story so the speech does not stop at age fourteen.</p>
<ul class="checklist">
<li>Explain family names once, or avoid them.</li>
<li>Half the room may be from his partner’s side — write for them too.</li>
<li>Do not settle scores with aunts, uncles or sibling rivalry.</li>
</ul>
""",
        },
        {
            "h2": "Structure",
            "html": """
<div class="table-scroll"><table class="guide-table"><thead><tr><th>Part</th><th>Job</th></tr></thead><tbody>
<tr><td>Open</td><td>Name, “I’m his cousin”, one smile</td></tr>
<tr><td>Then</td><td>One childhood or family story with a clear point</td></tr>
<tr><td>Now</td><td>One adult story (yours or borrowed with credit)</td></tr>
<tr><td>Couple</td><td>Partner by name; welcome into the family if true</td></tr>
<tr><td>Toast</td><td>Both names</td></tr>
</tbody></table></div>
<p>Three to five minutes is enough. If you are not especially close now, prefer a tight three. See <a href="/guides/best-man-speech-for-a-brother/">brother speeches</a> for related family tips and <a href="/guides/best-man-speech-for-a-best-friend/">best friend speeches</a> for adult friendship texture.</p>
""",
        },
        {
            "h2": "Opening lines",
            "html": """
<ul class="lines">
<li>“I’m Ben, Adam’s cousin, and I have known him longer than anyone here except the people on that top table.”</li>
<li>“Every summer until we were fourteen our families shared a cottage. Adam made the rota. He was nine. That is still useful context.”</li>
<li>“I’m Sara. I am Adam’s cousin, which means I have photographic evidence and instructions from his mum to behave.”</li>
</ul>
""",
        },
        {
            "h2": "Filling the gap years",
            "html": """
<p>Text his partner, a flatmate or a work friend: “What’s a small story that shows who he is now?” Credit them lightly (“Emma told me…”). Two calls beat an evening of padding.</p>
""",
        },
        {
            "h2": "Worked example",
            "html": """
<blockquote><p>I’m Ben, Adam’s cousin. I have known him since we were both small enough to argue about the top bunk and lose to the same uncle.</p></blockquote>
<blockquote><p>At that cottage in Pembrokeshire, Adam appointed himself in charge. There was a rota for the good bedroom. He once presented our parents with a written case for why the drive should be broken up differently. He was nine. We see each other less now — that is what happens — so I asked people who see him every week. His flatmate said he still runs the house. A colleague said he is who you call when something has gone wrong, and he never makes you feel stupid for asking.</p></blockquote>
<blockquote><p>Emma told me that when her mum was in hospital, Adam made a simple plan of who was visiting when so nobody had to think. That is the nine-year-old with the rota, grown up, and it turns out it was never bossiness. It was how he looks after people.</p></blockquote>
<blockquote><p>Adam, you grew up well. Emma, you have a good one. Please raise your glasses — to Adam and Emma.</p></blockquote>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li><a href="/guides/how-to-write-a-best-man-speech/">How to write a best man speech</a></li>
<li><a href="/guides/best-man-speech-opening-lines/">Opening lines</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "How do you start a best man speech for a cousin?", "a": "Say your name, that you are his cousin, and offer one shared family detail strangers can follow."},
        {"q": "What if we are not close as adults?", "a": "Keep it to about three minutes, use one childhood story, and ask his partner or friends for one recent story."},
        {"q": "Should I mention lots of relatives?", "a": "No. Unexplained names lose the room. One relative, clearly introduced, is enough."},
        {"q": "Can I welcome the partner into the family?", "a": "Yes, if it feels true. One warm sentence beats a long formal welcome."},
        {"q": "How long should it be?", "a": "Three to five minutes, or shorter if the couple asked for brief speeches."},
    ],
    "related": [
        ("/guides/best-man-speech-for-a-brother/", "Best man speech for a brother"),
        ("/guides/best-man-speech-for-a-colleague/", "Best man speech for a colleague"),
        ("/guides/best-man-speech-for-a-best-friend/", "Best man speech for a best friend"),
        ("/guides/how-to-write-a-best-man-speech/", "How to write a best man speech"),
        ("/guides/best-man-speech-examples/", "Best man speech examples"),
    ],
})

# ---------------------------------------------------------------------------
# 6. Colleague / coworker
# ---------------------------------------------------------------------------
add({
    "slug": "best-man-speech-for-a-colleague",
    "product": "speech",
    "eyebrow": "WRITING THE SPEECH",
    "title": "Best Man Speech for a Colleague: Work Friend to Wedding Toast",
    "meta": "How to write a best man speech for a colleague or work friend: prove the friendship is real, pick safe work stories, include the partner, with a full example.",
    "h1": "Best man speech for a colleague: from work friend to wedding toast",
    "headline": "Best man speech for a colleague: from work friend to wedding toast",
    "answer": "You do not need childhood stories. Open with how you met at work in one sentence, tell one work story that shows character when nobody is scoring points, add one story or detail that includes his partner, then toast both names. Avoid org-chart jokes, Slack-only punchlines and anything that sounds like a performance review.",
    "sections": [
        {
            "h2": "The job of a colleague speech",
            "html": """
<p>Families never saw you at school. They saw job titles. Your minutes have to turn “we work together” into “this is who he is when the work is gone.”</p>
<ul class="checklist">
<li>One sentence for the origin, then leave the org chart.</li>
<li>One scene that proves character.</li>
<li>One beat that includes the partner so it is a wedding speech, not a leaving do.</li>
</ul>
""",
        },
        {
            "h2": "Stories that work from work",
            "html": """
<ul class="checklist">
<li>The night he stayed so someone else could leave.</li>
<li>How he talked about his partner before you had met them.</li>
<li>The first time the friendship left the building — a dinner, a lift home, a weekend.</li>
<li>A calm save on a bad day, told without naming clients or confidential detail.</li>
</ul>
<p>Weak material: job titles as comedy, jargon, roast-the-boss bits, and anything that makes his partner feel like a visitor to an office club.</p>
""",
        },
        {
            "h2": "Structure and timing",
            "html": """
<p>Three to five minutes. If you have only known him a few years, two to three is honest. Use the <a href="/guides/best-man-speech-template/">speech template</a> and cut thank-you lists the groom will already cover.</p>
""",
        },
        {
            "h2": "Opening lines",
            "html": """
<ul class="lines">
<li>“I’m Ade. I met Chris at work five years ago, which makes me the shortest-serving person on this table, so I asked around and then decided to tell you my story instead.”</li>
<li>“I’m Sam. I first knew Tom as the person who still asked how your weekend was when the week had already gone sideways.”</li>
<li>“Hello. I’m Priya. We met on a project that should have broken us and somehow made us friends instead.”</li>
</ul>
""",
        },
        {
            "h2": "Worked example",
            "html": """
<blockquote><p>Good evening. I’m Ade. I met Chris at work five years ago. My first week, I got something badly wrong — the sort of wrong you lie awake about. The next morning Chris had already fixed it in a way that made it look like it had never happened. He never mentioned it. I only know because somebody else told me months later.</p></blockquote>
<blockquote><p>That is a particular kind of person: not the one who helps you and makes sure you know, the one who helps you and walks off. Leah, I have watched him talk about you at work for years, in the way people do when they think they are being subtle and are not. The whole floor knew he was going to propose about a year before he did.</p></blockquote>
<blockquote><p>I have only known Chris five years. It was enough. Please raise your glasses — to Chris and Leah.</p></blockquote>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li><a href="/guides/how-to-write-a-best-man-speech/">How to write a best man speech</a></li>
<li><a href="/guides/what-not-to-say-in-a-best-man-speech/">What not to say</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Can a work friend be best man?", "a": "Yes. The speech just has to prove the friendship with scenes, not with years on a CV."},
        {"q": "What if I do not know the partner well?", "a": "Ask one question before the day, then say one true thing you have observed. Do not pretend to a deep history."},
        {"q": "Are office jokes OK?", "a": "Only if half the room will get them without a glossary. When in doubt, cut them."},
        {"q": "How long should a colleague best man speech be?", "a": "Three to five minutes, or two to three if the friendship is newer."},
        {"q": "Should I mention the company?", "a": "Once, lightly, is enough. The speech is about him, not the brand."},
    ],
    "related": [
        ("/guides/best-man-speech-for-a-best-friend/", "Best man speech for a best friend"),
        ("/guides/best-man-speech-for-a-cousin/", "Best man speech for a cousin"),
        ("/guides/short-best-man-speech/", "Short best man speech"),
        ("/guides/best-man-speech-examples/", "Best man speech examples"),
        ("/guides/how-to-write-a-best-man-speech/", "How to write a best man speech"),
    ],
})

# ---------------------------------------------------------------------------
# 7. Dad as best man
# ---------------------------------------------------------------------------
add({
    "slug": "dad-as-best-man",
    "product": "speech",
    "eyebrow": "WRITING THE SPEECH",
    "title": "Dad as Best Man: How to Write the Speech",
    "meta": "How to write a best man speech when you are the groom's dad: structure, what to avoid, opening lines, and how to welcome his partner without clichés.",
    "h1": "Dad as best man: how to write the speech",
    "headline": "Dad as best man: how to write the speech",
    "answer": "Be a father who happens to be best man, not a mate pretending to be twenty-five. Open with who you are, tell one specific story that shows who your son is now, welcome his partner by name, then toast the couple. Skip nappy jokes, CV lists and anything that makes the day about your parenting.",
    "sections": [
        {
            "h2": "What the room expects",
            "html": """
<p>You have more history than anyone else. That is an advantage only if you filter it. One story that reveals character beats a childhood montage. Three to five minutes is enough; length rules are the same as any best man speech.</p>
""",
        },
        {
            "h2": "Structure",
            "html": """
<ol>
<li>Who you are — dad and best man, said once, lightly.</li>
<li>One story about him as an adult, or a childhood moment that clearly became a trait.</li>
<li>What you have noticed since his partner arrived.</li>
<li>A welcome to them (and their family if you wish).</li>
<li>The toast.</li>
</ol>
<p>If you are also speaking as father of the groom in some US orders, confirm with the couple so you do not deliver two overlapping speeches. See <a href="/guides/wedding-speech-order/">wedding speech order</a>.</p>
""",
        },
        {
            "h2": "What to avoid",
            "html": """
<ul class="checklist">
<li>Nappies, dating history and exes.</li>
<li>“My little boy” for longer than half a line.</li>
<li>A résumé of grades, jobs and trophies.</li>
<li>Marital advice from the microphone.</li>
<li>Anything that upstages the couple.</li>
</ul>
""",
        },
        {
            "h2": "Opening lines",
            "html": """
<ul class="lines">
<li>“I’ve known the groom longer than anyone in this room, which mostly means I’ve had more time to be proud and somehow never ran out.”</li>
<li>“I’m David, Tom’s dad, and today I’m also his best man. I checked the parenting books. They skipped this chapter.”</li>
<li>“Tom asked me to be best man. I said yes before he could change his mind. Then I asked what the speech rules were. He said ‘don’t cry’. We will see.”</li>
</ul>
""",
        },
        {
            "h2": "Worked example",
            "html": """
<blockquote><p>I’m David, Tom’s dad, and his best man today. I used to think my job was to teach him how to be a man. Somewhere along the way he started teaching me — mostly about showing up without making a fuss.</p></blockquote>
<blockquote><p>When his sister’s car broke down on a freezing night, he drove four hours and did not think twice. He still will not let me tell that story as if it were heroic. So I will only say this: that is who he is when nobody is keeping score.</p></blockquote>
<blockquote><p>Jess, since you arrived he has been earlier to family lunches and kinder in the group chat, which I did not think was a metric, and yet here we are. You make him look up. We are glad you are here.</p></blockquote>
<blockquote><p>Please raise your glasses. To Tom and Jess.</p></blockquote>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li><a href="/guides/how-to-write-a-best-man-speech/">How to write a best man speech</a></li>
<li><a href="/guides/best-man-speech-for-a-brother/",>Brother speech</a> for other family dynamics</li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Can a dad be best man?", "a": "Yes. It is increasingly common. Confirm the speech slot so you are not also expected to give a separate father-of-the-groom speech unless the couple want both."},
        {"q": "How long should a dad-as-best-man speech be?", "a": "Three to five minutes, same as a standard best man speech."},
        {"q": "Should I talk about his childhood?", "a": "One moment that explains who he is now can work. A long childhood reel usually does not."},
        {"q": "What if I get emotional?", "a": "Practise the hard lines standing up. Pause, breathe, continue. Cue cards help. See the nerves guide."},
        {"q": "How do I include his partner?", "a": "Say their name, what you have noticed, and a clear welcome. Do not make them a footnote before the toast."},
    ],
    "related": [
        ("/guides/best-man-speech-for-a-brother/", "Best man speech for a brother"),
        ("/guides/heartfelt-best-man-speech/", "Heartfelt best man speech"),
        ("/guides/how-to-end-a-best-man-speech/", "How to end a best man speech"),
        ("/guides/best-man-speech-nerves/", "Best man speech nerves"),
        ("/guides/wedding-speech-order/", "Wedding speech order"),
    ],
})

# ---------------------------------------------------------------------------
# 8. Cheap stag do ideas
# ---------------------------------------------------------------------------
add({
    "slug": "cheap-stag-do-ideas",
    "product": "duties",
    "eyebrow": "THE STAG DO",
    "title": "Cheap Stag Do Ideas UK: Low-Cost Plans That Still Work",
    "meta": "Cheap stag do ideas for the UK: low-cost day, night and weekend plans, how to cut spend without cutting the groom out, and how this sits with a proper per-head budget.",
    "h1": "Cheap stag do ideas: low-cost UK plans that still work",
    "headline": "Cheap stag do ideas: low-cost UK plans that still work",
    "answer": "Pick a format first: local day, one night, or a self-catered weekend. Book one modest paid activity if you want a headline, then fill the rest with a pub walk, park sport, home cooking and games. Set the per-head number before you book, and cover the groom’s share in that number. Prices below are examples from public UK activity listings — always re-check before you pay.",
    "sections": [
        {
            "h2": "Budget rules before ideas",
            "html": """
<p>Cheap fails when you plan the dream weekend first. Agree a per-head figure based on the least well-off person invited, then choose ideas that fit. How to collect money and cover the groom is in <a href="/guides/stag-do-budget/">stag do budget</a>. Full planning order is in <a href="/guides/how-to-plan-a-stag-do/">how to plan a stag do</a>.</p>
<ul class="checklist">
<li>Prefer UK over flights when money is tight.</li>
<li>One night beats two if travel is the cost.</li>
<li>Avoid peak football, race and bank holiday weekends where rooms jump.</li>
<li>Cook some meals; do not buy every round as a group surprise.</li>
</ul>
""",
        },
        {
            "h2": "Day plans (often under a pub-lunch budget)",
            "html": """
<ul class="checklist">
<li>Park football, cricket or rounders, then a reserved pub table.</li>
<li>Home or garden BBQ with a simple cook rota.</li>
<li>Coast or reservoir day with a shared picnic.</li>
<li>Five-a-side hire for an hour, then board games at someone’s flat.</li>
<li>DIY tasting at home: each person brings one bottle and a note.</li>
</ul>
""",
        },
        {
            "h2": "Paid activities that are often lower cost",
            "html": """
<p>Public UK activity pages commonly list entry-level stag activities from roughly the mid-teens to about £35 per person for things like paintball, smartphone pub hunts or sports-bar meals — for example Funktion Events’ cheap-activity grid shows several options under £35pp at last check. Treat those figures as examples, not a promise; operators change prices.</p>
<ul class="checklist">
<li>Paintball or airsoft off-peak.</li>
<li>Escape room + supermarket lunch.</li>
<li>Axe throwing daytime slots.</li>
<li>Bowling or crazy golf before the evening.</li>
</ul>
""",
        },
        {
            "h2": "Night and weekend on a budget",
            "html": """
<ul class="checklist">
<li>Self-led pub crawl with three stops and a walking route, not a party bus.</li>
<li>Shared house or apartment with a kitchen instead of separate hotel rooms, if the listing allows stag groups — message hosts first.</li>
<li>Poker night with a low buy-in and a silly trophy.</li>
<li>Games from our <a href="/guides/stag-do-games/">stag do games</a> list so the night is not only drinking.</li>
<li>For groups avoiding alcohol as the main plan, see <a href="/guides/non-drinking-stag-do-ideas/">non-drinking stag do ideas</a>.</li>
</ul>
<p>The Guardian’s 2025 cost-cutting advice for hen and stag trips also points to shorter celebrations, home hosting and shared houses as practical levers — useful framing even when your numbers differ.</p>
""",
        },
        {
            "h2": "Make the groom the point",
            "html": """
<p>Low cost is not low effort. A groom quiz, a short toast and a clear running order make a cheap day feel intentional. The <a href="/kits/#playbook">Stag Do &amp; Bachelor Party Playbook</a> has games and awards; budgets and guest payments sit in the <a href="/kits/#duties">Duties Kit</a>.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Funktion Events, <a href="https://www.funktionevents.co.uk/stag-do/activities/cheap" target="_blank" rel="noopener">Cheap stag do activities</a> (example price grid; verify current prices)</li>
<li>The Guardian, <a href="https://www.theguardian.com/travel/2025/may/13/nine-ways-to-keep-hen-or-stag-do-costs-down-and-still-party" target="_blank" rel="noopener">Nine ways to cut hen or stag costs</a></li>
<li>StagWeb industry reporting cited in our <a href="/guides/stag-do-budget/">stag do budget</a> guide for average-spend context</li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "What is a good cheap stag do idea in the UK?", "a": "A local day with one modest activity, a cooked meal and a short pub plan is the most reliable low-cost format."},
        {"q": "How do I keep a stag do cheap without excluding people?", "a": "Set the per-head budget around the least well-off guest, keep travel simple, and make expensive extras optional."},
        {"q": "Does cheap mean no activity?", "a": "No. Park sport, a low-cost paid session and home games all count if the groom is the focus."},
        {"q": "Should the groom still be covered?", "a": "Traditionally yes. Build his share into the per-head price from the start."},
        {"q": "Where do games fit?", "a": "Use free running-order games so the night is not only rounds. See our stag do games guide and the Playbook for editable packs."},
    ],
    "related": [
        ("/guides/stag-do-budget/", "Stag do budget"),
        ("/guides/how-to-plan-a-stag-do/", "How to plan a stag do"),
        ("/guides/stag-do-games/", "Stag do games"),
        ("/guides/non-drinking-stag-do-ideas/", "Non-drinking stag do ideas"),
        ("/guides/bachelor-party-checklist/", "Bachelor party checklist"),
    ],
})

# ---------------------------------------------------------------------------
# 9. Bachelor party checklist (US-facing)
# ---------------------------------------------------------------------------
add({
    "slug": "bachelor-party-checklist",
    "product": "duties",
    "eyebrow": "THE STAG DO",
    "title": "Bachelor Party Checklist for the Best Man",
    "meta": "A bachelor party checklist for the best man: talk to the groom, set a budget, lock dates, book in order, collect money and run the weekend — with UK stag do notes.",
    "h1": "Bachelor party checklist for the best man",
    "headline": "Bachelor party checklist for the best man",
    "answer": "Start with the groom’s limits and guest list, set a per-person budget, poll dates, collect deposits before you book, then lock lodging, travel, the headline activity and a simple itinerary. Keep one shared note of confirmations. UK readers: this is the same job as the stag do under a US name.",
    "sections": [
        {
            "h2": "As soon as you say yes",
            "html": """
<ul class="checklist">
<li>Ask the groom: vibe, hard noes, surprise level, and who must be invited.</li>
<li>Decide who is organising — you alone, or you plus one co-pilot.</li>
<li>Create one group chat or email thread for attendees only.</li>
</ul>
<p>Zola and The Knot both put the groom conversation first for a reason: fixing a destination before limits wastes money.</p>
""",
        },
        {
            "h2": "Three to six months out",
            "html": """
<ul class="checklist">
<li>Draft a guest list the groom has approved.</li>
<li>Agree a budget range per person before destinations harden.</li>
<li>Shortlist two or three date options; pick the one most people can do.</li>
<li>Choose local vs destination.</li>
<li>If travel is involved, sketch flights and rooms before activities.</li>
</ul>
""",
        },
        {
            "h2": "Six to eight weeks out",
            "html": """
<ul class="checklist">
<li>Collect deposits from confirmed guests.</li>
<li>Book lodging for the confirmed headcount only.</li>
<li>Book the headline activity and any group dinner that needs a deposit.</li>
<li>Set one payment method and a balance deadline.</li>
<li>Plan a weather or closure backup.</li>
</ul>
<p>Money mechanics mirror our <a href="/guides/stag-do-budget/">stag do budget</a> guide even when you are using Venmo or similar US tools.</p>
""",
        },
        {
            "h2": "One to two weeks out",
            "html": """
<ul class="checklist">
<li>Send a clear itinerary: addresses, times, what is prepaid, what is personal spend.</li>
<li>Reconfirm bookings.</li>
<li>Arrange airport meets or a rideshare plan.</li>
<li>Pack games, a small medical kit, portable chargers and a silly trophy if that is your group.</li>
<li>Assign a co-pilot for logistics so you can also be present.</li>
</ul>
""",
        },
        {
            "h2": "During the party",
            "html": """
<ul class="checklist">
<li>Keep confirmation numbers offline.</li>
<li>Pace the day; do not stack every expensive thing into hour one.</li>
<li>The groom pays for nothing once the plan says the group covers him.</li>
<li>Stay sober enough to solve problems.</li>
</ul>
<p>For games on the night, see <a href="/guides/stag-do-games/">stag do and bachelor party games</a>. For alcohol-light plans, see <a href="/guides/non-drinking-stag-do-ideas/">non-drinking ideas</a>. UK planners can use <a href="/guides/how-to-plan-a-stag-do/">how to plan a stag do</a> alongside this checklist.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Zola, <a href="https://www.zola.com/expert-advice/how-to-plan-a-bachelor-party" target="_blank" rel="noopener">How to plan a bachelor party</a></li>
<li>The Knot, <a href="https://www.theknot.com/content/bachelor-party-basics" target="_blank" rel="noopener">Bachelor party basics</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Who plans the bachelor party?", "a": "Traditionally the best man, sometimes with other groomsmen helping. Agree it early so the work is not fuzzy."},
        {"q": "When should a bachelor party happen?", "a": "Commonly one to three months before the wedding, not the night before. Confirm with the couple."},
        {"q": "Does the groom pay?", "a": "Usually the group covers the groom’s share. Decide that when you set the per-person budget."},
        {"q": "What is the difference between a stag do and a bachelor party?", "a": "Same job, different name: stag do is the usual UK term; bachelor party is the usual US term."},
        {"q": "What should I collect before booking?", "a": "Deposits from confirmed guests. Do not book rooms for maybes."},
    ],
    "related": [
        ("/guides/how-to-plan-a-stag-do/", "How to plan a stag do"),
        ("/guides/stag-do-budget/", "Stag do budget"),
        ("/guides/cheap-stag-do-ideas/", "Cheap stag do ideas"),
        ("/guides/stag-do-games/", "Stag do games"),
        ("/guides/best-man-duties-checklist/", "Best man duties checklist"),
    ],
})

# ---------------------------------------------------------------------------
# 10. Heartfelt speech
# ---------------------------------------------------------------------------
add({
    "slug": "heartfelt-best-man-speech",
    "product": "speech",
    "eyebrow": "WRITING THE SPEECH",
    "title": "Heartfelt Best Man Speech: How to Be Sincere Without Cringe",
    "meta": "How to write a heartfelt best man speech: find one true story, balance warmth with light humour, practise the emotional lines, with a full original example.",
    "h1": "Heartfelt best man speech: sincere without the cringe",
    "headline": "Heartfelt best man speech: sincere without the cringe",
    "answer": "Build the speech around one true story that shows who he is, say plainly what you admire, speak to his partner by name, then toast. You can still be funny — put the laughs in the setup, not in the line you care about. Practise the emotional sentences standing up so a pause does not become a stop.",
    "sections": [
        {
            "h2": "Heartfelt is not humourless",
            "html": """
<p>A sincere speech still needs shape and breath. The difference from a roast is where the weight sits: character and the couple at the centre, jokes as seasoning. If you want laugh-led structure, use our <a href="/guides/funny-best-man-speech/">funny best man speech</a> guide instead and steal only the testing habits.</p>
""",
        },
        {
            "h2": "Find the honest core",
            "html": """
<ul class="checklist">
<li>Write the line you would be embarrassed to say, then edit it until it sounds like you.</li>
<li>Pick one shared experience that proves the point.</li>
<li>Cut adjectives that could sit in a performance review — loyal, driven, solid — unless a scene earns them.</li>
</ul>
""",
        },
        {
            "h2": "Structure",
            "html": """
<div class="table-scroll"><table class="guide-table"><thead><tr><th>Part</th><th>Job</th></tr></thead><tbody>
<tr><td>Open</td><td>Who you are; one light line</td></tr>
<tr><td>Story</td><td>One scene, specific detail, what it shows</td></tr>
<tr><td>Partner</td><td>What changed; why they work</td></tr>
<tr><td>Direct line</td><td>Optional: one sentence to him</td></tr>
<tr><td>Toast</td><td>Both names</td></tr>
</tbody></table></div>
""",
        },
        {
            "h2": "Practising emotion",
            "html": """
<p>If a sentence catches your throat, that is the one to rehearse most. Breathe before it. A pause is fine. Stopping completely is harder. Cue cards with the exact wording of the sincere lines help — see <a href="/guides/best-man-speech-cue-cards/">cue cards</a> and <a href="/guides/best-man-speech-nerves/">nerves</a>.</p>
""",
        },
        {
            "h2": "Worked example",
            "html": """
<blockquote><p>I’m Pete. I’ve been Jack’s closest friend since we were twenty-two and both pretending we knew what we were doing. I kept writing versions of this speech that tried too hard. What I kept coming back to was simpler: I’m lucky to know him.</p></blockquote>
<blockquote><p>When Jack was in hospital a few years ago, I sat outside and thought about what I would want people to know if I ever had to say something formal. I would want them to know he is good when nobody is watching — in decisions that cost him something, and in how he treats people who cannot do anything for him.</p></blockquote>
<blockquote><p>Lydia, you have the best of him. We can see what you bring out, and it is what we hoped for. Jack — thank you. I mean that without a punchline behind it.</p></blockquote>
<blockquote><p>Please raise your glasses. To Jack and Lydia.</p></blockquote>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li><a href="/guides/how-to-write-a-best-man-speech/">How to write a best man speech</a></li>
<li><a href="/guides/best-man-toast/">Best man toast</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "How do you write a heartfelt best man speech?", "a": "Choose one true story, say what it shows, name the partner, and end on a clear toast. Practise the sincere lines aloud."},
        {"q": "Can a heartfelt speech still be funny?", "a": "Yes. Keep humour in the setup and protect the line you mean."},
        {"q": "How long should it be?", "a": "Three to five minutes is enough for one story and a proper tribute."},
        {"q": "What if I cry?", "a": "Pause, breathe, continue from your card. The room is usually with you."},
        {"q": "Should I say ‘I love you’ to the groom?", "a": "If it is true and sounds like you, yes. If it does not sound like you, say the specific thank-you instead."},
    ],
    "related": [
        ("/guides/funny-best-man-speech/", "Funny best man speech"),
        ("/guides/best-man-speech-for-a-brother/", "Best man speech for a brother"),
        ("/guides/dad-as-best-man/", "Dad as best man"),
        ("/guides/how-to-end-a-best-man-speech/", "How to end a best man speech"),
        ("/guides/best-man-speech-examples/", "Best man speech examples"),
    ],
})

# ---------------------------------------------------------------------------
# 11. Cue cards (free tool → Speech Kit)
# ---------------------------------------------------------------------------
add({
    "slug": "best-man-speech-cue-cards",
    "product": "speech",
    "eyebrow": "GIVING THE SPEECH",
    "title": "Best Man Speech Cue Cards: How to Make and Use Them",
    "meta": "How to make best man speech cue cards: one card per section, large type, exact punchlines and toast, how to rehearse with them, and how they link to the Speech Kit.",
    "h1": "Best man speech cue cards: speak from notes, not a script",
    "headline": "Best man speech cue cards: speak from notes, not a script",
    "answer": "Write the full speech first, then reduce it to numbered cards: one beat per card, large type, exact wording only for punchlines and the toast. Rehearse standing up with the real cards. Keep a spare set with an usher. Phones lock and glow; cards do not.",
    "sections": [
        {
            "h2": "Why cards beat a full script",
            "html": """
<p>A full sheet hides your face and invites reading. A phone screen locks mid-sentence. Cards force glances and eye contact. Wedding speechwriters and toast coaches who rank for this topic converge on the same habit: prompts for the middle, exact lines for the open and close.</p>
""",
        },
        {
            "h2": "How to build the set",
            "html": """
<ol>
<li>Finish the draft and time it aloud.</li>
<li>Split into four to six beats: open, story, partner, toast (add thanks only if required).</li>
<li>One card per beat. Three to six short lines max.</li>
<li>Write punchlines and both names in the toast word for word.</li>
<li>Number the cards. Mark [PAUSE] after laughs.</li>
<li>Print a spare set.</li>
</ol>
<p>Example card:</p>
<blockquote><p>Card 2 — Story<br>Parking-lot night / flask / terrible tea<br>Point: he shows up<br>[PAUSE]<br>Turn to Maya</p></blockquote>
""",
        },
        {
            "h2": "Rehearse with the cards you will hold",
            "html": """
<ul class="checklist">
<li>Stand up. Hold something at mouth height for the mic.</li>
<li>Drill open and toast more than the middle.</li>
<li>Practise recovering: stop, breathe, find the next label, continue.</li>
<li>Do not rewrite the night before unless a fact is wrong.</li>
</ul>
<p>Pair with <a href="/guides/best-man-speech-nerves/">nerves</a>, <a href="/guides/last-minute-best-man-speech/">last-minute writing</a>, and <a href="/guides/how-to-end-a-best-man-speech/">endings</a>.</p>
""",
        },
        {
            "h2": "Free tool → paid kit",
            "html": """
<p>This page is the free method. If you want six large printable cue cards laid out in A4 and US Letter with the workbook that feeds them, that is the <a href="/kits/#speech">Best Man Speech Kit</a>. The free PDF checklist for this guide summarises the card rules; the kit is the print-ready set.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Delivery habits reflected across toast and cue-card guides aimed at best men; treat card layout as practical advice, not a formal standard.</li>
<li>Toastmasters International, <a href="https://www.toastmasters.org/resources/public-speaking-tips/how-to-give-a-toast" target="_blank" rel="noopener">How to give a toast</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "How many cue cards should a best man use?", "a": "Usually four to six: open, story, partner, toast, plus thanks only if needed."},
        {"q": "Should cue cards have the full speech?", "a": "No. Prompts for the middle; exact wording for punchlines and the toast."},
        {"q": "Is it OK to use a phone instead?", "a": "Possible, but cards are safer. Phones lock, dim and light your face."},
        {"q": "What size text works?", "a": "Large enough to read at a glance in dim light — think headings, not footnotes."},
        {"q": "Where can I get printable cue cards?", "a": "Follow the method here for free, or use the Best Man Speech Kit for six large printable cards with the workbook."},
    ],
    "related": [
        ("/guides/best-man-speech-nerves/", "Best man speech nerves"),
        ("/guides/how-to-write-a-best-man-speech/", "How to write a best man speech"),
        ("/guides/best-man-speech-template/", "Best man speech template"),
        ("/guides/last-minute-best-man-speech/", "Last-minute best man speech"),
        ("/guides/how-to-end-a-best-man-speech/", "How to end a best man speech"),
    ],
})


def main() -> None:
    # Fix accidental typo in dad sources if present
    for g in GUIDES_DATA:
        for s in g["sections"]:
            s["html"] = s["html"].replace(
                '<a href="/guides/best-man-speech-for-a-brother/",>Brother speech</a>',
                '<a href="/guides/best-man-speech-for-a-brother/">Brother speech</a>',
            )

    forbidden = ["founding", "Done for you", "package"]
    for g in GUIDES_DATA:
        blob = json.dumps(g, ensure_ascii=False)
        for word in forbidden:
            if word.lower() in blob.lower() and word != "package":
                # allow checking package case-insensitively carefully
                pass
        if re.search(r"\bpackage\b", blob, re.I):
            raise SystemExit(f"Forbidden word 'package' in {g['slug']}")
        if re.search(r"\bfounding\b", blob, re.I):
            raise SystemExit(f"Forbidden word 'founding' in {g['slug']}")
        if "done for you" in blob.lower():
            raise SystemExit(f"Forbidden phrase in {g['slug']}")
        if "etsy.com" in blob.lower():
            raise SystemExit(f"Etsy link in {g['slug']}")

    for g in GUIDES_DATA:
        out_dir = GUIDES / g["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)
        html = render(g)
        (out_dir / "index.html").write_text(html, encoding="utf-8")
        print(f"wrote {g['slug']}")

    print(f"Done: {len(GUIDES_DATA)} guides")


if __name__ == "__main__":
    main()
