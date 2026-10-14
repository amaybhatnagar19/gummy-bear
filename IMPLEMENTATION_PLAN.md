# IMPLEMENTATION_PLAN.md — Gummy Bear V1
Status: Proposed sequencing for owner approval. Based on 2026-10-14 repository audit, PRODUCT.md, and approved direction. No implementation performed.

## Approved decisions
- Retain React + Vite + Convex; Codex implements incrementally.
- Design complete V1 now, ship in stages.
- Friendly Premium with editorial influences; balanced selective 3D illustration + real product UI (Option B).
- Public landing website + mobile-first installable PWA.
- Target Google Sign-In + email OTP, preserving existing accounts/access/payment records.
- Temporarily hide payment UI while testing, preserve backend payment infrastructure. After testing, restore redesigned ₹99/month presentation **only with explicit approval**.
- Do not modify `PRODUCT.md`.

## Release gates and workstreams
### Gate 0 — Approve source documents and safe environment
Tasks: Review proposed design/UX docs; reconcile existing DESIGN.md without overwriting it prematurely. Inventory routes, schema, auth provider setup, tests and deployments in actual checkout. Define isolated test environment and owner-only production operations. Decide testing-access policy, account migration, data retention and deletion.
Acceptance: Approved documents and written decisions; backup/rollback plan for auth/payment changes; tests run without mutating production.
Dependencies: None.

### M1 — Safety, access and reliability foundation (P0)
Tasks: Add per-caller/concurrency controls and cost ceiling; separate input validation from provider call; structured output and semantic activity safety/deduplication checks; safer logging; preserve previous results during retries; explicit loading/error handling. Define privacy/retention/deletion before adding child records. Build mocked provider tests.
Acceptance: Dangerous/duplicate examples are rejected; failure preserves previous successful results; unauthorized callers cannot access family records; test-access policy cannot accidentally bypass production entitlements.
Dependencies: Gate 0.
Note: No claim of fully automated child safety; evaluate with curated examples and manual review.

### M2 — Shared design system, landing website and navigation
Tasks: Introduce shared tokens/components, responsive typography, buttons, cards, states and focus handling. Build public landing route and guest PWA entry route, product demonstration and trust copy. Add navigable PWA shell, Back/deep-link behavior, manifest/icons/install affordance with explicit online/offline expectations. Keep UI for incomplete features honest (no fake live inventory).
Acceptance: CTA enters guest photo flow; no mobile overflow; clear keyboard/focus behavior; install path tested on supported devices; no unsupported claims.
Dependencies: Gate 0; coordinate with M1 guardrails.

### M3 — Recognition → confirmation → activities
Tasks: Split toy recognition and activity generation logically; editable toy labels and uncertainty; minimal child age; structured differentiated cards with materials/time/steps/supervision; meaningful alternatives and quality fallback; maintain previous results. Measure first-value completion separately from reported play.
Acceptance: Parent can correct teddy/plush classification; low-confidence toys are not silently confirmed; 1–3 safe ideas appear; alternative is meaningfully different or explains limitation; errors are recoverable.
Dependencies: M1, M2.

### M4 — Authentication migration and persistent personalization
Tasks: Design/verify Google + email OTP migration, preserve legacy account recovery and existing payment entitlements; guest-to-account linking with cross-account safeguards; children/groups, progressive toy inventory, statuses, activity records and feedback; parent-facing deletion controls. Start with smallest authorized schema.
Acceptance: Existing users retain access; guest work links only to intended account; saved/tried/favorite are distinct; account A cannot read B; parent controls toy status; deletion behavior documented and tested.
Dependencies: Gate 0 migration decisions; M1 privacy controls; M3 contracts.
Risk: High — do not perform destructive auth changes without explicit approval.

### M5 — Reuse Reminder and V1 quality verification
Tasks: In-app reminders and opt-in email; frequency controls; known-new toy exclusion; separate acquisition/interaction/play timestamps; reuse-at-home/donation guidance; analytics and quality evaluation; accessibility/mobile regression.
Acceptance: No reminder for known <2-month toy; no inferred offline disuse; no unsafe donation suggestions; email requires opt-in; all core V1 journeys pass scripted checks.
Dependencies: M4 inventory/history.

### Post-test monetization restoration (separate approval gate)
Tasks: Review measured product usage and owner decision; restore existing ₹99/month model with redesigned UI, clear renewal/payment/support messaging, and verified access behavior.
Acceptance: Historical entitlements intact; access/expiry/payment transitions tested in isolated environment; no accidental billing or irreversible changes.
Dependencies: Successful V1 test, explicit owner authorization.

## Suggested test matrix
- Guest: photo → uncertain recognition → correction → age → useful activity → optional signup.
- AI: plush versus live animal; unsafe materials; age two; siblings of different ages; duplicate alternatives; no safe result; provider timeout.
- Auth: legacy password account; Google; email OTP; failed linking; same-email collision; guest migration; logout/session expiry.
- Data: multi-family isolation; inventory add/edit/remove; status suggestions never auto-apply; delete/export if provided.
- Reminder: known-new, unknown acquisition date, parent-confirmed use, opt-in/out, Donated/Removed.
- UI: 320px phone, desktop, keyboard, screen reader, image picker, slow connection, browser Back, PWA install.
- Access: hidden payment UI with safe testing entitlement, no production bypass, historical ₹99 entitlement, restoration only when approved.

## Decision log — still open
1. Which environments/users qualify for temporary test access, and with what quota/spend ceiling?
2. Legacy password-account transition: parallel login period, verified linking/recovery and rollback.
3. Retention periods for auth, analytics, toy images and deleted-account data; provider disclosures.
4. Supported browsers/phones and whether installed PWA offers offline shell or online-only behavior.
5. Email reminder cadence defaults and opt-in wording.
6. Exact AI output schema, safety evaluation set, latency and cost budgets.
7. Whether proposed colors/type tokens are visually approved after rendered review.

## Codex execution protocol
For each milestone: (1) inspect relevant code; (2) propose small file-level plan and tests; (3) obtain approval for risky writes; (4) implement incrementally; (5) run non-destructive checks; (6) provide change summary, proof, risks, rollback. Do not start implementation merely because this plan exists.

## First Codex task (read-only)
“Review AGENTS.md, PRODUCT.md, DESIGN_V1_PROPOSED.md, UX_FLOWS.md, IMPLEMENTATION_PLAN.md and AUDIT_REPORT.md. Verify the repository structure and note discrepancies. Produce a Gate 0 decision checklist and a proposed small M1 task breakdown with acceptance tests. Do not change application code, production configuration, payment/auth records or PRODUCT.md.”

## Execution update — V1 application work

D1.2 is the approved visual baseline. The latest owner instruction authorizes incremental V1 implementation, preserving production billing/auth records and stopping for unresolved security/privacy decisions or production changes. See V1_IMPLEMENTATION_PROGRESS.md for actual progress and verification; earlier proposal/checklists above are historical planning, not proof of implementation. Phase 1 has been implemented locally with isolated browser mocks; durable family features and live-provider/auth configuration remain incomplete.

## Current execution status — continuous V1 authorization

The latest owner request supersedes the earlier routine per-task approval protocol: independent safe implementation proceeded continuously through quality, guest journey, activity experience, family storage, reminders, privacy controls and PWA work. No production deployment/configuration change or destructive identity migration was authorized or performed.

The implementation now uses the verified separate testing project. Account-owned tables/functions and connected screens are implemented behind closed privacy/provider gates; status and actual proof are recorded in V1_IMPLEMENTATION_PROGRESS.md and V1_IMPLEMENTATION_REPORT.md. Do not treat the historical proposal or a completed screen as proof of live-provider readiness.

Remaining dependency order:

1. Owner approves real personal-data retention, deletion exceptions, provider disclosures and parental consent wording/version; complete that activation work without changing production.
2. Owner approves hard AI budget/per-request ceiling and separate testing key; perform narrowly authorized real-provider evaluation, including image cost, 1,500-token quality, nonrepetition and safety examples. Existing monetary reservations must cover worst-case charges before claiming an invoice-level hard ceiling.
3. Owner approves Google setup/email service; connect and verify Google, OTP delivery and opt-in reminder delivery in testing. Preserve password recovery and refuse email-only identity remapping.
4. Verify actual phone installation/camera/accessibility, final visual signoff and testing data deletion lifecycle.
5. Prepare an explicit production activation/rollback plan; obtain production and payment-presentation approvals before the existing Convex hosting deployment command is used.

No routine phase approval is needed for the already authorized implementation, but these provider/privacy/production decisions remain genuine blockers. No unapproved live feature should be marked complete.

## Privacy/deletion follow-up — approved product rules, activation blocked

Implement locally the parent's approved no-original-photo retention, label+age-only requirement, optional DOB/interests and family retention until explicit removal. Version acknowledgment/contact choices and keep guest expiry at 24 hours. Build owner-only bounded removal with explicit confirmation, persistent progress and retries. An account request stops after family removal at pending policy, without deleting identity/sessions or changing financial records. Details and remaining owner decisions are in [PRIVACY_AND_DELETION_REPORT.md](PRIVACY_AND_DELETION_REPORT.md).

Completed source/test work does not authorize deployment. No isolated backend update, production change, real-data collection or live AI activation in this follow-up. Next dependencies: approve legal/operational/financial retention and identity-finalization plan, separately authorize isolated source installation/finalization testing, verify complete deletion and processor/backup behavior, then approve any real collection. AI budget/provider activation remains separately prohibited.


## Bounded live-AI evaluation preparation — 14 October 2026

Decision 5A authorizes up to $10 USD conditionally; it replaces the previous disabled-only budget decision without activating AI. Testing-only reservation/usage infrastructure and deterministic tests are implemented. Safe R1 source/schema and evaluation functions are now installed in `gummy-bear-v1-testing` only. R1 identity deletion and retention approvals remain incomplete; separate provider credentials/cap, full cost accounting and 20 reviewed photos are missing. No live requests or spending occurred; general collection/payment/AI gates remain closed. See [AI_EVALUATION_REPORT.md](AI_EVALUATION_REPORT.md) for exact prerequisites, setup, tests and rollback.

Verification: 364 guarded Vitest tests plus 3 Node tests, strict TypeScript and production/testing builds passed. Pilot command refused activation before provider calls.


## Synthetic benchmark policy implemented — 14 October 2026

Owner-approved separation is implemented only for internal testing evaluation. Real-parent R1 prerequisites are unchanged. The documented allowlist now contains 24 licensed reduced toy photos; normal PWA processing/collection stays closed. Provider setup/full accounting remain blockers before the three-image pilot. No live requests or spending. See SYNTHETIC_AI_EVALUATION_REPORT.md for implementation, verification, exact setup and rollback.
