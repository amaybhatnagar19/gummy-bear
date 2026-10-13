# Gummy Bear — UX_FLOWS.md
Status: Proposed complete V1 UX blueprint; implement incrementally.
Product source of truth: PRODUCT.md. DESIGN.md defines visual presentation.

## Experience boundaries
Public landing website explains value and links to the PWA. PWA delivers value without initial signup. Shared branding, distinct page priorities. Payment UI is temporarily hidden during redesign/testing, but backend access policy must be explicitly updated and tested; existing records/entitlements remain intact.

## Information architecture
Landing: Hero → How It Works → Product Example → Benefits → Rediscover → Privacy → CTA.
PWA primary navigation for signed-in users: Home / My Toys / Activities / Profile.
Contextual destinations: toy detail, add toy, activity detail, feedback, reuse/donation guidance, child profiles, reminders, privacy/data controls, auth.
Guest users should not face empty signed-in navigation before receiving first value.

## Guest first-value journey
1. Landing CTA opens PWA add-photo entry.
2. Take a photo or select specific photo(s); no unrestricted gallery permission.
3. Identify toy(s); label uncertainty and allow parent to confirm/correct; do not silently treat low-confidence identification as fact.
4. Ask child's approximate age before age-sensitive generation. Ask only necessary safety context.
5. Generate up to three differentiated cards (Quick Play, Creative Adventure, Play Together), with fewer if quality/safety require.
6. Parent opens instructions, saves/tries or requests meaningfully different ideas. Preserve current results on failed refresh.
7. Invite optional signup after value; declining does not hide results.
8. On signup, link eligible guest data securely, then offer child profile and optional inventory setup.

## Returning-user journey
Open Home (remember last child/group) → Find a Play Idea (new photo or stored toy) → confirm toy → choose activity → optionally report tried and feedback → history informs future results.
Alternative paths: My Toys → toy detail/status/edit → find ideas; Activities → saved/tried/favorites → revisit; Home/My Toys → rediscover suggestion → play/reuse guidance.

## Screen contract
- Landing: Get Started → guest PWA.
- Add First Toy: camera/limited picker, helpful error recovery.
- Recognition: edit labels and confirm uncertain toys before generating.
- Child Age: minimal age selection; group safety considers youngest child.
- Activity Suggestions: loading, up to three cards, alternative generation without discarding previous successful cards.
- Activity Details: instructions, time, materials, supervision, safety, save/try.
- Save Experience: optional signup invitation.
- Signup: Google or email OTP; preserve current access/account entitlements via deliberate migration.
- Child Profile: essential details after signup; optional extras later.
- Home: primary action, child/group selector, recent activities, contextual rediscovery.
- My Toys: progressive inventory, search/select/add, multiple-child assignment.
- Toy Details: correct toy metadata, parent-controlled status (In Use, Stored, Donated, Removed), age/suitability flags.
- Activities: suggested/saved/intent/tried/favorites kept distinct; deliberate revisit allowed.
- Feedback: Loved It / It Was Okay / Didn't Work; absence of feedback means unknown.
- Reuse/Donation: parent chooses; never donate unsafe/damaged or automatically change status.
- Profile & Settings: children, reminders and email opt-in, privacy/retention/deletion, account.
- PWA Install: contextual prompt after value; never block first use.

## Rules and edge cases
No nudges for toys known to have been acquired within two months. Upload date is not acquisition date. Never infer real-world disuse from app silence. Distinguish saved from tried, and intent from reported completion. No exact or cosmetic activity duplicates. Avoid unsafe ideas; youngest participant governs shared-play safety. Do not claim guaranteed results or actual toy use without parent confirmation. Preserve navigation state where practical; support Back and deep links on navigable screens.

## Critical acceptance scenarios
Guest gets a useful safe idea without login; uncertain toy corrected before generation; failed alternative keeps prior ideas; signup preserves eligible guest work without cross-account exposure; returning user sees saved toys/history; explicit status changes only; reminder respects age/consent; delete controls function; payment UI hidden without unintended backend lockout; existing entitlements survive auth migration.

## Implementation notes
Current repository reportedly uses React/Vite/Convex with a single root screen and email/password auth. These journeys are design targets, not claims of implementation. Test mobile camera, HEIC, 320px width, keyboard/screen reader, network errors, session expiry and real AI quality before release.
