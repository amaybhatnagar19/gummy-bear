# Gummy Bear — Existing Implementation Audit

Audit date: 14 October 2026. Scope: the current local repository, including tracked application files and the existing dependency lockfile. This is an implementation audit, not a redesign.

## 1. Executive summary

Gummy Bear is currently a small React application that accepts one toy photograph and a child’s age, then asks OpenAI to identify toys and generate three activities in a single request. Convex provides backend functions, database records, email/password authentication, trial and payment access, analytics, and static hosting.

The working code covers a narrow first-value experience. It does **not** implement the broader persistent product described in PRODUCT.md: child profiles, toy inventory, activity history, feedback, recognition correction, forgotten-toy reminders, or household reuse/donation guidance. There is no separate landing website or PWA setup. Authentication and a ₹99/month manual-payment flow exist even though PRODUCT.md parks login creation outside its sprint scope.

The strongest existing foundations are server-side access checks, atomic trial reservations, bounded image preparation, response-shape validation, recoverable AI errors, and focused access/analytics tests. The largest gaps are persistent product memory, correction before generation, safety enforcement beyond prompts, privacy/deletion controls, and proof of mobile and live AI behavior.

### Evidence and verification limits

| Check | Audit result | What it proves |
| --- | --- | --- |
| `node --experimental-strip-types --test tests/rules.test.ts` | 3 tests passed | Prompt wording, rolling quota rules, response shape |
| `./node_modules/.bin/vitest run --no-cache` | 15 tests passed across 2 files | Access/payment and analytics logic against an isolated in-memory Convex test database |
| `./node_modules/.bin/tsc --noEmit --incremental false` | Passed | Included frontend/backend source satisfies TypeScript checks |
| Production build | Not run | Bundling and deployment remain unverified in this audit |
| Browser tests, live AI, signup, payments | Not run | Existing browser tests change Convex data and submit paid provider requests |
| Real phone, screen reader, rendered screen review | Not performed | Appearance, camera behavior, keyboard flow, and accessibility are not certified |

README.md describes earlier development and production checks. Existing `.impeccable/review/` artifacts are present, but their screenshots and recorded replies were not evaluated or treated as fresh proof. An existing browser test is not evidence that the current repository passes it.

Only AUDIT_REPORT.md was added. No app, dependency, environment, database, PRODUCT.md, or DESIGN.md changes were made. No environment files or credential values were read. Skill guidance was limited to read-only interface and hosting review; context/detector tools that could create auxiliary files were not run.

## 2. Current technology stack

Versions below are resolved versions in package-lock.json, not claims about the newest releases or deployed versions.

| Area | Current implementation |
| --- | --- |
| Frontend | React and React DOM 19.3.0; Vite 8.3.4; TypeScript 7.0.2; client-rendered single-page app |
| Backend | Convex 1.46.0; queries read data, mutations change data, actions coordinate external AI calls |
| Database / ORM | Convex document database, schema validators and indexed queries; no separate SQL database or ORM, meaning a library mapping database records to application objects |
| Authentication | `@convex-dev/auth` 0.0.96, password provider; `@auth/core` 0.41.3 also declared |
| Auth setup utility | `jose` 6.2.12 generates signing keys when missing; setup script must not be run as part of an audit |
| AI | Direct server-side HTTP request to OpenAI Responses API; configured model string `gpt-6-luna`; no AI SDK, agent framework, or retrieval system |
| Image handling | Browser `createImageBitmap` and canvas; reduced JPEG encoded inside the action request; no toy image upload endpoint or saved toy-photo storage |
| Hosting | `@convex-dev/static-hosting` 0.2.1; Convex HTTP router serves built assets alongside auth routes |
| State | React `useState`, refs and effects; reactive Convex hooks; browser local storage for visitor identifier and library-managed auth persistence; no Redux/Zustand/router library |
| Styling | One plain CSS file, five named color variables, Google Fonts Nunito; custom HTML/SVG components; no Tailwind or UI component kit |
| Tests | Node built-in test runner; Vitest 5.0.4; convex-test 0.0.61; Playwright 1.64.0 |
| PWA | Theme-color and viewport metadata only; no manifest, service worker, install controls, offline shell or app icons configured |

React, Convex and Convex Auth are the runtime core. Static hosting supplies deployment, jose supports an owner setup script, and the remaining major packages support build/type checks or tests. A lockfile is committed. Dependency vulnerability scanning was not performed; no vulnerability conclusion follows from package versions alone.

## 3. Architecture overview

### Photo-to-activity flow

1. `index.html` loads `src/main.tsx`. Vite supplies the public Convex connection URL. `ConvexAuthProvider` supplies the backend client and authentication state.
2. The app creates/reuses a random browser visitor identifier. `access.status` reports trial, signup, bonus, payment or paid access.
3. A camera/gallery file input provides one selected file. `shrinkPhoto` checks image MIME type and a 25,000,000-byte limit, decodes it, reduces the longest edge to 768 pixels and redraws it to JPEG. It tries quality 0.75, 0.55 and 0.35 until the data URL fits 350,000 characters.
4. `api.play.discover`, re-exported from `convex/ideas.ts`, reserves trial/account access before calling AI. It starts an analytics record.
5. Internal `play.generate` validates age and image string, checks provider configuration, reserves a global AI-call slot and sends the photo plus age to OpenAI.
6. It parses and validates the answer. `ideas.discover` records success and finalizes the reservation. Failed requests and empty toy results refund trial/bonus access. Scheduled 90-second cleanup handles abandoned reservations and incomplete analytics records.
7. React shows toy names and three activities. Photo, age, results and navigation screen live in memory; refresh discards the photo and activities.

### Persistence boundaries

The app stores accounts/auth records, payment timestamps/events, visitor usage, temporary reservations, AI quota timestamps and request metadata. It has no child, toy or activity tables. Photos and AI replies are not written to the app’s database/storage by the inspected code. The full photo still travels through Convex to OpenAI. Static hosting uses storage for deployed assets, which is separate from a toy-photo storage system.

### Deployment

`npm run deploy` invokes the installed Convex static-hosting CLI. Its local source describes building with the production backend URL, deploying Convex functions and uploading static assets. `convex/convex.config.ts` registers the component; `convex/http.ts` registers auth and static routes. `vite.config.ts` selects the public client URL from build configuration. Git push does not deploy; no repository CI deployment workflow was found.

README.md documents a production `.convex.site` address and separate production auth/provider setup. Production health, active keys, actual deployed revision, cache headers and rollback procedures were not checked. Auth setup generates missing signing keys and preserves existing ones; it is an environment-changing owner operation.

## 4. Repository structure

| Path | Responsibility |
| --- | --- |
| `PRODUCT.md` | Product jobs, flows, exclusions and milestones; comparison baseline; left unchanged |
| `IDEA_SCOPE.md` | Broader original idea, including discovery and playful chat |
| `DESIGN.md` | Existing visual references and proposed website/PWA journeys; plans rather than implementation evidence |
| `README.md` | Current narrow feature set, payment operations, setup, testing and deployment claims |
| `.impeccable/surfaces/` | Smaller briefs describing implemented play/access surfaces |
| `src/main.tsx` | App bootstrap, shared header/footer, image input, age, generation, access-screen transitions and result/error rendering |
| `src/AccessPanel.tsx` | Signup/login forms, payment QR, bonus claim and return controls |
| `src/photo.ts` | Image decode, resize, JPEG conversion and size bounds |
| `src/visitor.ts` | Browser token creation and local-storage persistence |
| `src/style.css` | Entire visual system, states, mobile breakpoint and reduced-motion rules |
| `convex/schema.ts` | Auth tables plus access, analytics, payments and AI quota records/indexes |
| `convex/auth.ts`, `auth.config.ts` | Password provider, email normalization and auth configuration |
| `convex/access.ts`, `paymentRules.ts` | Access lookup, bonus, reservations/refunds, manual payment and month-end calculations |
| `convex/ideas.ts` | Public generation coordinator: access, analytics, internal AI, cleanup |
| `convex/play.ts` | Internal OpenAI call and legacy public-action re-export |
| `convex/rules.ts`, `quota.ts` | Prompt helper, output validation and rolling global call cap |
| `convex/analytics.ts`, `analyticsRules.ts` | Request recording, internal reporting queries, test exclusions and IST daily aggregation |
| `convex/http.ts`, `convex.config.ts` | Auth HTTP endpoints and static-hosting component integration |
| `convex/_generated/` | Generated Convex API/data/function types and bindings; not manually authored product modules |
| `scripts/setup-auth.mjs` | Owner auth-key setup; changes remote configuration |
| `scripts/production-report.mjs` | Owner-only production reads and daily JSON report |
| `public/payments/` | Public QR asset and placement instructions; extra untracked `.png.jpg` exists and is not referenced by UI |
| `tests/` | Pure rules, in-memory backend tests, state-changing browser tests and teddy-photo fixture |
| Root config files | Package scripts/lockfile, Vite, TypeScript, Vitest, Playwright and HTML entry |

### Responsibility and duplication findings

- No duplicated large UI components were found. This is a small codebase, not a sprawling component system.
- `main.tsx` carries many responsibilities in one component. Image processing and access-panel extraction help, but app state, access transitions and results remain coupled.
- `AccessPanel` combines three distinct flows through conditionals. Manageable now, harder to extend with account recovery or settings.
- Visitor-token checking is repeated in frontend, access and analytics with the same loose character/length pattern. Frontend result types, Convex validators and runtime result validation also repeat the reply contract.
- `ideas.ts` owns orchestration while `play.ts` both calls AI and exposes its public alias. The naming/re-export is intentional compatibility wiring but obscures the entry point.
- CSS and much source code are compressed into very long lines. This makes reviews, line-level diagnosis and future changes harder.
- Broad design plans, product scope, current README and surface briefs describe different stages. Treat the implemented files as current behavior, and resolve document disagreements before building.

## 5. Feature implementation matrix

“Implemented” means an identifiable code path exists; the verification column states the actual proof. “Not implemented” means no supporting product code/schema was found in this repository.

| Major feature | Status | Actual behavior and PRODUCT.md comparison | Verification |
| --- | --- | --- | --- |
| Landing website | Not implemented | Root opens the tool with an introductory headline; no separate explanatory site or Get Started journey. Expanded landing plan appears in DESIGN.md. | Source review |
| Guest experience | Implemented | Photo + age without initial login; two successful browser trials, then signup/payment gate. More restrictive than the login-free v1 described in PRODUCT.md. | Local access tests pass; browser not run |
| Toy image upload | Implemented | One camera/gallery file, preview, compression and backend submission; supports multiple toys in one image, not multiple image files. No permanent upload storage. | Source only for browser processing |
| Toy recognition and correction | Partially implemented | Combined recognition/generation exists; changing the image is possible. No editable labels, confirm step or corrected recognition input. | Response-shape tests pass; live recognition unverified |
| AI activity generation | Implemented | Three age/photo-based activities rendered together. Freshness, usefulness and safety not guaranteed by shape validation. | Validator tests pass; live quality unverified |
| Activity history and feedback | Not implemented | No saved chats, liked ideas, activity outcomes or revisit controls. Analytics is not activity history. | Schema/UI review |
| Child profiles | Not implemented | Age selector only, default 4; no names, DOB, interests, siblings or stored age. | Schema/UI review |
| Toy inventory | Not implemented | No toys table, ownership, saved images, status, last-used date or database selection. | Schema/UI review |
| Companion Mode | Partially implemented | Photo-to-ideas is a narrow companion function; no named mode, inventory reuse, chat memory or correction. | Local orchestration failure/access tests; live success unverified |
| Reuse Reminder | Not implemented | No forgotten/outgrown detection, household reuse, donation, scheduled nudges or notifications. Scheduler jobs only finalize access/analytics. | Source/schema review |
| Authentication | Implemented | Email/password signup/login/logout; no app recovery or verification flow configured. PRODUCT.md parks login for v1. | Access tests use simulated identities, not actual password login |
| Guest-to-account migration | Partially implemented | Same mounted app retains current photo/result during signup; analytics can associate a run with account email. No transfer of guest history/inventory; none exists. Guest usage remains a separate visitor record. | Source review; no migration browser proof |
| Data privacy and deletion | Partially implemented | Image minimization and no app photo/history persistence; server-only provider key. No delete-account/data UI, retention policy or purge functions. | Analytics field tests pass; provider retention unverified |
| PWA installation and navigation | Not implemented | No manifest/service worker/install flow; root tool and memory-based access screens only. | File/config review |
| Playful Chat / WhatsApp / discovery | Not implemented | No conversational, voice, messaging or recommendation integration. PRODUCT.md parks several of these; IDEA_SCOPE.md is broader. | Source review |

PRODUCT.md itself conflicts on gallery scope (limited selection is required, “gallery access” is also parked). Its reminder exception says nudges “should be done” for newer toys, while later milestones emphasize toys unused for two months. Neither rule is implemented. These require product decisions rather than silent interpretation.

## 6. UX and design findings

### Pages, routes and navigation

There is one root app surface. `AccessScreen` changes the displayed panel without changing the URL. No routing library, deep links, browser-history synchronization, inventory tabs, modal or bottom sheet exists. Header/footer are shared inline markup, not reusable layout components. The brand link reloads `/`, losing in-memory work. Browser Back does not represent the panel sequence.

The photo and result panels are side by side on desktop and stacked below 800px. There is no activity-detail screen; instructions live directly in cards. Toy names arrive with activities, leaving no confirmation/correction opportunity beforehand.

### Visual system

- Nunito weights 400–900 are requested through a Google Fonts CSS import, with a sans-serif fallback. External font loading adds a network dependency; a rendered performance measurement was not taken.
- Cream `#FFF8F3`, charcoal `#30303D`, purple `#675096`, muted `#685e73`, lavender, peach and mint define the main appearance. CSS uses a darker primary purple than the approximate reference in DESIGN.md; the play brief explicitly documents the change for readability.
- Five named color variables coexist with many literal colors, dimensions, radii and shadows. There are no shared spacing, typography, radius or button-variant tokens.
- Buttons share a global base with primary overrides; photo, header and access controls override size individually. Most controls have 48px minimum height; header buttons use 40px. This is a potential touch-usability concern, not a measured accessibility failure.
- Activity categories/colors are assigned by array position, not a validated category field. Labels can misrepresent an AI reply that ignores requested ordering.
- Global element selectors and compressed CSS are reasonable for a prototype but make future page-specific changes prone to unintended effects. `.header-note` has styling but no current markup.

### States and accessibility

Positive code evidence: meaningful headings, labeled age/auth controls, image alternative text, decorative SVG hiding, polite result announcements, busy-state attributes, alert roles for errors, disabled busy controls, visible keyboard focus rules, semantic article cards and reduced-motion support.

Existing states include no photo, photo preparation, AI loading, no recognizable toys, AI/network error, auth error and missing QR. There is no explicit loading/error surface for `access.status`; unresolved access leaves the primary button disabled. Signup/login replace one another with generic errors. Logout rejection is not caught. Payment confirmation has explanatory copy but no support contact or explicit pending-payment record/status.

Confirmed behavior gaps: changing age clears current results; requesting more also clears results before success, so a failed attempt removes usable earlier ideas. Login/signup/payment screen switches do not explicitly move focus to the new heading or main field. The error retry button calls generation whenever a prior photo exists, including some photo-selection errors where selecting a different valid image would be the relevant recovery.

Potential mobile issues requiring inspection: header brand plus Payment/Log out may overflow narrow signed-in screens because the header does not wrap; mobile results sit below a substantial photo form without automatic scroll/focus; decoding a large source image can use significant memory before it is resized; real phone formats such as HEIC depend on browser decoding. File capture is a browser hint, not proof of an in-app camera experience.

No rendered contrast, zoom, keyboard, screen-reader or device testing was performed. Component existence and CSS breakpoints do not establish visual correctness or WCAG conformance.

## 7. AI implementation findings

### Prompts, settings and contract

`convex/play.ts` contains the main instruction string and request settings. `convex/rules.ts::photoPrompt` adds the child’s age and JSON request. A single provider call performs recognition and generation; there is no separately persisted or correctable recognition result.

Settings: Responses endpoint, model string `gpt-6-luna`, low reasoning effort, low image detail, 500 output tokens, JSON-object format, `store: false`, 60-second request timeout. Provider/model availability was not tested or independently looked up; these are the literal configured values.

Input validation requires integer age 2–8 and a JPEG data URL no longer than 350,000 characters matching a base64-character pattern. It does not decode server-side to prove actual JPEG bytes, dimensions or image contents. Client checks cannot prevent direct callers from submitting syntactically matching garbage.

The reply contract is `{ toys: string[], ideas: { title: string, instructions: string }[], raw: string }`. Runtime validation allows at most 12 nonempty toy names, each shorter than 120 characters, and requires either no toys/no ideas or exactly three nonempty activities. It does not impose title/instruction length limits, category fields, toy references, confidence, duration or safety metadata. JSON-object mode is not a provider-enforced application schema. Unexpected fields can pass the helper but conflict with downstream Convex return validation.

### Safety and reliability

The prompt treats image text as untrusted, distinguishes plush toys from live animals, uses conservative ambiguous-plush naming, excludes people/household objects, forbids extra purchases and dangerous play, asks for age-appropriate supervision, and forbids small loose pieces under age three. The UI reinforces adult supervision.

These are **prompt instructions**, not independently enforced output checks. There is no safety classifier, dangerous-material rule validator, human confirmation or age/toy suitability filter. The app also does not detect faces or refuse photos containing children before sending them externally.

“Exactly three different” is not enforced semantically. The existing validator test explicitly accepts three identical activities. No cross-run memory, saved activity IDs, similarity checking or exclusion list exists. “Find three more ideas” sends the same age/photo without earlier replies and can repeat them. Age and visible toys are the entire personalization context; Indian-family context, interests, skills, outcomes and siblings are not supplied.

### Errors, retries and cost

Non-completed replies and invalid JSON/shape produce recoverable errors. Network failures/timeouts, 401, 429 and other provider errors have distinct messages. Some setup language exposes internal configuration concepts to parents. Non-provider orchestration failures are generally collapsed by the frontend into a connectivity message. Provider error metadata/message is logged on the server; whether messages can contain submitted content needs investigation.

There are no automatic AI retries or backoff; users retry manually. The global quota is 100 attempted provider requests per rolling hour, reserved atomically. Provider failures still consume quota; empty replies consume provider usage but refund free turns. There is no per-account/provider spending limit, token-usage recording, concurrency limit, deduplication or cache. Low detail/resolution and output cap reduce work but may reduce recognition accuracy or truncate activities. No monetary estimate is possible from this repository because actual provider usage/pricing is not recorded.

The 90-second fallback is longer than the fetch timeout, but an action may span additional mutations/parsing. Whether late completion can arrive after a reservation was refunded is an untested timing risk; cleanup behavior needs a targeted test, not an assumption.

## 8. Security and privacy observations

### Confirmed safeguards

- The provider key is read server-side; no key is passed to React or stored in application code by these paths.
- Payment confirmation, quota mutation, analytics reporting and reservation completion are internal functions, not browser-callable product endpoints.
- Authenticated access derives the current user from Convex Auth rather than a client-supplied user ID. Manual payment rejects unknown/ambiguous email matches.
- Atomic reservation mutations and tests protect against spending more than two concurrent guest turns or one bonus. Failure finalization is idempotent, meaning repeating it does not refund twice.
- Browser JPEG redraw minimizes image metadata and size. App analytics store request metadata, not photo bytes or activity content.
- AI text is rendered as React text; no raw HTML insertion was found in the UI.

### Confirmed limitations

- Guest identifiers are client-created bearer-like identifiers, not proof of identity. Clearing storage or generating new identifiers resets the trial; knowing another identifier permits looking up/using its trial allowance. No other guest content exists to expose, but attribution and allowance are spoofable.
- Paid users can issue unrestricted concurrent requests until the shared global limit; one caller can exhaust capacity for everyone. Invalid/empty/failing attempts can also grow analytics/access metadata without a per-caller bound.
- Email verification and recovery providers are not configured in app code. Password hashing/session behavior is delegated to Convex Auth; this audit did not inspect stored auth secrets or verify provider behavior live.
- Email, visitor identifier, usage times, account/payment dates and auth records persist. No user deletion/export interface, retention duration or app cleanup process for durable records was found. Temporary reservation cleanup is not a privacy retention policy.
- Child DOB, names, interests and profiles are not currently collected. Age is sent to OpenAI, and a parent can still upload a photo containing a child or home details despite “No faces needed” copy.
- `store: false` is a request setting, not proof that neither Convex nor the provider retains operational logs or processing data. Platform retention and provider agreements were not inspected.
- Owner/test exclusions contain a hardcoded owner email; avoid repeating that identity in shared audit copies. Tracking exclusion is not deletion.

### Unverified risks

Investigate authentication throttling, platform log retention, operational access permissions, account recovery, HTTP security headers/content policy, provider data handling and backup deletion. No account takeover, leaked secret, arbitrary public database access or unsafe generated activity was demonstrated during this audit. Absence of app-level safeguards does not prove that platform protections are absent.

Before adding child profiles or photo persistence, define minimum necessary data, parent control, authorization and deletion boundaries. Otherwise the proposed redesign would materially increase privacy exposure.

## 9. Technical debt

| Finding | Evidence and consequence |
| --- | --- |
| Product/state persistence gap | No toys/children/activities tables; restart persistence applies to account/access, not play experience |
| Weak AI semantic validation | Shape checks accept duplicate/unsafe/non-toy-specific content if strings are present |
| Screen/access coupling | Multiple effects and local screen state handle login, bonus, payment, expiry and generation; edge transitions need focused tests |
| Hidden async errors | Analytics identification silently ignores failure; logout lacks recovery; access-query failure has no dedicated UI |
| Contract duplication | Types, validators and prompt schema repeat independently; drift can turn valid-looking replies into runtime failures |
| Metrics overinterpretation | `photoRuns` starts before input/key/quota checks, so it counts access-approved attempts, not confirmed provider sends; success means recognized toys, not successful play |
| Report scaling | Production report pages reads but accumulates all rows in memory and repeatedly filters them for each day; growth increases runtime and memory |
| Test gaps | No successful mocked provider path, semantic safety/freshness, image-decoding unit checks, fallback timer races, recovery or deletion coverage |
| Browser-test false reassurance | Photo test accepts an AI error unless `REQUIRE_LIVE_AI=1`; a green result can prove error recovery rather than generation |
| Environment-sensitive testing | Browser helper writes test exclusions; payment test creates users/payment data. Default URL assumes a running app; no Playwright webServer launcher |
| CI/build proof gap | No CI workflow found; `npm test` excludes Playwright; TypeScript include excludes tests/scripts; full bundle not checked in audit |
| Visual/document drift | DESIGN.md plans much more than current surfaces; QR README still describes asset placement even though tracked asset exists |

Existing untracked `.agents/`, `.impeccable/review/`, QR copy and skills lock were present before audit and left untouched. Historical test screenshots/replies may contain private output and should not be casually committed. This is a hygiene risk, not a confirmed secret leak.

## 10. Prioritized recommendations

Recommendations are future work; none were implemented. Keep React, Vite and Convex. The repository does not justify a framework rewrite.

### P0 — Critical correctness, security, privacy or safety

1. **Add enforceable child-play safety checks and failure behavior.** Prompts alone do not prevent hazardous suggestions. Define explicit prohibited activities/materials, validate output, reject uncertain cases and test ages two and three with adversarial examples. No specific unsafe output has been observed here.
2. **Bound abuse of public AI access.** Add per-account/guest rate and concurrency controls alongside the global cap, validate before creating durable records where practical, and define a spend ceiling. The resettable browser trial is a confirmed limitation; actual abuse is unverified.
3. **Define and implement privacy/deletion controls before expanding stored child data.** Cover current account/email/payment/analytics records and future photos/profiles, including retention, provider disclosure and deletion behavior. Do not claim that `store: false` settles retention.

### P1 — Core product usability and reliability

1. Add a confirm/correct recognition step and use confirmed toy labels for activity generation; closer-photo retry does not satisfy correction.
2. Add the smallest owned toy/activity records needed for returning use, liked/used feedback and avoiding earlier activities. Authorize every read/write by the current account; explicitly define guest migration.
3. Enforce activity distinctness and category contracts, record previous suggestions and pass them into generation. Add successful/failed mocked provider tests and safety/freshness examples.
4. Keep earlier successful ideas while requesting more; add clear access-loading errors, logout recovery, retry distinctions and focus/scroll handling.
5. Verify actual phone camera/gallery behavior, HEIC/large-image handling, narrow signed-in navigation and all account/payment transitions. Separate read-only visual checks from database-changing tests.
6. Clarify manual-payment support, account recovery and renewal expectations; test expiry/fallback races and confirmation on the intended environment.
7. Build/test installation only after deciding what the PWA needs: manifest/icons, navigation, installation and explicit offline behavior. A theme-color tag alone does not deliver it.

### P2 — Design consistency and maintainability

1. Reconcile PRODUCT.md scope, DESIGN.md journeys and implemented payment access through an approved plan; this audit leaves existing documents unchanged.
2. Format source and extract focused photo/result/access-state responsibilities as they grow. Consolidate reply contracts and visitor validation.
3. Extend existing CSS variables into a small shared token set and reusable controls. Preserve the current visual direction until a redesign is approved; do not introduce a large component framework merely for this prototype.
4. Add repeatable build/local-test checks and clearly label browser tests that mutate data or require provider credit. Require live AI success explicitly when it is the acceptance criterion.
5. Separate request attempts from provider sends and activity outcomes in metrics; avoid exposing sensitive provider error text in logs. Make report aggregation scale incrementally.

### P3 — Future improvements

1. Build reminders only after last-used/acquired dates and toy status exist; confirm the two-month rule and donation eligibility first.
2. Add household reuse/donation flows incrementally on top of inventory rather than inventing parallel databases.
3. Consider caching, privacy-preserving model/latency/usage monitoring and provider/model evaluation after core safety and memory work.
4. Add broader playful chat, voice, discovery or WhatsApp only when their scope is explicitly approved; current absence is not a reason to expand this redesign automatically.

## 11. Open questions

1. Is the redesign targeting the full PRODUCT.md, the narrower current paid photo tool, or a specific first release between them?
2. Should signup remain mandatory after two successful runs, given PRODUCT.md’s login-free v1 language?
3. Does “gallery access” mean bulk library permission or selecting one photo? The code uses single-file selection only.
4. Should reminders exclude newer toys and require two months of inactivity? PRODUCT.md’s exception wording conflicts with its milestones.
5. Should guests retain activities across refresh, and which records should transfer to an account?
6. What minimum child information is necessary, and when should parents provide it after first value?
7. What retention/deletion rules apply to accounts, emails, analytics, provider processing and future toy photos?
8. What counts as a safe, useful, distinct activity, and who approves examples across ages two to eight?
9. What are the manual payment confirmation/support expectations, and is email verification/account recovery required before expanding payment use?
10. What phone/browser combinations must pass, and should the installed app work offline or only provide an installation shortcut?
11. Which deployed revision and prior proof artifacts match this checkout? README deployment claims need a separately authorized live verification pass.

The next planning step is to choose the release scope and convert the P0/P1 findings into a small sequence of changes with clear acceptance checks.
