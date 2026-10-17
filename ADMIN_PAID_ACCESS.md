# Complimentary paid-access administration

Status: implemented and deployed to isolated development `blissful-dotterel-906`. **Not deployed to production.** No real user has been granted access.

## Commands

Run from this repository, using your individual logged-in Convex administrator account. Do not share administrator credentials. Ordinary application passwords and sessions cannot invoke these functions.

```sh
npm run admin:check-access -- --deployment=blissful-dotterel-906 --email=user@example.com
npm run admin:grant-paid -- --deployment=blissful-dotterel-906 --email=user@example.com --days=365 --reason="Complimentary access" --admin="Your administrator name"
npm run admin:revoke-paid -- --deployment=blissful-dotterel-906 --email=user@example.com --admin="Your administrator name"
```

These examples are commands to run deliberately, not requests to create these example accounts. An account must already exist. Email is trimmed and lowercased; zero or multiple exact indexed matches stop the operation. Stored email addresses follow existing authentication normalization; legacy mixed-case addresses are not silently rewritten.

There is no default environment. Production requires **both** `--deployment=sensible-avocet-370` and `--production=sensible-avocet-370`. Production functions are not installed yet, so these commands are not currently available there. Do not grant any production user access without the owner's further confirmation.

Grant/revoke require an interactive terminal and the exact displayed confirmation phrase containing operation, email and deployment. There is no `--yes` option. Check is read-only. Inherited Convex overrides are stripped; the installed Convex CLI uses its administrator login and explicit deployment selector. The command never uses `--push` or deploys code. Missing authentication/authorization stops the operation. Raw CLI failures are withheld to avoid printing credentials; check access before retrying an ambiguous result.

## Grant behavior

- Preview shows account ID, email, access state, existing expiry and proposed expiry in UTC.
- Days are 24-hour periods, from the later of now or existing expiry. Range: 1–3650 days per grant. This deliberately extends existing access, rather than replacing it with a shorter interval.
- The server rechecks user ID, existing expiry and existing `paidFrom` against the preview. A concurrent access change cancels the grant.
- One transaction changes **only `users.paidUntil`** and inserts `complimentaryGrants`. No `paidFrom`, payment, trial, bonus, authentication or session record is changed.
- Audit: account ID/email, previous expiry, previous payment-start snapshot, new expiry, reason, timestamp, administrator label and unique operation ID. The CLI appends a one-way fingerprint of its logged-in credential to identify the credential used. This is not a token and cannot authenticate requests. The human label is operator-provided, not a provider-verified human name. Administrators inherently retain full database authority; this is not a tamper-proof ledger against a malicious project administrator.
- Replayed operation IDs fail closed. A command with a lost response must be checked before a new grant is attempted.

## Revocation

Preview selects the latest unrevoked grant and shows original grant details. Server checks ownership and verifies expiry and payment-start snapshot still match. Later extensions or payments block revocation; there is no force override. Stacked grants must be revoked newest first.

Payment records are inspected through the existing time index without changing it. Both payment effective time and record creation time are checked, so backdated payments cannot bypass this check. The scan is bounded at 1001 records and refuses automatic revocation when more than 1000 payment records exist, even when unrelated. This sacrifices convenience for safety; an additive email index may be proposed separately if volume requires it. The grant lookup similarly refuses more than 100 historical grants for one account. Same-millisecond payments conservatively require review.

Successful revocation atomically restores the original expiry (including absence of the field) and records `revokedAt`/`revokedBy` on the retained grant audit record. Repeating the same revocation is harmless. Existing purchased access preceding the grant is restored, not removed. A revoked grant's original details remain. Direct out-of-band administrator edits cannot be reconstructed reliably; discrepancies require manual review.

No financial events are created, including in analytics: complimentary grants leave `paidFrom` unchanged. Existing paid-access checks and payment architecture are unchanged. Paid access remains subject to service availability and existing AI quotas; no AI request is made by these commands.

## Security and retention

All four server operations are internal Convex functions. No public endpoint, frontend administrator secret or PWA administration UI is added. Deployment administrator authority is required. Audit rows have no public read function. Never commit `.env` files or credentials. Audit email/reason are administrative personal data: minimize free-text reasons. No new legal retention period is assumed; administrative-audit retention and eventual account-deletion handling need an explicit policy before broader rollout.

## Production release boundary

Do **not** run the repository's ordinary deploy command for this feature. The current checkout contains unfinished V1 backend/authentication/privacy changes that must not replace Option A production.

`node scripts/prepare-admin-paid-release.mjs` prepares and typechecks a private, ignored backend candidate from historical legacy checkpoint `e623093`, adding only `complimentary.ts`, `complimentarySchema.ts` and the audit table registration in `schema.ts`. It copies no environment files and makes no network call or deployment. All other legacy backend source comes from that checkpoint. The candidate includes existing static-hosting code but does not publish hosting assets.

**Remaining release blocker:** establish that this historical source and dependency/configuration baseline matches the currently deployed production backend. Historical schema fixtures and the Option A deployment report alone do not prove current function-body equivalence. Once verified, deploy only the minimal backend candidate using a separately reviewed, explicitly production-targeted Convex backend deployment, preserving existing environment configuration and hosting assets. Do not deploy the main checkout. No production deployment command was executed during this task.

Rollback: stop using admin commands; remove only the new internal functions using the verified minimal baseline, while retaining the additive audit table and its records. Never restore an old database or delete audit rows. Reverting code does not revoke grants; use the guarded revocation workflow after checking subsequent payments. The existing user/payment/auth tables have no schema changes.

Production preflight update (17 October 2026): live-source compatibility has been established for the fixed candidate described in [ADMIN_PAID_ACCESS_PRODUCTION_PLAN.md](ADMIN_PAID_ACCESS_PRODUCTION_PLAN.md). That plan supersedes the earlier unresolved source-comparison blocker above. Production deployment still requires explicit approval, and no real-user grant is included.
