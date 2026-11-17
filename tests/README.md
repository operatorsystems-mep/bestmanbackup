# Tests

Playwright checks for the static site. They do not deploy, take payment, or switch on email capture.

## Site flows

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

`npm run test:e2e` is the site suite. The local server is `serve` on http://127.0.0.1:4173.

Checks include:

- every guide has two free PDF links that return HTTP 200
- every guide has a kit CTA pointing at `/kits/`
- no `etsy.com` URLs in served HTML or core JS
- internal links on key pages resolve
- `/kits/` is in the sitemap and `/links/` is not
