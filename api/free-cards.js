/**
 * POST /api/free-cards/ — store an email signup, then grant the card download.
 * GET  /api/free-cards/ — which paper size to offer this visitor.
 *
 * Signups go to the private Blob store (BLOB_READ_WRITE_TOKEN) at
 * signups/free-cards/. There is no Resend audience on this project.
 */
import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import {
  CONSENT_TEXT,
  MESSAGES,
  cardCookieHeader,
  countryFromHeaders,
  createCardGrant,
  regionPayload,
  validateSignup,
} from '../lib/free-cards.mjs';

function json(res, status, payload, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value);
  res.end(JSON.stringify(payload));
}

function secureRequest(req) {
  const proto = String(req.headers['x-forwarded-proto'] || '');
  return proto.split(',')[0].trim() === 'https';
}

function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

async function readPayload(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 10_000) {
      const error = new Error('too_large');
      error.code = 'too_large';
      throw error;
    }
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/json')) return JSON.parse(raw);
  return Object.fromEntries(new URLSearchParams(raw));
}

async function storeSignup(record, putBlob) {
  const pathname = `signups/free-cards/${record.id}.json`;
  const saved = await putBlob(pathname, JSON.stringify(record), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
  });
  if (!saved || (!saved.pathname && !saved.url)) {
    const error = new Error('not_stored');
    error.code = 'misconfigured';
    throw error;
  }
  return pathname;
}

export default async function handler(req, res, deps = {}) {
  if (req.method === 'GET') {
    const country = countryFromHeaders(req.headers);
    return json(res, 200, regionPayload(country));
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  if (!originAllowed(req)) {
    return json(res, 403, { ok: false, code: 'origin', message: MESSAGES.origin });
  }

  const wantsJson = String(req.headers.accept || '').includes('application/json');
  let input;
  try {
    input = await readPayload(req);
  } catch {
    return json(res, 400, { ok: false, code: 'bad_email', message: MESSAGES.bad_email });
  }

  const country = countryFromHeaders(req.headers);
  const signup = validateSignup(input, country);
  if (!signup.ok) {
    return json(res, signup.code === 'rejected' ? 400 : 400, {
      ok: false,
      code: signup.code,
      message: signup.message,
    });
  }

  const secret = deps.secret || process.env.STRIPE_SECRET_KEY;
  const putBlob = deps.putBlob || (async (pathname, body, options) => {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      const error = new Error('missing token');
      error.code = 'misconfigured';
      throw error;
    }
    return put(pathname, body, { ...options, token: process.env.BLOB_READ_WRITE_TOKEN });
  });

  if (!secret) {
    return json(res, 503, { ok: false, code: 'misconfigured', message: MESSAGES.misconfigured });
  }

  const id = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  const record = {
    id,
    email: signup.email,
    card: signup.cardId,
    format: signup.format,
    consent: true,
    consentText: CONSENT_TEXT,
    country: country || null,
    createdAt: new Date().toISOString(),
    source: '/cards/',
  };

  try {
    await storeSignup(record, putBlob);
  } catch (err) {
    console.error('free card signup failed', err?.code || 'error');
    return json(res, 503, { ok: false, code: 'misconfigured', message: MESSAGES.misconfigured });
  }

  const token = createCardGrant({ cardId: signup.cardId, secret });
  const headers = {
    'Set-Cookie': cardCookieHeader(token, { secure: secureRequest(req) }),
  };
  const payload = {
    ok: true,
    id,
    card: signup.cardId,
    format: signup.format,
    downloadUrl: signup.file.urlPath,
    downloadName: signup.file.downloadName,
  };

  if (!wantsJson) {
    res.statusCode = 303;
    res.setHeader('Location', signup.file.urlPath);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Set-Cookie', headers['Set-Cookie']);
    res.end();
    return;
  }

  return json(res, 200, payload, headers);
}
