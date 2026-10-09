import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { reserveCall } from "./rules";
export const reserve = internalMutation({ args: {}, returns: v.boolean(), handler: async (ctx) => {
  const row = await ctx.db.query("aiQuota").withIndex("by_key", q => q.eq("key", "global")).unique();
  const timestamps = reserveCall(row?.timestamps ?? [], Date.now());
  if (!timestamps) return false;
  if (row) await ctx.db.patch(row._id, { timestamps });
  else await ctx.db.insert("aiQuota", { key: "global", timestamps });
  return true;
}});
