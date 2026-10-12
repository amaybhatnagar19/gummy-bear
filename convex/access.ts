import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { accountAccess, nextMonth } from "./paymentRules";
const state = v.union(v.literal('trial'), v.literal('signup'), v.literal('paid'), v.literal('bonus'), v.literal('payment'));
function checkToken(token: string) { if (!/^[a-f0-9-]{36}$/.test(token)) throw new ConvexError('Please refresh the page to start.'); }
export const status = query({ args: { visitorToken: v.string() }, returns: v.object({ state, uses: v.number(), canClaimBonus: v.boolean(), paidUntil: v.union(v.number(), v.null()) }), handler: async (ctx, { visitorToken }) => {
  checkToken(visitorToken);
  const id = await getAuthUserId(ctx), user = id ? await ctx.db.get(id) : null;
  if (user) return { state: accountAccess(user, Date.now()), uses: 0, canClaimBonus: user.paidFrom === undefined && !user.bonusGranted && !user.bonusUsed, paidUntil: user.paidUntil ?? null };
  const visitor = await ctx.db.query('visitors').withIndex('by_token', q => q.eq('token', visitorToken)).unique();
  const uses = visitor?.uses ?? 0;
  return { state: uses < 2 ? 'trial' as const : 'signup' as const, uses, canClaimBonus: false, paidUntil: null };
}});
export const claimBonus = mutation({ args: {}, returns: v.null(), handler: async ctx => {
  const id = await getAuthUserId(ctx), user = id ? await ctx.db.get(id) : null;
  if (!user || !id) throw new ConvexError('Log in to use your last free turn.');
  if (user.paidFrom !== undefined || user.bonusGranted || user.bonusUsed) throw new ConvexError('Your last free turn is already used or claimed.');
  await ctx.db.patch(id, { bonusGranted: true }); return null;
}});
export const reserve = internalMutation({ args: { visitorToken: v.optional(v.string()) }, returns: v.union(v.id('accessReservations'), v.null()), handler: async (ctx, { visitorToken }) => {
  const id = await getAuthUserId(ctx), user = id ? await ctx.db.get(id) : null;
  let reservation;
  if (id && user) {
    const access = accountAccess(user, Date.now());
    if (access === 'paid') return null;
    if (access !== 'bonus') throw new ConvexError('PAYMENT_REQUIRED');
    await ctx.db.patch(id, { bonusUsed: true });
    reservation = await ctx.db.insert('accessReservations', { userId: id, kind: 'bonus' });
  } else {
    if (!visitorToken) throw new ConvexError('Please refresh Gummy Bear to continue. Your previous play ideas are unchanged.');
    checkToken(visitorToken);
    const visitor = await ctx.db.query('visitors').withIndex('by_token', q => q.eq('token', visitorToken)).unique();
    if ((visitor?.uses ?? 0) >= 2) throw new ConvexError('SIGNUP_REQUIRED');
    const visitorId = visitor?._id ?? await ctx.db.insert('visitors', { token: visitorToken, uses: 0 });
    await ctx.db.patch(visitorId, { uses: (visitor?.uses ?? 0) + 1 });
    reservation = await ctx.db.insert('accessReservations', { visitorId, kind: 'trial' });
  }
  await ctx.scheduler.runAfter(90000, internal.access.finish, { reservation, success: false });
  return reservation;
}});
export const finish = internalMutation({ args: { reservation: v.id('accessReservations'), success: v.boolean() }, returns: v.null(), handler: async (ctx, { reservation, success }) => {
  const row = await ctx.db.get(reservation); if (!row) return null;
  if (!success && row.visitorId) { const visitor = await ctx.db.get(row.visitorId); if (visitor) await ctx.db.patch(visitor._id, { uses: Math.max(0, visitor.uses - 1) }); }
  if (!success && row.userId) await ctx.db.patch(row.userId, { bonusUsed: false });
  await ctx.db.delete(row._id); return null;
}});
export const markPaid = internalMutation({ args: { email: v.string() }, returns: v.object({ email: v.string(), paidFrom: v.number(), paidUntil: v.number() }), handler: async (ctx, { email }) => {
  const normalized = email.trim().toLowerCase();
  const users = await ctx.db.query('users').withIndex('email', q => q.eq('email', normalized)).take(2);
  if (users.length !== 1) throw new ConvexError(users.length ? 'More than one account has this email. Check the accounts before confirming payment.' : 'No account has this email. Ask the parent to sign up first.');
  const paidFrom = Date.now(), paidUntil = nextMonth(paidFrom);
  await ctx.db.patch(users[0]._id, { paidFrom, paidUntil });
  return { email: normalized, paidFrom, paidUntil };
}});
