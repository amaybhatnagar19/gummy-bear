import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { toyStatus, cadence, feedback } from '../shared/v1';
import { activityValidator } from './activityResponses';
export default defineSchema({
  privacyConsents: defineTable({owner:v.id('users'),scope:v.union(v.literal('privacy'),v.literal('phone'),v.literal('future_whatsapp')),version:v.string(),granted:v.boolean(),updatedAt:v.number()}).index('by_owner',['owner']).index('by_owner_scope',['owner','scope']),
  deletionRequests: defineTable({owner:v.id('users'),scope:v.union(v.literal('family'),v.literal('account')),status:v.union(v.literal('deleting_family'),v.literal('finished_family'),v.literal('awaiting_policy')),stage:v.number(),deletedCount:v.number(),requestedAt:v.number(),updatedAt:v.number()}).index('by_owner_scope',['owner','scope']),
  children: defineTable({owner:v.id('users'),label:v.string(),age:v.number(),dob:v.optional(v.string()),interests:v.array(v.string())}).index('by_owner',['owner']),
  toys: defineTable({owner:v.id('users'),name:v.string(),status:toyStatus,outgrown:v.boolean(),damaged:v.boolean(),unsafe:v.boolean(),children:v.array(v.id('children')),uploadedAt:v.optional(v.number()),acquiredAt:v.optional(v.number()),suppressedUntil:v.optional(v.number()),reminderShownAt:v.optional(v.number())}).index('by_owner',['owner']),
  activities: defineTable({owner:v.id('users'),activity:activityValidator,toyIds:v.optional(v.array(v.id('toys'))),children:v.array(v.id('children')),age:v.number(),suggestedAt:v.number(),saved:v.boolean(),favorite:v.boolean(),intended:v.boolean(),triedAt:v.optional(v.number()),feedback:v.optional(feedback)}).index('by_owner',['owner']),
  attempts: defineTable({owner:v.id('users'),activityId:v.id('activities'),at:v.number(),feedback:v.optional(feedback)}).index('by_owner',['owner']).index('by_activity',['owner','activityId']),
  preferences: defineTable({owner:v.id('users'),reminders:cadence,emailOptIn:v.boolean(),photoRetention:v.literal('none'),consentVersion:v.string(),phone:v.optional(v.string()),phoneConsent:v.optional(v.boolean()),futureWhatsAppOptIn:v.optional(v.boolean())}).index('by_owner',['owner']),
  guestProgress: defineTable({inviteId:v.optional(v.id('testingInvites')),digest:v.string(),expiresAt:v.number(),privacyVersion:v.optional(v.string()),acknowledgedAt:v.optional(v.number()),claimedBy:v.optional(v.id('users')),activities:v.array(activityValidator),age:v.number()}).index('by_digest',['digest']).index('by_expiry',['expiresAt']).index('by_claimed',['claimedBy']).index('by_invite',['inviteId']),
  testingBudget: defineTable({key:v.string(),reservedMicros:v.number()}).index('by_key',['key']),
  testingInvites: defineTable({owner:v.optional(v.id('users')),capabilityDigest:v.optional(v.string()),expiresAt:v.number(),daily:v.number(),day:v.string(),calls:v.number(),recognitionCalls:v.optional(v.number()),activeUntil:v.number(),lease:v.optional(v.string())}).index('by_owner',['owner']).index('by_digest',['capabilityDigest']),

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
