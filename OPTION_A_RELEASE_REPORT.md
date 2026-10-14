# Option A — Landing-only production release candidate

Prepared 14 October 2026. **Not deployed. Final deployment approval is required.** Target: `sensible-avocet-370`, existing `build-sprint-app` Convex project.

## 1. Exact release scope

Publish the approved D1.2 landing plus the original production frontend, through existing Convex static hosting. Do not publish application backend functions, schemas, cron jobs, auth/provider configuration or new V1 feature gates. No provider/environment settings, account records, entitlements or database contents change.

This is a separate build/release configuration. The paused V1 candidate remains in source for future work; its default build/deployment is **not** the Option A release. `npm run deploy` must not be used for this release because it publishes the pending backend.

## 2. Files changed

Modified:

- `.gitignore`: ignore the separate `dist-option-a/` build.
- `package.json`: add `build:option-a` and guarded `release:option-a`; existing scripts/dependencies unchanged.
- `tests/browser/isolatedBackend.ts`: optional legacy-only mode for intercepted old-protocol activity responses and an empty mocked external-font stylesheet. Default test behavior remains unchanged.

Added:

- `vite.option-a.config.ts`: separate entry and output; validate production target; omit redesigned PWA manifest/install metadata.
- `src/optionA.tsx`: landing routing and original application loading; no V1 client or worker initialization.
- `public/assets/index-ARx4V7n1.js`, `public/assets/index-CdxPm9Ml.css`: exact original production assets from the hash-verified public snapshot, with original asset paths.
- `scripts/prepare-option-a.mjs` and `.d.mts`: verify preserved JS/CSS/payment hashes, exclude unrelated untracked public copies, remove redesigned worker/manifest/icons from this build, reject unfinished V1 code.
- `scripts/release-option-a.mjs` and `.d.mts`: require reviewed commit/clean source, verify target, rebuild and perform **static upload only** after approval.
- `playwright.option-a.config.ts`: localhost-only candidate checks with service workers blocked.
- `tests/backend/option-a.test.ts`: preserved asset hashes/URL and frontend-only publication contract.
- `tests/browser/option-a.spec.ts`: landing routing/responsiveness, original application, paid-session/legacy response/payment/auth controls.
- This report.

Existing owner files, including the separate AI compatibility report and untracked payment `.png.jpg`, were not overwritten. PRODUCT.md, `convex/`, landing source/design assets, auth/payment application sources, production QR and dependency lockfile are unchanged from `f699443`.

## 3. Production routing behavior

- `/`: unchanged approved D1.2 landing, locally hosted fonts, brand, mascot, product preview and planned-feature labeling.
- Every Get Started link and footer Open the app link points to `/app`.
- `/app`, `/app/` and `/app/...`: original production tool. Existing app has screen state rather than redesigned destination routes; these URLs do not open unfinished V1 screens.
- Other routes: safe links back to website/app.
- Convex's existing single-page fallback serves the index on direct navigation/refresh. Local preview verifies the same frontend behavior; actual production hosting verification awaits approved publication.
- Original `/assets/index-ARx4V7n1.js`, `/assets/index-CdxPm9Ml.css` and `/payments/upi-qr.png` paths are retained.

No redesigned service worker is registered, and its worker/manifest files are not published. This release does not claim new PWA installation/offline capability. Existing backend remains untouched.

## 4. Existing functionality preservation

The old application is the captured live JavaScript bundle, not today's source `LegacyApp.tsx`. This avoids its newer `responseVersion:2` argument and dependencies on newer response handling. The original bundle bootstraps its own React/auth client into the existing root, at the same website origin, with the original backend URL.

Hashes of preserved app, stylesheet and QR match the snapshot manifest. Therefore their account/session storage conventions, trial/bonus/paywall controls, AI request format and payment presentation are unchanged. Moving the tool entry from `/` to `/app` is the intended user-visible change.

New family profiles, inventory, memory, reminders, Google/OTP and testing grants are absent from the published frontend. No new backend endpoints or schemas are installed. This does not assert that previously undeployed V1 backend code is already present or active remotely.

## 5. Authentication/payment compatibility

The same origin and original client storage preserve existing login/session keys and guest visitor identifiers. Browser tests seed a synthetic paid token in the original production URL namespace and verify authenticated controls survive refresh. Guest tests verify original email/password and account-creation controls, with no Google control. No real account is signed in, created or modified.

Original ₹99/month payment UI and exact QR are retained. Existing backend auth, access, trial/bonus refund behavior, payment records and paid dates are not deployed or rewritten. Existing guarded tests exercise synthetic password sign-in and access/payment regressions; they are local evidence, not a production customer walkthrough.

## 6. AI functionality preservation

The captured original frontend calls `play:discover` with only `image`, `age` and `visitorToken`. A browser test uploads a licensed repository toy image and receives three **synthetic** old-format ideas through intercepted protocol replies; unexpected new V1 calls are rejected.

The existing live backend, OpenAI variable, model, quota and access behavior remain unchanged because this release only uploads static files. Pending `requireGenerationRelease` gates are not deployed. No gate is relaxed or bypassed: the already-existing app/backend is preserved as explicitly authorized.

No paid request, credit purchase, provider credential transfer or model change occurred. Actual current model access, provider credit and inference success remain unverified. Existing availability cannot be guaranteed from frontend compatibility alone. New M1 safety improvements are not installed by Option A.

## 7. Database and schema impact

**Zero application database/schema changes.** No migration, backfill, copy, deletion or customer-record inspection. Previously verified production schema definitions and synthetic access/auth/payment tests provide compatibility evidence; live private records were neither read nor changed.

An approved static publish will change hosting-component asset storage/manifest and remove obsolete frontend assets, as normal. It must not change family/account/payment tables or application functions. If the existing hosting component rejects the installed uploader's API, stop; do not fall back to a full backend deployment.

## 8. Tests and verification results

| Check | Result |
| --- | --- |
| `npm test` — network-guarded Vitest | **386 passed, 28 files** |
| Node rules tests in the same command | **3 passed** |
| Main TypeScript and `npm run build` | Passed; default build is not the release artifact |
| `npm run build:option-a` | Passed; preserved JS/CSS/QR hashes verified; no V1 app/worker |
| Strict tests/config TypeScript | Passed, including Option A configs |
| `npx playwright test --config playwright.option-a.config.ts` | **4 passed** |
| Existing isolated suite, excluding unrelated compiled paused-release check | **16 passed, 1 skipped** |
| Protected-path diff, environment-file hash, whitespace checks | Passed |

Existing suite command: `GUMMY_TEST_URL=http://127.0.0.1:5175 npx playwright test --grep-invert 'compiled production candidate'`. The one skipped test requires a separate compiled testing PWA URL; it does not cover Option A, which intentionally publishes no new worker. The separate paused-release compiled test was excluded because it tests Option B, not this candidate.

Strict check: `tsc --ignoreConfig --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --allowImportingTsExtensions --resolveJsonModule --types vite/client,node` over backend/setup/browser tests and Vitest/Playwright/Option A Vite configs.

An initial build guard correctly rejected V1 modules when the entry replacement ran too late; the transform now runs before bundling. An initial existing-browser invocation omitted its mandatory local URL and refused to start; rerun with explicit localhost passed. No failed check was ignored.

Option A checks cover 320/390/768/1440 px widths, no horizontal overflow, all Get Started destinations, Back, direct `/app`, refresh, synthetic existing paid sessions, original password/signup controls, payment QR and old-format activity rendering. Existing D1 checks cover keyboard access, responsive assets, contrast and reduced motion. Desktop landing/mobile legacy screenshots were captured and visually inspected in `test-results/`.

All backend/browser test records and responses are synthetic. HTTP and WebSocket interception is installed before navigation; external fonts get an empty mock stylesheet, never a remote fetch. Unexpected requests fail. No production-mutating browser tests or live AI tests ran. No actual phone/camera, real login, live billing or cloud publication was verified. Original legacy visual/accessibility behavior is preserved, not redesigned or certified improved.

## 9. Deployment procedure — do not execute yet

After explicit approval of the final Option A checkpoint:

```sh
# Reviewed source must be committed and unchanged.
GUMMY_RELEASE_APPROVED_COMMIT="$(git rev-parse HEAD)" npm run release:option-a
```

The wrapper checks exact approval hash, clean tracked state/uncommitted publishable sources, production target/configuration, then performs read-only project metadata verification and a fresh Option A build. Its sole publishing command is the installed static-hosting CLI **`upload --dist dist-option-a --prod --component staticHosting`**. No `--build`, backend deploy or schema push is invoked by upload. Existing original-project selection is preserved; target must match `sensible-avocet-370`.

The owner approval hash is an operational safeguard, not independent proof of human consent. Do not set it until approval. Do not use `npm run deploy`, testing deploy credentials, V1 artifact directories or fallback backend deployment. After approved upload, inspect public `/`, `/app`, refresh, images and QR without generating ideas or mutating accounts/payments. A customer-login walkthrough requires separately agreed credentials/scope.

## 10. Rollback procedure

Starting source checkpoint: `f699443`; final Option A preparation checkpoint is recorded in Git history. The separate build leaves the V1 work intact and reversible.

Private public-frontend backup: `.release-backups/production-before-v1-2026-10-14/`. Its manifest verifies original index HTML, app JS/CSS and QR. No customer rows or private credentials are included. Retain this backup before any upload because hosting removes obsolete assets.

If an approved release fails, stop further publishing. After explicit rollback authorization, prepare a clean rollback directory from those four original files (exclude the backup manifest), verify their hashes, then upload that directory only through the same existing production hosting component. This restores the original tool at `/` and original assets. Do not deploy old application functions, alter keys, delete tables or restore a database. There is no application database migration to undo. Hosting asset rollback is a production write and has not been executed here.

## 11. Remaining risks

- Snapshot represents the public frontend captured on 14 October; any subsequent independent production release must be reviewed before publishing this candidate.
- Existing component/uploader compatibility must be checked when approved; failure cannot authorize backend changes.
- Actual AI credit/access/quality is unknown and preserved, not newly proven.
- Same-origin session compatibility is supported by exact old bundle and synthetic checks; real sessions were not read/tested.
- The tool's existing limitations and older safety/quality behavior remain. Full V1 privacy/deletion and activation blockers remain separate.
- New landing bootstrap and preserved app each carry React runtime code, adding download overhead on `/app`; no application rewrite was introduced to optimize this small release.
- Existing service workers from any independently published version could affect caching; no new worker was installed by this task, and actual device cache inspection remains unperformed.

## 12. Go/No-Go

**GO for final owner review of the Option A candidate**, as the lower-risk frontend-only release preserving existing production functionality. **NO-GO for deployment until explicit final approval.** This is not a complete V1 activation or live-AI success certification.

No production write command, deployment, environment mutation, account/data read or paid provider request ran during preparation. Only local code/assets/tests/report changed. Existing unrelated owner files were left intact.
