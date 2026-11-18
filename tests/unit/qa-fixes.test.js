import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();

function htmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;|&apos;/g, "'");
}

describe('QA fixes', () => {
  const files = htmlFiles(ROOT);
  const guides = files.filter((file) => file.includes(`${path.sep}guides${path.sep}`) && file.endsWith(`${path.sep}index.html`) && !file.endsWith(`${path.sep}guides${path.sep}index.html`));

  it('keeps See the kit links on the matching kits anchor', () => {
    const bad = [];
    let count = 0;
    for (const file of guides) {
      const html = fs.readFileSync(file, 'utf8');
      for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
        const text = decode(match[2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
        if (!/^See the\b/i.test(text)) continue;
        count += 1;
        const attrs = match[1];
        const href = (attrs.match(/href="([^"]*)"/) || [])[1] || '';
        const named = [
          ['speech', /speech kit/i],
          ['duties', /duties kit/i],
          ['playbook', /playbook/i],
          ['bundle', /\bbundle\b/i],
        ].filter(([, pattern]) => pattern.test(text)).map(([kit]) => kit);
        if (attrs.includes('data-product') || named.length !== 1 || href !== `/kits/#${named[0]}`) {
          bad.push(`${path.relative(ROOT, file)} "${text}" ${href}`);
        }
      }
    }
    assert.equal(count, 50);
    assert.deepEqual(bad, []);
  });

  it('puts a Kits link in every guide header and footer', () => {
    const bad = [];
    for (const file of guides) {
      const html = fs.readFileSync(file, 'utf8');
      const nav = html.match(/<nav id="site-nav"[\s\S]*?<\/nav>/);
      const footer = html.match(/<nav class="guide-footer-links"[\s\S]*?<\/nav>/);
      if (!nav || !nav[0].includes('href="/kits/"') || !footer || !footer[0].includes('href="/kits/"')) {
        bad.push(path.relative(ROOT, file));
      }
    }
    assert.equal(guides.length, 50);
    assert.deepEqual(bad, []);
  });

  it('hides the email sign-up note and the stale checkout wording', () => {
    const blob = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    assert.equal(blob.includes('form goes live'), false);
    assert.equal(blob.includes('once checkout is live'), false);
    assert.equal(blob.includes('when it is available'), false);
    assert.equal(blob.includes('guide-soft-checklist'), false);
  });

  it('does not link speechmate, toastwiz or Hitched', () => {
    const bad = [];
    for (const file of files) {
      const html = fs.readFileSync(file, 'utf8');
      if (/speechmate\.com|toastwiz\.com|hitched\.co\.uk|\bHitched\b/i.test(html)) {
        bad.push(path.relative(ROOT, file));
      }
    }
    assert.deepEqual(bad, []);
  });

  it('keeps the five long meta descriptions at 165 characters or under', () => {
    const slugs = [
      'cheap-stag-do-ideas',
      'best-man-speech-same-sex-wedding',
      'best-man-rehearsal-responsibilities',
      'best-man-speech-dont-know-the-bride',
      'best-man-speech-thanking-parents',
    ];
    for (const slug of slugs) {
      const html = fs.readFileSync(path.join(ROOT, 'guides', slug, 'index.html'), 'utf8');
      const desc = html.match(/<meta name="description" content="([^"]*)"/)[1];
      assert.ok(desc.length <= 165, `${slug} is ${desc.length}`);
      assert.ok(desc.length >= 80, slug);
    }
  });

  it('redirects http and www to the https apex and retires the best-woman path', () => {
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    const redirects = config.redirects;
    const http = redirects.find((rule) => rule.has?.some((item) => item.key === 'x-forwarded-proto' && item.value === 'http'));
    const www = redirects.find((rule) => rule.has?.some((item) => item.type === 'host' && item.value === 'www.bestmanbackup.com'));
    const retired = redirects.find((rule) => rule.source === '/guides/best-woman-speech/');
    assert.equal(http.destination, 'https://bestmanbackup.com/$1');
    assert.equal(http.statusCode, 301);
    assert.equal(www.destination, 'https://bestmanbackup.com/$1');
    assert.equal(www.statusCode, 301);
    assert.equal(retired.destination, '/guides/');
    assert.equal(retired.statusCode, 301);
  });

  it('marks the draft legal pages noindex, with placeholders and footer links', () => {
    const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    for (const href of ['/about/', '/contact/', '/terms/', '/refunds/']) {
      assert.equal(home.includes(`href="${href}"`), true, href);
    }
    const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    for (const page of ['about', 'contact', 'terms', 'refunds']) {
      const html = fs.readFileSync(path.join(ROOT, page, 'index.html'), 'utf8');
      assert.match(html, /DRAFT – awaiting owner sign-off/);
      assert.match(html, /noindex/);
      assert.match(html, /\[TRADER NAME\]/);
      assert.match(html, /\[ADDRESS\]/);
      assert.match(html, /\[EMAIL\]/);
      assert.equal(sitemap.includes(`/${page}/`), false);
    }
    const refunds = fs.readFileSync(path.join(ROOT, 'refunds', 'index.html'), 'utf8');
    assert.match(refunds, /Consumer Contracts \(Information, Cancellation and Additional Charges\) Regulations 2013/);
    assert.match(refunds, /express consent/);
    assert.match(refunds, /lose the 14-day cancellation right once the download starts/);
  });
});
