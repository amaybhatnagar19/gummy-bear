import { expect, test } from 'vitest';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import dgram from 'node:dgram';
import dns, { lookup } from 'node:dns';
import { assertNoUnexpectedNetwork, expectNetworkBlocked, mockProviderOnce } from '../setup/no-network';

test('fetch is protected before application modules are dynamically imported', async () => {
  expect(process.env.OPENAI_API_KEY).toBeUndefined();
  expect(Object.getOwnPropertyDescriptor(globalThis, 'fetch')?.configurable).toBe(false);
  await import('../../convex/play');
  await expectNetworkBlocked(() => fetch('https://unexpected.invalid/'));
});

test('a caught fetch error is still detected by the after-test assertion', async () => {
  await expectNetworkBlocked(async () => {
    await fetch('https://unexpected.invalid/').catch(() => {});
    assertNoUnexpectedNetwork();
  });
});

test.each([
  ['HTTP', () => http.get('http://unexpected.invalid/')],
  ['HTTPS', () => https.request('https://unexpected.invalid/')],
  ['TCP helper', () => net.connect({ host: 'unexpected.invalid', port: 443 })],
  ['TCP socket', () => new net.Socket().connect(443, 'unexpected.invalid')],
  ['TLS', () => tls.connect({ host: 'unexpected.invalid', port: 443 })],
  ['DNS callback', () => dns.lookup('unexpected.invalid', () => {})],
  ['DNS named import', () => lookup('unexpected.invalid', () => {})],
  ['DNS promise', () => dns.promises.resolve4('unexpected.invalid')],
  ['DNS resolver', () => new dns.Resolver().resolveMx('unexpected.invalid', () => {})],
  ['DNS promise resolver', () => new dns.promises.Resolver().resolveTxt('unexpected.invalid')],
])('%s is blocked before any connection or lookup', async (_name, operation) => {
  await expectNetworkBlocked(operation);
});

test('UDP send is blocked before any packet is sent', async () => {
  const socket = dgram.createSocket('udp4');
  try { await expectNetworkBlocked(() => socket.send('synthetic', 9, '127.0.0.1')); }
  finally { socket.close(); }
});

const request = {
  method: 'POST',
  headers: { authorization: 'Bearer synthetic-test-key', 'content-type': 'application/json' },
  body: JSON.stringify({ synthetic: true }),
  signal: new AbortController().signal,
};

test('a provider mock is single-use and permits no other destination', async () => {
  mockProviderOnce(body => {
    expect(body).toEqual({ synthetic: true });
    return Response.json({ synthetic: 'reply' });
  });
  await expectNetworkBlocked(() => fetch('https://unexpected.invalid/', request));
  expect(await (await fetch('https://api.openai.com/v1/responses', request)).json())
    .toEqual({ synthetic: 'reply' });
  await expectNetworkBlocked(() => fetch('https://api.openai.com/v1/responses', request));
});

test('wrong method or non-synthetic authorization cannot use a provider mock', async () => {
  mockProviderOnce(() => Response.json({ synthetic: true }));
  await expectNetworkBlocked(() => fetch('https://api.openai.com/v1/responses', { ...request, method: 'GET' }));
  await expectNetworkBlocked(() => fetch('https://api.openai.com/v1/responses', { ...request, headers: {} }));
});

test('installing a mock does not replace the protected fetch function', () => {
  const guard = fetch;
  mockProviderOnce(() => Response.json({ synthetic: true }));
  process.env.OPENAI_API_KEY = 'synthetic-test-key';
  expect(fetch).toBe(guard);
});
test('counting mocks permit only the exact single-use endpoint and retain fetch/socket protection', async () => {
  mockProviderOnce(() => Response.json({ object: 'response.input_tokens', input_tokens: 123 }), 'input_tokens');
  await expectNetworkBlocked(() => fetch('https://api.openai.com/v1/responses', request));
  expect((await (await fetch('https://api.openai.com/v1/responses/input_tokens', request)).json()).input_tokens).toBe(123);
  await expectNetworkBlocked(() => fetch('https://api.openai.com/v1/responses/input_tokens', request));
  await expectNetworkBlocked(() => new net.Socket().connect(443, 'unexpected.invalid'));
});

test('unused mocks and synthetic keys do not survive into the next test', async () => {
  expect(process.env.OPENAI_API_KEY).toBeUndefined();
  await expectNetworkBlocked(() => fetch('https://api.openai.com/v1/responses', request));
});

test('the guard cannot be replaced by an unrestricted fetch mock', async () => {
  await expectNetworkBlocked(() => { globalThis.fetch = async () => Response.json({}); });
});

