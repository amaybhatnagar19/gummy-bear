import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Run only this file. Other browser specs call live AI and mutate account data.
const testUrl = process.env.GUMMY_TEST_URL || 'http://127.0.0.1:5173';
if (!['127.0.0.1', 'localhost'].includes(new URL(testUrl).hostname)) throw new Error('D1 checks require localhost.');
const fixture = readFileSync('tests/fixtures/teddy.jpg');

async function isolate(page: Page, account: 'guest' | 'paid' | 'payment' = 'guest') {
  const calls: string[] = [];
  const token = `${Buffer.from('{"alg":"RS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: 'synthetic-d1-session', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url')}.synthetic`;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue();
    // Serve synthetic refresh responses only; never connect to a backend.
    if (url.pathname === '/api/action' && account !== 'guest') {
      const body = route.request().postDataJSON();
      calls.push(body.path);
      if (body.path === 'auth:signIn') return route.fulfill({ json: { status: 'success', value: { tokens: { token, refreshToken: 'synthetic-d1-refresh' } } } });
    }
    return route.abort();
  });
  if (account !== 'guest') {
    await page.addInitScript(({ token }) => {
      // Match the real provider's URL namespace, without reading a real token.
      const key = 'httpsd1isolatedinvalid';
      if (!sessionStorage.getItem('d1-seeded')) {
        localStorage.setItem(`__convexAuthJWT_${key}`, token);
        localStorage.setItem(`__convexAuthRefreshToken_${key}`, 'synthetic-d1-refresh');
        sessionStorage.setItem('d1-seeded', 'yes');
      }
    }, { token });
  }
  await page.routeWebSocket(/.*/, socket => {
    const url = new URL(socket.url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) { socket.connectToServer(); return; }
    // Exercise the unchanged real Convex/Auth client against a local simulation.
    let version = { querySet: 0, identity: 0, ts: 'AAAAAAAAAAA=' };
    let clock = 0;
    const transition = (patch: Partial<typeof version>, modifications: unknown[] = []) => {
      const startVersion = { ...version };
      const bytes = Buffer.alloc(8); bytes.writeBigUInt64LE(BigInt(++clock));
      version = { ...version, ...patch, ts: bytes.toString('base64') };
      socket.send(JSON.stringify({ type: 'Transition', startVersion, endVersion: version, modifications }));
    };
    socket.onMessage(raw => {
      const message = JSON.parse(String(raw));
      if (message.type === 'Authenticate') transition({ identity: message.baseVersion + 1 });
      if (message.type === 'ModifyQuerySet') {
        transition({ querySet: message.newVersion }, message.modifications.map((mod: { type: string; queryId: number; udfPath?: string }) => {
          if (mod.type === 'Remove') return { type: 'QueryRemoved', queryId: mod.queryId };
          if (mod.udfPath !== 'access:status') throw new Error(`Unexpected D1 query: ${mod.udfPath}`);
          return { type: 'QueryUpdated', queryId: mod.queryId, value: { state: account === 'guest' ? 'trial' : account, uses: 0, canClaimBonus: false, paidUntil: account === 'paid' ? Date.now() + 86400000 : null }, logLines: [], journal: null };
        }));
      }
      if (message.type === 'Mutation') {
        calls.push(message.udfPath);
        if (message.udfPath !== 'analytics:identifyVisitor') throw new Error(`Unexpected D1 mutation: ${message.udfPath}`);
        socket.send(JSON.stringify({ type: 'MutationResponse', requestId: message.requestId, success: true, result: null, ts: version.ts, logLines: [] }));
      }
      if (message.type === 'Action') {
        calls.push(message.udfPath);
        if (message.udfPath !== 'auth:signOut') throw new Error(`D1 must not call AI or create accounts: ${message.udfPath}`);
        socket.send(JSON.stringify({ type: 'ActionResponse', requestId: message.requestId, success: true, result: null, logLines: [] }));
      }
    });
  });
  return calls;
}

test('public page and existing app survive direct navigation, refresh and Back', async ({ page }) => {
  const calls = await isolate(page);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('already at home');
  await expect(page.getByText('Illustrative preview — planned experience')).toBeVisible();
  const ctas = page.getByRole('link', { name: 'Get Started', exact: true });
  await expect(ctas).toHaveCount(3);
  for (const cta of await ctas.all()) await expect(cta).toHaveAttribute('href', '/app');
  expect(calls).toEqual([]);
  await ctas.first().click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Let’s see those toys' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel('How old is your child?')).toHaveValue('4');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('already at home');
  // Even browsers restoring from history must not mix app CSS into the landing.
  await expect(page.locator('.gb-landing')).toHaveCSS('background-color', 'rgb(250, 248, 245)');
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Let’s see those toys' })).toBeVisible();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to my toys' }).click();
  await page.getByLabel('Choose one toy photo').setInputFiles({ name: 'synthetic-fixture.jpg', mimeType: 'image/jpeg', buffer: fixture });
  await expect(page.getByRole('img', { name: 'Your selected toy photo' })).toBeVisible();
  await page.getByLabel('How old is your child?').selectOption('3');
  await expect(page.getByRole('button', { name: 'Find play ideas', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Take one toy photo')).toHaveAttribute('capture', 'environment');
  await page.goto('/app/');
  await expect(page.getByRole('heading', { name: 'Let’s see those toys' })).toBeVisible();
  await page.goto('/missing-page');
  await expect(page.getByRole('link', { name: 'open the app' })).toHaveAttribute('href', '/app');
  expect(errors).toEqual([]);
  expect(calls).toEqual([]);
});

test('landing is readable, keyboard accessible and responsive at all approved widths', async ({ page }, testInfo) => {
  await isolate(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.locator('#main-content').evaluate(element => (element as HTMLElement).blur());
  const headings = ['From familiar toys to fresh ideas.', 'A small idea. A whole new story.', 'More play. Less guesswork.', 'Give a familiar toy a fresh role.', 'Your choices matter.', 'A few things you might be wondering.', 'Ready for a new play idea?'];
  for (const heading of headings) await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const cta of await page.getByRole('link', { name: 'Get Started', exact: true }).all()) {
      const bounds = await cta.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44); expect(bounds!.width).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: testInfo.outputPath(`landing-${width}.png`), fullPage: true });
  }
  const summary = page.getByText('What can I try today?', { exact: true });
  await summary.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  expect(await summary.evaluate(e => getComputedStyle(e).outlineStyle)).toBe('solid');
  // 200% text enlargement: retain reflow instead of clipping fixed-height text.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: '.gb-landing p, .gb-landing summary, .gb-landing a, .gb-landing dd { font-size: 200% !important; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('synthetic signed-in sessions retain controls and payment paths without live changes', async ({ page }) => {
  const calls = await isolate(page, 'payment');
  await page.goto('/app');
  await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem('__convexAuthJWT_httpsd1isolatedinvalid'));
  await page.getByRole('link', { name: 'Gummy Bear', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem('__convexAuthJWT_httpsd1isolatedinvalid'))).toBe(before);
  await page.getByRole('link', { name: 'Get Started', exact: true }).first().click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
  const paymentImage: string[] = [];
  page.on('request', r => { if (new URL(r.url()).pathname.startsWith('/payments/')) paymentImage.push(new URL(r.url()).pathname); });
  await page.getByRole('button', { name: 'Payment', exact: true }).click();
  await expect(page.getByText('₹99 a month')).toBeVisible();
  await expect.poll(() => paymentImage).toContain('/payments/upi-qr.png');
  await page.getByRole('button', { name: 'Back to my toys' }).click();
  await expect(page.getByRole('heading', { name: 'Let’s see those toys' })).toBeVisible();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
  expect(calls.every(call => ['analytics:identifyVisitor', 'auth:signIn', 'auth:signOut'].includes(call))).toBe(true);
});

test('D1.1 assets, compact header and text contrast work without external requests', async ({ page }) => {
  await isolate(page);
  const external: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) external.push(url.href);
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 16px "Plus Jakarta Sans"'))).toBe(true);
  for (const img of await page.locator('.gb-landing img').all()) {
    await expect.poll(() => img.evaluate(e => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
  }
  await expect(page.getByRole('img', { name: /Real photograph/ })).toBeVisible();
  await expect(page.getByText('Example confirmation', { exact: false })).toBeVisible();
  await expect(page.getByText('Planned step', { exact: true })).toBeVisible();
  await expect(page.getByText('Adult joins in', { exact: true })).toBeVisible();
  await expect(page.getByText('One intact teddy', { exact: true })).toBeVisible();
  await expect(page.locator('.gb-mascot')).toHaveAttribute('alt', '');
  for (const width of [320, 375, 390, 540]) {
    await page.setViewportSize({ width, height: 844 });
    const brand = await page.locator('.gb-header .gb-logo').boundingBox();
    const cta = await page.locator('.gb-header .gb-button').boundingBox();
    expect(Math.abs(brand!.y + brand!.height / 2 - cta!.y - cta!.height / 2)).toBeLessThan(2);
    expect(await page.locator('.gb-header').evaluate(e => e.getBoundingClientRect().height)).toBeLessThan(90);
  }
  // All three preview stages fit together in common desktop viewports.
  for (const [width, height] of [[1280, 720], [1366, 768], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo(0, 0));
    for (const stage of await page.locator('.gb-demo-steps > li').all()) {
      const bounds = await stage.boundingBox();
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
    }
    const activitySize = await page.locator('.gb-demo-activity h3').evaluate(e => parseFloat(getComputedStyle(e).fontSize));
    const recognitionSize = await page.locator('.gb-demo-confirm strong').evaluate(e => parseFloat(getComputedStyle(e).fontSize));
    expect(activitySize).toBeGreaterThan(recognitionSize);
  }
  const failures = await page.locator('.gb-landing').evaluate(root => {
    const rgb = (value: string) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const luminance = (c: number[]) => c.map(v => { const n = v / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
    const failures: string[] = [];
    for (const element of root.querySelectorAll('*')) {
      if (!Array.from(element.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())) continue;
      const style = getComputedStyle(element);
      if (!element.getBoundingClientRect().width || style.visibility !== 'visible') continue;
      let parent: Element | null = element; let background = 'rgb(250, 248, 245)';
      while (parent) { const b = getComputedStyle(parent).backgroundColor; if (b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') { background = b; break; } parent = parent.parentElement; }
      const a = luminance(rgb(style.color)), b = luminance(rgb(background));
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5)) failures.push(`${element.textContent?.trim().slice(0, 45)}: ${ratio.toFixed(2)}`);
    }
    return failures;
  });
  expect(failures).toEqual([]);
  for (const href of ['/brand/gummy-bear-mark.svg', '/favicon-32.png']) {
    const response = await page.request.get(href);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toMatch(/image\//);
  }
  expect(external).toEqual([]);
});
