import { defineConfig } from '@playwright/test';
const url = process.env.GUMMY_TEST_URL || 'http://127.0.0.1:5175';
if (!['127.0.0.1', 'localhost'].includes(new URL(url).hostname)) throw new Error('Automated browser checks require an isolated local server.');
export default defineConfig({ testDir: './tests/browser', testMatch: ['**/d1.spec.ts', '**/app-shell.spec.ts', '**/environment.spec.ts', '**/v1-flow.spec.ts', '**/pwa.spec.ts', '**/family-ui.spec.ts', '**/privacy.spec.ts', '**/release.spec.ts'], timeout: 90000, use: { baseURL: url, headless: true }, workers: 1 });
