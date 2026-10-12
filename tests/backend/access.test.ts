import { convexTest } from 'convex-test';
import { describe, test, expect, vi, afterEach } from 'vitest';
import schema from '../../convex/schema';
import { api, internal } from '../../convex/_generated/api';
import { nextMonth } from '../../convex/paymentRules';
const modules = import.meta.glob('../../convex/**/*.ts');
const token = '12345678-1234-1234-1234-123456789abc';
afterEach(() => vi.useRealTimers());
describe('visitor and account access', () => {
  test('two guest uses survive reload; the third is blocked and cannot call the AI', async () => {
    const t = convexTest(schema, modules);
    for (let i = 0; i < 2; i++) {
      const reservation = await t.mutation(internal.access.reserve, { visitorToken: token });
      await t.mutation(internal.access.finish, { reservation: reservation!, success: true });
    }
    expect((await t.query(api.access.status, { visitorToken: token })).state).toBe('signup');
    await expect(t.action(api.play.discover, { visitorToken: token, image: 'data:image/jpeg;base64,YQ==', age: 4 })).rejects.toThrow('SIGNUP_REQUIRED');
    expect(await t.run(ctx => ctx.db.query('aiQuota').withIndex('by_key', q => q.eq('key', 'global')).unique())).toBeNull();
  });
  test('concurrent reservations cannot exceed two guest uses', async () => {
    const t = convexTest(schema, modules);
    const attempts = await Promise.allSettled(Array.from({length: 3}, () => t.mutation(internal.access.reserve, {visitorToken: token})));
    expect(attempts.filter(a => a.status === 'fulfilled')).toHaveLength(2);
    expect((await t.query(api.access.status, { visitorToken: token })).uses).toBe(2);
  });
  test('failed or empty results refund a turn; finishing twice cannot refund twice', async () => {
    const t = convexTest(schema, modules);
    const reservation = await t.mutation(internal.access.reserve, { visitorToken: token });
    await t.mutation(internal.access.finish, { reservation: reservation!, success: false });
    await t.mutation(internal.access.finish, { reservation: reservation!, success: false });
    expect((await t.query(api.access.status, { visitorToken: token })).uses).toBe(0);
  });
  test('an old user with no payment fields gets one bonus, never a second after login', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(ctx => ctx.db.insert('users', { email: 'parent@example.com' }));
    const user = t.withIdentity({ subject: userId + '|test-session' });
    expect((await user.query(api.access.status, { visitorToken: token })).state).toBe('payment');
    await user.mutation(api.access.claimBonus, {});
    await expect(user.mutation(api.access.claimBonus, {})).rejects.toThrow('already used or claimed');
    const reservation = await user.mutation(internal.access.reserve, { visitorToken: token });
    await expect(user.mutation(internal.access.reserve, {visitorToken: token})).rejects.toThrow('PAYMENT_REQUIRED');
    await user.mutation(internal.access.finish, { reservation: reservation!, success: true });
    expect((await user.query(api.access.status, { visitorToken: token })).state).toBe('payment');
    await expect(user.action(api.play.discover, { visitorToken: token, image: 'data:image/jpeg;base64,YQ==', age: 4 })).rejects.toThrow('PAYMENT_REQUIRED');
  });
  test('bonus request failures refund the turn without allowing a second claim', async () => {
    const t = convexTest(schema, modules);
    const id = await t.run(ctx => ctx.db.insert('users', {email: 'retry@example.com'}));
    const user = t.withIdentity({subject: id + '|session'});
    await user.mutation(api.access.claimBonus, {});
    const reservation = await user.mutation(internal.access.reserve, {});
    await user.mutation(internal.access.finish, {reservation: reservation!, success: false});
    expect((await user.query(api.access.status, {visitorToken: token})).state).toBe('bonus');
    await expect(user.mutation(api.access.claimBonus, {})).rejects.toThrow();
  });
  test('markPaid uses normalized email, paid access expires exactly, renewal starts now', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-31T12:15:00Z'));
    const t = convexTest(schema, modules);
    const id = await t.run(ctx => ctx.db.insert('users', { email: 'paid@example.com' }));
    const user = t.withIdentity({subject: id + '|session'});
    const payment = await t.mutation(internal.access.markPaid, {email: ' PAID@EXAMPLE.COM '});
    expect(payment.paidUntil).toBe(Date.parse('2026-02-28T12:15:00Z'));
    expect((await user.query(api.access.status, {visitorToken: token})).state).toBe('paid');
    for (let i = 0; i < 4; i++) expect(await user.mutation(internal.access.reserve, {})).toBeNull();
    vi.setSystemTime(payment.paidUntil);
    expect((await user.query(api.access.status, {visitorToken: token})).state).toBe('payment');
    await expect(user.mutation(api.access.claimBonus, {})).rejects.toThrow();
    await expect(user.mutation(internal.access.reserve, {})).rejects.toThrow('PAYMENT_REQUIRED');
    const renewal = await t.mutation(internal.access.markPaid, {email: 'paid@example.com'});
    expect(renewal.paidFrom).toBe(payment.paidUntil);
    expect(renewal.paidUntil).toBe(nextMonth(payment.paidUntil));
    expect((await user.query(api.access.status, {visitorToken: token})).state).toBe('paid');
  });
  test('unknown payment emails fail and old global AI quota data is preserved', async () => {
    const t = convexTest(schema, modules);
    const id = await t.run(ctx => ctx.db.insert('aiQuota', {key: 'global', timestamps: [123]}));
    await expect(t.mutation(internal.access.markPaid, {email: 'missing@example.com'})).rejects.toThrow('No account');
    expect((await t.run(ctx => ctx.db.get(id)))?.timestamps).toEqual([123]);
  });
  test('month ends clamp correctly, including leap years and December', () => {
    expect(nextMonth(Date.parse('2028-01-31T10:00:00Z'))).toBe(Date.parse('2028-02-29T10:00:00Z'));
    expect(nextMonth(Date.parse('2026-12-31T10:00:00Z'))).toBe(Date.parse('2027-01-31T10:00:00Z'));
  });
});
