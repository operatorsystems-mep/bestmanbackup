# Best Man Backup

Static site for [bestmanbackup.com](https://bestmanbackup.com/). Guides, kits and free printable checklists. Deployed on Vercel from `main`.

## Stripe checkout

Buy buttons read from [`assets/checkout-config.js`](assets/checkout-config.js) — **one file** to swap test Payment Links for live ones.

1. Paste each Stripe Payment Link into that product’s `checkoutUrl`.
2. Leave `checkoutUrl` as `""` to fall back to `/kits/#<product>` (never a dead link).
3. Each Payment Link must redirect after payment to:
   `https://bestmanbackup.com/thank-you/?kit=<speech|duties|playbook|bundle>&session_id={CHECKOUT_SESSION_ID}`

### Server env vars (required for downloads)

Set these on the Vercel project (Preview + Production). **Never commit secrets.**

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret (`sk_test_…` / `sk_live_…`). Retrieves Checkout Sessions and signs short-lived download tokens. |
| `BLOB_READ_WRITE_TOKEN` | Private Vercel Blob store token. Auto-created when the `bmb-paid-products` store is connected to this project (Preview + Production + Development). Used to issue short-lived signed download URLs. |

Without either variable, `/thank-you/` shows a friendly error and points buyers to `hello@bestmanbackup.com`.

### Paid file delivery (private Blob — never in git)

This repository is **public**. Paid kit ZIPs must **never** be committed (not under `private/`, not as placeholders, not in history).

Files are stored in a **private** Vercel Blob store named `bmb-paid-products` on the `bestmanbackup` project (`operator-systems-mep` team, region `lhr1`).

Blob pathnames (server-side only):

| Kit | Blob pathname | Built from |
|---|---|---|
| Speech | `kits/speech.zip` | `Best_Man_Speech_Kit_Customer_Download_vC1.zip` |
| Duties | `kits/duties.zip` | A4 + US Letter + Editable Files ZIPs |
| Playbook | `kits/playbook.zip` | `BMB_Stag_Do_Playbook_v0.4.2.zip` |
| Bundle | `kits/bundle.zip` | All of the above |

Flow:

1. `/thank-you/` → `/api/fulfillment` checks Stripe `payment_status === 'paid'` and matching price ID.
2. Issues a short-lived HMAC token for `/api/download`.
3. `/api/download` redirects to a short-lived **signed GET URL** for the private Blob object (not a public static URL; not in the sitemap).

Re-upload kits with `@vercel/blob` `put(..., { access: 'private', addRandomSuffix: false, allowOverwrite: true })` using `BLOB_READ_WRITE_TOKEN`. Do not put product files in this repo.

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
