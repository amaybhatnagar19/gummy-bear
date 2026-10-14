import { readFile,readdir,rm,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { testingBoundary } from '../shared/testingDeployment.js';
const root=new URL('../dist-v1-testing/',import.meta.url);
// Option A's preserved client must never be served from a testing artifact.
for(const name of ['index-ARx4V7n1.js','index-CdxPm9Ml.css'])await rm(new URL(`assets/${name}`,root),{force:true});
const assets=await readdir(new URL('assets/',root));
const code=(await Promise.all(assets.filter(name=>name.endsWith('.js')).map(name=>readFile(new URL(`assets/${name}`,root),'utf8')))).join('\n');
// The installed Convex SDK embeds this exact example inside its argument error.
// Remove that error-message sentence only; do not allow it as a connection.
const connections=code.replaceAll("ConvexReactClient requires a URL like 'https://happy-otter-123.convex.cloud'",'ConvexReactClient requires a URL');
const endpoints=[...connections.matchAll(/https:\/\/[a-z0-9-]+\.convex\.cloud/g)].map(match=>match[0]);
// Application guard may contain the reserved offline address; every real deployment must be testing.
if(!endpoints.includes(testingBoundary.convexUrl)||endpoints.some(url=>url!==testingBoundary.convexUrl))throw new Error('Testing build contains an unapproved backend. It must not be served.');
await rm(new URL('payments/',root),{recursive:true,force:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
const scripts=Object.fromEntries(await Promise.all(assets.filter(name=>name.endsWith('.js')).map(async name=>[name,hash(await readFile(new URL(`assets/${name}`,root)))])));
await writeFile(new URL('.testing-build-boundary.json',root),JSON.stringify({backend:testingBoundary.convexUrl,htmlHash:hash(await readFile(new URL('index.html',root))),scripts}));
console.log('Testing build verified; payment assets removed from this isolated artifact.');
