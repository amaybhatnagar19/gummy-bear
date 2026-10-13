# Gummy Bear — DESIGN.md
Status: Proposed V1 redesign specification (approved direction: Friendly Premium with editorial influences; balanced illustrations and product UI).
Authority: PRODUCT.md governs product behavior. UX_FLOWS.md governs navigation. This document governs presentation. Existing implementation is not proof of completion.

## Design intent
A thoughtful parenting companion: playful enough to celebrate childhood, calm enough for busy parents, clear enough to earn trust. Parents are the primary interface users.

## Principles
1. Playful by nature, thoughtful by design: personality without clutter.
2. Speak like a helpful friend: plain, specific, nonjudgmental language.
3. Make the next action obvious: progressive disclosure and recoverable errors.
4. One consistent world: landing website and PWA share brand tokens; PWA prioritizes tasks.
5. Build trust through honest controls: no unverified promises about privacy, safety, outcomes, or adoption.

## Illustration decision — Option B (approved)
Balance product demonstrations with selective soft-3D illustrations. Landing hero may include a small distinctive Gummy Bear character alongside a real product-flow preview; show photo → recognized toy → sample activity. PWA uses illustrations sparingly for onboarding and empty states; inventory and activities use simple icons and useful content. Never invent customer statistics or depict decorative toy images as actual AI recognition results.

## Candidate design tokens — validate in browser before locking
- Background: #FAF8F5; surface: #FFFFFF
- Text: #292832; secondary text: #666471
- Brand: #65518F; soft brand surface: #F0EBF7
- Peach: #F7D8CB; mint: #D7E9DF; border: #E8E4E2
- Prefer Plus Jakarta Sans as a single primary font; test against existing Nunito before migrating.
- Spacing: 4px base scale; 8/12/16/24/32/48/64.
- Radius: controls 12px, cards 20px, hero panels 28px; avoid excessive rounding.
- Responsive: start mobile-first; check 320px through wide desktop; avoid horizontal overflow.
- Controls: minimum comfortable touch target around 44–48px; visible focus; meaningful disabled/loading states.
- Motion: result card may fade/translate gently ~250ms; honor prefers-reduced-motion.

## Landing website
Sections: hero, how it works, sample activity, benefits, rediscover toys, privacy/trust, final CTA, optional factual FAQ.
Hero headline candidate: “Their next favorite toy is already at home.”
Supporting text: “Discover fresh ways to play with toys your child already owns. Snap a photo and find practical, age-appropriate ideas.”
Primary CTA: “Find Play Ideas”; secondary: “See How It Works”.
CTA opens the guest-first PWA flow. Avoid unsupported testimonials, statistics, guaranteed engagement or unsupported retention claims.
Desktop hero: editorial text alongside product demonstration and modest illustration. Mobile: concise text, CTA, then demonstration.

## PWA
First-time flow emphasizes photo input, toy confirmation, age and useful results. Returning home emphasizes Find a Play Idea, child/group switch, recent activities, and contextual rediscovery. Bottom navigation proposal: Home, My Toys, Activities, Profile. Reuse Reminder lives contextually in Home/My Toys rather than as a fifth primary tab.
Activity cards show title, toy, approximate duration, materials, concise steps, parent involvement and relevant safety note; up to three genuinely distinct ideas, fewer if needed.
Prefer persistent previous results while requesting alternatives; show loading/error/empty/success states without losing work.
Use semantic headings, keyboard-friendly controls, clear errors, focus management, readable contrast and reduced motion. Test real devices and assistive technologies before claiming accessibility compliance.

## Design review policy
For each existing surface classify Keep / Refine / Redesign. No wholesale rewrite just to adopt a new aesthetic. Verify contrast, responsive layouts, touch, keyboard, focus and loading states using rendered pages.
