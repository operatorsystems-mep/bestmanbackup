import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function htmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'tests') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function guideSlugs() {
  return fs
    .readdirSync(path.join(ROOT, 'guides'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

const STOREFRONT = [
  'index.html',
  'kits/index.html',
  'kits/speech/index.html',
  'kits/duties/index.html',
  'kits/playbook/index.html',
  'kits/bundle/index.html',
  'checklist/index.html',
  'guides/index.html',
];

const ALLOWED_NOINDEX = new Set([
  path.join(ROOT, 'thank-you/index.html'),
  path.join(ROOT, 'links/index.html'),
  path.join(ROOT, '404.html'),
]);

describe('pocket-card storefront', () => {
  it('paints the footer tagline in muted gold', () => {
    const css = read('style.css');
    assert.match(css, /--gold:\s*#AD8749/i);
    assert.match(css, /footer p\{color:\s*var\(--gold\)\}/);
  });

  const files = htmlFiles(ROOT);
  const slugs = guideSlugs();

  it('keeps production heads indexable, with analytics and the new stylesheet', () => {
    const noindex = [];
    for (const file of files) {
      const html = fs.readFileSync(file, 'utf8');
      if (/noindex/i.test(html) && !ALLOWED_NOINDEX.has(file)) noindex.push(path.relative(ROOT, file));
    }
    assert.deepEqual(noindex, []);

    for (const rel of STOREFRONT) {
      const html = read(rel);
      assert.match(html, /<link rel="stylesheet" href="\/style\.css">/, rel);
      assert.match(html, /<script defer src="\/analytics\.js"><\/script>/, rel);
      assert.match(html, /<link rel="canonical" href="https:\/\/bestmanbackup\.com\//, rel);
      assert.doesNotMatch(html, /noindex/i, rel);
      assert.doesNotMatch(html, /\/checkout\/|\/receipt\//, rel);
      assert.doesNotMatch(html, /Private preview|Private demonstration|Review checkout/, rel);
    }
  });

  it('buys kits through data-product at the delivered prices', () => {
    const expected = {
      speech: ['The Speech Kit', '£14.99', '14.99'],
      duties: ['The Duties Kit', '£9.99', '9.99'],
      playbook: ['The Stag Playbook', '£9.99', '9.99'],
      bundle: ['The Best Man Set', '£19.99', '19.99'],
    };
    for (const [id, [name, labelPrice, schemaPrice]] of Object.entries(expected)) {
      const html = read(`kits/${id}/index.html`);
      assert.match(html, new RegExp(`data-product="${id}" href="/kits/${id}/"[^>]*>Buy ${name} · ${labelPrice}`));
      assert.match(html, new RegExp(`"price": "${schemaPrice}"`));
      assert.match(html, /Instant private download · Secure Stripe checkout/);
      assert.equal(html.includes('Instant private download after payment.'), false);
      assert.match(html, /<script defer src="\/assets\/checkout-config\.js"><\/script>/);
      assert.match(html, /<script defer src="\/assets\/checkout\.js"><\/script>/);
    }
    const config = read('assets/checkout-config.js');
    assert.match(config, /https:\/\/buy\.stripe\.com\/8x214p9jK0iqff9diQ0Fi04/);
    assert.match(config, /https:\/\/buy\.stripe\.com\/6oU3cx2VmaX4d71gv20Fi05/);
    assert.match(config, /https:\/\/buy\.stripe\.com\/5kQ3cxgMce9geb52Ec0Fi06/);
    assert.match(config, /https:\/\/buy\.stripe\.com\/dRmbJ3brSe9g7MHbaI0Fi03/);
  });

  it('keeps every live guide title, schema, CTA and checklist', () => {
    const titles = JSON.parse(read('tests/fixtures/guide-titles.json'));
    assert.deepEqual(Object.keys(titles).sort(), slugs);
    for (const slug of slugs) {
      const html = read(path.join('guides', slug, 'index.html'));
      const title = html.match(/<title>([^<]*)<\/title>/)[1];
      assert.equal(title, titles[slug], slug);
      assert.match(html, new RegExp(`<link rel="canonical" href="https://bestmanbackup.com/guides/${slug}/">`));
      assert.match(html, /"@type": "Article"/);
      assert.match(html, /"@type": "FAQPage"/);
      assert.match(html, /class="kit-cta kit-cta-top"[\s\S]*data-product="/);
      assert.match(html, /class="kit-cta kit-cta-end"[\s\S]*data-product="/);
      assert.match(html, new RegExp(`href="/downloads/${slug}-checklist\\.pdf"`));
      assert.match(html, /<link rel="stylesheet" href="\/style\.css">/);
      assert.match(html, /<script defer src="\/analytics\.js"><\/script>/);
      assert.doesNotMatch(html, /\/styles\.css|guides\.css|nav\.js|noindex/);
    }
  });

  it('lists the new canonical URLs and leaves robots alone', () => {
    const xml = read('sitemap.xml');
    assert.doesNotThrow(() => new DOMParserLike(xml));
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    assert.equal(locs.length, 63);
    for (const url of [
      'https://bestmanbackup.com/kits/speech/',
      'https://bestmanbackup.com/kits/duties/',
      'https://bestmanbackup.com/kits/playbook/',
      'https://bestmanbackup.com/kits/bundle/',
      'https://bestmanbackup.com/checklist/',
      'https://bestmanbackup.com/cards/',
      'https://bestmanbackup.com/terms/',
      'https://bestmanbackup.com/refunds/',
      'https://bestmanbackup.com/contact/',
    ]) {
      assert.equal(locs.includes(url), true, url);
    }
    const joined = locs.join('\n');
    assert.equal(joined.includes('/links/'), false);
    assert.equal(joined.includes('/thank-you/'), false);
    assert.equal(joined.includes('/checkout/'), false);
    assert.equal(joined.includes('/receipt/'), false);
    assert.match(read('kits/index.html'), /rel="canonical" href="https:\/\/bestmanbackup\.com\/kits\/"/);
    assert.match(read('checklist/index.html'), /rel="canonical" href="https:\/\/bestmanbackup\.com\/checklist\/"/);
    assert.match(read('robots.txt'), /Sitemap: https:\/\/bestmanbackup\.com\/sitemap\.xml/);
  });

  it('does not ship demo checkout pages or placeholder hosts', () => {
    assert.equal(fs.existsSync(path.join(ROOT, 'checkout')), false);
    assert.equal(fs.existsSync(path.join(ROOT, 'receipt')), false);
    const blob = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    assert.equal(/localhost|chatgpt\.site/i.test(blob), false);
    assert.equal(blob.includes('Private demonstration'), false);
    assert.equal(blob.includes('Private preview'), false);
    assert.equal(blob.includes('MAILERLITE_FORM_ACTION'), false);
  });

  it('leads with the Best Man Set and states what each kit includes', () => {
    for (const rel of ['index.html', 'kits/index.html']) {
      const html = read(rel);
      const ids = [...html.matchAll(/<a class="tile" id="([^"]+)"/g)].map((match) => match[1]);
      assert.deepEqual(ids, ['bundle', 'speech', 'duties', 'playbook'], rel);
      assert.match(html, /id="bundle"[\s\S]*Best value[\s\S]*Worth £34\.97 · Save £14.98/);
    }
    const speech = read('kits/speech/index.html');
    const duties = read('kits/duties/index.html');
    const playbook = read('kits/playbook/index.html');
    const bundle = read('kits/bundle/index.html');
    assert.match(speech, /What you get[\s\S]*including a support note · 15 files/);
    assert.match(speech, /A complete sample speech \(about 5 to 6 minutes\), set in the UK running order, inside the Speech Writing Guide and the Editable Workbook/);
    assert.match(speech, /editable Word workbook/i);
    assert.match(duties, /What you get[\s\S]*including a support note · 20 files/);
    assert.match(duties, /Ushers, buttonholes and witness duties in the guide and planner, and ushers briefed \(seating, orders of service, late arrivals\) on the day sheet/);
    assert.equal(duties.includes('An ushers brief'), false);
    assert.match(playbook, /What you get[\s\S]*including a support note · 22 files/);
    assert.equal(playbook.includes('A UK running order'), false);
    assert.match(playbook, /A4 and US Letter/);
    assert.match(bundle, /One main Start Here, plus a quick-start for each kit/);
    assert.match(bundle, /including a support note · 61 files/);
    assert.equal(bundle.includes('A sample speech, a UK running order and an ushers brief'), false);
    assert.match(bundle, /A complete sample speech \(about 5 to 6 minutes\), set in the UK running order/);
    assert.match(read('kits/index.html'), /Complete sample speech \(about 5 to 6 minutes\), in the guide and workbook/);
    assert.match(read('kits/index.html'), /Ushers, buttonholes and witness duties; day sheet: ushers briefed/);
    assert.match(bundle, /Ushers, buttonholes and witness duties in the Duties Guide and Planner/);
    assert.match(read('guides/index.html'), /<a href="\/kits\/bundle\/">The Best Man Set<\/a>\. All three kits, save <span data-save>£14\.98<\/span>/);
    assert.match(read('assets/checkout.js'), /data-save/);
    const home = read('index.html');
    assert.match(home, /What's inside[\s\S]*A complete sample speech \(about 5 to 6 minutes\), set in the UK running order, inside the Speech Writing Guide and the Editable Workbook/);
    assert.match(home, /What's inside[\s\S]*Ushers, buttonholes and witness duties in the guide and planner, and ushers briefed \(seating, orders of service, late arrivals\) on the day sheet/);
    assert.match(read('index.html'), /One main Start Here, plus a quick-start for each kit/);
    assert.match(speech, /Instant private download · Secure Stripe checkout · Problems\?/);
    assert.match(speech, /mailto:hello@bestmanbackup\.com/);
    assert.match(read('lib/kits.mjs'), /blobPath: 'kits\/v2-2026-11-27\/Best-Man-Speech-Kit\.zip'/);
    assert.match(read('lib/kits.mjs'), /downloadName: 'Best-Man-Speech-Kit\.zip'/);
    const guide = read('guides/how-to-write-a-best-man-speech/index.html');
    assert.match(guide, /theme-color" content="#101b2b"/);
    assert.equal(guide.includes('#132238'), false);
    assert.equal(guide.includes('#e3ba67'), false);
    assert.equal(guide.includes('#D4A84F'), false);
    assert.equal(guide.includes('#14253B'), false);
    assert.equal(read('thank-you/thank-you.css').includes('#e3ba67'), false);
  });

  it('adds one-page pocket checklist PDFs at A4 and US Letter', () => {
    const a4 = pdfBox(path.join(ROOT, 'downloads/pocket-a4.pdf'));
    const letter = pdfBox(path.join(ROOT, 'downloads/pocket-letter.pdf'));
    assert.equal(a4.pages, 1);
    assert.equal(letter.pages, 1);
    assert.ok(Math.abs(a4.width - 595) < 2 && Math.abs(a4.height - 842) < 2, JSON.stringify(a4));
    assert.ok(Math.abs(letter.width - 612) < 2 && Math.abs(letter.height - 792) < 2, JSON.stringify(letter));
  });
});

function DOMParserLike(xml) {
  if (!xml.startsWith('<?xml')) throw new Error('sitemap is not xml');
  if (!xml.includes('<urlset')) throw new Error('sitemap has no urlset');
  if ((xml.match(/<url>/g) || []).length !== (xml.match(/<\/url>/g) || []).length) {
    throw new Error('unbalanced url tags');
  }
}

function pdfBox(file) {
  const text = fs.readFileSync(file).toString('latin1');
  assert.match(text, /^%PDF/);
  const box = text.match(/\/MediaBox\s*\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]/);
  assert.ok(box, file);
  const pages = (text.match(/\/Type\s*\/Page(?!s)/g) || []).length;
  return {
    pages,
    width: Number(box[3]) - Number(box[1]),
    height: Number(box[4]) - Number(box[2]),
  };
}
