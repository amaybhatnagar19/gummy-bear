import { defineTable } from 'convex/server';
import { v } from 'convex/values';
export const complimentaryGrants = defineTable({
  userId: v.id('users'), email: v.string(), previousPaidUntil: v.optional(v.number()),
  previousPaidFrom: v.optional(v.number()), newPaidUntil: v.number(), reason: v.string(),
  grantedAt: v.number(), administrator: v.string(), operationId: v.string(),
  revokedAt: v.optional(v.number()), revokedBy: v.optional(v.string()),
}).index('by_user', ['userId']).index('by_operation', ['operationId']);
