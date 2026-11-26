import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { KITS } from '../../lib/kits.mjs';

const ROOT = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function guideSlugs() {
  return fs
    .readdirSync(path.join(ROOT, 'guides'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe('public catalogue', () => {
  const slugs = guideSlugs();
  const home = read('index.html');
  const hub = read('guides/index.html');
  const kits = read('kits/index.html');

  it('counts the real guide pages and lists every one', () => {
    assert.equal(slugs.length, 50);
    assert.equal(home.includes('50 free best man guides'), true);
    assert.equal(hub.includes('50 free best man guides'), true);
    const homeHrefs = [...home.matchAll(/href="\/guides\/([^"/]+)\//g)].map((match) => match[1]).sort();
    assert.deepEqual(homeHrefs, [
      'best-man-duties-timeline',
      'best-man-speech-opening-lines',
      'stag-do-budget',
    ]);
    const hubHrefs = [...hub.matchAll(/href="\/guides\/([^"/]+)\//g)].map((match) => match[1]);
    assert.deepEqual([...new Set(hubHrefs)].sort(), slugs);
    assert.equal(hubHrefs.length, 53);
    for (const heading of [
      'Speech writing',
      'Duties and logistics',
      'Stag do planning',
      'Etiquette and manners',
      'What to avoid',
    ]) {
      assert.equal(hub.includes(heading), true, heading);
    }
    assert.equal(hub.includes('50 free guides to the speech, the duties and the stag do. No sign-up.'), true);
    assert.equal(home.includes('Explore 50 guides'), true);
    assert.equal(home.includes('50 guides, every one free to read'), true);
    assert.equal((hub.match(/class="n">/g) || []).length, 50);
  });

  it('shows the current prices and the full product name', () => {
    assert.equal(KITS.speech.priceValue, 14.99);
    assert.equal(KITS.duties.priceValue, 9.99);
    assert.equal(KITS.playbook.priceValue, 9.99);
    assert.equal(KITS.bundle.priceValue, 19.99);
    for (const file of [home, hub, kits, read('assets/checkout-config.js'), read('assets/thank-you.js')]) {
      assert.equal(file.includes('£6.98'), false);
      assert.equal(file.includes('£5.99'), false);
      assert.equal(file.includes('£11.99'), false);
      assert.equal(file.includes('Stag & Bachelor Party Kit'), false);
      assert.equal(file.includes('Stag &amp; Bachelor Party Kit'), false);
      assert.equal(/under £7/i.test(file), false);
    }
    assert.equal(home.includes('£14.99'), true);
    assert.equal(home.includes('£19.99'), true);
    for (const [id, name, price] of [
      ['speech', 'The Speech Kit', '£14.99'],
      ['duties', 'The Duties Kit', '£9.99'],
      ['playbook', 'The Stag Playbook', '£9.99'],
      ['bundle', 'The Best Man Set', '£19.99'],
    ]) {
      for (const page of [home, kits]) {
        const tile = page.match(new RegExp(`id="${id}"[\\s\\S]*?</a>`));
        assert.ok(tile, id);
        assert.equal(tile[0].includes(name), true, name);
        assert.equal(tile[0].includes(price), true, price);
      }
    }
    assert.equal(kits.includes('"price": "14.99"'), true);
    assert.equal(kits.includes('"price": "9.99"'), true);
    assert.equal(kits.includes('"price": "19.99"'), true);
    assert.equal(KITS.playbook.name, 'Stag Do & Bachelor Party Playbook');
  });

  it('keeps the homepage title short and matched to the social title', () => {
    const title = home.match(/<title>([^<]*)<\/title>/)[1];
    const og = home.match(/property="og:title" content="([^"]*)"/)[1];
    assert.equal(title, og);
    assert.equal(title, 'Be the best man he’ll never forget | Best Man Backup');
    assert.ok(title.length <= 60, title.length);
    assert.match(title, /best man/i);
    const desc = home.match(/<meta name="description" content="([^"]*)"/)[1];
    assert.match(desc, /^50 free best man guides/);
  });

  it('leads the guides hub description with the free guides', () => {
    const desc = hub.match(/<meta name="description" content="([^"]*)"/)[1];
    assert.match(desc, /^50 free best man guides/);
    assert.equal(desc.includes('printed book'), false);
    assert.equal(hub.includes('These pages are not a printed book'), false);
  });

  it('gives every guide at least three inbound links from other guides', () => {
    const inbound = new Map(slugs.map((slug) => [slug, new Set()]));
    for (const slug of slugs) {
      const html = read(path.join('guides', slug, 'index.html'));
      for (const match of html.matchAll(/href="\/guides\/([^"/]+)\/"/g)) {
        const target = match[1];
        if (target !== slug && inbound.has(target)) inbound.get(target).add(slug);
      }
    }
    const low = slugs.filter((slug) => inbound.get(slug).size < 3);
    assert.deepEqual(low, []);
  });

  it('does not publish draft legal pages', () => {
    for (const page of ['terms', 'refunds', 'contact', 'about']) {
      assert.equal(fs.existsSync(path.join(ROOT, page, 'index.html')), false);
    }
    assert.equal(home.includes('href="/terms/"'), false);
    assert.equal(home.includes('[TRADER NAME]'), false);
    assert.equal(home.includes('[ADDRESS]'), false);
  });
});
