# Isolated V1 environment — setup boundary

Status: local mocked testing exists; separate cloud project has not been provisioned. No production deployment or database change has occurred.

## Missing input

Confirm the Convex team that should own the separate `gummy-bear-v1-testing` project. A development deployment inside the current production project is not sufficient isolation. Do not infer project isolation from the `dev:` prefix in the current local configuration.

## Planned setup

1. Create a new project under the confirmed team, using explicit CLI project/team selection. Use a separate ignored `.env.v1-testing` file and explicit `--env-file` on every Convex command. Preserve `.env.local`.
2. Verify project ID differs from the original project, deployment type is development, and project name/team match the confirmed selection. Abort on any discrepancy. Keep this metadata check before every remote mutation/deploy command.
3. Set up new authentication keys only for this project. Never reuse or overwrite original keys. Do not run the current setup-auth script against its implicit default environment.
4. Leave AI credentials absent and all live-provider modes disabled. Do not run production reporting, payment confirmation or existing live browser helpers. Do not import production accounts, personal data or payment history.
5. Keep automated backend tests in convex-test with synthetic identities and blocked outbound network. Run only the explicitly isolated browser specs with intercepted HTTP/WebSockets; no account or payment creation.
6. Push additive backend modules only to the verified isolated project when prerequisites are resolved. Update the local application's development allowlist to that verified isolated address. Never permit arbitrary configured URLs merely because they call themselves development.
7. Keep real Google/OTP/email tests, paid AI and deployment separately gated. Local production builds create files only; they do not deploy.

## Testing-access policy to verify before hiding payment UI

10 invited testers for 14 days. Proposed allowance: 10 activity generations/day/tester, one concurrent AI request/tester, existing global 100/hour quota retained. Recognition calls also require a bounded allowance and global quota reservation. Provider failures consume request/spend allowance; failed or zero-safe generation keeps the current trial/bonus refund rule. A monetary ceiling must be approved and enforced server-side before live paid AI is enabled.

Production access, trial, bonus, payment ledger and paid entitlements stay unchanged. Any temporary access must require verified isolated-project configuration and a server-side invitation/capability, never a frontend flag or arbitrary visitor ID. Payment UI is still present in the compatibility tool; hiding it is not implemented or authorized until this policy is verified.

## Personal-data and auth gates

Before durable guest/child records: approve minimum collected fields, expiration/retention, deletion consequences and provider disclosures. Recommended original-photo default: do not store. Approximate age, optional nickname and optional interests are sufficient initially; exact DOB requires an explicit decision because PRODUCT.md mentions DOB and the latest instruction requires minimization. Session-only guest work must not be represented as persistent account history.

Before Google/OTP configuration: choose the owner-controlled Google OAuth project and approve an email delivery provider. Password login remains available. Matching email alone must never link identities or move entitlements. No account remapping or automatic merging is approved.

## Rollback

Use local commit reverts for code. Since no remote changes have been made, no remote rollback is currently required. Future isolated schema changes must be additive; production release and any auth/account migration require their own verified backup and approval. Never reset the working tree or copy production data for convenience.
