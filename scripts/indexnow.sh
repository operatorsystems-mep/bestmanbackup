#!/usr/bin/env bash
# Submit sitemap URLs to IndexNow (Bing, Yandex and others that support the protocol).
# Do not run this until the production deploy is live and the key file is publicly reachable at
# https://bestmanbackup.com/1ca457a5420712b1486133aeeac927c2.txt
# This script is not part of CI and must not be run against a preview URL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY="1ca457a5420712b1486133aeeac927c2"
HOST="bestmanbackup.com"
KEY_LOCATION="https://${HOST}/${KEY}.txt"
SITEMAP="${ROOT}/sitemap.xml"

if [[ ! -f "$SITEMAP" ]]; then
  echo "sitemap not found: $SITEMAP" >&2
  exit 1
fi

mapfile -t URLS < <(grep -oE 'https://bestmanbackup.com[^<[:space:]]+' "$SITEMAP")
if [[ ${#URLS[@]} -eq 0 ]]; then
  echo "no URLs in sitemap" >&2
  exit 1
fi

PAYLOAD="$(python3 - "$KEY" "$HOST" "$KEY_LOCATION" "${URLS[@]}" << 'PY'
import json, sys
key, host, key_location, *urls = sys.argv[1:]
print(json.dumps({
    "host": host,
    "key": key,
    "keyLocation": key_location,
    "urlList": urls,
}))
PY
)"

curl --fail-with-body -sS -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data "$PAYLOAD"
echo
