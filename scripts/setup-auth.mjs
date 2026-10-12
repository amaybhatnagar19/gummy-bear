import { generateKeyPair, exportPKCS8, exportJWK } from 'jose';
import { spawnSync } from 'node:child_process';
const deployment = process.argv.includes('--prod') ? ['--prod'] : [];
const existing = spawnSync('npx', ['convex', 'env', 'list', ...deployment], { encoding: 'utf8' });
if (existing.status !== 0) throw new Error('Could not check existing auth configuration.');
const names = new Set(existing.stdout.split('\n').map(line => line.split('=')[0]));
if (names.has('JWT_PRIVATE_KEY') !== names.has('JWKS')) throw new Error('Only one auth key is configured. Check Convex before replacing keys.');
if (!names.has('JWT_PRIVATE_KEY')) {
  const pair = await generateKeyPair('RS256', { extractable: true });
  const values = { JWT_PRIVATE_KEY: (await exportPKCS8(pair.privateKey)).trimEnd().replace(/\n/g, ' '), JWKS: JSON.stringify({ keys: [{ use: 'sig', ...await exportJWK(pair.publicKey) }] }) };
  for (const [name, value] of Object.entries(values)) {
    const result = spawnSync('npx', ['convex', 'env', 'set', `${name}=${value}`, ...deployment], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`Could not set ${name}.`);
    console.log(`Configured ${name} (value hidden).`);
  }
} else console.log('Existing auth keys preserved.');
