# Gummy Bear V1 implementation and verification

14 October 2026. **Integrated isolated implementation; not production-ready and not fully activated.** Core application/backend paths are connected and tested. Google/OTP/email delivery, approved privacy/consent, real AI evaluation and production activation still have genuine blockers. These are not marked complete.

## 1. Delivered and preserved

Implemented the guest journey, structured activities, family profiles/inventory, persistent activity memory, in-app rediscovery, deletion controls and installable app shell using React, Vite and Convex. No new dependencies/frameworks were installed. The approved D1.2 landing, SVG/wordmark, mascot, photography and font assets are unchanged.

Only the separate `gummy-bear-v1-testing` backend was updated. No frontend was published, no production resources were contacted, no original account/payment/personal data was copied, and no paid AI request ran. Original environment/configuration and payment/access source checksums were verified. New testing cloud tables and auth/payment/storage tables were read without printing records and confirmed empty.

## 2. Feature completion matrix

“Implemented, gated” means functioning code with deterministic tests, while real use remains deliberately disabled. Browser replies/accounts are synthetic; these are not live-provider claims.

| Feature | Current status | Evidence / remaining work |
| --- | --- | --- |
| Approved landing | Preserved | Existing landing checks, responsive assets/contrast/keyboard; no source/asset changes |
| Shared PWA architecture | Implemented | Four destinations, URL-backed routes, Back/refresh/recovery, shared controls and tokens |
| Camera / limited picker | Implemented | Native single-file inputs, camera hint, preview/compression/clearing; real phone formats/permissions unverified |
| Single/shelf recognition | Implemented, gated | Separate server action, 0–12 toy names, strict parsing, uncertainty copy; actual recognition quality unverified |
| Confirm/correct → age → generate | Implemented, gated | Corrected names are provider inputs and enforced references; explicit ages 2–8; guest does not need a profile/account |
| 1–3 useful activities | Implemented, gated | Strict structured fields, safety/quality/within-response/history filtering; no filler at zero |
| Details / alternatives / recovery | Implemented | Materials, duration, steps, parent role/safety; current/stored ideas can request alternatives; failure retains results and their original age context |
| Save / favorites / intention / tried / feedback | Implemented, gated | Independent fields; feedback requires a parent-reported attempt; viewing/saving never imply play |
| Persistent suggestions/history | Implemented, gated | Signed-in action stores suggestions before returning; server history prevents repetition without relying on browser memory; attempts and timestamps retained separately |
| Legacy password accounts | Preserved | Proved IDs and entitlements retained; production provider/access contract unchanged; no identity migration |
| Google sign-in | Wired, blocked | Testing-only approval/privacy/key gates; no Google client configured or live login verified |
| Email OTP | Partial, blocked | Tested eight-digit/ten-minute provider factory, matching-email verification; delivery adapter and provider registration not implemented pending service approval |
| Secure guest linking | Implemented, gated | Separate random proof, hashed storage, expiry, one-owner/idempotent claim; no email matching or trial-UUID identity |
| Multiple children / interests / Play Together | Implemented, gated | Owned profiles, optional DOB or age, current age from DOB, child selection and youngest-child validation |
| Toy inventory | Implemented, gated | Add/correct/edit, child/shared assignments, duplicate confirmation, explicit statuses, separate outgrown/condition and acquisition/photo/addition dates |
| In-app/manual Reuse Reminder | Implemented, gated | Opt-out default, atomic weekly/monthly claims, dismissal, known-new exclusion, explicit reported-attempt suppression; no offline-disuse claim |
| Reuse / donation guidance | Implemented | Parent-controlled reuse and general donation guidance; known unsafe/damaged toys cannot receive donation guidance; no automatic status changes |
| Optional email reminders | Not implemented; blocked | No sender, scheduling/delivery pipeline or enabled opt-in; requires approved service/consent configuration |
| Photo/privacy controls | Implemented in part | No original app photo storage; clear temporary work and proof-based draft deletion; provider retention is separate |
| Family-data deletion | Implemented, gated | Deletes owned children/toys/history/attempts/preferences/linked draft records; preserves account/auth/payment/access records |
| Full account deletion / approved privacy policy | Blocked | Retention exceptions, identity deletion and final parental consent wording/version not approved or completed |
| Optional contact/future consent | Implemented, gated | Phone is optional; storing it requires consent; future WhatsApp opt-in separate; no WhatsApp delivery exists |
| PWA installation | Implemented; device signoff pending | Manifest, SVG/PNG/maskable icons, guidance, worker/offline shell verified in Chromium; actual iOS/Android installation not tested |

Companion functionality is the integrated toy-to-play/returning-family flow. No broad parenting chat, toy shopping, voice expansion or WhatsApp messaging was introduced. One-photo input and online generation are temporary testing constraints.

## 3. Application and response architecture

`/app` and `/app/start` lead to photo input. `/app/recognize`, `/app/age`, `/app/ideas` and `/app/idea/:index` represent temporary steps/results, with explicit refresh recovery. Signed-in routes include Home, My Toys/toy detail, Activities/activity detail, Profile and manual rediscovery. Existing sign-in/signup/payment routes remain. Account changes/logout clear temporary private state; family screens remount for a different owner.

Reusable components cover layout/navigation, notices, buttons, empty/error states, upload/recognition/age, full activity cards, inventory/profile forms, settings and installation guidance. Existing photo preparation, access logic, result contracts and approved brand tokens are reused.

The existing activity contract remains category, title, durationMinutes, materials, 2–5 steps, parentRole, safetyNotes and toyReferences. Provider output stays strict `{toys, activities}`. The new V1 public generation response adds server-generated `activityIds` to structured results; existing legacy/structured `play:discover` response fields remain compatible in production. Unsafe candidates never enter returned activities or reconstructed legacy ideas/raw.

## 4. Database changes and authorization

Added tables: `children`, `toys`, `activities`, `attempts`, `preferences`, `guestProgress`, `testingInvites`, `testingBudget`. Existing auth/user/payment/access/analytics/quota definitions remain intact. New optional toy/attempt/context fields and owner/digest/expiry/activity indexes support bounded reads; no required fields were added to existing production records.

Every family operation derives ownership from authenticated server context and checks referenced records. Unrelated accounts cannot read lists, edit toys/children, assign foreign children/toys, change activities, dismiss reminders or delete another family’s information. A stale identity without a user record is rejected. Guest drafts are invitation-bounded, hashed, expire after 24 hours, permit one pending draft per invitation and can be deleted using their own proof. Cleanup runs hourly in testing and drains expired batches; physical cleanup timing depends on platform scheduling.

Testing bounds: ten children, 200 toys, 500 suggestions and 500 reported attempts per account. This covers the initial 14-day activity allowance, but is not an unrestricted long-term persistence design. Pagination/larger limits require a later measured change. Duplicate history comparisons were reduced to candidate-versus-history work rather than repeatedly deduplicating the entire history.

## 5. Authentication, testing access and payment preservation

Password remains registered. Testing signup is blocked before user/auth-account creation while privacy is closed. Google registration requires the exact testing deployment, privacy approval, explicit provider approval and separate keys. Custom testing identity handling preserves an existing proved provider ID, refuses same-email new identities and never moves entitlements based on email.

Testing invitations allow first value as a guest. On authenticated use, an unbound invitation binds to that tester; using another guest invitation cannot multiply an account’s daily or concurrent allowance. A guest code is permission for bounded testing, not proof of family identity. Family reads/writes and guest claims still require the appropriate independent account/proof checks.

Server enforcement: ten invitations / fourteen days / ten generation attempts and ten separately counted recognition attempts per invitation per UTC day / one shared active request / existing 100 attempted AI calls per rolling hour / approved positive monetary ceiling and total ledger. Failed calls retain conservative spending reservations. No automatic AI retries. Recognition has a 500-token output cap; generation keeps the provisional 1,500-token cap and 60-second timeout.

Signed-in invited testing grants do not consume/change legacy bonuses or payment records. Guest successful-turn consumption/refunds remain. Legacy AI entry is denied only in testing to prevent bypassing admission controls. Production trial/bonus/payment behavior and ₹99/month infrastructure are preserved. Testing hides collection UI/assets after admission verification; no production payment redesign/restoration occurred.

## 6. AI safety and quality results

All existing M1 safety regressions remain green, including ages 2–3, 4–5 and 6–8, under-three loose small parts, contextual heat/height/airway/ingestion/neck risks, and misleading supervision/pretend/prohibition language. Harmless toy stories, imaginary journeys and legitimate warnings remain accepted.

New quality regressions reject verbose filler, unused materials, undeclared drawing supplies, and a pretend supply used to disguise real undeclared supplies elsewhere. Mirror/copy/imitate and tower/stack wording cannot disguise obvious repetition. Safety/quality filtering preserves valid siblings; zero valid ideas returns a recoverable limitation. Persistent server history excludes earlier mechanics even when the browser submits no history.

Known limits: English text rules are conservative heuristics, not universal understanding or physical toy inspection. Unlisted hazards, obfuscated/multilingual instructions, subtle repetition and unnecessary rejection remain possible. Image identification, manufacturer suitability/recalls and real model quality have not been evaluated live. No guaranteed-safety claim is made. Keep live processing closed until the authorized evaluation and privacy review are complete.

## 7. Testing costs and controls — proposal, not activation

Published Standard GPT-6 Luna rates are $0.10 per million input tokens and $0.50 per million output tokens. No actual application usage was measured or billed in this task. [Official model pricing](https://developers.openai.com/api/docs/models/gpt-6-luna).

At the full allowance: 1,400 generations + up to 1,400 recognitions. Output caps total at most 2.8 million tokens ($1.40 at that rate). Assuming **2,000–8,000 total input tokens per call**, including image/context, gives approximately **$1.96–$3.64** for the period before taxes/tier differences. This is an illustrative estimate, not a measured prediction; image tokenization, reasoning behavior and actual account pricing need verification. Reusing inventory can avoid recognition calls.

Recommend an initial **$10 total budget**, with a conservatively reviewed **$0.005 reservation per provider request**. That would stop admission after at most 2,000 reserved calls, potentially before all daily allowances are used. A $15 pool could accommodate the theoretical 2,800-call maximum at that reservation, but must be separately approved. The ledger is a hard cap on approved reservations, not independent proof of the provider invoice: validate the worst-case per-request cost before enabling a key. No values or approval flags were configured.

## 8. Privacy, security and unresolved decisions

Real account creation, photo processing and family/contact saving remain off. Local photo preparation can happen without sending a photo; the processing button stays disabled until verified readiness. The app redraws images to bounded JPEG and stores no original toy photos. Temporary clears rotate guest proofs; family deletion does not falsely claim account/billing deletion.

`store:false` does not establish zero provider retention. OpenAI documents separate abuse-monitoring retention, ordinarily up to 30 days, with specific controls/exceptions. The actual testing-provider agreement/settings must be reviewed and disclosed before processing real photographs. [Official data controls](https://developers.openai.com/api/docs/guides/your-data).

Owner decisions still required:

- Approve minimum collected fields, optional DOB/phone/future-consent scope, family/guest retention, platform/provider logs/backups, final privacy copy and parental consent/version. Current `pending-owner-policy` markers must not be presented as approved consent.
- Resolve full account deletion versus preserved auth/financial/access records before implementing an irreversible purge/remap.
- Approve the monetary budget, verified per-request ceiling and separate testing-only AI key; then explicitly authorize limited live quality/cost evaluation.
- Approve Google external configuration and an email service; implement/register OTP transport and opt-in reminder delivery before claiming them functional.
- Complete real-device camera/install/screen-reader checks and a production-specific activation plan. Current gates intentionally permit testing only.

Potential risks requiring further investigation: full adversarial language coverage, malicious image dimensions/decoding, invoice-level cost bounds, operational log/backup retention, actual auth-provider throttling/recovery, larger-history bandwidth, and browser/native install differences. No production account takeover, secret disclosure or cross-family response was demonstrated.

## 9. Automated proof and commands

| Check | Result |
| --- | --- |
| Baseline `npm test` | 272 guarded Vitest + 3 Node passed |
| Final `npm test` | 325 guarded Vitest across 20 files + 3 Node passed; 53 new tests over baseline |
| `npm run build` | Passed, including app/backend TypeScript |
| Strict tests/config TypeScript command | Passed; repeated after final source changes |
| `npm run build:testing` | Passed; backend URL and HTML/script hashes verified; payment assets stripped |
| `npm run testing:verify` / `testing:push` | Verified separate project; backend/schema updates only there |
| Isolated Playwright with both local URLs | 13 passed across six safe specs; no historical live specs |
| Testing-only public capabilities query | Isolated testing true; personalData/liveAIReady/Google/OTP/emailReminders false |
| Testing-only table reads, limit 1, contents withheld | users/authAccounts/payments/new family/invite/budget/storage tables empty |
| Protected-file checksums and Git diff | Original env, PRODUCT.md, lockfile, auth/hosting configuration and payment/access functions unchanged; landing sources/assets unchanged |

Strict command:

```sh
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --types node,vite/client vitest.config.ts tests/setup/no-network.ts tests/backend/*.test.ts tests/browser/*.ts playwright.config.ts
```

Browser command:

```sh
GUMMY_TEST_URL=http://127.0.0.1:5175 GUMMY_PWA_TEST_URL=http://127.0.0.1:5176 ./node_modules/.bin/playwright test --timeout=30000
```

The existing nonfatal Convex Auth `use client` build warning remains. Intermediate failures were fixed: reproduced filler/material/duplicate cases, optional phone removal, TypeScript declarations, ambiguous browser selectors, startup focus, stale preview HTML, technical error text and the server/local environment-name mismatch. Stable-source browser reruns passed; one earlier Back run was interrupted by a development reload. The empty-table verifier initially misread the CLI’s stderr “no documents” message; records were not printed or modified.

Vitest protection is installed before app imports and blocks fetch plus Node HTTP/HTTPS/TCP/TLS/UDP/DNS. Caught unexpected requests still fail tests. Provider mocks permit only one exact synthetic request. Browser HTTP/WebSockets are intercepted; unexpected destinations/actions fail. This does not constitute an operating-system network sandbox or a guarantee about arbitrary child processes/new native transports; new transport code requires guard review.

## 10. Screenshots, design and PWA proof

Screenshots use synthetic accounts/data and simulated provider replies. They are rendered app evidence, not live AI output or approval to collect personal data. Existing safe checks cover 320–1440 widths, touch targets, keyboard/Back/direct routes, 200% text reflow, reduced motion, approved landing contrast/font/image loading, and the new complete guest/family flows.

- [Mobile ideas and recovery](test-results/v1-flow-guest-correction-d-ebb01-retry-preserves-first-value/ideas-390.png)
- [Desktop ideas and recovery](test-results/v1-flow-guest-correction-d-ebb01-retry-preserves-first-value/ideas-1440.png)
- [Mobile activity detail](test-results/family-ui-family-forms-inv-ba284-etion-use-the-connected-API/activity-detail-390.png)
- [Desktop activity detail](test-results/family-ui-family-forms-inv-ba284-etion-use-the-connected-API/activity-detail-1440.png)

Manifest has app start/scope, standalone display and four SVG/PNG/maskable entries. PNG sizes: 192 icon 6,823 bytes; 512 icon 18,881 bytes; maskable 512 icon 15,877 bytes; total 41,581 bytes. Derived locally from the approved owned SVG; no new toy photo/font was copied. Existing sources/licenses remain in public/images/ASSET_SOURCES.md.

The compiled testing preview verifies worker readiness, image loading and offline reload. Cache contents include public shell/assets only, never Convex API responses, photos, payment files or family records. Actual home-screen installation and physical mobile camera/accessibility remain unverified. No production frontend was served or published.

## 11. Production readiness and rollback

**Not ready to deploy.** The full V1 cannot be marked complete until privacy/consent, account deletion boundaries, real AI/provider integration, email delivery and device signoff are resolved. Implemented core paths are available for deterministic isolated verification; blocked features are explicit.

Keep local checkpoint `1893d07` and the closed testing gates. Use targeted Git reverts, not hard reset/stash/force push. Leave additive tables intact while testing source reversions; do not remove populated schemas or delete account/payment/auth records. Original environment and unrelated untracked work remain preserved. Earlier intermediate checkpoints contain superseded gates; do not activate them as a shortcut.

Before a production release: approve the remaining decisions; verify actual isolated providers with bounded/synthetic-or-consented data; review backups/schema compatibility/identity preservation; approve production-specific gate/configuration changes and payment presentation; then explicitly authorize the existing Convex static-hosting `npm run deploy` operation. No deployment command was executed here. Git push is not a deployment. Signing-key rotation or account remapping is not a rollback strategy.

## 12. Files created/modified

Exact paths for this execution are listed below, relative to the repository. Generated bindings came only from the verified private testing workspace. Pre-existing untracked skill/review/QR artifacts and private environments are excluded.

- `.gitignore`
- `IMPLEMENTATION_PLAN.md`
- `README.md`
- `V1_ENVIRONMENT_SETUP.md`
- `V1_IMPLEMENTATION_PROGRESS.md`
- `V1_IMPLEMENTATION_REPORT.md`
- `convex/_generated/api.d.ts`
- `convex/activityDuplicates.ts`
- `convex/activityResponses.ts`
- `convex/activitySafety.ts`
- `convex/activitySafetyContext.ts`
- `convex/auth.ts`
- `convex/authIdentity.ts`
- `convex/authProviders.ts`
- `convex/crons.ts`
- `convex/family.ts`
- `convex/guest.ts`
- `convex/ideas.ts`
- `convex/play.ts`
- `convex/recognition.ts`
- `convex/schema.ts`
- `convex/testingAccess.ts`
- `convex/v1Capabilities.ts`
- `convex/v1Ideas.ts`
- `convex/v1Policy.ts`
- `index.html`
- `package.json`
- `playwright.config.ts`
- `public/manifest.webmanifest`
- `public/pwa/icon-192.png`
- `public/pwa/icon-512.png`
- `public/pwa/maskable-512.png`
- `public/sw.js`
- `scripts/prepare-testing-build.mjs`
- `scripts/serve-testing-build.mjs`
- `shared/v1.ts`
- `src/AccessPanel.tsx`
- `src/LegacyApp.tsx`
- `src/features/app/ActivityCard.tsx`
- `src/features/app/Application.tsx`
- `src/features/app/AuthChoices.tsx`
- `src/features/app/FamilyScreens.tsx`
- `src/features/app/InstallGuide.tsx`
- `src/features/app/PlayJourney.tsx`
- `src/features/app/app.css`
- `src/features/app/navigation.ts`
- `src/features/app/usePlayFlow.ts`
- `src/main.tsx`
- `src/style.css`
- `tests/backend/activity-duplicates.test.ts`
- `tests/backend/activity-materials.test.ts`
- `tests/backend/activity-quality.test.ts`
- `tests/backend/auth-boundary.test.ts`
- `tests/backend/auth-identity.test.ts`
- `tests/backend/auth-providers.test.ts`
- `tests/backend/family.test.ts`
- `tests/backend/recovery-copy.test.ts`
- `tests/backend/reminders.test.ts`
- `tests/backend/v1-ai.test.ts`
- `tests/browser/app-shell.spec.ts`
- `tests/browser/d1.spec.ts`
- `tests/browser/family-ui.spec.ts`
- `tests/browser/isolatedBackend.ts`
- `tests/browser/pwa.spec.ts`
- `tests/browser/v1-flow.spec.ts`

## Subsequent privacy/deletion follow-up

The later approved privacy/deletion task supersedes the earlier privacy-planning status where noted: no original photo retention, preferred-label/age-only profiles, optional DOB/interests, versioned acknowledgment/contact choices, fixed guest expiry and resumable family/account requests are now implemented/tested locally. Full identity/financial/operational account deletion remains blocked and is not claimed complete. No follow-up deployment or collection/AI activation occurred. Current results and exact remaining decisions are in [PRIVACY_AND_DELETION_REPORT.md](PRIVACY_AND_DELETION_REPORT.md).
