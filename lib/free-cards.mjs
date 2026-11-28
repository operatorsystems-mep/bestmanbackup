/**
 * Free printable cards. The PDFs are committed under cards/ because they are
 * free. /api/free-cards stores the email, then sets a short-lived cookie.
 * /api/card-file only then serves the PDF. Paid kit ZIPs are a different
 * store and must never be committed.
 */
import crypto from 'node:crypto';

export const CONSENT_TEXT =
  'Email me this card, and the occasional note about the kits. I can unsubscribe any time.';

export const CARD_GRANT_TTL_SECONDS = 15 * 60;

export const MESSAGES = Object.freeze({
  bad_email: 'Enter a valid email address.',
  consent: 'Tick the box to say we can email you the card and the occasional note.',
  bad_card: 'Choose one of the four cards.',
  bad_format: 'Choose A4, US Letter or phone.',
  misconfigured: "We couldn't save your email just now. Email hello@bestmanbackup.com and we'll send the card.",
  rejected: 'Something went wrong. Email hello@bestmanbackup.com and we will send the card.',
  origin: 'Open the card page on this site and try again.',
});

export const FREE_CARDS = Object.freeze({
  speech: Object.freeze({
    id: 'speech',
    name: 'The Speech Card',
    summary: 'A one-page card for the speech.',
    files: Object.freeze({
      a4: '/cards/speech-a4.pdf',
      letter: '/cards/speech-letter.pdf',
      phone: '/cards/speech-phone.pdf',
    }),
    downloadNames: Object.freeze({
      a4: 'The-Speech-Card-A4.pdf',
      letter: 'The-Speech-Card-Letter.pdf',
      phone: 'The-Speech-Card-Phone.pdf',
    }),
  }),
  duties: Object.freeze({
    id: 'duties',
    name: 'The Duties Card',
    summary: 'A one-page card for the duties.',
    files: Object.freeze({
      a4: '/cards/duties-a4.pdf',
      letter: '/cards/duties-letter.pdf',
      phone: '/cards/duties-phone.pdf',
    }),
    downloadNames: Object.freeze({
      a4: 'The-Duties-Card-A4.pdf',
      letter: 'The-Duties-Card-Letter.pdf',
      phone: 'The-Duties-Card-Phone.pdf',
    }),
  }),
  stag: Object.freeze({
    id: 'stag',
    name: 'The Stag Card',
    summary: 'A one-page stag card for a UK stag do.',
    files: Object.freeze({
      a4: '/cards/stag-uk-a4.pdf',
      letter: '/cards/stag-uk-letter.pdf',
      phone: '/cards/stag-uk-phone.pdf',
    }),
    downloadNames: Object.freeze({
      a4: 'The-Stag-Card-A4.pdf',
      letter: 'The-Stag-Card-Letter.pdf',
      phone: 'The-Stag-Card-Phone.pdf',
    }),
  }),
  bachelor: Object.freeze({
    id: 'bachelor',
    name: 'The Bachelor Party Card',
    summary: 'A one-page bachelor party card for a US wedding.',
    usFirst: true,
    files: Object.freeze({
      a4: '/cards/bachelor-party-us-a4.pdf',
      letter: '/cards/bachelor-party-us-letter.pdf',
      phone: '/cards/bachelor-party-us-phone.pdf',
    }),
    downloadNames: Object.freeze({
      a4: 'The-Bachelor-Party-Card-A4.pdf',
      letter: 'The-Bachelor-Party-Card-Letter.pdf',
      phone: 'The-Bachelor-Party-Card-Phone.pdf',
    }),
  }),
});

const FORMAT_LABELS = Object.freeze({
  a4: 'A4',
  letter: 'US Letter',
  phone: 'Phone',
});

export function getFreeCard(id) {
  return FREE_CARDS[id] || null;
}

/** UK visitors, and anyone we cannot place, get A4. US visitors get Letter. */
export function paperForCountry(country) {
  return String(country || '').trim().toUpperCase() === 'US' ? 'letter' : 'a4';
}

export function defaultFormat(cardId, country) {
  const card = getFreeCard(cardId);
  if (!card) return null;
  if (card.usFirst) return 'letter';
  return paperForCountry(country);
}

export function formatOrder(cardId, country) {
  const card = getFreeCard(cardId);
  if (!card) return [];
  if (card.usFirst) return ['letter', 'phone', 'a4'];
  if (paperForCountry(country) === 'letter') return ['letter', 'a4', 'phone'];
  return ['a4', 'letter', 'phone'];
}

/** US visitors see the bachelor party card before the UK stag card. */
export function cardOrder(country) {
  if (paperForCountry(country) === 'letter') return ['speech', 'duties', 'bachelor', 'stag'];
  return ['speech', 'duties', 'stag', 'bachelor'];
}

export function paperNote(country) {
  if (paperForCountry(country) === 'letter') {
    return 'US Letter is selected. A4 and a phone size are on each card if you need them. The bachelor party card is the US edition.';
  }
  return 'A4 is selected for the UK. US Letter and a phone size are on each card if you need them. The bachelor party card is the US edition, so it starts on US Letter.';
}

export function countryFromHeaders(headers = {}) {
  const value = headers['x-vercel-ip-country'] || headers['x-vercel-ip-country-code'] || '';
  return String(value).trim().toUpperCase();
}

export function regionPayload(country) {
  const code = String(country || '').trim().toUpperCase();
  return {
    country: code,
    paper: paperForCountry(code),
    note: paperNote(code),
    order: cardOrder(code),
    cards: cardOrder(code).map((id) => {
      const card = FREE_CARDS[id];
      const formats = formatOrder(id, code);
      return {
        id,
        name: card.name,
        summary: card.summary,
        defaultFormat: defaultFormat(id, code),
        formats: formats.map((format) => ({ id: format, label: FORMAT_LABELS[format] })),
      };
    }),
  };
}

export function fileForCard(cardId, format) {
  const card = getFreeCard(cardId);
  if (!card || !card.files[format]) return null;
  const urlPath = card.files[format];
  const filename = urlPath.slice(urlPath.lastIndexOf('/') + 1);
  return {
    card,
    format,
    urlPath,
    filename,
    downloadName: card.downloadNames[format],
  };
}

export function cardFromFilename(filename) {
  const base = String(filename || '').split('/').pop();
  for (const card of Object.values(FREE_CARDS)) {
    for (const [format, urlPath] of Object.entries(card.files)) {
      if (urlPath.endsWith(`/${base}`)) return fileForCard(card.id, format);
    }
  }
  return null;
}

export function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function consentGiven(value) {
  return value === true || value === 'yes' || value === 'on' || value === 'true';
}

export function validateSignup(input, country) {
  if (input && String(input.company || '').trim()) {
    return { ok: false, code: 'rejected', message: MESSAGES.rejected };
  }
  const cardId = String(input?.card || '').trim();
  const card = getFreeCard(cardId);
  if (!card) return { ok: false, code: 'bad_card', message: MESSAGES.bad_card };
  const email = normalizeEmail(input?.email);
  if (!isValidEmail(email)) return { ok: false, code: 'bad_email', message: MESSAGES.bad_email };
  if (!consentGiven(input?.consent)) return { ok: false, code: 'consent', message: MESSAGES.consent };
  let format = String(input?.format || '').trim();
  if (!format) format = defaultFormat(cardId, country);
  if (!card.files[format]) return { ok: false, code: 'bad_format', message: MESSAGES.bad_format };
  return { ok: true, email, cardId, format, file: fileForCard(cardId, format) };
}

export function createCardGrant({ cardId, secret, now = Date.now() }) {
  const exp = Math.floor(now / 1000) + CARD_GRANT_TTL_SECONDS;
  const nonce = crypto.randomBytes(6).toString('hex');
  const payload = `freecard.${cardId}.${exp}.${nonce}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyCardGrant(token, secret, now = Date.now()) {
  const parts = String(token || '').split('.');
  if (parts.length !== 5 || parts[0] !== 'freecard') return { ok: false, code: 'bad_token' };
  const [, cardId, expStr, nonce, sig] = parts;
  if (!getFreeCard(cardId) || !/^[0-9a-f]+$/i.test(nonce) || !/^[0-9a-f]+$/i.test(sig)) {
    return { ok: false, code: 'bad_token' };
  }
  const payload = `freecard.${cardId}.${expStr}.${nonce}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, code: 'bad_token' };
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Math.floor(now / 1000) > exp) return { ok: false, code: 'expired' };
  return { ok: true, cardId };
}

export function readCardCookie(header) {
  for (const part of String(header || '').split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'bmb_card') return decodeURIComponent(rest.join('='));
  }
  return '';
}

export function cardCookieHeader(token, { secure = true } = {}) {
  const bits = [
    `bmb_card=${encodeURIComponent(token)}`,
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${CARD_GRANT_TTL_SECONDS}`,
    'Path=/cards/',
  ];
  if (secure) bits.push('Secure');
  return bits.join('; ');
}
