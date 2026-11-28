# Do not store paid product files here

This public GitHub repository must **never** contain paid kit ZIPs (not as
placeholders, not in `private/products/`, not anywhere, not in git history).

Paid downloads are served from a **private Vercel Blob store**
(`bmb-paid-products` on the `bestmanbackup` Vercel project) after Stripe
payment verification. See the root `README.md` for env vars and Blob pathnames.

Free card PDFs in `private/cards/` are not paid products. They are served
only after the email form on `/cards/` sets a short-lived cookie.
