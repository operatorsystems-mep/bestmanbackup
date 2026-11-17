/**
 * Visual QA: screenshot key pages at 1280 and 390; flag horizontal overflow.
 * Usage: node scripts/visual-qa.mjs <baseUrl> <outDir>
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.argv[2] || 'http://127.0.0.1:8765').replace(/\/$/, '');
const outDir = process.argv[3] || '/opt/cursor/artifacts/after';
fs.mkdirSync(outDir, { recursive: true });

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

const viewports = [
  { label: '1280', width: 1280, height: 800 },
  { label: '390', width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true });
const report = [];

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  for (const p of pages) {
    const url = base + p.path;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(200);
    // Force reveals visible for screenshots
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in')));
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflowX = doc.scrollWidth > doc.clientWidth + 1;
      const offenders = [];
      if (overflowX) {
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 2 && (r.right > window.innerWidth + 2 || r.left < -2)) {
            const tag = el.tagName.toLowerCase();
            const cls = typeof el.className === 'string' ? el.className.slice(0, 60) : '';
            offenders.push(`${tag}${cls ? '.' + cls.split(/\s+/).slice(0, 2).join('.') : ''}`);
          }
        });
      }
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        overflowX,
        offenders: [...new Set(offenders)].slice(0, 12),
      };
    });
    const file = path.join(outDir, `qa-${vp.label}-${p.slug}.png`);
    await page.screenshot({ path: file, fullPage: false });
    const entry = { viewport: vp.label, slug: p.slug, ...metrics, file };
    report.push(entry);
    console.log(vp.label, p.slug, metrics.overflowX ? 'OVERFLOW' : 'ok', metrics.overflowX ? metrics.offenders : '');
  }
  await context.close();
}

// Extra: home CTA above fold at 390
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in')));
  const fold = await page.evaluate(() => {
    const cta = document.querySelector('.hero .button');
    const brandDup = document.querySelector('.hero .brand-mark');
    const r = cta?.getBoundingClientRect();
    return {
      ctaBottom: r ? r.bottom : null,
      viewportH: window.innerHeight,
      ctaAboveFold: r ? r.bottom <= window.innerHeight - 8 : false,
      heroBrandDup: Boolean(brandDup),
      navLabels: [...document.querySelectorAll('#site-nav a')].map((a) => a.textContent.trim()),
      micro: document.querySelector('.hero .micro')?.textContent?.trim() || '',
    };
  });
  report.push({ check: 'home-mobile-fold', ...fold });
  console.log('home-mobile-fold', fold);
  await page.screenshot({ path: path.join(outDir, 'qa-390-home-fold.png'), fullPage: false });
  // kits strip
  await page.locator('#kits').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, 'qa-390-home-kits-strip.png'), fullPage: false });
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in')));
  await page.screenshot({ path: path.join(outDir, 'qa-1280-home.png'), fullPage: false });
  await page.locator('#kits').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, 'qa-1280-home-kits-strip.png'), fullPage: false });
  await context.close();
}

fs.writeFileSync(path.join(outDir, 'visual-qa-report.json'), JSON.stringify(report, null, 2));
await browser.close();
console.log('wrote', path.join(outDir, 'visual-qa-report.json'));
