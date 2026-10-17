# Option A production deployment report

Date: 14 October 2026. **Result: successfully published and verified.** No Option C or V1 production activation was performed.

## Production URL and approved checkpoint

- Website: https://sensible-avocet-370.convex.site/
- Existing application: https://sensible-avocet-370.convex.site/app
- Existing project: `build-sprint-app`; production deployment: `sensible-avocet-370`.
- Deployed source checkpoint: **`0ef387ef0bcc6ffa76c897549a592edf3214e88c`**.
- Final static-hosting publication ID: `f44832ca-da43-46bc-8426-b44327d1079a`.

The exact approved Git revision and clean tracked source were checked before publication. No application source/configuration was edited during deployment. This report is a post-deployment documentation addition.

## Exact deployment mechanism

The installed `@convex-dev/static-hosting` uploader and its subprocess helper were inspected. The `upload` subcommand calls existing hosting-component asset functions using `convex run`, with code generation/typechecking disabled and **no push/deploy option**. It uploads files, updates the hosting manifest and manages obsolete hosting assets. It does not deploy application functions, auth, schemas or cron jobs. The existing component's read-only `lib:getUrls` returned the expected production cloud/site URLs before publication.

Initial approved command:

```sh
GUMMY_RELEASE_APPROVED_COMMIT=0ef387ef0bcc6ffa76c897549a592edf3214e88c npm run release:option-a
```

The wrapper verified production metadata/commit/clean source, rebuilt `dist-option-a`, verified preserved app/CSS/QR hashes, then invoked:

```sh
node node_modules/@convex-dev/static-hosting/dist/cli/index.js upload --dist dist-option-a --prod --component staticHosting
```

The initial upload succeeded but asset verification found an unintended `.DS_Store` file copied from the local public folder. It was removed **from the generated artifact only**. Exact checkpoint/target and original app/CSS/QR hashes were rechecked, and the same frontend-only upload command republished the corrected 16-file artifact. No source, backend or environment settings changed during this correction. The original ignored local metadata file was not edited.

**`npm run deploy` was not executed.** No backend deploy, migration, data backfill, application-data cleanup or provider call ran. Hosting-component asset replacement/garbage collection occurred as part of authorized static publishing; this is distinct from account/payment/family database operations.

## Final published files

All 16 final assets were downloaded from the public website and matched against the local release artifact byte-for-byte:

```text
/index.html
/assets/index-D3V4kNu2.js
/assets/LandingPage-CnyFQVap.js
/assets/LandingPage-BDumRiVM.css
/assets/index-ARx4V7n1.js
/assets/index-CdxPm9Ml.css
/brand/gummy-bear-mark.svg
/favicon-32.png
/fonts/OFL.txt
/fonts/plus-jakarta-sans-latin.woff2
/images/ASSET_SOURCES.md
/images/gummy-bear-character.webp
/images/toy-teddy-640.webp
/images/toy-teddy-960.webp
/payments/README.md
/payments/upi-qr.png
```

The original app bundle, original stylesheet and QR retain their pre-release paths and SHA-256 hashes. No new PWA worker/manifest, V1 application bundle, testing credentials, synthetic records or backend functions were published. The removed metadata URL now returns the hosting HTML fallback rather than the metadata file.

## Verification results

| Verification | Result |
| --- | --- |
| Production target and installed hosting component URLs | Correct `sensible-avocet-370` |
| Approved commit/clean tracked source | Matched before both publications |
| Fresh rollback assets vs previously approved production capture | All four unchanged |
| Final public assets | All 16 byte-identical to corrected artifact |
| `/`, `/app`, `/app/` public responses | Successful; expected index served |
| Rendered landing | Approved D1.2 content loads |
| All three Get Started links | `/app`; navigation opens original tool |
| Direct `/app` navigation and refresh | Original tool remains available |
| Existing password form/signup control | Reachable; no real submission |
| Authentication discovery/JWKS | Both publicly reachable; signing-key public set unchanged |
| Payment asset | Original `/payments/upi-qr.png`, unchanged bytes |
| Mobile landing | 390 px check passed without horizontal overflow |
| Production environment, including OpenAI setting | Before/after comparison unchanged |
| Production schema definitions | Before/after comparison unchanged |
| Root local environment | Before/after comparison unchanged |
| Paid AI requests / real account creation | None |

Published HTML/JS/CSS/assets were inspected in a real browser. All backend HTTP/WebSocket traffic was intercepted **before navigation** and replaced with synthetic replies, so checking the live frontend did not create visitor/account/payment records. The browser reported zero application errors and zero backend actions. External font traffic was mocked, not sent to a third-party provider. The test did not submit photos, password forms or payments.

Desktop/mobile screenshots are saved in `test-results/option-a-deployed/`. Browser inspection occurred before the metadata-only corrective publication; the final artifact check confirms all functional HTML/JS/CSS/image bytes remained identical afterward.

Pre-release results are documented in `OPTION_A_RELEASE_REPORT.md`: 386 guarded Vitest tests, 3 Node tests, 4 Option A browser tests, 16 existing isolated browser tests, TypeScript and both required builds passed; one unrelated compiled testing-PWA check skipped. These suites were not rerun unnecessarily during publishing; the approved wrapper performed a fresh TypeScript/Option A build and asset verification.

## Backend, authentication, payment and data preservation evidence

- Only existing `staticHosting` component functions were invoked for writes; no application-backend code deployment occurred.
- Read-only before/after checks compared complete production environment configuration, active schema and public JWKS without displaying or persisting secret values. Comparisons passed after both publication rounds.
- `OPENAI_API_KEY` remains configured and unchanged. No paid AI request or credit purchase occurred. Model selection and existing quota/access behavior remain in the untouched live backend; real inference availability/credit remains untested.
- No Google/OTP provider, family-data gate, testing grant or V1 flag was activated. Pending local V1 gates were not deployed, so they cannot disable the existing production AI endpoint through this release.
- Exact original app bytes preserve existing password/session storage, guest visitor identity, original API arguments, access/payment controls and entitlement presentation at the same website origin.
- No customer tables were queried, exported, copied, migrated or mutated. Hosting manifest/storage records necessarily changed to publish the website; **“data unchanged” means application/customer/authentication/payment records**, not the hosting component's asset records.
- Private rows were deliberately not read to independently compare contents. Preservation evidence is the restricted write mechanism, unchanged schema/configuration and unchanged original client—not a customer-data audit.

Actual customer sign-in, existing real sessions, trial consumption, payment submission and provider success were not exercised remotely because they could mutate records or spend money. Their original implementation remains unchanged.

## Rollback procedure

A fresh, private pre-publication copy exists at:

```text
.release-backups/option-a-prepublish-2026-10-14/
```

It contains original `index.html`, `assets/index-ARx4V7n1.js`, `assets/index-CdxPm9Ml.css`, `payments/upi-qr.png` and a hash manifest. The four public files were freshly retrieved and verified against the earlier capture before any publication. No accounts, database export, signing/provider credentials or personal records are included.

Rollback requires separate owner authorization:

1. Prepare a clean local directory containing the four original public files, preserving paths. Do not upload the backup manifest.
2. Verify each file against `ROLLBACK_MANIFEST.json`; verify the production target/component.
3. Use the same frontend-only `upload --dist <rollback-directory> --prod --component staticHosting` mechanism. Do not run the general deployment command or deploy an old schema.
4. Verify original `/` tool, asset paths, auth discovery and QR. Do not submit paid AI, accounts or payments.

This restores the previous frontend without replacing application functions or deleting/rewriting customer records. Hosting replacement may remove the new landing's assets; the approved source checkpoint can rebuild them if subsequently authorized. No rollback was executed.

## Remaining risks and stop boundary

- Existing provider model access, balance and actual inference behavior were not tested. Preserving them is not a promise of successful paid requests.
- Original legacy UI/safety/privacy behavior remains; this release does not install the newer M1 backend or complete V1 privacy/deletion requirements.
- A future Option A rebuild currently copies ignored Finder metadata unless the generated artifact is checked/cleaned again. The deployed artifact is clean; improving that build filter requires a separately reviewed source change, not silently modifying the approved checkpoint.
- Physical-device camera/session behavior and actual customer login/payment walkthroughs remain unverified.
- Hosting asset garbage collection occurred normally; retain the private rollback copy.

**Option A is live and the authorized post-publication checks passed.** No Option C activation, further feature implementation, provider activation or production policy change was begun. Stop here.
