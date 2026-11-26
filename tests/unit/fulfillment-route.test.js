import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import handler, { ORDER_NOT_FOUND } from '../../api/fulfillment.js';
import { KITS } from '../../lib/kits.mjs';

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    end(payload) {
      this.body = payload || '';
    },
  };
}

async function call(url, deps) {
  const req = { method: 'GET', url, headers: { accept: 'application/json' } };
  const res = mockRes();
  await handler(req, res, deps);
  return { status: res.statusCode, json: JSON.parse(res.body) };
}

describe('fulfillment order lookup', () => {
  it('returns 404 with the buyer copy for a fake session id', async () => {
    const result = await call('/api/fulfillment/?kit=speech&session_id=not-an-order');
    assert.equal(result.status, 404);
    assert.equal(result.json.ok, false);
    assert.equal(result.json.code, 'order_not_found');
    assert.equal(result.json.message, ORDER_NOT_FOUND);
  });

  it('returns 404 when Stripe says the session does not exist', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-unit';
    const err = new Error('No such checkout.session');
    err.type = 'StripeInvalidRequestError';
    err.code = 'resource_missing';
    const result = await call('/api/fulfillment/?kit=speech&session_id=cs_test_missing', {
      stripe: { checkout: { sessions: { retrieve: async () => { throw err; } } } },
    });
    assert.equal(result.status, 404);
    assert.equal(result.json.message, ORDER_NOT_FOUND);
  });

  it('returns 500 with the friendly copy when Stripe cannot be reached', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-unit';
    const result = await call('/api/fulfillment/?kit=speech&session_id=cs_test_network', {
      stripe: { checkout: { sessions: { retrieve: async () => { throw new Error('network down'); } } } },
    });
    assert.equal(result.status, 500);
    assert.equal(result.json.ok, false);
    assert.match(result.json.message, /Something went wrong verifying your payment/);
  });

  it('returns 200 for a paid session', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-unit';
    const session = {
      id: 'cs_test_ok',
      payment_status: 'paid',
      amount_total: 1499,
      livemode: false,
      line_items: { data: [{ price: { id: KITS.speech.priceIdTest } }] },
    };
    const result = await call('/api/fulfillment/?kit=speech&session_id=cs_test_ok', {
      stripe: { checkout: { sessions: { retrieve: async () => session } } },
    });
    assert.equal(result.status, 200);
    assert.equal(result.json.ok, true);
    assert.equal(result.json.kit, 'speech');
    assert.match(result.json.downloadUrl, /^\/api\/download\/\?token=/);
  });
});
