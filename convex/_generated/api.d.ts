/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as activityDuplicates from "../activityDuplicates.js";
import type * as activityResponses from "../activityResponses.js";
import type * as activitySafety from "../activitySafety.js";
import type * as activitySafetyContext from "../activitySafetyContext.js";
import type * as aiEvaluation from "../aiEvaluation.js";
import type * as analytics from "../analytics.js";
import type * as analyticsRules from "../analyticsRules.js";
import type * as auth from "../auth.js";
import type * as authIdentity from "../authIdentity.js";
import type * as authProviders from "../authProviders.js";
import type * as crons from "../crons.js";
import type * as evaluationPolicy from "../evaluationPolicy.js";
import type * as family from "../family.js";
import type * as guest from "../guest.js";
import type * as http from "../http.js";
import type * as ideas from "../ideas.js";
import type * as paymentRules from "../paymentRules.js";
import type * as play from "../play.js";
import type * as privacy from "../privacy.js";
import type * as privacyAccess from "../privacyAccess.js";
import type * as quota from "../quota.js";
import type * as recognition from "../recognition.js";
import type * as rules from "../rules.js";
import type * as testingAccess from "../testingAccess.js";
import type * as v1Capabilities from "../v1Capabilities.js";
import type * as v1Ideas from "../v1Ideas.js";
import type * as v1Policy from "../v1Policy.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  activityDuplicates: typeof activityDuplicates;
  activityResponses: typeof activityResponses;
  activitySafety: typeof activitySafety;
  activitySafetyContext: typeof activitySafetyContext;
  aiEvaluation: typeof aiEvaluation;
  analytics: typeof analytics;
  analyticsRules: typeof analyticsRules;
  auth: typeof auth;
  authIdentity: typeof authIdentity;
  authProviders: typeof authProviders;
  crons: typeof crons;
  evaluationPolicy: typeof evaluationPolicy;
  family: typeof family;
  guest: typeof guest;
  http: typeof http;
  ideas: typeof ideas;
  paymentRules: typeof paymentRules;
  play: typeof play;
  privacy: typeof privacy;
  privacyAccess: typeof privacyAccess;
  quota: typeof quota;
  recognition: typeof recognition;
  rules: typeof rules;
  testingAccess: typeof testingAccess;
  v1Capabilities: typeof v1Capabilities;
  v1Ideas: typeof v1Ideas;
  v1Policy: typeof v1Policy;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
