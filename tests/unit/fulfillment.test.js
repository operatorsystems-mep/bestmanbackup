import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createDownloadToken,
  sessionMatchesKit,
  verifyDownloadToken,
} from '../../lib/fulfillment.mjs';

const SECRET = 'sk_test_unit_secret_for_signing_only';

function session({ payment_status = 'paid', priceId = 'price_1UcuNkRKrA7iXAzoBcZbNaOO', amount_total = 698 } = {}) {
  return {
    id: 'cs_test_123',
    payment_status,
    amount_total,
    line_items: {
      data: [{ price: { id: priceId } }],
    },
  };
}

describe('sessionMatchesKit', () => {
  it('accepts a paid session for the matching kit price', () => {
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
      session({ priceId: 'price_1UcuNkRKrA7iXAzoBcZbNaOO', amount_total: 698 }),
      'duties'
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, 'wrong_kit');
  });

  it('rejects a wrong amount even when the price id matches', () => {
    const result = sessionMatchesKit(
      session({ priceId: 'price_1UcuNmRKrA7iXAzo8plO4K7b', amount_total: 999 }),
      'duties'
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, 'wrong_price');
  });

  it('accepts duties with the duties price id and amount', () => {
    const result = sessionMatchesKit(
      session({ priceId: 'price_1UcuNmRKrA7iXAzo8plO4K7b', amount_total: 599 }),
      'duties'
    );
    assert.equal(result.ok, true);
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
