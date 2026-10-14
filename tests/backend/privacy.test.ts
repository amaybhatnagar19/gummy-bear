import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { makeFunctionReference } from 'convex/server';
import schema from '../../convex/schema';
import { testingBoundary } from '../../shared/testingDeployment.js';
import { mockProviderOnce } from '../setup/no-network';
const modules = import.meta.glob('../../convex/**/*.ts');
const m = (name: string) => makeFunctionReference<'mutation', any, any>(name);
const q = (name: string) => makeFunctionReference<'query', any, any>(name);
const version = 'v1-privacy-2026-10-14';
beforeEach(() => { vi.stubEnv('CONVEX_CLOUD_URL', testingBoundary.convexUrl); vi.stubEnv('V1_DATA_POLICY_APPROVED', 'true'); vi.stubEnv('V1_DATA_POLICY_VERSION', version); });
afterEach(() => vi.unstubAllEnvs());
async function setup() {
  const t = convexTest(schema, modules);
  const a = await t.run(ctx => ctx.db.insert('users', { email: 'synthetic-a@example.test', paidUntil: 123, bonusUsed: true }));
  const b = await t.run(ctx => ctx.db.insert('users', { email: 'synthetic-b@example.test' }));
  return { t, a, b, one: t.withIdentity({ subject: `${a}|session` }), two: t.withIdentity({ subject: `${b}|session` }) };
}
async function accept(one: Awaited<ReturnType<typeof setup>>['one']) { await one.mutation(m('privacy:acknowledge'), { version, accepted: true }); }
test('collection requires the approved policy version and an explicit current acknowledgment', async () => {
  const { one } = await setup();
  await expect(one.mutation(m('family:saveChild'), { label: 'A', age: 4 })).rejects.toThrow('privacy');
  await expect(one.mutation(m('privacy:acknowledge'), { version, accepted: false })).rejects.toThrow();
  await expect(one.mutation(m('privacy:acknowledge'), { version: 'old', accepted: true })).rejects.toThrow('version');
  await accept(one);
  const id = await one.mutation(m('family:saveChild'), { label: 'Preferred label', age: 4 });
  expect(id).toBeTypeOf('string');
  vi.stubEnv('V1_DATA_POLICY_VERSION', '');
  await expect(one.mutation(m('family:saveChild'), { label: 'B', age: 4 })).rejects.toThrow('retention');
});
test('DOB and interests are optional and optional fields can be removed', async () => {
  const { one } = await setup(); await accept(one);
  const id = await one.mutation(m('family:saveChild'), { label: 'A', age: 4, interests: ['trains'] });
  await one.mutation(m('family:saveChild'), { id, label: 'A', age: 4 });
  const state = await one.query(q('family:state'), {});
  expect(state.children[0].interests).toEqual([]); expect(state.children[0].dob).toBeUndefined();
});
test('family retention has no inactivity expiry and no photo fields', async () => {
  const { t, a, one } = await setup(); await accept(one);
  const toy = await one.mutation(m('family:saveToy'), { name: 'blocks', status: 'stored', outgrown: false, damaged: false, unsafe: false, children: [] });
  await t.run(ctx => ctx.db.insert('guestProgress', { digest: 'expired-synthetic', expiresAt: 1, activities: [], age: 4 }));
  await t.mutation(m('guest:expire'), {});
  expect(await t.run(ctx => ctx.db.get(toy))).toMatchObject({ owner: a, name: 'blocks' });
  expect(JSON.stringify(await one.query(q('family:state'), {}))).not.toContain('data:image');
});
test('account deletion needs typed confirmation and never accepts an owner or request ID from the browser', async () => {
  const { t, one } = await setup();
  await expect(t.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'DELETE ACCOUNT' })).rejects.toThrow('sign in');
  await expect(one.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'delete' })).rejects.toThrow();
  await expect(one.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'DELETE ACCOUNT', owner: 'synthetic-other' })).rejects.toThrow();
});
test('account deletion removes owned family data and consent but preserves B, authentication and financial records', async () => {
  const { t, a, b, one, two } = await setup(); await accept(one); await accept(two);
  await one.mutation(m('family:saveChild'), { label: 'A', age: 4 });
  await two.mutation(m('family:saveChild'), { label: 'B', age: 5 });
  const auth = await t.run(ctx => ctx.db.insert('authAccounts', { userId: a, provider: 'password', providerAccountId: 'synthetic-a@example.test', secret: 'synthetic-hash' }));
  const session = await t.run(ctx => ctx.db.insert('authSessions', { userId: a, expirationTime: Date.now() + 1000 }));
  const payment = await t.run(ctx => ctx.db.insert('paymentEvents', { email: 'synthetic-a@example.test', paidFrom: 1, paidUntil: 123 }));
  const status = await one.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'DELETE ACCOUNT' });
  expect(status.status).toBe('awaiting_policy'); expect(status.accountDeleted).toBe(false); expect(status.familyDeleted).toBe(true);
  expect((await one.query(q('family:state'), {})).children).toEqual([]);
  expect((await two.query(q('family:state'), {})).children).toHaveLength(1);
  expect((await two.query(q('privacy:status'), {})).accountDeletion).toBeNull();
  expect(await t.run(ctx => ctx.db.get(a))).toMatchObject({ paidUntil: 123, bonusUsed: true });
  for (const id of [auth, session, payment, b]) expect(await t.run(ctx => ctx.db.get(id))).not.toBeNull();
  expect((await one.query(q('privacy:status'), {})).acknowledged).toBe(false);
});
test('requests and retries are idempotent and account deletion freezes new family writes', async () => {
  const { t, a, one } = await setup(); await accept(one);
  const first = await one.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'DELETE ACCOUNT' });
  expect(await one.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'DELETE ACCOUNT' })).toEqual(first);
  expect(await one.mutation(m('privacy:resumeDeletion'), { scope: 'account' })).toEqual(first);
  await expect(one.mutation(m('privacy:acknowledge'), { version, accepted: true })).rejects.toThrow('deletion');
  await expect(one.mutation(m('family:saveChild'), { label: 'A', age: 4 })).rejects.toThrow('deletion');
  vi.stubEnv('V1_PAID_AI_APPROVED', 'true'); vi.stubEnv('OPENAI_API_KEY', 'synthetic-test-key');
  await expect(t.mutation(m('testingAccess:invite'), { owner: a })).rejects.toThrow('deletion');
  await expect(one.mutation(m('testingAccess:reserve'), {})).rejects.toThrow('deletion');
  expect(await t.run(ctx => ctx.db.query('deletionRequests').take(10))).toHaveLength(1);
});
test('cleanup includes a draft at its exact expiry boundary', async () => {
  const { t } = await setup();
  const now = Date.now(); const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
  try {
    await t.run(ctx => ctx.db.insert('guestProgress', { digest: 'exact-expiry', expiresAt: now, activities: [], age: 4 }));
    expect(await t.mutation(m('guest:expire'), {})).toBe(1);
  } finally { clock.mockRestore(); }
});
test('large family deletion is bounded, retryable and does not claim completion early', async () => {
  const { t, a, one } = await setup();
  await t.run(async ctx => { for (let i = 0; i < 205; i++) await ctx.db.insert('toys', { owner: a, name: `synthetic-${i}`, status: 'stored', outgrown: false, unsafe: false, damaged: false, children: [] }); });
  let status = await one.mutation(m('privacy:deleteFamily'), { confirmation: 'DELETE FAMILY DATA' });
  expect(status.status).toBe('deleting_family'); expect(status.familyDeleted).toBe(false); expect(status.deletedCount).toBeLessThanOrEqual(100);
  // Deterministically exercise recovery with scheduled jobs not executed.
  for (let i = 0; i < 10 && !status.familyDeleted; i++) status = await one.mutation(m('privacy:resumeDeletion'), { scope: 'family' });
  expect(status.status).toBe('finished_family'); expect(status.deletedCount).toBe(205);
  expect((await one.query(q('family:state'), {})).toys).toEqual([]);
});
test('family deletion remains available after collection approval is withdrawn; production is refused', async () => {
  const { one } = await setup(); await accept(one); await one.mutation(m('family:saveChild'), { label: 'A', age: 4 });
  vi.stubEnv('V1_DATA_POLICY_APPROVED', 'false');
  expect((await one.mutation(m('privacy:deleteFamily'), { confirmation: 'DELETE FAMILY DATA' })).familyDeleted).toBe(true);
  vi.stubEnv('CONVEX_CLOUD_URL', 'https://unrelated.convex.cloud');
  await expect(one.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'DELETE ACCOUNT' })).rejects.toThrow('isolated');
});
test('guest draft cleanup deletes only expired drafts and drains multiple batches', async () => {
  const { t } = await setup();
  await t.run(async ctx => { for (let i = 0; i < 205; i++) await ctx.db.insert('guestProgress', { digest: `synthetic-${i}`, expiresAt: 1, activities: [], age: 4 }); await ctx.db.insert('guestProgress', { digest: 'current-synthetic', expiresAt: Date.now() + 86400000, activities: [], age: 4 }); });
  expect(await t.mutation(m('guest:expire'), {})).toBe(100);
  expect(await t.mutation(m('guest:expire'), {})).toBe(100);
  expect(await t.mutation(m('guest:expire'), {})).toBe(5);
  expect(await t.run(ctx => ctx.db.query('guestProgress').withIndex('by_expiry').take(10))).toHaveLength(1);
});
test('phone consent, future WhatsApp opt-in and privacy acknowledgment are independently versioned', async () => {
  const { one } = await setup(); await accept(one);
  await one.mutation(m('family:saveContact'), { phone: '+12025550123', phoneConsent: true, futureWhatsAppOptIn: false });
  let status = await one.query(q('privacy:status'), {});
  expect(status.consents.find((c: any) => c.scope === 'phone')).toMatchObject({ version, granted: true });
  expect(status.consents.find((c: any) => c.scope === 'future_whatsapp')).toMatchObject({ version, granted: false });
  await one.mutation(m('family:saveContact'), { phoneConsent: false, futureWhatsAppOptIn: false });
  status = await one.query(q('privacy:status'), {});
  expect(status.acknowledged).toBe(true); expect(status.consents.find((c: any) => c.scope === 'phone').granted).toBe(false);
});
test('guest draft updates do not extend the 24-hour deadline and expired proof cannot renew it', async () => {
  const { t } = await setup(); vi.stubEnv('V1_PAID_AI_APPROVED', 'true');
  const { capability: invitation } = await t.mutation(m('testingAccess:invite'), {});
  const args = { capability: 'a'.repeat(64), invitation, privacyVersion: version, age: 4, activities: [] };
  await t.mutation(m('guest:retain'), args);
  let draft = await t.run(ctx => ctx.db.query('guestProgress').withIndex('by_expiry').first());
  const deadline = draft!.expiresAt;
  await t.mutation(m('guest:retain'), args);
  draft = await t.run(ctx => ctx.db.query('guestProgress').withIndex('by_expiry').first());
  expect(draft!.expiresAt).toBe(deadline); expect(draft!.privacyVersion).toBe(version);
  await t.run(ctx => ctx.db.patch(draft!._id, { expiresAt: Date.now() - 1 }));
  await expect(t.mutation(m('guest:retain'), args)).rejects.toThrow('expired');
});
test('account removal also clears owned invitation drafts but never another parent’s linked draft', async () => {
  const { t, a, b, one } = await setup();
  const invitation = await t.run(ctx => ctx.db.insert('testingInvites', { owner: a, expiresAt: Date.now() + 1000, daily: 10, day: '', calls: 0, activeUntil: 0 }));
  const own = await t.run(ctx => ctx.db.insert('guestProgress', { inviteId: invitation, digest: 'synthetic-own', expiresAt: Date.now() + 1000, age: 4, activities: [] }));
  const other = await t.run(ctx => ctx.db.insert('guestProgress', { inviteId: invitation, digest: 'synthetic-other', claimedBy: b, expiresAt: Date.now() + 1000, age: 4, activities: [] }));
  await one.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'DELETE ACCOUNT' });
  expect(await t.run(ctx => ctx.db.get(own))).toBeNull(); expect(await t.run(ctx => ctx.db.get(invitation))).toBeNull();
  expect(await t.run(ctx => ctx.db.get(other))).not.toBeNull();
});
test('a failed transactional deletion batch cannot claim completion and can be retried', async () => {
  const { t, a, one } = await setup();
  // Force a validator failure inside the same transaction after deleting a row.
  const child = await t.run(ctx => ctx.db.insert('children', { owner: a, label: 'A', age: 4, interests: [] }));
  const { requestDeletion } = await import('../../convex/privacy');
  await expect(one.run(async ctx => {
    await requestDeletion(ctx, 'account');
    throw new Error('Synthetic transaction failure');
  })).rejects.toThrow('Synthetic transaction failure');
  expect(await t.run(ctx => ctx.db.get(child))).not.toBeNull();
  const result = await one.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'DELETE ACCOUNT' });
  expect(result.status).toBe('awaiting_policy'); expect(result.accountDeleted).toBe(false);
});
test('provider-controlled error fields and photographs cannot enter application error logs', async () => {
  const { t } = await setup();
  vi.stubEnv('OPENAI_API_KEY', 'synthetic-test-key');
  const photo = 'data:image/jpeg;base64,YQ==';
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  mockProviderOnce(() => Response.json({ error: { code: photo, type: 'synthetic-personal-value', message: photo } }, { status: 400 }));
  try {
    await expect(t.action(makeFunctionReference<'action', any, any>('play:generate'), { image: photo, age: 4 })).rejects.toThrow('could not read');
    expect(JSON.stringify(log.mock.calls)).not.toContain(photo);
    expect(JSON.stringify(log.mock.calls)).not.toContain('synthetic-personal-value');
  } finally { log.mockRestore(); }
});
test('individual toy and activity deletion require ownership and confirmation and remove related attempts', async () => {
  const { t, one, two } = await setup(); await accept(one); await accept(two);
  const toy = await one.mutation(m('family:saveToy'), { name: 'blocks', status: 'stored', outgrown: false, damaged: false, unsafe: false, children: [] });
  const activity = { category: 'quick_play', title: 'A tower', durationMinutes: 5, materials: ['blocks'], toyReferences: ['blocks'], steps: ['Stack blocks into a short tower on the floor.', 'Count the blocks as you add each one.'], parentRole: 'Stay beside your child and take turns.', safetyNotes: ['Use intact age-appropriate toys.'] };
  const [id] = await one.mutation(m('family:recordSuggestions'), { activities: [activity], age: 4, children: [], toyIds: [toy] });
  await one.mutation(m('family:updateActivity'), { id, tried: true });
  await expect(two.mutation(m('family:deleteToy'), { id: toy, confirmation: 'DELETE TOY' })).rejects.toThrow('unavailable');
  await expect(two.mutation(m('family:deleteActivity'), { id, confirmation: 'DELETE ACTIVITY' })).rejects.toThrow('unavailable');
  await expect(one.mutation(m('family:deleteToy'), { id: toy, confirmation: 'wrong' })).rejects.toThrow();
  await one.mutation(m('family:deleteToy'), { id: toy, confirmation: 'DELETE TOY' });
  expect((await one.query(q('family:state'), {})).activities[0].toyIds).toEqual([]);
  expect(await t.run(ctx => ctx.db.get(id))).not.toBeNull();
  await one.mutation(m('family:deleteActivity'), { id, confirmation: 'DELETE ACTIVITY' });
  expect((await one.query(q('family:state'), {})).attempts).toEqual([]);
  expect(await one.mutation(m('family:deleteToy'), { id: toy, confirmation: 'DELETE TOY' })).toBeNull();
  expect(await one.mutation(m('family:deleteActivity'), { id, confirmation: 'DELETE ACTIVITY' })).toBeNull();
});
test('the legacy null deletion response never signals success for a partially removed collection', async () => {
  const { t, a, one } = await setup();
  await t.run(async ctx => { for (let i = 0; i < 101; i++) await ctx.db.insert('children', { owner: a, label: 'synthetic', age: 4, interests: [] }); });
  await expect(one.mutation(m('family:deleteFamilyData'), { confirmation: 'DELETE FAMILY DATA' })).rejects.toThrow('progress-aware');
  expect(await t.run(ctx => ctx.db.query('children').withIndex('by_owner', q => q.eq('owner', a)).take(200))).toHaveLength(101);
});
test('account family removal includes preferences, consent, attempts and linked drafts while operational records await policy review', async () => {
  const { t, a, one } = await setup(); await accept(one);
  const child = await one.mutation(m('family:saveChild'), { label: 'Synthetic', age: 4 });
  const toy = await one.mutation(m('family:saveToy'), { name: 'blocks', status: 'stored', outgrown: false, damaged: false, unsafe: false, children: [child] });
  const activity = { category: 'quick_play', title: 'A tower', durationMinutes: 5, materials: ['blocks'], toyReferences: ['blocks'], steps: ['Stack blocks into a short tower on the floor.', 'Count the blocks as you add each one.'], parentRole: 'Stay beside your child and take turns.', safetyNotes: ['Use intact age-appropriate toys.'] };
  const [id] = await one.mutation(m('family:recordSuggestions'), { activities: [activity], age: 4, children: [child], toyIds: [toy] });
  await one.mutation(m('family:updateActivity'), { id, tried: true, feedback: 'loved' });
  await one.mutation(m('family:saveContact'), { phone: '+12025550123', phoneConsent: true, futureWhatsAppOptIn: false });
  await t.run(ctx => ctx.db.insert('guestProgress', { digest: 'synthetic-claimed', claimedBy: a, age: 4, activities: [], expiresAt: Date.now() + 86400000 }));
  const run = await t.run(ctx => ctx.db.insert('photoRuns', { time: Date.now(), visitorToken: 'synthetic', email: 'synthetic-a@example.test', succeeded: false, completed: true }));
  const reservation = await t.run(ctx => ctx.db.insert('accessReservations', { userId: a, kind: 'bonus' }));
  const result = await one.mutation(m('privacy:requestAccountDeletion'), { confirmation: 'DELETE ACCOUNT' });
  expect(result.status).toBe('awaiting_policy'); expect(result.deletedCount).toBe(9);
  const state = await one.query(q('family:state'), {});
  for (const key of ['children', 'toys', 'activities', 'attempts']) expect(state[key]).toEqual([]);
  expect(state.preferences).toBeNull();
  expect(await t.run(ctx => ctx.db.query('guestProgress').withIndex('by_claimed', q => q.eq('claimedBy', a)).take(10))).toEqual([]);
  expect(await t.run(ctx => ctx.db.get(run))).not.toBeNull(); expect(await t.run(ctx => ctx.db.get(reservation))).not.toBeNull();
});

test('withdrawal is owner-only and immediately stops saving even while global collection is closed',async()=>{const{t,a,one,two}=await setup();await accept(one);await accept(two);const child=await one.mutation(m('family:saveChild'),{label:'Synthetic',age:4});vi.stubEnv('V1_DATA_POLICY_APPROVED','false');await one.mutation(m('privacy:withdrawAcknowledgment'),{});vi.stubEnv('V1_DATA_POLICY_APPROVED','true');await expect(one.mutation(m('family:saveChild'),{label:'New',age:4})).rejects.toThrow('privacy');expect(await t.run(ctx=>ctx.db.get(child))).toMatchObject({owner:a});expect((await two.query(q('privacy:status'),{})).acknowledged).toBe(true);await expect(one.mutation(m('privacy:withdrawAcknowledgment'),{owner:a})).rejects.toThrow();});
test('withdrawal after family removal is idempotent and does not recreate erased consent',async()=>{const{t,one}=await setup();await accept(one);await one.mutation(m('privacy:requestAccountDeletion'),{confirmation:'DELETE ACCOUNT'});await one.mutation(m('privacy:withdrawAcknowledgment'),{});await one.mutation(m('privacy:withdrawAcknowledgment'),{});expect(await t.run(ctx=>ctx.db.query('privacyConsents').take(1))).toEqual([]);});
