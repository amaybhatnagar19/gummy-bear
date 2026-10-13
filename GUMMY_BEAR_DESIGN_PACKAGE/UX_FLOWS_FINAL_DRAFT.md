# UX_FLOWS.md — Gummy Bear V1
**Status:** Complete design blueprint, not an assertion that code exists.
**Source:** `PRODUCT.md`; implementation in stages. The public site and PWA share visual identity.

## Route architecture (proposed; adapt to existing router)
Public: `/` (landing), `/privacy` (policy), `/faq` (optional anchors instead).
Guest PWA: `/app/start`, `/app/recognize`, `/app/age`, `/app/ideas`, `/app/activities/:id`.
Signed-in PWA: `/app/home`, `/app/toys`, `/app/toys/:id`, `/app/activities`, `/app/children`, `/app/settings`, `/app/settings/reminders`, `/app/settings/privacy`.
Auth: `/app/sign-in`, `/app/verify-email` (exact paths may vary). Route protection preserves pending guest result. Do not deep-link to an invalid temporary state without recovery.

## Journey A: first value (guest)
1. Public Get Started → PWA start (or direct PWA start).
2. Photo: camera or limited picker, preview/remove; one photo is current implementation, multiple/shelf photos future V1.
3. Recognition: display likely toy names, uncertainty, edit/confirm; don't silently confirm uncertain objects.
4. Age: ask approximate age 2–8; no profile/name/interests required; youngest age if group safety context.
5. Generation: progress with honest, non-fabricated status text; can cancel/return.
6. Ideas: up to three distinct category cards; show fewer if quality/safety inadequate; zero state explains limitation and safe retry.
7. Detail: materials, duration, numbered steps, parent role and safety; choose try/save/another.
8. Post-value invitation: save your ideas by signing in; “Not now” retains visible guest result for this session. Anonymous cross-session persistence not guaranteed.
9. Signup → securely link eligible guest records; optional child profile and toy inventory setup. No repeated upload.

## Journey B: returning family
Signed-in valid session → Home → select child/group (remember last choice) → new photo or stored toy → confirm → activities → detail → optional report tried and feedback → history.
Home shows last activity and contextual reminders only when data supports them. If no toys, use a helpful empty state, not fabricated inventory.

## Journey C: My Toys
My Toys → add single or multiple/shelf photo → review recognized toys → confirm/correct duplicates and assignments → toy detail → find play ideas / explicitly edit status. “Outgrown” is suitability, not ownership. Donated/Removed excluded from normal suggestions until parent restores.

## Journey D: Activities
Suggested / Saved / Intends to Try / Parent Reports Tried / Favorites (present as useful filters, not necessarily five tabs). Open detail, intentionally replay favorite, or request meaningfully different activity. Feedback: Loved It / It Was Okay / Didn't Work; no response means unknown. “Try” intent does not equal tried.

## Journey E: Reuse Reminder
Parent opens contextual rediscovery card or manual Organize/Reuse → select toy(s) → choose fresh play idea, Reuse at Home, or Explore Donation. Ask condition and sibling/sentimental considerations where relevant. No unsafe/damaged donation advice. In-app reminders and separately opted-in email, frequency and disable controls. Known acquired <2 months: no nudge. Unknown acquisition date: don't assert old/unused.

## Journey F: auth and account
Google Sign-In or email OTP after first value. Legacy password accounts preserved during separately approved migration. Failure: keep guest result, show recovery, never attach another family's data. Settings supports child management, optional phone number, separate future WhatsApp opt-in, photo retention and deletion. Payment UI is hidden only in isolated test build with separately authorized access policy; production payments untouched.

## Screen-level navigation conventions
Back returns to previous meaningful step with work preserved where safe. Browser Back and URL reflect navigation; photo upload is never silently lost on tab changes. Show clear exit confirmation if an unsaved photo would be lost. Loading cannot block escape indefinitely. Retry preserves prior valid activities. Empty and error states always offer a next step. Do not use modal for full activity reading.

## Decision points
- Recognition uncertain → edit / skip uncertain toy / retake.
- AI output 0 → explain limitation, adjust photo/age, retry; 1–2 → display available ideas, don't pad.
- Auth skipped → continue using visible result; cross-session history not promised.
- Similar toy detected → parent confirms merge/keep separate.
- Status suggestion → explicit parent confirmation.
- Reminder dismissed → suppress repeated nags; honor opt-out.
- Offline → show connection requirement for generation; no invented offline AI capability.

## Instrumentation alignment
Events should distinguish photo submitted, recognition corrected, first value viewed, activity saved, intent to try, parent reported tried, feedback, reminder shown/clicked, signup, guest data linked and deletion. Never log child names, DOB, or raw photos as analytics properties.

## Acceptance walkthroughs
A. Guest: photo, wrong toy corrected, age selected, one useful card, signup declined, result remains.
B. AI: two safe cards plus one rejected → two displayed; zero safe → recoverable limitation; timeout preserves earlier ideas.
C. Returning: child switch, inventory toy selected, history excludes cosmetic duplicate, parent deliberately revisits favorite.
D. Family privacy: account A cannot access B; guest linking cannot cross accounts; delete and retention controls work.
E. Reminder: known-new toy excluded; no false claim of offline inactivity; opt-in email only.
F. Accessibility: phone 320px, keyboard, screen reader, focus after navigation, reduced motion.
