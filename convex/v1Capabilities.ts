import { query } from './_generated/server';
import { v } from 'convex/values';
import { dataPolicyOpen } from './v1Policy';
import { testingBoundary } from '../shared/testingDeployment.js';
export const status = query({
  args: {},
  returns: v.object({
    isolatedTesting: v.boolean(),
    personalData: v.boolean(),
    liveAIReady: v.boolean(),
    google: v.boolean(),
    emailOtp: v.boolean(),
    emailReminders: v.boolean()
  }),
  handler: async () => ({
    isolatedTesting: process.env.CONVEX_CLOUD_URL===testingBoundary.convexUrl,
    personalData: dataPolicyOpen(),
    liveAIReady: dataPolicyOpen() && process.env.CONVEX_CLOUD_URL === testingBoundary.convexUrl && process.env.V1_PAID_AI_APPROVED === 'true' && Boolean(process.env.OPENAI_API_KEY) && Number.isSafeInteger(Number(process.env.V1_AI_BUDGET_MICROS)) && Number.isSafeInteger(Number(process.env.V1_AI_REQUEST_CEILING_MICROS)) && Number(process.env.V1_AI_BUDGET_MICROS)>0 && Number(process.env.V1_AI_REQUEST_CEILING_MICROS)>0 && Number(process.env.V1_AI_REQUEST_CEILING_MICROS)<=Number(process.env.V1_AI_BUDGET_MICROS),
    google: process.env.CONVEX_CLOUD_URL === testingBoundary.convexUrl && dataPolicyOpen() && process.env.V1_GOOGLE_AUTH_APPROVED === 'true' && Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    emailOtp: false,
    emailReminders: false
  })
});
