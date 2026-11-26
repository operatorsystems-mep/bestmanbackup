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

  it('keeps in-text kit links on the kits page instead of checkout', () => {
    const bad = [];
    let stripped = 0;
    for (const file of guides) {
      const html = fs.readFileSync(file, 'utf8');
      for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
        const attrs = match[1];
        if (attrs.includes('button')) continue;
        const text = decode(match[2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
        const href = (attrs.match(/href="([^"]*)"/) || [])[1] || '';
        if (attrs.includes('data-product') || /buy\.stripe\.com/i.test(href)) {
          bad.push(`${path.relative(ROOT, file)} still checks out: ${text}`);
        }
        if (/^(The Speech Kit|The Duties Kit|The Stag Playbook|The Best Man Set)$/.test(text)) {
          stripped += 1;
          const expected = /Speech Kit$/.test(text)
            ? '/kits/speech/'
            : /Duties Kit$/.test(text)
              ? '/kits/duties/'
              : /Playbook$/.test(text)
                ? '/kits/playbook/'
                : '/kits/bundle/';
          if (href !== expected) bad.push(`${path.relative(ROOT, file)} "${text}" -> ${href}`);
        }
      }
    }
    assert.ok(stripped >= 13, `expected the product-page kit links, saw ${stripped}`);
    assert.deepEqual(bad, []);
  });

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
        if (attrs.includes('data-product') || named.length !== 1 || href !== `/kits/${named[0]}/`) {
          bad.push(`${path.relative(ROOT, file)} "${text}" ${href}`);
        }
      }
    }
    assert.equal(count, 0);
    assert.deepEqual(bad, []);
  });

  it('uses the guide CTA pattern and the corrected save amount', () => {
    const visibleBad = [];
    const speech = new Set([
      '3-prompts-to-start-your-best-man-speech','best-man-speech-cue-cards','best-man-speech-dont-know-the-bride','best-man-speech-examples','best-man-speech-for-a-best-friend','best-man-speech-for-a-brother','best-man-speech-for-a-colleague','best-man-speech-for-a-cousin','best-man-speech-for-a-second-marriage','best-man-speech-jokes','best-man-speech-mistakes','best-man-speech-nerves','best-man-speech-opening-lines','best-man-speech-same-sex-wedding','best-man-speech-template','best-man-speech-thanking-parents','best-man-speech-without-notes','best-man-toast','dad-as-best-man','funny-best-man-speech-stories','funny-best-man-speech','heartfelt-best-man-speech','how-long-should-a-best-man-speech-be','how-to-end-a-best-man-speech','how-to-write-a-best-man-speech','joint-best-man-speech','last-minute-best-man-speech','rehearsal-dinner-toast','short-best-man-speech','what-not-to-say-in-a-best-man-speech','wedding-speech-order',
    ]);
    const duties = new Set([
      'asked-to-be-best-man','best-man-checklist-week-before','best-man-duties-checklist','best-man-duties-timeline','best-man-gift-ideas','best-man-outfit','best-man-rehearsal-responsibilities','best-man-rings','best-man-vs-groomsmen-vs-ushers','best-mans-job','what-does-the-best-man-do-on-the-wedding-day','what-does-the-best-man-pay-for',
    ]);
    for (const file of guides) {
      const html = fs.readFileSync(file, 'utf8');
      const slug = path.basename(path.dirname(file));
      const article = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
      const answerAt = article.indexOf('class="answer"');
      const topAt = article.indexOf('kit-cta-top');
      if ((article.match(/kit-cta-top/g) || []).length !== 1) visibleBad.push(`${slug} top`);
      if ((article.match(/kit-inline/g) || []).length !== 1) visibleBad.push(`${slug} inline`);
      if ((article.match(/kit-cta-end/g) || []).length !== 1) visibleBad.push(`${slug} end`);
      if (article.includes('kit-note')) visibleBad.push(`${slug} note`);
      if (!(article.indexOf('</h1>') < article.indexOf('class="dek"') && answerAt < topAt)) visibleBad.push(`${slug} order`);
      const hook = (article.match(/<p class="dek">([^<]*)<\/p>/) || [])[1] || '';
      if (hook.length === 0 || hook.length > 160) visibleBad.push(`${slug} hook ${hook.length}`);
      const words = article.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').match(/[A-Za-z0-9'’]+/g) || [];
      if (words.length > 2000) visibleBad.push(`${slug} words ${words.length}`);
      if (!article.includes('"@type": "FAQPage"') && !html.includes('"@type": "FAQPage"')) visibleBad.push(`${slug} faq schema`);
      const kit = speech.has(slug) ? 'speech' : duties.has(slug) ? 'duties' : 'playbook';
      if (!article.includes(`kit-cta-top" aria-label="The ${kit === 'speech' ? 'Speech Kit' : kit === 'duties' ? 'Duties Kit' : 'Stag Playbook'}"`) && !article.includes(`data-product="${kit}"`)) {
        visibleBad.push(`${slug} kit ${kit}`);
      }
      if (!article.includes(`data-product="${kit}"`)) visibleBad.push(`${slug} missing ${kit}`);
      if (!article.includes('data-product="bundle"')) visibleBad.push(`${slug} set`);
      if (slug === 'what-does-the-best-man-pay-for' && !article.includes('href="/kits/playbook/"')) {
        visibleBad.push('pay-for inline');
      }
      const visible = article.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
      if (/Best Man Bundle|Stag Do & Bachelor Party Playbook|Save £15/.test(visible)) visibleBad.push(`${slug} old name`);
      for (const block of article.match(/<(p|li)\b[\s\S]*?<\/\1>/gi) || []) {
        const plain = block.replace(/<[^>]+>/g, ' ');
        if (/Duties Kit/i.test(plain) && /budget|guest payment|supplier/i.test(plain)) {
          visibleBad.push(`${slug} duties money claim`);
        }
      }
    }
    const served = files.filter((file) => file.endsWith('.html')).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    assert.equal(/Save £15/i.test(served), false);
    assert.deepEqual(visibleBad, []);
  });

  it('puts a Kits link in every guide header and footer', () => {
    const bad = [];
    for (const file of guides) {
      const html = fs.readFileSync(file, 'utf8');
      const nav = html.match(/<header>[\s\S]*?<\/header>/);
      const footer = html.match(/<footer>[\s\S]*?<\/footer>/);
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
    const pdf = config.headers.find((rule) => rule.source === '/downloads/(.*\\.pdf)');
    assert.equal(pdf.headers[0].key, 'X-Robots-Tag');
    assert.equal(pdf.headers[0].value, 'noindex, follow');
  });

  it('does not publish the draft legal pages from this branch', () => {
    for (const page of ['terms', 'refunds', 'contact', 'about']) {
      assert.equal(fs.existsSync(path.join(ROOT, page, 'index.html')), false);
    }
    const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert.equal(home.includes('href="/terms/"'), false);
    assert.equal(home.includes('[TRADER NAME]'), false);
  });
});
