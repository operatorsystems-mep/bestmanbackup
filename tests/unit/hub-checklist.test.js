import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { KITS } from '../../lib/kits.mjs';

const ROOT = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

describe('guides hub and checklist addendum', () => {
  const hub = read('guides/index.html');
  const checklist = read('checklist/index.html');
  const config = read('assets/checkout-config.js');

  it('lists 50 guides plus three Start here cards', () => {
    const entries = hub.slice(hub.indexOf('id="entries"'), hub.indexOf('</section><script>'));
    const entryLinks = [...entries.matchAll(/href="\/guides\/([^"/]+)\//g)].map((match) => match[1]);
    assert.equal(entryLinks.length, 50);
    assert.equal(new Set(entryLinks).size, 50);
    const start = hub.match(/class="list start-here">([\s\S]*?)<\/div>/);
    assert.ok(start);
    const startLinks = [...start[1].matchAll(/href="(\/guides\/[^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(startLinks, [
      '/guides/how-to-write-a-best-man-speech/',
      '/guides/best-man-duties-checklist/',
      '/guides/how-to-plan-a-stag-do/',
    ]);
    assert.equal(hub.includes('50 free guides to the speech, the duties and the stag do. No sign-up.'), true);
    assert.equal(hub.includes('class="free-badge"'), true);
  });

  it('points kit bands at the kit slugs and keeps prices in checkout config', () => {
    for (const id of ['speech', 'duties', 'playbook', 'bundle']) {
      assert.equal(Boolean(KITS[id]), true, id);
      assert.equal(hub.includes(`href="/kits/${KITS[id].id}/"`), true, id);
      assert.equal(config.includes(`id: '${id}'`), true);
    }
    assert.equal(hub.includes('data-price="speech">£14.99'), true);
    assert.equal(hub.includes('data-price="duties">£9.99'), true);
    assert.equal(hub.includes('data-price="playbook">£9.99'), true);
    assert.equal(hub.includes('src="/assets/checkout.js"'), true);
    assert.equal(checklist.includes('src="/assets/checkout.js"'), true);
    assert.equal(hub.includes('No guide matches that yet'), true);
    assert.equal(hub.includes('querySelector(".d")'), true);
    assert.equal(hub.includes('apple-touch-icon.png'), true);
    assert.match(hub, /property="og:image" content="https:\/\/bestmanbackup\.com\/assets\/og-guides\.png"/);
    assert.match(hub, /property="og:image:alt"/);
  });

  it('gives the checklist a kit route, file facts and a social image', () => {
    assert.equal((checklist.match(/<h1\b/g) || []).length, 1);
    assert.ok((checklist.match(/<h2\b/g) || []).length >= 2);
    assert.equal(checklist.includes('href="/kits/duties/"'), true);
    assert.equal(checklist.includes('href="/kits/bundle/"'), true);
    assert.equal(checklist.includes('1 page · PDF'), true);
    assert.equal(checklist.includes('a duties guide, a planner and a day sheet with carry cards'), true);
    assert.equal(checklist.includes('ushers'), false);
    assert.equal(/property="og:image" content="[^"]*apple-touch-icon/.test(checklist), false);
    assert.match(checklist, /property="og:image" content="https:\/\/bestmanbackup\.com\/assets\/og-checklist\.png"/);
    assert.match(checklist, /property="og:image:alt" content="The Best Man’s Pocket Checklist, page 1"/);
    assert.equal(checklist.includes('href="/guides/best-man-checklist-week-before/"'), true);
    assert.equal(checklist.includes('href="/guides/what-does-the-best-man-do-on-the-wedding-day/"'), true);
    assert.equal(checklist.includes('href="/guides/best-man-duties-timeline/"'), true);
    const json = checklist.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
    const data = JSON.parse(json);
    assert.equal(data['@type'], 'WebPage');
    assert.equal(typeof data.name, 'string');
    assert.equal(typeof data.description, 'string');
    assert.equal(data.url, 'https://bestmanbackup.com/checklist/');
    assert.equal(checklist.includes('data-price="duties">£9.99'), true);
    assert.equal(checklist.includes('class="sheet-preview"'), true);
  });

  it('matches kit FAQ schema to the visible questions and names buy buttons', () => {
    for (const id of ['speech', 'duties', 'playbook', 'bundle']) {
      const html = read(`kits/${id}/index.html`);
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) =>
        JSON.parse(match[1]),
      );
      const faq = blocks.find((block) => block['@type'] === 'FAQPage');
      assert.ok(faq, id);
      assert.ok(faq.mainEntity.length >= 3 && faq.mainEntity.length <= 4, id);
      for (const question of faq.mainEntity) {
        assert.equal(html.includes(`<summary>${question.name}</summary>`), true, question.name);
        assert.equal(html.includes(question.acceptedAnswer.text), true, question.name);
      }
      const faqHtml = html.slice(html.indexOf('id="kit-faq"'), html.indexOf('</main>'));
      assert.equal(/refund|cancellation/i.test(faqHtml), false);
    }
    const guide = read('guides/how-to-write-a-best-man-speech/index.html');
    assert.match(guide, /data-product="speech"[^>]*aria-label="Get The Speech Kit"/);
    assert.match(guide, /data-product="bundle"[^>]*aria-label="Get all three · The Best Man Set · £19\.99"/);
    assert.equal(guide.includes('Get the Best Man Bundle'), false);
    assert.equal(guide.includes('About these guides: written by Best Man Backup'), true);
    assert.match(read('style.css'), /\.kit-band a\{color:#7A5C28/);
    assert.match(read('style.css'), /\.kit-inline a\{color:#7A5C28/);
    assert.match(read('assets/checkout.js'), /data-price/);
    assert.match(read('assets/checkout.js'), /The Best Man Set/);
  });
});
