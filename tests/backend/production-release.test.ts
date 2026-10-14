import { afterEach, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { api, internal } from '../../convex/_generated/api';
import schema from '../../convex/schema';
import { testingBoundary } from '../../shared/testingDeployment.js';
const modules=import.meta.glob('../../convex/**/*.ts');
afterEach(()=>vi.unstubAllEnvs());
function production(){vi.stubEnv('CONVEX_CLOUD_URL','https://sensible-avocet-370.convex.cloud');vi.stubEnv('OPENAI_API_KEY','synthetic-test-key');vi.stubEnv('V1_DATA_POLICY_APPROVED','true');vi.stubEnv('V1_PAID_AI_APPROVED','true');vi.stubEnv('V1_GOOGLE_AUTH_APPROVED','true');vi.stubEnv('V1_DATA_POLICY_VERSION','v1-privacy-2026-10-14');}
test('production rejects legacy AI before touching trials, quota or analytics, even with a provider key',async()=>{
 production();const t=convexTest(schema,modules);await expect(t.action(api.play.discover,{image:'data:image/jpeg;base64,YQ==',age:4,visitorToken:'12345678-1234-1234-1234-123456789abc'})).rejects.toThrow('paused');
 for(const table of ['visitors','accessReservations','aiQuota','photoRuns'] as const)expect(await t.run(ctx=>ctx.db.query(table).take(1))).toEqual([]);
});
test('direct internal generation is also closed on production and missing/unknown targets',async()=>{
 for(const url of ['https://sensible-avocet-370.convex.cloud','https://synthetic-other.convex.cloud','']){production();vi.stubEnv('CONVEX_CLOUD_URL',url);const t=convexTest(schema,modules);await expect(t.action(internal.play.generate,{image:'data:image/jpeg;base64,YQ==',age:4})).rejects.toThrow('paused');expect(await t.run(ctx=>ctx.db.query('aiQuota').take(1))).toEqual([]);}
});
test('production capabilities explicitly close every new feature and retain legacy payment presentation',async()=>{
 production();const t=convexTest(schema,modules);expect(await t.query(api.v1Capabilities.status,{})).toMatchObject({isolatedTesting:false,personalData:false,liveAIReady:false,recognition:false,activityGeneration:false,familyProfiles:false,toyInventory:false,activityHistory:false,google:false,emailOtp:false,emailReminders:false,testingAccess:false,paymentPresentation:'legacy'});
});
test('testing-only family, invitation and evaluation approval cannot open production',async()=>{
 production();vi.stubEnv('V1_SYNTHETIC_EVALUATION_APPROVED','true');const t=convexTest(schema,modules);await expect(t.mutation(internal.testingAccess.invite,{evaluation:true})).rejects.toThrow('isolated');await expect(t.mutation(internal.testingAccess.invite,{})).rejects.toThrow('paused');await expect(t.mutation(api.family.saveChild,{label:'synthetic child',age:4})).rejects.toThrow('paused');expect(await t.run(ctx=>ctx.db.query('children').take(1))).toEqual([]);
});
test('failed gated generation preserves paid identity, entitlements and unused bonus',async()=>{
 production();const t=convexTest(schema,modules);const values={email:'synthetic@example.invalid',paidFrom:1,paidUntil:Date.now()+86400000,bonusGranted:true,bonusUsed:false};const id=await t.run(ctx=>ctx.db.insert('users',values));const signed=t.withIdentity({subject:id+'|synthetic-session'});await expect(signed.action(api.play.discover,{image:'data:image/jpeg;base64,YQ==',age:4})).rejects.toThrow('paused');expect(await t.run(ctx=>ctx.db.get(id))).toMatchObject(values);expect(await signed.query(api.access.status,{visitorToken:'12345678-1234-1234-1234-123456789abc'})).toMatchObject({state:'paid'});
});

test('production password signup is blocked before creating identity or auth records',async()=>{
 production();const t=convexTest(schema,modules);await expect(t.action(api.auth.signIn,{provider:'password',params:{email:'synthetic-new@example.invalid',password:'Synthetic-only1!',flow:'signUp'}})).rejects.toThrow('New accounts are paused');for(const table of ['users','authAccounts','authSessions'] as const)expect(await t.run(ctx=>ctx.db.query(table).take(1))).toEqual([]);
});

test('an existing password account still signs in with its identity, hash and paid entitlement preserved',async()=>{
 production();const {Password}=await import('@convex-dev/auth/providers/Password');const {generateKeyPair,exportPKCS8,exportJWK,decodeJwt}=await import('jose');const {privateKey,publicKey}=await generateKeyPair('RS256',{extractable:true});vi.stubEnv('JWT_PRIVATE_KEY',await exportPKCS8(privateKey));vi.stubEnv('JWKS',JSON.stringify({keys:[await exportJWK(publicKey)]}));vi.stubEnv('CONVEX_SITE_URL','https://sensible-avocet-370.convex.site');vi.stubEnv('SITE_URL','https://sensible-avocet-370.convex.site');
 const t=convexTest(schema,modules);const email='synthetic-existing@example.invalid';const values={email,paidFrom:1,paidUntil:Date.now()+86400000,bonusGranted:true,bonusUsed:false};const id=await t.run(ctx=>ctx.db.insert('users',values));const secret=await (Password() as unknown as {options:{crypto:{hashSecret(value:string):Promise<string>}}}).options.crypto.hashSecret('Synthetic-existing1!');const account=await t.run(ctx=>ctx.db.insert('authAccounts',{userId:id,provider:'password',providerAccountId:email,secret}));
 const result=await t.action(api.auth.signIn,{provider:'password',params:{email,password:'Synthetic-existing1!',flow:'signIn'}});expect(result.tokens?.token).toBeTruthy();expect(decodeJwt(result.tokens!.token).sub?.split('|')[0]).toBe(id);expect(await t.run(ctx=>ctx.db.get(id))).toMatchObject(values);expect(await t.run(ctx=>ctx.db.get(account))).toMatchObject({secret,userId:id});
});

test('release build selection refuses a different backend and the existing default deploy target is blocked',async()=>{
 const {validateProductionBuild,requireSafeDeploy}=await import('../../scripts/production-preflight.mjs');const env={CONVEX_DEPLOYMENT:'prod:sensible-avocet-370',CONVEX_URL:'https://sensible-avocet-370.convex.cloud',CONVEX_SITE_URL:'https://sensible-avocet-370.convex.site'};expect(validateProductionBuild(env).projectId).toBe(3115458);for(const changes of [{CONVEX_URL:testingBoundary.convexUrl},{CONVEX_DEPLOYMENT:'prod:synthetic-other'},{VITE_OPENAI_API_KEY:'synthetic-not-real'}])expect(()=>validateProductionBuild({...env,...changes})).toThrow();expect(()=>requireSafeDeploy(undefined,'a'.repeat(40))).toThrow('No deployment command was started');expect(()=>requireSafeDeploy('a'.repeat(40),'b'.repeat(40))).toThrow();expect(()=>requireSafeDeploy('a'.repeat(40),'a'.repeat(40))).not.toThrow();
});

test('approved release cannot include dirty tracked files or unreviewed backend source',async()=>{
 const {requireCleanRelease}=await import('../../scripts/production-preflight.mjs');expect(()=>requireCleanRelease(true,true,0)).not.toThrow();for(const [tracked,staged,count]of [[false,true,0],[true,false,0],[true,true,1]] as const)expect(()=>requireCleanRelease(tracked,staged,count)).toThrow('No deployment command was started');
});
