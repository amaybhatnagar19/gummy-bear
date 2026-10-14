// Core legacy provider/safety/refund contract under a simulated open release.
// production-release.test.ts separately verifies the real closed gate; network stays blocked.
vi.mock('../../convex/releasePolicy', () => ({ requireGenerationRelease: () => undefined }));
import { convexTest } from 'convex-test';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import schema from '../../convex/schema';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { mockProviderOnce } from '../setup/no-network';
import { activityJsonSchema, type Activity } from '../../shared/activityContract';
import { presentActivities } from '../../src/activityPresentation';

const modules = import.meta.glob('../../convex/**/*.ts');
const token = '12345678-1234-1234-1234-123456789abc';
// Synthetic bytes accepted by the current string validator, not a real photo.
const photo = { image: 'data:image/jpeg;base64,YQ==', age: 4, visitorToken: token };
const activities = {
  toys: ['purple stuffed animal'],
  activities: [
    { category: 'quick_play', title: 'Toy greetings', durationMinutes: 3, materials: ['purple stuffed animal'],
      steps: ['Wave hello to the purple stuffed animal together.', 'Hold the purple stuffed animal and take turns greeting it.'],
      parentRole: 'Stay together and help your child greet the toy.', safetyNotes: ['Use only intact, age-appropriate toys.'], toyReferences: ['purple stuffed animal'] },
    { category: 'creative_adventure', title: 'Imaginary journey', durationMinutes: 5, materials: ['purple stuffed animal'],
      steps: ['Tell a pretend travel story for the purple stuffed animal.', 'Take turns describing where the purple stuffed animal goes next.'],
      parentRole: 'Stay with your child and help them take turns.', safetyNotes: ['Use only intact, age-appropriate toys.'], toyReferences: ['purple stuffed animal'] },
    { category: 'play_together', title: 'Mirror moves', durationMinutes: 5, materials: ['purple stuffed animal'],
      steps: ['Move the purple stuffed animal gently left and right while sitting.', 'Have your child copy the purple stuffed animal movements with their hands.'],
      parentRole: 'Sit together and guide gentle movements.', safetyNotes: ['Use only intact, age-appropriate toys.'], toyReferences: ['purple stuffed animal'] },
  ] as Activity[],
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv('OPENAI_API_KEY', 'synthetic-test-key');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.clearAllTimers();
  vi.useRealTimers();
});

function reply(raw: string, status = 'completed') {
  return Response.json({ status, output: [{ content: [{ type: 'output_text', text: raw }] }] });
}

function createBackend() { return convexTest(schema, modules); }

async function outcome(t: ReturnType<typeof createBackend>) {
  return t.run(async ctx => ({
    visitor: await ctx.db.query('visitors').withIndex('by_token', q => q.eq('token', token)).unique(),
    quota: await ctx.db.query('aiQuota').withIndex('by_key', q => q.eq('key', 'global')).unique(),
    runs: await ctx.db.query('photoRuns').withIndex('by_time').take(10),
    reservations: await ctx.db.query('accessReservations').take(10),
  }));
}

test('a synthetic provider success exercises the public action and consumes one guest turn', async () => {
  const t = convexTest(schema, modules);
  const raw = JSON.stringify(activities);
  const provider = vi.fn((body: Record<string, unknown>, signal: AbortSignal) => {
    expect(body).toMatchObject({ model: 'gpt-6-luna', reasoning: { effort: 'low' }, max_output_tokens: 1500, store: false,
      text: { format: { type: 'json_schema', name: 'toy_activities', strict: true, schema: activityJsonSchema } },
      input: [{ role: 'user', content: [
        { type: 'input_text', text: expect.stringContaining('4 years old') },
        { type: 'input_image', image_url: photo.image, detail: 'low' },
      ] }],
    });
    expect(signal.aborted).toBe(false);
    return reply(raw);
  });
  mockProviderOnce(provider);
  const result = await t.action(api.play.discover, photo);
  expect(result).toMatchObject({ toys: activities.toys, ideas: activities.activities.map(a => ({ title: a.title })) });
  expect('raw' in result).toBe(true);
  if ('raw' in result) {
    expect(JSON.parse(result.raw)).toEqual({ toys: result.toys, ideas: result.ideas });
    for (let i = 0; i < 3; i++) expect(result.ideas[i].instructions).toContain(activities.activities[i].parentRole);
  }
  expect(provider).toHaveBeenCalledTimes(1);
  const state = await outcome(t);
  expect(state.visitor?.uses).toBe(1);
  expect(state.quota?.timestamps).toHaveLength(1);
  expect(state.runs).toHaveLength(1);
  expect(state.runs[0]).toMatchObject({ completed: true, succeeded: true, visitorToken: token });
  expect(state.reservations).toHaveLength(0);
});

test('empty recognition refunds access while retaining the provider quota attempt', async () => {
  const t = convexTest(schema, modules);
  mockProviderOnce(() => reply('{"toys":[],"activities":[]}'));
  expect(await t.action(api.play.discover, photo)).toMatchObject({ toys: [], ideas: [] });
  const state = await outcome(t);
  expect(state.visitor?.uses).toBe(0);
  expect(state.quota?.timestamps).toHaveLength(1);
  expect(state.runs[0]).toMatchObject({ completed: true, succeeded: false });
  expect(state.reservations).toHaveLength(0);
});

test.each([
  ['malformed JSON', () => reply('not JSON'), 'The answer was incomplete.'],
  ['incomplete activity fields', () => reply('{"toys":["stuffed animal"],"activities":[{}]}'), 'The answer was incomplete.'],
  ['cut-short response', () => reply('{}', 'incomplete'), 'The answer was cut short.'],
  ['provider timeout', () => { throw new DOMException('Synthetic timeout', 'TimeoutError'); }, 'The connection took too long.'],
  ['401 rejection', () => Response.json({ error: { code: 'synthetic', type: 'synthetic', message: 'synthetic failure' } }, { status: 401 }), 'The owner needs to check the OpenAI key'],
  ['429 rejection', () => Response.json({ error: { code: 'synthetic' } }, { status: 429 }), 'The AI service is busy or out of credit.'],
  ['500 rejection', () => Response.json({ error: { code: 'synthetic' } }, { status: 500 }), 'The AI service could not read this photo.'],
])('%s records failure and refunds exactly once without retrying', async (_name, response, message) => {
  const t = convexTest(schema, modules);
  const provider = vi.fn(response);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mockProviderOnce(provider);
  await expect(t.action(api.play.discover, photo)).rejects.toThrow(message);
  expect(provider).toHaveBeenCalledTimes(1);
  const state = await outcome(t);
  expect(state.visitor?.uses).toBe(0);
  expect(state.quota?.timestamps).toHaveLength(1);
  expect(state.runs[0]).toMatchObject({ completed: true, succeeded: false });
  expect(state.reservations).toHaveLength(0);
  // Run scheduled fallback cleanup twice: completed failures cannot refund again.
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect((await outcome(t)).visitor?.uses).toBe(0);
});

test('successful completion is not refunded by the scheduled fallback', async () => {
  const t = convexTest(schema, modules);
  mockProviderOnce(() => reply(JSON.stringify(activities)));
  await t.action(api.play.discover, photo);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect((await outcome(t)).visitor?.uses).toBe(1);
});

test('exhausted guest access never reaches a provider or starts an analytics run', async () => {
  const t = convexTest(schema, modules);
  await t.run(ctx => ctx.db.insert('visitors', { token, uses: 2 }));
  await expect(t.action(api.play.discover, photo)).rejects.toThrow('SIGNUP_REQUIRED');
  const state = await outcome(t);
  expect(state.visitor?.uses).toBe(2);
  expect(state.quota).toBeNull();
  expect(state.runs).toHaveLength(0);
});

test('exhausted global quota never reaches a provider and refunds access', async () => {
  const t = convexTest(schema, modules);
  await t.run(ctx => ctx.db.insert('aiQuota', { key: 'global', timestamps: Array(100).fill(Date.now()) }));
  await expect(t.action(api.play.discover, photo)).rejects.toThrow('hourly limit');
  const state = await outcome(t);
  expect(state.visitor?.uses).toBe(0);
  expect(state.quota?.timestamps).toHaveLength(100);
  expect(state.runs[0]).toMatchObject({ completed: true, succeeded: false });
});

test.each([
  ['age below range', { age: 1 }, 'Choose an age'],
  ['age above range', { age: 9 }, 'Choose an age'],
  ['fractional age', { age: 4.5 }, 'Choose an age'],
  ['non-JPEG input', { image: 'data:image/png;base64,YQ==' }, 'Choose one clear photo'],
  ['oversized input', { image: 'data:image/jpeg;base64,' + 'A'.repeat(350000) }, 'Choose one clear photo'],
])('%s cannot reach the provider or consume quota', async (_name, invalid, message) => {
  const t = convexTest(schema, modules);
  await expect(t.action(api.play.discover, { ...photo, ...invalid })).rejects.toThrow(message);
  const state = await outcome(t);
  expect(state.visitor?.uses).toBe(0);
  expect(state.quota).toBeNull();
  expect(state.reservations).toHaveLength(0);
});

test('a failed account bonus is refunded without granting another bonus', async () => {
  const t = convexTest(schema, modules);
  const id = await t.run(ctx => ctx.db.insert('users', { email: 'synthetic@example.com' }));
  const account = t.withIdentity({ subject: id + '|synthetic-session' });
  await account.mutation(api.access.claimBonus, {});
  mockProviderOnce(() => reply('not JSON'));
  await expect(account.action(api.play.discover, photo)).rejects.toThrow('incomplete');
  expect((await account.query(api.access.status, { visitorToken: token })).state).toBe('bonus');
  await expect(account.mutation(api.access.claimBonus, {})).rejects.toThrow('already used or claimed');
  expect((await outcome(t)).quota?.timestamps).toHaveLength(1);
});

test.each([1, 2, 3])('version two returns %i accepted activities and consumes exactly one turn', async count => {
  const t = convexTest(schema, modules);
  const candidates = activities.activities.slice(0, count);
  mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: candidates })));
  const result = await t.action(api.play.discover, { ...photo, responseVersion: 2 });
  expect(result).toEqual({ schemaVersion: 2, outcome: 'success', limitation: null, toys: activities.toys, activities: candidates });
  expect((await outcome(t)).visitor?.uses).toBe(1);
});

test.each(['unsafe', 'generic', 'duplicate'])('%s candidate is removed while a valid activity survives', async kind => {
  const t = convexTest(schema, modules);
  const valid = activities.activities[0];
  const rejected = kind === 'unsafe'
    ? { ...valid, title: 'Battery game', steps: ['Use a button battery beside the purple stuffed animal.', valid.steps[1]] }
    : kind === 'generic'
      ? { ...valid, steps: ['Have fun with purple stuffed animal.', 'Be creative with purple stuffed animal.'] }
      : { ...valid, title: 'Renamed greeting' };
  mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: [valid, rejected] })));
  const result = await t.action(api.play.discover, { ...photo, responseVersion: 2 });
  expect(result).toMatchObject({ outcome: 'success', activities: [valid] });
  expect((await outcome(t)).visitor?.uses).toBe(1);
});

test('an unsafe first candidate does not prevent a later safe activity from surviving', async () => {
  const t = convexTest(schema, modules);
  const valid = activities.activities[0];
  mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: [
    { ...valid, title: 'Unsafe greeting', steps: ['Put purple stuffed animal in your child’s mouth.', valid.steps[1]] }, valid,
  ] })));
  expect(await t.action(api.play.discover, { ...photo, responseVersion: 2 })).toMatchObject({ activities: [valid] });
});

test.each(['unsafe', 'generic', 'empty'])('zero %s survivors refund the guest turn and return a limitation', async kind => {
  const t = convexTest(schema, modules);
  const base = activities.activities[0];
  const candidates = kind === 'empty' ? [] : [{ ...base, steps: kind === 'unsafe'
    ? ['Use button batteries beside purple stuffed animal.', base.steps[1]]
    : ['Have fun with purple stuffed animal.', 'Be creative with purple stuffed animal.'] }];
  mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: candidates })));
  const result = await t.action(api.play.discover, { ...photo, responseVersion: 2 });
  expect(result).toMatchObject({ outcome: 'limitation', activities: [], limitation: expect.stringContaining('Try a clearer photo') });
  const state = await outcome(t);
  expect(state.visitor?.uses).toBe(0);
  expect(state.quota?.timestamps).toHaveLength(1);
  expect(state.runs[0]).toMatchObject({ completed: true, succeeded: false });
  expect(state.reservations).toHaveLength(0);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect((await outcome(t)).visitor?.uses).toBe(0);
});

test('legacy zero-survivor response is a recoverable error and is refunded once', async () => {
  const t = convexTest(schema, modules);
  mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: [] })));
  await expect(t.action(api.play.discover, photo)).rejects.toThrow('Try a clearer photo');
  expect((await outcome(t)).visitor?.uses).toBe(0);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect((await outcome(t)).visitor?.uses).toBe(0);
});

test('legacy raw never exposes rejected activities', async () => {
  const t = convexTest(schema, modules);
  const valid = activities.activities[0];
  mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: [valid,
    { ...valid, title: 'Rejected battery game', steps: ['Use a battery beside purple stuffed animal.', valid.steps[1]] },
  ] })));
  const result = await t.action(api.play.discover, photo);
  expect('raw' in result).toBe(true);
  if ('raw' in result) {
    expect(result.ideas).toHaveLength(1);
    expect(result.raw).not.toContain('Rejected battery game');
    expect(result.raw).not.toContain('Use a battery');
  }
});

test('provider refusal becomes a limitation without exposing the provider text', async () => {
  const t = convexTest(schema, modules);
  mockProviderOnce(() => Response.json({ status: 'completed', output: [{ content: [{ type: 'refusal', refusal: 'synthetic private refusal' }] }] }));
  const result = await t.action(api.play.discover, { ...photo, responseVersion: 2 });
  expect(result).toMatchObject({ outcome: 'limitation', activities: [] });
  expect(JSON.stringify(result)).not.toContain('synthetic private refusal');
  expect((await outcome(t)).visitor?.uses).toBe(0);
});

test('zero survivors refund the account bonus and preserve its one-time claim', async () => {
  const t = convexTest(schema, modules);
  const id = await t.run(ctx => ctx.db.insert('users', { email: 'synthetic@example.com' }));
  const account = t.withIdentity({ subject: id + '|synthetic-session' });
  await account.mutation(api.access.claimBonus, {});
  mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: [] })));
  expect(await account.action(api.play.discover, { ...photo, responseVersion: 2 })).toMatchObject({ outcome: 'limitation' });
  expect((await account.query(api.access.status, { visitorToken: token })).state).toBe('bonus');
  await expect(account.mutation(api.access.claimBonus, {})).rejects.toThrow('already used or claimed');
});

test('paid account entitlement is unchanged by success or limitation', async () => {
  const t = convexTest(schema, modules);
  const paidFrom = Date.now(), paidUntil = paidFrom + 86400000;
  const id = await t.run(ctx => ctx.db.insert('users', { email: 'synthetic@example.com', paidFrom, paidUntil }));
  const account = t.withIdentity({ subject: id + '|synthetic-session' });
  for (const candidates of [activities.activities.slice(0, 1), []]) {
    mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: candidates })));
    await account.action(api.play.discover, { ...photo, responseVersion: 2 });
    expect(await t.run(ctx => ctx.db.get(id))).toMatchObject({ paidFrom, paidUntil });
    expect((await account.query(api.access.status, { visitorToken: token })).state).toBe('paid');
  }
  expect((await outcome(t)).quota?.timestamps).toHaveLength(2);
});

test('malformed second candidate rejects the entire reply and refunds access', async () => {
  const t = convexTest(schema, modules);
  mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: [activities.activities[0], { title: 'missing fields' }] })));
  await expect(t.action(api.play.discover, { ...photo, responseVersion: 2 })).rejects.toThrow('incomplete');
  expect((await outcome(t)).visitor?.uses).toBe(0);
});

test('provider output is bounded before parsing', async () => {
  const t = convexTest(schema, modules);
  mockProviderOnce(() => reply(' '.repeat(20001)));
  await expect(t.action(api.play.discover, { ...photo, responseVersion: 2 })).rejects.toThrow('incomplete');
  expect((await outcome(t)).visitor?.uses).toBe(0);
});

test.each([
  null, { status: 'completed', output: {} }, { status: 'completed', output: [null] },
  { status: 'completed', output: [{ content: {} }] },
  { status: 'completed', output: [{ content: [null] }] },
  { status: 'completed', output: [{ content: [{ type: 'output_text', text: {} }] }] },
])('malformed provider envelope produces recovery and refund: %j', envelope => {
  return (async () => {
    const t = convexTest(schema, modules);
    mockProviderOnce(() => Response.json(envelope));
    await expect(t.action(api.play.discover, { ...photo, responseVersion: 2 })).rejects.toThrow('incomplete');
    expect((await outcome(t)).visitor?.uses).toBe(0);
  })();
});

const hardenedBypasses: { name: string; age: number; changes: Partial<Activity> }[] = [
  { name: 'split sentences', age: 4, changes: { steps: ['Hold purple stuffed animal. Press it against your child. Their face should be underneath it.', 'Take turns holding purple stuffed animal this way.'] } },
  { name: 'hot kettle', age: 4, changes: { steps: ['Place purple stuffed animal near a hot kettle for this game.', 'Take turns moving purple stuffed animal closer.'] } },
  { name: 'stool', age: 4, changes: { steps: ['Have your child stand on a stool to reach purple stuffed animal.', 'Take turns moving purple stuffed animal higher.'] } },
  { name: 'ribbon', age: 4, changes: { steps: ['Fasten purple stuffed animal around the youngster’s neck with ribbon.', 'Take turns moving purple stuffed animal.'] } },
  { name: 'arbitrary toy mouthing', age: 4, changes: { steps: ['Chew purple stuffed animal while sitting together.', 'Hold purple stuffed animal and take turns greeting it.'] } },
  { name: 'distracted supervision', age: 4, changes: { parentRole: 'Watch television while the toddler plays on their own.' } },
  { name: 'miniature pieces', age: 2, changes: { steps: ['Sort miniature counters beside purple stuffed animal into groups.', 'Take turns naming the colors beside purple stuffed animal.'] } },
];
function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
}
test.each(hardenedBypasses)('Task 2A end-to-end: $name cannot reach any response or presentation field', async ({ age, changes }) => {
  const valid = activities.activities[0];
  const rejected = { ...valid, ...changes, title: 'discarded candidate sentinel' };
  // Exercise both versions, including the actual frontend formatting adapter.
  for (const responseVersion of [undefined, 2] as const) {
    const t = convexTest(schema, modules);
    mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: [rejected, valid] })));
    const result = await t.action(api.play.discover, { ...photo, age, responseVersion });
    const view = presentActivities(result);
    expect(view.ideas).toHaveLength(1);
    expect(view.ideas[0].title).toBe(valid.title);
    const texts = [...allStrings(result), ...allStrings(view), ...('raw' in result ? allStrings(JSON.parse(result.raw)) : [])];
    for (const text of texts) {
      expect(text).not.toContain('discarded candidate sentinel');
      if (changes.steps) expect(text).not.toContain(changes.steps[0]);
      if (changes.parentRole) expect(text).not.toContain(changes.parentRole);
    }
    const state = await outcome(t);
    expect(state.visitor?.uses).toBe(1);
    expect(state.quota?.timestamps).toHaveLength(1);
    expect(state.reservations).toHaveLength(0);
  }
});
test.each(['guest', 'bonus', 'paid'])('Task 2A all-hazardous result preserves %s access rules', async kind => {
  const t = convexTest(schema, modules);
  let caller: Pick<typeof t, 'action' | 'mutation' | 'query'> = t;
  let userId: Id<'users'> | undefined;
  const paidFrom = Date.now(), paidUntil = paidFrom + 86400000;
  if (kind !== 'guest') {
    userId = await t.run(ctx => ctx.db.insert('users', { email: 'synthetic@example.com', ...(kind === 'paid' ? { paidFrom, paidUntil } : {}) }));
    caller = t.withIdentity({ subject: userId + '|synthetic-session' });
    if (kind === 'bonus') await caller.mutation(api.access.claimBonus, {});
  }
  const rejected = { ...activities.activities[0], ...hardenedBypasses[0].changes, title: 'discarded candidate sentinel' };
  mockProviderOnce(() => reply(JSON.stringify({ toys: activities.toys, activities: [rejected] })));
  const result = await caller.action(api.play.discover, { ...photo, responseVersion: 2 });
  expect(result).toMatchObject({ outcome: 'limitation', activities: [], limitation: expect.stringContaining('Try a clearer photo') });
  expect(presentActivities(result).ideas).toEqual([]);
  expect(JSON.stringify(result)).not.toContain('discarded candidate sentinel');
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  const state = await outcome(t);
  expect(state.quota?.timestamps).toHaveLength(1);
  expect(state.runs[0]).toMatchObject({ completed: true, succeeded: false });
  expect(state.reservations).toHaveLength(0);
  if (kind === 'guest') expect(state.visitor?.uses).toBe(0);
  if (kind === 'bonus') {
    expect((await caller.query(api.access.status, { visitorToken: token })).state).toBe('bonus');
    await expect(caller.mutation(api.access.claimBonus, {})).rejects.toThrow('already used or claimed');
  }
  if (kind === 'paid' && userId) {
    expect(await t.run(ctx => ctx.db.get(userId!))).toMatchObject({ paidFrom, paidUntil });
    expect((await caller.query(api.access.status, { visitorToken: token })).state).toBe('paid');
  }
});
