# Tests

Playwright checks for the static site. They do not deploy, take payment, or switch on email capture.

## Site flows

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

`npm test` runs the site suite and the social render suite. `test:e2e` is the site only. The local server is `serve` on http://127.0.0.1:4173, with the same `/refund` → `/refunds/` redirect as `vercel.json`.

## Read-only check against a deployed origin

```bash
LIVE_BASE_URL=https://bestmanbackup.com npm test
```

Etsy navigations are aborted. The cheat-sheet form is not posted to a live endpoint. This does not change production.

## Social render checks

The 17 photo-led PNGs are not in this repo. Point the suite at a directory that contains them:

```bash
BMB_SOCIAL_FIXTURES=/path/to/redesign-2026-11-14 npm run test:render
```

Optional compose-script check (colon-separated file paths):

```bash
BMB_COMPOSE_SOURCES=/path/to/compose.py:/path/to/compose_carousel.py npm run test:render
```

If `BMB_SOCIAL_FIXTURES` is unset and `tests/fixtures/social/` has no PNGs, the render tests skip. They do not fail the site suite. `tests/fixtures/social/README.md` lists the expected filenames.
