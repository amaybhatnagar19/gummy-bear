# Gummy Bear V1 — privacy, retention and deletion

14 October 2026. Safe source implementation and deterministic local verification completed. **Not activated or deployed. Full account deletion is incomplete.**

## Implementation summary

- Original photos are not stored. Device decoding is released, the temporary canvas is cleared, and the reduced preview remains in memory only. Confirmation, removal, leaving the upload/recognition flow, page exit, reset/logout and clearing temporary work release that preview. Successful activity results remain during retries. Confirmed-name activity generation now sends an empty image field: the photo is not sent again.
- No image/filename is sent to application analytics. Provider error bodies/fields are no longer logged; an error regression reproduced a provider-controlled field containing a photo before the fix. Only a fixed event and numeric status are logged. This does not certify platform or processor logging/retention.
- Only a preferred child name/label and age are required. DOB and interests are optional in both UI and backend. Omitting them during an edit removes the DOB and clears interests. No parent name, child gender, school, address or additional child fields were added.
- Versioned privacy acknowledgment is required server-side before family saving or authenticated AI admission/guest linking. Phone storage and future WhatsApp preference are separate versioned choices, and can be withdrawn. No WhatsApp messaging was introduced. Email reminders remain disabled, including server-side opt-in rejection.
- The collection gate additionally requires the exact published policy version (`v1-privacy-2026-10-14`) as well as explicit testing-only approval. A constant, a checkbox, these product approvals or a preference write do not activate collection. No flags or credentials were configured.
- Family records have no inactivity expiry. Guest drafts have a fixed 24-hour deadline, cannot be renewed using expired proof, and are inaccessible after expiry. A deadline cleanup job plus the existing hourly fallback removes them in bounded batches. Execution delays can delay physical cleanup; immediate physical erasure at precisely 24 hours is not promised.
- Family removal is bounded to 100 records per transaction, tracks progress and can resume. It remains available in isolated testing when collection approval is withdrawn. Individual child/toy/activity removal has ownership checks; toy/activity deletion is explicit, and activity deletion removes reported attempts. A toy's Removed status is distinct from deleting its record. Toy deletion does not silently erase separate activity descriptions.
- An account-deletion request removes family data and owned testing-invitation drafts first, then stops at `awaiting_policy`. It preserves sign-in identities/sessions, financial and operational/access records pending the remaining approved basis. It never reports `accountDeleted=true`. New family saving and guest linking are blocked while an account request exists.

The approved landing, PRODUCT.md, auth implementations/configuration, payment functions, existing auth/payment table definitions, dependencies and original environment are unchanged. Two additive tables and optional guest metadata are source-only changes; no remote schema change was made in this task.

## Data inventory and retention matrix

“Pending” is a blocker before real-data activation, not a new indefinite legal-retention policy. No legal period or compliance claim has been invented.

| Data | Location/purpose | Approved or implemented retention | Deletion behavior / unresolved decision |
| --- | --- | --- | --- |
| Original selected photo | Browser File/decoded bitmap during preparation | Not persisted; decoded bitmap closed and canvas pixels released in success/error paths | App cannot delete the parent's original camera/gallery file; it does not request that permission |
| Reduced photo preview | Browser memory; recognition request through Convex if subsequently approved | Not stored in database, local/session storage, inventory, analytics or worker cache | Cleared at confirmation, leaving upload flow, removal, cancel/reset/logout/page exit; JavaScript garbage collection is not a guaranteed secure memory wipe |
| Processor image/request copy | Convex execution/transport and future OpenAI processing | External rules not approved; live AI disabled | `store:false` is used but does not prove zero provider retention. Review processor contracts, logging, regions, subprocessors and deletion/retention controls before enabling |
| Child label and age | `children`, account-owned personalization | Until explicit profile/family/account-family removal; no inactivity expiry | Only these two required. Parent may use a non-identifying label |
| Optional DOB/interests | `children` | Same as profile; individually clearable | Do not intentionally pass DOB/label to AI; age and optional interests would be used. Interests can still contain personal text, so copy asks parents to minimize it |
| Toy names, condition, status, dates, assignments | `toys` | Until parent deletion or account-family removal | Status changes alone keep the record. Deletion detaches toy IDs from history, which can still contain its name until separately removed |
| Suggestions, save/favorite/intention flags, feedback, attempts | `activities`, `attempts` | Until activity/family/account-family removal; no inactivity expiry | Account-owned; deleting an activity removes associated attempts |
| Reminder settings, dates and suppression | `preferences`, `toys` | Until preference change or relevant family removal | In-app off initially; email always disabled. No claim of offline disuse |
| Optional phone and future WhatsApp choice | `preferences` | Until removal/change/family deletion, once permitted | Separate explicit phone and future preference; no messages. Purpose, notice and actual collection activation still need approval |
| Privacy/contact choices | `privacyConsents`, owner/scope/version/time/granted | Current choices only; removed with family data in this implementation | Evidence requirements/history/withdrawal/legal basis need approval before collection; this is not a complete legal consent ledger |
| Guest activity draft, age, hash, optional invite link and privacy version/time | `guestProgress` | Fixed 24 hours; no photo or child label | Proof-based discard; claimed content cleared on linking; marker expires; account request removes own linked/unclaimed invitation drafts. Anonymous records cannot be claimed by email |
| Browser guest proof/invitation/link intent | Session storage; random secrets | Tab/session lifetime or explicit clear/reset/logout; no photos/family fields | Cleared locally; losing proof does not prove server erasure. Draft will expire if discard fails |
| Deletion request progress | New `deletionRequests`: owner ID, scope, status, count/stage/times | No final retention period approved | Needed for retries and honest pending status. Approve minimal evidence/tombstone retention and eventual purge; contains no child labels, email, phone or images |
| User/auth identities, secrets, sessions, refresh/verification tokens and verifiers | Existing `users` / Convex Auth tables | Existing behavior preserved; deletion path pending | No authentication identity or session removed by this task. Need explicit isolated identity-removal approval, fresh proof/session rules and verification before activation |
| Payment events and paid entitlement/access history | Existing `paymentEvents`, user entitlement fields, `accessReservations` | Existing records preserved, not automatically altered | Decide operating entity/jurisdiction, required fields, lawful basis and period; no financial deletion, anonymization, cancellation or refund behavior implemented |
| Operational/analytics records | Existing `photoRuns` (may include email), visitors, analytics visitor/settings records, quota/budget/admission records | Existing behavior except owned testing invitations removed by account request | New flow does not send photos to these tables. Email/visitor correlation, retention, anonymization and access-reservation handling remain unresolved; account deletion is not complete while these remain unresolved |
| Platform logs, traces, backups/snapshots, restored copies | Convex/browser/processor operations, separately managed | Not inspected or reconfigured; no period approved | Establish actual configuration, access controls, retention/deletion timing and restoration exclusions. Database deletion alone is not proof of backup erasure |
| Public cached app/assets | App-scoped service worker | Public-only offline cache | No private family/API/photo caching. Native device/browser caches and saved screenshots outside the app are not erased by this workflow |

## Account-deletion status and safety

| Step | Status |
| --- | --- |
| Parent types DELETE ACCOUNT and separately confirms the irreversible family removal/pending account stage | Implemented and browser-tested locally |
| Server derives owner from sign-in, rejects browser owner/request targeting | Implemented and tested across unrelated accounts |
| Freeze new family/consent writes and guest linking | Implemented; authenticated AI admission also checks current consent/deletion status |
| Remove children, toys, activities, attempts, preferences, current consent choices and linked guest drafts | Implemented, tested; owned invitations/unclaimed drafts additionally removed for account scope |
| Small atomic batches, idempotent request, persisted stage, continuation and retry | Implemented/tested locally; a failed transaction rolls back without a false completion marker |
| Claim completion only after family stages finish | Implemented; pending counts/status shown. Old null-response endpoint throws/rolls back for partial removal instead of claiming success |
| Remove identity/sessions, personal operational associations and retain only legally required financial fields | **Not implemented or executed: approval-sensitive and policy-blocked** |
| Verify external logs/backups/processor deletion and close/purge request evidence | **Policy/configuration blocked** |
| Real isolated-cloud deletion walkthrough | **Not run: no deployment or remote deletion authorized by this task** |

Family deletion is permanent once committed. “Recoverable” means retrying unfinished batches, not restoring erased family records. A scheduler failure leaves a pending request and blocks saving; the parent can retry. There is no cancellation/undo after removal begins. Account and family request states are not a substitute for a reviewed response-time/support policy.

### Identity and session removal plan — not executable yet

1. Approve the retention map and a fresh parent-proof requirement. Freeze account writes and confirm all family stages actually finished. Resolve in-flight access reservations without changing another account or losing the approved billing basis.
2. Inventory identity relations using the installed Convex Auth API/schema: sessions by `userId`; accounts by `userIdAndProvider`; refresh tokens by `sessionId`; verification codes by `accountId`. The installed public `invalidateSessions` helper is available; its scope and stale access-token handling still need isolated regression/walkthrough verification before use.
3. Review PKCE verifier cleanup: installed `authVerifiers` has a `sessionId` field but only a signature index. Add a reviewed index if necessary rather than scanning all users. Resolve rate-limit identifiers through proved provider relations; do not equate matching email with account ownership.
4. Review financial/analytics references before removal. `paymentEvents` and some photo analytics associate by email, not user ID; duplicate/shared/changed emails make blind matching unsafe. Define the minimum legally required archival fields and permitted reference removal first. Do not silently pseudonymize or alter financial records.
5. After separate authorization, test a gated finalization path with entirely synthetic accounts. Invalidate this user's sessions/refresh tokens, remove owned auth credentials/codes/verifiers, verify all related stores and stale JWT behavior, then remove the user identity only when no unsafe references remain. Never rotate shared keys, delete a different parent, or automatically merge accounts.
6. Verify zero required personal identity/operational records remain, handle backup/restore suppression and processor obligations under the approved policy, and only then record completed account deletion. Keep truthful pending/failed states for any unfinished step. Approve deletion evidence retention and its eventual purge.

No finalizer, auth deletion call, token purge, financial mutation, archive or remapping command was added/executed.

## Privacy and consent copy

Versioned shared copy is in `shared/privacy.ts`, shown in the Profile privacy section and the separate photo-processing disclosure. It is prepared implementation copy, **not a published legal privacy policy**.

| Context | Copy / meaning |
| --- | --- |
| Child form | “Only a preferred name or label and age are required. Birth date and interests are optional. Please avoid full names, school details and addresses. Real-data saving remains paused.” |
| Privacy acknowledgment, unchecked initially | “I have read the privacy information about family saving and deletion.” Current version required server-side; acknowledgment does not establish a yet-undecided legal basis |
| Photo processing, unchecked initially | “I understand that recognition sends a reduced copy to the AI provider when processing is enabled.” No provider activation or paid request authorized |
| Guest draft, optional and unchecked initially | “Keep these guest suggestions for up to 24 hours so I can link them after signing in. No photo is kept. This is optional.” Without this choice, successful guest ideas stay only in memory |
| Phone, separate unchecked choice | “I agree to store this optional phone number.” A number is not required for core play |
| Future WhatsApp, separate unchecked choice | “I’d like to opt in separately to future WhatsApp updates, if offered.” No messaging implemented; exact future marketing basis/purpose requires separate review |
| Email | Email delivery/opt-in unavailable; default remains off |
| Account request | Family removal is permanent; sign-in identity, sessions and billing/access records remain pending approved removal/retention decisions; this is not completed account deletion |
| Failure | “This step did not complete.” followed by a recoverable error; no completion claim |

## Verification

The isolated project boundary was read-verified against `gummy-bear-v1-testing`. A public read-only testing capability query confirmed personal-data collection, live AI, Google/email sign-in and email reminders still disabled. No original project/account/payment data was read. No remote records, flags, credentials, schemas or deployments were written. Backend tests use only synthetic in-memory databases and the existing network guard; browser tests intercept all backend traffic and fail unexpected outbound requests.

Commands executed:

```sh
npm run testing:verify
./node_modules/.bin/vitest run tests/backend/privacy.test.ts
./node_modules/.bin/vitest run tests/backend/privacy.test.ts tests/backend/photo-privacy.test.ts
npm test
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --types node,vite/client vitest.config.ts tests/setup/no-network.ts tests/backend/*.test.ts tests/browser/*.ts playwright.config.ts
npm run build
npm run build:testing
GUMMY_TEST_URL=http://127.0.0.1:5175 GUMMY_PWA_TEST_URL=http://127.0.0.1:5176 ./node_modules/.bin/playwright test --timeout=30000
```

A small Node script additionally read only the existing testing capability query; the result contained only disabled-feature booleans. Original `.env.local` checksum matches the preserved baseline. Protected-file Git checks cover PRODUCT.md, auth/config/identity/providers, payments/access, landing/assets and lockfile.

Final results: **345 guarded Vitest tests across 22 files + 3 Node tests; 15 isolated browser checks; application and strict tests/config TypeScript checks; local production/testing builds passed.** 20 new guarded tests and two new browser cases over the accepted baseline. Existing nonfatal Convex Auth bundler warning remains. Cloud function installation/runtime/schema validation and physical-phone behavior were not verified for these new changes because deployment was prohibited.

Test-first failures were expected missing privacy functions/optional interests/individual deletion. A reproduced error-log leak failed before the fix. A synthetic fixture initially lacked the new required acknowledgment and was corrected. One older browser expectation required photo preservation across leaving the upload flow; it was changed to assert intentional privacy cleanup. TypeScript initially rejected an overly broad helper type; corrected to the actual authenticated test-context type. Final checks also caught and fixed exact-expiry cleanup excluding equality and internal invitation creation after a pending account request. Final checks are green; no failure silently ignored.

Screenshots, using synthetic data only: [mobile privacy](test-results/privacy-privacy-copy-is-ho-aa8f1-led-without-policy-approval/privacy-390.png), [desktop privacy](test-results/privacy-privacy-copy-is-ho-aa8f1-led-without-policy-approval/privacy-1440.png). These are local ignored test artifacts.

## Exact approvals needed before activation

| Decision | Required owner action |
| --- | --- |
| Legal policy and collection | Approve operating entity/jurisdiction, parent-only audience/consent basis, notices, controller/support contact, rights/request process, processor disclosures and this copy version. Product decisions above are recorded; they do not settle the remaining legal/operational policy |
| Operational and backup retention | Approve purposes, access, periods or deletion triggers for logs/traces, analytics/visitor associations, auth rate limits, request evidence, backups/restores and deletion SLA. Verify actual Convex/provider configuration; no durations invented |
| Financial records | Identify the legally required fields, basis and period, and specify how personal references, paid entitlements, access history and pending reservations are handled during account closure. Approve an isolated synthetic archival/deletion design before touching financial records |
| Identity finalization | Separately authorize implementing and testing irreversible identity/session removal only after the above basis is settled. Approve fresh proof, progress/failure handling, support and restoration-exclusion rules. Existing production accounts must remain untouched |
| Testing backend installation | Explicitly authorize installing these source/schema changes only into the verified isolated deployment; this task's no-deploy rule kept them local. No frontend publish or production installation implied |
| Real invited testers | Approve the complete notice/retention/deletion process and resolve blocked account finalization before any flag allows real-data collection. In-memory synthetic consent fixtures are not real enrollment |
| AI or external providers | **No approval now.** Any future budget, credential, processor activation or live request needs separate explicit approval and the existing access/spending checks. Privacy approval alone must not enable paid AI |

Next owner decision: resolve the financial/operational retention basis and identity-removal policy before collection activation. No legal review is claimed.

## Rollback and file changes

Starting checkpoint: `45fdb4f`; final working checkpoint recorded in progress/history. Changes are local. Revert only this task's commits/files, preserving unrelated untracked work and closed gates. Nothing remote needs reversal. If later installed, leave additive tables and pending requests intact until a reviewed rollback can preserve deletion blocking/progress; do not reintroduce deleted family records from backups or activate collection by reverting the version guard. Git rollback cannot recover erased data.

Created: `shared/privacy.ts`, `convex/privacyAccess.ts`, `convex/privacy.ts`, `src/features/app/PrivacySettings.tsx`, `tests/backend/privacy.test.ts`, `tests/backend/photo-privacy.test.ts`, `tests/browser/privacy.spec.ts`, this report.

Modified: `convex/schema.ts`, `convex/_generated/api.d.ts`, `convex/v1Policy.ts`, `convex/family.ts`, `convex/guest.ts`, `convex/testingAccess.ts`, `convex/play.ts` (error logging only), `src/photo.ts`, `src/features/app/usePlayFlow.ts`, `src/features/app/Application.tsx`, `src/features/app/PlayJourney.tsx`, `src/features/app/FamilyScreens.tsx`, `playwright.config.ts`, existing backend family/auth-identity/AI synthetic fixtures, existing browser app-shell/family/flow/simulation tests, README and V1 progress/implementation/environment documentation.

Schema source changes: new indexed `privacyConsents` and `deletionRequests`; optional `guestProgress.privacyVersion` and `acknowledgedAt`. No existing required field was tightened, no original auth/payment table altered, and no migration/backfill/drop executed. Generated API type declarations describe the new local modules; regenerate through a separately authorized isolated update before cloud activation.

### Exact changed files

- `IMPLEMENTATION_PLAN.md`
- `PRIVACY_AND_DELETION_REPORT.md`
- `README.md`
- `V1_ENVIRONMENT_SETUP.md`
- `V1_IMPLEMENTATION_PROGRESS.md`
- `V1_IMPLEMENTATION_REPORT.md`
- `convex/_generated/api.d.ts`
- `convex/family.ts`
- `convex/guest.ts`
- `convex/play.ts`
- `convex/privacy.ts`
- `convex/privacyAccess.ts`
- `convex/schema.ts`
- `convex/testingAccess.ts`
- `convex/v1Policy.ts`
- `playwright.config.ts`
- `shared/privacy.ts`
- `src/features/app/Application.tsx`
- `src/features/app/FamilyScreens.tsx`
- `src/features/app/PlayJourney.tsx`
- `src/features/app/PrivacySettings.tsx`
- `src/features/app/usePlayFlow.ts`
- `src/photo.ts`
- `tests/backend/auth-identity.test.ts`
- `tests/backend/family.test.ts`
- `tests/backend/photo-privacy.test.ts`
- `tests/backend/privacy.test.ts`
- `tests/backend/v1-ai.test.ts`
- `tests/browser/app-shell.spec.ts`
- `tests/browser/family-ui.spec.ts`
- `tests/browser/isolatedBackend.ts`
- `tests/browser/privacy.spec.ts`
- `tests/browser/v1-flow.spec.ts`
