import { afterEach, beforeEach } from 'vitest';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import dgram from 'node:dgram';
import dns from 'node:dns';
import { syncBuiltinESMExports } from 'node:module';

// Setup files execute before test files (and their application imports).
// These are worker-local patches, not an operating-system network sandbox.
class NetworkBlockedError extends Error {
  constructor(channel: string) {
    // Never include URLs, headers, credentials or payloads in guard errors.
    super(`Unexpected outbound network request blocked: ${channel}`);
  }
}

const violations: NetworkBlockedError[] = [];
type ProviderReply = (body: Record<string, unknown>, signal: AbortSignal) => Response | Promise<Response>;
let providerReply: ProviderReply | undefined;
let providerEndpoint: 'responses' | 'input_tokens' = 'responses';

function blocked(channel: string): never {
  const error = new NetworkBlockedError(channel);
  violations.push(error);
  throw error;
}

function lockMethod(target: object, name: string, channel: string) {
  Object.defineProperty(target, name, {
    value: () => blocked(channel), writable: false, configurable: false,
  });
}

// Block before DNS resolution, socket creation or sending a request. Patching
// the socket prototype also catches libraries that bypass http/https helpers.
for (const [target, methods, channel] of [
  [http, ['request', 'get'], 'http'],
  [https, ['request', 'get'], 'https'],
  [net, ['connect', 'createConnection'], 'net'],
  [net.Socket.prototype, ['connect'], 'socket'],
  [tls, ['connect'], 'tls'],
  [dgram.Socket.prototype, ['connect', 'send'], 'udp'],
] as const) {
  for (const method of methods) lockMethod(target, method, channel);
}
for (const target of [dns, dns.promises, dns.Resolver.prototype, dns.promises.Resolver.prototype]) {
  for (const method of Object.getOwnPropertyNames(target)) {
    if (/^resolve|^(lookup|lookupService|reverse)$/.test(method)
      && typeof (target as Record<string, unknown>)[method] === 'function') {
      lockMethod(target, method, 'dns');
    }
  }
}
// Named node: imports must see the same patched functions as default imports.
syncBuiltinESMExports();

const guardedFetch: typeof fetch = async (input, init) => {
  // There is no passthrough to the original fetch, under any circumstances.
  const allowed = providerEndpoint === 'responses' ? 'https://api.openai.com/v1/responses' : 'https://api.openai.com/v1/responses/input_tokens';
  if (input !== allowed || init?.method !== 'POST'
    || new Headers(init.headers).get('authorization') !== 'Bearer synthetic-test-key'
    || new Headers(init.headers).get('content-type') !== 'application/json'
    || typeof init.body !== 'string' || !init.signal || !providerReply) {
    return blocked('fetch');
  }
  let body: Record<string, unknown>;
  try { body = JSON.parse(init.body); } catch { return blocked('fetch'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return blocked('fetch');
  const reply = providerReply;
  providerReply = undefined; // Every mock permits exactly one request.
  return reply(body, init.signal);
};

Object.defineProperty(globalThis, 'fetch', {
  get: () => guardedFetch,
  set: () => blocked('fetch replacement'),
  configurable: false,
});

export function mockProviderOnce(reply: ProviderReply, endpoint: 'responses' | 'input_tokens' = 'responses') {
  if (providerReply) throw new Error('A synthetic provider reply is already installed.');
  providerReply = reply;
  providerEndpoint = endpoint;
}

export function assertNoUnexpectedNetwork() {
  // Application code can catch a blocked request. The test must still fail.
  if (violations.length) throw violations[0];
}

// Only guard self-tests may acknowledge an intentionally blocked request.
// Clearing happens after checking the exact recorded error identity.
export async function expectNetworkBlocked(operation: () => unknown | Promise<unknown>) {
  const first = violations.length;
  let caught: unknown;
  try { await operation(); } catch (error) { caught = error; }
  if (!(caught instanceof NetworkBlockedError) || violations.length !== first + 1
    || violations[first] !== caught) {
    throw new Error('Expected exactly one request blocked by the network guard.');
  }
  violations.splice(first, 1);
}

function resetTestState() {
  providerReply = undefined;
  providerEndpoint = 'responses';
  // Do not read a real key. Only change the environment of this test worker.
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_TESTING_API_KEY;
}

resetTestState();
beforeEach(resetTestState);
afterEach(() => {
  try { assertNoUnexpectedNetwork(); }
  finally { resetTestState(); }
});
