"""Checks every guide PDF: 1 page, Nimbus embedded, title set, no glued words (e.g. 'wordsMain'), no duplicate or near-duplicate
sentences/paragraphs, no 'Jump to' on-screen navigation, no banned names. Usage: check_guide_pdfs.py DIR [DIR...]"""
import sys, re, glob, difflib, subprocess, pymupdf
GLUE = re.compile(r"\b[a-z]{2,}[a-z0-9)%:]?[A-Z][a-z]{2,}\b|[a-z][.:;!?][A-Z][a-z]")
ALLOW = {"PayPal", "YouTube", "WhatsApp", "LinkedIn", "iPhone", "TikTok", "McDonald", "FaceTime", "PowerPoint", "OpenTable", "GoPro", "AirBnb", "Airbnb", "MasterCard"}
BAN = re.compile(r"Etsy|Bundle|Best Man (Speech|Duties) Kit|Stag (&|and) Bachelor Party|Jump to|Skip to|click here|scroll", re.I)
fails = 0; n = 0
for D in sys.argv[1:]:
    for f in sorted(glob.glob(D + "/*.pdf")):
        n += 1; d = pymupdf.open(f); probs = []
        if d.page_count != 1: probs.append(f"{d.page_count} pages")
        if not (d.metadata.get("title") or "").endswith("free printable checklist"): probs.append("title")
        fonts = subprocess.run(["pdffonts", f], capture_output=True, text=True).stdout.splitlines()[2:]
        if any("Nimbus" not in l or " no " in l[50:62] for l in fonts): probs.append("fonts")
        raw = " ".join(p.get_text() for p in d)
        words = [w for w in raw.split() if not w.startswith(("http", "bestmanbackup"))]
        glued = [w for w in words if GLUE.search(w) and not any(a in w for a in ALLOW)]
        if glued: probs.append(f"glued {glued[:5]}")
        if BAN.search(raw): probs.append("banned: " + ", ".join(sorted(set(m.group(0) for m in BAN.finditer(raw)))))
        text = re.sub(r"\s+", " ", raw)
        sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 35]
        dup = []
        for i in range(len(sents)):
            for j in range(i + 1, len(sents)):
                if difflib.SequenceMatcher(None, sents[i].lower(), sents[j].lower()).ratio() > 0.72: dup.append((sents[i][:60], sents[j][:60]))
        if dup: probs.append(f"duplicate {dup[:2]}")
        if probs: fails += 1; print("FAIL", f, probs)
print(f"checked {n}, fails {fails}")
