#!/usr/bin/env python3
"""Submit every sitemap URL to IndexNow.

Run this by hand after a deploy. It is not part of CI or the site build.

    python3 scripts/ping-indexnow.py
    python3 scripts/ping-indexnow.py --dry-run

The public key file is the matching {key}.txt at the site root. IndexNow
fetches https://bestmanbackup.com/{key}.txt to confirm the host.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOST = "bestmanbackup.com"
ENDPOINT = "https://api.indexnow.org/indexnow"


def find_key() -> str:
    for path in sorted(ROOT.glob("*.txt")):
        key = path.read_text(encoding="utf-8").strip()
        if path.stem == key and re.fullmatch(r"[A-Za-z0-9-]{8,128}", key):
            return key
    sys.exit("No IndexNow key file at the site root.")


def sitemap_urls() -> list[str]:
    xml = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    urls = re.findall(r"<loc>\s*([^<]+?)\s*</loc>", xml)
    if not urls:
        sys.exit("sitemap.xml has no URLs.")
    return urls


def payload() -> dict:
    key = find_key()
    return {
        "host": HOST,
        "key": key,
        "keyLocation": f"https://{HOST}/{key}.txt",
        "urlList": sitemap_urls(),
    }


def main() -> int:
    body = payload()
    if "--dry-run" in sys.argv:
        print(json.dumps({"count": len(body["urlList"]), "keyLocation": body["keyLocation"]}, indent=2))
        return 0
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        print(response.status, len(body["urlList"]), "URLs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
