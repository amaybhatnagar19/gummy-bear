import { action } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
export const discover = action({
  args: { image: v.string(), age: v.number(), visitorToken: v.optional(v.string()) },
  returns: v.object({ toys: v.array(v.string()), ideas: v.array(v.object({ title: v.string(), instructions: v.string() })), raw: v.string() }),
  handler: async (ctx, { visitorToken, ...photo }): Promise<{ toys: string[]; ideas: { title: string; instructions: string }[]; raw: string }> => {
    const reservation = await ctx.runMutation(internal.access.reserve, { visitorToken });
    try {
      const result = await ctx.runAction(internal.play.generate, photo);
      if (reservation) await ctx.runMutation(internal.access.finish, { reservation, success: result.toys.length > 0 });
      return result;
    } catch (error) {
      if (reservation) await ctx.runMutation(internal.access.finish, { reservation, success: false });
      throw error;
    }
  },
});
