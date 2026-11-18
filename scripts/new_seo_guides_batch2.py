#!/usr/bin/env python3
"""Generate 10 more SEO guides (batch 2) to reach 50 free guides. Run from repo root."""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

spec = importlib.util.spec_from_file_location("ng", ROOT / "scripts" / "new_seo_guides.py")
ng = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(ng)

# Stamp new pages with today's date
ng.TODAY = "18 November 2026"
ng.DATE_ISO = "2026-11-18"

GUIDES: list[dict] = []


def add(g: dict) -> None:
    GUIDES.append(g)


# 1 ------------------------------------------------------------------------
# sister guide removed per brand direction (not a women's/sibling-bride platform page)

# 2 ------------------------------------------------------------------------
add({
    "slug": "best-man-gift-ideas",
    "product": "duties",
    "eyebrow": "DUTIES AND THE WEDDING DAY",
    "title": "Best Man Gift Ideas for the Groom (and Thank-Yous)",
    "meta": "Best man gift ideas for the groom: what to buy from the groomsmen, when to give it, budget ranges from public UK retailers, and thank-you gifts the other way.",
    "h1": "Best man gift ideas for the groom",
    "headline": "Best man gift ideas for the groom",
    "answer": "As best man you usually organise a gift to the groom from the groomsmen or ushers, timed for the morning of the wedding or the night before. Pick something he will use, collect money early, and keep receipts. Separate from that: the couple may thank you with a small gift — that is their choice, not your invoice.",
    "sections": [
        {
            "h2": "Two different gifts people mix up",
            "html": """
<p><strong>Gift to the groom</strong> — often organised by the best man, paid for by the groomsmen together. <strong>Thank-you to the best man</strong> — from the couple, optional, and not something you should hint about. This page is mainly about the first. Money etiquette for suits and the stag sits in <a href="/guides/what-does-the-best-man-pay-for/">what the best man pays for</a>.</p>
""",
        },
        {
            "h2": "How to organise the groomsmen gift",
            "html": """
<ol>
<li>Ask the groom quietly what he would actually use — or ask his partner if surprises are welcome.</li>
<li>Set a per-person amount the least well-off groomsman can afford.</li>
<li>Collect money before you order. Same discipline as a <a href="/guides/stag-do-budget/">stag do budget</a>.</li>
<li>Buy once. Avoid six competing small gifts.</li>
<li>Give it on the morning, at the rehearsal dinner, or the night before — not mid-ceremony.</li>
</ol>
""",
        },
        {
            "h2": "Ideas that tend to land",
            "html": """
<p>UK gift retailers that rank for “best man gifts” lean hard on engraved cufflinks, hip flasks, whisky glasses and wallets. Use those lists as inspiration, not as a shopping order. Prefer something matched to him:</p>
<ul class="checklist">
<li><strong>Useful on the day:</strong> cufflinks, tie bar, leather card holder he will carry.</li>
<li><strong>Useful after:</strong> a decent bottle he would not buy himself, a watch strap, a photo book of the friendship.</li>
<li><strong>Experience:</strong> a meal, tickets, or a shared activity after the honeymoon dust settles.</li>
<li><strong>Sentimental without cringe:</strong> a letter from the groomsmen plus one solid object.</li>
</ul>
<p>Published UK gift round-ups (for example Not On The High Street and specialist engraving shops) show many personalised options from roughly the low tens of pounds upward; treat listed prices as examples to re-check, not quotes.</p>
""",
        },
        {
            "h2": "What to avoid",
            "html": """
<ul class="checklist">
<li>Joke gifts that embarrass him in front of parents.</li>
<li>Anything that needs explaining with a stag-do story.</li>
<li>Matching “best man” novelty that only works in a photo.</li>
<li>Last-minute petrol-station bottles with no thought behind them.</li>
</ul>
""",
        },
        {
            "h2": "If the couple thank you",
            "html": """
<p>A card is enough. If they give cufflinks or a bottle, say thank you and move on. You do not owe a matching spend. Your job remains the speech, the rings if asked, and keeping the day steady — see <a href="/guides/best-mans-job/">best man's job</a> and the <a href="/guides/best-man-duties-checklist/">duties checklist</a>.</p>
<p>The <a href="/kits/#duties">Best Man Duties Kit</a> keeps gift, money and day-of jobs in one planner. If the “gift” you care about most is not freezing on the toast, start with the <a href="/kits/#speech">Speech Kit</a>.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Public UK gift catalogues ranking for best man / groomsmen gifts (Not On The High Street, engraving retailers)</li>
<li>Hitched and The Knot duty guides on groomsmen gifts and thank-yous</li>
<li><a href="/guides/what-does-the-best-man-pay-for/">What does the best man pay for?</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Does the best man buy the groom a gift?", "a": "Often the best man organises a shared gift from the groomsmen. Agree a budget and collect money before ordering."},
        {"q": "When should we give the gift?", "a": "Morning of the wedding, the night before, or at the rehearsal dinner are common. Ask the couple what fits the day."},
        {"q": "How much should each groomsman contribute?", "a": "Whatever the least well-off person can afford comfortably. There is no fixed figure."},
        {"q": "Should the groom buy the best man a gift?", "a": "Many couples do; it is a thank-you, not a requirement. A sincere card is enough."},
        {"q": "Is a joint stag gift enough?", "a": "Sometimes. If the stag already includes a present, skip a second obligatory object and write a proper card instead."},
    ],
    "related": [
        ("/guides/what-does-the-best-man-pay-for/", "What does the best man pay for?"),
        ("/guides/best-man-duties-checklist/", "Best man duties checklist"),
        ("/guides/asked-to-be-best-man/", "Asked to be best man"),
        ("/guides/best-man-outfit/", "Best man outfit"),
        ("/guides/best-mans-job/", "Best man's job"),
    ],
})

print("batch2 defined so far", len(GUIDES))
Path("/tmp/bmb-b2-count.txt").write_text(str(len(GUIDES)))

# 3 ------------------------------------------------------------------------
add({
    "slug": "best-man-outfit",
    "product": "duties",
    "eyebrow": "DUTIES AND THE WEDDING DAY",
    "title": "Best Man Outfit: What to Wear, Hire and Check",
    "meta": "Best man outfit guide: match the groom without upstaging him, morning suit vs lounge suit vs black tie, hire timings, fittings and a day-of checklist.",
    "h1": "Best man outfit: what to wear and what to check",
    "headline": "Best man outfit: what to wear and what to check",
    "answer": "Wear what the couple ask you to wear. Usually that means matching the groom’s party with a small difference so he still reads as the groom. Confirm dress code early, book hire or alterations six to eight weeks out, do a full try-on with shoes, and pack a tiny repair kit for the day.",
    "sections": [
        {
            "h2": "Start with the dress code, not Pinterest",
            "html": """
<p>Ask the couple four things: formal level, colour, hire or buy, and who is paying. UK tradition often has the couple covering matching hire for the groom’s side; US groomsmen more often pay themselves. Settle it before anyone books — details in <a href="/guides/what-does-the-best-man-pay-for/">what the best man pays for</a>.</p>
""",
        },
        {
            "h2": "Common UK looks",
            "html": """
<div class="table-scroll"><table class="guide-table"><thead><tr><th>Look</th><th>When it fits</th><th>Notes</th></tr></thead><tbody>
<tr><td>Morning suit</td><td>Formal daytime church or country house</td><td>Tailcoat, waistcoat, striped trousers; top hat often carried</td></tr>
<tr><td>Lounge / three-piece suit</td><td>Most modern weddings</td><td>Navy, charcoal or grey remain the safe defaults</td></tr>
<tr><td>Black tie / dinner suit</td><td>Evening formal</td><td>Bow tie, proper shoes; follow the invitation</td></tr>
<tr><td>Lighter fabrics</td><td>Summer outdoor</td><td>Linen and cotton blends crease — plan for it</td></tr>
</tbody></table></div>
<p>Bridebook’s morning-suit guide describes typical UK hire in a published range of about £100–£250 depending on retailer and what is included; re-check current prices before you budget. John Lewis and specialist hire shops also publish rental ranges that move with season and brand.</p>
""",
        },
        {
            "h2": "How to match the groom without competing",
            "html": """
<ul class="checklist">
<li>Same silhouette and colour family as the groomsmen.</li>
<li>Let the groom take the distinct waistcoat, tie or boutonnière if that is the plan.</li>
<li>Shoes and belt in the same tone across the party.</li>
<li>Check pocket squares and cufflinks so nobody invents a solo theme.</li>
</ul>
<p>Your job includes herding fittings for ushers if asked — see <a href="/guides/best-man-vs-groomsmen-vs-ushers/">best man vs groomsmen vs ushers</a>.</p>
""",
        },
        {
            "h2": "Timeline for hire and fittings",
            "html": """
<ul class="checklist">
<li><strong>6–8 weeks out:</strong> book the shop; get measured; order.</li>
<li><strong>2–3 weeks out:</strong> try the full outfit with the shoes you will wear.</li>
<li><strong>Week of:</strong> confirm collection time; press or steam; check buttons.</li>
<li><strong>Day after:</strong> return hire on time; note damage before you leave the counter.</li>
</ul>
""",
        },
        {
            "h2": "Day-of outfit checklist",
            "html": """
<ul class="checklist">
<li>Jacket, trousers, waistcoat, shirt, tie or cravat</li>
<li>Shoes cleaned; spare laces if you are unlucky</li>
<li>Cufflinks, boutonnière pin, lint roller</li>
<li>Fashion tape, safety pins, stain wipe, pain relief</li>
<li>Inside pocket clear for rings pouch and cue cards</li>
</ul>
<p>Rings and pocket plan: <a href="/guides/best-man-rings/">best man rings</a>. Week-before list: <a href="/guides/best-man-checklist-week-before/">week-before checklist</a>.</p>
<p>The <a href="/kits/#duties">Duties Kit</a> holds the outfit and vendor checklist next to the day sheet. Speech first if that is the panic: <a href="/kits/#speech">Speech Kit</a>.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Bridebook, <a href="https://bridebook.com/uk/article/morning-suit-wedding-guide" target="_blank" rel="noopener">Morning suit wedding guide</a></li>
<li>John Lewis wedding suit hire content</li>
<li>Hitched best man duties (attire and fittings)</li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Does the best man have to match the groom?", "a": "Usually you match the groom’s party. The groom may wear a small difference so he still stands out. Follow what the couple decide."},
        {"q": "Should I hire or buy?", "a": "Hire if you will not wear it again. Buy if you will use the suit and the budget works."},
        {"q": "When should I get fitted?", "a": "About six to eight weeks before is a common hire timeline, with a final try-on closer to the day."},
        {"q": "Who pays for the best man’s suit in the UK?", "a": "Traditionally the couple often cover matching hire, but check. US practice more often has groomsmen paying themselves."},
        {"q": "What shoes should I wear?", "a": "Clean, formal shoes that match the belt and the rest of the party. Break them in before the day."},
    ],
    "related": [
        ("/guides/what-does-the-best-man-pay-for/", "What does the best man pay for?"),
        ("/guides/best-man-checklist-week-before/", "Week-before checklist"),
        ("/guides/best-man-rings/", "Best man rings"),
        ("/guides/best-man-gift-ideas/", "Best man gift ideas"),
        ("/guides/what-does-the-best-man-do-on-the-wedding-day/", "Wedding day jobs"),
    ],
})

# 4 ------------------------------------------------------------------------
add({
    "slug": "stag-do-destinations",
    "product": "duties",
    "eyebrow": "THE STAG DO",
    "title": "Stag Do Destinations: UK and Europe Picks That Fit the Group",
    "meta": "How to choose stag do destinations in the UK and Europe: match budget and vibe, compare popular cities using public operator rankings, and book in the right order.",
    "h1": "Stag do destinations: UK and Europe without the guesswork",
    "headline": "Stag do destinations: UK and Europe without the guesswork",
    "answer": "Pick the destination after you know the budget, the groom’s hard noes, and who can travel. UK cities keep cost and logistics simpler; Europe works when flights and passports are realistic for everyone. Use public operator rankings as a shortlist, then build your own numbers before you book.",
    "sections": [
        {
            "h2": "Decide the filters before the city",
            "html": """
<ul class="checklist">
<li>Per-head budget including travel — see <a href="/guides/stag-do-budget/">stag do budget</a> and <a href="/guides/cheap-stag-do-ideas/">cheap stag do ideas</a>.</li>
<li>Passports, time off, and the earliest anyone can leave on Friday.</li>
<li>Nightlife vs activity vs quiet — ask the groom, not the loudest mate.</li>
<li>Whether drink is central or optional — <a href="/guides/non-drinking-stag-do-ideas/">non-drinking ideas</a>.</li>
</ul>
<p>Full planning order: <a href="/guides/how-to-plan-a-stag-do/">how to plan a stag do</a>.</p>
""",
        },
        {
            "h2": "UK destinations groups actually book",
            "html": """
<p>UK stag operators that publish destination rankings — including Funktion Events’ long-running location lists — repeatedly surface Newcastle, Bristol, Cardiff, Edinburgh, Liverpool and London for domestic weekends. Treat rankings as demand signals from their bookings, not as a quality score for your friendship group.</p>
<ul class="checklist">
<li><strong>Newcastle / Liverpool / Bristol:</strong> walkable nightlife, strong day activities, no passport risk.</li>
<li><strong>Edinburgh / Cardiff:</strong> denser pub culture; good for mixed ages.</li>
<li><strong>London:</strong> maximum choice, higher spend — set the number first.</li>
</ul>
""",
        },
        {
            "h2": "Europe: value, sun and short flights",
            "html": """
<p>Public 2026 operator surveys (for example LastFiesta’s destination and price barometer pieces) commonly place Krakow, Prague and Budapest at the lower end for a two-night city spend excluding flights, with Lisbon and Barcelona mid-range, and Amsterdam higher. Their published per-person city totals are operator field estimates — always rebuild your own spreadsheet with live flights and rooms.</p>
<ul class="checklist">
<li><strong>Value nightlife:</strong> Prague, Krakow, Budapest.</li>
<li><strong>Sun and coast:</strong> Barcelona, Lisbon; Spanish beach resorts appear often in UK operator top tens.</li>
<li><strong>Short hop, premium spend:</strong> Amsterdam, Dublin.</li>
</ul>
""",
        },
        {
            "h2": "How to shortlist in one evening",
            "html": """
<ol>
<li>Write three cities that fit the budget filter.</li>
<li>Price the same weekend: outbound, return, one apartment, one headline activity.</li>
<li>Check stag or group house rules on the listing.</li>
<li>Poll the group with numbers attached, not vibes alone.</li>
<li>Book rooms only for confirmed payers.</li>
</ol>
""",
        },
        {
            "h2": "Once you have a city",
            "html": """
<p>Build a simple running order and games so the weekend is not only bars — <a href="/guides/stag-do-games/">stag do games</a>. The <a href="/kits/#duties">Duties Kit</a> covers budget and guest payments; the <a href="/kits/#playbook">Playbook</a> covers the night itself.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Funktion Events, <a href="https://www.funktionevents.co.uk/stag-do/locations" target="_blank" rel="noopener">stag do locations</a></li>
<li>LastFiesta destination ranking and price barometer articles (operator estimates)</li>
<li>StagWeb destination index</li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "What is the best stag do destination in the UK?", "a": "There is no single best city. Newcastle, Bristol, Liverpool, Cardiff and Edinburgh appear often in operator booking lists because they balance nightlife and logistics."},
        {"q": "What is a good cheap European stag destination?", "a": "Operator price surveys often point to Krakow, Prague and Budapest for lower city costs. Always add your own flight prices."},
        {"q": "Should we go abroad?", "a": "Only if passports, budgets and time off work for the whole invited list. A strong UK weekend beats a stressful flight."},
        {"q": "When should we book?", "a": "As soon as deposits are in and the date is fixed. Rooms and group activities disappear first on popular weekends."},
        {"q": "How do I stop the group arguing?", "a": "Show three priced options and vote once. Re-open only if the winner becomes impossible to book."},
    ],
    "related": [
        ("/guides/how-to-plan-a-stag-do/", "How to plan a stag do"),
        ("/guides/stag-do-budget/", "Stag do budget"),
        ("/guides/cheap-stag-do-ideas/", "Cheap stag do ideas"),
        ("/guides/bachelor-party-checklist/", "Bachelor party checklist"),
        ("/guides/stag-do-games/", "Stag do games"),
    ],
})

# 5 ------------------------------------------------------------------------
add({
    "slug": "best-man-speech-without-notes",
    "product": "speech",
    "eyebrow": "GIVING THE SPEECH",
    "title": "How to Give a Best Man Speech Without Notes",
    "meta": "How to give a best man speech without notes: chunk-and-anchor memory, what to memorise exactly, how to recover if you blank, and when cue cards are still smarter.",
    "h1": "How to give a best man speech without notes",
    "headline": "How to give a best man speech without notes",
    "answer": "Do not memorise every word. Learn four to six beats — open, story, partner, toast — with one anchor word each. Memorise the opening and the toast cold. Rehearse standing up across several days. Keep a tiny backup card in your pocket even if you plan not to use it.",
    "sections": [
        {
            "h2": "Why word-for-word memory backfires",
            "html": """
<p>Wedding rooms punish perfect scripts. One forgotten sentence and the whole chain snaps. Toastmasters advice on speaking without notes, and best-man memory guides that rank for this query, all push structure over verbatim recall. You want portable beats, not a poem.</p>
""",
        },
        {
            "h2": "The chunk-and-anchor method",
            "html": """
<ol>
<li>Write the full speech the way you talk.</li>
<li>Split it into four to six chunks.</li>
<li>Give each chunk one concrete anchor word (bike, flask, Sunday, toast).</li>
<li>Practise each chunk alone until you can start from the anchor.</li>
<li>Chain 1→2, then 2→3, never only from the top.</li>
</ol>
<p>Lock the first two sentences and the final toast word for word. Names go on a card even if everything else is memorised — adrenaline eats names.</p>
""",
        },
        {
            "h2": "A week of practice, not a midnight cram",
            "html": """
<ul class="checklist">
<li>Out loud, standing, same posture as the mic.</li>
<li>Short runs on several days beat one marathon.</li>
<li>After day two, hide the full draft; speak from anchors.</li>
<li>Record one run; fix pace, not personality.</li>
<li>One trusted listener: “Did you hear the names? Did the end land?”</li>
</ul>
<p>Nerves plan: <a href="/guides/best-man-speech-nerves/">speech nerves</a>. If time is gone: <a href="/guides/last-minute-best-man-speech/">last-minute speech</a>.</p>
""",
        },
        {
            "h2": "If you blank",
            "html": """
<ul class="checklist">
<li>Stop. Breathe. Look at the couple.</li>
<li>Say “give me one second” if you need it.</li>
<li>Jump to the next anchor, not back to sentence one.</li>
<li>If nothing returns, go to the toast. Naming both people and raising a glass is a complete ending.</li>
</ul>
""",
        },
        {
            "h2": "When notes are still the better call",
            "html": """
<p>Short speeches, high emotion, or a dual role (joint best men, dad as best man) are safer with <a href="/guides/best-man-speech-cue-cards/">cue cards</a>. Looking up from cards beats a polished freeze. The <a href="/kits/#speech">Speech Kit</a> is built around large printable cards — use them as training wheels even if you aim to go bare on the day.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Toastmasters International, speaking without notes / toolbox guidance</li>
<li>Best-man memory methods described on ranking speech sites (chunking, anchors, bookend memorisation)</li>
<li><a href="/guides/best-man-speech-cue-cards/">Cue cards guide</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Should I memorise my best man speech?", "a": "Memorise the open and toast. Know the middle as story beats, not a script."},
        {"q": "Is it OK to use notes anyway?", "a": "Yes. Cards are normal. The room cares more about warmth than bare hands."},
        {"q": "How long does it take to learn a speech without notes?", "a": "Several short standing sessions across a week beat one late night. Exact hours vary by person and length."},
        {"q": "What if I forget a joke?", "a": "Skip it. Never stop to hunt a punchline. Move to the next beat."},
        {"q": "Can I use a teleprompter app?", "a": "Only if you rehearse with it. A phone that locks mid-toast is worse than a card."},
    ],
    "related": [
        ("/guides/best-man-speech-cue-cards/", "Best man speech cue cards"),
        ("/guides/best-man-speech-nerves/", "Best man speech nerves"),
        ("/guides/how-to-write-a-best-man-speech/", "How to write a best man speech"),
        ("/guides/last-minute-best-man-speech/", "Last-minute best man speech"),
        ("/guides/best-man-speech-mistakes/", "Best man speech mistakes"),
    ],
})

# 6 ------------------------------------------------------------------------
add({
    "slug": "best-man-speech-same-sex-wedding",
    "product": "speech",
    "eyebrow": "WRITING THE SPEECH",
    "title": "Best Man Speech for a Same-Sex Wedding",
    "meta": "How to write a best man speech for a same-sex wedding: confirm titles and speech order, use correct names, tell clean stories, and toast both partners without stereotypes.",
    "h1": "Best man speech for a same-sex wedding",
    "headline": "Best man speech for a same-sex wedding",
    "answer": "Write it like any good best man speech: who you are, one or two clean stories about the person who asked you, specific praise for their partner, toast both names. Confirm titles and running order with the couple. Skip stereotypes, politics-as-comedy, and jokes that treat the wedding as a novelty.",
    "sections": [
        {
            "h2": "What actually changes",
            "html": """
<p>The craft does not change. The logistics might. Same-sex weddings often have two grooms or two brides, sometimes two best men, or titles the couple choose themselves. Guides aimed at gay and lesbian weddings — and same-sex speech examples on toast sites — stress asking about order and language before you write.</p>
<ul class="checklist">
<li>Ask what they call your role and their roles.</li>
<li>Ask who speaks when — do not assume the UK father–groom–best man pattern.</li>
<li>Use the names and pronouns they use.</li>
<li>Celebrate the relationship in front of you, not a history lecture.</li>
</ul>
<p>Speech order help: <a href="/guides/wedding-speech-order/">wedding speech order</a>. Joint delivery: <a href="/guides/joint-best-man-speech/">joint best man speech</a>.</p>
""",
        },
        {
            "h2": "Structure that still works",
            "html": """
<div class="table-scroll"><table class="guide-table"><thead><tr><th>Part</th><th>Job</th></tr></thead><tbody>
<tr><td>Open</td><td>Name, role, how you know them</td></tr>
<tr><td>Story</td><td>One scene that shows character</td></tr>
<tr><td>Partner</td><td>What you have seen since they got together</td></tr>
<tr><td>Toast</td><td>Both names, one forward wish</td></tr>
</tbody></table></div>
<p>Three to five minutes. Warm humour is fine; stereotype humour is not. Off-limits list: <a href="/guides/what-not-to-say-in-a-best-man-speech/">what not to say</a>.</p>
""",
        },
        {
            "h2": "Lines and tone",
            "html": """
<ul class="lines">
<li>“I’m Alex. Jordan asked me to do this job, and I said yes before the logistics email arrived.”</li>
<li>“I’ve known Sam since uni. Tonight is about Sam and Chris — both of them, equally, which somehow still surprises distant relatives.”</li>
<li>“I’ll keep this shorter than the group chat that planned the suits.”</li>
</ul>
<p>If you want heartfelt more than jokes, use <a href="/guides/heartfelt-best-man-speech/">heartfelt best man speech</a>. If you want laughs, stress-test every line with <a href="/guides/funny-best-man-speech/">funny best man speech</a> rules — inclusive room, no cheap shots.</p>
""",
        },
        {
            "h2": "Worked example",
            "html": """
<blockquote><p>I’m Halle. Marlowe asked me to be best man, I said yes, and we agreed not to make the title a whole bit, so that is the last you will hear about it.</p></blockquote>
<blockquote><p>We met on a night shift that should have broken anyone’s patience. Marlowe kept a notebook of what guests needed and somehow still made terrible coffee funny. That attention is who he is when nobody is scoring points.</p></blockquote>
<blockquote><p>Benedict, you are the first person I have watched keep notes on him. You knew his coffee order before I did, and I sat next to him for two years. Thank you for loving that version of him out in the open.</p></blockquote>
<blockquote><p>Please raise your glasses. To Marlowe and Benedict.</p></blockquote>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Gay and Lesbian Weddings guide to best man speeches at gay weddings</li>
<li>Same-sex wedding speech examples published on toast-focused sites</li>
<li><a href="/guides/how-to-write-a-best-man-speech/">How to write a best man speech</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Is a best man speech different at a same-sex wedding?", "a": "The writing craft is the same. Confirm titles, pronouns and speech order, and avoid treating the wedding as a punchline."},
        {"q": "What if there are two best men?", "a": "Split one speech or give two short ones. See the joint best man speech guide and agree the plan with the couple."},
        {"q": "Should I mention equality or politics?", "a": "Only if the couple want that tone. Most rooms want a personal toast, not a speech from the news."},
        {"q": "How do I toast two grooms or two brides?", "a": "Say both names clearly. Practise the toast line so you do not stumble."},
        {"q": "Can humour still work?", "a": "Yes — aim at shared habits and friendship, never at identity stereotypes."},
    ],
    "related": [
        ("/guides/how-to-write-a-best-man-speech/", "How to write a best man speech"),
        ("/guides/joint-best-man-speech/", "Joint best man speech"),
        ("/guides/wedding-speech-order/", "Wedding speech order"),
        ("/guides/heartfelt-best-man-speech/", "Heartfelt best man speech"),
            ],
})

# 7 ------------------------------------------------------------------------
add({
    "slug": "best-man-rehearsal-responsibilities",
    "product": "duties",
    "eyebrow": "DUTIES AND THE WEDDING DAY",
    "title": "Best Man Responsibilities at the Wedding Rehearsal",
    "meta": "Best man responsibilities at the wedding rehearsal: arrive on time, learn the processional and ring hand-off, brief the groomsmen, and keep the dinner toast short if you speak.",
    "h1": "Best man responsibilities at the wedding rehearsal",
    "headline": "Best man responsibilities at the wedding rehearsal",
    "answer": "Show up early, learn where you stand, practise the walk and the ring hand-over, and make sure the groomsmen know the next-day call times. If you speak at the rehearsal dinner, keep it to about a minute and save the main speech for the wedding. The rehearsal is for cues, not comedy sets.",
    "sections": [
        {
            "h2": "Rehearsal vs rehearsal dinner",
            "html": """
<p>The <strong>rehearsal</strong> is the walk-through at the ceremony venue. The <strong>rehearsal dinner</strong> is the meal afterwards — more common as a formal US event, sometimes a quieter UK meal. Toast guidance for the dinner is in <a href="/guides/rehearsal-dinner-toast/">rehearsal dinner toast</a>. This page is about the walk-through and your jobs around it.</p>
""",
        },
        {
            "h2": "Before you arrive",
            "html": """
<ul class="checklist">
<li>Confirm time and address with the couple or planner.</li>
<li>Message the groomsmen the call time and dress code for rehearsal.</li>
<li>Bring a notepad or phone note for cues you must not forget.</li>
<li>Know who has the rings for the real day — practise with stand-ins if needed.</li>
</ul>
""",
        },
        {
            "h2": "During the rehearsal",
            "html": """
<ol>
<li>Stand where you are told — usually immediately beside the groom.</li>
<li>Walk the processional at the pace the coordinator sets (slower than feels natural).</li>
<li>Practise the ring hand-over until it is boring. Details: <a href="/guides/best-man-rings/">best man rings</a>.</li>
<li>Note where you exit and whether you escort anyone.</li>
<li>Ask about microphones, readings, and where you put a drink before the ceremony.</li>
</ol>
<p>US guides (The Knot, Art of Manliness, planner checklists) all treat the best man as the person groomsmen watch for timing. Be the calm clock.</p>
""",
        },
        {
            "h2": "After the walk-through",
            "html": """
<ul class="checklist">
<li>Send the group a short summary: tomorrow’s call time, parking, what to bring.</li>
<li>Confirm you have cue cards and a day sheet ready — <a href="/guides/best-man-checklist-week-before/">week-before checklist</a>.</li>
<li>Eat, hydrate, sleep. Do not treat the dinner as the stag do.</li>
</ul>
""",
        },
        {
            "h2": "If you are asked to toast at dinner",
            "html": """
<p>Sixty to ninety seconds. One story, both names, sit down. Do not burn the wedding speech. Full examples: <a href="/guides/rehearsal-dinner-toast/">rehearsal dinner toast</a>.</p>
<p>The <a href="/kits/#duties">Duties Kit</a> keeps rehearsal cues on the day sheet. If the wedding speech is the real stress, open the <a href="/kits/#speech">Speech Kit</a> first.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>The Knot, best man duties in detail</li>
<li>Art of Manliness, duties of the best man (rehearsal notes)</li>
<li>Church of England guidance on being a best man (ceremony cues)</li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "Does the best man have to go to the rehearsal?", "a": "Yes if there is one. The walk-through cannot cover your cues without you."},
        {"q": "Should I give my full speech at the rehearsal dinner?", "a": "No. Keep any dinner toast short and save the main speech for the wedding."},
        {"q": "What should I practise at the rehearsal?", "a": "Where you stand, walking pace, and the ring hand-over."},
        {"q": "What if there is no formal rehearsal?", "a": "Ask the couple for a five-minute walk-through on the morning or the night before. Still confirm the ring cue."},
        {"q": "Do UK weddings always have a rehearsal dinner?", "a": "Not always. Many UK couples rehearse then eat without US-style toasts. Ask rather than assume."},
    ],
    "related": [
        ("/guides/rehearsal-dinner-toast/", "Rehearsal dinner toast"),
        ("/guides/best-man-rings/", "Best man rings"),
        ("/guides/what-does-the-best-man-do-on-the-wedding-day/", "Wedding day jobs"),
        ("/guides/best-man-checklist-week-before/", "Week-before checklist"),
        ("/guides/best-man-duties-checklist/", "Duties checklist"),
    ],
})

# 8 ------------------------------------------------------------------------
add({
    "slug": "asked-to-be-best-man",
    "product": "speech",
    "eyebrow": "DUTIES AND THE WEDDING DAY",
    "title": "Asked to Be Best Man: What to Do First",
    "meta": "Just asked to be best man? What to say yes to, the first questions to ask the groom, and a simple 30-day starter plan for duties, stag do and speech.",
    "h1": "Asked to be best man: what to do first",
    "headline": "Asked to be best man: what to do first",
    "answer": "Say thank you, then ask what he actually wants from you. In the first week, get the date, budget boundaries, guest-list rules for the stag or bachelor party, and whether you are holding the rings and giving a speech. Write those answers down. Everything else can wait a fortnight.",
    "sections": [
        {
            "h2": "The first conversation",
            "html": """
<p>Reddit threads from first-time best men and Hitched-style duty guides agree on the useful opener: “I’d be honoured — what do you want me to own?” Support looks different at every wedding. One groom wants a full stag weekend; another wants a quiet pub lunch and a short toast.</p>
<ul class="checklist">
<li>Wedding date and ceremony location</li>
<li>Whether there is a stag do / bachelor party, and any hard noes</li>
<li>Who else is in the wedding party</li>
<li>Suit hire vs buy, and who pays</li>
<li>Speech expected? Approximate length?</li>
<li>Rings — you or someone else?</li>
</ul>
""",
        },
        {
            "h2": "First 30 days",
            "html": """
<div class="table-scroll"><table class="guide-table"><thead><tr><th>When</th><th>Do this</th></tr></thead><tbody>
<tr><td>Day 1–3</td><td>Put the wedding date in your calendar; start a single note</td></tr>
<tr><td>Week 1</td><td>Create the groomsmen chat if needed; sketch stag budget filters</td></tr>
<tr><td>Week 2–3</td><td>Read the duties overview; block a weekend for the stag</td></tr>
<tr><td>Week 4</td><td>Start a speech notes file — stories only, no polish yet</td></tr>
</tbody></table></div>
<p>Map the whole arc with <a href="/guides/best-man-duties-timeline/">duties timeline</a> and <a href="/guides/best-mans-job/">best man's job</a>. Money questions: <a href="/guides/what-does-the-best-man-pay-for/">what the best man pays for</a>.</p>
""",
        },
        {
            "h2": "When to say no — or renegotiate",
            "html": """
<p>If you cannot travel, cannot afford the proposed stag, or cannot speak in public even with help, say so early. A partial yes (“I can do the day and the speech, not a destination stag”) is better than a silent spiral. Couples would rather adjust than be surprised.</p>
""",
        },
        {
            "h2": "Where to start on the speech",
            "html": """
<p>Do not write the final draft this month. Collect stories. When you are ready, use <a href="/guides/how-to-write-a-best-man-speech/">how to write a best man speech</a> and the <a href="/kits/#speech">Speech Kit</a> first — most new best men underestimate the toast and overestimate the admin.</p>
<p>Admin and day-of planning live in the <a href="/kits/#duties">Duties Kit</a>.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Public Reddit threads from first-time best men asking what the role includes</li>
<li>Hitched and Brides duty overviews</li>
<li><a href="/guides/best-man-duties-checklist/">Best man duties checklist</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "What do I say when someone asks me to be best man?", "a": "Thank them, then ask what they want you to take ownership of. Clarify stag, speech, suit and rings early."},
        {"q": "Can I say no?", "a": "Yes, if you truly cannot do the job. Be honest early and help them think about who else could step in."},
        {"q": "What is the first thing I should organise?", "a": "The date in your calendar and a written list of expectations. The stag comes after budget filters are clear."},
        {"q": "Do I have to plan a stag do?", "a": "Only if the groom wants one. Some couples skip it or keep it tiny."},
        {"q": "When should I start the speech?", "a": "Collect notes in the first month; draft properly in the final six to eight weeks unless the wedding is sooner."},
    ],
    "related": [
        ("/guides/best-mans-job/", "Best man's job"),
        ("/guides/best-man-duties-timeline/", "Duties timeline"),
        ("/guides/how-to-plan-a-stag-do/", "How to plan a stag do"),
        ("/guides/how-to-write-a-best-man-speech/", "How to write a best man speech"),
        ("/guides/best-man-duties-checklist/", "Duties checklist"),
    ],
})

# 9 ------------------------------------------------------------------------
add({
    "slug": "funny-best-man-speech-stories",
    "product": "speech",
    "eyebrow": "WRITING THE SPEECH",
    "title": "Funny Best Man Speech Stories: How to Pick Ones That Land",
    "meta": "How to pick funny best man speech stories: a safety test, how to tell one story properly, examples of setups that work, and what to cut before the wedding.",
    "h1": "Funny best man speech stories: how to pick ones that land",
    "headline": "Funny best man speech stories: how to pick ones that land",
    "answer": "Choose one or two stories that show character, not a highlight reel of chaos. Run each story through a safety test: would his gran and her parents still like him after hearing it? Tell it with a clear setup, turn and point, then move on. Jokes without a story often feel thinner in a mixed room.",
    "sections": [
        {
            "h2": "Story first, punchline second",
            "html": """
<p>Our <a href="/guides/funny-best-man-speech/">funny best man speech</a> guide covers whole-speech laugh structure. This page is narrower: how to choose the anecdotes themselves. Ranking joke lists help with lines; rooms remember scenes.</p>
""",
        },
        {
            "h2": "The safety test",
            "html": """
<ul class="checklist">
<li>Would the couple still enjoy this sober tomorrow?</li>
<li>Can half the room follow it without a five-minute prequel?</li>
<li>Does it show a trait you admire, even while people laugh?</li>
<li>Does it need an ex, a fight, a crime, or the stag do to work? If yes, cut it.</li>
</ul>
<p>Full off-limits list: <a href="/guides/what-not-to-say-in-a-best-man-speech/">what not to say</a>. Clean one-liners: <a href="/guides/best-man-speech-jokes/">best man speech jokes</a>.</p>
""",
        },
        {
            "h2": "Shapes that tend to work",
            "html": """
<ul class="checklist">
<li><strong>Competence in the wrong place:</strong> he packs perfectly for your crisis and forgets his own charger.</li>
<li><strong>Loyalty under mild absurdity:</strong> he drives across the country for a boring errand.</li>
<li><strong>A habit everyone recognises:</strong> lateness, snacks, spreadsheets — told once, specifically.</li>
<li><strong>The partner as punchline-free upgrade:</strong> what got easier or kinder after they arrived.</li>
</ul>
""",
        },
        {
            "h2": "How to tell it in under a minute",
            "html": """
<ol>
<li>One line of context.</li>
<li>What he did.</li>
<li>The small specific detail (the flask, the label, the text at 1 a.m.).</li>
<li>What it shows — one sentence.</li>
<li>Optional bridge to the partner.</li>
</ol>
<p>If you need two stories, make them prove the same trait. Different traits in a row feel like a CV.</p>
""",
        },
        {
            "h2": "Workshop example",
            "html": """
<p><strong>Weak:</strong> “He’s mental on nights out.” <strong>Stronger:</strong> “When my car died on the M6 at midnight, he drove two hours, brought snacks, and texted the next morning to check the recovery truck had come. He still only admits he was ‘nearby’.”</p>
<p>Same man, different speech. Practise aloud; if you rush the detail, the laugh dies. Delivery help: <a href="/guides/best-man-speech-without-notes/">without notes</a> and <a href="/guides/best-man-speech-cue-cards/">cue cards</a>.</p>
<p>The <a href="/kits/#speech">Speech Kit</a> is built to force story choice before polish — start there when you have too many anecdotes and no spine.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>BBC Radio 4 / wedding speechwriter advice commonly cited against stag-do stories for mixed rooms</li>
<li><a href="/guides/funny-best-man-speech/">Funny best man speech</a></li>
<li><a href="/guides/how-to-write-a-best-man-speech/">How to write a best man speech</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "How many funny stories should a best man speech have?", "a": "One or two told properly beat five half-told ones."},
        {"q": "Can I use a stag do story?", "a": "Almost never. Most of the room were not there, and the details rarely survive the safety test."},
        {"q": "What if my funniest story is also the meanest?", "a": "Cut it. Warm beats viral."},
        {"q": "Should every story be a joke?", "a": "No. A sincere story with one smile often lands harder than a string of punchlines."},
        {"q": "How do I know it lands?", "a": "Tell it to one honest friend who knows the couple. Ask where they winced."},
    ],
    "related": [
        ("/guides/funny-best-man-speech/", "Funny best man speech"),
        ("/guides/best-man-speech-jokes/", "Best man speech jokes"),
        ("/guides/what-not-to-say-in-a-best-man-speech/", "What not to say"),
        ("/guides/best-man-speech-mistakes/", "Best man speech mistakes"),
        ("/guides/how-to-write-a-best-man-speech/", "How to write a best man speech"),
    ],
})

# 10 -----------------------------------------------------------------------
add({
    "slug": "best-man-speech-mistakes",
    "product": "speech",
    "eyebrow": "WRITING THE SPEECH",
    "title": "Best Man Speech Mistakes (And How to Avoid Them)",
    "meta": "Common best man speech mistakes: too long, too many stories, reading a phone, ignoring the partner, and panic drinking — with practical fixes for each.",
    "h1": "Best man speech mistakes and how to avoid them",
    "headline": "Best man speech mistakes and how to avoid them",
    "answer": "The mistakes that sink speeches are usually structural, not a missing joke: too long, too many thin stories, no line about the partner, burying your face in a phone, and drinking courage until the mic arrives. Fix the shape first, then polish lines.",
    "sections": [
        {
            "h2": "Mistake 1: Treating “what not to say” as the only risk",
            "html": """
<p><a href="/guides/what-not-to-say-in-a-best-man-speech/">What not to say</a> covers content landmines. This page covers craft and delivery failures that still hurt even when the material is clean.</p>
""",
        },
        {
            "h2": "Mistake 2: Too long",
            "html": """
<p>Most speeches land at three to five minutes; five to seven is fine for a main UK speaker; ten is the ceiling. See <a href="/guides/how-long-should-a-best-man-speech-be/">how long a best man speech should be</a>. Fix: time a standing read. Cut the second version of every joke.</p>
""",
        },
        {
            "h2": "Mistake 3: Six stories, zero point",
            "html": """
<p>A list of anecdotes feels like a list. Pick a trait and prove it once or twice — <a href="/guides/funny-best-man-speech-stories/">how to pick stories</a>.</p>
""",
        },
        {
            "h2": "Mistake 4: Forgetting the partner",
            "html": """
<p>If they only appear in the toast, the speech feels like a friendship roast. Name them early and give one specific observation.</p>
""",
        },
        {
            "h2": "Mistake 5: Phone script, face down",
            "html": """
<p>Screens lock, glow and hide your eyes. Use <a href="/guides/best-man-speech-cue-cards/">cue cards</a> or learn beats <a href="/guides/best-man-speech-without-notes/">without notes</a>.</p>
""",
        },
        {
            "h2": "Mistake 6: No ending",
            "html": """
<p>“Anyway, that’s me” is not a close. Signal the finish, turn to the couple, raise the glass — <a href="/guides/how-to-end-a-best-man-speech/">how to end</a> and <a href="/guides/best-man-toast/">toast examples</a>.</p>
""",
        },
        {
            "h2": "Mistake 7: Panic drinking and zero rehearsal",
            "html": """
<p>One drink if it helps; water until you have spoken. Rehearse standing up. Nerves plan: <a href="/guides/best-man-speech-nerves/">speech nerves</a>.</p>
<p>The <a href="/kits/#speech">Speech Kit</a> exists to stop these mistakes early: story prompts, a workbook, and cards so you are not inventing structure the night before.</p>
""",
        },
        {
            "h2": "Sources",
            "html": """
<ul>
<li>Hitched and Brides delivery guidance on length, practice and tone</li>
<li>Toastmasters tips on toasts and notes</li>
<li><a href="/guides/how-to-write-a-best-man-speech/">How to write a best man speech</a></li>
</ul>
""",
        },
    ],
    "faqs": [
        {"q": "What is the biggest best man speech mistake?", "a": "Going long without a clear point, or leaving the partner out until the last line."},
        {"q": "Is reading from a phone a mistake?", "a": "It often is. Cards or practised beats keep your face up and avoid lock-screen disasters."},
        {"q": "How many jokes are too many?", "a": "If you cannot remember the thread, you have too many. One or two stories plus a few smiles is enough."},
        {"q": "Should I apologise for being nervous?", "a": "A brief honest line is fine. A long apology becomes the speech."},
        {"q": "Can I fix a bad draft quickly?", "a": "Yes — cut to one story, add the partner, write the toast, rehearse twice. See the last-minute guide."},
    ],
    "related": [
        ("/guides/what-not-to-say-in-a-best-man-speech/", "What not to say in a best man speech"),
        ("/guides/funny-best-man-speech-stories/", "Funny best man speech stories"),
        ("/guides/how-long-should-a-best-man-speech-be/", "How long should a best man speech be?"),
        ("/guides/best-man-speech-nerves/", "Best man speech nerves"),
        ("/guides/last-minute-best-man-speech/", "Last-minute best man speech"),
    ],
})


def main() -> None:
    forbidden = [
        (r"\bpackage\b", "package"),
        (r"\bfounding\b", "founding"),
        (r"done for you", "Done for you"),
        (r"etsy\.com", "etsy.com"),
    ]
    for g in GUIDES:
        blob = json.dumps(g, ensure_ascii=False)
        for pat, label in forbidden:
            if re.search(pat, blob, re.I):
                raise SystemExit(f"Forbidden '{label}' in {g['slug']}")
        out_dir = ng.GUIDES / g["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)
        html = ng.render(g)
        # Ensure Speech Kit mentioned first on speech-product pages in body when duties also linked — already handled in copy
        (out_dir / "index.html").write_text(html, encoding="utf-8")
        print(f"wrote {g['slug']} ({len(html.split())} html-tokens)")
    print(f"Done: {len(GUIDES)} guides")


if __name__ == "__main__":
    main()
