import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import { verifyDownloadToken } from '../../lib/fulfillment.mjs';
import {
  CONSENT_TEXT,
  FREE_CARDS,
  cardOrder,
  createCardGrant,
  defaultFormat,
  fileForCard,
  formatOrder,
  paperForCountry,
  regionPayload,
  validateSignup,
  verifyCardGrant,
} from '../../lib/free-cards.mjs';
import freeCards from '../../api/free-cards.js';
import cardFile from '../../api/card-file.js';

const ROOT = process.cwd();
const SECRET = 'sk_test_unit_secret_for_signing_only';

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: Buffer.alloc(0),
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    end(payload) {
      this.body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload || '');
    },
  };
}

function mockReq({ method = 'GET', url = '/api/free-cards/', headers = {}, body = '' } = {}) {
  const stream = Readable.from([Buffer.from(body)]);
  stream.method = method;
  stream.url = url;
  stream.headers = headers;
  return stream;
}

describe('free cards', () => {
  it('defaults A4 for the UK, Letter for the US, and US Letter first on the bachelor card', () => {
    assert.equal(paperForCountry('GB'), 'a4');
    assert.equal(paperForCountry(''), 'a4');
    assert.equal(paperForCountry('US'), 'letter');
    assert.equal(defaultFormat('speech', 'GB'), 'a4');
    assert.equal(defaultFormat('speech', 'US'), 'letter');
    assert.equal(defaultFormat('bachelor', 'GB'), 'letter');
    assert.equal(defaultFormat('bachelor', 'US'), 'letter');
    assert.deepEqual(formatOrder('bachelor', 'GB'), ['letter', 'phone', 'a4']);
    assert.deepEqual(formatOrder('stag', 'GB'), ['a4', 'letter', 'phone']);
    assert.deepEqual(formatOrder('stag', 'US'), ['letter', 'a4', 'phone']);
    assert.deepEqual(cardOrder('GB'), ['speech', 'duties', 'stag', 'bachelor']);
    assert.deepEqual(cardOrder('US'), ['speech', 'duties', 'bachelor', 'stag']);
    const us = regionPayload('US');
    assert.equal(us.cards[2].id, 'bachelor');
    assert.equal(us.cards[2].defaultFormat, 'letter');
  });

  it('points every card at the committed A4, Letter and Phone PDFs', () => {
    const expected = {
      speech: ['speech-a4.pdf', 'speech-letter.pdf', 'speech-phone.pdf', 2, 2, 4],
      duties: ['duties-a4.pdf', 'duties-letter.pdf', 'duties-phone.pdf', 2, 2, 4],
      stag: ['stag-uk-a4.pdf', 'stag-uk-letter.pdf', 'stag-uk-phone.pdf', 2, 2, 4],
      bachelor: ['bachelor-party-us-a4.pdf', 'bachelor-party-us-letter.pdf', 'bachelor-party-us-phone.pdf', 2, 2, 4],
    };
    for (const [id, [a4, letter, phone, a4Pages, letterPages, phonePages]] of Object.entries(expected)) {
      const card = FREE_CARDS[id];
      assert.equal(path.basename(card.files.a4), a4);
      assert.equal(path.basename(card.files.letter), letter);
      assert.equal(path.basename(card.files.phone), phone);
      for (const [format, pages] of [['a4', a4Pages], ['letter', letterPages], ['phone', phonePages]]) {
        const file = path.join(ROOT, 'cards', path.basename(card.files[format]));
        const bytes = fs.readFileSync(file);
        assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', file);
        assert.ok(bytes.length > 50_000, file);
        const text = bytes.toString('latin1');
        assert.equal((text.match(/\/Type\s*\/Page(?!s)/g) || []).length, pages, file);
      }
    }
  });

  it('requires a real email and the consent line, and ignores a filled honeypot', () => {
    const ok = validateSignup({ email: ' Friend@Example.com ', card: 'speech', format: 'phone', consent: 'yes' }, 'GB');
    assert.equal(ok.ok, true);
    assert.equal(ok.email, 'friend@example.com');
    assert.equal(ok.file.urlPath, '/cards/speech-phone.pdf');
    assert.equal(validateSignup({ email: 'nope', card: 'speech', consent: 'yes' }, 'GB').code, 'bad_email');
    assert.equal(validateSignup({ email: 'a@b.co', card: 'speech', consent: '' }, 'GB').code, 'consent');
    assert.equal(validateSignup({ email: 'a@b.co', card: 'nope', consent: 'yes' }, 'GB').code, 'bad_card');
    assert.equal(validateSignup({ email: 'a@b.co', card: 'speech', consent: 'yes', company: 'spam' }, 'GB').ok, false);
    assert.equal(CONSENT_TEXT.includes('occasional note'), true);
  });

  it('stores the signup and does not mint a paid-kit download token', async () => {
    const stored = [];
    const req = mockReq({
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        host: 'bestmanbackup.com',
        origin: 'https://bestmanbackup.com',
        'x-vercel-ip-country': 'GB',
        'x-forwarded-proto': 'https',
      },
      body: JSON.stringify({ email: 'qa@bestmanbackup.com', card: 'duties', format: 'a4', consent: 'yes', company: '' }),
    });
    const res = mockRes();
    await freeCards(req, res, {
      secret: SECRET,
      putBlob: async (pathname, body, options) => {
        stored.push({ pathname, body: JSON.parse(body), options });
        return { pathname, url: 'https://example.blob/' + pathname };
      },
    });
    assert.equal(res.statusCode, 200);
    const payload = JSON.parse(res.body.toString());
    assert.equal(payload.ok, true);
    assert.equal(payload.downloadUrl, '/cards/duties-a4.pdf');
    assert.equal(payload.downloadName, 'The-Duties-Card-A4.pdf');
    assert.match(res.headers['set-cookie'], /bmb_card=/);
    assert.equal(stored.length, 1);
    assert.match(stored[0].pathname, /^signups\/free-cards\//);
    assert.equal(stored[0].options.access, 'private');
    assert.equal(stored[0].body.email, 'qa@bestmanbackup.com');
    assert.equal(stored[0].body.consentText, CONSENT_TEXT);
    assert.equal(verifyDownloadToken(decodeURIComponent(res.headers['set-cookie'].split('=')[1].split(';')[0]), SECRET).ok, false);
    const grant = decodeURIComponent(res.headers['set-cookie'].split('=')[1].split(';')[0]);
    assert.equal(verifyCardGrant(grant, SECRET).cardId, 'duties');
  });

  it('serves the PDF only when the cookie matches that card', () => {
    const grant = createCardGrant({ cardId: 'speech', secret: SECRET });
    const file = fileForCard('speech', 'a4');
    const denied = mockRes();
    cardFile(mockReq({ url: `/api/card-file/?file=${file.filename}` }), denied, { secret: SECRET });
    assert.equal(denied.statusCode, 302);
    assert.equal(denied.headers.location, '/cards/?download=1#get');

    const allowed = mockRes();
    cardFile(
      mockReq({
        url: `/api/card-file/?file=${file.filename}`,
        headers: { cookie: `bmb_card=${encodeURIComponent(grant)}` },
      }),
      allowed,
      { secret: SECRET },
    );
    assert.equal(allowed.statusCode, 200);
    assert.equal(allowed.body.subarray(0, 5).toString(), '%PDF-');
    assert.match(allowed.headers['content-disposition'], /The-Speech-Card-A4\.pdf/);

    const other = mockRes();
    cardFile(
      mockReq({
        url: '/api/card-file/?file=duties-a4.pdf',
        headers: { cookie: `bmb_card=${encodeURIComponent(grant)}` },
      }),
      other,
      { secret: SECRET },
    );
    assert.equal(other.statusCode, 302);
  });
});
