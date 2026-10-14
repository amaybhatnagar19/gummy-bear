import { test, expect } from '@playwright/test';
import { testingBoundary } from '../../shared/testingDeployment.js';
import { isolate } from './isolatedBackend';

test('local application selects only the verified testing deployment', async ({ page }) => {
  await isolate(page);
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Let’s see those toys' })).toBeVisible();
  // Vite's transformed entry confirms the selected URL; no secrets are read.
  const module = await page.request.get('/src/features/app/Application.tsx');
  expect(module.ok()).toBe(true);
  expect(await module.text()).toContain(testingBoundary.convexUrl);
});

test('isolated development does not serve collection QR files or environment credentials', async ({ page }) => {
  await isolate(page);
  for (const path of ['/payments/upi-qr.png', '/public/payments/upi-qr.png', '/%70ayments/upi-qr.png', `/@fs${process.cwd()}/public/payments/upi-qr.png`, '/.env.v1-testing','/assets/index-ARx4V7n1.js','/assets/index-CdxPm9Ml.css','/%61ssets/index-ARx4V7n1.js']) {
    const response = await page.request.get(path);
    expect(response.status()).toBe(403);
  }
});
