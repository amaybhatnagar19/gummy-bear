import { query } from './_generated/server';
import { v } from 'convex/values';
import { dataPolicyOpen } from './v1Policy';
import { testingBoundary } from '../shared/testingDeployment.js';
export const status=query({args:{},returns:v.object({personalData:v.boolean(),google:v.boolean(),emailOtp:v.boolean(),emailReminders:v.boolean()}),handler:async()=>({personalData:dataPolicyOpen(),google:process.env.CONVEX_URL===testingBoundary.convexUrl&&dataPolicyOpen()&&process.env.V1_GOOGLE_AUTH_APPROVED==='true'&&Boolean(process.env.AUTH_GOOGLE_ID&&process.env.AUTH_GOOGLE_SECRET),emailOtp:false,emailReminders:false})});
