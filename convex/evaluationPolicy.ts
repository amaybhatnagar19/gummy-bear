import { ConvexError } from 'convex/values';
import { EVALUATION_DATASET_VERSION } from '../shared/evaluationCorpus';
import { testingBoundary } from '../shared/testingDeployment.js';
import { SYNTHETIC_EVALUATION_POLICY_VERSION, EVALUATION_PRICE_VERSION, EVALUATION_MAX_MICROS, EVALUATION_RESERVE_MICROS } from '../shared/aiEvaluation';
export function evaluationBlockers() {
  const blockers: string[] = [];
  if (process.env.CONVEX_CLOUD_URL !== testingBoundary.convexUrl) blockers.push('isolated deployment');
  // Only internal, allowlisted toy-only benchmarks use this separate policy.
  // Real-parent privacy/auth deletion gates remain unchanged in v1Policy.
  if (process.env.V1_SYNTHETIC_EVALUATION_APPROVED !== 'true' || process.env.V1_SYNTHETIC_EVALUATION_POLICY_VERSION !== SYNTHETIC_EVALUATION_POLICY_VERSION) blockers.push('approved synthetic-only evaluation scope');
  if (process.env.V1_EVALUATION_DATASET_APPROVED !== EVALUATION_DATASET_VERSION) blockers.push('approved toy-only dataset version and permissions');
  if (process.env.V1_EVALUATION_PROVIDER_POLICY_APPROVED !== 'true') blockers.push('evaluation provider processing and retention policy');
  if (process.env.V1_DATA_POLICY_APPROVED === 'true' || process.env.V1_PAID_AI_APPROVED === 'true') blockers.push('normal collection and PWA AI gates must remain closed');
  if (process.env.V1_AI_EVALUATION_APPROVED !== 'true') blockers.push('evaluation activation');
  if (process.env.V1_EVALUATION_PRICE_VERIFIED !== EVALUATION_PRICE_VERSION) blockers.push('current model availability and pricing');
  const checked = Date.parse(process.env.V1_EVALUATION_PRICE_VERIFIED_AT ?? '');
  if (!Number.isFinite(checked) || checked > Date.now() || Date.now() - checked > 86400000) blockers.push('pricing verification within the last 24 hours');
  if (process.env.V1_EVALUATION_INPUT_ACCOUNTING_VERIFIED !== 'true') blockers.push('full input/image accounting and counting-endpoint costs');
  if (!process.env.OPENAI_TESTING_API_KEY || !/^proj_[a-zA-Z0-9_-]+$/.test(process.env.OPENAI_TESTING_PROJECT_ID ?? '') || process.env.V1_EVALUATION_KEY_SCOPE_VERIFIED !== process.env.OPENAI_TESTING_PROJECT_ID) blockers.push('separate verified testing key/project');
  if (process.env.V1_EVALUATION_PROVIDER_LIMIT_VERIFIED !== 'true') blockers.push('separate provider spending control');
  const budget = Number(process.env.V1_AI_BUDGET_MICROS);
  if (!Number.isSafeInteger(budget) || budget < EVALUATION_RESERVE_MICROS || budget > EVALUATION_MAX_MICROS || Number(process.env.V1_AI_REQUEST_CEILING_MICROS) !== EVALUATION_RESERVE_MICROS) blockers.push('approved budget and request reservations');
  return blockers;
}
export function requireEvaluation() {
  const blockers = evaluationBlockers();
  if (blockers.length) throw new ConvexError('Live evaluation is blocked: ' + blockers.join('; ') + '.');
}
