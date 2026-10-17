# V1 production AI compatibility

Read-only verification: 14 October 2026, source checkpoint `f699443`.

**Conclusion:** The existing production credential is structurally suitable for the normal V1 recognition/generation implementation: both read `OPENAI_API_KEY`, use the Responses API and request `gpt-6-luna`. This does **not** verify key validity, project permissions, available credit or successful inference. Current V1 code explicitly refuses production processing regardless of key presence. Do not activate V1 AI yet.

## Existing production AI configuration

Production target from the saved, verified release configuration: `sensible-avocet-370`, existing `build-sprint-app` project. The isolated testing deployment is `blissful-dotterel-906`; the original project's development deployment is `intent-poodle-393`.

A fresh read-only `convex env list --deployment-name sensible-avocet-370` was captured privately and reduced to presence booleans. `OPENAI_API_KEY` is configured. No value, prefix, fingerprint or credential was printed, saved, copied, rotated or sent to OpenAI. `OPENAI_TESTING_API_KEY` and V1 approval/budget variables are not listed in production.

Historical pre-V1 source (`e623093:convex/play.ts`, `ideas.ts`, `rules.ts`) describes the existing integration: `play.discover` → access reservation → photo-run metadata → internal generator → quota → `POST https://api.openai.com/v1/responses`. The request names `gpt-6-luna`, low reasoning effort, `store:false` and 500 maximum output tokens. One reduced JPEG is used to identify toys and generate three ideas together. Response fields are `toys`, `ideas` (title/instructions), and `raw`.

**Evidence limit:** the release report explicitly says the exact deployed backend Git revision is unknown. Historical source is the legacy baseline, not proof of byte-identical deployed functions or the exact currently deployed request body. No provider request or remote backend-source/data retrieval was performed in this task. Current `convex/play.ts` contains the newer gated implementation and must not be mistaken for already-deployed production code.

## V1 AI requirements and request differences

| Property | Historical legacy baseline | Normal V1 source |
| --- | --- | --- |
| Secret variable | `OPENAI_API_KEY` | `OPENAI_API_KEY` in recognition and internal generation |
| Exact model | `gpt-6-luna` | `gpt-6-luna` for both steps |
| Provider endpoint | Responses `/v1/responses` | Same |
| Authentication | Server-side bearer key | Same; no project header in normal pipeline |
| Image processing | One JPEG, low image detail | One JPEG for recognition; normal UI clears preview on confirmation and sends generation `image:''` |
| Input sizing | JPEG data URL ≤350,000 characters | Same server character/type check; browser accepts ≤25 MB source and reduces longest side to ≤768 px |
| Output cap | 500 for combined request | Recognition 500; generation 1,500, provisional |
| Output format | Prompt asks for JSON; legacy validation | Strict JSON schemas plus application validation/filtering |
| Recognition output | Labels alongside ideas | Up to 12 distinct labels; parent correction/confirmation |
| Activity input/output | Photo and age; three unstructured ideas | Corrected names, age 2–8, optional interests/prior mechanics; 1–3 useful structured activities or recoverable limitation |
| Safety/quality | Historical prompt/validator | Contextual safety, materials/toy consistency and repetition filters; individual invalid activities removed |
| Memory | Photo-run operational metadata | Signed-in suggestions persisted; family ownership/consent required |
| Retry | Another combined request | A generation retry normally reuses confirmed labels, not the photo; previous successful results preserved |

Relevant source: `convex/recognition.ts`, `convex/v1Ideas.ts`, `convex/play.ts`, `convex/activityResponses.ts`, `convex/activityDuplicates.ts`, `src/photo.ts`, `src/features/app/usePlayFlow.ts`.

Normal V1 can technically accept an image in generation, but the approved frontend sends none after confirmation. Server byte-size checks alone do not prove actual image dimensions or token cost. Output caps include reasoning; they are not guarantees of 500/1,500 visible answer tokens.

## Credential compatibility and API permissions

No new credential type is required for normal V1: the same production key can serve both calls **if** its project permits `gpt-6-luna` and model requests to `/v1/responses`, with valid billing. Strict output schemas and inline image input do not require Files, image-generation, admin or fine-tuning permissions. Optional future token-counting access must be separately verified before introducing that endpoint. OpenAI documents model-request permissions separately from model-list permissions. [Official permissions guide](https://developers.openai.com/api/docs/guides/rbac).

Do not reuse the production key in isolated testing. The separate synthetic evaluation implementation (`convex/aiEvaluation.ts`, `evaluationPolicy.ts`) deliberately requires `OPENAI_TESTING_API_KEY`, `OPENAI_TESTING_PROJECT_ID`, an explicit `OpenAI-Project` header and verified evaluation approvals. That pathway is not the normal parent pipeline and its $10 authorization is not a production budget.

Sharing one production key also shares its project allowance and provider limits; the application's counters cannot see calls made elsewhere with that credential.

## Model compatibility and access verification

Official documentation lists `gpt-6-luna` with image input, text output, Responses, structured outputs and low reasoning effort. The model's published capabilities fit both normal pipelines; no different recognition model is configured. [Official model documentation](https://developers.openai.com/api/docs/models/gpt-6-luna).

Public documentation confirms capability, **not this key's access**. The owner can inspect the production OpenAI project's model settings, key permissions, effective account access and billing without generating output. A model metadata request such as `GET /v1/models/gpt-6-luna` can check model visibility without inference, but it is still a live OpenAI API request and was **not made** under this task's prohibition. Metadata access also does not prove that Responses writes, exact schemas, available credit or runtime inference work. [Retrieve model reference](https://developers.openai.com/api/reference/resources/models/methods/retrieve), [permissions guide](https://developers.openai.com/api/docs/guides/rbac).

The production key's OpenAI project membership, validity, model entitlement, restricted permissions, rate tier and exact-schema runtime compatibility remain unverified. No key can be trusted merely because its environment variable exists.

## Credit/billing uncertainties and spending controls

Current published standard model rates are $0.10 input, $0.01 cached input, $0.125 cache-write and $0.50 output per million tokens. Special tiers/large prompts/regions can change charges; image input is billable. [Official model pricing](https://developers.openai.com/api/docs/models/gpt-6-luna).

At standard output pricing alone, the legacy 500-token maximum contributes $0.00025; V1 recognition 500 plus generation 1,500 contributes $0.001 per complete two-step attempt. **These are output-only components, not total request costs or worst-case bounds.** Input/image tokens, reasoning within output accounting, retries and actual provider settings matter. Existing code does not establish an all-in production request ceiling. No image-token formula is assumed from another model.

No balance, invoice, provider project budget or hard-limit setting was inspected. Existing key presence and historical success do not prove current credit. A paid subscription to the app does not fund OpenAI automatically. No credit purchase or inference spending is requested or authorized here.

Legacy source enforces a shared **100 requests per rolling hour**, with guest trial/bonus/paid access reservation and refund logic. It has no cumulative dollar ledger, no verified per-request monetary bound and no equivalent per-tester concurrency control. Output size and request count limits are not hard invoice caps.

V1 testing admission adds ten invitations with 14-day expiry, ten recognition and ten generation requests per invited slot per UTC day, one active request per slot (90-second lease), global quota, and cumulative monetary reservations. The testing budget is capped at $10 and requires a positive configured request ceiling. Normal testing reservations remain charged conservatively when the lease is released; the separate evaluation implementation has usage accounting and uncertainty halts. **These are testing policies, not an approved production paid-access model.**

Provider spending controls vary by account/settings; hard and soft limits are distinct. No current production provider hard cap was verified. Even an application ledger can only bound covered requests if reservations conservatively exceed every actual cost and other paths cannot bypass it. [Official spending-limit guide](https://developers.openai.com/api/docs/guides/spend-limits).

## Required feature-gate changes — proposal only

A valid key cannot activate current V1 production code:

1. `shared/releaseFeatures.ts` hard-closes recognition/generation and family features; the production UI hides uploads and skips family queries.
2. `convex/v1Capabilities.ts` returns those closed defaults for every non-testing deployment.
3. `convex/v1Policy.ts` requires the exact testing deployment, paid-AI approval, policy approval and the exact privacy version.
4. `convex/releasePolicy.ts` rejects internal generation outside testing. Its gate also closes the legacy production endpoint in the pending candidate.
5. `convex/testingAccess.ts` requires invitations, testing consent and testing monetary admission. Existing invited signed-in generation bypasses paid/trial admission **only as a bounded testing grant**.
6. Privacy management functions also contain isolated-testing checks; production consent/deletion support cannot be activated by toggling the AI UI alone.

Future production activation needs an independently reviewed production policy, capability/UI changes, production-specific admission/quota/spending checks and privacy management support. Preserve existing paid/trial/bonus/refund semantics; never substitute testing invitations for production entitlements. Do not change the testing deployment allowlist to production or set testing flags as a shortcut. No gates or settings were changed.

The current live backend remains untouched. Its existing functionality is separate from the source-only paused-release gates; this report does not claim those gates are already active remotely.

## Privacy, consent and access prerequisites

Before sending real-parent photos or context through V1:

- Approve/publish processor notices covering Convex and OpenAI, actual retention, regional processing and permitted uses. `store:false` does not establish zero retention: default abuse-monitoring retention and image exceptions are separate from response storage. [Official data controls](https://developers.openai.com/api/docs/guides/your-data).
- Verify no original-photo persistence/logging/analytics/cache; temporary preview cleanup across confirmation/error/logout; only the reduced toy image sent for recognition. Ensure parents exclude faces, names and identifying objects. The app cannot erase the parent's gallery original.
- Approve the exact versioned privacy/retention policy and implement production acknowledgment/admission. Signed-in calls currently require current consent and no active deletion. Guest upload acknowledgment is currently a frontend step; review whether server-side proof is needed for the production policy rather than assuming invitation possession proves consent.
- Resolve outstanding R1 identity/session deletion, legally required financial retention, operational analytics/logs/backups and deletion evidence/support procedures. Family deletion is not full account deletion. Required policy approvals are still pending in `PRIVACY_AND_DELETION_REPORT.md`.
- Limit child context to age and optional interests; no DOB/name/phone transmitted intentionally. Free-form interests or corrected toy names can still contain personal details, so validate/minimize context and disclose it.
- Verify every saved suggestion/child/toy/attempt operation uses account ownership and approved consent; preserve guest expiry/linking safeguards.
- Approve production access and spending policy without altering paid entitlements or existing billing implicitly. Test expired accounts, trial/bonus refunds, concurrency, duplicate responses, retries and deletion-in-progress failures with synthetic data.

Synthetic-only approval cannot satisfy real-parent privacy prerequisites. Existing production behavior remaining unchanged does not authorize collecting additional V1 family data.

## Cost and security risks

Confirmed blockers: production V1 gates, missing listed V1 approval/budget settings, testing-only admission/privacy design and incomplete full-account deletion/policy activation. Confirmed request expansion: two calls for first value, higher generation output cap, prior-history/interest context and persistence for signed-in users.

Unverified risks: current key validity/project permissions/credit, exact deployed legacy backend revision, actual image usage, schema success at the model, real output safety/recognition quality and provider-wide spend coverage. Local JPEG character limits do not independently enforce dimensions/token charges; quota is request-count based. A valid key does not certify safety or affordability.

## Recommendation and verification boundary

**Credential compatibility: conditional yes. Production V1 activation readiness: no.** No model or key replacement is justified by the source comparison alone. Preserve existing production functionality while resolving V1 policy, privacy, access and bounded-spending prerequisites separately. Do not deploy the currently gated backend expecting the existing key to make V1 work.

Next approval step: owner review of this report and production-project model/permission/billing evidence without generating output. Any later provider call or activation needs its own authorized scope; no inference should proceed with uncertain funding or spending bounds.

Only this report was created. No application/configuration edits, production records accessed, schema writes, deployment, provider API calls, credit purchases or live AI tests occurred. A read-only Convex environment-presence check and public official documentation retrieval were performed. Automated tests were not rerun because no executable code changed; previous results are recorded in `PRODUCTION_READINESS_REPORT.md`, not new evidence of inference success.
