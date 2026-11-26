/**
 * Validates a Stripe Checkout Session and returns a short-lived download link.
 *
 * Env (never hard-code):
 * - STRIPE_SECRET_KEY — retrieve Checkout Sessions + sign download tokens
 * - BLOB_READ_WRITE_TOKEN — private Blob store (connected as "bmb-paid-products")
 *
 * GET /api/fulfillment?kit=speech&session_id=cs_test_...
 * Accept: application/json → JSON; otherwise HTML.
 */
import Stripe from 'stripe';
import { getKit } from '../lib/kits.mjs';
import { createDownloadToken, sessionMatchesKit } from '../lib/fulfillment.mjs';
import { blobTokenConfigured } from '../lib/blob-download.mjs';

function htmlPage({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${title} | Best Man Backup</title>
  <link rel="stylesheet" href="/style.css">
  <link rel="icon" href="/favicon.ico" sizes="any">
</head>
<body>
  <main class="guide wrap" style="padding-block:48px 80px;max-width:640px">
    <p class="eyebrow"><span></span> BEST MAN BACKUP</p>
    ${body}
  </main>
</body>
</html>`;
}

function helpBlock() {
  return `<p>Need help? Email <a href="mailto:hello@bestmanbackup.com">hello@bestmanbackup.com</a>.</p>`;
}

export const ORDER_NOT_FOUND =
  "We couldn't find that order. Use the download link in your Stripe receipt email, or email hello@bestmanbackup.com and we'll send your files.";

export function sessionIdWellFormed(sessionId) {
  return typeof sessionId === 'string' && /^cs_[A-Za-z0-9_]+$/.test(sessionId);
}

export function isMissingOrderError(err) {
  const code = err?.code || err?.raw?.code;
  const type = err?.type || err?.rawType || err?.name;
  return code === 'resource_missing' || type === 'StripeInvalidRequestError';
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function html(res, status, title, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(htmlPage({ title, body }));
}

export default async function handler(req, res, deps = {}) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  const url = new URL(req.url, 'http://localhost');
  const kitId = url.searchParams.get('kit');
  const sessionId = url.searchParams.get('session_id');
  const wantsJson = (req.headers.accept || '').includes('application/json');
  const kit = getKit(kitId);

  if (!sessionIdWellFormed(sessionId)) {
    if (wantsJson) return json(res, 404, { ok: false, code: 'order_not_found', message: ORDER_NOT_FOUND });
    return html(res, 404, 'Order not found', `<h1>We couldn't find that order</h1><p>${ORDER_NOT_FOUND}</p>${helpBlock()}`);
  }

  if (!kit) {
    const message =
      'Missing kit or checkout session. If you have just paid, open the link from your Stripe confirmation email, or contact us.';
    if (wantsJson) return json(res, 400, { ok: false, code: 'bad_request', message });
    return html(
      res,
      400,
      'Download help',
      `<h1>We could not open your download</h1><p>${message}</p>${helpBlock()}`
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    const message = 'Checkout is not configured on this server yet.';
    if (wantsJson) return json(res, 503, { ok: false, code: 'misconfigured', message });
    return html(
      res,
      503,
      'Download help',
      `<h1>Download temporarily unavailable</h1><p>${message}</p>${helpBlock()}`
    );
  }

  if (!blobTokenConfigured()) {
    const message = 'Paid file storage is not configured on this server yet.';
    if (wantsJson) return json(res, 503, { ok: false, code: 'misconfigured', message });
    return html(
      res,
      503,
      'Download help',
      `<h1>Download temporarily unavailable</h1><p>${message}</p>${helpBlock()}`
    );
  }

  try {
    const stripe = deps.stripe || new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price'],
    });
    const match = sessionMatchesKit(session, kit.id);
    if (!match.ok) {
      if (wantsJson) return json(res, 403, { ok: false, code: match.code, message: match.message });
      return html(
        res,
        403,
        'Download help',
        `<h1>We could not verify this purchase</h1><p>${match.message}</p>${helpBlock()}`
      );
    }

    const downloadToken = createDownloadToken({
      sessionId,
      kitId: kit.id,
      secret,
    });
    const downloadUrl = `/api/download/?token=${encodeURIComponent(downloadToken)}`;

    if (wantsJson) {
      return json(res, 200, {
        ok: true,
        kit: kit.id,
        name: kit.name,
        downloadUrl,
        expiresInSeconds: 15 * 60,
      });
    }

    return html(
      res,
      200,
      'Thank you',
      `<h1>Thank you</h1>
       <p>Your payment for the <strong>${kit.name}</strong> is confirmed.</p>
       <p><a class="button" href="${downloadUrl}">Download your files</a></p>
       <p class="micro">This download link expires in about 15 minutes. Keep the ZIP and open Start Here first.</p>
       ${helpBlock()}`
    );
  } catch (err) {
    if (isMissingOrderError(err)) {
      if (wantsJson) return json(res, 404, { ok: false, code: 'order_not_found', message: ORDER_NOT_FOUND });
      return html(res, 404, 'Order not found', `<h1>We couldn't find that order</h1><p>${ORDER_NOT_FOUND}</p>${helpBlock()}`);
    }
    console.error('fulfillment error', err?.code || err?.type || 'unexpected');
    const message = 'Something went wrong verifying your payment.';
    if (wantsJson) return json(res, 500, { ok: false, code: 'stripe_error', message });
    return html(
      res,
      500,
      'Download help',
      `<h1>We could not verify this purchase</h1><p>${message}</p>${helpBlock()}`
    );
  }
}
