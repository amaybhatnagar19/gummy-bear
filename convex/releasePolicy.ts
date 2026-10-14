import { ConvexError } from 'convex/values';
import { testingBoundary } from '../shared/testingDeployment.js';
// New production activation cannot be enabled by testing flags or provider keys.
export function requireGenerationRelease() {
  if (process.env.CONVEX_CLOUD_URL !== testingBoundary.convexUrl) {
    throw new ConvexError('AI play ideas are paused in this release. No photo was processed and no play allowance was used.');
  }
}
export function requireSignupRelease(flow: unknown) {
  if (flow === 'signUp' && process.env.CONVEX_CLOUD_URL !== testingBoundary.convexUrl) {
    throw new ConvexError('New accounts are paused in this release. Existing email and password sign-in remains available.');
  }
}
