/**
 * Add a contact to Resend for the free best man checklist.
 *
 * Env (never hard-code):
 * - RESEND_API_KEY
 * - RESEND_AUDIENCE_ID (preferred) and/or RESEND_SEGMENT_ID
 *
 * POST /api/subscribe  JSON: { email, firstName?, consent, website? }
 * Does NOT send email. Returns a direct checklist download URL.
 */
const CHECKLIST_PATH = '/downloads/best-man-checklist.pdf';
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

async function createResendContact({ apiKey, audienceId, segmentId, email, firstName }) {
  const payload = {
    email,
    unsubscribed: false,
  };
  if (firstName) payload.first_name = firstName;
  if (audienceId) payload.audience_id = audienceId;
  if (segmentId) payload.segments = [segmentId];

  const response = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  // Already exists is fine for signup UX
  if (!response.ok && response.status !== 409) {
    const msg =
      data?.message || data?.error?.message || `Resend HTTP ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'method_not_allowed' });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    json(res, 400, { ok: false, error: 'invalid_json' });
    return;
  }

  // Honeypot — bots fill this; humans never see it
  if (body.website || body.company || body.url) {
    json(res, 200, {
      ok: true,
      downloadUrl: CHECKLIST_PATH,
      preview: false,
    });
    return;
  }

  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  const firstName = String(body.firstName || body.first_name || '')
    .trim()
    .slice(0, 80);
  const consent = body.consent === true || body.consent === 'true' || body.consent === 'on';

  if (!EMAIL_RE.test(email)) {
    json(res, 400, { ok: false, error: 'invalid_email' });
    return;
  }
  if (!consent) {
    json(res, 400, { ok: false, error: 'consent_required' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const segmentId = process.env.RESEND_SEGMENT_ID;

  if (!apiKey || (!audienceId && !segmentId)) {
    console.info(
      '[subscribe] Resend not connected — missing RESEND_API_KEY and/or RESEND_AUDIENCE_ID (or RESEND_SEGMENT_ID). Returning preview success.'
    );
    json(res, 200, {
      ok: true,
      downloadUrl: CHECKLIST_PATH,
      preview: true,
      message: 'Preview mode: Resend is not connected on this host.',
    });
    return;
  }

  try {
    await createResendContact({
      apiKey,
      audienceId: audienceId || undefined,
      segmentId: segmentId || undefined,
      email,
      firstName: firstName || undefined,
    });
    json(res, 200, {
      ok: true,
      downloadUrl: CHECKLIST_PATH,
      preview: false,
    });
  } catch (err) {
    console.error('[subscribe] Resend error', err?.message || err);
    json(res, 502, {
      ok: false,
      error: 'upstream_error',
      message: 'Could not save your details. Please try again, or email hello@bestmanbackup.com.',
    });
  }
}
