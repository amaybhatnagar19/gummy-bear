import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { testingBoundary } from '../shared/testingDeployment.js';
import { dataPolicyOpen } from './v1Policy';
import { preserveIdentity } from './authIdentity';
import { googleProvider } from './authProviders';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
const isolated = process.env.CONVEX_CLOUD_URL === testingBoundary.convexUrl;
const googleEnabled = isolated && dataPolicyOpen() && process.env.V1_GOOGLE_AUTH_APPROVED === 'true' && Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  callbacks: isolated ? { createOrUpdateUser: (ctx,args) => preserveIdentity(ctx as MutationCtx,{existingUserId:args.existingUserId as Id<'users'>|null,profile:args.profile}) } : undefined,
  providers: [...(googleEnabled ? [googleProvider()] : []), Password({ profile(params) {
    const email = String(params.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
    return { email };
  } })],
});
