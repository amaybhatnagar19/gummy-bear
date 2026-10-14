import { testingBoundary } from '../shared/testingDeployment.js';
import { action } from './_generated/server';
import { internal } from './_generated/api';
import { ConvexError, v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import type { LegacyResult, StructuredResult } from '../shared/activityContract';
import { structuredResultValidator, legacyResultValidator, legacyResponse, limitationMessage } from './activityResponses';
export const discover = action({
  args: { image: v.string(), age: v.number(), visitorToken: v.optional(v.string()), responseVersion: v.optional(v.literal(2)) },
  returns: v.union(legacyResultValidator, structuredResultValidator),
  handler: async (ctx, { visitorToken, responseVersion, ...photo }): Promise<LegacyResult | StructuredResult> => {
    // Preserve production's existing access contract; deny legacy entry in testing
    // so it cannot evade the new invitation, concurrency and monetary gates.
    if(process.env.CONVEX_CLOUD_URL===testingBoundary.convexUrl) throw new ConvexError('Use the current V1 testing flow. Legacy AI requests are disabled in this isolated deployment.');
    const reservation = await ctx.runMutation(internal.access.reserve, { visitorToken });
    let run: Id<'photoRuns'> | undefined;
    try {
      run = await ctx.runMutation(internal.analytics.startRun, { visitorToken });
      const result = await ctx.runAction(internal.play.generate, photo);
      const success = result.activities.length > 0;
      await ctx.runMutation(internal.analytics.completeRun, {run,succeeded:success});
      if (reservation) await ctx.runMutation(internal.access.finish, { reservation, success });
      if (responseVersion === 2) return result;
      // Keep the old no-toys shape; older clients already have its recovery UI.
      if (!success && result.toys.length) throw new ConvexError(limitationMessage);
      return legacyResponse(result);
    } catch (error) {
      if (run) await ctx.runMutation(internal.analytics.completeRun, {run,succeeded:false});
      if (reservation) await ctx.runMutation(internal.access.finish, { reservation, success: false });
      throw error;
    }
  },
});
