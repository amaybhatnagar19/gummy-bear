> **Current status, 14 October 2026:** Synthetic-only separation is now approved and implemented; 24 licensed reduced toy photographs are ready. Live requests remain disabled pending provider/key/full cost verification. The full-R1 dependency and one-image status described below are historical. See [SYNTHETIC_AI_EVALUATION_REPORT.md](SYNTHETIC_AI_EVALUATION_REPORT.md) for current controls, dataset and exact setup; real-parent R1 gates remain unchanged.

# Live AI evaluation readiness report

14 October 2026. Decision 5A replaces 5C: up to **$10 USD total**, conditional on privacy readiness, verified pricing and enforced controls. This is authorization for a ceiling, not activation or a requirement to spend.

## Result

**Safe infrastructure implemented and mocked tests passed. Live evaluation has not started.** The installed testing backend and pilot command reject requests before provider calls. No photographs were transmitted to OpenAI in this task.

| Requested measurement | Actual result |
|---|---|
| Live recognition / activity requests | 0 / 0 |
| Live token usage / measured latency | 0 / not measured |
| Actual evaluation spending | $0; no provider requests |
| Unspent authorized budget | $10 |
| Provider invoice reconciliation | Not available; no testing provider project/key configured |
| Recognition accuracy / activity quality | Not measured; no fabricated scores |
| Corpus | 1 approved photograph of 24 planned cases |

## Verified environment and privacy blockers

Only `gummy-bear-v1-testing`, project 3206274, deployment `blissful-dotterel-906`, was used. Backend/schema installation used the deployment-scoped testing credential through `npm run testing:push`. This also installed the earlier safe R1 privacy functions/schema. No frontend hosting publication, production deployment, production credential use, account copying or provider configuration occurred. Existing production environment file and protected product/auth/payment/landing files remain unchanged.

R1's implementation report and current code still show **incomplete full account deletion**: family removal is supported, but identity/session deletion awaits policy/finalization; `accountDeleted` is not asserted. Operational logs, backups, deletion-request evidence and financial retention decisions remain pending. Completing safe R1 work is distinct from approving and implementing every readiness requirement. The evaluation gate imports the actual false `fullAccountDeletionImplemented` capability; setting approval flags cannot bypass that missing implementation. This task did not change authentication or financial records.

Testing provider credentials and readiness flags were absent. Model entitlement, project spending configuration and full input-cost accounting remain unverified. General family collection and public paid-AI gates remain closed. The changed $10 decision does not reopen these paths.

## Model, official pricing and cost uncertainty

The configured identifier is `gpt-6-luna`; the public model documentation lists image input and Responses support. Public availability is verified; availability to a specific testing account is not. [Official model documentation](https://developers.openai.com/api/docs/models/gpt-6-luna).

Current Standard short-context prices checked on 14 October 2026 are input $0.10, cached input $0.01, cache writes $0.125 and output $0.50 per million tokens. Different service tiers, long context and regional pricing must not be silently substituted. Evaluation explicitly requests the Standard/default tier. [Official pricing](https://developers.openai.com/api/docs/pricing).

The official vision sizing tables do not specify this model's image multiplier. We do not borrow another model's 85-token or patch formula. Image tokens form part of input billing. [Vision accounting guide](https://developers.openai.com/api/docs/guides/images-vision).

The proposed full-request counter is `/v1/responses/input_tokens`. Before activation, verify that this model accepts the exact structured-output schema with images and establish any counting-endpoint fee. Counting itself transmits the reduced photograph and requires privacy readiness. Total output usage includes reasoning tokens. [Token counting guide](https://developers.openai.com/api/docs/guides/token-counting).

The server caps counted input at 16,384 tokens, recognition output at 500 and activity output at 1,500. Using the higher cache-write input rate and 10% regional headroom produces **conditional model-only upper estimates** of $0.002528 for recognition and $0.003078 for generation. These are not verified all-in worst-case prices: counting charges, account conditions and taxes remain unresolved. Each action reserves $0.01. Do not activate until the verified all-in bound fits that reservation. Token-derived estimates are recorded separately from provider billing.

## Enforced controls

- Cumulative ceiling $10; configurations above it are rejected. Same persistent testing ledger prevents a new run resetting the budget.
- $0.01 reservation before each recognition/generation action; failed or uncertain requests retain reservations. No automatic retry, refund or budget-reset command.
- Maximum ten synthetic operator/tester slots, initial 14-day window, ten recognition and ten generation actions per slot per UTC day. Existing global 100-action/hour quota preserved.
- One request per tester and one global evaluation request at a time. Expired unresolved leases stop further evaluation instead of permitting overlap.
- Full-input preflight before Responses; approvals and available budget checked again after counting. Oversized input, excessive/missing usage, model/tier mismatch, expired pricing, revoked approval and transport uncertainty halt further spending.
- Only reviewed corpus hashes accepted; caller cannot substitute a private photo. Known non-toy/hazard cases cannot generate activities.
- Numeric-only backend receipts: synthetic case/slot identifiers, timing, token counts, costs and accepted/rejected counts. No photo, raw model envelope, child label, DOB, phone or email logged/stored by evaluation code.
- Actual project spending reconciliation raises the ledger floor; it cannot restore spent reservations. The reconciliation is an operator-verified project billing total, not an automatic invoice API integration. An uncertain halt has no blind resume/reset path.

Create a separate OpenAI testing project and, where available, set **$8 hard monthly spend limit**, with alerts, leaving $2 headroom within the authorization. Current official instructions are Project settings → Limits → Spend → Edit spend limit → Enforce a hard limit. Enforcement may lag and allow a small overrun; neither provider limits nor the application ledger guarantee exact billing. Never change production/organization limits for this evaluation. [Official spend-limit documentation](https://developers.openai.com/api/docs/guides/spend-limits).

`store:false` is set, but does not imply zero provider retention. API data is not used for training by default; abuse-monitoring retention and exceptions still apply, and approved zero-retention arrangements are separate. Review processor terms before any photo submission. [Official data controls](https://developers.openai.com/api/docs/guides/your-data).

## Dataset and evaluation procedure

`shared/evaluationCorpus.ts` has 24 explicit slots spanning ages 2–8: plush toys, blocks, cars, train, cups, rings, puzzle, kitchen, doll, dinosaur, ball, shelf, occluded/ambiguous objects, animal/non-toy, beads, battery, magnets, sharp damage, cord and plastic bag. Only case-01 is supplied: a licensed public D1 teddy photograph derivative. Attribution and changes are in `tests/fixtures/ai-evaluation/SOURCES.md`. Remaining 23 slots are honestly marked unready; at least 20 distinct reviewed hashes are required.

After prerequisites: run three recognition/corrected-generation pairs, pause for human review and project billing reconciliation, then evaluate remaining reviewed cases while reservations fit. The runner preserves successful stage results and does not automatically retry failures. Local private review files contain only filtered public benchmark outputs; never private photos or raw rejected responses.

Score recognition against verified object labels, distinguish uncertainty/non-toys from confident false positives, and inspect whether corrected labels change instructions. Review specificity, materials/steps consistency, differentiation and unsafe rejection separately for ages 2–3, 4–5 and 6–8. A safe limitation counts as a limitation, not a successful activity. Deliberate repeated-generation probes with previous accepted activities are still required for live duplicate scoring; the initial batch alone does not measure memory-based repetition. Record latency, input/cached/output/reasoning tokens and compare estimates to actual project costs. Stop on any uncertain safety/cost result. No human-reviewed live accuracy or safety conclusions exist yet.

## Tests and verification

- `npm test`: **364 guarded Vitest tests across 24 files plus 3 Node rules tests passed**; 19 additional tests cover evaluation and network boundaries.
- Strict tests/config TypeScript passed with `vite/client,node` types; first standalone invocation omitted Vite types and failed, corrected invocation passed.
- `npm run build` and `npm run build:testing` passed; existing auth dependency directive warning remains nonfatal.
- `npm run testing:push`: safe source/schema installed only in verified testing deployment. Generated function types refreshed.
- `node --experimental-strip-types scripts/ai-evaluation.mjs check`: reports readiness blockers, zero reservations, one ready photograph.
- Same command with `pilot`: **expected exit 2**, before photo transmission or provider requests.
- Existing network-isolated Playwright checks: **15 passed** using local testing URLs only, intercepted synthetic backend/provider responses and no production-mutating tests. Command: `GUMMY_TEST_URL=http://127.0.0.1:5175 GUMMY_PWA_TEST_URL=http://127.0.0.1:5176 ./node_modules/.bin/playwright test --timeout=30000`.

Seventeen new mocked evaluation cases cover corrected inputs, rejected hazardous outputs absent from returned activities, duplicate mechanics, oversize/unknown usage, budget/concurrency, expired leases/pricing, revocation during counting, private-photo substitution, quota boundaries and provider-cost reconciliation. Additional tests prove real incomplete R1 cannot be bypassed and exact single-use counting mocks cannot allow unrelated fetch/TCP calls. Existing safety, ownership, refund and entitlement tests remain passing. These are deterministic tests, not evidence of real-model recognition performance. The network guard is test-worker protection, not a system-wide firewall for arbitrary subprocesses.

## Exact setup needed before live requests

1. Record R1 approvals and complete the approved identity/session deletion and retained-record handling. Resolve logs/backups/processor/financial/request-evidence retention; do not invent legal periods. Verify real full-account completion with isolated tests. Do not flip the source capability without implementing its promise.
2. Create a new OpenAI evaluation project and scoped service-account API key, restricted to needed model/count/Responses access. Confirm hard-limit availability and set $8/alerts on that project only; verify data-sharing/retention settings. Do not send keys in chat or store them in source/client files.
3. Verify account model access, current prices, full schema/image counting behavior, counting fees and all-in cost bound. Verify exact service tier and record checks within 24 hours of each run. No photo-based accounting probes before step 1.
4. Supply at least 20 distinct approved reduced JPEG cases, complete labels/corrections/licenses/hashes, remove metadata/private background details and keep known hazard/non-toy cases generation-disabled. Source checklist documents limits and attribution.
5. Only after evidence exists, use the **testing Convex dashboard** server environment settings, never production or `.env.local`, to configure:

| Server-only variable | Required value/evidence |
|---|---|
| `OPENAI_TESTING_API_KEY` | New testing project key; never legacy `OPENAI_API_KEY` |
| `OPENAI_TESTING_PROJECT_ID` | New `proj_…` identifier |
| `V1_EVALUATION_KEY_SCOPE_VERIFIED` | Exact new project identifier after scope verification |
| `V1_EVALUATION_PRIVACY_VERSION` | `v1-privacy-2026-10-14` after approval |
| `V1_R1_READINESS_APPROVED` | `true` after actual R1 completion and approvals |
| `V1_AI_EVALUATION_APPROVED` | `true` for this bounded experiment only |
| `V1_EVALUATION_PRICE_VERIFIED` | `gpt-6-luna-standard-2026-10-14` only while rates match |
| `V1_EVALUATION_PRICE_VERIFIED_AT` | ISO timestamp of actual verification, within 24 hours |
| `V1_EVALUATION_INPUT_ACCOUNTING_VERIFIED` | `true` after full-input and fee/bound verification |
| `V1_EVALUATION_PROVIDER_LIMIT_VERIFIED` | `true` after separate provider cap verification |
| `V1_AI_BUDGET_MICROS` | `10000000` ($10 maximum) |
| `V1_AI_REQUEST_CEILING_MICROS` | `10000` ($0.01 reservation) |

Leave general `V1_DATA_POLICY_APPROVED` and `V1_PAID_AI_APPROVED` closed. Keep `.env.v1-testing` as connection credentials only. Dashboard: https://dashboard.convex.dev/t/amay-bhatnagar/gummy-bear-v1-testing/blissful-dotterel-906 . Flags are evidence records, not approval substitutes.

6. Run `node --experimental-strip-types scripts/ai-evaluation.mjs check`, then `pilot` only when all blockers clear. Review `.ai-evaluation/*-review.json`, reconcile the new project's actual costs, and record `pilotReviewed`, `providerCostsReconciled`, and numeric `providerCostUSD` in its private state before `continue`. Never reset the cumulative ledger to resume. Review uncertainty before any further action.

## Files, rollback and production readiness

Changed: `.gitignore`, `convex/_generated/api.d.ts`, `convex/play.ts`, `convex/recognition.ts`, `convex/privacy.ts`, `convex/schema.ts`, `convex/testingAccess.ts`, `tests/setup/no-network.ts`, `tests/backend/network-guard.test.ts` and implementation documentation.

Created: `convex/aiEvaluation.ts`, `convex/evaluationPolicy.ts`, `shared/aiEvaluation.ts`, `shared/evaluationCorpus.ts`, `scripts/ai-evaluation.mjs`, `tests/backend/ai-evaluation.test.ts`, `tests/backend/evaluation-policy.test.ts`, the case-01 fixture/source document and this report. Schema additions are an evaluation receipt table and optional testing ledger fields; existing auth/payment tables are unchanged. Production request behavior is preserved through extracted existing payload/parser helpers; the privacy change exposes an honest capability, not an identity mutation.

Starting reversible checkpoint: `941b748`. Final local checkpoint recorded in Git. Roll back only this task's files with a targeted revert; preserve unrelated untracked work and cumulative evaluation receipts/ledger. Any testing backend rollback must use the isolated push wrapper with live gates closed. No production deployment is authorized.

**Not production-ready for live AI.** Resolve R1 completion, provider setup, full cost verification and corpus readiness before any pilot. Then human live output review and actual billing reconciliation are required before quality/safety or launch claims.


## Reverification after renewed Decision 5A instruction

14 October 2026. The existing evaluation infrastructure was reused rather than resetting its ledger or implementing a second path. Read-only testing status again reports $0 reserved, one ready image and missing privacy, provider-key/project, spending and current cost-verification prerequisites. `convex/privacy.ts` still explicitly reports `fullAccountDeletionImplemented=false` and `accountDeleted=false`; account requests end at `awaiting_policy`. The safe R1 task has completed, but full identity deletion is not implemented. The renewed budget instruction does not supply the missing implementation, key or retention approvals.

Ran `node --experimental-strip-types scripts/ai-evaluation.mjs check`, `npm test`, `./node_modules/.bin/tsc --noEmit` and `git diff --check`: 364 guarded Vitest tests plus 3 Node tests passed, TypeScript passed, and no whitespace errors. Current official model, spend-limit and data-control documentation was reopened; testing-account entitlement and complete image/counting cost bounds remain unverified. Builds and browser checks above are from the earlier infrastructure verification and were not rerun in this documentation-only follow-up.

**No live pilot run; no photo transmission, provider configuration, deployment, production access or remote mutation. Actual task spending $0; all $10 remains.** Recognition accuracy, real-model quality/safety, latency and actual billed token usage remain unmeasured. The exact setup checklist above remains required. `AI_EVALUATION_READINESS.md` proposes a synthetic-only separation; it is not implemented or implicitly approved by repeating the broad budget authorization. No gates were weakened or flags set.

Next action: resolve and record the applicable privacy scope/retention approval, then provide the separate testing provider setup and verified cost evidence. Stop before live requests until all readiness checks pass.
