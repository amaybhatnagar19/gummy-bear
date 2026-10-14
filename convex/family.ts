import { query, mutation, internalMutation } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { authenticatedOwner, requireCollectionConsent, recordConsent, requireTestingPrivacyOperation, activeDeletion } from './privacyAccess';
import { requestDeletion } from './privacy';
import { PRIVACY_VERSION } from '../shared/privacy';
import { ConvexError, v } from 'convex/values';
import { requireDataPolicy, dataPolicyOpen } from './v1Policy';
import { cleanText, childAge, toyStatus, cadence, feedback, reminderEligible, donationEligible, ageFromBirthDate } from '../shared/v1';
import type {Activity} from '../shared/activityContract';
import { activityValidator, validateAndFilterActivities } from './activityResponses';
import { activitiesRepeat } from './activityDuplicates';
async function owner(ctx: QueryCtx | MutationCtx, writing = true) {
  const id = await authenticatedOwner(ctx);
  if (writing) await requireCollectionConsent(ctx, id);
  return id;
}
async function childIds(ctx: MutationCtx, user: Id<'users'>, ids: Id<'children'>[]) {
  if (ids.length > 10 || new Set(ids).size !== ids.length) throw new ConvexError('Choose up to ten children.');
  for (const id of ids) {
    const item = await ctx.db.get(id);
    if (!item || item.owner !== user) throw new ConvexError('This child profile is unavailable.');
  }
}
export const state = query({
  args: {},
  returns: v.any(),
  handler: async ctx => {
    const user = await owner(ctx, false);
    const consent = await ctx.db.query('privacyConsents').withIndex('by_owner_scope', q => q.eq('owner', user).eq('scope', 'privacy')).unique();
    return {
      ownerId:user,
      policyOpen: dataPolicyOpen() && consent?.version === PRIVACY_VERSION && consent.granted && !await activeDeletion(ctx, user),
      children: (await ctx.db.query('children').withIndex('by_owner', q => q.eq('owner', user)).take(20)).map(c=>({...c,age:c.dob?ageFromBirthDate(c.dob,Date.now()):c.age})),
      toys: await ctx.db.query('toys').withIndex('by_owner', q => q.eq('owner', user)).take(200),
      activities: await ctx.db.query('activities').withIndex('by_owner', q => q.eq('owner', user)).order('desc').take(500),
      attempts: await ctx.db.query('attempts').withIndex('by_owner',q=>q.eq('owner',user)).order('desc').take(500),
      preferences: await ctx.db.query('preferences').withIndex('by_owner', q => q.eq('owner', user)).unique()
    };
  }
});
export const saveChild = mutation({
  args: {
    id: v.optional(v.id('children')),
    label: v.string(),
    age: v.number(),
    dob: v.optional(v.string()),
    interests: v.optional(v.array(v.string()))
  },
  returns: v.id('children'),
  handler: async (ctx, args) => {
    requireDataPolicy();
    const user = await owner(ctx);
    childAge(args.age);
    if (args.dob) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(args.dob) || !Number.isFinite(Date.parse(args.dob)) || Date.parse(args.dob) > Date.now() || new Date(args.dob).toISOString().slice(0, 10) !== args.dob) throw new ConvexError('Choose a valid birth date.');
      const date = new Date(args.dob),
        now = new Date();
      const age = now.getUTCFullYear() - date.getUTCFullYear() - (now.getUTCMonth() < date.getUTCMonth() || now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate() ? 1 : 0);
      if (age !== args.age) throw new ConvexError('The birth date and age do not match.');
    }
    if ((args.interests ?? []).length > 8) throw new ConvexError('Choose up to eight interests.');
    const value = {
      owner: user,
      label: cleanText(args.label, 40),
      age: args.age,
      dob: args.dob,
      interests: (args.interests ?? []).map(x => cleanText(x, 40))
    };
    if (args.id) {
      const old = await ctx.db.get(args.id);
      if (old?.owner !== user) throw new ConvexError('This child profile is unavailable.');
      await ctx.db.patch(args.id, value);
      return args.id;
    }
    if ((await ctx.db.query('children').withIndex('by_owner', q => q.eq('owner', user)).take(20)).length >= 10) throw new ConvexError('You can add up to ten children.');
    return ctx.db.insert('children', value);
  }
});
export const saveToy = mutation({
  args: {
    id: v.optional(v.id('toys')),
    name: v.string(),
    status: toyStatus,
    outgrown: v.boolean(),
    damaged: v.boolean(),
    unsafe: v.boolean(),
    children: v.array(v.id('children')),
    uploadedAt: v.optional(v.number()),
    acquiredAt: v.optional(v.number()),
    duplicateConfirmed: v.optional(v.boolean())
  },
  returns: v.id('toys'),
  handler: async (ctx, args) => {
    requireDataPolicy();
    const user = await owner(ctx);
    await childIds(ctx, user, args.children);
    if(args.uploadedAt!==undefined&&(!Number.isFinite(args.uploadedAt)||args.uploadedAt<0||args.uploadedAt>Date.now()+60000))throw new ConvexError('This photo date is invalid.');
    if (args.acquiredAt !== undefined && (!Number.isFinite(args.acquiredAt) || args.acquiredAt < 0 || args.acquiredAt > Date.now())) throw new ConvexError('Choose a past acquisition date.');
    const name = cleanText(args.name);
    const all = await ctx.db.query('toys').withIndex('by_owner', q => q.eq('owner', user)).take(201);
    if (!args.id && all.length >= 200) throw new ConvexError('Your collection has reached the testing limit.');
    if (!args.duplicateConfirmed && all.some(t => t._id !== args.id && t.name.toLowerCase() === name.toLowerCase())) throw new ConvexError('A toy with this name already exists. Confirm that this is another toy.');
    const {
      id,
      duplicateConfirmed,
      ...rest
    } = args;
    const value = {
      ...rest,
      name,
      owner: user,
      acquiredAt: args.acquiredAt
    };
    if (id) {
      const old = await ctx.db.get(id);
      if (old?.owner !== user) throw new ConvexError('This toy is unavailable.');
      await ctx.db.patch(id, {...value,uploadedAt:args.uploadedAt??old.uploadedAt});
      return id;
    }
    return ctx.db.insert('toys', {
      ...value,
      uploadedAt: args.uploadedAt
    });
  }
});
const suggestionArgs={activities:v.array(activityValidator),age:v.number(),children:v.array(v.id('children')),toyIds:v.optional(v.array(v.id('toys')))};
async function persistSuggestions(ctx:MutationCtx,args:{activities:Activity[];age:number;children:Id<'children'>[];toyIds?:Id<'toys'>[]}){
    requireDataPolicy();
    const user = await owner(ctx);
    await childIds(ctx, user, args.children);
    childAge(args.age);
    if ((args.toyIds?.length ?? 0) > 12) throw new ConvexError('Choose up to twelve toys.');
    for (const id of args.toyIds ?? []) {
      const toy = await ctx.db.get(id);
      if (toy?.owner !== user || toy.unsafe || toy.damaged || ['donated', 'removed'].includes(toy.status)) throw new ConvexError('This toy is unavailable or unsuitable.');
      if (!args.activities.some(a => a.toyReferences.includes(toy.name))) throw new ConvexError('Confirm the toy reference before saving.');
    }
    if (args.children.length) {
      const selected = await Promise.all(args.children.map(id => ctx.db.get(id)));
      if (args.age !== Math.min(...selected.map(c => c!.dob?ageFromBirthDate(c!.dob,Date.now()):c!.age))) throw new ConvexError('Use the youngest child’s age for shared play.');
    }
    const toys = [...new Set(args.activities.flatMap(a => a.toyReferences))];
    const accepted = validateAndFilterActivities({
      toys,
      activities: args.activities
    }, args.age).activities;
    const history = await ctx.db.query('activities').withIndex('by_owner', q => q.eq('owner', user)).order('desc').take(501);
    if (history.length + accepted.length > 500) throw new ConvexError('Your activity collection has reached the testing limit.');
    const ids: Id<'activities'>[] = [];
    const persisted:Activity[]=[];
    for (const activity of accepted) {
      if (!history.some(h=>activitiesRepeat(h.activity,activity))) {
        ids.push(await ctx.db.insert('activities', {
          owner: user,
          activity,
          toyIds: args.toyIds ?? [],
          children: args.children,
          age: args.age,
          suggestedAt: Date.now(),
          saved: false,
          favorite: false,
          intended: false
        }));
        persisted.push(activity);
        history.push({
          activity
        } as typeof history[number]);
      }
    }
    return {ids,activities:persisted};
}
export const recordSuggestions=mutation({args:suggestionArgs,returns:v.array(v.id('activities')),handler:async(ctx,args)=>(await persistSuggestions(ctx,args)).ids});
export const recordGenerated=internalMutation({args:suggestionArgs,returns:v.object({ids:v.array(v.id('activities')),activities:v.array(activityValidator)}),handler:persistSuggestions});
export const updateActivity = mutation({
  args: {
    id: v.id('activities'),
    saved: v.optional(v.boolean()),
    favorite: v.optional(v.boolean()),
    intended: v.optional(v.boolean()),
    tried: v.optional(v.boolean()),
    feedback: v.optional(feedback)
  },
  returns: v.null(),
  handler: async (ctx, {
    id,
    tried,
    feedback: rating,
    ...patch
  }) => {
    requireDataPolicy();
    const user = await owner(ctx);
    const activity = await ctx.db.get(id);
    if (activity?.owner !== user) throw new ConvexError('This activity is unavailable.');
    if (rating && !tried && !activity.triedAt) throw new ConvexError('Report trying the activity before giving feedback.');
    if (rating && !tried) {
      const last = await ctx.db.query('attempts').withIndex('by_activity', q => q.eq('owner', user).eq('activityId', id)).order('desc').first();
      if (last) await ctx.db.patch(last._id, {
        feedback: rating
      });
    }
    if (tried) {
      if ((await ctx.db.query('attempts').withIndex('by_owner', q => q.eq('owner', user)).take(501)).length >= 500) throw new ConvexError('Your attempt history has reached the testing limit.');
      const now = Date.now();
      await ctx.db.insert('attempts', {
        owner: user,
        activityId: id,
        at: now,
        feedback: rating
      });
      await ctx.db.patch(id, {
        triedAt: now
      });
    }
    if (rating) await ctx.db.patch(id, {
      feedback: rating
    });
    await ctx.db.patch(id, patch);
    return null;
  }
});
export const savePreferences = mutation({
  args: {
    reminders: cadence,
    emailOptIn: v.boolean()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireDataPolicy();
    const user = await owner(ctx);
    if (args.emailOptIn) throw new ConvexError('Email reminders are not connected yet. In-app reminders are available.');
    const old = await ctx.db.query('preferences').withIndex('by_owner', q => q.eq('owner', user)).unique();
    const value = {
      owner: user,
      ...args,
      photoRetention: 'none' as const,
      consentVersion: PRIVACY_VERSION
    };
    if (old) await ctx.db.patch(old._id, value);else await ctx.db.insert('preferences', value);
    return null;
  }
});
async function eligibleReminders(ctx:QueryCtx|MutationCtx,user:Id<'users'>,manual=false){
 const pref=await ctx.db.query('preferences').withIndex('by_owner',q=>q.eq('owner',user)).unique();
 if(!manual&&(!pref||pref.reminders==='off'))return [];
 const toys=await ctx.db.query('toys').withIndex('by_owner',q=>q.eq('owner',user)).take(200);
 const history=await ctx.db.query('activities').withIndex('by_owner',q=>q.eq('owner',user)).take(500);
 const period=(pref?.reminders==='monthly'?30:7)*86400000,now=Date.now();
 return toys.filter(t=>reminderEligible(t,now)&&(manual||!t.reminderShownAt||t.reminderShownAt<=now-period)&&!history.some(a=>a.toyIds?.includes(t._id)&&a.triedAt&&a.triedAt>now-period)).slice(0,5).map(t=>({...t,canDonate:donationEligible(t)}));
}
export const reminders=query({args:{manual:v.optional(v.boolean())},returns:v.any(),handler:async(ctx,{manual})=>eligibleReminders(ctx,await owner(ctx,false),manual)});
export const claimReminders=mutation({args:{},returns:v.any(),handler:async ctx=>{requireDataPolicy();const user=await owner(ctx);const rows=await eligibleReminders(ctx,user);for(const row of rows)await ctx.db.patch(row._id,{reminderShownAt:Date.now()});return rows;}});
export const dismissReminder = mutation({
  args: {
    id: v.id('toys')
  },
  returns: v.null(),
  handler: async (ctx, {
    id
  }) => {
    requireDataPolicy();
    const user = await owner(ctx);
    const toy = await ctx.db.get(id);
    if (toy?.owner !== user) throw new ConvexError('This toy is unavailable.');
    const pref = await ctx.db.query('preferences').withIndex('by_owner', q => q.eq('owner', user)).unique();
    const days = pref?.reminders === 'monthly' ? 30 : 7;
    await ctx.db.patch(id, {
      suppressedUntil: Date.now() + days * 86400000
    });
    return null;
  }
});
export const deleteChild = mutation({
  args: {
    id: v.id('children')
  },
  returns: v.null(),
  handler: async (ctx, {
    id
  }) => {
    requireTestingPrivacyOperation();
    const user = await owner(ctx, false);
    const child = await ctx.db.get(id);
    if (child?.owner !== user) throw new ConvexError('This child profile is unavailable.');
    for (const table of ['toys', 'activities'] as const) {
      const rows = await ctx.db.query(table).withIndex('by_owner', q => q.eq('owner', user)).take(501);
      for (const row of rows) if (row.children.includes(id)) await ctx.db.patch(row._id, {
        children: row.children.filter(x => x !== id)
      });
    }
    await ctx.db.delete(id);
    return null;
  }
});
// Backward-compatible entry; new UI uses the explicit progress response.
export const deleteFamilyData = mutation({
  args: { confirmation: v.literal('DELETE FAMILY DATA') }, returns: v.null(),
  handler: async ctx => {
    const result = await requestDeletion(ctx, 'family');
    // Throw rolls back this entire transaction. Legacy callers must never
    // mistake the old null result for a partially completed removal.
    if (result.status !== 'finished_family') throw new ConvexError('Use the progress-aware family removal in Profile. Removal has not been confirmed by this legacy request.');
    return null;
  }
});
export const deleteToy = mutation({
  args: { id: v.id('toys'), confirmation: v.literal('DELETE TOY') }, returns: v.null(),
  handler: async (ctx, { id }) => {
    requireTestingPrivacyOperation(); const user = await owner(ctx, false);
    const toy = await ctx.db.get(id); if (!toy) return null;
    if (toy.owner !== user) throw new ConvexError('This toy is unavailable.');
    const activities = await ctx.db.query('activities').withIndex('by_owner', q => q.eq('owner', user)).take(501);
    if (activities.length > 500) throw new ConvexError('Use the reviewed family-data removal for this large collection.');
    for (const activity of activities) if (activity.toyIds?.includes(id)) await ctx.db.patch(activity._id, { toyIds: activity.toyIds.filter(toy => toy !== id) });
    await ctx.db.delete(id); return null;
  }
});
export const deleteActivity = mutation({
  args: { id: v.id('activities'), confirmation: v.literal('DELETE ACTIVITY') }, returns: v.null(),
  handler: async (ctx, { id }) => {
    requireTestingPrivacyOperation(); const user = await owner(ctx, false);
    const activity = await ctx.db.get(id); if (!activity) return null;
    if (activity.owner !== user) throw new ConvexError('This activity is unavailable.');
    const attempts = await ctx.db.query('attempts').withIndex('by_activity', q => q.eq('owner', user).eq('activityId', id)).take(501);
    if (attempts.length > 500) throw new ConvexError('Use the reviewed family-data removal for this large history.');
    for (const attempt of attempts) await ctx.db.delete(attempt._id);
    await ctx.db.delete(id); return null;
  }
});
export const saveContact = mutation({
  args: {
    phone: v.optional(v.string()),
    phoneConsent: v.boolean(),
    futureWhatsAppOptIn: v.boolean()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireDataPolicy();
    const user = await owner(ctx);
    if (args.phone && (!/^\+[1-9]\d{7,14}$/.test(args.phone) || !args.phoneConsent)) throw new ConvexError('Use an international phone number and explicitly agree to store it.');
    if (args.futureWhatsAppOptIn && !args.phone) throw new ConvexError('An optional phone number is needed for future messaging consent.');
    const old = await ctx.db.query('preferences').withIndex('by_owner', q => q.eq('owner', user)).unique();
    if (old) await ctx.db.patch(old._id, {
      ...args,
      phone: args.phone,
      phoneConsent: Boolean(args.phone && args.phoneConsent)
    });else await ctx.db.insert('preferences', {
      owner: user,
      reminders: 'off',
      emailOptIn: false,
      photoRetention: 'none',
      consentVersion: PRIVACY_VERSION,
      ...args,
      phoneConsent: Boolean(args.phone && args.phoneConsent)
    });
    await recordConsent(ctx, user, 'phone', Boolean(args.phone && args.phoneConsent));
    await recordConsent(ctx, user, 'future_whatsapp', args.futureWhatsAppOptIn);
    return null;
  }
});
