import { v, ConvexError } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { dataPolicyOpen, requireDataPolicy } from './v1Policy';
import { testingBoundary } from '../shared/testingDeployment.js';
import { PRIVACY_VERSION } from '../shared/privacy';
import { authenticatedOwner, requireTestingPrivacyOperation, requireNoDeletion, recordConsent } from './privacyAccess';
const scope = v.union(v.literal('family'), v.literal('account'));
const statusValidator = v.union(v.literal('deleting_family'), v.literal('finished_family'), v.literal('awaiting_policy'));
const viewValidator = v.object({ status: statusValidator, familyDeleted: v.boolean(), accountDeleted: v.literal(false), deletedCount: v.number(), requestedAt: v.number() });
function view(row: Doc<'deletionRequests'>) {
  return { status: row.status, familyDeleted: row.status !== 'deleting_family', accountDeleted: false as const, deletedCount: row.deletedCount, requestedAt: row.requestedAt };
}
export const status = query({
  args: {},
  returns: v.object({ version: v.string(), collectionEnabled: v.boolean(), isolatedTesting: v.boolean(), acknowledged: v.boolean(), consents: v.array(v.object({ scope: v.string(), version: v.string(), granted: v.boolean(), updatedAt: v.number() })), accountDeletion: v.union(viewValidator, v.null()), familyDeletion: v.union(viewValidator, v.null()) }),
  handler: async ctx => {
    const user = await authenticatedOwner(ctx);
    const consents = await ctx.db.query('privacyConsents').withIndex('by_owner_scope', q => q.eq('owner', user)).take(3);
    const account = await ctx.db.query('deletionRequests').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', 'account')).unique();
    const family = await ctx.db.query('deletionRequests').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', 'family')).unique();
    return { version: PRIVACY_VERSION, collectionEnabled: dataPolicyOpen(), isolatedTesting: process.env.CONVEX_CLOUD_URL === testingBoundary.convexUrl, acknowledged: consents.some(c => c.scope === 'privacy' && c.version === PRIVACY_VERSION && c.granted), consents: consents.map(({ scope, version, granted, updatedAt }) => ({ scope, version, granted, updatedAt })), accountDeletion: account ? view(account) : null, familyDeletion: family ? view(family) : null };
  }
});
export const acknowledge = mutation({
  args: { version: v.string(), accepted: v.literal(true) }, returns: v.null(),
  handler: async (ctx, args) => {
    requireDataPolicy();
    const user = await authenticatedOwner(ctx); await requireNoDeletion(ctx, user);
    if (args.version !== PRIVACY_VERSION) throw new ConvexError('This privacy version has changed. Review the current information before continuing.');
    await recordConsent(ctx, user, 'privacy', true); return null;
  }
});
const familyTables = ['children', 'toys', 'activities', 'attempts', 'preferences', 'privacyConsents'] as const;
// Each committed batch removes at most 100 records. Status is advanced in the
// same transaction. A failed batch rolls back; retry resumes the stored stage.
async function removeBatch(ctx: MutationCtx, row: Doc<'deletionRequests'>) {
  let remaining = 100, stage = row.stage, deleted = 0;
  while (stage < 8 && remaining > 0) {
    if (stage < familyTables.length) {
      const rows = await ctx.db.query(familyTables[stage]).withIndex('by_owner', q => q.eq('owner', row.owner)).take(remaining);
      for (const item of rows) await ctx.db.delete(item._id);
      deleted += rows.length; remaining -= rows.length;
      if (rows.length && !remaining) break;
      stage++;
    } else if (stage === 6) {
      const rows = await ctx.db.query('guestProgress').withIndex('by_claimed', q => q.eq('claimedBy', row.owner)).take(remaining);
      for (const item of rows) await ctx.db.delete(item._id);
      deleted += rows.length; remaining -= rows.length;
      if (rows.length && !remaining) break;
      stage++;
    } else {
      // Family-only deletion keeps the testing admission/quota record. Account
      // requests remove owned invitations and their unclaimed temporary draft.
      if (row.scope === 'family') { stage++; continue; }
      const invitation = await ctx.db.query('testingInvites').withIndex('by_owner', q => q.eq('owner', row.owner)).first();
      if (!invitation) { stage++; continue; }
      const drafts = await ctx.db.query('guestProgress').withIndex('by_invite', q => q.eq('inviteId', invitation._id)).take(remaining);
      for (const draft of drafts) {
        if (!draft.claimedBy || draft.claimedBy === row.owner) { await ctx.db.delete(draft._id); deleted++; remaining--; }
      }
      // Conservatively inspect another batch before removing the invitation.
      if (!remaining) break;
      await ctx.db.delete(invitation._id); deleted++; remaining--;
    }
  }
  const status = stage >= 8 ? row.scope === 'account' ? 'awaiting_policy' as const : 'finished_family' as const : 'deleting_family' as const;
  const patch = { stage, status, deletedCount: row.deletedCount + deleted, updatedAt: Date.now() };
  await ctx.db.patch(row._id, patch);
  if (status === 'deleting_family') await ctx.scheduler.runAfter(0, internal.privacy.continueDeletion, { request: row._id });
  return view({ ...row, ...patch });
}
export async function requestDeletion(ctx: MutationCtx, requestedScope: 'family' | 'account') {
  requireTestingPrivacyOperation();
  const user = await authenticatedOwner(ctx);
  const account = await ctx.db.query('deletionRequests').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', 'account')).unique();
  if (account && requestedScope === 'family') return account.status === 'deleting_family' ? removeBatch(ctx, account) : view(account);
  let row = await ctx.db.query('deletionRequests').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', requestedScope)).unique();
  if (row?.status === 'awaiting_policy') return view(row);
  if (!row) {
    const now = Date.now();
    const id = await ctx.db.insert('deletionRequests', { owner: user, scope: requestedScope, status: 'deleting_family', stage: 0, deletedCount: 0, requestedAt: now, updatedAt: now });
    row = (await ctx.db.get(id))!;
  } else if (row.status === 'finished_family') {
    // A parent may deliberately save new records after a family-only deletion.
    await ctx.db.patch(row._id, { status: 'deleting_family', stage: 0, deletedCount: 0 });
    row = { ...row, status: 'deleting_family', stage: 0, deletedCount: 0 };
  }
  return removeBatch(ctx, row);
}
export const deleteFamily = mutation({ args: { confirmation: v.literal('DELETE FAMILY DATA') }, returns: viewValidator, handler: ctx => requestDeletion(ctx, 'family') });
export const requestAccountDeletion = mutation({ args: { confirmation: v.literal('DELETE ACCOUNT') }, returns: viewValidator, handler: ctx => requestDeletion(ctx, 'account') });
export const resumeDeletion = mutation({
  args: { scope }, returns: viewValidator,
  handler: async (ctx, args) => {
    requireTestingPrivacyOperation(); const user = await authenticatedOwner(ctx);
    const row = await ctx.db.query('deletionRequests').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', args.scope)).unique();
    if (!row) throw new ConvexError('No deletion request exists for this account.');
    return row.status === 'deleting_family' ? removeBatch(ctx, row) : view(row);
  }
});
export const continueDeletion = internalMutation({
  args: { request: v.id('deletionRequests') }, returns: v.null(),
  handler: async (ctx, args) => {
    requireTestingPrivacyOperation(); const row = await ctx.db.get(args.request);
    if (row?.status === 'deleting_family') await removeBatch(ctx, row);
    return null;
  }
});
