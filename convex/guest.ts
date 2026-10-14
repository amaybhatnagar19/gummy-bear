import { internal } from './_generated/api';
import { mutation, internalMutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { activityValidator, validateAndFilterActivities } from './activityResponses';
import { activitiesRepeat } from './activityDuplicates';
import { inviteDigest } from './testingAccess';
import { requireDataPolicy } from './v1Policy';
import { childAge } from '../shared/v1';
async function digest(capability: string) {
  if (!/^[a-f0-9]{64}$/.test(capability)) throw new ConvexError('This guest session cannot be linked.');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(capability));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export const retain = mutation({
  args: {
    capability: v.string(),
    invitation: v.string(),
    age: v.number(),
    activities: v.array(activityValidator)
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireDataPolicy();
    childAge(args.age);
    const inviteHash=await inviteDigest(args.invitation);
    const invite=await ctx.db.query('testingInvites').withIndex('by_digest',q=>q.eq('capabilityDigest',inviteHash)).unique();
    if(!invite||invite.expiresAt<=Date.now()||(invite.owner&&invite.owner!==await getAuthUserId(ctx)))throw new ConvexError('This testing invitation is unavailable.');
    const hash = await digest(args.capability);
    const existing = await ctx.db.query('guestProgress').withIndex('by_digest', q => q.eq('digest', hash)).unique();
    if (existing?.claimedBy) throw new ConvexError('This guest session has already been linked.');
    const toys = [...new Set(args.activities.flatMap(a => a.toyReferences))];
    const activities = validateAndFilterActivities({
      toys,
      activities: args.activities
    }, args.age).activities;
    const draft=await ctx.db.query('guestProgress').withIndex('by_invite',q=>q.eq('inviteId',invite._id)).order('desc').first();
    if(draft&&draft.digest!==hash){if(!draft.claimedBy&&draft.expiresAt>Date.now())throw new ConvexError('This invitation already has temporary work in another tab. Finish or clear that guest session first.');await ctx.db.delete(draft._id);}
    const data = {
      inviteId:invite._id,
      digest: hash,
      expiresAt: Date.now() + 86400000,
      age: args.age,
      activities
    };
    if (existing) await ctx.db.patch(existing._id, data);else await ctx.db.insert('guestProgress', data);
    return null;
  }
});
export const claim = mutation({
  args: {
    capability: v.string()
  },
  returns: v.number(),
  handler: async (ctx, {
    capability
  }) => {
    requireDataPolicy();
    const user = await getAuthUserId(ctx);
    if (!user || !await ctx.db.get(user)) throw new ConvexError('Sign in before linking your ideas.');
    const hash = await digest(capability);
    const guest = await ctx.db.query('guestProgress').withIndex('by_digest', q => q.eq('digest', hash)).unique();
    if (!guest || guest.expiresAt <= Date.now()) throw new ConvexError('These temporary guest ideas have expired.');
    if (guest.claimedBy) {
      if (guest.claimedBy !== user) throw new ConvexError('This guest session belongs to another account.');
      return 0;
    }
    if ((await ctx.db.query('guestProgress').withIndex('by_claimed', q => q.eq('claimedBy', user)).take(201)).length >= 200) throw new ConvexError('This account has reached its guest-link testing limit.');
    const existing = await ctx.db.query('activities').withIndex('by_owner', q => q.eq('owner', user)).take(501);
    if (existing.length + guest.activities.length > 500) throw new ConvexError('Your activity collection has reached the testing limit.');
    let linked=0;
    for (const activity of guest.activities) {if(existing.some(a=>activitiesRepeat(a.activity,activity)))continue;linked++;await ctx.db.insert('activities', {
      owner: user,
      activity,
      age: guest.age,
      children: [],
      suggestedAt: Date.now(),
      saved: false,
      favorite: false,
      intended: false
    });}

    await ctx.db.patch(guest._id, {
      claimedBy: user,
      activities: []
    });
    return linked;
  }
});
export const expire = internalMutation({
  args: {},
  returns: v.number(),
  handler: async ctx => {
    const rows = await ctx.db.query('guestProgress').withIndex('by_expiry', q => q.lt('expiresAt', Date.now())).take(100);
    for (const row of rows) await ctx.db.delete(row._id);
    if (rows.length === 100) await ctx.scheduler.runAfter(0, internal.guest.expire, {});
    return rows.length;
  }
});

export const discard = mutation({args:{capability:v.string()},returns:v.boolean(),handler:async(ctx,{capability})=>{const hash=await digest(capability);const record=await ctx.db.query('guestProgress').withIndex('by_digest',q=>q.eq('digest',hash)).unique();if(!record||record.claimedBy)return false;await ctx.db.delete(record._id);return true;}});
