import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireDataPolicy } from './v1Policy';
import { PRIVACY_VERSION } from '../shared/privacy';
import { testingBoundary } from '../shared/testingDeployment.js';
type Ctx = QueryCtx | MutationCtx;
export function requireTestingPrivacyOperation() {
  if (process.env.CONVEX_CLOUD_URL !== testingBoundary.convexUrl) throw new ConvexError('Privacy changes are restricted to the isolated testing environment.');
}
export async function authenticatedOwner(ctx: Ctx) {
  const user = await getAuthUserId(ctx);
  if (!user || !await ctx.db.get(user)) throw new ConvexError('Please sign in to manage your family.');
  return user;
}
export async function activeDeletion(ctx: Ctx, user: Id<'users'>) {
  const account = await ctx.db.query('deletionRequests').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', 'account')).unique();
  if (account) return account;
  const family = await ctx.db.query('deletionRequests').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', 'family')).unique();
  return family?.status === 'deleting_family' ? family : null;
}
export async function requireNoDeletion(ctx: Ctx, user: Id<'users'>) {
  if (await activeDeletion(ctx, user)) throw new ConvexError('A deletion request is in progress. New family information cannot be saved. Review its status in Profile.');
}
export async function requireCollectionConsent(ctx: Ctx, user: Id<'users'>) {
  requireDataPolicy();
  await requireNoDeletion(ctx, user);
  const consent = await ctx.db.query('privacyConsents').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', 'privacy')).unique();
  if (!consent?.granted || consent.version !== PRIVACY_VERSION) throw new ConvexError('Review and acknowledge the current privacy information in Profile before saving family information.');
}
export async function recordConsent(ctx: MutationCtx, user: Id<'users'>, scope: 'privacy' | 'phone' | 'future_whatsapp', granted: boolean) {
  const old = await ctx.db.query('privacyConsents').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', scope)).unique();
  if (old?.version === PRIVACY_VERSION && old.granted === granted) return;
  const value = { owner: user, scope, version: PRIVACY_VERSION, granted, updatedAt: Date.now() };
  if (old) await ctx.db.patch(old._id, value); else await ctx.db.insert('privacyConsents', value);
}
