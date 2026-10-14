# Gummy Bear V1 — Production readiness

Verified 14 October 2026. **No deployment performed. No production data or environment settings changed. No paid AI requests.**

## 1. Production target identification

Convex control-plane metadata identifies team `amay-bhatnagar` (542387), existing project `build-sprint-app` (3115458), production deployment **`sensible-avocet-370`** (`prod`). Backend: https://sensible-avocet-370.convex.cloud; public website: https://sensible-avocet-370.convex.site.

Root local configuration selects `intent-poodle-393`, the original project's **development deployment**, not production. The separate `gummy-bear-v1-testing` project (3206274) uses `blissful-dotterel-906`. These deployments/databases are distinct. An earlier development-site check/question was superseded by authoritative production metadata; the actual production website returns HTTP 200.

Production builds now explicitly target the verified production backend. Development configuration and testing build selection are preserved. The release guard verifies project/deployment metadata, the exact approved Git commit, clean tracked files and absence of uncommitted application/backend sources before permitting the existing deployment command.

## 2. Environment verification

Read-only environment inspection reported presence only; values were never printed or written.

| Configuration | Production verification | Release consequence |
| --- | --- | --- |
| JWT_PRIVATE_KEY and JWKS | Present; installed `jose` parser accepts the signing key; public key matches configured JWKS | Existing password authentication preserved |
| Public authentication discovery | JWKS and OpenID configuration return 200; issuer matches production site; public JWKS has no private key fields | No key rotation or identity changes |
| OPENAI_API_KEY | Present; untouched, not called | Key presence does not activate candidate AI |
| OPENAI_TESTING_API_KEY | Absent in production | Evaluation must remain testing-only |
| Google credentials | Absent | Google disabled |
| SITE_URL | Not explicitly configured in production | Verify before future OAuth activation; current password login uses existing managed configuration |
| V1 collection/paid-AI approval flags | Absent/false | Collection and live AI remain closed |

Managed Convex variables are not all returned by `env list`; absence there is not proof that managed `CONVEX_SITE_URL` is missing. Testing signing/site variables exist, but testing provider keys/activation flags are absent. No credentials were copied between environments. Root `.env.local` is byte-identical to its starting snapshot.

## 3. Feature activation matrix

**This matrix describes the local candidate after a separately approved deployment, not changes already made to the live backend.**

| Feature | Production candidate | Enforcement |
| --- | --- | --- |
| Landing `/` | Approved D1.2 preserved | Existing source and assets unchanged |
| PWA shell/navigation/install guidance | Available, with paused/offline notices | Existing `/app` routes; four destinations retained |
| Existing email/password login and logout | Available | Existing provider/account/session architecture |
| New signup | Disabled | Frontend hides form; backend rejects signUp before account creation |
| Live AI recognition | Disabled | Production capabilities closed; testing-only provider boundary |
| Activity generation, including legacy entry | Disabled | Gate before reservations, quota, analytics and provider calls; internal generator also gated |
| Family profiles/inventory | Disabled | No forms or family queries in production shell; existing server ownership/privacy gates |
| Activity history/personalization | Disabled | No production history collection/query flow |
| Google Sign-In/email OTP | Disabled | No controls/provider activation |
| Email reminders | Disabled | No delivery activation; defaults preserved |
| Testing invitations/AI evaluation | Disabled in production | Exact isolated deployment checks; testing flags cannot enable production |
| Payment presentation | Existing ₹99/month interface preserved | Existing QR, payment functions and entitlements unchanged; AI-paused disclosure added |

Production defaults are deliberately closed in `shared/releaseFeatures.ts`; environment flags alone cannot open the new production experience. Future activation requires a reviewed code/configuration change. No original photos are accepted by this release's production interface. Family and reminder queries are skipped instead of silently failing behind unfinished screens.

## 4. Database compatibility findings

Read-only inspection retrieved **schema definitions only**, not customer rows. The active production schema has **14 tables**. Automated comparison verifies their validators, explicit indexes and schema-validation setting remain unchanged. Convex's implicit index timestamp and declaration ordering are normalized for comparison; explicit field order is preserved.

Existing tables: users, visitors, photoRuns, analyticsVisitors, analyticsSettings, paymentEvents, accessReservations, aiQuota, authAccounts, authRateLimits, authRefreshTokens, authSessions, authVerificationCodes and authVerifiers.

The already-developed V1 candidate adds **11 tables**: children, toys, activities, attempts, preferences, guestProgress, testingInvites, testingBudget, privacyConsents, deletionRequests and aiEvaluations. **This preparation task did not edit `convex/schema.ts`.** No existing documents are rewritten, deleted or backfilled. New fields remain in new tables; existing legacy auth/payment/access tables retain their definitions.

Risk: actual deployment/schema/index validation has not been exercised on production, and no candidate backend was pushed during this task. A future rollback must retain additive tables if any documents exist; do not blindly deploy the old schema or restore a database over newer payment/account records. Existing cloud schema and historical pre-V1 schema fixtures contain definitions only.

## 5. Authentication readiness

Existing Password provider, password hashing, identity IDs and account/session tables are preserved. A minimal local admission check prevents *new* production signup; it does not block existing password sign-in. A guarded test signs a synthetic existing user in through the actual password provider, verifies the same account identity/hash, and preserves paid dates/bonus state. Production private-key compatibility and public discovery were checked without signing in a real customer or creating a session.

No email-based merging, identity remapping, Google activation, OTP delivery setup or irreversible migration occurred. Actual production customer sign-in was not exercised; retain it as an owner-controlled post-release smoke check, not evidence claimed here.

## 6. Privacy and deletion readiness

R1 implements local no-original-photo retention, preferred child label/age, optional DOB/interests, account ownership checks, consent versioning, 24-hour guest expiry and recoverable family-deletion stages. Production collection remains closed.

**Full account deletion is not complete:** irreversible identity/session removal, financial-record retention basis, logs/backups/processor retention and final published-policy approval remain unresolved. A deletion request is not represented as completed when identity removal is pending. No production identities, financial records or family records were deleted. Do not activate real-parent collection until these decisions and required deletion steps are approved and verified.

Synthetic toy-only evaluation has a separate isolated gate; it does not approve real-parent processing or weaken R1. No evaluation was activated in this task.

## 7. AI-disabled behavior

The production candidate blocks legacy `ideas.discover` before access reservations/refunds/quota counters/logging and blocks direct internal `play.generate`. Existing safety/quality filtering and deterministic provider mocks remain intact. Closed routes show a clear paused message without upload, age or child-detail controls. Recognized/generated results are not fabricated.

**The current live backend remains unchanged until deployment.** The presence of a production provider key does not establish that existing live AI is disabled; the new early gate is source-only today. No credit purchases, paid requests or provider configuration changes were made. Previously approved evaluation spending is not used by this release preparation.

## 8. Payment preservation

Existing ₹99/month payment infrastructure, payment handlers, payment event schema and paid entitlements are preserved. No payment requests or record mutations were performed. The tracked QR image already exists and is byte-identical to the currently served production asset (154,096 bytes); it was not replaced. Existing password accounts retain access history.

The interface explains that a payment does not enable paused AI. This is a disclosure, not a billing-policy change. Keeping payment presentation during an AI-disabled release is a material owner decision; approve that limited release knowingly. No testing payment collection is enabled. An unrelated untracked `.png.jpg` file remains untouched and is excluded from the production build.

## 9. Automated test results

| Verification | Result |
| --- | --- |
| Complete network-guarded Vitest suite | **384 passed, 27 files** |
| Node rules tests | **3 passed** |
| Main application TypeScript/build | Passed |
| Strict tests/browser/config TypeScript | Passed |
| Production and isolated testing builds | Passed |
| Full localhost-only browser suite | **18 passed**, including compiled production candidate |
| Final targeted screenshot/compiled-artifact recheck | **2 passed** |
| Read-only production target preflight | Passed |
| Active production schema compatibility | Passed |

Commands executed for verification: `npm test`; strict `tsc --ignoreConfig --noEmit ...` over backend/setup/browser/config tests (with JSON module support); `npm run build`; `npm run build:testing`; `npm run release:check`; `GUMMY_PRODUCTION_PREVIEW_URL=http://127.0.0.1:5177 npx playwright test`; final targeted `release.spec.ts` checks. Read-only Convex metadata/environment/schema and public website/auth-discovery checks were also performed. No `npm run deploy`, testing push, database mutation/import or paid API call ran.

New regression coverage includes closed production generation before charging/counters; direct internal rejection; missing/unknown deployment failure; invitation/flag isolation; paid-account preservation; signup rejection; real password-provider synthetic sign-in; explicit commit approval/dirty-source rejection; schema compatibility; disabled deep links; responsive keyboard navigation; and compiled production backend selection with all browser traffic intercepted.

Existing backend billing/safety/analytics tests use a narrow mock of the new release gate to preserve their original open-service expectations; separate release tests verify the actual gate. Tests were not removed. Browser backend responses and account data are synthetic, with external HTTP/WebSocket traffic intercepted before navigation and service workers blocked in the compiled-release checks. Existing separate PWA checks verify manifest/icons, worker registration and offline shell.

Responsive checks cover 320, 390, 768 and 1440 px widths, no overflow, minimum touch targets, keyboard skip/focus/back/direct routes, reduced motion, existing contrast checks and image loading. Desktop/mobile screenshots were captured under `test-results/`. Physical device installation, assistive-technology testing, actual provider delivery and cloud deployment are **not** verified. Existing harmless dependency `use client` build warnings remain.

## 10. Remaining blockers

- Explicit owner approval of the exact release checkpoint and **paused-release scope** is required before any deployment.
- Full functional V1 remains blocked by disabled AI, unapproved real-parent collection/deletion/retention activation and unavailable Google/OTP/reminder delivery. No OpenAI credits are requested for a paused release.
- Candidate backend/cloud installation and post-release smoke checks remain unperformed by design.
- Existing production login/payment operational behavior has only been checked through synthetic tests and read-only metadata/assets, not real customer mutations.
- Active backend's original Git revision is not established; do not assume the starting local commit is a byte-identical backup of deployed functions.

## 11. Deployment commands — approval required

Do not execute these until the owner approves the exact committed candidate and scope. Re-run tests/build/preflight if source or configuration changes.

```sh
npm run release:check
# Only after explicit approval of the current exact commit:
GUMMY_RELEASE_APPROVED_COMMIT="$(git rev-parse HEAD)" npm run deploy
```

The existing Convex static-hosting command deploys backend and frontend to the verified original project's production deployment. Do not use skip-build/skip-Convex switches, a testing deploy key or a different project. The `predeploy` guard rejects a mismatched approval hash or dirty source before the deployment tool starts. This is an operational safeguard; it cannot independently authenticate a human's approval. Production credentials/settings remain separate and unchanged.

## 12. Rollback plan

Starting reversible source checkpoint: `85bad64`; final release-preparation checkpoint is recorded in Git history. A private ignored, local copy of the **currently served public frontend only** is stored at `.release-backups/production-before-v1-2026-10-14/`, with SHA-256 manifest: index, original JS/CSS and payment QR (4 files). Every snapshot file is hash-verified. It contains no account/database export or provider/signing credentials. Static-hosting replacement can remove previous assets, so retain this copy before any approved publish.

Rollback is a separate approved production write. Re-publish the saved public frontend through the existing hosting component with its original asset paths after testing it against the retained backend. Keep the safe closed backend gates and additive schema; frontend rollback alone is not backend rollback. Do not automatically revert authentication, signing keys, payment records or restore an old database. Before any backend/schema rollback, review the active revision, new-table contents and compatibility; recover source in a separate worktree rather than resetting owner work. If a remote backup is needed, obtain authorization and use protected storage, not a committed customer-data export.

The source checkpoint permits local reversal of this task. It does not prove a complete live backend/database recovery image. No production rollback, backup export or deletion was executed.

## 13. Go/No-Go recommendation

**NO-GO for claiming or launching a fully operational Gummy Bear V1.** Core AI and real-parent data features remain unavailable, and full identity deletion/policy work remains pending.

**Conditional GO for a clearly paused, restricted release only**, after owner approval: preserve the D1.2 landing and PWA identity, existing password login, payment infrastructure and recorded entitlements, expose honest unavailable states, and enforce production closure of new AI/signup/family/testing paths. The owner must explicitly accept the payment-presentation caveat while AI is paused. Deployment and post-release verification remain separate authorized steps.

### Source changes in this preparation

Added production target/release policy helpers, deployment/build guards, unavailable UI and production/schema/browser regression tests. Updated application capability routing, signup admission, legacy AI entry guards, install/offline copy and small touch-target rules. Preserved landing source/assets, PRODUCT.md, schema, payment functions, auth configuration/provider definitions and dependency lockfile. Build-only filtering excludes untracked public copies without modifying owner files. Updated release/environment/progress documentation. No dependencies were added.
