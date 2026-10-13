import { expect, test } from 'vitest';
import { testingBoundary as boundary } from '../../shared/testingDeployment.js';
import { parseEnvironment, validateTestingEnvironment, testingProcessEnvironment, validateTestingCommand } from '../../scripts/testing-environment.mjs';
import { mayConnectToBackend } from '../../src/features/app/navigation';
const synthetic = {
  CONVEX_DEPLOYMENT: `dev:${boundary.deploymentName}`, CONVEX_URL: boundary.convexUrl,
  CONVEX_SITE_URL: boundary.siteUrl, CONVEX_DEPLOY_KEY: `dev:${boundary.deploymentName}|synthetic-not-a-real-key`,
};
test('verified project is distinct and its backend is allowlisted', () => {
  expect(boundary.projectId).not.toBe(boundary.originalProjectId);
  expect(boundary.projectSlug).toBe('gummy-bear-v1-testing');
  expect(mayConnectToBackend(boundary.convexUrl, true)).toBe(true);
  expect(validateTestingEnvironment(synthetic)).toEqual(synthetic);
});
test.each([
  { CONVEX_DEPLOYMENT: 'prod:synthetic-other' }, { CONVEX_URL: 'https://unverified.convex.cloud' },
  { CONVEX_SITE_URL: 'https://unverified.convex.site' }, { CONVEX_DEPLOY_KEY: 'prod:synthetic-other|not-real' },
  { OPENAI_API_KEY: 'synthetic' },
])('mismatched or unapproved configuration is rejected without exposing its values: %j', replacement => {
  expect(() => validateTestingEnvironment({ ...synthetic, ...replacement })).toThrow(/mismatch|Unexpected/);
});
test('inherited deployment, frontend and provider overrides are stripped', () => {
  const child = testingProcessEnvironment({ PATH: '/synthetic/bin', CONVEX_DEPLOY_KEY: 'prod:other|synthetic', CONVEX_DEPLOYMENT: 'prod:other', OPENAI_API_KEY: 'synthetic', VITE_CONVEX_URL: 'https://unverified.convex.cloud', AUTH_GOOGLE_SECRET: 'synthetic' }, synthetic);
  expect(child.CONVEX_DEPLOY_KEY).toBe(synthetic.CONVEX_DEPLOY_KEY);
  expect(child.CONVEX_DEPLOYMENT).toBe(synthetic.CONVEX_DEPLOYMENT);
  expect(child.OPENAI_API_KEY).toBeUndefined(); expect(child.AUTH_GOOGLE_SECRET).toBeUndefined(); expect(child.VITE_CONVEX_URL).toBeUndefined();
  expect(child.PATH).toBe('/synthetic/bin');
});
test('duplicate or invalid environment entries cannot silently replace the boundary', () => {
  expect(() => parseEnvironment('CONVEX_URL=a\nCONVEX_URL=b')).toThrow('duplicate');
  expect(() => parseEnvironment('export CONVEX_URL=synthetic')).toThrow('Invalid');
});
test.each([['deploy'], ['run'], ['env'], ['push', '--prod'], ['dev', '--deployment', 'prod'], ['push', '--env-file', '.env.local']].map(args => ({ args })))('testing command refuses unsafe or overriding arguments: %j', ({ args }) => {
  expect(() => validateTestingCommand(args)).toThrow('prohibited');
});
