/**
 * Capture desktop + mobile screenshots and optional Lighthouse scores.
 * Usage: node scripts/capture-audit.mjs <baseUrl> <outDir> [lighthouse]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const base = (process.argv[2] || 'http://127.0.0.1:8765').replace(/\/$/, '');
const outDir = process.argv[3] || '/opt/cursor/artifacts/before';
const runLh = process.argv[4] === 'lighthouse';

const pages = [
  { slug: 'home', path: '/' },
  { slug: 'kits', path: '/kits/' },
  { slug: 'guides', path: '/guides/' },
  { slug: 'guide-speech', path: '/guides/how-to-write-a-best-man-speech/' },
  { slug: 'guide-games', path: '/guides/stag-do-games/' },
  { slug: 'links', path: '/links/' },
  { slug: 'privacy', path: '/privacy/' },
  { slug: 'thank-you', path: '/thank-you/?kit=speech&session_id=cs_test_dummy' },
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(viewport, label) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  for (const p of pages) {
    const url = base + p.path;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(250);
      const file = path.join(outDir, `${label}-${p.slug}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log('ok', file);
    } catch (err) {
      console.error('fail', label, p.slug, err.message);
    }
  }
  await context.close();
}

await shot({ width: 1440, height: 900 }, 'desktop');
await shot({ width: 390, height: 844 }, 'mobile');
await browser.close();

if (runLh) {
  const scores = {};
  for (const p of ['/', '/kits/', '/guides/']) {
    const report = path.join(outDir, `lh-${p.replace(/\W+/g, '_') || 'home'}.json`);
    const r = spawnSync(
      'npx',
      [
        '--yes',
        'lighthouse',
        base + p,
        '--only-categories=performance,accessibility,best-practices,seo',
        '--chrome-flags=--headless --no-sandbox --disable-gpu',
        '--output=json',
        `--output-path=${report}`,
        '--quiet',
      ],
      { encoding: 'utf8', timeout: 180000 }
    );
    if (r.status !== 0) {
      console.error('lighthouse failed', p, r.stderr?.slice(0, 400));
      continue;
    }
    const data = JSON.parse(fs.readFileSync(report, 'utf8'));
    scores[p] = Object.fromEntries(
      Object.entries(data.categories).map(([k, v]) => [k, Math.round((v.score || 0) * 100)])
    );
    console.log('lh', p, scores[p]);
  }
  fs.writeFileSync(path.join(outDir, 'lighthouse-summary.json'), JSON.stringify(scores, null, 2));
}

console.log('done', outDir);
