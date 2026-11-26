#!/usr/bin/env python3
"""Rebuild every guide page to the 27 Nov 2026 CTA spec.

Usage (from repo root): python3 scripts/update-guides-cta.py
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDES = ROOT / "guides"

TRUST = (
    '<p class="trust">Instant private download · Secure Stripe checkout · Problems? '
    '<a href="mailto:hello@bestmanbackup.com">hello@bestmanbackup.com</a></p>'
)
ABOUT = (
    '<p class="guide-about">About these guides: written by Best Man Backup, '
    "an independent site for best men only.</p>"
)
SMALL = (
    "The Best Man Set: The Speech Kit, The Duties Kit and The Stag Playbook. "
    "Worth £34.97 separately, save £14.98."
)

LINES = {
    "speech": "The Speech Kit: a speech-writing guide, an editable Word workbook, a final-speech document and six large cue cards, in A4 and US Letter. You bring the stories.",
    "duties": "The Duties Kit: a duties handbook, a planner you can edit in Word or print, a wedding-day sheet and four pocket carry cards, in A4 and US Letter.",
    "playbook": "The Stag Playbook: eight games, a groom quiz, challenge cards and the Stag Awards, plus a party planner and a money tracker for costs and guest payments. UK and US editions.",
}
NAMES = {"speech": "The Speech Kit", "duties": "The Duties Kit", "playbook": "The Stag Playbook"}
PRICES = {"speech": "£14.99", "duties": "£9.99", "playbook": "£9.99"}
PATHS = {"speech": "/kits/speech/", "duties": "/kits/duties/", "playbook": "/kits/playbook/"}

SPEECH = {
    "3-prompts-to-start-your-best-man-speech",
    "best-man-speech-cue-cards",
    "best-man-speech-dont-know-the-bride",
    "best-man-speech-examples",
    "best-man-speech-for-a-best-friend",
    "best-man-speech-for-a-brother",
    "best-man-speech-for-a-colleague",
    "best-man-speech-for-a-cousin",
    "best-man-speech-for-a-second-marriage",
    "best-man-speech-jokes",
    "best-man-speech-mistakes",
    "best-man-speech-nerves",
    "best-man-speech-opening-lines",
    "best-man-speech-same-sex-wedding",
    "best-man-speech-template",
    "best-man-speech-thanking-parents",
    "best-man-speech-without-notes",
    "best-man-toast",
    "dad-as-best-man",
    "funny-best-man-speech-stories",
    "funny-best-man-speech",
    "heartfelt-best-man-speech",
    "how-long-should-a-best-man-speech-be",
    "how-to-end-a-best-man-speech",
    "how-to-write-a-best-man-speech",
    "joint-best-man-speech",
    "last-minute-best-man-speech",
    "rehearsal-dinner-toast",
    "short-best-man-speech",
    "what-not-to-say-in-a-best-man-speech",
    "wedding-speech-order",
}
DUTIES = {
    "asked-to-be-best-man",
    "best-man-checklist-week-before",
    "best-man-duties-checklist",
    "best-man-duties-timeline",
    "best-man-gift-ideas",
    "best-man-outfit",
    "best-man-rehearsal-responsibilities",
    "best-man-rings",
    "best-man-vs-groomsmen-vs-ushers",
    "best-mans-job",
    "what-does-the-best-man-do-on-the-wedding-day",
    "what-does-the-best-man-pay-for",
}
PLAYBOOK = {
    "bachelor-party-checklist",
    "cheap-stag-do-ideas",
    "how-to-plan-a-stag-do",
    "non-drinking-stag-do-ideas",
    "stag-do-budget",
    "stag-do-destinations",
    "stag-do-games",
}

HOOKS = {
    "3-prompts-to-start-your-best-man-speech": "Blank page? Answer three questions tonight and you'll have an opening, a story and a toast.",
    "best-man-speech-cue-cards": "A phone locks and glows. Cards don't. Here's how to cut your speech into cards you can glance at.",
    "best-man-speech-dont-know-the-bride": "You've met her twice. You can still welcome her properly, without faking a friendship.",
    "best-man-speech-examples": "Four complete speeches, and exactly what to swap so yours doesn't sound borrowed.",
    "best-man-speech-for-a-best-friend": "Twenty years of stories and four minutes to tell them. Here's how to pick the one that matters.",
    "best-man-speech-for-a-brother": "Your family knows every story. Here's how to pick one that works for the whole room.",
    "best-man-speech-for-a-colleague": "You know him from work. That's enough for a great speech, if you pick the right story.",
    "best-man-speech-for-a-cousin": "Gap years in the friendship? Here's how to fill them honestly.",
    "best-man-speech-for-a-second-marriage": "No ex jokes, no 'second time lucky'. Here's what to say instead.",
    "best-man-speech-jokes": "Safe for Gran, still funny. Five checks for every joke before you say it.",
    "best-man-speech-mistakes": "Ten ways best man speeches go wrong, and the fix for each.",
    "best-man-speech-nerves": "Dreading it for weeks is normal. Here's what actually takes the edge off.",
    "best-man-speech-opening-lines": "Your first 30 seconds decide whether the room relaxes. Here are openings that work.",
    "best-man-speech-same-sex-wedding": "Two grooms or two brides? The speech structure barely changes. Here's what does.",
    "best-man-speech-template": "A fill-in template that won't sound like a template once you've used it.",
    "best-man-speech-thanking-parents": "Get the names right, keep it short, and nobody gets left out.",
    "best-man-speech-without-notes": "Memorising word for word is what makes people blank. Learn it in chunks instead.",
    "best-man-toast": "Four lines, a raised glass, done. Short, funny and formal toasts you can adapt.",
    "dad-as-best-man": "Father and best man: proud, short, and no embarrassing baby stories.",
    "funny-best-man-speech-stories": "The story gets the laugh, not the punchline. Here's how to pick one that lands.",
    "funny-best-man-speech": "Three laughs and one sincere turn. A complete funny speech, and why it works.",
    "heartfelt-best-man-speech": "Sincere without the cringe: find the one honest thing and say it plainly.",
    "how-long-should-a-best-man-speech-be": "Five minutes is about 650 words. Here's how to hit it.",
    "how-to-end-a-best-man-speech": "The room remembers your last 30 seconds. Write them first.",
    "how-to-write-a-best-man-speech": "Eight steps from blank page to a speech you can stand up and give.",
    "joint-best-man-speech": "Two best men, one speech, no talking over each other. How to split it.",
    "last-minute-best-man-speech": "Wedding's tomorrow? You can still write a good speech tonight.",
    "rehearsal-dinner-toast": "One minute, warm and short. Save the big stories for the wedding.",
    "short-best-man-speech": "One, two or three minutes: a short speech that still feels complete.",
    "what-not-to-say-in-a-best-man-speech": "One test for every line: would you say it with his gran at the front table?",
    "wedding-speech-order": "Who speaks when, and where the best man fits in, in the UK and the US.",
    "asked-to-be-best-man": "Said yes? Do these five things in the first week and the rest of the year gets easy.",
    "best-man-checklist-week-before": "The final week is for confirming, not inventing. Here's the list.",
    "best-man-duties-checklist": "Every best man job, before, during and after, in one list you can tick.",
    "best-man-duties-timeline": "What to do 12 months, 6 months, 1 month and 1 week out, and what can wait.",
    "best-man-gift-ideas": "The groomsmen gift and the thank-you gift are two different jobs. Here's both.",
    "best-man-outfit": "Match the groom without competing, and catch the fit problem before the photos.",
    "best-man-rehearsal-responsibilities": "Learn where you stand, practise the ring hand-over, and get the groomsmen's call times.",
    "best-man-rings": "Collect, pocket, check twice, hand over. The rings job, step by step.",
    "best-man-vs-groomsmen-vs-ushers": "Who does what, so nothing falls between three people.",
    "best-mans-job": "What the best man actually does, and what isn't your job.",
    "what-does-the-best-man-do-on-the-wedding-day": "From wake-up call to last taxi: the best man's wedding day, hour by hour.",
    "what-does-the-best-man-pay-for": "Suit, stag do, gift: who pays for what in the UK and the US, before anyone asks.",
    "bachelor-party-checklist": "From 'yes' to the morning after: the bachelor party checklist, in order.",
    "cheap-stag-do-ideas": "Low cost isn't low effort. UK plans that feel deliberate, not cheap.",
    "how-to-plan-a-stag-do": "Start with the groom and the budget, then book in the right order.",
    "non-drinking-stag-do-ideas": "Fifteen plans everyone can enjoy, drinking or not.",
    "stag-do-budget": "Set the number before the plan, and collect the money without falling out.",
    "stag-do-destinations": "Pick the city after the budget, not before. UK and Europe shortlists.",
    "stag-do-games": "Twelve games that work with or without a drink, and a running order for the night.",
}

INLINE_AFTER = {
    "3-prompts-to-start-your-best-man-speech": "How to turn the answers into a speech",
    "best-man-speech-cue-cards": "How to build the set",
    "best-man-speech-dont-know-the-bride": "A simple structure that still includes her",
    "best-man-speech-examples": "A template you can fill in",
    "best-man-speech-for-a-best-friend": "Where the stories actually are",
    "best-man-speech-for-a-brother": "A structure for a brother's speech",
    "best-man-speech-for-a-colleague": "Structure and timing",
    "best-man-speech-for-a-cousin": "Structure",
    "best-man-speech-for-a-second-marriage": "A simple structure",
    "best-man-speech-jokes": "The gran test, and four more checks",
    "best-man-speech-mistakes": "Mistake 6: No ending",
    "best-man-speech-nerves": "Before the day: preparation that reduces nerves",
    "best-man-speech-opening-lines": "Write three openings and test them",
    "best-man-speech-same-sex-wedding": "Structure that still works",
    "best-man-speech-template": "The template, part by part",
    "best-man-speech-thanking-parents": "Lines you can adapt",
    "best-man-speech-without-notes": "What to write on the emergency card",
    "best-man-toast": "A four-line toast formula",
    "dad-as-best-man": "Structure",
    "funny-best-man-speech-stories": "How to tell it in under a minute",
    "funny-best-man-speech": "A three-laugh structure",
    "heartfelt-best-man-speech": "Structure",
    "how-long-should-a-best-man-speech-be": "How to work out how long your speech is",
    "how-to-end-a-best-man-speech": "The four beats of a good ending",
    "how-to-write-a-best-man-speech": "Step 4: Use a structure that works",
    "joint-best-man-speech": "Who does what: a sample split",
    "last-minute-best-man-speech": "The structure that saves you",
    "rehearsal-dinner-toast": "A four-part shape",
    "short-best-man-speech": "The structure of a short speech",
    "what-not-to-say-in-a-best-man-speech": "Test every line before the day",
    "wedding-speech-order": "What the best man should check",
    "asked-to-be-best-man": "First 30 days",
    "best-man-checklist-week-before": "Seven days out",
    "best-man-duties-checklist": "The checklist",
    "best-man-duties-timeline": "6 to 3 months before",
    "best-man-gift-ideas": "How to organise the groomsmen gift",
    "best-man-outfit": "Day-of outfit checklist",
    "best-man-rehearsal-responsibilities": "During the rehearsal",
    "best-man-rings": "How the hand-over works",
    "best-man-vs-groomsmen-vs-ushers": "How to split the jobs",
    "best-mans-job": "Best man jobs list",
    "what-does-the-best-man-do-on-the-wedding-day": "A one-page timeline to carry",
    "what-does-the-best-man-pay-for": "The stag do or bachelor party",
    "bachelor-party-checklist": "Three to six months out",
    "cheap-stag-do-ideas": "Make the groom the point",
    "how-to-plan-a-stag-do": "Collect the money without falling out",
    "non-drinking-stag-do-ideas": "Mixed groups",
    "stag-do-budget": "How to collect money for a stag do",
    "stag-do-destinations": "Build a fair comparison sheet",
    "stag-do-games": "Games about the groom",
}

INLINE_COPY = {
    "3-prompts-to-start-your-best-man-speech": "Got your three answers? The Speech Kit's workbook turns them into a full draft, then six cue cards.",
    "best-man-speech-cue-cards": "Skip the formatting: the Speech Kit has six large cue cards ready to type or handwrite, A4 and US Letter.",
    "best-man-speech-dont-know-the-bride": "The Speech Kit's workbook walks you through this structure prompt by prompt.",
    "best-man-speech-examples": "Want to fill it in properly? The Speech Kit's editable workbook does it section by section.",
    "best-man-speech-for-a-best-friend": "The Speech Kit's story workshop helps you pick the one story that carries the speech.",
    "best-man-speech-for-a-brother": "Follow that structure in the Speech Kit's workbook, then print it onto cue cards.",
    "best-man-speech-for-a-colleague": "The Speech Kit gives you the structure, the prompts and the cue cards.",
    "best-man-speech-for-a-cousin": "Draft it in the Speech Kit's workbook, then print the six cue cards.",
    "best-man-speech-for-a-second-marriage": "The Speech Kit's workbook follows this structure and keeps you on the right side of the line.",
    "best-man-speech-jokes": "The Speech Kit's guide covers humour and editing, with cue cards for the punchlines.",
    "best-man-speech-mistakes": "The Speech Kit has you write the ending and the toast first, so there's always a landing.",
    "best-man-speech-nerves": "A rehearsed speech on cards is the best cure: the Speech Kit includes the cue cards and a rehearsal checklist.",
    "best-man-speech-opening-lines": "Draft your three openings in the Speech Kit's workbook and test them on cue card one.",
    "best-man-speech-same-sex-wedding": "The Speech Kit's structure works for any couple: you bring the stories.",
    "best-man-speech-template": "Want it as a document you can type straight into? That's the Speech Kit's workbook.",
    "best-man-speech-thanking-parents": "The Speech Kit's workbook has a thanks section, so nobody gets missed.",
    "best-man-speech-without-notes": "Use one of the Speech Kit's cue cards as your emergency card: big type, one line per beat.",
    "best-man-toast": "The Speech Kit gives the toast its own cue card, so the last line lands.",
    "dad-as-best-man": "The Speech Kit's workbook keeps a dad's speech to time.",
    "funny-best-man-speech-stories": "The Speech Kit's story workshop helps you cut a story to one tellable minute.",
    "funny-best-man-speech": "Build your three laughs in the Speech Kit's workbook.",
    "heartfelt-best-man-speech": "The Speech Kit's prompts help you find the honest core.",
    "how-long-should-a-best-man-speech-be": "The Speech Kit's rehearsal checklist has you time it aloud, card by card.",
    "how-to-end-a-best-man-speech": "The Speech Kit puts your ending and toast on their own cue card.",
    "how-to-write-a-best-man-speech": "Work through steps 4–8 in the Speech Kit's workbook, then print the six cue cards.",
    "joint-best-man-speech": "One Speech Kit covers both of you: split the workbook sections and print a set of cue cards each.",
    "last-minute-best-man-speech": "Short on time? The Speech Kit gives you the structure and cue cards straight away after download.",
    "rehearsal-dinner-toast": "Writing the wedding speech too? That's the Speech Kit.",
    "short-best-man-speech": "The Speech Kit's six cue cards fit a short speech exactly.",
    "what-not-to-say-in-a-best-man-speech": "The Speech Kit's guide covers story choice, humour and editing.",
    "wedding-speech-order": "Writing the best man's speech? The Speech Kit gets you from stories to cue cards.",
    "asked-to-be-best-man": "Put those answers in one plan: the Duties Kit has the planner, the wedding-day sheet and pocket carry cards.",
    "best-man-checklist-week-before": "The Duties Kit's wedding-day sheet and carry cards get this list out of the group chat and into your pocket.",
    "best-man-duties-checklist": "Want it as your own plan? The Duties Kit's planner turns this list into named jobs with owners and times.",
    "best-man-duties-timeline": "The Duties Kit's planner keeps every date and owner in one place.",
    "best-man-gift-ideas": "Give the gift job an owner and a deadline in the Duties Kit's planner.",
    "best-man-outfit": "Carry it on the Duties Kit's pocket cards: outfit, rings, timings.",
    "best-man-rehearsal-responsibilities": "Put the next-day call times on the Duties Kit's wedding-day sheet.",
    "best-man-rings": "The Duties Kit's carry cards put the rings plan in your jacket pocket.",
    "best-man-vs-groomsmen-vs-ushers": "Assign every job by name in the Duties Kit's planner.",
    "best-mans-job": "The Duties Kit turns this list into your plan, with a day sheet and pocket cards.",
    "what-does-the-best-man-do-on-the-wedding-day": "That one-page timeline is the Duties Kit's wedding-day sheet, ready to fill in.",
    "what-does-the-best-man-pay-for": "Running the stag money? The Stag Playbook's money tracker logs costs, deposits and who has paid.",
    "bachelor-party-checklist": "Track deposits and who has paid in the Stag Playbook's money tracker.",
    "cheap-stag-do-ideas": "Games, a groom quiz and the Stag Awards cost nothing on the night with the Stag Playbook.",
    "how-to-plan-a-stag-do": "The Stag Playbook's money tracker does the sums for deposits, balances and refunds.",
    "non-drinking-stag-do-ideas": "Every game in the Stag Playbook works with or without a drink.",
    "stag-do-budget": "The Stag Playbook's money tracker logs every deposit, balance and refund, and does the sums.",
    "stag-do-destinations": "Compare costs per head in the Stag Playbook's money tracker.",
    "stag-do-games": "Want them printed and ready? The Stag Playbook has eight games, a groom quiz, challenge cards and the Stag Awards.",
}

INLINE_KIT = {"what-does-the-best-man-pay-for": "playbook"}

CUTS = {
    "3-prompts-to-start-your-best-man-speech": ["What these prompts are not"],
    "best-man-speech-dont-know-the-bride": ["This is more common than people admit"],
    "best-man-speech-examples": ["How to use these examples", "Where to go next"],
    "best-man-speech-for-a-brother": ["Length and tone", "Keep going"],
    "best-man-speech-nerves": ["Is it normal to dread it for weeks"],
    "how-to-end-a-best-man-speech": ["Why the ending matters most", "Write the ending first"],
    "how-to-write-a-best-man-speech": ["Mistakes that sink speeches"],
    "joint-best-man-speech": ["Why couples choose joint best men"],
    "rehearsal-dinner-toast": [],
    "short-best-man-speech": ["Length, words, and when it fits", "How short is too short"],
    "what-not-to-say-in-a-best-man-speech": ["Why it matters"],
    "asked-to-be-best-man": [
        "Emotional labour is part of the job",
        "Learning without drowning in tabs",
        "What success looks like",
        "Systems that stop overwhelm",
        "Mapping the year at a glance",
    ],
    "best-man-duties-checklist": ["What the best man actually does"],
    "best-mans-job": ["The short answer: what the best man's job really is"],
    "what-does-the-best-man-pay-for": ["Why it's worth talking about early"],
    "best-man-speech-mistakes": ["Mistake 1"],
    "best-man-speech-same-sex-wedding": ["Humour that fits the room", "Linking to the rest of your prep"],
}

# Keep this many following blocks, then drop the rest of the section.
TRUNC = {
    "best-man-speech-jokes": [("Borrowed jokes and one-liners", 2)],
    "best-man-speech-opening-lines": [("Matching the opening to the room", 1)],
    "best-man-speech-template": [("How to use a template without sounding like one", 1)],
    "best-man-speech-without-notes": [("Alcohol, caffeine and voice", 1)],
    "funny-best-man-speech-stories": [("Stress-testing with the right audience", 1)],
    "funny-best-man-speech": [("Notes on the example", 3)],
    "how-long-should-a-best-man-speech-be": [("What the experts actually say", 1)],
    "how-to-write-a-best-man-speech": [("Before you write a word", 1)],
    "joint-best-man-speech": [("A full joint best man speech example", 2), ("Common joint-speech mistakes", 1)],
    "best-man-gift-ideas": [("Practical examples by groom type", 1)],
    "best-man-outfit": [("Cultural and dress-code edge cases", 1)],
    "best-man-rehearsal-responsibilities": [("If the couple are stressed", 1), ("Herding the groomsmen without nagging", 1)],
    "best-man-vs-groomsmen-vs-ushers": [("Common mix-ups to avoid", 1)],
    "how-to-plan-a-stag-do": [("Look after everyone", 1)],
    "stag-do-destinations": [
        ("Reading operator rankings sensibly", 1),
        ("Activity-first versus nightlife-first", 1),
        ("Exit plans matter", 1),
    ],
    "stag-do-games": [("Stag night or bachelor party", 1)],
}

REPLACEMENTS = [
    (
        "The <a href=\"/kits/#duties\">Best Man Duties Kit</a> has planner sections for the stag do budget, supplier bookings and guest payments if you'd rather keep everything in one plan. You do the sums yourself; nothing calculates automatically.",
        "The Stag Playbook includes a money tracker spreadsheet for costs, deposits and who has paid, plus a party planner for the bookings.",
    ),
    (
        'The <a href="/kits/#duties">Best Man Duties Kit</a> has planner sections for the stag do, supplier bookings and guest payments, so the whole plan lives in one place.',
        "The Stag Playbook keeps the whole plan in one place: a party planner for bookings and a money tracker for costs and guest payments.",
    ),
    (
        'The stag do budget and guest payments are in the <a href="/kits/#duties">Best Man Duties Kit</a>.',
        "Its money tracker handles the budget and guest payments too.",
    ),
    (
        'The <a href="/kits/#duties">Duties Kit</a> covers budget and guest payments; the <a href="/kits/#playbook">Playbook</a> covers the night itself.',
        "The Stag Playbook covers both: the money tracker for budget and payments, and the games for the night.",
    ),
    (
        "budgets and guest payments sit in the <a href=\"/kits/#duties\">Duties Kit</a>.",
        "and a money tracker keeps the budget honest.",
    ),
    (
        'the <a href="/kits/">Best Man Bundle</a> (£19.99) includes the Duties Kit, the Stag Do &amp; Bachelor Party Playbook and the Speech Kit, worth £34.97 separately.',
        "The Best Man Set (£19.99) includes The Duties Kit, The Stag Playbook and The Speech Kit, worth £34.97 separately.",
    ),
    (
        "or the <a href=\"/kits/#duties\">Best Man Duties Kit</a> has planner sections for the stag do budget, supplier bookings and guest payments (you do the sums; nothing calculates automatically).",
        "The Stag Playbook's money tracker logs costs, deposits and who has paid.",
    ),
    (">Free tool → paid kit<", ">Ready-made cue cards<"),
    ('id="free-tool-paid-kit"', 'id="ready-made-cue-cards"'),
    ('href="#free-tool-paid-kit">Free tool → paid kit', 'href="#ready-made-cue-cards">Ready-made cue cards'),
    (">What the Speech Kit adds<", ">Going further<"),
    (">Budget bands without invented averages<", ">Budget<"),
    (">Keep it all in one plan<", ">Your plan<"),
]


def kit_for(slug: str) -> str:
    if slug in SPEECH:
        return "speech"
    if slug in DUTIES:
        return "duties"
    if slug in PLAYBOOK:
        return "playbook"
    raise SystemExit(f"unmapped guide {slug}")


def heading_text(raw: str) -> str:
    text = re.sub(r"<[^>]+>", "", raw)
    text = text.replace("&amp;", "&").replace("&#x27;", "'").replace("&#39;", "'")
    return " ".join(text.split())


def find_heading(html: str, title: str, start: int = 0):
    pat = re.compile(r"<(h[23])(\s[^>]*)?>(.*?)</\1>", re.I | re.S)
    want = title.lower()
    for match in pat.finditer(html, start):
        if want in heading_text(match.group(3)).lower():
            return match
    return None


def section_end(html: str, match) -> int:
    level = int(match.group(1)[1])
    pat = re.compile(r"<(h[23])(\s[^>]*)?>(.*?)</\1>", re.I | re.S)
    for nxt in pat.finditer(html, match.end()):
        if int(nxt.group(1)[1]) <= level:
            return nxt.start()
    return len(html)


def remove_heading(html: str, title: str) -> str:
    match = find_heading(html, title)
    if not match:
        return html
    return html[: match.start()] + html[section_end(html, match) :]


def truncate_heading(html: str, title: str, keep: int) -> str:
    match = find_heading(html, title)
    if not match:
        return html
    end = section_end(html, match)
    body = html[match.end() : end]
    blocks = list(re.finditer(r"<(p|ul|ol|div|blockquote)\b[\s\S]*?</\1>", body, re.I))
    if len(blocks) <= keep:
        return html
    cut_from = blocks[keep].start()
    return html[: match.end() + cut_from] + html[end:]


def insert_inline(html: str, title: str, snippet: str) -> str:
    match = find_heading(html, title)
    if not match:
        return html + "\n" + snippet
    rest = html[match.end() :]
    block = re.search(r"<(p|ul|ol)\b[\s\S]*?</\1>", rest, re.I)
    at = match.end() + (block.end() if block else 0)
    return html[:at] + "\n" + snippet + html[at:]


def clean_toc(html: str) -> str:
    ids = set(re.findall(r'<h[23][^>]*\sid="([^"]+)"', html))

    def drop(match):
        href = re.search(r'href="#([^"]+)"', match.group(0))
        if href and href.group(1) not in ids:
            return ""
        return match.group(0)

    return re.sub(r"<li>\s*<a href=\"#[^\"]+\"[\s\S]*?</a>\s*</li>", drop, html)


def words_of(html: str) -> int:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html)
    text = re.sub(r"<[^>]+>", " ", text)
    return len(re.findall(r"[A-Za-z0-9'’]+", text))


def shrink_until(html: str, limit: int = 2000) -> str:
    guard = 0
    while words_of(html) > limit and guard < 12:
        guard += 1
        pat = re.compile(r"<(h2)(\s[^>]*)?>(.*?)</h2>", re.I | re.S)
        longest = None
        for match in pat.finditer(html):
            title = heading_text(match.group(3)).lower()
            if "source" in title or "frequently asked" in title:
                continue
            end = section_end(html, match)
            size = words_of(html[match.start() : end])
            if longest is None or size > longest[0]:
                longest = (size, match)
        if not longest or longest[0] < 80:
            break
        html = truncate_heading(html, heading_text(longest[1].group(3)), 2)
    return html


def take(pattern: str, text: str):
    match = re.search(pattern, text, re.I | re.S)
    if not match:
        return "", text
    return match.group(0), text[: match.start()] + text[match.end() :]


def extract_div(text: str, class_name: str):
    match = re.search(rf'<div class="{class_name}"[^>]*>', text)
    if not match:
        return "", text
    i = match.end()
    depth = 1
    while i < len(text) and depth:
        nxt = re.search(r"<div\b|</div>", text[i:])
        if not nxt:
            break
        i += nxt.end()
        depth += -1 if nxt.group(0).startswith("</") else 1
    block = text[match.start() : i]
    return block, text[: match.start()] + text[i:]


def top_cta(kit: str) -> str:
    return (
        f'<aside class="kit-cta kit-cta-top" aria-label="{NAMES[kit]}">'
        f'<p class="eyebrow">FOR THIS JOB · {PRICES[kit]}</p>'
        f"<p>{LINES[kit]}</p>"
        f'<p class="cta-buy"><a class="button" data-product="{kit}" href="{PATHS[kit]}">Get {NAMES[kit]}</a></p>'
        f"{TRUST}</aside>"
    )


def end_cta(kit: str) -> str:
    return (
        '<aside class="kit-cta kit-cta-end" aria-label="Best Man Backup kits">'
        '<p class="eyebrow">READY WHEN YOU ARE</p>'
        f"<p>{LINES[kit]}</p>"
        '<p class="kit-cta-actions">'
        f'<a class="button" data-product="{kit}" href="{PATHS[kit]}">Get {NAMES[kit]} · {PRICES[kit]}</a> '
        '<a class="button secondary" data-product="bundle" href="/kits/bundle/">Get all three · The Best Man Set · £19.99</a>'
        "</p>"
        f'<p class="kit-cta-small">{SMALL}</p>'
        f"{TRUST}</aside>"
    )


def inline_cta(slug: str, kit: str) -> str:
    target = INLINE_KIT.get(slug, kit)
    return (
        '<aside class="kit-inline" aria-label="From Best Man Backup"><p>'
        f'{INLINE_COPY[slug]} <a href="{PATHS[target]}">→ {NAMES[target]} · {PRICES[target]}</a>'
        "</p></aside>"
    )


def normalise_names(html: str) -> str:
    html = html.replace("See the Best Man Speech Kit", "See The Speech Kit")
    html = html.replace("See the Best Man Duties Kit", "See The Duties Kit")
    html = html.replace("Best Man Speech Kit", "The Speech Kit")
    html = html.replace("Best Man Duties Kit", "The Duties Kit")
    html = html.replace("Stag Do &amp; Bachelor Party Playbook", "The Stag Playbook")
    html = html.replace("Stag Do & Bachelor Party Playbook", "The Stag Playbook")
    html = html.replace("Best Man Bundle", "The Best Man Set")
    html = html.replace("The The ", "The ")
    html = html.replace("the The ", "the ")
    html = html.replace('href="/kits/#speech"', 'href="/kits/speech/"')
    html = html.replace('href="/kits/#duties"', 'href="/kits/duties/"')
    html = html.replace('href="/kits/#playbook"', 'href="/kits/playbook/"')
    html = html.replace('href="/kits/#bundle"', 'href="/kits/bundle/"')
    return html


def transform(slug: str, html: str) -> str:
    kit = kit_for(slug)
    before = words_of(re.search(r"<article[\s\S]*?</article>", html).group(0))
    for old, new in REPLACEMENTS:
        html = html.replace(old, new)

    article = re.search(r"(<article class=\"guide wrap\">)([\s\S]*?)(</article>)", html)
    if not article:
        raise SystemExit(f"{slug}: no article")
    inner = article.group(2)
    h1 = re.search(r"<h1>[\s\S]*?</h1>", inner)
    prefix = inner[: h1.end()]
    rest = inner[h1.end() :]

    _, rest = take(r'<aside class="kit-cta kit-cta-top"[\s\S]*?</aside>', rest)
    stamp, rest = take(r'<div class="guide-stamp">[\s\S]*?</div>', rest)
    answer, rest = take(r'<div class="answer">[\s\S]*?</div>', rest)
    free_top, rest = take(r'<aside class="free-download free-download-top"[\s\S]*?</aside>', rest)
    body, rest = extract_div(rest, "guide-body")
    faq, rest = take(r'<section class="guide-faq"[\s\S]*?</section>', rest)
    _, rest = take(r'<aside class="kit-note"[\s\S]*?</aside>', rest)
    related, rest = take(r'<section class="related"[\s\S]*?</section>', rest)
    free_end, rest = take(r'<aside class="free-download free-download-end"[\s\S]*?</aside>', rest)
    _, rest = take(r'<aside class="kit-cta kit-cta-end"[\s\S]*?</aside>', rest)

    updated = re.search(r"<p>Updated[^<]*</p>", stamp)
    stamp = f'<div class="guide-stamp">{updated.group(0) if updated else "<p>Updated 11 November 2026</p>"}</div>'

    for title in CUTS.get(slug, []):
        body = remove_heading(body, title)
    for title, keep in TRUNC.get(slug, []):
        body = truncate_heading(body, title, keep)

    if 'id="sources"' in body or ">Sources<" in body:
        body = re.sub(r"(<h2[^>]*>\s*Sources\s*</h2>)", ABOUT + r"\1", body, count=1, flags=re.I)
    else:
        body = body[: body.rfind("</div>")] + ABOUT + "</div>"

    body = insert_inline(body, INLINE_AFTER[slug], inline_cta(slug, kit))
    body = shrink_until(body, 2000)
    body = clean_toc(body)
    body = normalise_names(body)
    answer = normalise_names(answer)
    related = normalise_names(related)
    faq = normalise_names(faq)

    hook = HOOKS[slug]
    if len(hook) > 160:
        raise SystemExit(f"{slug} hook is {len(hook)} characters")

    rebuilt = (
        prefix
        + f'\n<p class="dek">{hook}</p>\n'
        + stamp
        + "\n"
        + answer
        + "\n"
        + top_cta(kit)
        + "\n"
        + free_top
        + "\n"
        + body
        + "\n"
        + faq
        + "\n"
        + related
        + "\n"
        + free_end
        + "\n"
        + end_cta(kit)
        + "\n"
    )
    html = html[: article.start()] + article.group(1) + rebuilt + article.group(3) + html[article.end() :]
    after = words_of(re.search(r"<article[\s\S]*?</article>", html).group(0))
    print(f"{before:5} -> {after:5}  {slug}")
    return html


def main() -> None:
    pages = sorted(p for p in GUIDES.iterdir() if (p / "index.html").is_file())
    missing = (SPEECH | DUTIES | PLAYBOOK) ^ {p.name for p in pages}
    if missing:
        raise SystemExit(f"guide map mismatch: {sorted(missing)}")
    for page in pages:
        path = page / "index.html"
        path.write_text(transform(page.name, path.read_text()), encoding="utf-8")


if __name__ == "__main__":
    main()
