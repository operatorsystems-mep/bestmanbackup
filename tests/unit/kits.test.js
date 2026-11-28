import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import { KITS, PRICE_ID_LIVE, PRICE_ID_LIVE_PREVIOUS, getKit } from '../../lib/kits.mjs';

describe('kit blob pathnames', () => {
  it('maps every kit to the 28 Nov 2026 Blob pathname and keeps the Set download name', () => {
    const expected = {
      speech: ['kits/v2026-11-28/speech.zip', 'Best-Man-Speech-Kit.zip'],
      duties: ['kits/v2026-11-28/duties.zip', 'Best-Man-Duties-Kit.zip'],
      playbook: ['kits/v2026-11-28/playbook.zip', 'Stag-and-Bachelor-Party-Playbook.zip'],
      bundle: ['kits/v2026-11-28/bundle.zip', 'The-Best-Man-Set.zip'],
    };
    for (const kit of Object.values(KITS)) {
      assert.deepEqual([kit.blobPath, kit.downloadName], expected[kit.id]);
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
      assert.equal(kit.priceIdLive, PRICE_ID_LIVE[kit.id]);
    }
  });

  it('keeps the new live price ids in checkout config and still accepts the old ones', () => {
    const config = fs.readFileSync(new URL('../../assets/checkout-config.js', import.meta.url), 'utf8');
    assert.match(config, /speech: 'price_1UeLlORKrA7iXAzo7cMXh5od'/);
    assert.match(config, /duties: 'price_1UeLm0RKrA7iXAzoIFHfSgyP'/);
    assert.match(config, /playbook: 'price_1UeLmURKrA7iXAzo4HNzSZcM'/);
    assert.match(config, /https:\/\/buy\.stripe\.com\/8x214p9jK0iqff9diQ0Fi04/);
    assert.match(config, /https:\/\/buy\.stripe\.com\/6oU3cx2VmaX4d71gv20Fi05/);
    assert.match(config, /https:\/\/buy\.stripe\.com\/5kQ3cxgMce9geb52Ec0Fi06/);
    assert.match(config, /https:\/\/buy\.stripe\.com\/dRmbJ3brSe9g7MHbaI0Fi03/);
    assert.equal(PRICE_ID_LIVE.speech, 'price_1UeLlORKrA7iXAzo7cMXh5od');
    assert.equal(PRICE_ID_LIVE_PREVIOUS.speech[0].id, 'price_1UcuxdRKrA7iXAzo7Bpifs0D');
    assert.equal(PRICE_ID_LIVE_PREVIOUS.duties[0].id, 'price_1UcuxsRKrA7iXAzoTZHCJEQo');
    assert.equal(PRICE_ID_LIVE_PREVIOUS.playbook[0].id, 'price_1Ucuy1RKrA7iXAzo80f5IBDs');
    assert.equal(PRICE_ID_LIVE_PREVIOUS.bundle, undefined);
  });

  it('uses the current public prices', () => {
    assert.equal(getKit('speech').priceValue, 14.99);
    assert.equal(getKit('duties').priceValue, 9.99);
    assert.equal(getKit('playbook').priceValue, 9.99);
    assert.equal(getKit('bundle').priceValue, 19.99);
    assert.equal(getKit('playbook').name, 'Stag Do & Bachelor Party Playbook');
  });
});

