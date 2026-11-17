# Best Man Backup

Static site for [bestmanbackup.com](https://bestmanbackup.com/). Guides, kits and free printable checklists. Deployed on Vercel from `main`.

## Stripe checkout

Buy buttons read from [`assets/checkout-config.js`](assets/checkout-config.js) — **one file** to swap test Payment Links for live ones.

1. Paste each Stripe Payment Link into that product’s `checkoutUrl`.
2. Leave `checkoutUrl` as `""` to fall back to `/kits/#<product>` (never a dead link).
3. Each Payment Link must redirect after payment to:
   `https://bestmanbackup.com/thank-you/?kit=<speech|duties|playbook|bundle>&session_id={CHECKOUT_SESSION_ID}`

### Server env var (required for downloads)

Set this on the Vercel project (Preview + Production):

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` for test mode, `sk_live_…` for live). Used to retrieve Checkout Sessions and to sign short-lived download tokens. **Never commit this value.** |

Without `STRIPE_SECRET_KEY`, `/thank-you/` shows a friendly error and points buyers to `hello@bestmanbackup.com`.

### Paid file delivery

- `/thank-you/` calls `/api/fulfillment`, which checks `payment_status === 'paid'` and that the session’s Stripe price ID matches the kit.
- A short-lived token unlocks `/api/download`, which streams the ZIP from `private/products/` (not a public static URL; `/private/*` is blocked; not in the sitemap).
- Replace the placeholder ZIPs in `private/products/` with the real customer downloads before going live (do not commit paid files to this public repository).

Expected filenames:

- `private/products/speech.zip`
- `private/products/duties.zip`
- `private/products/playbook.zip`
- `private/products/bundle.zip` (all three kits)

## Free printable PDFs

```bash
pip install -r scripts/requirements-pdf.txt
python3 scripts/generate-guide-pdfs.py
```

## Bio / thank-you pages

`/links/` and `/thank-you/` are `noindex` and are not in `sitemap.xml`.

## Tests

```bash
npm ci
npx playwright install chromium
npm test
```

`npm test` runs Playwright site checks plus unit tests for Stripe fulfillment (mocked paid / unpaid / wrong kit).
