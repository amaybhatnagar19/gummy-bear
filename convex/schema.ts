import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
export default defineSchema({
  ...authTables,
  users: defineTable({ ...authTables.users.validator.fields,
    paidFrom: v.optional(v.number()), paidUntil: v.optional(v.number()),
    bonusGranted: v.optional(v.boolean()), bonusUsed: v.optional(v.boolean()),
  }).index("email", ["email"]).index("phone", ["phone"]),
  visitors: defineTable({ token: v.string(), uses: v.number() }).index("by_token", ["token"]),
  accessReservations: defineTable({ visitorId: v.optional(v.id("visitors")), userId: v.optional(v.id("users")), kind: v.union(v.literal("trial"), v.literal("bonus")) }),
  aiQuota: defineTable({ key: v.string(), timestamps: v.array(v.number()) }).index("by_key", ["key"]),
});
