import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { isolate } from './isolatedBackend';
const url = process.env.GUMMY_TEST_URL;
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('App shell tests require an explicit local isolated test URL.');

test('signed-in navigation clears unused photos through Back, with direct route recovery', async ({ page }) => {
  const calls = await isolate(page, 'paid');
  await page.goto('/app');
  await page.getByLabel('Choose one toy photo').setInputFiles({ name: 'synthetic-fixture.jpg', mimeType: 'image/jpeg', buffer: readFileSync('tests/fixtures/teddy.jpg') });
  await expect(page.getByRole('img', { name: 'Your selected toy photo' })).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Parent navigation' });
  await expect(nav.getByRole('link')).toHaveCount(4);
  await nav.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/home$/);
  await expect(page.getByRole('heading', { name: 'Ready for a little playtime?' })).toBeFocused();
  await expect(nav.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('link', { name: 'My Toys', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My Toys', exact: true })).toBeVisible();
  await page.goBack(); await expect(page).toHaveURL(/\/app\/home$/);
  await page.goBack(); await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('img', { name: 'Your selected toy photo' })).toHaveCount(0);

  for (const [path, title] of [['/app/toys', 'My Toys'], ['/app/activities', 'Activities'], ['/app/profile', 'Profile']]) {
    await page.goto(path); await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
  }
  await page.goto('/app/not-a-page');
  await expect(page.getByRole('heading', { name: 'Let’s get you back to your toys' })).toBeVisible();
  expect(calls.every(call => ['analytics:identifyVisitor', 'auth:signIn'].includes(call))).toBe(true);
});

test('family pages offer guest recovery and remain usable offline, narrow and by keyboard', async ({ page }, testInfo) => {
  await isolate(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/app/toys');
  await expect(page.getByRole('heading', { name: 'My Toys', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Parent navigation' })).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to app content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#app-content')).toBeFocused();
  await page.getByRole('link', { name: 'Log in', exact: true }).last().click();
  await expect(page).toHaveURL(/\/app\/sign-in$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to my toys' }).click();
  await expect(page.getByRole('heading', { name: 'Let’s see those toys' })).toBeVisible();
  await page.goto('/app/profile');
  await page.evaluate(() => { dispatchEvent(new Event('offline')); });
  // Simulate navigator state without changing connectivity or touching a backend.
  await page.evaluate(() => { Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true }); dispatchEvent(new Event('offline')); });
  await expect(page.getByText('You’re offline', { exact: true })).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('guest-profile.png'), fullPage: true });
});

test('signed-in shell has visible touch targets, active state and honest feature boundaries', async ({ page }, testInfo) => {
  await isolate(page, 'paid');
  await page.goto('/app/home');
  await expect(page.getByRole('heading', { name: 'Ready for a little playtime?' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Parent navigation' }).getByRole('link')).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const link of await page.getByRole('navigation', { name: 'Parent navigation' }).getByRole('link').all()) {
      const bounds = await link.boundingBox(); expect(bounds!.height).toBeGreaterThanOrEqual(44); expect(bounds!.width).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
  }
  await expect(page.getByText(/Once saving is enabled, your suggestions will be kept here/)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const reflow = await page.addStyleTag({ content: '.ga-app a, .ga-app p, .ga-app button { font-size: 200% !important; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect.poll(() => page.locator('.ga-app').evaluate(e => parseFloat(getComputedStyle(e).paddingBottom) >= (document.querySelector('.ga-nav')?.getBoundingClientRect().height || 0))).toBe(true);
  await reflow.evaluate(e => e.parentNode?.removeChild(e));

  await page.getByRole('link', { name: 'Find a Play Idea', exact: true }).click();
  await page.getByLabel('Choose one toy photo').setInputFiles({ name: 'synthetic-fixture.jpg', mimeType: 'image/jpeg', buffer: readFileSync('tests/fixtures/teddy.jpg') });
  await expect(page.getByRole('img', { name: 'Your selected toy photo' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Parent navigation' }).getByRole('link', { name: 'Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Profile', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('navigation', { name: 'Parent navigation' })).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'Your selected toy photo' })).toHaveCount(0);
});
