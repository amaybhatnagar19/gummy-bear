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
  photoRuns: defineTable({ time: v.number(), visitorToken: v.string(), email: v.optional(v.string()), succeeded: v.boolean(), completed: v.boolean() }).index('by_time', ['time']),
  analyticsVisitors: defineTable({ token: v.string(), excluded: v.boolean() }).index('by_token', ['token']),
  paymentEvents: defineTable({ email: v.string(), paidFrom: v.number(), paidUntil: v.number() }).index('by_paidFrom', ['paidFrom']),
  analyticsSettings: defineTable({ key: v.string(), startedAt: v.number() }).index('by_key', ['key']),
  accessReservations: defineTable({ visitorId: v.optional(v.id("visitors")), userId: v.optional(v.id("users")), kind: v.union(v.literal("trial"), v.literal("bonus")) }),
  aiQuota: defineTable({ key: v.string(), timestamps: v.array(v.number()) }).index("by_key", ["key"]),
});
