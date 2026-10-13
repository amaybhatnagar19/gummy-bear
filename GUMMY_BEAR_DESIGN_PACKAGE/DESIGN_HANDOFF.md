# DESIGN_HANDOFF.md — Gummy Bear V1
**Status:** Design work package complete for implementation planning; visual QA and owner approval remain.
**Deliverables:** `DESIGN_FINAL_DRAFT.md`, `UX_FLOWS_FINAL_DRAFT.md`, `SCREEN_SPECS.md`, `CONTENT_COPY.md`, `DESIGN_HANDOFF.md`, `GUMMY_BEAR_DESIGN_PREVIEW.html`.
**Historical files:** Do not overwrite `PRODUCT.md` or existing `DESIGN.md` without explicit owner approval.

## Design decisions captured
- Landing V2 is the visual baseline, **not pixel-perfect final approval**.
- Friendly Premium + editorial warmth; balanced soft-3D illustration and product UI.
- Parents are primary users; clear, calm PWA; richer landing storytelling.
- Four signed-in destinations: Home / My Toys / Activities / Profile.
- Guest value before signup; age-only minimum before AI generation.
- Up to 3 differentiated ideas; fewer if quality/safety require.
- Reuse Reminder contextual; no false claims about offline toy usage.
- Payment UI hidden only in explicitly approved isolated testing environment; production payments preserved.
- Google/email OTP is target, but existing accounts require approved migration.

## Suggested build order for Codex (design track)
1. **Read-only review:** Compare existing UI against these specs and identify design tokens/component reuse, route implications and mismatches. No code changes.
2. **D1 landing shell:** Header, hero, truthful product demo, How It Works, benefits, reuse, privacy, CTA, responsive layouts.
3. **D2 guest flow:** Upload → recognition correction → age → loading → activity cards/detail → optional signup. Preserve previous results on retries.
4. **D3 signed-in shell:** Home, child/group switch, My Toys, Activities and empty states, using actual data only.
5. **D4 supporting screens:** Toy detail/status, reuse/donation, feedback, child profiles, settings/reminders/privacy.
6. **D5 polish:** PWA install prompts, responsiveness, focus management, error/empty/loading, accessibility audit.
Coordinate with engineering M1–M5; do not ship UI promising unfinished backend functionality.

## Acceptance criteria per screen
- Clear heading and primary action, functional Back and correct focus target.
- No invented toy/history/child data shown as real.
- Mobile 320px–390px usable; touch targets at least 44px; text readable at 200% zoom.
- All loading, empty, success and error states designed and tested.
- Activity card includes time, materials, instructions, adult role and safety note where relevant.
- All personal data access and deletion affordances reflect working backend.
- Accurate guest/sign-in transition and privacy copy.
- Browser navigation does not silently discard photo or previous successful ideas.

## Assets and design QA
- Logo and mascot should be delivered as approved assets; generated concept images are visual references, **not production screenshots or proof**.
- Use licensed/owned toy photos; do not embed the example “testimonial” from visual mockups.
- Check font loading and fallbacks, WCAG AA contrast, keyboard and screen reader, reduced motion, camera/picker behavior, unsupported formats, and PWA install on real phones.
- Confirm token palette after rendered QA; candidate values are not automatically final.
- Never copy private test artifacts or secrets into screenshots.

## Outstanding owner approvals
1. Final color/typography after browser comparison.
2. Mobile and desktop layout review for landing and PWA.
3. Final mascot/logo asset and rights.
4. Privacy/retention wording after policy implementation.
5. Payment presentation only after testing and separate approval.
6. Supported devices/browsers and PWA offline behavior.
These do not prevent using this package for implementation planning.

## Copy-paste Codex design prompt
“Read PRODUCT.md, AGENTS.md, DESIGN_FINAL_DRAFT.md, UX_FLOWS_FINAL_DRAFT.md, SCREEN_SPECS.md, CONTENT_COPY.md and DESIGN_HANDOFF.md. Treat the supplied HTML as a static design reference, not an app implementation. Audit existing React/Vite/Convex UI and propose an incremental D1–D5 implementation plan with exact files, responsive acceptance criteria, accessibility checks, dependencies on M1–M5, and rollback. Preserve PRODUCT.md, auth/payment behavior and existing accounts. Do not implement, deploy, change schemas, or modify production without separate approval.”
