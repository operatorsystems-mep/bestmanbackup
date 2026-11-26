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
    await expect(page).toHaveTitle('Be the best man he’ll never forget | Best Man Backup');
    await expect(page.getByRole('link', { name: /Best Man Backup/i }).first()).toBeVisible();
  });

  test('kit buy buttons use Stripe TEST links on non-production hosts; LIVE links stay in config', async ({ page }) => {
    const expectedTest: Record<string, RegExp> = {
      duties: /buy\.stripe\.com\/test_5kQeVfanOfdkc2XemU0Fi0h/,
      playbook: /buy\.stripe\.com\/test_5kQ14pgMc6GOc2Xa6E0Fi0i/,
      speech: /buy\.stripe\.com\/test_8x214pgMc0iq3wrbaI0Fi0g/,
      bundle: /buy\.stripe\.com\/test_aFa7sN1Ric18gjd4Mk0Fi0j/,
    };
    const expectedLive: Record<string, RegExp> = {
      duties: /buy\.stripe\.com\/6oU3cx2VmaX4d71gv20Fi05/,
      playbook: /buy\.stripe\.com\/5kQ3cxgMce9geb52Ec0Fi06/,
      speech: /buy\.stripe\.com\/8x214p9jK0iqff9diQ0Fi04/,
      bundle: /buy\.stripe\.com\/dRmbJ3brSe9g7MHbaI0Fi03/,
    };
    const prices: Record<string, string> = {
      speech: '£14.99',
      duties: '£9.99',
      playbook: '£9.99',
      bundle: '£19.99',
    };

    await page.goto('/kits/speech/');
    await page.waitForFunction(() => !!(window as unknown as { BMB_CHECKOUT?: unknown }).BMB_CHECKOUT);
    const cfg = await page.evaluate(() => {
      const c = (window as unknown as { BMB_CHECKOUT: { products: Record<string, { checkoutUrlTest: string; checkoutUrlLive: string; price: string }> } }).BMB_CHECKOUT;
      return c.products;
    });
    for (const id of Object.keys(expectedLive)) {
      expect(cfg[id].checkoutUrlLive, `${id} live url`).toMatch(expectedLive[id]);
      expect(cfg[id].checkoutUrlTest, `${id} test url`).toMatch(/buy\.stripe\.com\/test_/);
      expect(cfg[id].price, `${id} price`).toBe(prices[id]);
    }

    for (const product of Object.keys(expectedTest)) {
      await page.goto(`/kits/${product}/`);
      await page.waitForFunction(() => !!(window as unknown as { BMB_CHECKOUT?: unknown }).BMB_CHECKOUT);
      const link = page.locator(`a.btn[data-product="${product}"]`);
      await expect(link, `missing buy button for ${product}`).toBeVisible();
      await expect(link).toContainText(prices[product]);
      await expect(page.locator('.price')).toHaveText(prices[product]);
      const href = await link.getAttribute('href');
      expect(href, `${product} href`).toMatch(expectedTest[product]);
      expect(href || '').not.toMatch(/etsy\.com/i);
      expect(href || '').not.toMatch(/buy\.stripe\.com\/(?!test_)/);
      await expect(page.locator('a[href*="/checkout/"], a[href*="/receipt/"]')).toHaveCount(0);
    }
  });


  test('kits page lists every product with a price and no pending checkout wording', async ({ page }) => {
    const res = await page.goto('/kits/');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('#speech')).toContainText('The Speech Kit');
    await expect(page.locator('#speech')).toContainText('£14.99');
    await expect(page.locator('#duties')).toContainText('The Duties Kit');
    await expect(page.locator('#duties')).toContainText('£9.99');
    await expect(page.locator('#playbook')).toContainText('The Stag Playbook');
    await expect(page.locator('#playbook')).toContainText('£9.99');
    await expect(page.locator('#bundle')).toContainText('The Best Man Set');
    await expect(page.locator('#bundle')).toContainText('£19.99');
    await expect(page.locator('.grid .tile').first()).toHaveAttribute('id', 'bundle');
    await expect(page.locator('#bundle')).toContainText('Best value');
    await expect(page.locator('#bundle')).toContainText('Worth £34.97 · Save £15');
    await expect(page.locator('body')).not.toContainText('Stag & Bachelor Party Kit');
    await expect(page.locator('body')).not.toContainText(/Checkout opening shortly/i);
    const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schema.join('\n')).toMatch(/"@type":\s*"Product"/);
    expect(schema.join('\n')).toMatch(/"price":\s*"14\.99"/);
    expect(schema.join('\n')).toMatch(/"price":\s*"9\.99"/);
  });

  test('thank-you page is present and noindex; paid files are not linked as static URLs', async ({ page, request }) => {
    const res = await page.goto('/thank-you/?kit=speech&session_id=cs_test_dummy');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
    await expect(page.locator('#ty-tagline')).toHaveText("You've Got His Back, We've Got Yours.");
    await expect(page.locator('body')).toContainText(/Checking your payment|verify|hello@bestmanbackup\.com/i);

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain('/thank-you/');
    expect(sitemap).not.toContain('/private/');
    expect(sitemap).not.toMatch(/speech\.zip|duties\.zip|playbook\.zip|bundle\.zip/i);

    await page.goto('/');
    await expect(page.locator('a[href*="/private/"]')).toHaveCount(0);
    await expect(page.locator('a[href$=".zip"]')).toHaveCount(0);
  });

  test('thank-you missing params shows recovery state', async ({ page }) => {
    const res = await page.goto('/thank-you/');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('#ty-status')).toHaveAttribute('data-state', 'missing');
    await expect(page.locator('#ty-status')).toContainText(/Missing kit or session/i);
    await expect(page.locator('#ty-error-actions')).toBeVisible();
    await expect(page.locator('#ty-download')).toBeHidden();
    await expect(page.locator('#ty-tagline')).toHaveText("You've Got His Back, We've Got Yours.");
  });

  test('thank-you success state for a single kit shows download, contents, steps and bundle upsell', async ({ page }) => {
    await page.route('**/api/fulfillment/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          kit: 'speech',
          name: 'Best Man Speech Kit',
          downloadUrl: '/api/download/?token=test-token',
        }),
      });
    });

    await page.goto('/thank-you/?kit=speech&session_id=cs_test_ok');
    await expect(page.locator('#ty-status')).toHaveAttribute('data-state', 'success');
    await expect(page.getByRole('heading', { name: /You're all set/i })).toBeVisible();
    await expect(page.locator('#ty-product')).toHaveText('Best Man Speech Kit');
    await expect(page.locator('#ty-download-btn')).toBeVisible();
    await expect(page.locator('#ty-download-btn')).toHaveAttribute('href', '/api/download/?token=test-token');
    await expect(page.locator('#ty-contents')).toContainText(/speech-writing guide/i);
    await expect(page.locator('#ty-steps a')).toHaveCount(3);
    await expect(page.locator('#ty-reassure-panel')).toContainText(/hello@bestmanbackup\.com/i);
    await expect(page.locator('#ty-upsell')).toBeVisible();
    await expect(page.locator('#ty-upsell a[data-product="bundle"]')).toHaveAttribute(
      'href',
      /buy\.stripe\.com\/test_/
    );
    await expect(page.locator('#ty-share')).toBeHidden();
    await expect(page.locator('body')).not.toContainText(/founding|Done for you|package/i);
  });

  test('thank-you success state for the bundle shows share tip and no upsell', async ({ page }) => {
    await page.route('**/api/fulfillment/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          kit: 'bundle',
          name: 'Best Man Bundle',
          downloadUrl: '/api/download/?token=bundle-token',
        }),
      });
    });

    await page.goto('/thank-you/?kit=bundle&session_id=cs_test_bundle');
    await expect(page.locator('#ty-status')).toHaveAttribute('data-state', 'success');
    await expect(page.locator('#ty-product')).toHaveText('Best Man Bundle');
    await expect(page.locator('#ty-contents')).toContainText(/Duties Kit/i);
    await expect(page.locator('#ty-share')).toBeVisible();
    await expect(page.locator('#ty-share')).toContainText(/groom or ushers/i);
    await expect(page.locator('#ty-upsell')).toBeHidden();
  });

  test('thank-you error state keeps brand chrome and help path', async ({ page }) => {
    await page.route('**/api/fulfillment/**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          message: 'We could not verify this purchase.',
        }),
      });
    });

    await page.goto('/thank-you/?kit=duties&session_id=cs_test_bad');
    await expect(page.locator('#ty-status')).toHaveAttribute('data-state', 'error');
    await expect(page.locator('#ty-status')).toContainText(/could not verify/i);
    await expect(page.locator('#ty-eyebrow')).toContainText(/ORDER HELP/i);
    await expect(page.locator('#ty-product')).toHaveText('Best Man Duties Kit');
    await expect(page.locator('#ty-download')).toBeHidden();
    await expect(page.locator('#ty-error-actions')).toContainText(/hello@bestmanbackup\.com/i);
    await expect(page.locator('#ty-tagline')).toHaveText("You've Got His Back, We've Got Yours.");
    await expect(page.locator('header nav').getByRole('link', { name: 'Shop the kits' })).toBeVisible();
    await expect(page.locator('footer p')).toContainText(/got his back/i);
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
      const link = page.locator(`.link-stack a[href="${href}"]`).first();
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
      '/analytics.js',
      '/assets/checkout-config.js',
      '/assets/checkout.js',
    ]) {
      const res = await request.get(asset);
      expect(res.ok(), asset).toBeTruthy();
      const body = await res.text();
      if (asset === '/assets/checkout-config.js') {
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

  test('home shows the delivered kit prices and keeps the free-guides phrase', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const title = 'Be the best man he’ll never forget | Best Man Backup';
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /50 free best man guides/);
    await expect(page.locator('#speech')).toContainText('£14.99');
    await expect(page.locator('#duties')).toContainText('£9.99');
    await expect(page.locator('#playbook')).toContainText('£9.99');
    await expect(page.locator('#bundle')).toContainText('£19.99');
    await expect(page.locator('.grid .tile').first()).toHaveAttribute('id', 'bundle');
    await expect(page.locator('#bundle')).toContainText('Best value');
    await expect(page.locator('#bundle')).toContainText('Worth £34.97 · Save £15');
    await expect(page.locator('#speech')).toHaveAttribute('href', '/kits/speech/');
    await expect(page.locator('a[data-product]')).toHaveCount(0);
    const kits = page.locator('header nav').getByRole('link', { name: 'Shop the kits' });
    await expect(kits).toBeVisible();
    const box = await kits.boundingBox();
    expect(box?.width || 0).toBeGreaterThan(40);
    expect(box?.height || 0).toBeGreaterThan(20);
  });

  test('See the kit links stay on the kits page while buy buttons use test checkout', async ({ page }) => {
    await page.goto('/guides/how-to-write-a-best-man-speech/');
    await page.waitForFunction(() => !!(window as unknown as { BMB_CHECKOUT?: unknown }).BMB_CHECKOUT);
    await expect(page.getByRole('link', { name: 'See the Best Man Speech Kit' })).toHaveAttribute('href', '/kits/#speech');
    await expect(page.locator('.kit-cta a[data-product="speech"]').first()).toHaveAttribute('href', /buy\.stripe\.com\/test_/);
  });

  test('unknown paths use the branded 404 and the old best-woman path redirects', async ({ page, request }) => {
    const missing = await page.goto('/guides/this-page-does-not-exist/');
    expect(missing?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);

    const redirect = await request.get('/guides/best-woman-speech/', { maxRedirects: 0 });
    expect(redirect.status()).toBe(301);
    expect(redirect.headers().location).toBe('/guides/');
  });

  test('guides index numbers every guide and search hides empty categories', async ({ page }) => {
    await page.goto('/guides/');
    await expect(page.locator('#entries a')).toHaveCount(50);
    await expect(page.locator('#entries .n').first()).toHaveText('1');
    await expect(page.locator('#entries .n').last()).toHaveText('50');
    await expect(page.getByRole('heading', { name: /Speech writing/ })).toBeVisible();
    await page.locator('#q').fill('what not to say');
    await expect(page.locator('#entries a:visible')).toHaveCount(1);
    await expect(page.locator('#entries .guide-cat:visible')).toHaveCount(1);
    await expect(page.locator('#entries .guide-cat:visible h2')).toContainText('What to avoid');
    await page.locator('#q').fill('');
    await expect(page.locator('#entries .guide-cat:visible')).toHaveCount(5);
  });

  test('cheat-sheet sign-up stays hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-signup]')).toHaveCount(0);
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('MAILERLITE_FORM_ACTION');
    await expect(page.locator('script[src="/site.js"]')).toHaveCount(0);
  });
});

for (const width of [360, 375, 390, 414]) {
  test.describe(`Best Man Backup — no sideways scroll at ${width}`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('home, kits, checklist and the guide index stay within the screen', async ({ page }) => {
      for (const path of ['/', '/kits/', '/kits/speech/', '/checklist/', '/guides/']) {
        await page.goto(path);
        const widths = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        expect(widths.scroll, `${path} at ${width}`).toBeLessThanOrEqual(widths.client);
      }
    });
  });
}

test.describe('Best Man Backup — mobile 390', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('pocket-card pages do not scroll sideways and keep the inline nav on screen', async ({ page }) => {
    const paths = ['/', '/kits/', '/kits/speech/', '/kits/bundle/', '/checklist/', '/guides/', '/guides/how-to-write-a-best-man-speech/', '/guides/what-does-the-best-man-pay-for/'];
    for (const path of paths) {
      await page.goto(path);
      const shop = page.locator('header nav').getByRole('link', { name: 'Shop the kits' });
      const guides = page.locator('header nav').getByRole('link', { name: 'Free guides' });
      await expect(shop).toBeVisible();
      await expect(guides).toBeVisible();
      await expect(page.locator('header nav a.wide')).toBeHidden();
      const box = await shop.boundingBox();
      expect(box, path).toBeTruthy();
      expect(box!.x, path).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, path).toBeLessThanOrEqual(390);
      const buttons = page.locator('a.btn, a.button');
      const count = await buttons.count();
      for (let i = 0; i < count; i += 1) {
        const button = buttons.nth(i);
        if (!(await button.isVisible())) continue;
        const target = await button.boundingBox();
        expect(target?.height || 0, `${path} button ${i}`).toBeGreaterThanOrEqual(44);
      }
      const widths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(widths.scroll, `${path} scrollWidth`).toBeLessThanOrEqual(widths.client);
    }
  });

  test('privacy and the 404 use the pocket-card header', async ({ page }) => {
    for (const path of ['/privacy/', '/guides/this-page-does-not-exist/']) {
      await page.goto(path);
      const shop = page.locator('header nav').getByRole('link', { name: 'Shop the kits' });
      await expect(shop).toBeVisible();
      await expect(page.locator('header nav a.wide')).toBeHidden();
      await expect(page.locator('footer p')).toContainText(/got his back/i);
      const widths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(widths.scroll, path).toBeLessThanOrEqual(widths.client);
    }
  });

  test('buy buttons sit above the fold on a phone', async ({ page }) => {
    await page.goto('/kits/speech/');
    const buy = page.locator('a.btn[data-product="speech"]');
    await expect(buy).toBeVisible();
    const buyBox = await buy.boundingBox();
    expect(buyBox!.y + buyBox!.height).toBeLessThanOrEqual(844);
    await expect(page.locator('.trust').first()).toContainText('Secure Stripe checkout');

    await page.goto('/guides/stag-do-games/');
    const cta = page.locator('.kit-cta-top a.button');
    await expect(cta).toBeVisible();
    const ctaBox = await cta.boundingBox();
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(844);
    await expect(cta).toHaveAttribute('data-product', 'playbook');
    await expect(page.locator('.kit-cta-end a[data-product="bundle"]')).toContainText('all three');
  });

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

  test('thank-you success download CTA is tap-friendly on a phone width', async ({ page }) => {
    await page.route('**/api/fulfillment/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          kit: 'speech',
          name: 'Best Man Speech Kit',
          downloadUrl: '/api/download/?token=mobile-token',
        }),
      });
    });

    await page.goto('/thank-you/?kit=speech&session_id=cs_test_mobile');
    await expect(page.locator('#ty-status')).toHaveAttribute('data-state', 'success');
    const btn = page.locator('#ty-download-btn');
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box?.width || 0).toBeGreaterThan(200);
    expect(box?.height || 0).toBeGreaterThan(40);
  });
});
