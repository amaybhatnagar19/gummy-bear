// Synthetic-only remote smoke test. Never accepts an arbitrary deployment.
import { writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { verifyRemoteTestingProject, prepareTestingWorkspace, testingProcessEnvironment } from './testing-environment.mjs';
const env=await verifyRemoteTestingProject();
const workspace=await prepareTestingWorkspace(env);
const fixture=`${workspace}/convex/complimentarySmoke.ts`;
writeFileSync(fixture,`import {internalMutation} from './_generated/server';import {v} from 'convex/values';
export const seed=internalMutation({args:{email:v.string()},returns:v.id('users'),handler:async(ctx,a)=>ctx.db.insert('users',{email:a.email})});
export const clean=internalMutation({args:{userId:v.id('users')},returns:v.null(),handler:async(ctx,a)=>{const rows=await ctx.db.query('complimentaryGrants').withIndex('by_user',q=>q.eq('userId',a.userId)).take(10);for(const r of rows)await ctx.db.delete(r._id);await ctx.db.delete(a.userId);return null;}});`);
function push(){try{execFileSync('./node_modules/.bin/convex',['dev','--env-file','.env.v1-testing','--tail-logs','disable','--once'],{cwd:workspace,env:testingProcessEnvironment(process.env,env),stdio:'pipe'});}catch{throw Error('Isolated testing push failed; raw output withheld.');}}
const client=new ConvexHttpClient(env.CONVEX_URL);client.setAdminAuth(env.CONVEX_DEPLOY_KEY);
const ref=name=>makeFunctionReference(name);
const email=`complimentary-smoke-${randomUUID()}@example.invalid`;
let id;
try {
 push();
 id=await client.mutation(ref('complimentarySmoke:seed'),{email});
 const before=await client.query(ref('complimentary:check'),{email});assert.equal(before.active,false);
 const grantId=await client.mutation(ref('complimentary:grant'),{email,expectedUser:id,expectedPaidUntil:null,expectedPaidFrom:null,newPaidUntil:Date.now()+86400000,reason:'Synthetic remote verification',administrator:'isolated smoke test',operationId:randomUUID()});
 assert.equal((await client.query(ref('complimentary:check'),{email})).active,true);
 for(const [kind,path,args] of [['query','check',{email}],['mutation','grant',{email}],['mutation','revoke',{email,grantId}]]) {
  const response=await fetch(`${env.CONVEX_URL}/api/${kind}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:`complimentary:${path}`,args,format:'json'})});
  const body=await response.json();assert.equal(body.status,'error');assert.match(body.errorMessage,/public|internal/i);
 }
 await client.mutation(ref('complimentary:revoke'),{email,grantId,administrator:'isolated smoke test'});
 assert.equal((await client.query(ref('complimentary:check'),{email})).paidUntil,null);
 console.log('PASS: isolated synthetic grant, access, audit preview, revocation; three anonymous administrative calls rejected.');
} finally {
 if(id) await client.mutation(ref('complimentarySmoke:clean'),{userId:id});
 unlinkSync(fixture);push();
 console.log('Synthetic records and temporary test functions removed; administrator functions remain in testing only.');
}
