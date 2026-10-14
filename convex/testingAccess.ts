import { verifiedNormalCosts } from './boundedProvider';
import { internalQuery, internalMutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { v, ConvexError } from 'convex/values';
import { requireCollectionConsent, requireNoDeletion } from './privacyAccess';
import { requireLiveAI } from './v1Policy';
import { requireEvaluation } from './evaluationPolicy';
import { EVALUATION_MAX_MICROS, EVALUATION_RESERVE_MICROS, effectiveReservedMicros } from '../shared/aiEvaluation';
export async function inviteDigest(value: string) {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new ConvexError('Use the testing invitation supplied by the owner.');
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
export const invite = internalMutation({
  args: {
    owner: v.optional(v.id('users')),
    evaluation: v.optional(v.boolean())
  },
  returns: v.object({
    id: v.id('testingInvites'),
    capability: v.string()
  }),
  handler: async (ctx, {
    owner, evaluation
  }) => {
    if (evaluation) requireEvaluation(); else requireLiveAI();
    if (evaluation && owner) throw new ConvexError('Evaluation invitations are for synthetic operator slots, not parent accounts.');
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
    evaluation: v.optional(v.boolean()),
    kind: v.optional(v.union(v.literal('recognition'), v.literal('generation')))
  },
  returns: v.object({
    id: v.id('testingInvites'),
    lease: v.string()
  }),
  handler: async (ctx, {
    kind = 'generation',
    invitation, evaluation
  }) => {
    if (evaluation) requireEvaluation(); else requireLiveAI();
    const user = await getAuthUserId(ctx);
    if (evaluation && user) throw new ConvexError('Evaluation uses synthetic operator invitations, not parent accounts.');
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
      ceiling = evaluation ? EVALUATION_RESERVE_MICROS : Number(process.env.V1_AI_REQUEST_CEILING_MICROS);
    if (!Number.isSafeInteger(budget) || !Number.isSafeInteger(ceiling) || budget <= 0 || budget > EVALUATION_MAX_MICROS || ceiling <= 0 || ceiling > budget) throw new ConvexError('A hard AI spending budget up to the approved ten dollars needs verification before live testing.');
    let ledger = await ctx.db.query('testingBudget').withIndex('by_key', q => q.eq('key', 'initial-14-days')).unique();
    if (ledger?.haltReason) throw new ConvexError('Testing AI is paused because evaluation usage or safety needs review.');
    if (ledger?.evaluationLease && (ledger.evaluationActiveUntil ?? 0) <= now) throw new ConvexError('Testing AI is paused: an expired evaluation reservation needs usage review.');
    if (evaluation && ledger?.evaluationLease) throw new ConvexError('One evaluation request is already running. Please wait.');
    if (effectiveReservedMicros(ledger) + ceiling > budget) throw new ConvexError('The testing AI budget is fully reserved. Existing ideas remain available.');
    if (ledger) await ctx.db.patch(ledger._id, {
      reservedMicros: ledger.reservedMicros + ceiling
    });else await ctx.db.insert('testingBudget', {
      key: 'initial-14-days',
      reservedMicros: ceiling
    });
    const lease = crypto.randomUUID();
    if (evaluation) {
      ledger = await ctx.db.query('testingBudget').withIndex('by_key', q => q.eq('key', 'initial-14-days')).unique();
      await ctx.db.patch(ledger!._id, {evaluationLease:lease,evaluationActiveUntil:now+90000});
    }
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
    const budget = await ctx.db.query('testingBudget').withIndex('by_key', q => q.eq('key','initial-14-days')).unique();
    if (budget?.evaluationLease === lease) await ctx.db.patch(budget._id, {evaluationLease:undefined,evaluationActiveUntil:undefined});
    return null;
  }
});

const usageLease={id:v.id('testingInvites'),lease:v.string()};
async function activeUsageLease(ctx:import('./_generated/server').QueryCtx,args:{id:import('./_generated/dataModel').Id<'testingInvites'>;lease:string}){
 requireLiveAI();verifiedNormalCosts();const invite=await ctx.db.get(args.id);const user=await getAuthUserId(ctx);
 if(!invite||invite.lease!==args.lease||invite.activeUntil<=Date.now()||invite.expiresAt<=Date.now()||invite.owner&&invite.owner!==user)throw new ConvexError('Testing request lease is unavailable.');
 if(user)await requireCollectionConsent(ctx,user);
 const budget=await ctx.db.query('testingBudget').withIndex('by_key',q=>q.eq('key','initial-14-days')).unique();
 if(!budget||budget.haltReason||effectiveReservedMicros(budget)>Number(process.env.V1_AI_BUDGET_MICROS))throw new ConvexError('Testing budget requires review.');
 return budget;
}
export const verifyLease=internalQuery({args:usageLease,returns:v.null(),handler:async(ctx,args)=>{await activeUsageLease(ctx,args);return null;}});
export const recordUsage=internalMutation({args:{...usageLease,modelEstimateMicros:v.number()},returns:v.null(),handler:async(ctx,args)=>{
 const row=await activeUsageLease(ctx,args);if(!Number.isSafeInteger(args.modelEstimateMicros)||args.modelEstimateMicros<0||args.modelEstimateMicros>Number(process.env.V1_AI_REQUEST_CEILING_MICROS))throw new ConvexError('Usage estimate needs review.');
 await ctx.db.patch(row._id,{usageEstimatedMicros:(row.usageEstimatedMicros??0)+args.modelEstimateMicros});return null;
}});
export const haltUsage=internalMutation({args:usageLease,returns:v.null(),handler:async(ctx,args)=>{
 if(process.env.CONVEX_CLOUD_URL!==(await import('../shared/testingDeployment.js')).testingBoundary.convexUrl)throw new ConvexError('Usage accounting is testing-only.');
 const invite=await ctx.db.get(args.id);if(!invite)throw new ConvexError('Testing invitation unavailable.');
 const row=await ctx.db.query('testingBudget').withIndex('by_key',q=>q.eq('key','initial-14-days')).unique();if(row)await ctx.db.patch(row._id,{haltReason:'usage_uncertain'});return null;
}});
