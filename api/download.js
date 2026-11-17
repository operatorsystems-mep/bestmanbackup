/**
 * After verifying a short-lived HMAC token, redirects to a short-lived
 * signed GET URL for the kit ZIP in a PRIVATE Vercel Blob store.
 *
 * Env:
 * - STRIPE_SECRET_KEY — HMAC signing secret (same as fulfillment)
 * - BLOB_READ_WRITE_TOKEN — private Blob store RW token (auto-set when the store is connected)
 */
import { getKit } from '../lib/kits.mjs';
import { verifyDownloadToken } from '../lib/fulfillment.mjs';
import { createKitDownloadUrl } from '../lib/blob-download.mjs';

function helpHtml(title, message) {
  return `<!DOCTYPE html><html lang="en-GB"><head>
  <meta charset="utf-8"><meta name="robots" content="noindex,nofollow">
  <title>${title} | Best Man Backup</title>
  <link rel="stylesheet" href="/styles.css">
</head><body style="font-family:system-ui;padding:2rem;max-width:40rem">
  <h1>${title}</h1>
  <p>${message}</p>
  <p>Need help? Email <a href="mailto:hello@bestmanbackup.com">hello@bestmanbackup.com</a>.</p>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method not allowed');
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.end(helpHtml('Download not configured', 'Checkout is not configured on this server yet.'));
    return;
  }

  const verified = verifyDownloadToken(token, secret);
  if (!verified.ok) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.end(
      helpHtml(
        'Download link expired or invalid',
        'Return to your thank-you page, or email hello@bestmanbackup.com.'
      )
    );
    return;
  }

  const kit = getKit(verified.kitId);
  const signed = await createKitDownloadUrl(kit.id);
  if (!signed.ok) {
    res.statusCode = signed.code === 'misconfigured' ? 503 : 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.end(helpHtml('Download temporarily unavailable', signed.message));
    return;
  }

  res.statusCode = 302;
  res.setHeader('Location', signed.url);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end();
}
