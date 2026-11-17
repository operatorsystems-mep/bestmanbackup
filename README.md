# Best Man Backup

Static site for [bestmanbackup.com](https://bestmanbackup.com/). Guides, kits and free printable checklists. Deployed on Vercel from `main`.

## Switch on Stripe checkout

Buy buttons across the site read from [`assets/checkout-config.js`](assets/checkout-config.js).

1. Create a Stripe Payment Link for each kit (Speech, Duties, Playbook, Bundle).
2. Paste each URL into that product’s `checkoutUrl` field in `assets/checkout-config.js`.
3. Leave any `checkoutUrl` as `""` until the link is ready. Empty values send the button to `/kits/#<product>` so nothing is a dead link.
4. Deploy. [`assets/checkout.js`](assets/checkout.js) upgrades every `[data-product]` control on load.

Do not invent placeholder `https://` URLs. Empty string is the correct “not ready” state.

## Free printable PDFs

Each guide under `/guides/<slug>/` links to `/downloads/<slug>-checklist.pdf`.

Regenerate all checklists from guide content:

```bash
pip install -r scripts/requirements-pdf.txt
python3 scripts/generate-guide-pdfs.py
```

Re-apply free-download blocks and kit CTAs after editing guide HTML structure:

```bash
python3 scripts/update-guides-cta.py
```

## Bio link page

`/links/` is for Instagram and Pinterest. It is `noindex` and is not in `sitemap.xml`.

## Tests

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

Playwright serves the site locally with `serve`. It checks PDF links, kit CTAs, no Etsy URLs, and that internal links resolve.
