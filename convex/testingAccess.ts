import { internalMutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { v, ConvexError } from 'convex/values';
import { requireCollectionConsent, requireNoDeletion } from './privacyAccess';
import { requireLiveAI } from './v1Policy';
export async function inviteDigest(value: string) {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new ConvexError('Use the testing invitation supplied by the owner.');
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
export const invite = internalMutation({
  args: {
    owner: v.optional(v.id('users'))
  },
  returns: v.object({
    id: v.id('testingInvites'),
    capability: v.string()
  }),
  handler: async (ctx, {
    owner
  }) => {
    requireLiveAI();
    const all = await ctx.db.query('testingInvites').take(11);
    if (all.length >= 10) throw new ConvexError('Ten testing invitations have already been allocated.');
    if (owner && !(await ctx.db.get(owner))) throw new ConvexError('This account is unavailable.');
    if (owner) await requireNoDeletion(ctx, owner);
    if (owner && (await ctx.db.query('testingInvites').withIndex('by_owner', q => q.eq('owner', owner)).unique())) throw new ConvexError('Already invited.');
    const capability = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
    const id = await ctx.db.insert('testingInvites', {
      owner,
      capabilityDigest: await inviteDigest(capability),
      expiresAt: Date.now() + 14 * 86400000,
      daily: 10,
      day: '',
      calls: 0,
      activeUntil: 0
    });
    return {
      id,
      capability
    };
  }
});
export const reserve = internalMutation({
  args: {
    invitation: v.optional(v.string()),
    kind: v.optional(v.union(v.literal('recognition'), v.literal('generation')))
  },
  returns: v.object({
    id: v.id('testingInvites'),
    lease: v.string()
  }),
  handler: async (ctx, {
    kind = 'generation',
    invitation
  }) => {
    requireLiveAI();
    const user = await getAuthUserId(ctx);
    if(user&&!await ctx.db.get(user))throw new ConvexError('This testing account is unavailable.');
    if(user)await requireCollectionConsent(ctx,user);
    let invite = user ? await ctx.db.query('testingInvites').withIndex('by_owner', q => q.eq('owner', user)).unique() : null;
    if (!invite && invitation) {
      const hash = await inviteDigest(invitation);
      invite = await ctx.db.query('testingInvites').withIndex('by_digest', q => q.eq('capabilityDigest', hash)).unique();
      if (invite?.owner && invite.owner !== user) throw new ConvexError('This invitation belongs to another tester.');
    }
    if(user&&invite&&!invite.owner)await ctx.db.patch(invite._id,{owner:user});
    const now = Date.now();
    if (!invite || invite.expiresAt <= now) throw new ConvexError('This testing invitation is unavailable or has expired.');
    if (invite.activeUntil > now) throw new ConvexError('One idea request is already running. Please wait.');
    const day = new Date(now).toISOString().slice(0, 10),
      calls = invite.day === day ? invite.calls : 0,
      recognitionCalls = invite.day === day ? invite.recognitionCalls ?? 0 : 0;
    if ((kind === 'generation' ? calls : recognitionCalls) >= invite.daily) throw new ConvexError('You’ve reached today’s testing allowance. Your previous ideas are still available.');
    const budget = Number(process.env.V1_AI_BUDGET_MICROS),
      ceiling = Number(process.env.V1_AI_REQUEST_CEILING_MICROS);
    if (!Number.isSafeInteger(budget) || !Number.isSafeInteger(ceiling) || budget <= 0 || ceiling <= 0 || ceiling > budget) throw new ConvexError('A hard AI spending budget needs approval before live testing.');
    let ledger = await ctx.db.query('testingBudget').withIndex('by_key', q => q.eq('key', 'initial-14-days')).unique();
    if ((ledger?.reservedMicros ?? 0) + ceiling > budget) throw new ConvexError('The testing AI budget is fully reserved. Existing ideas remain available.');
    if (ledger) await ctx.db.patch(ledger._id, {
      reservedMicros: ledger.reservedMicros + ceiling
    });else await ctx.db.insert('testingBudget', {
      key: 'initial-14-days',
      reservedMicros: ceiling
    });
    const lease = crypto.randomUUID();
    await ctx.db.patch(invite._id, {
      day,
      calls: calls + (kind === 'generation' ? 1 : 0),
      recognitionCalls: recognitionCalls + (kind === 'recognition' ? 1 : 0),
      activeUntil: now + 90000,
      lease
    });
    return {
      id: invite._id,
      lease
    };
  }
});
export const release = internalMutation({
  args: {
    id: v.id('testingInvites'),
    lease: v.string()
  },
  returns: v.null(),
  handler: async (ctx, {
    id,
    lease
  }) => {
    const invite = await ctx.db.get(id);
    if (invite?.lease === lease) await ctx.db.patch(id, {
      activeUntil: 0,
      lease: undefined
    });
    return null;
  }
});
