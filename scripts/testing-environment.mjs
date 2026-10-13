import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { testingBoundary } from '../shared/testingDeployment.js';

export function parseEnvironment(text) {
  const env = {};
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || Object.hasOwn(env, match[1])) throw new Error('Invalid or duplicate testing environment entry; values withheld.');
    env[match[1]] = match[2].trim();
  }
  return env;
}
export function validateTestingEnvironment(env) {
  if (testingBoundary.projectId === testingBoundary.originalProjectId || testingBoundary.deploymentType !== 'dev'
    || env.CONVEX_DEPLOYMENT !== `dev:${testingBoundary.deploymentName}`
    || env.CONVEX_URL !== testingBoundary.convexUrl || env.CONVEX_SITE_URL !== testingBoundary.siteUrl
    || !env.CONVEX_DEPLOY_KEY?.startsWith(`dev:${testingBoundary.deploymentName}|`)) {
    throw new Error('Testing boundary mismatch. No connection or remote write permitted; values withheld.');
  }
  if (Object.keys(env).some(name => !['CONVEX_DEPLOYMENT', 'CONVEX_URL', 'CONVEX_SITE_URL', 'CONVEX_DEPLOY_KEY'].includes(name))) {
    throw new Error('Unexpected testing environment entry; credentials and values withheld.');
  }
  return env;
}
export function readTestingEnvironment() {
  return validateTestingEnvironment(parseEnvironment(readFileSync(new URL('../.env.v1-testing', import.meta.url), 'utf8')));
}
export function testingProcessEnvironment(parent, env) {
  const clean = Object.fromEntries(Object.entries(parent).filter(([name]) => !/^(CONVEX_|VITE_|OPENAI_|AUTH_|JWT_|JWKS$|SITE_URL$)/.test(name)));
  return { ...clean, ...validateTestingEnvironment(env) };
}
export async function verifyRemoteTestingProject() {
  const env = readTestingEnvironment();
  const token = JSON.parse(readFileSync(`${homedir()}/.convex/config.json`, 'utf8')).accessToken;
  if (!token) throw new Error('Convex login required for project-boundary verification.');
  const response = await fetch(`https://api.convex.dev/v1/deployments/${testingBoundary.deploymentName}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Testing metadata verification failed (${response.status}); response withheld.`);
  const deployment = await response.json();
  if (deployment.projectId !== testingBoundary.projectId || (deployment.deploymentType ?? deployment.type) !== 'dev') throw new Error('Remote testing deployment mismatch; no operation permitted.');
  const projectResponse = await fetch(`https://api.convex.dev/v1/projects/${testingBoundary.projectId}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
  if (!projectResponse.ok) throw new Error(`Testing project verification failed (${projectResponse.status}); response withheld.`);
  const project = await projectResponse.json();
  if (project.id === testingBoundary.originalProjectId || project.teamId !== testingBoundary.teamId || project.slug !== testingBoundary.projectSlug) throw new Error('Remote testing project ownership mismatch.');
  return env;
}

export function validateTestingCommand(args) {
  if (args.length !== 1 || !['verify', 'push'].includes(args[0])) throw new Error('Use verify or push only; production operations and arbitrary flags are prohibited.');
  return args[0];
}

export async function prepareTestingWorkspace(env) {
  const { mkdirSync, symlinkSync, existsSync, copyFileSync, writeFileSync, chmodSync, lstatSync, unlinkSync, cpSync, rmSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  const root = resolve(new URL('..', import.meta.url).pathname);
  const workspace = resolve(root, '.convex-v1-testing');
  mkdirSync(workspace, { recursive: true, mode: 0o700 }); chmodSync(workspace, 0o700);
  if (!existsSync(resolve(workspace, 'node_modules'))) symlinkSync(resolve(root, 'node_modules'), resolve(workspace, 'node_modules'), 'dir');
  for (const name of ['convex', 'shared']) {
    const path = resolve(workspace, name);
    if (existsSync(path)) { if (lstatSync(path).isSymbolicLink()) unlinkSync(path); else rmSync(path, { recursive: true, force: true }); }
    cpSync(resolve(root, name), path, { recursive: true });
  }
  copyFileSync(resolve(root, 'package.json'), resolve(workspace, 'package.json'));
  writeFileSync(resolve(workspace, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', lib: ['ES2022', 'DOM'], module: 'ESNext', moduleResolution: 'Bundler', strict: true, skipLibCheck: true, noEmit: true, allowJs: true }, include: ['convex', 'shared'] }));
  const text = Object.entries(validateTestingEnvironment(env)).map(([name, value]) => `${name}=${value}`).join('\n') + '\n';
  for (const file of ['.env.local', '.env.v1-testing']) { writeFileSync(resolve(workspace, file), text, { mode: 0o600 }); chmodSync(resolve(workspace, file), 0o600); }
  return workspace;
}
