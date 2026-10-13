import { expect, test } from 'vitest';
import { appRoute, isAppPath, mayConnectToBackend } from '../../src/features/app/navigation';

test('app entry aliases and trailing slashes resolve to the same destinations', () => {
  expect(appRoute('/app')).toBe('start');
  expect(appRoute('/app/start/')).toBe('start');
  expect(appRoute('/app/toys/')).toBe('toys');
  expect(appRoute('/app/profile')).toBe('profile');
});
test.each(['https://example.invalid/app/home', '//example.invalid/app/home', '/', '/app/../', '/app/../../', '/app/not-ready', '/application/home'])('navigation does not intercept external, public or invalid paths: %s', path => {
  expect(isAppPath(path)).toBe(false);
});
test('account pages have explicit URL routes without changing the existing providers', () => {
  expect(appRoute('/app/sign-in')).toBe('sign-in');
  expect(appRoute('/app/sign-up')).toBe('sign-up');
  expect(appRoute('/app/payment')).toBe('payment');
  expect(isAppPath('/app/home')).toBe(true);
});

test('local development cannot use an unverified backend or malformed connection', () => {
  expect(mayConnectToBackend(undefined, true)).toBe(false);
  expect(mayConnectToBackend('https://unverified-project.convex.cloud', true)).toBe(false);
  expect(mayConnectToBackend('https://d1-isolated.invalid', true)).toBe(true);
  expect(mayConnectToBackend('javascript:alert(1)', false)).toBe(false);
  expect(mayConnectToBackend('not-a-url', false)).toBe(false);
  expect(mayConnectToBackend('https://synthetic-project.convex.cloud', false)).toBe(true);
});
