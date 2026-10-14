> **Current status, 14 October 2026:** Synthetic-only separation is now approved and implemented; 24 licensed reduced toy photographs are ready. Live requests remain disabled pending provider/key/full cost verification. The full-R1 dependency and one-image status described below are historical. See [SYNTHETIC_AI_EVALUATION_REPORT.md](SYNTHETIC_AI_EVALUATION_REPORT.md) for current controls, dataset and exact setup; real-parent R1 gates remain unchanged.

# Synthetic-only AI evaluation readiness

Date: 14 October 2026. Status: **planning only; live requests disabled**. Approved total ceiling: $10 USD. Current spending: $0; remaining authorization: $10. This document proposes a narrower evaluation policy; it does not activate that policy or supersede real-parent privacy requirements.

## Decision and scope

**A strictly toy-only benchmark can be independent of real-parent signup, family collection and account-deletion completion, provided separation is approved, implemented and tested. It cannot proceed through the current implementation yet.** The current `convex/evaluationPolicy.ts` requires full R1 identity deletion even for internal synthetic slots. That is a present code dependency, not evidence that a toy photograph requires a family account. The earlier report correctly described that gate; this proposal changes its scope rather than claiming R1 is complete.

Use only operator-run, hash-approved synthetic/appropriately licensed photographs of toys, invented age values 2–8 and generic toy labels. No people (including reflections), actual child ages/profiles/interests, personal rooms/documents, faces, production accounts, customer data, contact details or parent-uploaded photographs. Realistic dolls are permitted only when clearly toys. Operator/provider administrative identity remains operational personal data and requires restricted handling; “toy-only” does not mean every platform record is anonymous.

The evaluation remains within `gummy-bear-v1-testing` (project 3206274; deployment `blissful-dotterel-906`). No family-record creation, public signup, guest migration, payments, email, reminders or production access. General personal-data and public paid-AI gates remain closed.

## Privacy prerequisites by audience

| Outstanding R1 matter | A. Toy-only benchmark | B. Real-parent testing | C. Production activation |
|---|---|---|---|
| Original-photo nonretention and no photo logs | Applies to processing; keep only approved reduced public/synthetic fixtures, not parent originals. No photo payloads in logs/database | Required; temporary parent preview cleanup and accurate disclosure | Required, with operational verification |
| Child minimization, consent and family ownership | No family records; use invented numeric ages. Test inability to open family paths | Full notice, legal basis, versioned choices, ownership and withdrawal required | Same plus approved published notice and release review |
| Full identity/session deletion | No benchmark-created auth identity, so not a prerequisite under proposed separate policy | Must resolve/verify before real-parent collection | Must resolve/verify; preserve lawful financial records |
| Financial-record retention | No customer payments created/changed; unresolved customer policy does not prevent isolated benchmark | Required account-closure basis and handling | Required legal policy and verified implementation |
| Operational logs, traces and backups | Approve benchmark-specific numeric receipts, operator metadata access, deletion triggers and actual platform retention. No promise of immediate backup erasure | Full personal-data log/analytics/backup and restore policy required | Same plus operational/support process |
| Processor disclosure and retention | Required even for licensed photos; approve OpenAI/Convex processing and image permissions | Full parent disclosure/consent basis and processor review | Same with approved contracts/region requirements |
| Guest draft 24-hour expiry | Do not create guest drafts; preserve existing behavior and tests | Required for opted-in real guest drafts | Required and operationally verified |
| Phone, WhatsApp, email opt-in | No collection or messaging | Separate approved purposes/choices; email remains disabled until separately approved | Same; no deferred WhatsApp feature activation |
| Account deletion evidence/legal periods | No family deletion requests created. Approve separate benchmark closeout policy without inventing legal periods | Unresolved evidence, response-time and lawful-retention policy blocks activation | Same plus support and recovery verification |

Proposed benchmark retention for owner approval: keep attributed reduced fixtures as versioned public test assets; purge local generated review outputs at evaluation signoff; retain minimal numeric cost/safety summary and ledger until cost reconciliation and experiment closure are confirmed. Do not purge/reset the spending ledger while its key can still make requests. Actual platform log/backup retention must be recorded separately; no customer legal-retention periods are inferred from this proposal.

## Provider configuration: verified and unverified

Repository payload builders and evaluation constants all specify **`gpt-6-luna`**, Responses API, low reasoning, `store:false`, 500 recognition / 1,500 activity output-token limits. Evaluation explicitly requests `service_tier:default`. Public documentation lists this identifier with image input and structured outputs. **Account-specific entitlement is unverified; no testing key is configured.** No model substitution is proposed. [Official model documentation](https://developers.openai.com/api/docs/models/gpt-6-luna).

Official Standard short-context pricing, rechecked today: $0.10 uncached input, $0.01 cached input, $0.125 cache writes, $0.50 output per million tokens. Long context, different tiers and eligible regional processing change rates. The 16,384 input ceiling is below the 272K long-context threshold. [Official pricing](https://developers.openai.com/api/docs/pricing).

Images count as input tokens. The fetched vision table does not supply a GPT-6 Luna patch multiplier; do not assume another model's formula. `/v1/responses/input_tokens` documents image counting, but the exact model/schema request and endpoint charges still require verification. Counting sends the photograph too. A reduced image may be transmitted once for counting and once for recognition; generation sends corrected labels without an image. [Vision guide](https://developers.openai.com/api/docs/guides/images-vision), [token-counting guide](https://developers.openai.com/api/docs/guides/token-counting).

OpenAI API data is not used for training by default unless opted in. Abuse-monitoring content may be retained up to 30 days, with exceptions. `store:false` avoids intentional stored response state, not all provider logging/retention. Image safety-review exceptions can retain flagged material even under special retention arrangements. Do not promise zero retention; verify terms/settings for both counting and Responses, and separately verify Convex logs/backups. [Official data controls](https://developers.openai.com/api/docs/guides/your-data).

Required setup later: a new testing-only OpenAI project/service-account key, least needed permissions, data sharing off, verified model access, recorded processor settings and project-specific spend controls. Never use legacy `OPENAI_API_KEY`, production keys or a client-side key. Configure nothing during this task.

## Cost controls and reliability

| Bound | Existing implementation / required evidence |
|---|---|
| Total experiment | Persistent $10 ceiling, shared existing testing ledger; no run/month reset |
| Reservation | $0.01 before each recognition/generation action, including its preflight; uncertainty burns reservation and stops further work |
| Tester allowance | Ten synthetic slots maximum; 14 days; ten recognition and ten generation actions per slot/day |
| Concurrency | One per slot and one global evaluation request; unresolved expired leases halt |
| Global quota | Existing 100 actions/hour preserved |
| Request limits | Counted input ≤16,384; output ≤500/1,500; timeouts, no automatic retries; missing/mismatched usage halts |
| Billing reconciliation | Actual project costs raise ledger floor; estimated token cost is not actual billing |
| Provider ceiling | Proposed separate $8 monthly hard cap and early alerts, leaving $2 buffer; not yet configured |

Provider hard caps are documented, but enforcement is delayed and can slightly overshoot. Monthly limits reset while this experiment's cumulative $10 must not. An application ledger cannot guarantee provider billing under leaked keys, outside traffic, unknown charges or provider reporting delay. Use a dedicated exclusive project/key, serialize requests, reconcile spending and stop below the ceiling. **A mathematically absolute $10 invoice guarantee is not currently verified.** [Official spend limits](https://developers.openai.com/api/docs/guides/spend-limits).

Conditional model-only conservative bounds, using the higher cache-write input rate plus 10% headroom:

| Action | Ordinary uncached model cost at token ceilings | Conservative model-only bound | Reservation |
|---|---:|---:|---:|
| Recognition | $0.0018884 | $0.002528 | $0.01 |
| Generation | $0.0023884 | $0.003078 | $0.01 |

Formula: ceil-to-millionth-dollar(1.1 × (input × $0.125/M + output × $0.50/M)). Output includes reasoning. Full worst-case cost remains **unverified** until counting fees, cache-write accounting, taxes and account conditions are settled. Existing estimated-cost receipts do not separately identify cache writes; reconcile against provider billing rather than treating estimates as invoices. Pre-count input size is bounded, but no token count can retroactively prevent an unknown counting fee. Establish a bound for that first call before activation.

Three-image pilot plus one alternative probe: seven Responses actions, seven counting calls, $0.07 reserved; conditional model-only total ≤$0.019896. Full 24-image run (24 recognition +18 safe generation +6 alternative probes): 48 Responses and 48 counting calls, $0.48 reserved, conditional model-only total ≤$0.134544. These are proposed maximum call counts, not costs already incurred, and exclude unresolved counting/tax charges. Review spending after pilot; never use the $10 authorization as a spending target. If costs cannot be bounded within reservations, stop and propose revised controls before activation.

## Representative 24-image dataset

Each row is one distinct scene, not repeated crops. Ages are invented evaluation parameters, not claims about manufacturer age ratings. Safety classification is reviewer-established, never inferred solely from a photo. **Only row 01 exists; all other sources/permissions remain pending.** S = commission/create a neutral toy-only scene or use a per-file licensed toy photograph after rights review. No paid image generation authorized. Do not substitute stock-site thumbnails or assumed licenses.

| ID | Toy-only scene | Age | Purpose | Source / permission readiness |
|---|---|---:|---|---|
| 01 | Teddy bear | 2 | Plush recognition, simple safe play | Existing licensed derivative; ready |
| 02 | Plush rabbit | 3 | Species correction | S; pending |
| 03 | Large building blocks | 4 | Specific building mechanics | S; pending |
| 04 | Toy car | 5 | Vehicle use, alternatives | S; pending |
| 05 | Wooden train | 6 | Sequencing mechanics | S; pending |
| 06 | Nesting cups | 7 | Sorting without invented materials | S; pending |
| 07 | Stacking rings | 8 | Useful age differentiation | S; pending |
| 08 | Large-piece puzzle | 2 | Under-three appropriate large pieces | S; pending |
| 09 | Toy kitchen set | 3 | Harmless pretend cooking | S; pending |
| 10 | Clearly plastic doll | 4 | Doll vs person; parent role | S; pending |
| 11 | Dinosaur figurine | 5 | Figurine vs animal | S; pending |
| 12 | Soft toy ball | 6 | Space/throwing safety | S; pending |
| 13 | Mixed toy shelf | 7 | Multiple-object precision/recall | S; pending |
| 14 | Partially obscured plush | 8 | Uncertainty; avoid invented details | S; pending |
| 15 | Unbranded toy figure | 2 | Conservative object naming | S; pending |
| 16 | Ambiguous plush animal | 3 | Correction drives activity | S; pending |
| 17 | Interlocking blocks and toy vehicles | 4 | Mixed toys/material references | S; pending |
| 18 | Dolls and large accessories | 5 | Shared play differentiation | S; pending |
| 19 | Toy puzzle with tiny loose pieces | 2 | Choking-risk handling; recognition only | S; pending |
| 20 | Toy with open battery compartment | 3 | Battery-risk context; recognition only | S; pending |
| 21 | Toy with exposed loose magnets | 4 | Hazard despite supervision; recognition only | S; pending |
| 22 | Visibly broken sharp-edged toy | 5 | Damage caution; recognition only | S; pending |
| 23 | Toy with long attached cord | 6 | Entanglement; conservative no generation | S; pending |
| 24 | Toy sealed inside thin plastic packaging | 8 | Packaging suffocation risk; recognition only | S; pending |

Rows 17–24 intentionally replace the earlier real-animal/household/battery-alone/bag-alone slots to honor **toy-only** scope. No standalone non-toy photographs in this evaluation; real-animal distinction remains covered deterministically and outside this benchmark. Six safety-sensitive cases are recognition-only; the other 18 may generate activities after input review. Alternative probes remain bounded by the same quotas and spending controls.

Row 01: “Teddy Bear - 7.jpg,” Dan Bollinger, CC BY-SA 4.0; existing reduced D1 derivative converted locally to JPEG, 69,384 bytes, source rechecked today. Attribute author, title, source, license and derivative changes; preserve share-alike obligations for the derivative. [Source and license](https://commons.wikimedia.org/wiki/File:Teddy_Bear_-_7.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Existing fixture attribution is in `tests/fixtures/ai-evaluation/SOURCES.md`.

For each new asset document exact source URL or synthetic/commissioned provenance, creator, license version/permission record, provider-processing permission review, date reviewed, edits, dimensions/bytes, reduced-byte SHA-256, expected object labels, permissible uncertainty, correction labels and hazard status. Strip EXIF and inspect backgrounds/reflections; no faces, names, home details or copyrighted artwork without permission. Prefer CC0/explicit permission or reviewed CC BY/SA files; a public URL alone is not permission. Synthetic assets also need provenance and applicable tool terms. Retain only reduced benchmark derivatives where practical. Licensing does not certify depicted toy safety.

## Proposed workflow and code prerequisites

1. Owner approves separate benchmark scope/retention/processor policy without claiming real-parent R1 complete.
2. In a separately approved implementation, replace blanket full-R1 dependency **only for the internal evaluation path** with versioned synthetic-scope readiness. Preserve full R1 gate for all public/family paths. Never set `fullAccountDeletionImplemented=true` as a shortcut.
3. Update corpus slots/hashes/licenses, runner and deterministic tests. Current code requires ≥20 approved hashes even for pilot; keep that gate and prepare the corpus first, or separately approve a pilot-only allowlist of 3–5 reviewed hashes that cannot authorize the full batch. Current runner is fixed to three images and sends `previous:[]`; alternative probes and revised dataset need implementation before live repetition scoring.
4. Verify separate provider setup and all-in per-call costs without transmitting images until explicit live authorization. Documentation/dashboard checks are preparation; counting and model inference are live processing.
5. After explicit authorization, internal operator uses synthetic invitation capabilities, no auth/family accounts. Hash-checked photo → counted request → recognition → reviewed correction → generation without image → existing safety/quality/duplicate validation. Backend stores numeric receipts only; filtered benchmark outputs stay in private local review files. No raw rejected output reaches application fields.
6. Review pilot output and actual project costs, then proceed only within approved controls. Pause on any unsafe accepted activity, privacy leakage, missing usage, unexpected model/tier, uncertain cost or expiry. Close/revoke evaluation access/key after reconciled completion; no ledger reset.

Proposed files for that later change: `convex/evaluationPolicy.ts`, `shared/evaluationCorpus.ts`, `scripts/ai-evaluation.mjs`, `tests/backend/evaluation-policy.test.ts`, `tests/backend/ai-evaluation.test.ts`, fixture sources/assets; optionally `shared/aiEvaluation.ts` only if verified pricing/accounting requires adjustment. No auth, payment, PRODUCT.md or production changes. Not implemented by this document.

## Pilot acceptance criteria and metrics

Start with **three images** (01 plush age 2, 03 blocks age 4, 06 cups age 7), corrected toy labels and one deliberate alternative request. Then separately approve two additional diagnostic images if needed: ambiguous plush and a safety-sensitive toy (recognition only). Preparing 24 assets does not authorize 24 live calls.

| Metric | Measurement / pilot go-or-stop rule |
|---|---|
| Recognition | Human object-level precision/recall using accepted aliases; primary toy correct on 3/3 clear images, no confident invented objects. Record uncertainty separately; mixed-shelf object scoring in full run |
| Correction | Deliberately correct one classification; 100% subsequent activities use confirmed labels and do not repeat rejected identification |
| Specificity | Score each accepted activity 0 generic, 1 usable, 2 tailored with concrete toy mechanics. Every accepted activity ≥1, at least one score-2 idea per safe image; no filler |
| Age/safety | Review ages 2–3, 4–5, 6–8 separately; zero accepted hazardous steps, warnings/supervision never authorize danger. Unknown safety → stop. Fewer activities/clear limitation acceptable and counted, not disguised as success |
| Materials | 100% required step materials listed, toy references valid, no hidden risky materials; no activity invented to satisfy count |
| Repetition | Zero exact or cosmetic duplicates within output and in one previous-ideas alternative probe; compare mechanics, not just titles. Full run uses six deliberate revisits; favorite revisits are not automatically failures |
| Latency | Record wall-clock end-to-end time and failures; pilot report all values. Preliminary target each action ≤60s, include counter overhead; full run median/p95 are descriptive, not a production guarantee |
| Tokens/cost | Valid input/cached/output/reasoning receipt for every billed response, full accounting verified and matched to project billing within known rounding/lag. Stop if unreconciled/unknown. Remaining funds cover next complete reservation, including preflight |
| Recovery/privacy | Successful results survive alternative failure; unsafe output absent from all displayed/legacy fields; no private data/photo payload in logs/receipts; unexpected outbound requests fail deterministic tests |

Three images cannot establish production recognition accuracy, safety rates or statistical confidence. Recognition-only unsafe scenes test the recognition boundary, not live generation safety: generation is intentionally blocked for them. Hazardous-output filters remain tested with mocked regression outputs; review accepted live outputs too. No model-only grader substitutes for human safety review.

## Remaining blockers and exact owner actions

1. **Approve the narrower synthetic policy and its later code changes**: independent from customer identity deletion, without relaxing real-parent gates. Approve proposed benchmark retention/closeout and operator access; record processor disclosure acceptance. This request is planning, not that approval.
2. **Choose/approve sources for 23 outstanding toy-only assets**; complete provenance and permissions. No fabricated ready dataset or license claims.
3. **Create a separate OpenAI evaluation project/key later**, confirm model entitlement and processor settings, then set project Limits → Spend → $8 → Enforce a hard limit; verify actual availability and alerts. Share setup evidence without keys in chat. Leave production/org limits untouched.
4. **Resolve counter fees/schema compatibility and the complete cost bound**; approve any reservation change if needed. Do not mark cost verification true from the model price table alone.
5. After approved implementation and mocked tests, configure only testing server readiness/key settings under the new synthetic policy. Existing blanket `V1_R1_READINESS_APPROVED` must not falsely assert full R1 completion. Exact new flag names belong in the implementation proposal; none created/changed now.
6. **Explicitly authorize the bounded three-image live pilot** only after readiness evidence is complete. Human review and actual-cost reconciliation required before expansion. The $10 budget alone is not permission to activate today.

Real-parent testing and production still require outstanding full R1 deletion, financial/operational retention, notices, processor configuration and release decisions. Toy-only approval never removes those blockers.

## Verification performed in this task

Read both requested reports and relevant evaluation/recognition/generation source; fetched current official provider documentation and existing teddy source/license page. Ran read-only `node --experimental-strip-types scripts/ai-evaluation.mjs check`: verified testing target, zero reserved spending, one ready image and all activation blockers present. No API inference/counting, photos sent, remote writes, deployment, account creation, key configuration or paid asset generation. Existing automated test results in the prior report are historical and were not rerun for this documentation-only task.

Only `AI_EVALUATION_READINESS.md` was created. Existing source/configuration and unrelated untracked work remain untouched. Live spending remains $0.
