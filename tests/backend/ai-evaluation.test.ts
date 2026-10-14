import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { makeFunctionReference } from 'convex/server';
import schema from '../../convex/schema';
import { testingBoundary } from '../../shared/testingDeployment.js';
import { mockProviderOnce } from '../setup/no-network';
const image = 'data:image/jpeg;base64,/9j/2Q==';
// Unit simulation only. The separate policy test uses the real false capability.
vi.mock('../../convex/privacy', async importOriginal => ({...await importOriginal<typeof import('../../convex/privacy')>(),fullAccountDeletionImplemented:true}));
vi.mock('../../shared/evaluationCorpus', async () => {
  const {createHash} = await import('node:crypto');
  return ({
  evaluationCases: Array.from({ length: 24 }, (_, i) => ({ id: `case-${String(i + 1).padStart(2, '0')}`, age: 2 + i % 7, category: 'blocks', confirmedToys: ['large blocks'], expectedLabels: ['large blocks'], generationAllowed: true, licenseVerified: true, asset: 'synthetic-corpus.jpg', imageSha256: createHash('sha256').update(i === 2 ? Buffer.from([255,216,255,217]) : Buffer.from([255,216,255,217,i])).digest('hex') }))
}); });
const modules = import.meta.glob('../../convex/**/*.ts');
const m = (name: string) => makeFunctionReference<'mutation', any, any>(name);
const a = (name: string) => makeFunctionReference<'action', any, any>(name);
const q = (name: string) => makeFunctionReference<'query', any, any>(name);
const activity = { category: 'quick_play', title: 'A low tower', durationMinutes: 5, materials: ['large blocks'], toyReferences: ['large blocks'], steps: ['Stack large blocks into a short tower on the floor.', 'Count the large blocks as you add each one.'], parentRole: 'Stay beside your child and take turns.', safetyNotes: ['Use intact age-appropriate toys.'] };
function enable() {
  const flags = { CONVEX_CLOUD_URL: testingBoundary.convexUrl, V1_DATA_POLICY_APPROVED: 'true', V1_DATA_POLICY_VERSION: 'v1-privacy-2026-10-14', V1_R1_READINESS_APPROVED: 'true', V1_AI_EVALUATION_APPROVED: 'true', V1_EVALUATION_PRICE_VERIFIED: 'gpt-6-luna-standard-2026-10-14', V1_EVALUATION_INPUT_ACCOUNTING_VERIFIED: 'true', V1_EVALUATION_PROVIDER_LIMIT_VERIFIED: 'true', V1_EVALUATION_KEY_SCOPE_VERIFIED: 'proj_synthetic_evaluation', OPENAI_TESTING_PROJECT_ID: 'proj_synthetic_evaluation', OPENAI_TESTING_API_KEY: 'synthetic-test-key', V1_AI_BUDGET_MICROS: '10000000', V1_AI_REQUEST_CEILING_MICROS: '10000' };
  for (const [name, value] of Object.entries(flags)) vi.stubEnv(name, value);
  vi.stubEnv('V1_EVALUATION_PRIVACY_VERSION', 'v1-privacy-2026-10-14');
  vi.stubEnv('V1_EVALUATION_PRICE_VERIFIED_AT',new Date().toISOString());
}
beforeEach(enable); afterEach(() => vi.unstubAllEnvs());
async function setup() { const t = convexTest(schema, modules); const invite = await t.mutation(m('testingAccess:invite'), { evaluation: true }); return { t, invitation: invite.capability }; }
const run = (t: ReturnType<typeof convexTest>, invitation: string, kind = 'generation', previous: unknown[] = []) => t.action(a('aiEvaluation:run'), { invitation, caseId: 'case-03', kind, image: kind === 'recognition' ? image : '', previous });
function reply(payload: unknown, usage = { input_tokens: 1200, input_tokens_details: { cached_tokens: 0 }, output_tokens: 300, output_tokens_details: { reasoning_tokens: 20 }, total_tokens: 1500 }) { return Response.json({ model: 'gpt-6-luna', service_tier: 'default', status: 'completed', usage, output: [{ content: [{ type: 'output_text', text: JSON.stringify(payload) }] }] }); }
function mockPair(payload: unknown) {
  mockProviderOnce(body => { expect(body.model).toBe('gpt-6-luna'); mockProviderOnce(() => reply(payload)); return Response.json({ object: 'response.input_tokens', input_tokens: 1200 }); }, 'input_tokens');
}
test('the changed budget decision does not bypass incomplete R1, missing key or unverified costs', async () => {
  const { t, invitation } = await setup();
  for (const flag of ['V1_R1_READINESS_APPROVED', 'OPENAI_TESTING_API_KEY', 'V1_EVALUATION_INPUT_ACCOUNTING_VERIFIED', 'V1_EVALUATION_PROVIDER_LIMIT_VERIFIED']) {
    vi.stubEnv(flag, ''); await expect(run(t, invitation)).rejects.toThrow('evaluation'); enable();
  }
  expect(await t.run(ctx => ctx.db.query('aiEvaluations').take(1))).toEqual([]);
});
test('server budget cannot exceed the authorized ten dollars even if configuration requests more', async () => {
  const { t, invitation } = await setup(); vi.stubEnv('V1_AI_BUDGET_MICROS', '10000001');
  await expect(run(t, invitation)).rejects.toThrow('budget');
});
test('full request counting precedes generation; corrected labels and safety validators are reused', async () => {
  const { t, invitation } = await setup();
  mockProviderOnce(body => { expect(JSON.stringify(body.input)).toContain('large blocks'); expect(JSON.stringify(body.input)).not.toContain('data:image'); mockProviderOnce(body => { expect(body.max_output_tokens).toBe(1500); expect(body.store).toBe(false); expect(body.service_tier).toBe('default'); return reply({ toys: ['large blocks'], activities: [activity, { ...activity, title: 'Unsafe stunt', steps: ['Balance large blocks on a high shelf and climb up to reach them.', 'Jump down from the shelf.'] }] }); }); return Response.json({ object: 'response.input_tokens', input_tokens: 1200 }); }, 'input_tokens');
  const result = await run(t, invitation);
  expect(result.activities).toEqual([activity]); expect(result.rejectedActivities).toBe(1);
  const rows = await t.run(ctx => ctx.db.query('aiEvaluations').take(10));
  expect(rows[0]).toMatchObject({ state: 'measured', inputTokens: 1200, outputTokens: 300, reasoningTokens: 20, tokenCostMicros: 270 });
  expect(JSON.stringify(rows)).not.toContain('data:image'); expect(JSON.stringify(rows)).not.toContain('large blocks');
});
test('recognition records usage and latency without storing the photo or model response', async () => {
  const { t, invitation } = await setup(); mockPair({ toys: ['large blocks'] });
  const result = await run(t, invitation, 'recognition'); expect(result.toys).toEqual(['large blocks']); expect(result.latencyMs).toBeGreaterThanOrEqual(0);
});
test('duplicate mechanics are excluded even with different titles', async () => {
  const { t, invitation } = await setup(); mockPair({ toys: ['large blocks'], activities: [{ ...activity, title: 'A different tower' }] });
  expect((await run(t, invitation, 'generation', [activity])).activities).toEqual([]);
});
test('overlarge input count stops before a generation request and halts further evaluation', async () => {
  const { t, invitation } = await setup(); mockProviderOnce(() => Response.json({ object: 'response.input_tokens', input_tokens: 16385 }), 'input_tokens');
  await expect(run(t, invitation)).rejects.toThrow('stopped');
  await expect(run(t, invitation)).rejects.toThrow('paused');
});
test('unknown usage or transport failure burns the reservation and stops subsequent requests', async () => {
  const { t, invitation } = await setup(); mockProviderOnce(() => { throw new Error('synthetic timeout with private payload'); }, 'input_tokens');
  await expect(run(t, invitation)).rejects.toThrow('stopped');
  const budget = await t.run(ctx => ctx.db.query('testingBudget').withIndex('by_key', x => x.eq('key', 'initial-14-days')).unique());
  expect(budget?.reservedMicros).toBe(10000); expect(budget?.haltReason).toBe('evaluation_uncertain');
});
test('reservations near the ceiling and concurrency are enforced before any outbound request', async () => {
  const { t, invitation } = await setup();
  await t.run(ctx => ctx.db.insert('testingBudget', { key: 'initial-14-days', reservedMicros: 9990001 }));
  await expect(run(t, invitation)).rejects.toThrow('budget');
  await t.run(async ctx => { const row = await ctx.db.query('testingBudget').withIndex('by_key').first(); await ctx.db.patch(row!._id, { reservedMicros: 0 }); });
  const lease = await t.mutation(m('testingAccess:reserve'), { invitation, evaluation: true });
  await expect(t.mutation(m('testingAccess:reserve'), { invitation, evaluation: true })).rejects.toThrow('already running');
  await t.mutation(m('testingAccess:release'), lease);
});
test('private or unapproved images cannot be substituted for an approved corpus photograph', async () => {
  const { t, invitation } = await setup();
  await expect(t.action(a('aiEvaluation:run'), { invitation, caseId: 'case-03', kind: 'recognition', image: 'data:image/jpeg;base64,YQ==', previous: [] })).rejects.toThrow('corpus');
});
test('evaluation does not open general family collection or the public live-AI paths', async () => {
  const { t, invitation } = await setup(); vi.stubEnv('V1_DATA_POLICY_APPROVED', 'false'); vi.stubEnv('V1_PAID_AI_APPROVED','false');
  expect(await t.query(q('v1Capabilities:status'), {})).toMatchObject({personalData:false,liveAIReady:false});
  mockPair({toys:['large blocks'],activities:[activity]});expect((await run(t,invitation)).activities).toEqual([activity]);
});
test('expired evaluation leases do not silently allow another possibly overlapping request',async()=>{
  const {t,invitation}=await setup();await t.mutation(m('testingAccess:reserve'),{invitation,evaluation:true});
  await t.run(async ctx=>{const ledger=await ctx.db.query('testingBudget').withIndex('by_key').first();await ctx.db.patch(ledger!._id,{evaluationActiveUntil:Date.now()-1});const invite=await ctx.db.query('testingInvites').withIndex('by_digest').first();await ctx.db.patch(invite!._id,{activeUntil:Date.now()-1});});
  await expect(run(t,invitation)).rejects.toThrow('paused');
});
test('known token usage is preserved if model output is malformed, and no further requests run',async()=>{
  const {t,invitation}=await setup();mockPair({wrong:'not an activity response'});await expect(run(t,invitation)).rejects.toThrow('stopped');
  const rows=await t.run(ctx=>ctx.db.query('aiEvaluations').take(10));expect(rows[0]).toMatchObject({state:'measured',outputVerified:false,tokenCostMicros:270});
  await expect(run(t,invitation)).rejects.toThrow('paused');
});
test('allowances remain ten recognition and ten generation actions per synthetic slot/day',async()=>{
  const {t,invitation}=await setup();for(let i=0;i<10;i++){const lease=await t.mutation(m('testingAccess:reserve'),{invitation,evaluation:true,kind:'recognition'});await t.mutation(m('testingAccess:release'),lease);}
  await expect(t.mutation(m('testingAccess:reserve'),{invitation,evaluation:true,kind:'recognition'})).rejects.toThrow('allowance');
  const lease=await t.mutation(m('testingAccess:reserve'),{invitation,evaluation:true,kind:'generation'});await t.mutation(m('testingAccess:release'),lease);
});
test('actual provider costs near ten dollars stop requests even when token reservations are smaller',async()=>{
  const {t,invitation}=await setup();const lease=await t.mutation(m('testingAccess:reserve'),{invitation,evaluation:true});await t.mutation(m('testingAccess:release'),lease);
  await t.mutation(m('aiEvaluation:reconcile'),{projectId:'proj_synthetic_evaluation',providerCostMicros:9990001});
  await expect(run(t,invitation)).rejects.toThrow('budget');
  await expect(t.mutation(m('aiEvaluation:reconcile'),{projectId:'proj_wrong',providerCostMicros:0})).rejects.toThrow('verified');
  await expect(t.mutation(m('aiEvaluation:reconcile'),{projectId:'proj_synthetic_evaluation',providerCostMicros:0})).rejects.toThrow('cannot be reduced');
});
test('stale pricing verification prevents every provider request',async()=>{
  const {t,invitation}=await setup();vi.stubEnv('V1_EVALUATION_PRICE_VERIFIED_AT','2020-01-01T00:00:00Z');await expect(run(t,invitation)).rejects.toThrow('24 hours');
});
test('revoked approval during token counting prevents a subsequent generation call',async()=>{
  const {t,invitation}=await setup();mockProviderOnce(()=>{vi.stubEnv('V1_AI_EVALUATION_APPROVED','false');return Response.json({object:'response.input_tokens',input_tokens:1200});},'input_tokens');
  await expect(run(t,invitation)).rejects.toThrow('stopped');
});
test('usage above the output limit is retained as uncertain and prevents further spending',async()=>{
  const {t,invitation}=await setup();mockProviderOnce(()=>{mockProviderOnce(()=>reply({toys:['large blocks'],activities:[activity]},{input_tokens:1200,input_tokens_details:{cached_tokens:0},output_tokens:1501,output_tokens_details:{reasoning_tokens:20},total_tokens:2701}));return Response.json({object:'response.input_tokens',input_tokens:1200});},'input_tokens');
  await expect(run(t,invitation)).rejects.toThrow('stopped');
  expect((await t.run(ctx=>ctx.db.query('aiEvaluations').take(1)))[0]).toMatchObject({state:'uncertain',inputTokens:1200,outputTokens:1501});
  await expect(run(t,invitation)).rejects.toThrow('paused');
});
