# OpenAI testing project verification

14 October 2026. **Not ready for live requests. No live inference/counting performed; $0 spent, $10 remains authorized.** This is a verification report, not activation approval.

## Project and key isolation

The owner reports creating OpenAI project `gummy-bear-v1-testing`, a dedicated API key and a $10 monthly budget. Those provider settings are **owner-reported, not independently verified**: no provider dashboard session/admin access is available, and the configured testing backend has no `OPENAI_TESTING_API_KEY` or `OPENAI_TESTING_PROJECT_ID`.

The read-only Convex CLI environment check ran exclusively against verified project 3206274 / deployment `blissful-dotterel-906`. CLI output was captured privately; only presence booleans were returned. Key, project ID, scope-verification flag and provider-limit-verification flag are absent. No key value was printed, logged, committed or used. No production credential was sought. The original production environment checksum remains unchanged.

Creating an OpenAI key does not automatically configure the Convex backend. The two projects share a name but are separate systems; OpenAI's `proj_…` ID is not Convex's numeric project ID. A key prefix or the `OpenAI-Project` request header alone does not prove ownership.

For independent ownership verification, review the testing project's key/service-account entry and creation provenance, and use only its corresponding new key. Authorized administrative metadata can retrieve a key under the exact project; never publish the secret or even redacted key values in the report. No organization admin key is currently available or requested in chat. [Official project-key lookup](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/api_keys/methods/retrieve).

## Model availability and official pricing

Source configured model: **`gpt-6-luna`** in recognition/activity builders and evaluation constants. Responses API; `reasoning.effort:low`; `store:false`; evaluation service tier `default`; output caps 500 recognition /1,500 activity tokens. Public documentation lists image input and structured outputs. **Testing-project entitlement is unverified**, because no testing key is installed. No paid probe was substituted for metadata verification. [Official model page](https://developers.openai.com/api/docs/models/gpt-6-luna).

Once the key is installed, an authorized read-only model metadata request `GET /v1/models/gpt-6-luna`, with the testing key and exact testing project header, can check visibility without generating content or transmitting photos. Project model permissions must also allow it; metadata visibility alone does not prove the full structured image request succeeds. Review the project permissions/dashboard or authorized admin metadata. [Project model permissions](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/model_permissions/methods/retrieve).

Standard short-context USD pricing rechecked from current official documentation:

| Usage | Per million tokens |
|---|---:|
| Uncached input | $0.10 |
| Cached input | $0.01 |
| Cache writes | $0.125 |
| Output, including reasoning usage | $0.50 |

The source rates match these prices. Long-context/other service tiers and regional processing can differ. No tools/image-generation endpoints are enabled by the evaluation payload. [Official pricing](https://developers.openai.com/api/docs/pricing).

**Image-token conversion is not fully verified.** Image tokens bill as input; no distinct fixed per-photograph price was established for this model. The fetched vision multiplier table does not list GPT-6 Luna, so another model's patch/85-token rule must not be applied. The input-counting endpoint documents image support, but exact model/schema compatibility and any counting charge are unverified. Do not send a photo even for counting under this verification-only instruction. [Vision guide](https://developers.openai.com/api/docs/guides/images-vision), [counting guide](https://developers.openai.com/api/docs/guides/token-counting).

## Conservative request costs

| Request | Input cap | Output cap | Ordinary uncached model-only cost at caps | Conservative model-only bound | Reserved |
|---|---:|---:|---:|---:|---:|
| Recognition | 16,384 | 500 | $0.0018884 | $0.002528 | $0.01 |
| Activity generation | 16,384 | 1,500 | $0.0023884 | $0.003078 | $0.01 |

Conservative formula: round up to a millionth of a dollar, `1.1 × (input × $0.125/M + output × $0.50/M)`. Uses the higher cache-write rate and 10% headroom; assumes no cache discount. Recognition counting and recognition processing both transmit the image, while activity generation uses reviewed corrected toy labels without a photo.

These are **conditional model-only bounds**, not verified all-in maximums. Count-endpoint fees, exact schema/image accounting, account/tax conditions and any additional charges must fit the remaining reservation margin before enabling requests. Output includes hidden reasoning. Current estimated receipts do not separately itemize cache-write billing; reconcile project costs rather than treating estimates as invoices. Unknown counting cost is a blocker before the first counting call, not something to discover by spending without a bound.

Planned three-image pilot: three recognitions +three generations +one alternative =seven Responses actions plus seven preflights, **$0.07 reserved**, conservative model-only bound **$0.019896**. Actual provider cost remains unmeasured. Full existing 24-image plan is at most 38 actions/preflights, $0.38 reserved and conditional model-only bound $0.103764, before unresolved charges. These small estimates do not authorize expansion or eliminate the need for controls.

## Spending-control verification

A $10 **monthly budget setting alone is insufficient evidence of enforcement**. Official documentation distinguishes notification alerts from an enforced hard spend limit; alerts allow traffic to continue. Verify whether the project's **Enforce a hard limit** setting is enabled. Even hard-limit propagation can allow slight overrun, and monthly reset differs from the cumulative experiment ceiling. [Official spend-limit guidance](https://developers.openai.com/api/docs/guides/spend-limits).

Recommend reducing only this testing project's hard limit to **$8**, with early alerts, leaving $2 buffer inside the $10 authorization. This is a recommendation, not a change made by this task. Do not change production or organization-wide controls. If only notification thresholds are available, the current server gate requiring verified provider control must stay closed; propose a verified alternative before activation.

Application source/tests confirm:

- Permanent $10 experiment maximum; above-$10 configuration rejected; ledger reused across runs/months.
- $0.01 reservation before either preflight or inference; uncertainty burns reservations and halts later requests. No automatic retries/refunds/resets.
- Ten synthetic slots; 14-day invitation expiry; ten recognition and ten generation actions per slot per UTC day.
- One concurrent request per slot and one global evaluation request; expired unresolved leases halt.
- Existing 100-action/hour quota unchanged; counted input ≤16,384; output capped at 500/1,500.
- Actual provider cost reconciliation raises the spending floor without erasing reservations or a halt.

Read-only testing ledger status: **reserved $0; effective reserved $0; provider cost null (not independently reconciled); ceiling $10**. Server budget/reservation configuration flags are absent, so source controls are implemented/tested but not activated. Neither that ledger nor owner-created monthly settings prove the actual invoice or an absolute provider billing cap. Exclusive testing-project/key use, complete all-in bounds, headroom and current billing reconciliation are required for a reliable pilot.

## Dataset and privacy boundary

The [manifest](tests/fixtures/ai-evaluation/manifest.json) contains **24 completed reviewed photographs with 24 distinct byte hashes**; fixture consistency, source/license metadata, byte limits and absence of EXIF/XMP/IPTC/comment segments passed current tests. [Attributions/permissions](tests/fixtures/ai-evaluation/SOURCES.md) document per-image source, creator, license and edits. These are licensed public toy photographs; no real family accounts or customer uploads. Eight cases permit generation, sixteen remain recognition-only because of small parts, magnets, lead or unverified historical/ride-on suitability.

Owner approval of this toy-only preparation is recorded. The separate server dataset activation version is unset; that is intentionally disabled configuration, not a need to repeat scope approval. Manufacturer safety is not certified by licensing/recognition. Battery-compartment/damage/cord photographic coverage remains a known gap, covered by mocked safety cases rather than claimed live results.

Fresh testing HTTP verification rejected unauthenticated calls to both `aiEvaluation:status` and `aiEvaluation:run` as non-public functions. Tests additionally reject parent-session use, owned invitations and normal guest bypass attempts. Public capabilities show **personalData:false, liveAIReady:false, isolatedTesting:true**. Normal collection/public AI environment flags are absent. Existing auth, payments, real-parent privacy gates, source and PRODUCT.md remain unchanged. No deployment or configuration write occurred in this task.

## Exact requirements before the first pilot

1. Install the new testing key **only** as server-side `OPENAI_TESTING_API_KEY` in the verified testing Convex dashboard, plus its actual `OPENAI_TESTING_PROJECT_ID`. Do not put either key in chat, client/Vite variables, source or production `.env.local`. Dashboard: https://dashboard.convex.dev/t/amay-bhatnagar/gummy-bear-v1-testing/blissful-dotterel-906 . The location was asked without requesting the secret; current verified server configuration is missing it.
2. Verify key-to-project ownership and model metadata/permissions using only the new project. Record safe pass/fail evidence, never raw key/API responses containing account details. Do not borrow production/admin credentials.
3. Confirm actual project spend enforcement and current project usage. Prefer $8 enforced hard limit and alerts for headroom; verify no other traffic/key consumers and no monthly-reset assumption. No change was made here.
4. Settle exact input/image/schema counting and all-in cost bounds, including any preflight fee. Recheck pricing within 24 hours of planned execution. If these cannot be established without an unbounded paid probe, remain stopped and resolve documentation/provider evidence first.
5. Complete evaluation-specific processor/retention acknowledgment; `store:false` is not zero provider retention. Use the existing separate synthetic policy/settings checklist in [implementation report](SYNTHETIC_AI_EVALUATION_REPORT.md). Never assert full R1 deletion or open normal data/paid-AI flags to enable this benchmark. Keep `V1_AI_EVALUATION_APPROVED` closed until live pilot approval.
6. **Obtain explicit approval for live execution**, as required by this instruction. First pilot stays at three images (01 plush age2, 03 blocks age4, 07 train age8), with one bounded alternative probe. No increase to five needed; any expanded plan must remain reviewed/bounded.
7. After all checks and approval: `node --experimental-strip-types scripts/ai-evaluation.mjs check`, then `pilot`. Review category-label recognition, corrected-input adherence, specificity, safety/materials/duplicate behavior, latency, receipt tokens and actual project costs. Zero unsafe accepted activities/privacy leaks; unknown cost/usage immediately stops further requests. Preserve prior successful ideas and require human review/project-cost reconciliation before continuation. No raw photos/private child information in telemetry.

No live accuracy, activity-quality or latency conclusions exist yet. The pilot does not establish production safety or readiness for real-parent testing.

## Commands and results

- Read-only testing CLI `convex env list`, invoked in the private verified testing workspace with scoped testing credentials; output captured and values withheld.
- `node --experimental-strip-types scripts/ai-evaluation.mjs check`: 24 ready images, zero reservations, activation/provider/cost blockers present.
- `npm test`: **373 guarded Vitest tests across25 files +3 Node tests passed**.
- Strict tests/config TypeScript using `--types vite/client,node`: passed.
- `npm run build`: application TypeScript/local production build passed; existing nonfatal auth dependency directive warning remains. Build was not published or connected to production.
- Read-only testing HTTP boundary/capability verification and production environment checksum: passed.

No browser tests rerun; no inference/counting/model-availability API request made because the testing key is unavailable. Only this readiness report was created. Existing unrelated untracked work untouched. Stop here pending setup and explicit live approval.
