import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();

function guideSlugs() {
  return fs
    .readdirSync(path.join(ROOT, 'guides'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function liveCheckout() {
  const config = fs.readFileSync(path.join(ROOT, 'assets/checkout-config.js'), 'utf8');
  const products = {};
  for (const id of ['speech', 'duties', 'playbook', 'bundle']) {
    const block = config.match(new RegExp(`\\b${id}:\\s*Object\\.freeze\\(\\{([\\s\\S]*?)\\n    \\}\\)`));
    assert.ok(block, id);
    const price = block[1].match(/price:\s*'([^']+)'/);
    const url = block[1].match(/checkoutUrlLive:\s*'([^']+)'/);
    assert.ok(price && url, id);
    products[id] = { price: price[1], url: url[1] };
  }
  return products;
}

function linkAnnotations(buffer) {
  const text = buffer.toString('latin1');
  const uris = [];
  // fpdf2 writes the URI action before /Subtype /Link in the same annotation.
  const re = /\/A\s*<<\/S\s*\/URI\s*\/URI\s*\(([^)]+)\)>>[\s\S]{0,240}?\/Subtype\s*\/Link\b/g;
  let match;
  while ((match = re.exec(text))) uris.push(match[1]);
  return uris;
}

describe('guide checklist PDF buy links', () => {
  const checkout = liveCheckout();
  const liveUrls = Object.values(checkout).map((product) => product.url);
  const slugs = guideSlugs();

  it('reads four live Payment Links from checkout config', () => {
    assert.deepEqual(
      liveUrls,
      [
        'https://buy.stripe.com/8x214p9jK0iqff9diQ0Fi04',
        'https://buy.stripe.com/6oU3cx2VmaX4d71gv20Fi05',
        'https://buy.stripe.com/5kQ3cxgMce9geb52Ec0Fi06',
        'https://buy.stripe.com/dRmbJ3brSe9g7MHbaI0Fi03',
      ],
    );
    assert.equal(checkout.speech.price, '£14.99');
    assert.equal(checkout.duties.price, '£9.99');
    assert.equal(checkout.playbook.price, '£9.99');
    assert.equal(checkout.bundle.price, '£19.99');
  });

  it('puts all four live Stripe links on every guide PDF and drops /kits/ buy links', () => {
    const files = fs
      .readdirSync(path.join(ROOT, 'downloads'))
      .filter((name) => name.endsWith('-checklist.pdf'))
      .sort();
    assert.deepEqual(
      files,
      slugs.map((slug) => `${slug}-checklist.pdf`),
    );
    const bad = [];
    for (const file of files) {
      const buffer = fs.readFileSync(path.join(ROOT, 'downloads', file));
      const uris = linkAnnotations(buffer);
      for (const url of liveUrls) {
        if (!uris.includes(url)) bad.push(`${file} missing annotation ${url}`);
      }
      const kits = uris.filter((uri) => uri.includes('/kits/'));
      if (kits.length) bad.push(`${file} still links ${kits.join(' ')}`);
      if (buffer.toString('latin1').includes('/kits/')) bad.push(`${file} still mentions /kits/`);
    }
    assert.deepEqual(bad, []);
  });
});

describe('guide page buy controls', () => {
  it('gives every guide a data-product buy control and the Best Man Set', () => {
    const missing = [];
    for (const slug of guideSlugs()) {
      const html = fs.readFileSync(path.join(ROOT, 'guides', slug, 'index.html'), 'utf8');
      const products = [...html.matchAll(/data-product="([^"]+)"/g)].map((match) => match[1]);
      const kit = products.find((product) => product === 'speech' || product === 'duties' || product === 'playbook');
      if (!products.length || !kit || !products.includes('bundle')) {
        missing.push(`${slug}: ${products.join(',') || 'none'}`);
      }
    }
    assert.deepEqual(missing, []);
  });
});
