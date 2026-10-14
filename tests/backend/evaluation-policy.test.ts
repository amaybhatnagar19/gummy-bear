import { afterEach, expect, test, vi } from 'vitest';
import { evaluationBlockers, requireEvaluation } from '../../convex/evaluationPolicy';
import { fullAccountDeletionImplemented } from '../../convex/privacy';
import { dataPolicyOpen, requireLiveAI } from '../../convex/v1Policy';
import { testingBoundary } from '../../shared/testingDeployment.js';
afterEach(()=>vi.unstubAllEnvs());
function ready(){
  for(const [name,value] of Object.entries({CONVEX_CLOUD_URL:testingBoundary.convexUrl,V1_DATA_POLICY_APPROVED:'false',V1_PAID_AI_APPROVED:'false',V1_EVALUATION_DATASET_APPROVED:'toy-only-24-2026-10-14',V1_SYNTHETIC_EVALUATION_APPROVED:'true',V1_SYNTHETIC_EVALUATION_POLICY_VERSION:'toy-only-evaluation-2026-10-14',V1_EVALUATION_PROVIDER_POLICY_APPROVED:'true',V1_AI_EVALUATION_APPROVED:'true',V1_EVALUATION_PRICE_VERIFIED:'gpt-6-luna-standard-2026-10-14',V1_EVALUATION_INPUT_ACCOUNTING_VERIFIED:'true',V1_EVALUATION_PROVIDER_LIMIT_VERIFIED:'true',V1_EVALUATION_KEY_SCOPE_VERIFIED:'proj_synthetic_evaluation',OPENAI_TESTING_PROJECT_ID:'proj_synthetic_evaluation',OPENAI_TESTING_API_KEY:'synthetic-test-key',V1_AI_BUDGET_MICROS:'10000000',V1_AI_REQUEST_CEILING_MICROS:'10000'}))vi.stubEnv(name,value);
  vi.stubEnv('V1_EVALUATION_PRICE_VERIFIED_AT',new Date().toISOString());
}
test('approved toy-only evaluation is independent of incomplete identity deletion without opening collection',()=>{
 ready();expect(fullAccountDeletionImplemented).toBe(false);expect(evaluationBlockers()).toEqual([]);expect(()=>requireEvaluation()).not.toThrow();expect(dataPolicyOpen()).toBe(false);expect(()=>requireLiveAI()).toThrow('paused');
});
test('legacy R1 approvals cannot substitute for separate synthetic scope and provider policy',()=>{
 ready();vi.stubEnv('V1_R1_READINESS_APPROVED','true');vi.stubEnv('V1_EVALUATION_PRIVACY_VERSION','v1-privacy-2026-10-14');
 for(const flag of ['V1_EVALUATION_DATASET_APPROVED','V1_SYNTHETIC_EVALUATION_APPROVED','V1_SYNTHETIC_EVALUATION_POLICY_VERSION','V1_EVALUATION_PROVIDER_POLICY_APPROVED']){vi.stubEnv(flag,'');expect(()=>requireEvaluation()).toThrow();ready();}
});
test('evaluation refuses non-testing deployments and any open normal collection or AI gate',()=>{
 ready();vi.stubEnv('CONVEX_CLOUD_URL','https://synthetic-other.convex.cloud');expect(()=>requireEvaluation()).toThrow('isolated');
 for(const flag of ['V1_DATA_POLICY_APPROVED','V1_PAID_AI_APPROVED']){ready();vi.stubEnv(flag,'true');expect(()=>requireEvaluation()).toThrow('normal');}
});
