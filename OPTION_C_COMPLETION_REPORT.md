# Option C completion and activation readiness

15 October 2026. **Safe source work completed and installed only in `gummy-bear-v1-testing`; full production Option C remains blocked.** Option A at https://sensible-avocet-370.convex.site/ remains unchanged. No production deployment/configuration/data mutation or paid inference occurred.

## 1. Feature completion matrix

“Implemented, gated” means functioning source with deterministic tests, not approval to collect real data or a claim of live-provider success.

| Workstream / feature | Status | Evidence / remaining requirement |
| --- | --- | --- |
| D1.2 landing + existing production tool | Preserved | Public landing/app/original bundle/style/QR hashes still match Option A; original backend untouched |
| C1 no original-photo persistence; label+age; optional DOB/interests; guest expiry | Existing implementation verified | Existing guarded photo/privacy/expiry tests pass; no new collection activated |
| C1 family removal, typed account request and resumable progress | Implemented, gated | Existing bounded deletion/retry/isolation tests; identity remains honestly pending |
| C1 identity/session preparation | Implemented preparation | Owner-only numeric inventory, bounded indexed removal-batch planner; synthetic application of plans proves ordering/resume/isolation |
| C1 complete account identity/operational deletion | **Blocked, not complete** | Finalizer remains disabled; fresh proof, legal exceptions, logs/backups, rate-limit/unowned verifier handling and completion evidence need approval |
| C1 privacy withdrawal | Implemented, gated | Works when global collection is closed; stops new saving/admission, turns email off, retains records until deletion; does not recreate erased consent |
| C2 existing password login/session expiry | Preserved and tested | Actual installed provider with synthetic signed keys/accounts; expired refresh refused, reauthentication keeps same identity/paid history |
| C2 Google integration | Wired, blocked | Existing testing-only registration/callback; stricter verified-email/provider-ID checks; credentials and live OAuth not verified |
| C2 email OTP/password recovery delivery | **Partial, blocked** | Existing 8-digit/10-minute factory and sanitized delivery failure; no approved service/transport registration or actual code/reset delivery |
| C2 automatic email merging prevention / guest linking | Implemented and tested | Proved identity retained; matching-email collision refused; one-owner guest proof, expiry/idempotence and entitlements preserved |
| C3 normal V1 provider cost enforcement | Implemented, gated | Full-input count preflight, numeric usage checks, conservative reservations, lease/consent recheck, uncertainty halt; no live requests |
| C3 production-key model visibility | Verified narrowly | Metadata-only GET returned HTTP 200 for `gpt-6-luna`; billing, Responses permission and real inference remain unverified |
| C3 safety/quality/correction/nonrepetition | Existing implementation preserved | Complete regression suite; real bounded generation test excludes hazardous output and uses corrected names without resending photo |
| C3 synthetic-only evaluation | Preserved and isolated | Separate testing key/project, internal allowlisted 24-image path; no pilot or spending |
| C3 production admission/budget activation | **Blocked** | Current architecture remains testing-only; production paid-access/spend policy and explicit activation code review required |
| C4 child/toy/history/feedback/personalization | Implemented, gated | Existing integrated ownership tests plus deletion/idempotence/capacity fixes; real-parent use disabled |
| C5 in-app reminders/manual reuse | Implemented, gated | Existing calendar-month exclusion, opt-in/cadence/suppression/reported-play and unsafe-donation tests |
| C5 unsubscribe | Implemented preparation, gated | Hash-only proof, owner-specific opt-out, replay harmless, no reads/reenabling; fragment cleared, explicit UI confirmation, no opt-out on page open |
| C5 email sending/failure retry/bounce handling | **Blocked, not complete** | Service/sender/domain, approved consent and delivery/receipt/retry policy missing; no sender/outbox falsely marked operational |
| C6 responsive/PWA/keyboard semantics | Automated checks passed | 21 localhost-only checks; worker/manifest/icons/offline shell; skip-link defect fixed |
| C6 physical phones and assistive technology | **Not tested** | Separate iPhone Safari/Android Chrome/VoiceOver/TalkBack checklist prepared |
| C7 schema/access/payment compatibility | Source verified | Existing validators/indexes retained; reviewed additive index only on auth table; no record migration |
| C7 production deployment/activation | **Not performed** | Option A remains live; current default V1 build is still closed in production |

## 2. Files created and modified

Final changes relative to Option A checkpoint `0ef387e`:

- Backend: new `convex/boundedProvider.ts`, `convex/deletionPlan.ts`; updated `authProviders.ts`, `family.ts`, `privacy.ts`, `schema.ts`, `play.ts`, `recognition.ts`, `v1Ideas.ts`, `v1Capabilities.ts`, `testingAccess.ts`.
- UI: new `src/features/app/EmailUnsubscribe.tsx`; updated `Application.tsx`, `PrivacySettings.tsx`, `navigation.ts`. Existing layouts/tokens/landing were reused.
- Build isolation: `vite.config.ts`, `scripts/prepare-testing-build.mjs`, `scripts/prepare-option-a.mjs`, its `.d.mts`; `playwright.config.ts` includes new safe checks.
- New tests: `bounded-provider.test.ts`, `deletion-readiness.test.ts`, `auth-session-recovery.test.ts`, `email-unsubscribe.test.ts`, `option-c.spec.ts`.
- Updated tests: schema compatibility, auth providers, family, privacy, Option A, existing V1 AI contract cases, browser isolation/environment checks.
- Documentation: this report, `OPTION_C_DEVICE_CHECKLIST.md`, implementation progress and plan updates.

PRODUCT.md, approved landing source/assets, original production JS/CSS/QR, password auth registration/configuration, HTTP/hosting configuration, payment/access functions, dependencies and lockfile are unchanged. No credentials were added or copied. A temporary sign-in restriction during pending deletion was reverted: final behavior preserves sign-in to inspect pending status while existing server checks prevent new family writes/linking. No automatic provider identity linking was added.

## 3. Tests and verification

| Check | Final result |
| --- | --- |
| Baseline guarded suite | 386 Vitest +3 Node passed |
| Final `npm test` | **418 Vitest /32 files +3 Node passed** |
| Strict application/tests/config TypeScript | Passed |
| `npm run build` | Passed; this is not an approved production artifact |
| `npm run build:testing` | Passed; production legacy bundle/QR excluded |
| `npm run build:option-a` | Passed; original app/style/QR hashes retained; Finder metadata excluded |
| Main isolated browser suite | **21 passed**, including compiled testing PWA and closed production build; no skips |
| Separate Option A browser suite | **4 passed** against preserved frontend |
| `npm run testing:verify` and `testing:push` | Verified separate project; functions compiled/installed into `blissful-dotterel-906` only |
| Testing capability query after installation | Collection/AI/recognition/generation/Google/OTP/email reminders all false |
| Production public artifact check | Existing Option A landing/app/style/QR unchanged and available |
| Protected-path/environment hash/whitespace | Passed |

Commands: `npm test`; strict `tsc --ignoreConfig --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --allowImportingTsExtensions --resolveJsonModule --types vite/client,node` over backend/setup/browser tests and test/Option A configs; the three builds above; testing verification/push; `GUMMY_TEST_URL=http://127.0.0.1:5175 GUMMY_PWA_TEST_URL=http://127.0.0.1:5176 GUMMY_PRODUCTION_PREVIEW_URL=http://127.0.0.1:5177 npx playwright test`; `npx playwright test --config playwright.option-a.config.ts`.

All test accounts/data/provider replies are synthetic. Guarded workers block fetch and Node networking before application imports. Browser backend HTTP/WebSockets are intercepted before navigation. Narrow mocks preserve existing activity-contract tests; new bounded-provider tests exercise the real count/usage/admission path. No unsafe production-mutating browser suite ran. Cloud installation was source/schema configuration in testing; no remote parent signup, identity removal, email send or AI request was executed.

Failures corrected: schema test loop braces; typed synthetic activity category; malformed unsubscribe JSX; testing build caught the copied production client; unsubscribe simulator needed a committed query transition to resolve the mutation; a redundant planner-stage comparison was corrected after typechecking refused installation. Final checks passed. Existing nonfatal dependency build/directive warnings remain.

Checkpoints: `de19174` before work; `b2193f4` deletion readiness; `2ec255e` bounded provider work; final checkpoint recorded in Git history. No Git push or production publish.

## 4. Authentication readiness

Google factory/integration already existed; verified-mail truth must now be actual boolean true, with a nonempty stable provider subject. Same-email identities cannot be silently merged: the installed Convex Auth custom callback runs before its default email-linking code; existingUserId comes from a proved provider account. Existing accounts retain their ID, hash, bonus and paid dates.

Email OTP factory remains 8 digits/600 seconds; delivery errors cannot echo codes, recipient addresses or provider payloads. The configured provider list still omits OTP until a real adapter is approved. Expired-session refresh and password reauthentication were tested with actual installed auth functions in memory. This is **not** proof of emailed password recovery or live OAuth.

Testing credentials check: Google ID/secret and OpenAI keys are not listed. No email service was identified/approved; the owner clarification remains unanswered. No provider was registered or enabled speculatively. Real provider redirects/delivery, dual-proof linking/recovery policy and external configuration verification remain blockers.

## 5. Privacy, deletion and retention readiness

No original photographs are persisted by the new flow; decoded/canvas resources and previews are cleared. Child label+age are the only required profile values. Existing family records remain until parent removal; guest drafts keep the fixed 24-hour expiry. Consent withdrawal does not erase retained inventory/history automatically.

The new owner-only readiness query returns bounded counts, with a truncation indicator—never IDs, codes, hashes, addresses or tokens. The internal preparation helper uses owner/session/account indexes, plans up to 100 removals, orders refresh tokens/PKCE proofs before sessions and verification codes before provider accounts, and can resume by stage. **It does not execute deletions or expose a finalizer.** Tests apply its plans only to in-memory synthetic records; user identity/payment data remains and request status still says awaiting policy. The future finalizer must atomically persist its cursor, freeze new auth issuance, require fresh proof, enforce stale-token denial and handle final legal exceptions before claiming success.

`fullAccountDeletionImplemented` stays false. Sessions/identity, operational associations, unowned verifiers/rate-limit identifiers and financial archival references remain unresolved. Family removal and preparation are not complete account deletion.

| Data category | Current boundary | Owner decision still required |
| --- | --- | --- |
| Original/reduced photos | No persistence; temporary processing only | Processor/counting disclosure, actual platform logs/regions/retention |
| Labels/ages/optional DOB/interests; inventory/history | Until explicit parent deletion | Final published policy/version and operational response procedures |
| Guest draft | Fixed 24 hours; bounded cleanup | No new retention period proposed |
| Consent/preferences/unsubscribe proof | Current choices; proof cleared on opt-out; family deletion removes preferences | Consent evidence/version and proof issuance policy before email activation |
| Auth identity/sessions/codes/verifiers | Preserved; indexed bounded preparation | Fresh-proof rules, finalizer authorization, stale-token/recovery verification |
| Payment events/entitlements | Preserved; **not all assumed legally necessary** | Operating entity/jurisdiction, exact legally required fields, basis/period and restricted archive access |
| Analytics/access/quota/operational email references | Existing behavior; no automatic deletion by email matching | Ownership mapping, allowed erasure/anonymization and retention |
| Logs/traces/backups/restores/processor copies | Not inspected or reconfigured | Actual settings, access, deletion timing, restoration suppression and evidence |

No legal retention periods were invented. Existing payment records keyed by email cannot be blindly attributed/deleted where emails are shared, changed or duplicated. The owner must establish actual legal exceptions rather than retaining every financial-associated field by assumption. Do not activate real-parent collection on the current draft/version before resolving these policies.

## 6. AI readiness and spending controls

A single authorized metadata-only GET `/v1/models/gpt-6-luna` using the existing production `OPENAI_API_KEY` returned HTTP 200 with the expected model identifier. The key was read privately in memory, never printed/saved/copied to testing. **This proves model visibility, not funded Responses access or successful inference.** Billing/project membership/write permission/actual generation remain unverified. No credits purchased and no inference requested.

Normal V1 continues using `OPENAI_API_KEY` and `gpt-6-luna`; evaluation retains its separate testing key/project. Official capabilities support image input, Responses and structured outputs. [Official model documentation](https://developers.openai.com/api/docs/models/gpt-6-luna).

New normal-V1 safeguards:

- Require separately verified pricing version, count fee and expiry no more than 24 hours ahead before reserving/sending.
- Count exact model/input/instructions/schema—including image—before inference; maximum 16,384 input tokens. Recognition output 500; generation output 1,500 including reasoning.
- Compare conservative quote plus verified counting fee against the already-reserved request ceiling; force default service tier and forbid redirects.
- Recheck server lease, current consent/deletion status and cumulative ledger after counting.
- Validate model/tier, actual token count consistency, output cap, cached/reasoning fields and totals before returning results.
- Retain reservations; unknown usage, accounting/transport uncertainty or excess input halts further testing. Record numeric model-derived estimates separately from provider invoice totals.
- Preserve one concurrent request/invitation, ten recognition and ten generation attempts/day, ten invited testers/14 days, existing 100/hour global quota and maximum $10 testing reservation ledger. These are testing controls, **not** approved production paid-access policy.

Official standard rates are $0.10 input/$0.50 output per million tokens, with separate cache rates. Using existing higher cache-write rate and 10% headroom gives conditional model-only maximum estimates $0.002528 recognition and $0.003078 generation at these caps, **plus counting fees/other account charges**. Fees and actual provider settings must be verified before activation; `usageEstimatedMicros` is not the invoice. [Model pricing](https://developers.openai.com/api/docs/models/gpt-6-luna), [token-counting guide](https://developers.openai.com/api/docs/guides/token-counting).

The ledger cannot cap unrelated requests using the same provider project/key; provider-side hard controls must be independently verified. Synthetic evaluation budget remains unspent by this task; no $10 pilot was run. Counting itself transmits a photo and must be included in final processor/consent review. `store:false` is not a zero-retention guarantee. [Official data controls](https://developers.openai.com/api/docs/guides/your-data).

Production gates remain hard-closed in source and testing admission cannot run in production. Current production app is the preserved old implementation, untouched by these new gates. Do not deploy current gated backend expecting the existing key to enable Option C: production-specific access/spending policy and activation code changes are still required.

## 7. Email reminder readiness

In-app/manual reminders and their existing two-calendar-month exclusion, cadence, dismissal, parent-reported-play suppression and no-unsafe-donation guidance pass tests. No status changes are automatic.

Prepared unsubscribe accepts only a 256-bit proof, looks up its stored SHA-256 digest, turns off the associated email preference and clears the proof. Invalid/replayed proof gets a generic response; no family/owner data returned. It works with collection approval withdrawn, rejects production, and requires explicit UI confirmation rather than mutating on link load. Proof stays in URL fragment until capture, then is removed from history; it is not sent as a query parameter.

No proof is issued or email sent today. Provider-specific send/receipt/bounce/retry behavior, verified sender/domain, scheduled delivery, minimal outbox retention, frequency and opt-in wording remain blocked by the unapproved service. Delivery cannot be represented as complete. Future dispatch must recheck consent, cadence, toy eligibility, suppression/deletion and opt-out immediately before sending, use idempotency and stop on uncertain delivery rather than blindly resend.

## 8. Device-testing status

Automated Chromium checks cover 320/390/768/1440 px, navigation/refresh/Back, visible keyboard focus, corrected skip target, semantic headings/labels/status/alerts, reduced motion, existing landing contrast checks, touch targets, PWA manifest/four icons/registration/offline public shell and no private/API caching.

**No iPhone, Android, VoiceOver or TalkBack test was performed.** Native HEIC/camera/picker permissions and actual device installation remain unverified. See [OPTION_C_DEVICE_CHECKLIST.md](OPTION_C_DEVICE_CHECKLIST.md). Automated semantic inspection is not a screen-reader walkthrough or full accessibility certification.

## 9. Production migration compatibility

Current source still adds the existing 11 V1 tables to the 14-table production baseline. This task adds optional unsubscribe digest and numeric usage-estimate metadata/uncertainty enum to new V1 tables, an unsubscribe lookup index, and **one additive `authVerifiers.by_session` index**. Existing production validators and original explicit indexes remain unchanged; compatibility tests allow only that reviewed auth-index addition.

No required field was added to an existing production table. No account/payment record rewrite or backfill is needed for these source changes. New index creation is platform-managed; it still needs schema/index readiness verification during a later approved release. No production schema was changed. Testing installation compiled successfully with the new indexes, and all runtime capability gates stayed false.

Testing builds now remove the preserved production bundle/CSS; local development rejects their paths. Option A artifacts exclude Finder metadata after the previous release's correction. Original Option A frontend and its payment assets remain byte-identical and live.

## 10. Remaining owner actions

1. Approve operating jurisdiction/entity, final privacy/processor disclosure/version, exact financial exceptions and operational/log/backup/deletion-evidence retention. No collection until the required decisions are resolved.
2. Approve a gated fresh-proof identity/session finalizer and synthetic isolated walkthrough; decide unowned verifier/rate-limit and operational associations. Verify stale sessions cannot resume before marking account deletion complete.
3. Choose/approve email service, sender/domain, separate testing credentials/recipients and data terms; then implement and verify the actual OTP/reset and reminder transport. Approve dual-proof recovery/linking rules without email-only merging.
4. Verify Google testing credentials/callback/consent and real login separately; production configuration remains a later approval.
5. Verify provider Responses/counting permissions, current fee/accounting, available funding and independent provider spend controls. Approve production budget/per-user policy preserving paid/trial/bonus/refund behavior. Existing synthetic-only $10 approval does not authorize real-parent or production spending.
6. Separately authorize a 3–5-image toy-only pilot after evaluation key/cost controls are ready; real safety/recognition/latency remain unmeasured.
7. Complete physical-device/screen-reader checks and approve a production activation candidate with staged rollback. Production activation requires code review as well as settings; flags alone cannot open current source.

## 11. Option C Go/No-Go

**NO-GO for fully functional production Option C.** Safe improvements are implemented/tested and the closed source is installed in isolated testing, but complete identity deletion, real email/OAuth delivery, production admission/billing safeguards, live AI quality/accounting and device checks remain genuine blockers. No blocked feature is marked complete.

**Option A remains the operational production release.** Public bytes were checked unchanged; no production auth/payment/customer records were read or modified, no testing data copied, and no production feature/configuration flag was activated. Only the existing provider key was used for the permitted model-metadata GET.

## 12. Deployment and rollback plan

Do not run `npm run deploy` or `release:option-a` as part of this task. The current default backend would close legacy AI rather than deliver full Option C; it is not an approved replacement for Option A.

After blockers are resolved: prepare a separately approved production-specific policy (never substitute the testing allowlist), verify additive schema/account/payment compatibility with synthetic fixtures, stage in isolated testing with real external setup appropriately approved, complete device/pilot checks, record an exact reviewed checkpoint and budget, then seek production deployment approval. No destructive migration/identity remapping or automatic email merge.

A fresh hash-verified copy of all 16 current Option A public assets is saved at `.release-backups/option-a-before-option-c-2026-10-15/`; retain it with checkpoint `0ef387e`. The older `option-a-prepublish-2026-10-14` backup restores the pre-landing application, not the current Option A landing, so do not confuse these two snapshots. The current live frontend can be restored through the known existing static-hosting upload mechanism after separate authorization, without changing accounts/schema/payments. A future Option C backend rollback must retain additive tables/indexes containing data, preserve current paid records and approved privacy/access safeguards, and restore only a reviewed compatible function revision; never overwrite a database from a stale backup or blindly revert the schema.

Local source rollback uses the saved checkpoints in a separate worktree; do not reset owner work. Testing schema changes are additive and no synthetic remote accounts or irreversible identity deletions were executed. Stop before production activation.
