import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createDownloadToken,
  sessionMatchesKit,
  verifyDownloadToken,
} from '../../lib/fulfillment.mjs';
import { KITS, PRICE_ID_LIVE_PREVIOUS } from '../../lib/kits.mjs';

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
      session({ priceId: KITS.duties.priceIdTest, amount_total: 100 }),
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

  it('accepts a previous live price at the amount that link charged', () => {
    for (const [kitId, entries] of Object.entries(PRICE_ID_LIVE_PREVIOUS)) {
      for (const entry of entries) {
        const ok = sessionMatchesKit(
          session({ livemode: true, priceId: entry.id, amount_total: entry.amount }),
          kitId
        );
        assert.equal(ok.ok, true, kitId);
      }
    }
  });

  it('rejects a previous live price charged at the new amount', () => {
    const previous = PRICE_ID_LIVE_PREVIOUS.speech[0];
    const result = sessionMatchesKit(
      session({ livemode: true, priceId: previous.id, amount_total: 1499 }),
      'speech'
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, 'wrong_price');
  });

  it('rejects a test session that carries a previous live price id', () => {
    const previous = PRICE_ID_LIVE_PREVIOUS.duties[0];
    const result = sessionMatchesKit(
      session({ livemode: false, priceId: previous.id, amount_total: previous.amount }),
      'duties'
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, 'wrong_kit');
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
