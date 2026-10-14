# Synthetic-only evaluation implementation

14 October 2026. Scope separation approved by the owner and implemented. **Live evaluation remains disabled: provider setup and complete cost verification are missing.** No further R1 account-deletion approval is needed for this internal toy-only pathway. Full R1 requirements still apply to real-parent testing/production.

## Result

| Deliverable | Status |
|---|---|
| Separate internal testing gate | Implemented, tested and installed only in `gummy-bear-v1-testing` |
| Public/normal guest access | Rejected in deterministic tests and actual unauthenticated testing HTTP calls |
| Real-parent privacy/auth/payment behavior | Preserved; no changes to those implementations/configuration |
| Dataset | 24 reduced licensed toy photographs, 24 distinct hashes; provenance and permissions documented |
| Model/public price verification | Official documentation checked; account entitlement and full all-in costs unverified |
| Provider project/key/hard limit | Missing; no credentials created/configured |
| Live accuracy, quality, safety, latency, tokens | Not measured; no model calls |
| Actual evaluation spending | $0; no provider requests; invoice unavailable |
| Authorized budget remaining | $10 |

## Implemented privacy boundary

`convex/evaluationPolicy.ts` no longer imports the incomplete account-deletion capability. It instead requires its own exact versioned synthetic policy, allowlisted dataset approval and provider-policy acknowledgment, plus existing pricing, key/project and budget verification. It additionally refuses evaluation when normal collection or public paid-AI flags are open. `convex/v1Policy.ts`, privacy/auth/account-deletion code, payments and PRODUCT.md are unchanged. Do not set legacy R1 approval flags as a shortcut.

Evaluation queries/actions/mutations remain **internal** (unavailable through public Convex calls). Synthetic operator invitation proofs have no parent owner. Supplying an account owner when allocating an evaluation invitation or using an authenticated parent session is rejected. Normal guest recognition and legacy generation cannot use an evaluation invitation to bypass their closed gates. No real accounts, guest drafts, child profiles, customer records or payments were created.

Each selected photo must match a reviewed server allowlist entry and SHA-256 of reduced bytes. Permission and toy-only privacy review are required; unreviewed substitutions and known sensitive generation cases are rejected before provider calls. The original photo is never stored by the evaluation backend. Reduced licensed benchmark fixtures are intentionally versioned for reproducibility; they are not parent uploads. No photo bodies/raw provider envelopes in receipts, analytics or application logs. Filtered public-benchmark outputs can be stored locally for operator review; spending receipts contain only numeric usage, synthetic identifiers and timing.

Owner scope approval is recorded in this task/report. Server approval/activation settings were **not set** while external prerequisites are incomplete. Their absence in the readiness query means configuration remains disabled, not that the owner must repeat scope approval. Platform/operator logs/backups and provider retention still need evaluation-specific acknowledgment; this does not activate family data collection.

## Dataset manifest and permissions

[Canonical manifest](tests/fixtures/ai-evaluation/manifest.json) and [source/license/criteria list](tests/fixtures/ai-evaluation/SOURCES.md) document every image: exact Commons source, creator/credit, license URL, derivative changes, review date, byte size, SHA-256, invented age, expected labels, confirmed input and generation eligibility.

All 24 are appropriately licensed **photographs**, not AI-generated assets. Sources include CC0 and CC BY/CC BY-SA 2.5/3.0/4.0, with applicable attribution and derivative share-alike retained. Permissions were checked through per-file source licensing metadata/pages, not assumed from public visibility. Rights assertions are as published by those sources, not a legal review or manufacturer certification. Credit includes museum collections where relevant. No private parent/family photos were used.

Coverage: two plush bears; alphabet blocks; wooden castle; two ride-on cars; wooden trains; mixed baby toys; three puzzle views; antique doll; small bouncing balls and a toy ball; historic lead figurine; miniature kitchen; magnetic assemblies; toy cups/animal figures; model trains and an occluded train shelf; plastic dinosaur. Ages span 2–8. Multiple puzzle/magnetic/train views are separate source photographs, not duplicated crops, but increase category weighting; this remains a small convenience benchmark, not a representative market sample.

**Eight cases permit generation; sixteen are recognition-only**, conservatively including magnets, lead, small parts and unverified historical/ride-on materials/age suitability. The source explicitly describes the metal figurine as lead, so it cannot generate play ideas at any age. Mixed-shelf recall must reflect the recognition contract's distinct toy categories, not count every identical train instance. Ambiguous labels are reviewed manually; do not penalize honest uncertainty or treat recognition as safety certification.

The corpus totals **1,644,957 bytes**. Images are JPEG derivatives ≤768 pixels and within the request-size limit, with no EXIF/XMP/IPTC/comments. The old case-01 JPEG retained a source metadata segment; it was re-encoded and its allowlist hash updated. Original/rejected preparation downloads are discarded; only reviewed reduced fixtures remain in the repository. A candidate containing a child, a real bear, unclear household utensils and a public-domain photo lacking author attribution were excluded. No AI image generation or paid asset tool used.

Coverage gaps remain: open battery compartments, damaged sharp edges, long cords, plush rabbit and modern safe doll activity generation. Existing deterministic safety cases cover relevant hazards, but no live performance claim for these missing photographic scenarios. Do not silently replace them with unsafe props in an active evaluation.

## Provider and cost verification

Actual configured model: **`gpt-6-luna`** in both payload builders and evaluation constants; Responses API, low reasoning, `store:false`, recognition output 500 / activity output 1,500 tokens. Public model documentation lists image input/structured outputs; testing-project access is not verified without a separate key. [Official model documentation](https://developers.openai.com/api/docs/models/gpt-6-luna).

Standard short-context rates checked today: per million tokens, $0.10 input, $0.01 cached input, $0.125 cache writes, $0.50 output. Evaluation explicitly requests default/Standard service. Long context/other tiers/regional processing have different prices. [Official pricing](https://developers.openai.com/api/docs/pricing).

The vision table does not document a GPT-6 Luna image multiplier; no other model's patch/85-token formula is borrowed. `/v1/responses/input_tokens` supports image counting, but exact model+schema compatibility and counting fees remain unverified. Counting and recognition each send the reduced image; generation sends corrected labels without it. The complete bound must cover both calls before either is allowed. [Vision accounting](https://developers.openai.com/api/docs/guides/images-vision), [token counting](https://developers.openai.com/api/docs/guides/token-counting).

At the 16,384 input and 500/1,500 output ceilings, conservative **model-only** estimates using the higher cache-write rate and 10% headroom are $0.002528 recognition / $0.003078 generation. The $0.01 reservation must also cover verified preflight charges, taxes/account conditions. These unresolved components prevent a verified all-in worst-case claim. Output usage includes reasoning; current token estimates do not independently itemize cache writes, so project billing reconciliation remains required.

OpenAI API training is off by default unless opted in; abuse-monitoring content may remain up to 30 days with exceptions. `store:false` is not zero retention; flagged image safety review has additional exceptions. Verify counting/Responses/project terms and Convex operational retention separately. No customer-specific legal periods invented. [Official data controls](https://developers.openai.com/api/docs/guides/your-data).

Application controls retain the cumulative $10 ledger, $0.01 nonrefundable reservations, ten slots, 14-day invitation expiry, ten recognition and ten generation actions per slot/day, one request per slot plus one global evaluation request, and existing 100-action/hour quota. A timeout, unknown usage, price expiry, cost mismatch, approval revocation or orphaned lease halts further spending; no automatic retries/refunds/resets. Actual cost reconciliation raises the ledger floor and does not erase reservations or a safety halt.

A separate project **$8 monthly hard limit with alerts** is recommended, leaving $2 buffer. Official guidance supports project hard limits but warns propagation can permit overrun; monthly reset is not the cumulative experiment ceiling. No provider cap was configured. The application ledger is not a provider invoice or a guaranteed billing cap. If the full cost bound or effective provider control cannot be verified, remain stopped. [Official spend limits](https://developers.openai.com/api/docs/guides/spend-limits).

## Pilot and evaluation metrics

Runner pilot is capped at three images: case-01 plush (age 2), case-03 blocks (age 4), case-07 wooden train (age 8). Each uses recognition, predetermined reviewed correction labels and generation, followed by one block alternative request using prior accepted ideas. **Seven action reservations: $0.07; conditional model-only bound $0.019896**, excluding unknown counting/tax charges. Then it pauses for human review and actual project billing reconciliation. The full selected corpus plus six alternative probes needs at most 24 recognition +8 primary generation +6 alternative actions =38 reservations ($0.38); conditional model-only bound $0.103764. This is a planning envelope, not spending already incurred.

Selected-case checks occur before any batch starts. The daily plan fits each synthetic slot's ten-per-kind cap. Successful stages and first ideas remain stored locally if later requests fail. Alternative probes require actual prior accepted ideas; no filler or automatic retries. Full expansion requires operator pilot review, actual-project cost reconciliation and unchanged readiness controls, not merely successful HTTP responses.

Measure human-reviewed category-label precision/recall, confident invented-object rate and ambiguity; correction adherence; specificity score (generic/usable/tailored); age suitability separately for 2–3/4–5/6–8; unsafe accepted activities; materials/step consistency; exact/cosmetic mechanics repetition within and across alternatives; end-to-end latency; input/cached/output/reasoning tokens; and actual project billing. Rejection counts combine quality/safety/repetition and cannot alone establish how many unsafe model proposals were filtered. Recognition-only sensitive cases do not exercise live generation for those toys. Existing mocked safety regression coverage remains essential.

Pilot acceptance: correct primary toy on all three clear photos, no confident invented objects, corrected labels used, at least one concrete useful idea per safe case or an honest reviewed limitation, no unsafe accepted steps, complete materials, no cosmetic/exact duplicates, and fully reconciled bounded spending. A limitation is not recorded as a successful activity. Pause immediately on an accepted unsafe suggestion/privacy concern; keep expansion disabled and revoke the evaluation activation flag before any further requests. This small benchmark cannot certify production safety/accuracy or actual phone usability.

## Tests and commands

- Test-first policy cases reproduced the old blanket-R1 dependency and missing closed-normal-gate enforcement (two expected failures), then passed after the separate gate implementation.
- `npm test`: **373 guarded Vitest tests /25 files and 3 Node rules tests passed**; nine additional tests over 364-test baseline.
- Strict tests/config TypeScript passed. A new synthetic signed-in test initially used an overly broad test-helper type; narrowed to the needed action method and rerun successfully.
- `npm run build`, `npm run build:testing`: passed; existing nonfatal Convex Auth directive warning remains.
- `node --check scripts/ai-evaluation.mjs`: passed.
- Existing isolated Playwright command using localhost 5175/5176: **15 passed**; backend/provider traffic mocked, no production-mutating tests.
- `npm run testing:push`: testing source installed successfully. No schema change in this task, no records migrated/copied, no frontend publication or production deployment.
- `node --experimental-strip-types scripts/ai-evaluation.mjs check`: testing status reports 24 ready hashes, zero reserved/effective spend and external/setup blockers.
- Testing-only CLI environment inspection (values withheld): separate OpenAI key/project and normal collection/public AI flags are absent. No environment variables were written.
- Read-only testing HTTP verification: unauthenticated `aiEvaluation:status` and `aiEvaluation:run` rejected as non-public functions; public capabilities show `personalData:false`, `liveAIReady:false`, `isolatedTesting:true`.

Tests prove independent policy while actual full-account deletion remains false, legacy approvals cannot replace synthetic/provider/dataset approvals, other deployments/open normal gates are rejected, parent owners cannot use evaluation, public guest paths stay closed, unreviewed/unsafe inputs fail before fetch, corpus hashes/licensing/metadata are consistent, and pilot/alternative plans fit quotas. Existing quality, safety, trial, refund, entitlement and account-isolation tests passed unchanged. Network protection is test-worker coverage, not a system-wide firewall for arbitrary subprocesses.

## Exact external setup needed

1. Create a **new OpenAI evaluation project** and restricted service-account key; verify model entitlement and exclusive use by this benchmark. Never use production keys or send credentials in chat. Confirm data-sharing/processor settings, counting endpoint fees/schema compatibility and full all-in bound. If the count endpoint fee cannot be established, stop before even a counting call.
2. In that project's settings: Limits → Spend → Edit spend limit → $8 → Enforce a hard limit → Save, with early alerts. Record the actual control and lag behavior; do not change organization/production limits. A notification-only budget is insufficient.
3. Only after evidence is complete, configure **server variables in the verified testing Convex dashboard** (not client files, production or `.env.local`):

| Variable | Required value/evidence |
|---|---|
| `V1_SYNTHETIC_EVALUATION_APPROVED` | `true`; approved scope already recorded |
| `V1_SYNTHETIC_EVALUATION_POLICY_VERSION` | `toy-only-evaluation-2026-10-14` |
| `V1_EVALUATION_DATASET_APPROVED` | `toy-only-24-2026-10-14`; reviewed source manifest |
| `V1_EVALUATION_PROVIDER_POLICY_APPROVED` | `true` after processing/retention acknowledgment |
| `OPENAI_TESTING_API_KEY` | New restricted testing key; server-only |
| `OPENAI_TESTING_PROJECT_ID` | New `proj_…` identifier |
| `V1_EVALUATION_KEY_SCOPE_VERIFIED` | Exact new project ID after verification |
| `V1_EVALUATION_PROVIDER_LIMIT_VERIFIED` | `true` after actual separate hard cap verification |
| `V1_EVALUATION_PRICE_VERIFIED` | `gpt-6-luna-standard-2026-10-14` only if rates still match |
| `V1_EVALUATION_PRICE_VERIFIED_AT` | Actual ISO verification timestamp, within 24 hours |
| `V1_EVALUATION_INPUT_ACCOUNTING_VERIFIED` | `true` only after full fees/input/schema/cost bound verification |
| `V1_AI_BUDGET_MICROS` | `10000000` ($10 maximum) |
| `V1_AI_REQUEST_CEILING_MICROS` | `10000` ($0.01 reservation) |
| `V1_AI_EVALUATION_APPROVED` | `true` only when all above checks pass for pilot activation |

Keep `V1_DATA_POLICY_APPROVED` and `V1_PAID_AI_APPROVED` absent/false. Do not set `V1_R1_READINESS_APPROVED` or claim real-parent readiness. Dashboard: https://dashboard.convex.dev/t/amay-bhatnagar/gummy-bear-v1-testing/blissful-dotterel-906 . No flags were set by this task.

4. Run the `check` command first. Only after all external prerequisites pass, the conditional live authorization permits `pilot`. Review `.ai-evaluation/*-review.json`; record human acceptance and new-project actual cost in the private state (`pilotReviewed`, `providerCostsReconciled`, `providerCostUSD`) before `continue`. Never clear an uncertain halt or reset the ledger to force resumption. Close/revoke evaluation credentials after reviewed reconciliation and closeout. Keep actual invoice totals separate from token estimates.

## Files and rollback

Modified code/tests: `convex/evaluationPolicy.ts`, `convex/aiEvaluation.ts`, `shared/aiEvaluation.ts`, `shared/evaluationCorpus.ts`, `scripts/ai-evaluation.mjs`, `tests/backend/evaluation-policy.test.ts`, `tests/backend/ai-evaluation.test.ts`. New `tests/backend/evaluation-corpus.test.ts`; 23 new reduced JPEG fixtures, updated case-01, new `manifest.json`, updated `SOURCES.md`. Reports/progress/environment documentation updated to supersede the historical full-R1 benchmark gate. No schema/auth/payment/product/landing/dependency/environment changes.

Starting checkpoint `e2dd9aa`; final local checkpoint in Git. Revert only this task's committed files with a targeted revert and testing-only push while activation is closed. Do not reset/purge an active spending ledger or overwrite unrelated untracked work. Production is untouched and not ready for activation. Live evaluation findings remain pending external setup; all $10 is unspent.
