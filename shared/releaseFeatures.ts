// Production activation is deliberately closed in this release candidate.
// Changing these defaults requires a separately approved activation/release.
export const closedProductionFeatures = Object.freeze({
  isolatedTesting:false, personalData:false, liveAIReady:false,
  recognition:false, activityGeneration:false, familyProfiles:false,
  toyInventory:false, activityHistory:false, google:false, emailOtp:false,
  emailReminders:false, testingAccess:false, signup:false,
  paymentPresentation:'legacy' as const,
});
