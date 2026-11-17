import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const GUIDE_DIRS = fs
  .readdirSync(path.join(process.cwd(), 'guides'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const INTERNAL_HREF = /^\/(?!\/)/;

test.describe('Best Man Backup — desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('home loads and names the brand', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/Best Man Backup/i);
    await expect(page.getByRole('link', { name: /Best Man Backup/i }).first()).toBeVisible();
  });

  test('home buy buttons resolve via checkout config to Stripe test Payment Links', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(window as unknown as { BMB_CHECKOUT?: unknown }).BMB_CHECKOUT);

    const expected: Record<string, RegExp> = {
      duties: /buy\.stripe\.com\/test_5kQeVfanOfdkc2XemU0Fi0h/,
      playbook: /buy\.stripe\.com\/test_5kQ14pgMc6GOc2Xa6E0Fi0i/,
      speech: /buy\.stripe\.com\/test_8x214pgMc0iq3wrbaI0Fi0g/,
      set: /buy\.stripe\.com\/test_aFa7sN1Ric18gjd4Mk0Fi0j/,
    };

    for (const product of Object.keys(expected)) {
      const link = page.locator(`a[data-product="${product}"]`).first();
      await expect(link, `missing buy button for ${product}`).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href, `${product} href`).toMatch(expected[product]);
      expect(href || '').not.toMatch(/etsy\.com/i);
    }
  });

  test('kits page lists every product with a price and no pending checkout wording', async ({ page }) => {
    const res = await page.goto('/kits/');
    expect(res?.ok()).toBeTruthy();
    await page.waitForFunction(() => !!(window as unknown as { BMB_CHECKOUT?: unknown }).BMB_CHECKOUT);
    await expect(page.locator('#speech')).toContainText('£6.98');
    await expect(page.locator('#duties')).toContainText('£5.99');
    await expect(page.locator('#playbook')).toContainText('£11.99');
    await expect(page.locator('#bundle')).toContainText('£19.99');
    await expect(page.locator('body')).not.toContainText(/Checkout opening shortly/i);
    const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schema.join('\n')).toMatch(/"@type":\s*"Product"/);
    expect(schema.join('\n')).toMatch(/"price":\s*"6\.98"/);
  });

  test('thank-you page is present and noindex; paid files are not linked as static URLs', async ({ page, request }) => {
    const res = await page.goto('/thank-you/?kit=speech&session_id=cs_test_dummy');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
    await expect(page.locator('body')).toContainText(/Thank you|Checking your payment|verify|hello@bestmanbackup\.com/i);

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain('/thank-you/');
    expect(sitemap).not.toContain('/private/');
    expect(sitemap).not.toMatch(/speech\.zip|duties\.zip|playbook\.zip|bundle\.zip/i);

    await page.goto('/');
    await expect(page.locator('a[href*="/private/"]')).toHaveCount(0);
    await expect(page.locator('a[href$=".zip"]')).toHaveCount(0);
  });

  test('links page is present, tap-friendly and noindex', async ({ page }) => {
    const res = await page.goto('/links/');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
    for (const href of [
      '/kits/',
      '/guides/what-does-the-best-man-pay-for/',
      '/guides/joint-best-man-speech/',
    ]) {
      const link = page.locator(`a[href="${href}"]`).first();
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box?.height || 0).toBeGreaterThan(40);
    }
  });

  test('every guide has a working PDF download and a product CTA', async ({ page, request }) => {
    for (const slug of GUIDE_DIRS) {
      const guidePath = `/guides/${slug}/`;
      const res = await page.goto(guidePath);
      expect(res?.ok(), guidePath).toBeTruthy();

      const pdfLinks = page.locator('a[href^="/downloads/"][href$="-checklist.pdf"]');
      await expect(pdfLinks, `${slug} pdf count`).toHaveCount(2);
      const href = await pdfLinks.first().getAttribute('href');
      expect(href).toBe(`/downloads/${slug}-checklist.pdf`);
      const pdfRes = await request.get(href!);
      expect(pdfRes.ok(), `${href} should be HTTP 200`).toBeTruthy();
      expect(pdfRes.headers()['content-type'] || '').toMatch(/pdf/i);

      await expect(page.locator('.kit-cta a[data-product]').first(), `${slug} CTA`).toBeVisible();
      const ctaHref = await page.locator('.kit-cta a[data-product]').first().getAttribute('href');
      expect(ctaHref || '').toMatch(/buy\.stripe\.com\/test_/);
    }
  });

  test('no Etsy links anywhere in served HTML/JS that pages load', async ({ page, request }) => {
    const paths = ['/', '/kits/', '/links/', '/guides/', '/privacy/', ...GUIDE_DIRS.map((s) => `/guides/${s}/`)];
    for (const p of paths) {
      const res = await request.get(p);
      expect(res.ok(), p).toBeTruthy();
      const body = await res.text();
      expect(body, p).not.toMatch(/etsy\.com/i);
    }

    for (const asset of [
      '/site.js',
      '/suite.js',
      '/analytics.js',
      '/assets/checkout-config.js',
      '/assets/checkout.js',
    ]) {
      const res = await request.get(asset);
      expect(res.ok(), asset).toBeTruthy();
      const body = await res.text();
      // Allow the empty-URL guard comment/check in site.js and config comments.
      if (asset === '/site.js' || asset === '/assets/checkout-config.js') {
        expect(body.replace(/etsy\.com/gi, '')).not.toMatch(/listing\/\d+/);
        continue;
      }
      expect(body, asset).not.toMatch(/etsy\.com/i);
    }

    await page.goto('/');
    await expect(page.locator('a[href*="etsy.com"]')).toHaveCount(0);
  });

  test('every internal link on key pages resolves', async ({ page, request }) => {
    const seeds = ['/', '/kits/', '/links/', '/guides/', '/privacy/', '/guides/how-to-write-a-best-man-speech/'];
    const seen = new Set<string>();
    const queue = [...seeds];

    while (queue.length) {
      const current = queue.shift()!;
      if (seen.has(current)) continue;
      seen.add(current);
      const res = await page.goto(current);
      expect(res?.ok(), current).toBeTruthy();

      const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).getAttribute('href') || '')
      );
      for (const href of hrefs) {
        if (!INTERNAL_HREF.test(href)) continue;
        if (href.startsWith('/#')) continue;
        const url = new URL(href, 'http://127.0.0.1:4173');
        const clean = url.pathname.endsWith('/') || path.extname(url.pathname) ? url.pathname : `${url.pathname}/`;
        const checkPath = path.extname(url.pathname) ? url.pathname : clean;
        const head = await request.get(checkPath);
        expect(head.ok(), `${current} → ${checkPath}`).toBeTruthy();
        if (
          checkPath.startsWith('/guides/') &&
          checkPath.endsWith('/') &&
          checkPath !== '/guides/' &&
          !seen.has(checkPath) &&
          seen.size < 80
        ) {
          queue.push(checkPath);
        }
      }
    }
  });

  test('sitemap includes /kits/ and omits /links/', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();
    expect(xml).toContain('https://bestmanbackup.com/kits/');
    expect(xml).not.toContain('https://bestmanbackup.com/links/');
  });

  test('cheat-sheet sign-up stays hidden', async ({ page }) => {
    const siteJs = await page.request.get('/site.js');
    expect(siteJs.ok()).toBeTruthy();
    const source = await siteJs.text();
    expect(source).toMatch(/signupEnabled:\s*false/);

    await page.goto('/');
    const section = page.locator('[data-signup]');
    await expect(section).toHaveCount(1);
    await expect(section).toBeHidden();
  });
});

test.describe('Best Man Backup — mobile 390', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('guide free download and CTA remain usable on a phone width', async ({ page }) => {
    const res = await page.goto('/guides/joint-best-man-speech/');
    expect(res?.ok()).toBeTruthy();
    const pdf = page.locator('[data-free-download="top"] a.button').first();
    await expect(pdf).toBeVisible();
    const pdfBox = await pdf.boundingBox();
    expect(pdfBox?.width || 0).toBeGreaterThan(40);
    expect(pdfBox?.height || 0).toBeGreaterThan(24);

    const cta = page.locator('.kit-cta-top a.button').first();
    await expect(cta).toBeVisible();
    const ctaBox = await cta.boundingBox();
    expect(ctaBox?.width || 0).toBeGreaterThan(40);
  });

  test('links page buttons are large enough to tap', async ({ page }) => {
    await page.goto('/links/');
    const first = page.locator('.link-stack a').first();
    const box = await first.boundingBox();
    expect(box?.height || 0).toBeGreaterThanOrEqual(48);
  });
});
