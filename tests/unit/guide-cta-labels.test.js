import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

/**
 * checkout.js reads data-product on each buy link and, after the page renders,
 * points the href at that kit's Stripe checkout. The visible label has to name
 * the same kit, or a Speech / Duties / Playbook link is sold as the Bundle.
 */
const GUIDES = path.join(process.cwd(), 'guides');

const KIT_FROM_LABEL = [
  ['speech', /speech\s*kit/i],
  ['duties', /duties\s*kit/i],
  ['playbook', /playbook/i],
  ['bundle', /\b(bundle|set|all three)\b/i],
];

function guideHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) guideHtmlFiles(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function kitNamedBy(label) {
  const text = decodeEntities(label).replace(/\s+/g, ' ').trim();
  return KIT_FROM_LABEL.filter(([, pattern]) => pattern.test(text)).map(([kit]) => kit);
}

function productLinks(html) {
  const links = [];
  const tagRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = tagRe.exec(html))) {
    const attrs = match[1];
    const product = attrs.match(/data-product\s*=\s*"([^"]*)"/);
    if (!product) continue;
    const href = (attrs.match(/href\s*=\s*"([^"]*)"/) || [])[1] || '';
    const label = match[2].replace(/<[^>]+>/g, '');
    const line = html.slice(0, match.index).split('\n').length;
    links.push({ product: product[1], href, label, line });
  }
  return links;
}

describe('guide CTA labels match their kit tag', () => {
  const files = guideHtmlFiles(GUIDES);

  it('covers every guide page', () => {
    assert.ok(files.length >= 9);
    assert.ok(files.every((file) => file.startsWith(GUIDES)));
  });

  it('points each data-product link at the kit its label names', () => {
    const mismatches = [];

    for (const file of files) {
      const html = fs.readFileSync(file, 'utf8');
      const rel = path.relative(process.cwd(), file);
      for (const link of productLinks(html)) {
        const kits = kitNamedBy(link.label);
        const label = decodeEntities(link.label).replace(/\s+/g, ' ').trim();
        if (kits.length !== 1 || kits[0] !== link.product || link.href !== `/kits/#${kits[0] || link.product}`) {
          mismatches.push(
            `${rel}:${link.line} label "${label}" tagged ${link.product} (${link.href}), expected ${kits.join('+') || 'one kit'}`,
          );
        }
      }
    }

    assert.deepEqual(mismatches, []);
  });
});
