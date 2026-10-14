import { expect, test } from '@playwright/test';
import { isolate } from './isolatedBackend';
test('privacy copy is honest and collection remains disabled without policy approval', async ({ page }, info) => {
  await isolate(page, 'paid'); await page.goto('/app/profile');
  await expect(page.getByRole('button', { name: 'Acknowledge privacy information' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Add child', exact: true })).toBeDisabled();
  await expect(page.getByText('Birth date (optional)', { exact: true })).toBeVisible();
  await page.getByText('Third-party processing and retention', { exact: true }).click();
  await expect(page.getByText(/we cannot promise they retain no data/)).toBeVisible();
  await expect(page.getByText(/Paid AI remains disabled/)).toBeVisible();
  for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.evaluate(() => scrollTo({top:0,behavior:'instant'})); await page.screenshot({ path: info.outputPath(`privacy-${width}.png`), fullPage: true }); }
});
test('account request requires explicit confirmation, reports failure honestly and remains pending after family removal', async ({ page }) => {
  const family = { policyOpen: true, children: [], toys: [], activities: [], preferences: null };
  const calls = await isolate(page, 'paid', false, family, true);
  await page.goto('/app/profile');
  await page.locator('summary').filter({ hasText: /^Request account deletion$/ }).click();
  const button = page.getByRole('button', { name: 'Request account deletion', exact: true });
  await expect(button).toBeDisabled(); await page.getByLabel('Type DELETE ACCOUNT', { exact: true }).fill('DELETE ACCOUNT'); await expect(button).toBeDisabled();
  await page.getByLabel('I understand family removal is permanent').check(); await button.click();
  await expect(page.getByText(/This step did not complete/)).toBeVisible();
  await expect(page.getByText(/Family information removed\. Account deletion is pending:/)).toHaveCount(0);
  await button.click(); await expect(page.getByText(/Family information removed\. Account deletion is pending:/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add child', exact: true })).toBeDisabled();
  await expect(button).toBeDisabled(); await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
  expect(calls.filter(name => name === 'privacy:requestAccountDeletion')).toHaveLength(2);
  expect(calls).not.toContain('auth:signOut');
});
