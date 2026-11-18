import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createDownloadToken,
  sessionMatchesKit,
  verifyDownloadToken,
} from '../../lib/fulfillment.mjs';
import { acceptedPricesForSession, KITS } from '../../lib/kits.mjs';

const SECRET = 'sk_test_unit_secret_for_signing_only';

function session({
  payment_status = 'paid',
  priceId = KITS.speech.priceIdTest,
  amount_total = 1499,
  livemode = false,
} = {}) {
  return {
    id: 'cs_test_123',
    payment_status,
    amount_total,
    livemode,
    line_items: {
      data: [{ price: { id: priceId } }],
    },
  };
}

describe('sessionMatchesKit', () => {
  it('accepts a paid test session for the matching test kit price', () => {
    const result = sessionMatchesKit(session(), 'speech');
    assert.equal(result.ok, true);
    assert.equal(result.kit.id, 'speech');
  });

  it('rejects an unpaid session', () => {
    const result = sessionMatchesKit(session({ payment_status: 'unpaid' }), 'speech');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'unpaid');
  });

  it('rejects a paid session for the wrong kit', () => {
    const result = sessionMatchesKit(
      session({ priceId: KITS.speech.priceIdTest, amount_total: 1499 }),
      'duties'
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, 'wrong_kit');
  });

  it('rejects a wrong amount even when the price id matches', () => {
    const result = sessionMatchesKit(
      session({ priceId: KITS.duties.priceIdTest, amount_total: 599 }),
      'duties'
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, 'wrong_price');
  });

  it('accepts duties with the duties test price id and amount', () => {
    const result = sessionMatchesKit(
      session({ priceId: KITS.duties.priceIdTest, amount_total: 999 }),
      'duties'
    );
    assert.equal(result.ok, true);
  });

  it('accepts a livemode session only with the live price id', () => {
    const ok = sessionMatchesKit(
      session({
        livemode: true,
        priceId: KITS.speech.priceIdLive,
        amount_total: 1499,
      }),
      'speech'
    );
    assert.equal(ok.ok, true);

    const mixed = sessionMatchesKit(
      session({
        livemode: true,
        priceId: KITS.speech.priceIdTest,
        amount_total: 1499,
      }),
      'speech'
    );
    assert.equal(mixed.ok, false);
    assert.equal(mixed.code, 'wrong_kit');
  });

  it('lists GBP and optional USD price ids for a session', () => {
    const gbpOnly = acceptedPricesForSession(KITS.speech, { livemode: false });
    assert.equal(gbpOnly.length, 1);
    assert.equal(gbpOnly[0].currency, 'gbp');
    assert.equal(gbpOnly[0].amountMinor, 1499);

    const withUsd = acceptedPricesForSession(
      {
        ...KITS.speech,
        priceIdTestUsd: 'price_test_usd_speech',
        priceValueUsd: 17.99,
      },
      { livemode: false }
    );
    assert.equal(withUsd.length, 2);
    assert.equal(withUsd[1].currency, 'usd');
    assert.equal(withUsd[1].id, 'price_test_usd_speech');
    assert.equal(withUsd[1].amountMinor, 1799);
  });

  it('rejects a test session that carries a live price id', () => {
    const result = sessionMatchesKit(
      session({
        livemode: false,
        priceId: KITS.bundle.priceIdLive,
        amount_total: 1999,
      }),
      'bundle'
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, 'wrong_kit');
  });
});

describe('download tokens', () => {
  it('round-trips a valid token', () => {
    const token = createDownloadToken({
      sessionId: 'cs_test_123',
      kitId: 'speech',
      secret: SECRET,
      now: 1_700_000_000_000,
    });
    const verified = verifyDownloadToken(token, SECRET, { now: 1_700_000_000_000 });
    assert.equal(verified.ok, true);
    assert.equal(verified.kitId, 'speech');
    assert.equal(verified.sessionId, 'cs_test_123');
  });

  it('rejects an expired token', () => {
    const token = createDownloadToken({
      sessionId: 'cs_test_123',
      kitId: 'bundle',
      secret: SECRET,
      now: 1_700_000_000_000,
    });
    const verified = verifyDownloadToken(token, SECRET, {
      now: 1_700_000_000_000 + 16 * 60 * 1000,
    });
    assert.equal(verified.ok, false);
    assert.equal(verified.code, 'expired');
  });

  it('rejects a tampered token', () => {
    const token = createDownloadToken({
      sessionId: 'cs_test_123',
      kitId: 'playbook',
      secret: SECRET,
    });
    const verified = verifyDownloadToken(token.slice(0, -2) + 'aa', SECRET);
    assert.equal(verified.ok, false);
  });
});
