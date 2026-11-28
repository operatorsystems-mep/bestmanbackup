# Best Man Backup

Static site for [bestmanbackup.com](https://bestmanbackup.com/). Guides, kits and free printable checklists. Deployed on Vercel from `main`.

## Stripe checkout

Buy buttons read from [`assets/checkout-config.js`](assets/checkout-config.js) — **one file** holding both test and live Payment Links.

[`assets/checkout.js`](assets/checkout.js) picks the URL by hostname:

- `bestmanbackup.com` / `www.bestmanbackup.com` → **live** Payment Links
- Preview, localhost, and any other host → **test** Payment Links

After payment, each Payment Link must redirect to:
`https://bestmanbackup.com/thank-you/?kit=<speech|duties|playbook|bundle>&session_id={CHECKOUT_SESSION_ID}`

`/api/fulfillment` matches Stripe **test** price IDs when `session.livemode === false`, and **live** price IDs when `livemode === true` (never mixed). See `lib/kits.mjs`.

### Server env vars (required for downloads)

| Variable | Environments | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Preview: `sk_test_…` · Production: `sk_live_…` | Retrieve Checkout Sessions + sign download tokens. **Never commit.** |
| `BLOB_READ_WRITE_TOKEN` | Preview + Production + Development | Private Blob store `bmb-paid-products` (auto-created when the store was connected). |

Without either variable, `/thank-you/` shows a friendly error and points buyers to `hello@bestmanbackup.com`.

### Paid file delivery (private Blob — never in git)

This repository is **public**. Paid kit ZIPs must **never** be committed.

Files are stored in private Vercel Blob store **`bmb-paid-products`** on the `bestmanbackup` project (`operator-systems-mep`, region `lhr1`):

| Kit | Blob pathname |
|---|---|
| Speech | `kits/speech.zip` |
| Duties | `kits/duties.zip` |
| Playbook | `kits/playbook.zip` |
| Bundle | `kits/bundle.zip` |

Flow: `/thank-you/` → `/api/fulfillment` (paid + matching price ID) → short-lived token → `/api/download` → short-lived signed Blob GET URL.

## Free cards

`/cards/` asks for an email and consent, stores the signup in the private Blob store at `signups/free-cards/` (the same `BLOB_READ_WRITE_TOKEN` as the kits), then downloads one of the twelve PDFs in `cards/`. UK visitors default to A4. US visitors default to US Letter. The bachelor party card defaults to US Letter, and US visitors see it before the stag card. Phone size is always offered. A short-lived cookie from that form is what `/api/card-file` checks, so guessing a PDF address sends you back to the form.

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
