import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',testMatch:'option-a.spec.ts',workers:1,use:{baseURL:'http://127.0.0.1:5178',headless:true,serviceWorkers:'block'}});
