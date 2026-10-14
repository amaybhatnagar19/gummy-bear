import { ConvexError } from 'convex/values';
import { testingBoundary } from '../shared/testingDeployment.js';
import { PRIVACY_VERSION } from '../shared/privacy';
export function dataPolicyOpen() {
  return process.env.CONVEX_CLOUD_URL === testingBoundary.convexUrl && process.env.V1_DATA_POLICY_APPROVED === 'true' && process.env.V1_DATA_POLICY_VERSION === PRIVACY_VERSION;
}
export function requireDataPolicy() {
  if (!dataPolicyOpen()) throw new ConvexError('Saving family information is paused until the retention and deletion policy is approved. Your current ideas can stay in this tab.');
}
export function requireLiveAI() {
  if (process.env.CONVEX_CLOUD_URL !== testingBoundary.convexUrl || process.env.V1_PAID_AI_APPROVED !== 'true') throw new ConvexError('Live AI is paused in testing. Keep your photo here and try again after testing access is enabled.');
  requireDataPolicy();
}
