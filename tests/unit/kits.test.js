import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { KITS, getKit } from '../../lib/kits.mjs';

describe('kit blob pathnames', () => {
  it('maps every kit to a private Blob pathname under kits/', () => {
    for (const kit of Object.values(KITS)) {
      assert.match(kit.blobPath, /^kits\/[a-z]+\.zip$/);
      assert.ok(Array.isArray(kit.sources) || Array.isArray(kit.includes));
    }
  });

  it('duties sources are the three real Duties Kit archives', () => {
    const duties = getKit('duties');
    assert.deepEqual(duties.sources, [
      'Best_Man_Duties_Kit_A4.zip',
      'Best_Man_Duties_Kit_US_Letter.zip',
      'Best_Man_Duties_Kit_Editable_Files.zip',
    ]);
  });

  it('bundle includes all three kits and all source archives', () => {
    const bundle = getKit('bundle');
    assert.deepEqual(bundle.includes, ['speech', 'duties', 'playbook']);
    assert.equal(bundle.sources.length, 5);
  });

  it('never points at a local private/products path', () => {
    for (const kit of Object.values(KITS)) {
      assert.equal(kit.file, undefined);
      assert.ok(!String(kit.blobPath).includes('private/'));
    }
  });

  it('keeps distinct test and live Stripe price IDs', () => {
    for (const kit of Object.values(KITS)) {
      assert.match(kit.priceIdTest, /^price_/);
      assert.match(kit.priceIdLive, /^price_/);
      assert.notEqual(kit.priceIdTest, kit.priceIdLive);
    }
  });
});

