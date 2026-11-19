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
    const guideSection = home.slice(home.indexOf('id="guides"'), home.indexOf('id="duties"'));
    const homeHrefs = [...guideSection.matchAll(/href="\/guides\/([^"]+)\/"/g)].map((match) => match[1]).sort();
    const lists = [...hub.matchAll(/class="guide-index-list"[\s\S]*?<\/ol>/g)].map((match) => match[0]).join('\n');
    const hubHrefs = [...lists.matchAll(/href="\/guides\/([^"/]+)\//g)].map((match) => match[1]).sort();
    assert.deepEqual(homeHrefs, slugs);
    assert.deepEqual(hubHrefs, slugs);
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
    assert.match(home, /Stag do games, challenges and awards<\/th><td>—<\/td><td>Included<\/td><td>—<\/td><td>Included<\/td>/);
    assert.equal(kits.includes('"price": "14.99"'), true);
    assert.equal(kits.includes('"price": "9.99"'), true);
    assert.equal(KITS.playbook.name, 'Stag Do & Bachelor Party Playbook');
  });

  it('keeps the homepage title short and matched to the social title', () => {
    const title = home.match(/<title>([^<]*)<\/title>/)[1];
    const og = home.match(/property="og:title" content="([^"]*)"/)[1];
    assert.equal(title, og);
    assert.ok(title.length <= 60, title.length);
    assert.match(title, /50 free/i);
    assert.match(title, /best man/i);
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
