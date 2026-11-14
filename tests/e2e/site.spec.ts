import { expect, test } from '@playwright/test';

const LISTINGS = {
  speech: '4567367337',
  duties: '4592141224',
  playbook: '4593059189',
  bundle: '4593235340',
} as const;

test.describe('Best Man Backup — desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('home loads and names the brand', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/Best Man Backup/i);
    await expect(page.getByRole('link', { name: /Best Man Backup/i }).first()).toBeVisible();
  });

  test('home reaches the guides hub and a real guide', async ({ page }) => {
    await page.goto('/');
    // The homepage header stays as the live design (kits, bundle, questions).
    // Guides are reached from the existing on-page and footer links.
    const toGuides = page.locator('a[href="/guides/"]').first();
    await expect(toGuides).toBeVisible();
    await toGuides.click();
    await expect(page).toHaveURL(/\/guides\/$/);
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: /guides/i })).toBeVisible();
    await expect(page.locator('.guide-cards a').first()).toBeVisible();
    const guide = page.locator('a[href="/guides/how-to-write-a-best-man-speech/"]');
    await expect(guide.first()).toBeVisible();
    const article = await page.request.get('/guides/how-to-write-a-best-man-speech/');
    expect(article.ok()).toBeTruthy();
    await guide.first().click();
    await expect(page).toHaveURL(/how-to-write-a-best-man-speech/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('kit CTAs point at the four live Etsy listings and never complete a purchase', async ({ page }) => {
    const etsyHits: string[] = [];
    await page.route(/etsy\.com/i, (route) => {
      etsyHits.push(route.request().url());
      return route.abort();
    });
    await page.goto('/');

    const hrefs: string[] = [];
    for (const id of Object.values(LISTINGS)) {
      const links = page.locator(`a[href*="etsy.com/listing/${id}"]`);
      await expect(links, `missing CTA for listing ${id}`).toHaveCount(1);
      const link = links.first();
      await expect(link).toHaveAttribute('href', new RegExp(`listing/${id}`));
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
      const href = await link.getAttribute('href');
      expect(href).toContain('utm_source=site');
      hrefs.push(href || '');
    }
    expect(new Set(hrefs).size).toBe(4);

    const speech = page.locator(`a[href*="etsy.com/listing/${LISTINGS.speech}"]`);
    const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
    await speech.click();
    const popup = await popupPromise;
    if (popup) await popup.close();
    await expect(page).not.toHaveURL(/etsy\.com/);
    expect(page.url()).not.toMatch(/checkout|cart|transaction/i);
  });

  test('legal pages are present and no longer claim GitHub Pages', async ({ page }) => {
    for (const { path, heading } of [
      { path: '/privacy/', heading: /Privacy/i },
      { path: '/terms/', heading: /^Terms$/i },
      { path: '/refunds/', heading: /Refund/i },
    ]) {
      const res = await page.goto(path);
      expect(res?.ok(), path).toBeTruthy();
      await expect(page.locator('h1')).toHaveText(heading);
      await expect(page.locator('body')).not.toContainText('GitHub Pages');
      await expect(page.locator('body')).toContainText('SEAN TO FILL');
      await expect(page.locator('body')).not.toContainText(/£\s?\d/);
    }

    await page.goto('/privacy/');
    await expect(page.locator('body')).toContainText('Vercel');
    await expect(page.locator('body')).toContainText('GoatCounter');
    await expect(page.locator('body')).toContainText('switched off');
    await expect(page.locator('body')).toContainText('14 November 2026');
  });

  test('/refund and /refund/ redirect to /refunds/', async ({ page }) => {
    for (const path of ['/refund', '/refund/']) {
      const res = await page.goto(path);
      expect(res?.ok(), path).toBeTruthy();
      await expect(page).toHaveURL(/\/refunds\/$/);
      await expect(page.locator('h1')).toHaveText(/Refund/i);
    }
  });

  test('cheat-sheet sign-up stays hidden and the placeholder is not submitted', async ({ page }) => {
    const siteJs = await page.request.get('/site.js');
    expect(siteJs.ok()).toBeTruthy();
    const source = await siteJs.text();
    expect(source).toMatch(/signupEnabled:\s*false/);
    expect(source).toContain("signupAction: 'MAILERLITE_FORM_ACTION'");
    expect(source).not.toMatch(/https:\/\/[^'"]*(mailerlite|resend)\.[^'"]*/i);

    const signupPosts: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'POST') return;
      if (/mailerlite|mlsend|resend\.com/i.test(request.url())) signupPosts.push(request.url());
    });
    await page.route(/mailerlite|mlsend|resend\.com/i, (route) => route.abort());

    await page.goto('/');
    const section = page.locator('[data-signup]');
    await expect(section).toHaveCount(1);
    await expect(section).toBeHidden();

    const form = page.locator('form[data-lead-form]');
    await expect(form).toHaveCount(1);
    await expect(form).toHaveAttribute('action', 'MAILERLITE_FORM_ACTION');
    await form.evaluate((el: HTMLFormElement) => {
      const email = el.querySelector<HTMLInputElement>('#lead-email');
      if (!email) throw new Error('missing email field');
      email.value = 'reader@example.com';
      el.requestSubmit();
    });
    await expect(page.locator('.lead-status')).toContainText(/sign-up opens soon/i);
    await expect(page).toHaveURL(/\/$/);
    expect(signupPosts, 'submitting the placeholder form must not POST to an email provider').toEqual([]);
  });

  test('home does not hard-code pound prices', async ({ page }) => {
    await page.goto('/');
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/£\s?\d/);
  });

  test('footer links to privacy, terms and refunds', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: /^Privacy$/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /^Terms$/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /^Refunds$/i })).toBeVisible();

    await page.goto('/guides/');
    const guideFooter = page.locator('footer');
    await expect(guideFooter.getByRole('link', { name: /^Privacy$/i })).toBeVisible();
    await expect(guideFooter.getByRole('link', { name: /^Terms$/i })).toBeVisible();
    await expect(guideFooter.getByRole('link', { name: /^Refunds$/i })).toBeVisible();
  });
});

test.describe('Best Man Backup — mobile 390', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('home and a kit CTA remain usable on a phone width', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    const speech = page.locator('a[href*="etsy.com/listing/4567367337"]').first();
    await expect(speech).toBeVisible();
    const box = await speech.boundingBox();
    expect(box, 'speech CTA should have a tappable box').toBeTruthy();
    if (box) {
      expect(box.width).toBeGreaterThan(40);
      expect(box.height).toBeGreaterThan(24);
    }
  });
});
