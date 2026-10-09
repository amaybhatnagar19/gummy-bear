import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
test('parent picks one real toy photo and requests three ideas', async ({ page }) => {
  const proofDir = process.env.GUMMY_TEST_URL ? '.impeccable/review/live' : '.impeccable/review';
  mkdirSync(proofDir, { recursive: true });
  let actionResponse: any;
  page.on('websocket', socket => socket.on('framereceived', frame => {
    try { const message = JSON.parse(String(frame.payload)); if (message.type === 'ActionResponse') actionResponse = message; } catch {}
  }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Find play ideas', exact: true })).toBeDisabled();
  await expect(page.getByText('Old toys. New possibilities.')).toBeVisible();
  const inputs = page.locator('input[type=file]');
  await expect(inputs).toHaveCount(2);
  expect(await inputs.nth(0).getAttribute('multiple')).toBeNull();
  expect(await inputs.nth(1).getAttribute('multiple')).toBeNull();
  await expect(inputs.nth(0)).toHaveAttribute('capture', 'environment');
  await page.screenshot({ path: `${proofDir}/desktop.png`, fullPage: true });
  await inputs.nth(1).setInputFiles('tests/fixtures/teddy.jpg');
  const preview = page.getByRole('img', { name: 'Your selected toy photo' });
  await expect(preview).toBeVisible();
  const image = await preview.getAttribute('src');
  expect(image!.length).toBeLessThanOrEqual(350000);
  expect(await preview.evaluate((img: HTMLImageElement) => Math.max(img.naturalWidth, img.naturalHeight))).toBeLessThanOrEqual(768);
  await page.getByLabel('How old is your child?').selectOption('4');
  await page.getByRole('button', { name: 'Find play ideas', exact: true }).click();
  await expect.poll(() => actionResponse, { timeout: 75000 }).toBeTruthy();
  const body = { status: actionResponse.success ? 'success' : 'error', value: actionResponse.result, error: actionResponse.errorMessage, errorData: actionResponse.errorData };
  writeFileSync(`${proofDir}/convex-response.json`, JSON.stringify(body, null, 2));
  if (body.status === 'success') {
    expect(body.value.toys.length).toBeGreaterThan(0);
    expect(body.value.ideas).toHaveLength(3);
    for (const toy of body.value.toys) await expect(page.getByText(toy, { exact: true })).toBeVisible();
    for (const idea of body.value.ideas) await expect(page.getByRole('heading', { name: idea.title })).toBeVisible();
    writeFileSync(`${proofDir}/raw-ai-output.txt`, body.value.raw);
    console.log('FULL RAW AI OUTPUT:\n' + body.value.raw);
  } else {
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeEnabled();
    console.log('LIVE AI CHECK BLOCKED: ' + JSON.stringify(body));
    if (process.env.REQUIRE_LIVE_AI === '1') throw new Error('A live AI response was required but the action returned an error.');
  }
  await page.screenshot({ path: `${proofDir}/desktop-photo.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `${proofDir}/mobile.png`, fullPage: true });
});
