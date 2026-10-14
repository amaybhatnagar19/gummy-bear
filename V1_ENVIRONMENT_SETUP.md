# Gummy Bear V1 isolated testing environment

Status: setup and isolation verification complete on 14 October 2026. Feature implementation stopped after environment setup. The application has not been deployed to production or published to the testing website.

## Verified project boundary

| Item | Verified result |
| --- | --- |
| Convex team | `amay-bhatnagar`, the team owning the existing Gummy Bear project |
| Existing project | `build-sprint-app`, project ID 3115458 |
| New project | `gummy-bear-v1-testing`, project ID 3206274 |
| Testing deployment | `blissful-dotterel-906`, development deployment |
| Database isolation | Deployment metadata resolves to the new project ID, distinct from the existing project |
| Testing credential | Newly issued deployment-scoped token, stored separately; never printed or committed |
| Testing auth | Fresh JWT/JWKS pair; no existing application keys or authentication data copied |
| Paid AI | No provider key configured; no live AI requests made |
| Payments | No payment-provider configuration or records; original collection QR files blocked by isolated local Vite middleware |

Public endpoint/boundary metadata is in `shared/testingDeployment.js`. It contains no credentials. [Testing dashboard](https://dashboard.convex.dev/t/amay-bhatnagar/gummy-bear-v1-testing/blissful-dotterel-906).

## Local environment and commands

- `.env.v1-testing`: separate ignored file, mode 0600; holds only this testing deployment's connection settings and scoped deployment credential.
- `.convex-v1-testing/`: ignored private CLI workspace, mode 0700. Contains testing-only env files, copies of backend/shared source, and a dependency link. Generated bindings/configuration stay in this private workspace.
- Original `.env.local` is preserved exactly, checked against its pre-setup SHA-256 checksum. Original production credentials were not copied into the testing environment.
- `npm run dev`: development mode now reads the verified testing file exclusively, disables automatic loading of original Vite env files, and serves localhost port 5175. The existing server reloaded this configuration and is available at `http://127.0.0.1:5175`.
- `npm run testing:verify`: validates local boundary and reads Convex management metadata to verify project, team and development deployment before any guarded operation.
- `npm run testing:push`: performs the same verification, strips inherited deployment/provider/frontend overrides, and updates backend functions only in the new testing deployment. Runs Convex CLI from the private workspace using the scoped token. It does not upload frontend assets.
- After changing backend source in a future approved task, use `testing:push` explicitly; no background backend watcher was started.

The frontend development allowlist accepts only the verified testing endpoint or the reserved dummy endpoint used by offline browser simulations. An unexpected frontend URL override fails closed. The guarded Convex script accepts only `verify` or `push`, and rejects production flags, arbitrary commands and alternate env/deployment arguments. Its token is scoped to the new development deployment.

Do not use bare Convex CLI commands in the repository: the preserved original `.env.local` remains the original project's configuration. Use the guarded testing commands above. Do not run `npm run deploy`; that existing production command is unchanged and still requires explicit owner approval.

The standard production build retains the original configuration behavior. It was compiled for verification only, not served or deployed. Use the development server for isolated local checks; do not use production build artifacts as a testing preview.

## Data and credential verification

Read-only, testing-deployment-only checks confirmed zero documents in each of:

`users`, `authAccounts`, `authSessions`, `authRefreshTokens`, `authVerificationCodes`, `authVerifiers`, `authRateLimits`, `visitors`, `paymentEvents`, `photoRuns`, `analyticsVisitors`, `analyticsSettings`, `accessReservations`, `aiQuota`, `_storage`.

No records were imported or seeded remotely. Automated backend tests seed synthetic identities in their in-memory Convex database only. The new cloud database is empty. A public read-only `access:status` query with a synthetic guest identifier returned trial access with zero uses; it did not create a visitor record.

Remote configured variable names were checked without exposing values: only `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL` were present. No paid AI, email-delivery, Google or payment provider was configured. Convex's built-in URLs identify this new deployment. Fresh auth keys were generated for testing, and the temporary key-material file was removed.

The existing project's metadata was read only to identify its team/project. No existing account, authentication, payment or personal records were read or copied. No functions, schema, credentials or data were written to the original project.

## Automated-test isolation

- Vitest retains setup-before-import outbound blocking; synthetic one-use AI provider mocks only. Tests do not connect to either cloud project.
- Default Playwright configuration includes only `d1.spec.ts`, `app-shell.spec.ts`, and `environment.spec.ts`, and rejects non-local page URLs. Existing live/state-changing specs remain in the repository but are excluded from the default run.
- Browser backend simulation now derives its URL and auth-storage namespace from the verified testing deployment. Unexpected Convex destinations are blocked and fail the tests. Testing HTTP/WebSockets are intercepted, with no backend mutations or paid AI requests.
- The previous reserved dummy endpoint remains available as an explicit offline-test override; arbitrary backend overrides are rejected.
- QR denial covers normal, public, encoded and direct filesystem paths. Serving `.env.v1-testing` is also verified to return 403. Existing payment source/assets and production billing behavior remain unchanged.

## Commands executed and results

| Verification | Result |
| --- | --- |
| Management metadata lookup, explicit project creation and development deployment authorization | Same team; distinct testing project/deployment verified |
| New scoped testing credential and fresh testing-only auth configuration | Succeeded; values withheld |
| `npm run testing:verify` | Passed |
| `npm run testing:push` from private copied workspace | Passed; existing backend/schema installed only in testing |
| Testing-only CLI table reads, limit 1, and synthetic public status query | All listed tables empty; query passed |
| `npm test` | 272 guarded Vitest + 3 Node tests passed |
| `GUMMY_TEST_URL=http://127.0.0.1:5175 ./node_modules/.bin/playwright test` | 9 isolated browser tests passed; no live specs executed |
| `npm run build` | Passed; existing nonfatal Convex Auth use-client warning remains |
| Strict separate test/config TypeScript check | Passed |
| Ignore rules and permissions | Testing env/workspace ignored; 0600 / 0700 verified |
| Protected original-file checksums | Original env, auth, payment, schema, AI source, PRODUCT.md and lockfile unchanged |

Strict TypeScript command:

```
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --types node,vite/client vitest.config.ts tests/setup/no-network.ts tests/backend/*.test.ts tests/browser/*.ts playwright.config.ts
```

### Setup issues corrected

1. Convex provisioning initially returned a legacy-format admin credential. The fail-closed prefix check rejected it; an official deployment-scoped token was created and saved without printing it.
2. The first CLI push unexpectedly rewrote the repository's `.env.local` despite `--env-file`. Its original deployment/project/URLs were restored exactly and the saved checksum matched. No original remote project was changed. Subsequent CLI operations run in the private workspace; later checks confirmed the original file remained unchanged.
3. Symlinking backend source into that workspace caused a bundle error and placeholder generated TypeScript files to shadow existing bindings. Changed to copied source, removed only the new tool-generated placeholders, restored original bindings, and verified a successful isolated push/build/typecheck. No application backend logic was rewritten.
4. A new `npm run dev` process found port 5175 occupied by the existing server, which had already reloaded the new testing configuration. Browser checks verified that listener selects the testing project.
5. Empty-table CLI output is a specific empty-table message rather than JSON `[]`; the read-only verification was corrected to recognize that documented installed-CLI behavior.

## Scope, pending gates and rollback

No additional V1 feature work was performed. No real accounts were created, no live sign-in/provider tests ran, no payments were collected, and no paid AI request was enabled. Installation, real-phone and real-provider verification remain future work.

Use synthetic data only in this environment. The temporary invited-tester access policy and payment-UI hiding remain pending verification/approval; the existing trial/bonus/payment logic was not changed. Before enabling live AI: approve a hard monetary budget and implement server-side daily/concurrency/spending controls alongside the existing global quota. Before collecting durable child/guest data: resolve retention/deletion policy. Google/OTP and email reminders require separate provider/configuration approval.

Rollback: revert the setup code/config commit and stop the local testing server; original `.env.local` is already preserved. Keep the separate testing project as an isolated checkpoint, or revoke its new token/archive it only with owner approval. Do not delete or reset the original project or revoke its credentials. Do not remove the testing environment and silently fall back to the original project; development is designed to fail closed when testing configuration is absent.

## Subsequent V1 verification (14 October 2026)

Continuous safe implementation was subsequently authorized. Backend/schema updates went only to this project; no frontend was published. The server isolation gate now uses Convex’s built-in `CONVEX_CLOUD_URL`, rather than the local-file alias; actual testing-only capabilities read verifies isolatedTesting=true and personalData/liveAIReady/Google/emailOtp/emailReminders=false. Native signup logic is tested to deny record creation while privacy is closed. No approval flags/provider configuration were set.

Read-only table checks (contents withheld) confirmed users, authAccounts, paymentEvents, children, toys, activities, attempts, preferences, guestProgress, testingInvites, testingBudget and storage empty. The CLI puts its “no documents” signal on stderr; an initial checker misinterpreted that signal, corrected without exposing or changing records. All automated records remain in-memory synthetic data.

The compiled testing preview now uses a separate verified artifact, strips payment assets and checks current HTML/script hashes after rebuilds. Backend routes cannot use the legacy testing entry to bypass invitation/budget controls. Existing production environment, config, paid records and signing keys were not modified or accessed. Full V1 readiness/blockers are in V1_IMPLEMENTATION_REPORT.md.

## Privacy/deletion follow-up boundary verification

14 October 2026: same isolated project/deployment metadata verified again. A read-only public capability query to this testing deployment confirmed personalData/liveAIReady/Google/emailOtp/emailReminders=false. No deployment, remote schema/configuration/credential write or synthetic remote account/deletion was performed. New privacy tables/functions remain source-only and were tested with network-guarded in-memory synthetic databases and intercepted browser replies. Real collection and live AI remain closed. The new local policy-version requirement does not set a cloud flag. See [PRIVACY_AND_DELETION_REPORT.md](PRIVACY_AND_DELETION_REPORT.md) for pending installation/activation approvals.


## Bounded live-AI evaluation preparation — 14 October 2026

Decision 5A authorizes up to $10 USD conditionally; it replaces the previous disabled-only budget decision without activating AI. Testing-only reservation/usage infrastructure and deterministic tests are implemented. Safe R1 source/schema and evaluation functions are now installed in `gummy-bear-v1-testing` only. R1 identity deletion and retention approvals remain incomplete; separate provider credentials/cap, full cost accounting and 20 reviewed photos are missing. No live requests or spending occurred; general collection/payment/AI gates remain closed. See [AI_EVALUATION_REPORT.md](AI_EVALUATION_REPORT.md) for exact prerequisites, setup, tests and rollback.

Verification: 364 guarded Vitest tests plus 3 Node tests, strict TypeScript and production/testing builds passed. Pilot command refused activation before provider calls.


## Approved toy-only evaluation separation — 14 October 2026

Implemented a separate internal, testing-only synthetic evaluation policy; preserved all real-parent gates. Prepared 24 licensed reduced photographs with attribution, privacy checks, SHA-256 allowlisting and metadata tests. Installed disabled functions only into the verified testing deployment; public HTTP access rejected. Verification: 373 guarded Vitest tests +3 Node tests, TypeScript/builds and 15 isolated browser checks passed. Provider key/cap and full request costs still missing: no live requests, $0 spent, $10 remaining. See [SYNTHETIC_AI_EVALUATION_REPORT.md](SYNTHETIC_AI_EVALUATION_REPORT.md).


## Production release preparation — 14 October 2026

Read-only control-plane verification identifies the actual existing production as `sensible-avocet-370` in `build-sprint-app`; `intent-poodle-393` is its development deployment, and `blissful-dotterel-906` remains isolated testing. Local candidate adds closed production AI/signup/family gates, preserves existing password login and ₹99/month infrastructure, and guards deployment by verified target, exact approved commit and clean source. No production configuration/data writes or deployment occurred.

Verification: 384 guarded Vitest tests +3 Node tests; strict TypeScript; production/testing builds; 18 network-isolated browser checks plus final 2-check artifact/screenshots recheck passed. Actual production's 14 schema definitions are unchanged; 11 existing V1 additive tables remain pending production installation. Full identity deletion/policy activation and full functional V1 remain blocked. See [PRODUCTION_READINESS_REPORT.md](PRODUCTION_READINESS_REPORT.md) for the paused-release activation matrix, limits and approval/rollback instructions.
