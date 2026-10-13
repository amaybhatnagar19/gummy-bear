# AGENTS.md — Gummy Bear
Status: Proposed repository-level instructions for Codex. Review against the live repository before adoption.
Last drafted: 2026-10-14

## Mission and scope
Build Gummy Bear, a parent-facing, mobile-first PWA that helps families with children aged 2–8 discover safe, specific ways to play with existing toys. The two V1 modes are Companion Mode and Reuse Reminder. The public landing site explains the product; the PWA delivers it.

**Source-of-truth order:** `PRODUCT.md` for behavior and V1 boundaries; approved `UX_FLOWS.md` for flows; approved `DESIGN.md` for visual/interaction standards; `IMPLEMENTATION_PLAN.md` for sequencing. Existing code and tests describe *current* behavior, not automatically intended behavior. When these conflict, report the conflict and seek approval; do not silently reinterpret or edit `PRODUCT.md`. `IDEA_SCOPE.md` is background, not permission to expand V1.

## Repository baseline (from 2026-10-14 audit; verify before editing)
- React + TypeScript + Vite frontend (`src/main.tsx`, `src/style.css`, `src/photo.ts`, `src/AccessPanel.tsx`).
- Convex database/functions/auth/HTTP/static hosting (`convex/`).
- OpenAI Responses API invoked server-side (`convex/play.ts`, `convex/rules.ts`).
- Tests: Node tests, Vitest/convex-test, Playwright (some browser tests mutate data and call paid services).
- Existing email/password auth and manual ₹99/month payment/trial backend.
- No established PWA manifest/service worker, inventory/child/activity persistence, or separate landing site as of audit.
- Model identifiers and package versions must be verified in the actual checkout; do not hardcode presumed provider availability.

## How to work
1. Before implementation, inspect relevant files and explain: observed current behavior, target behavior, files to change, data migration implications, risk, and tests.
2. Prefer small reversible commits; preserve working functionality and existing entitlements. Avoid framework swaps, large UI kits, or autonomous-agent frameworks without measured need and approval.
3. Do not modify `PRODUCT.md` unless the owner explicitly asks. Do not overwrite historical `DESIGN.md` without explicit approval. Keep documentation aligned with implemented behavior and label proposals clearly.
4. Never read out or print secrets. Never commit `.env*`, provider keys, production data, private photos, or historical browser artifacts. No production mutations, payment changes, account migration, deployment, or paid live-AI tests without explicit owner authorization.
5. For each change, include tests and report **commands actually run** and outcomes. Never claim browser/device, accessibility, security, live-provider or production verification based only on source inspection.
6. Stop and ask before irreversible database migrations, auth identity remapping, deleting existing records, relaxing access control, or changing billing semantics.

## Architecture boundaries
- Keep React/Vite/Convex unless a concrete limitation is demonstrated.
- Organize UI by route/feature as complexity grows; avoid growing a single giant `main.tsx`.
- Convex queries/mutations/actions must validate inputs, authorize records from server-derived identity, and enforce ownership on every family-specific read/write.
- Treat guest visitor IDs as untrusted and spoofable; they are not identity. Rate-limit and bound concurrent AI requests and spend independently of the shared quota.
- Keep OpenAI credentials and provider requests server-side. Use schema-validated request/response contracts shared where practical; no raw HTML rendering of model output.
- Separate photo recognition/confirmation from activity generation logically, even if optimized later. Do not send unconfirmed low-confidence labels as facts.
- Persist distinct records for children, toys, generated activities, feedback, consent/reminder preferences and account linkage as needed; design authorization and deletion before collecting additional personal data.
- Keep acquisition date, upload date, last app interaction, parent-confirmed play, and reminder timestamp distinct.

## Non-negotiable product rules
- Guest receives first useful value before signup; signup prompt does not hide an already-generated result.
- Camera or limited photo picker only; no unrestricted gallery permission. Minimize unrelated family information. Original-photo retention off by default where practical; explicit controls and transparent deletion/retention policy.
- Toy recognition must distinguish plush/figurines from real animals, flag uncertainty and permit corrections; never invent details not visible.
- Generate **up to three** useful, differentiated, age-appropriate activities, not exactly three regardless of quality. Initial categories: Quick Play, Creative Adventure, Play Together. Each includes duration, materials, steps, parent role/supervision, and safety notes where relevant.
- Enforce safety beyond prompt text. Reject dangerous suggestions (e.g., choking hazards, magnets, button batteries, suffocation, chemicals, unsafe heights, electricity, sharp/damaged toys). Youngest participant's safety governs shared activities. If safe quality is insufficient, show fewer ideas or a helpful limitation message.
- Avoid exact and cosmetic duplicates across history. Keep Suggested, Saved, Intends to Try, Parent Reports Tried, Loved It, It Was Okay, Didn't Work, Favorite Revisited distinct. A click is not proof of play.
- Preserve prior useful results while requesting alternatives or recovering from errors.
- Toy statuses are parent-controlled: In Use, Stored, Donated, Removed. Never silently alter ownership/status; outgrown is separate. Do not recommend donated/removed toys as owned.
- Reuse nudges must not target toys **known** to have been acquired under two months ago; upload date is not acquisition date. Do not claim a child has not played with a toy offline. Email reminders require opt-in; parent controls cadence. No donation recommendations for unsafe/damaged toys.
- V1 excludes broad parenting chat, toy shopping/discovery, WhatsApp chat, native apps, browser push and donation marketplace.

## Payments and authentication: transition rules
- Preserve current payment schema, ledger/events, historical access records and existing paid entitlements.
- During redesign/testing **hide payment UI**, but do not assume hiding the UI disables backend gating. Implement a deliberate, environment-scoped testing-access policy with bounded abuse controls and tests; do not silently grant unrestricted paid access in production.
- After testing, restore the existing ₹99/month model with redesigned presentation, subject to explicit owner approval and verified billing/access behavior.
- Target auth: Google Sign-In + email OTP, no password requirement for new users. Existing password accounts must remain accessible during migration until an approved identity-linking/recovery strategy is verified. Never assume same email means safe automatic account merging. Preserve access and payments; test duplicate-email and failed-link cases.
- Phone collection is optional; WhatsApp opt-in is separate and does not authorize messages in V1.

## Design implementation
- Approved direction: **Friendly Premium with editorial influences**, illustration option **B** (selective soft-3D character/illustrations plus real product previews).
- Landing site: expressive, credible, fast, benefit-led; never fabricate testimonials/statistics. PWA: calm, task-first, accessible.
- Use shared design tokens, semantic components, responsive layouts, visible focus, keyboard/focus management, readable contrast, reduced motion, and clear loading/empty/error states.
- Follow the *approved* `DESIGN.md` and `UX_FLOWS.md`; candidate colors/fonts in a proposed document are not final until visual review.
- Make navigation and browser Back predictable; do not reload and discard work unnecessarily. Test narrow mobile layouts.

## Minimum verification expectations
- Run typecheck, relevant unit/integration tests, and production build after each meaningful code change.
- Add deterministic mocked-provider success, error, safety, duplicate and fallback tests; never rely on live AI for the default test suite.
- Test auth/account-linking and access transitions without touching production; test authorization across two unrelated accounts.
- Test photo decode failure, oversized/unsupported formats, retry preservation, recognition correction, and group safety.
- Test reminders against known-new toys, unknown acquisition dates, opt-in, and parent status controls.
- Label browser tests that mutate Convex data or spend provider credits. Run only against an explicitly authorized isolated environment.
- Before release, perform manual checks on actual phones, keyboard/screen reader, 320px widths, camera/photo picker, installation, and real AI output. Report unverified items plainly.

## Definition of done
The intended behavior is demonstrated; product guardrails are enforced in code where feasible; relevant automated tests pass; security/privacy implications are reviewed; visual states are checked; documentation reflects what actually shipped; and the handoff lists changed files, commands run, remaining risks and any manual owner actions.
