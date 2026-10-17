# Admin paid-access production deployment report

17 October 2026. **Result: successfully deployed and verified.** No user was granted or revoked access.

## Release and target

- Production: **`sensible-avocet-370`**, project `build-sprint-app` (3115458), team `amay-bhatnagar` (542387).
- Backend: `https://sensible-avocet-370.convex.cloud`.
- Website: `https://sensible-avocet-370.convex.site/`.
- Implementation checkpoint: `904f7ae`; approved preparation documentation checkpoint: `28b29a6`.
- Published only `.release-backups/admin-paid-production-candidate-904f7ae/`, using the verified manifest SHA-256 `1424251fb29695d9372f9fd04ae5a294ccf70d35859d6eff45df60e56fc7084f`.

Before publication, manifest files, installed dependency versions, target/project ownership and live source fingerprints were rechecked. The main checkout's V1 backend was never deployed.

## Exact mechanism

Executed once with `--dry-run` first, then once for publication, from the fixed candidate directory. All inherited `CONVEX_*` variables were stripped from the subprocess environment. Administrator authorization came from the existing individual CLI login. The selector file contains only `CONVEX_DEPLOYMENT=prod:sensible-avocet-370`, no credential.

```sh
/Users/amaybhatnagar/build-sprint-app/node_modules/.bin/convex deploy --env-file .env.production-release --typecheck enable --codegen disable --message "Admin complimentary access only; implementation 904f7ae"
```

A private local wrapper captured/redacted CLI output. Both the dry-run and publication exited successfully. Publication confirmed schema validation complete, no index deletions, exactly two new audit-table indexes, and successful deployment to the intended cloud URL. No `npm run deploy`, static uploader, frontend build, migration, seed, grant or revoke command was executed against production.

## Deployed scope

Backend source delta only:

- `convex/complimentary.ts`: internal `check`, `grant`, `previewRevoke`, `revoke`.
- `convex/complimentarySchema.ts`: audit table definition.
- `convex/schema.ts`: import/register the audit table.

All preserved legacy application/auth/access/payment/AI/HTTP sources were included unchanged in the backend package. No dependency change. Existing frontend/hosting assets were not uploaded.

Production function metadata changed from 26 to 30 entries: every prior entry is preserved, and the only additions are the four internal administrator operations. The source API returns 23 exact prepared function/helper modules plus separate `schema.js` and `convex.config.js` definition entries. **All 23 function/helper modules match the locally prepared bundle byte-for-byte, including source maps.**

Clarification to the preparation plan: the source API continues to expose schema/component definition entries separately; they are not extra callable application functions. The earlier prediction that those entries would disappear from the source listing was too broad. No existing callable function was removed.

## Database and customer-data preservation

- All **14 existing tables**, validators and indexes remain unchanged.
- Only `complimentaryGrants` was added, with `by_user` and `by_operation` indexes.
- The active schema exactly matches the reviewed candidate schema.
- A read-only sandbox query confirmed the audit table is empty.
- No customer access expiry, payment event, authentication record, session, trial or bonus was written by this task.
- No production user record was exported or used as a mutation test. Preservation evidence is the constrained code deployment, unchanged legacy implementation/schema and absence of data-writing routines; this is not a row-by-row customer-data audit.

## Post-deployment verification

| Check actually performed | Result |
|---|---|
| Target and fixed manifest | Matched approval |
| Every existing function metadata entry/signature | Preserved |
| Four new function types/visibility | Two queries, two mutations; all internal |
| Prepared function/helper bundle vs deployed source | All 23 modules match exactly |
| Existing tables/validators/indexes | All 14 unchanged |
| Audit schema vs reviewed pending candidate | Exact match; 15 total active tables |
| Production environment configuration | Before/after hashes unchanged; values never printed/persisted |
| Root `.env.local` | Unchanged |
| `/`, `/app`, `/app/` | HTTP 200; response hashes unchanged |
| Existing app JavaScript/CSS | HTTP 200; byte hashes unchanged |
| `/payments/upi-qr.png` | HTTP 200; byte hash unchanged |
| Public signing keys and authentication discovery | HTTP 200; response hashes unchanged |
| Existing `access:status` | Read-only synthetic guest query returned trial, zero uses; no visitor created |
| Authorized administrator `complimentary:check` | Synthetic non-existent email reached expected no-account validation; no record created |
| Unauthenticated check/preview/grant/revoke requests | All rejected; no handler error data exposed |
| Read-only audit-table check | Empty; no grant/revocation recorded |
| Guarded regression suite after publication | 432 Vitest tests / 34 files and 3 Node tests passed |
| TypeScript check | Passed |
| Exact-release/pending-schema checks before publication | Four guarded checks passed |

The anonymous mutation endpoint checks used empty arguments and were rejected without invoking a write handler. No administrator grant/revoke mutation was invoked on production. The authorized read-only check used a synthetic `.invalid` email and returned the expected missing-account error; it did not create an account or read an actual customer's record.

## Verification interruptions and resolution

Checks stopped while the following differences were diagnosed; no extra feature, runtime or billing change was introduced to bypass them:

1. The dry-run displayed a Node.js action-version change with no old/new value. Installed CLI source compares remote `null` with an omitted local value. No Node.js action version was requested, both packages contain zero Node-runtime modules, and the Convex function runtime remained 1.46.0. This was a display artifact.
2. The dry-run left an **inactive pending schema**. The first verifier compared the entire schema-state object and rejected it. Four guarded exact-release checks established that the pending schema was exactly the approved candidate. The verifier was narrowed to preserve the exact original active schema while accepting only that specifically verified pending-schema fingerprint. Settings/assets were separately rechecked unchanged before publication.
3. The first post-publication security check expected detailed development-style errors. Production deliberately returned generic `Server Error` responses. A controlled comparison confirmed that an administrator read reaches explicit missing-account validation while the same unauthenticated query does not expose handler error data. Metadata independently confirms all four operations are internal. The completed boundary check passed for all four operations.
4. An extra source-count assertion initially counted schema/component definitions as function modules. Classification showed no missing or changed prepared function/helper module: all 23 match exactly, with only the two separate definition entries noted above.

No deployment retry or automatic rollback was needed. Exactly one real publication command ran.

## Authentication, payments and AI

Existing password authentication source, signing configuration, discovery endpoints and client bundle remain intact. Existing manual ₹99/month payment source and QR asset remain intact. Existing paid-access checks, trial/bonus handling and AI actions are preserved by exact prepared-source verification and unchanged configuration. No unfinished V1 authentication, family-data, testing-access or provider gates were activated.

**Limits of verification:** no real customer login/session was exercised; no payment was initiated or confirmed; no paid AI inference was performed. Existing AI billing/credit availability and live generation success were not newly established. The checks verify preservation and non-mutating endpoint availability, supported by deterministic regressions, rather than claiming these unexecuted live transactions passed.

## Rollback

Prepared and typechecked package: `.release-backups/admin-paid-production-rollback-904f7ae/`. If needed, stop admin command use, inspect current production drift and obtain rollback approval. Deploy only that package: it removes the four administrative operations while retaining the audit table and unchanged legacy functionality. Never restore an old database, delete audits or reset access dates as a code rollback. Any future access revocation remains a separate explicitly confirmed operation that checks subsequent payments.

Private release evidence and redacted logs: `.release-backups/admin-paid-production-before-904f7ae/`, including `publish.log`, `immediate-before.json`, `immediate-after.json`, `deployed-source.json`, and `FINAL_VERIFICATION.json`. No production API credential or environment-variable value is included in those snapshots.

## Final status

**Production admin access management is installed and secured. Existing production functionality is preserved by the checks above. No one has been granted paid access.**

Wait for explicit owner confirmation before any production grant. Use individual Convex administrator credentials, a meaningful minimal reason and finite expiry. Automatic revocation still fails closed for ambiguous later payments/extensions and at the documented bounded-history limits. Administrative audit retention remains an owner-policy decision; no legal period was invented.
