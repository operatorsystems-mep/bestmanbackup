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
  it('returns 404 with the buyer copy for a bad or missing session id', async () => {
    const bad = await call('/api/fulfillment/?kit=speech&session_id=not-an-order');
    assert.equal(bad.status, 404);
    assert.equal(bad.json.ok, false);
    assert.equal(bad.json.code, 'order_not_found');
    assert.equal(bad.json.message, ORDER_NOT_FOUND);

    const missing = await call('/api/fulfillment/?kit=speech');
    assert.equal(missing.status, 404);
    assert.equal(missing.json.ok, false);
    assert.equal(missing.json.code, 'order_not_found');
    assert.equal(missing.json.message, ORDER_NOT_FOUND);
  });

  it('returns 400 for an unknown kit', async () => {
    let retrieved = false;
    const result = await call('/api/fulfillment/?kit=no-such-kit&session_id=cs_test_ok', {
      stripe: {
        checkout: {
          sessions: {
            retrieve: async () => {
              retrieved = true;
              return null;
            },
          },
        },
      },
    });
    assert.equal(result.status, 400);
    assert.equal(result.json.ok, false);
    assert.equal(result.json.code, 'bad_request');
    assert.equal(retrieved, false);
  });

  it('returns 403 for an unpaid session', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-unit';
    const result = await call('/api/fulfillment/?kit=speech&session_id=cs_test_unpaid', {
      stripe: {
        checkout: {
          sessions: {
            retrieve: async () => ({
              id: 'cs_test_unpaid',
              payment_status: 'unpaid',
              amount_total: 1499,
              livemode: false,
              line_items: { data: [{ price: { id: KITS.speech.priceIdTest } }] },
            }),
          },
        },
      },
    });
    assert.equal(result.status, 403);
    assert.equal(result.json.ok, false);
    assert.equal(result.json.code, 'unpaid');
    assert.equal(result.json.downloadUrl, undefined);
  });

  it('returns 403 for a session that does not match the kit', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-unit';
    const result = await call('/api/fulfillment/?kit=speech&session_id=cs_test_mismatch', {
      stripe: {
        checkout: {
          sessions: {
            retrieve: async () => ({
              id: 'cs_test_mismatch',
              payment_status: 'paid',
              amount_total: 999,
              livemode: false,
              line_items: { data: [{ price: { id: KITS.duties.priceIdTest } }] },
            }),
          },
        },
      },
    });
    assert.equal(result.status, 403);
    assert.equal(result.json.ok, false);
    assert.equal(result.json.code, 'wrong_kit');
    assert.equal(result.json.downloadUrl, undefined);
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
