import type { Page } from '@playwright/test';
import { testingBoundary } from '../../shared/testingDeployment.js';

export const testingBackendURL = process.env.GUMMY_TEST_BACKEND_URL || testingBoundary.convexUrl;
if (![testingBoundary.convexUrl, 'https://d1-isolated.invalid'].includes(testingBackendURL)) throw new Error('Browser tests refuse an unverified backend.');
export const testingStorageNamespace = testingBackendURL.replace(/[^a-zA-Z0-9]/g, '');
const expectedHost = new URL(testingBackendURL).hostname;

// Synthetic protocol replies only. This helper never connects to a remote server.
export async function isolate(page: Page, account: 'guest' | 'paid' | 'payment' = 'guest') {
  const calls: string[] = [];
  const token = `${Buffer.from('{"alg":"RS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: 'synthetic-d1-session', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url')}.synthetic`;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue();
    if (url.hostname !== expectedHost) {
      await route.abort();
      if (url.hostname.endsWith('.convex.cloud') || url.hostname.endsWith('.convex.site')) throw new Error('Browser attempted an unapproved Convex backend; request blocked.');
      return;
    }
    // Serve synthetic refresh responses only; never connect to a backend.
    if (url.pathname === '/api/action' && account !== 'guest') {
      const body = route.request().postDataJSON();
      calls.push(body.path);
      if (body.path === 'auth:signIn') return route.fulfill({ json: { status: 'success', value: { tokens: { token, refreshToken: 'synthetic-d1-refresh' } } } });
    }
    return route.abort();
  });
  if (account !== 'guest') {
    await page.addInitScript(({ token, namespace }) => {
      // Match the real provider's URL namespace, without reading a real token.
      const key = namespace;
      if (!sessionStorage.getItem('d1-seeded')) {
        localStorage.setItem(`__convexAuthJWT_${key}`, token);
        localStorage.setItem(`__convexAuthRefreshToken_${key}`, 'synthetic-d1-refresh');
        sessionStorage.setItem('d1-seeded', 'yes');
      }
    }, { token, namespace: testingStorageNamespace });
  }
  await page.routeWebSocket(/.*/, socket => {
    const url = new URL(socket.url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) { socket.connectToServer(); return; }
    if (url.hostname !== expectedHost) { socket.close(); throw new Error('Unapproved backend socket blocked.'); }
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

