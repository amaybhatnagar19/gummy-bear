import { action } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
export const discover = action({
  args: { image: v.string(), age: v.number(), visitorToken: v.optional(v.string()) },
  returns: v.object({ toys: v.array(v.string()), ideas: v.array(v.object({ title: v.string(), instructions: v.string() })), raw: v.string() }),
  handler: async (ctx, { visitorToken, ...photo }): Promise<{ toys: string[]; ideas: { title: string; instructions: string }[]; raw: string }> => {
    const reservation = await ctx.runMutation(internal.access.reserve, { visitorToken });
    let run: Id<'photoRuns'> | undefined;
    try {
      run = await ctx.runMutation(internal.analytics.startRun, { visitorToken });
      const result = await ctx.runAction(internal.play.generate, photo);
      await ctx.runMutation(internal.analytics.completeRun, {run,succeeded:result.toys.length>0});
      if (reservation) await ctx.runMutation(internal.access.finish, { reservation, success: result.toys.length > 0 });
      return result;
    } catch (error) {
      if (run) await ctx.runMutation(internal.analytics.completeRun, {run,succeeded:false});
      if (reservation) await ctx.runMutation(internal.access.finish, { reservation, success: false });
      throw error;
    }
  },
});
