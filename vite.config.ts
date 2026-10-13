import { defineConfig, loadEnv } from 'vite';
import { readTestingEnvironment } from './scripts/testing-environment.mjs';
import { testingBoundary } from './shared/testingDeployment.js';
export default defineConfig(({ mode }) => {
  const development = mode === 'development';
  if (development && Object.keys(process.env).some(name => name.startsWith('VITE_') && name !== 'VITE_CONVEX_URL')) throw new Error('Unapproved frontend environment override; values withheld.');
  const env = development ? readTestingEnvironment() : loadEnv(mode, process.cwd(), '');
  const requested = process.env.VITE_CONVEX_URL;
  if (development && requested && ![testingBoundary.convexUrl, 'https://d1-isolated.invalid'].includes(requested)) throw new Error('Local development refuses an unverified backend URL.');
  const url = development ? requested || testingBoundary.convexUrl : process.env.VITE_CONVEX_URL || env.VITE_CONVEX_URL || env.CONVEX_URL;
  return {
    envDir: development ? false : undefined,
    define: { 'import.meta.env.VITE_CONVEX_URL': JSON.stringify(url) },
    server: { host: '127.0.0.1', port: 5175, strictPort: true },
    plugins: development ? [{ name: 'testing-payment-asset-boundary', configureServer(server) {
      // Never expose the original collection QR from the isolated local server.
      server.middlewares.use((req, res, next) => {
        let path = req.url || '';
        try { path = decodeURIComponent(decodeURIComponent(path)); } catch { res.statusCode = 400; res.end(); return; }
        if (/(?:^|\/)payments(?:\/|\?|$)/.test(path)) { res.statusCode = 403; res.end('Payment collection is unavailable in isolated testing.'); return; }
        next();
      });
    } }] : [],
  };
});
