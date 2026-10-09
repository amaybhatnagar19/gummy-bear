import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  aiQuota: defineTable({ key: v.string(), timestamps: v.array(v.number()) }).index("by_key", ["key"]),
});
