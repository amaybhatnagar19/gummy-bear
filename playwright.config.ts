import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/browser', timeout: 90000, use: { baseURL: process.env.GUMMY_TEST_URL || 'http://127.0.0.1:5173', headless: true }, workers: 1 });
