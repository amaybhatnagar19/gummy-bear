import { afterEach, expect, test, vi } from 'vitest';
import { evaluationBlockers, requireEvaluation } from '../../convex/evaluationPolicy';
import { fullAccountDeletionImplemented } from '../../convex/privacy';
import { testingBoundary } from '../../shared/testingDeployment.js';
afterEach(()=>vi.unstubAllEnvs());
test('approval flags cannot bypass the actual missing account-deletion finalizer',()=>{
  for(const [name,value] of Object.entries({CONVEX_CLOUD_URL:testingBoundary.convexUrl,V1_EVALUATION_PRIVACY_VERSION:'v1-privacy-2026-10-14',V1_R1_READINESS_APPROVED:'true',V1_AI_EVALUATION_APPROVED:'true',V1_EVALUATION_PRICE_VERIFIED:'gpt-6-luna-standard-2026-10-14',V1_EVALUATION_INPUT_ACCOUNTING_VERIFIED:'true',V1_EVALUATION_PROVIDER_LIMIT_VERIFIED:'true',V1_EVALUATION_KEY_SCOPE_VERIFIED:'proj_synthetic_evaluation',OPENAI_TESTING_PROJECT_ID:'proj_synthetic_evaluation',OPENAI_TESTING_API_KEY:'synthetic-test-key',V1_AI_BUDGET_MICROS:'10000000',V1_AI_REQUEST_CEILING_MICROS:'10000'}))vi.stubEnv(name,value);
  expect(fullAccountDeletionImplemented).toBe(false);
  vi.stubEnv('V1_EVALUATION_PRICE_VERIFIED_AT',new Date().toISOString());
  expect(evaluationBlockers()).toEqual(['R1 account identity-deletion implementation']);
  expect(()=>requireEvaluation()).toThrow('identity-deletion implementation');
});
