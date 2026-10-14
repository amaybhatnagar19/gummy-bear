# Gummy Bear

React + Vite + Convex, with Convex Auth and Convex static hosting. The approved D1.2 landing stays at `/`; the V1 parent experience is under `/app`.

The new experience is integrated and tested with synthetic data and simulated AI replies. **It is not ready for real testers or production:** real personal-data collection, paid AI, Google sign-in and email delivery remain closed pending approval/configuration. See [V1_IMPLEMENTATION_REPORT.md](V1_IMPLEMENTATION_REPORT.md) and [V1_IMPLEMENTATION_PROGRESS.md](V1_IMPLEMENTATION_PROGRESS.md).

Privacy/deletion follow-up: [PRIVACY_AND_DELETION_REPORT.md](PRIVACY_AND_DELETION_REPORT.md) contains the current retention matrix, consent copy, tests and remaining approvals. Photo cleanup, optional child fields, versioned acknowledgment and resumable family/account-request removal are implemented and tested locally. Full identity/financial/operational deletion remains policy-blocked. These follow-up changes have **not been installed in the isolated cloud backend** because deployment was prohibited; no collection/AI flags were enabled.

## Local testing only

The separate `gummy-bear-v1-testing` project uses deployment `blissful-dotterel-906`. Its credentials are in the ignored `.env.v1-testing`; the original `.env.local` is preserved and must not be used for V1 CLI operations.

```sh
npm run testing:verify
npm run dev
```

Open `http://127.0.0.1:5175`. Development refuses an unverified backend and blocks payment assets. Do not paste credentials into chat or commit environment files.

After authorized backend changes, `npm run testing:push` verifies the project and updates only that testing deployment, using a private copied workspace and its scoped credential. It uploads no frontend. Do not use bare Convex CLI commands from the repository: the original environment file still selects the existing project.

## Verification

```sh
npm test
npm run build
GUMMY_TEST_URL=http://127.0.0.1:5175 ./node_modules/.bin/playwright test
```

Vitest blocks outbound traffic before app imports; provider replies are narrow synthetic mocks. Default browser tests intercept remote HTTP/WebSockets and reject unexpected requests. Historical live AI/account/payment specs remain excluded. The PWA check requires the compiled testing preview and otherwise reports a skip.

To verify the compiled PWA safely:

```sh
npm run build:testing
npm run preview:testing
```

Then run:

```sh
GUMMY_TEST_URL=http://127.0.0.1:5175 GUMMY_PWA_TEST_URL=http://127.0.0.1:5176 ./node_modules/.bin/playwright test
```

The separate testing artifact verifies its backend URL, strips payment assets, and serves only localhost. The preview verifies HTML/script hashes and refuses an unfinished/unverified rebuild. The ordinary production build is a compile check only; do not serve it as a testing preview.

## Current behavior

- One camera/picker photo, separate recognition, parent correction, explicit age 2–8, and up to three structured ideas. Online generation only. Previous ideas remain during failures; cards retain their original age context.
- Home / My Toys / Activities / Profile, browser Back/direct routes, detailed activities and meaningful alternatives.
- Account-owned profiles, inventory, suggestions, favorites, intentions, parent-reported attempts and feedback; all real saving remains behind the privacy gate.
- Explicit toy status/condition/assignments; acquisition, inventory addition, photo analysis and parent-reported attempts stay distinct.
- In-app/manual rediscovery, frequency limits, dismissal, known-new exclusions and condition-aware donation guidance. Email reminders are not connected.
- Temporary guest linking uses a separate random proof, not the browser trial identifier or matching email. Drafts expire after 24 hours, with scheduled cleanup and proof-based deletion.
- Original photographs are not retained. Reduced previews are temporary; confirmed-name generation does not resend the photo. Optional guest draft saving requires a separate choice and cannot extend the initial 24-hour expiry.
- Only a preferred child label and age are required; DOB/interests are optional. Profile includes explicit privacy acknowledgment, separate optional contact choices, family deletion progress and account-deletion requests. An account request ends at a truthful pending-policy stage, preserving identity/sessions/financial records for approved finalization; it is not completed account deletion.
- Manifest, original-logo PNG/maskable icons, installation guidance and a public offline shell. Private records/photos/API responses are never service-worker cache entries.

## Access, accounts and payments

Existing production behavior remains two successful browser trial runs, the existing one-time account bonus, and owner-confirmed ₹99/month access. Failures/empty results refund existing trial reservations; payment records, month-end rules and paid entitlements are preserved. No records were migrated or copied.

Only the isolated V1 API can use an invited testing grant: ten invitations, fourteen days, ten generation requests and ten separately counted recognition requests per invitation/day, one shared concurrent request, the existing global 100/hour quota, and an approved monetary reservation ceiling. All live calls also require privacy approval. No live approval flags or provider key were enabled.

Payment UI/assets are unavailable in isolated testing after admission checks were verified. The original payment branch/assets and production billing functions remain intact. Restoration/redesign and production release require separate approval.

Password sign-in remains. Testing signup is denied while privacy is closed. Google is wired behind explicit testing-only approval and credentials; email OTP has a tested provider factory but no delivery adapter/registration. Matching email never transfers an existing identity or entitlement in the testing path.

## Release and rollback

No frontend has been published and no production deployment performed. `npm run deploy` remains the existing Convex static-hosting production command and **must not run without explicit approval**. Resolve the blockers, approve release configuration/provider/retention decisions, test the actual isolated providers and devices, and prepare a reviewed production-specific activation plan first.

Use local Git checkpoints and targeted reverts; never hard-reset unrelated work or drop populated tables. Keep the isolated connection checks when reverting product features. Do not rotate signing keys, remap identities, archive projects or alter payment records as a rollback shortcut.


## Bounded live-AI evaluation preparation — 14 October 2026

Decision 5A authorizes up to $10 USD conditionally; it replaces the previous disabled-only budget decision without activating AI. Testing-only reservation/usage infrastructure and deterministic tests are implemented. Safe R1 source/schema and evaluation functions are now installed in `gummy-bear-v1-testing` only. R1 identity deletion and retention approvals remain incomplete; separate provider credentials/cap, full cost accounting and 20 reviewed photos are missing. No live requests or spending occurred; general collection/payment/AI gates remain closed. See [AI_EVALUATION_REPORT.md](AI_EVALUATION_REPORT.md) for exact prerequisites, setup, tests and rollback.

Verification: 364 guarded Vitest tests plus 3 Node tests, strict TypeScript and production/testing builds passed. Pilot command refused activation before provider calls.


## Approved toy-only evaluation separation — 14 October 2026

Implemented a separate internal, testing-only synthetic evaluation policy; preserved all real-parent gates. Prepared 24 licensed reduced photographs with attribution, privacy checks, SHA-256 allowlisting and metadata tests. Installed disabled functions only into the verified testing deployment; public HTTP access rejected. Verification: 373 guarded Vitest tests +3 Node tests, TypeScript/builds and 15 isolated browser checks passed. Provider key/cap and full request costs still missing: no live requests, $0 spent, $10 remaining. See [SYNTHETIC_AI_EVALUATION_REPORT.md](SYNTHETIC_AI_EVALUATION_REPORT.md).
