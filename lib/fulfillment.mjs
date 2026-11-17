/**
 * Pure fulfillment helpers — unit-tested with mocked Stripe sessions.
 */
import crypto from 'node:crypto';
import { getKit } from './kits.mjs';

const TOKEN_TTL_SECONDS = 15 * 60;

export function sessionMatchesKit(session, kitId) {
  const kit = getKit(kitId);
  if (!kit) return { ok: false, code: 'unknown_kit', message: 'Unknown kit.' };
  if (!session) return { ok: false, code: 'missing_session', message: 'Checkout session not found.' };
  if (session.payment_status !== 'paid') {
    return { ok: false, code: 'unpaid', message: 'Payment is not complete yet.' };
  }

  const lineItems = session.line_items?.data || [];
  const priceIds = lineItems
    .map((item) => (typeof item.price === 'string' ? item.price : item.price?.id))
    .filter(Boolean);

  if (!priceIds.includes(kit.priceId)) {
    return {
      ok: false,
      code: 'wrong_kit',
      message: 'This payment does not match the kit you asked to download.',
    };
  }

  // Soft amount check when Stripe expands amounts (minor units).
  const amountTotal = session.amount_total;
  if (typeof amountTotal === 'number') {
    const expected = Math.round(kit.priceValue * 100);
    if (amountTotal !== expected) {
      return {
        ok: false,
        code: 'wrong_price',
        message: 'This payment amount does not match the kit price.',
      };
    }
  }

  return { ok: true, kit };
}

export function createDownloadToken({ sessionId, kitId, secret, now = Date.now() }) {
  const exp = Math.floor(now / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${sessionId}.${kitId}.${exp}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyDownloadToken(token, secret, { now = Date.now() } = {}) {
  try {
    const raw = Buffer.from(String(token || ''), 'base64url').toString('utf8');
    const parts = raw.split('.');
    if (parts.length !== 4) return { ok: false, code: 'bad_token' };
    const [sessionId, kitId, expStr, sig] = parts;
    const payload = `${sessionId}.${kitId}.${expStr}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, code: 'bad_token' };
    }
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Math.floor(now / 1000) > exp) {
      return { ok: false, code: 'expired' };
    }
    if (!getKit(kitId)) return { ok: false, code: 'unknown_kit' };
    return { ok: true, sessionId, kitId };
  } catch {
    return { ok: false, code: 'bad_token' };
  }
}

export { TOKEN_TTL_SECONDS };
