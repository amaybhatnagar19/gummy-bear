# Admin paid-access production release — approval plan

17 October 2026. Implementation checkpoint: `904f7ae`.

**Result: source and schema compatibility established for the minimal legacy-based candidate. Ready for explicit owner approval; NOT deployed. No user grant is included.**

## Explicit target

Read-only Convex control-plane checks verified:

- Team: `amay-bhatnagar` (542387).
- Project: `build-sprint-app` (3115458).
- Deployment: **`sensible-avocet-370`, production**.
- Backend: `https://sensible-avocet-370.convex.cloud`.
- Existing website: `https://sensible-avocet-370.convex.site`.
- Independent isolated development remains `blissful-dotterel-906`; no testing credentials or records belong in production.

No production account, payment or session rows were read for this comparison. No production write, paid inference, deployment or feature-gate change was executed.

## Production comparison evidence

Read-only administrative requests retrieved the live module fingerprints, deployed compiled source, function metadata and active schema. Returned credentials were kept in memory and were not printed or persisted. Source/schema snapshots contain code and deployment metadata, not customer rows, and are retained privately under `.release-backups/admin-paid-production-before-904f7ae/`.

1. All **23 downloaded live modules** matched their separately retrieved SHA-256 fingerprints (source plus source map).
2. Locally bundled historical baseline `e623093` contains 21 runtime modules. All 21 match their deployed counterparts after normalizing generated dependency filenames and non-executable source-location comments. Every corresponding static dependency link was checked against the established one-to-one module mapping. No executable text difference remained in those modules.
3. The other two live runtime modules, `schema.js` and `convex.config.js`, register **no callable functions** according to current production function metadata. The standard CLI bundles schema/component definitions separately. Its normal build omits these duplicate non-callable runtime entries. Their actual schema and hosting-component source remain present and preserved in the candidate.
4. All **19 existing candidate files other than `schema.ts`** match the historical backend bytes, including authentication, access, payment rules, AI, analytics, HTTP/static hosting, configuration and generated bindings.
5. The schema edit was checked against the exact expected two-line registration/import addition. The actual production schema has 14 tables. A guarded test compared every existing validator and explicit index against the candidate: **all 14 unchanged; only `complimentaryGrants` added**. No additive V1 family/testing tables or auth-verifier index are included.
6. `package-lock.json` is byte-identical to the historical baseline. No dependency installation, upgrade or new runtime dependency is required. Existing installed Convex version is 1.46.0, matching the live backend runtime version.

This is executable-source and dependency-link compatibility evidence, not a claim that a customer production login, payment or AI request was exercised. The new entries cause ordinary shared-bundle renaming/reorganization; existing compiled artifacts are not all byte-identical after rebundling. No existing registered function is intentionally changed or removed. There are currently 26 root registered functions; the intended release adds four internal functions.

The first raw fingerprint comparison did not match because generated filenames, source-location comments and duplicate schema/config entries differ. That comparison was not treated as permission to deploy. A local attempt to reproduce the old entry-point selection failed and was abandoned. Read-only retrieval of the actual compiled production source resolved the comparison using the verified mapping above.

## Fixed candidate and exact scope

Candidate directory:

`.release-backups/admin-paid-production-candidate-904f7ae/`

Candidate manifest SHA-256:

`1424251fb29695d9372f9fd04ae5a294ccf70d35859d6eff45df60e56fc7084f`

The manifest lists hashes of every prepared source/configuration file. The package uses an existing dependency-directory link; dependency versions and bundle comparison must be rechecked if installed packages change before deployment. No secret credential is included in the candidate. `.env.production-release` contains only the explicit production deployment selector, not an API key, auth key or provider configuration.

### Backend source delta

| File | Change |
|---|---|
| `convex/complimentary.ts` | New four internal administrator operations |
| `convex/complimentarySchema.ts` | New audit table definition; no registered function |
| `convex/schema.ts` | Import/register that audit table only |

All other backend source is preserved from the verified live-compatible legacy baseline:

`access.ts`, `analytics.ts`, `analyticsRules.ts`, `auth.config.ts`, `auth.ts`, `convex.config.ts`, `http.ts`, `ideas.ts`, `paymentRules.ts`, `play.ts`, `quota.ts`, `rules.ts`, existing `_generated/*`, `tsconfig.json` and README.

Convex deploys a complete backend package rather than uploading one function in isolation. The release therefore submits the preserved legacy backend plus this delta, never the main checkout's unfinished V1 backend. Generated dependency chunks can change names; two non-callable duplicate runtime modules noted above are omitted by the standard CLI. No frontend assets or hosting manifest are uploaded.

### Functions added

| Function | Visibility/type | Behavior |
|---|---|---|
| `complimentary:check` | Internal query | Read-only account access preview |
| `complimentary:previewRevoke` | Internal query | Read-only latest-grant preview |
| `complimentary:grant` | Internal mutation | Atomic `paidUntil` extension and audit insert |
| `complimentary:revoke` | Internal mutation | Guarded expiry restoration and revocation audit |

No existing registered function body or signature changes. In particular, `access:markPaid`, access checks, trial/bonus reservations/refunds and AI actions retain their existing implementation.

### Database change

New empty table `complimentaryGrants` with:

- `userId`, normalized `email`;
- optional `previousPaidUntil` and `previousPaidFrom` snapshot;
- `newPaidUntil`, `reason`, `grantedAt`, `administrator`, `operationId`;
- optional `revokedAt`, `revokedBy`;
- indexes `by_user(userId)` and `by_operation(operationId)`.

No existing table, field, validator or index changes. No user update, payment event, backfill, cleanup, scheduled job or migration runs on deployment. Only a subsequently authorized admin command can change a user's expiry. Grant/revoke audit writes occur atomically with that selected user's expiry change.

### Operator scripts and dependencies

Already committed at `904f7ae`: `scripts/admin-paid.mjs` and three npm scripts (`admin:grant-paid`, `admin:revoke-paid`, `admin:check-access`). They remain local operator tools; they are not deployed as public web endpoints. Testing/preparation scripts also remain local. No frontend changes and no new dependency are required.

## Security verification

- Exact candidate exports only the four named internal operations; no public administrative mutation exists.
- Existing guarded tests verify internal visibility, targeting refusal, ambiguous/missing account rejection, stale previews, operation replay, cross-account mismatch and payment-safe revocation.
- Prior isolated development HTTP tests rejected ordinary anonymous access to query/grant/revoke endpoints; no production mutation was attempted to test this boundary. No real authenticated customer session was used.
- Internal Convex visibility requires deployment administrator credentials. An ordinary application session cannot call these functions; a supplied administrator label alone cannot grant that authority.
- CLI requires explicit environment selection, an additional production selector, individual Convex administrator login, and interactive confirmation for writes. It does not deploy code or invoke `markPaid`.
- Existing R1, family-data, synthetic evaluation and provider gates are not deployed/changed by this release. Currently deployed Option A functionality stays in place; unfinished V1 features remain absent, not newly activated.

## Expected production impact

Existing password accounts, sessions, access expiries, trials, bonuses, payment events, entitlements, AI prompts/models/limits and static hosting routes remain intact. No signup, provider, payment or privacy configuration changes. `/`, `/app` and payment assets remain served by existing hosting; no static uploader or frontend build command is part of this deployment.

The only new capability is private administrative access management. No one receives complimentary access merely because the capability is installed. A brief normal Convex backend version transition and creation/indexing of an empty table are expected. No real production account login, payment or AI success has been newly tested.

## Commands actually run

- `node scripts/prepare-admin-paid-release.mjs`: prepared and typechecked the legacy candidate locally.
- Private read-only inspection scripts: verified project/deployment metadata, retrieved module fingerprints/source, active schema and function specifications. No record export or mutation was used.
- Local bundling through installed CLI `dev --once ... --debug-bundle-path`: inspected implementation to verify the branch returns before push; pointed only at testing for credentials. No production deployment/dry-run was executed.
- Local normalized-source/dependency-graph comparison: all 21 baseline executable modules and their dependency links matched production; full production source matched all 23 independent hashes.
- Candidate file/lockfile hash comparison and candidate/rollback TypeScript checks: passed.
- `npm test`: **432 guarded Vitest tests and 3 Node tests passed**.
- `npx tsc --noEmit`: passed.
- `npx vitest run tests/backend/zz-admin-release-preflight.test.ts`: **3 additional checks passed**, comparing the exact candidate with actual production schema, confirming internal-only exports and testing a synthetic grant/check/revoke with no payment or unrelated-user changes. This temporary test was moved into the private verification snapshot after running; it is not part of the default suite.

No browser, paid AI, real-account creation or production-mutating test was run. The implementation checkpoint's local build already passed; no frontend code changed in this task.

## Proposed deployment — NOT EXECUTED

Before execution, recheck target metadata, all candidate manifest hashes, unchanged live module/schema fingerprints and dependency versions. If production drift is detected, stop and compare again. Strip inherited `CONVEX_*` overrides from the subprocess environment; use the administrator's existing CLI login and the explicit selector file. Do not print resolved credentials.

The backend-only command, run **inside the fixed candidate directory** with the cleaned environment, will be:

```sh
/Users/amaybhatnagar/build-sprint-app/node_modules/.bin/convex deploy --env-file .env.production-release --typecheck enable --codegen disable --message "Admin complimentary access only; implementation 904f7ae"
```

This command is shown for approval only. Do not run it from the main checkout. Do not use `npm run deploy`, the static hosting deployment command, `--cmd`, seed functions or account-management commands during deployment. Convex's actual server-side schema validation and component change plan have not been executed; an unexpected change or validation failure must stop the release.

After approval/publication: compare registered function metadata for exactly four internal additions, existing signatures, active schema, environment/signing configuration and public route/payment-asset availability without login or paid AI. Do not create accounts or grant access. Verify preservation through source/configuration evidence, not by exposing customer rows.

## Rollback prepared

`.release-backups/admin-paid-production-rollback-904f7ae/` is locally prepared and typechecked. It preserves the same legacy backend and **retains the audit table/schema**, but omits `complimentary.ts` to remove the four admin operations. Its selector contains no credentials. Stop using the CLI first, compare production drift, then obtain rollback authorization and deploy only this rollback package.

Never restore an old database, delete audit records, reset user expiries or rewrite financial records as a code rollback. Any grants made after publication survive code rollback; revoke them only through a separately confirmed, payment-safe review. Hosting assets remain untouched in either direction.

## Remaining risks and approval

- Deployment has not run. Its server-side schema validation and final component diff still need review; no unexpected function/component/index change is permitted.
- Generated chunk changes and omission of the two non-callable duplicate modules are disclosed above. These are build differences, not proof of changed product behavior.
- Project administrators can directly alter data; the audit is not tamper-proof against an administrator. Human operator labels are self-declared, augmented by the CLI credential fingerprint.
- Automatic revocation conservatively stops above 1000 payment events or 100 historical grants for one account. Same-millisecond or changed payment state requires review.
- Administrative audit retention/deletion policy has no newly invented legal period; free-text reasons should contain no unnecessary personal information.

**Approval requested: deploy only this minimal backend candidate to `sensible-avocet-370`, preserving Option A and adding the audit table/four private operations. This does not authorize granting access to any user.**

Production publication update (17 October 2026): the approved minimal backend has now been deployed and verified. See [ADMIN_PAID_ACCESS_DEPLOYMENT_REPORT.md](ADMIN_PAID_ACCESS_DEPLOYMENT_REPORT.md) for final evidence and verification limits. No paid access was granted to any user.
