import { verifiedNormalCosts } from './boundedProvider';
import { getAuthUserId } from '@convex-dev/auth/server';
import { action } from './_generated/server';
import { internal, api } from './_generated/api';
import { v, ConvexError } from 'convex/values';
import { requireLiveAI } from './v1Policy';
import { activityValidator, structuredResultValidator, limitationResult } from './activityResponses';
import type {Id} from './_generated/dataModel';
import type { StructuredResult } from '../shared/activityContract';
export const generate = action({
  args: {
    invitation: v.optional(v.string()),
    image: v.string(),
    age: v.number(),
    confirmedToys: v.array(v.string()),
    visitorToken: v.optional(v.string()),
    previous: v.array(activityValidator),
    children: v.array(v.id('children')),
    toyIds: v.optional(v.array(v.id('toys')))
  },
  returns: v.object({...structuredResultValidator.fields,activityIds:v.array(v.id('activities'))}),
  handler: async (ctx, args): Promise<StructuredResult & {activityIds:Id<'activities'>[]}> => {
    requireLiveAI();
    verifiedNormalCosts();
    if(args.previous.length>100)throw new ConvexError('Choose fewer previous ideas.');
    const lease = await ctx.runMutation(internal.testingAccess.reserve, {
      kind: 'generation',
      invitation: args.invitation
    });
    let reservation;
    try {
      const user = await getAuthUserId(ctx);
      // A signed-in invited tester uses the separately bounded testing grant.
      // It never edits bonus, paid or production access records. Guest trial
      // reservations still consume/refund only successful first-value turns.
      if(!user) reservation = await ctx.runMutation(internal.access.reserve, {visitorToken:args.visitorToken});
      const state = user ? await ctx.runQuery(api.family.state, {}) : {
        children: [],
        toys: [],
        activities: []
      };
      if (args.children.length > 10 || new Set(args.children).size !== args.children.length) throw new ConvexError('Choose up to ten children.');
      const selected = args.children.map(id => state.children.find(c => c._id === id));
      if (selected.some(c => !c) || selected.length && args.age !== Math.min(...selected.map(c => c!.age))) throw new ConvexError('Choose your youngest child’s age.');
      if (state.toys.some(toy => args.confirmedToys.includes(toy.name) && (toy.unsafe || toy.damaged || ['donated', 'removed'].includes(toy.status)))) throw new ConvexError('One of these toys is marked unavailable or unsuitable. Review its condition and ownership before using it.');
      for (const id of args.toyIds ?? []) {
        const toy = state.toys.find(t => t._id === id);
        if (!toy || !args.confirmedToys.includes(toy.name) || toy.damaged || toy.unsafe || ['donated', 'removed'].includes(toy.status)) throw new ConvexError('This toy is unavailable or unsuitable.');
      }
      const interests = [...new Set(selected.flatMap(c => c!.interests))].slice(0, 8);
      const previous = [...state.activities.map(a => a.activity), ...args.previous].slice(-600);
      let result = await ctx.runAction(internal.play.generate, {
        image: args.image,
        age: args.age,
        confirmedToys: args.confirmedToys,
        previous,
        interests, usageLease:lease
      });
      let activityIds:Id<'activities'>[]=[];
      if(user&&result.activities.length){const stored=await ctx.runMutation(internal.family.recordGenerated,{activities:result.activities,age:args.age,children:args.children,toyIds:args.toyIds});activityIds=stored.ids;result=stored.activities.length?{...result,activities:stored.activities}:limitationResult(args.confirmedToys,'repetition');}
      if (reservation) await ctx.runMutation(internal.access.finish, {
        reservation,
        success: result.activities.length > 0
      });
      return {...result,activityIds};
    } catch (error) {
      if (reservation) await ctx.runMutation(internal.access.finish, {
        reservation,
        success: false
      });
      throw error;
    } finally {
      await ctx.runMutation(internal.testingAccess.release, lease);
    }
  }
});
