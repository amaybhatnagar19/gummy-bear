# DESIGN.md — Gummy Bear V1
**Status:** Complete design specification for review; visual concepts approved as direction, exact tokens require rendered QA. **14 October 2026.**
**Scope:** Public landing website + installable mobile-first PWA. **No application code has been changed.**
**Precedence:** `PRODUCT.md` defines behavior and constraints; `UX_FLOWS.md` defines journeys; this file defines design; `SCREEN_SPECS.md` defines per-screen presentation. Flag contradictions rather than silently resolving them.

## Brand thesis
**Friendly Premium with Editorial Warmth.** A thoughtful parenting companion, not a children's game or toy store. Product-first: approximately 70% real UI demonstration / 30% selective illustration. Character illustration may welcome users on the landing page, onboarding, and empty states, but must not distract from functional PWA tasks.

### Five permanent principles
1. Playful by nature, thoughtful by design — playfulness in examples, not control clutter.
2. Speak like a helpful friend — specific, short, nonjudgmental, never exaggerated.
3. Make the next action obvious — clear primary CTA and recoverable progress.
4. One consistent world — shared tokens across website/PWA, different information density.
5. Build trust through calm, honest design — no unsupported safety, privacy, or success promises.

## Design tokens (proposed baseline; verify contrast and mobile rendering)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#FAF8F5` | page background |
| `--surface` | `#FFFFFF` | cards, sheets |
| `--text` | `#292832` | headings and body |
| `--muted` | `#666471` | secondary copy |
| `--brand` | `#65518F` | primary interactive actions |
| `--brand-pressed` | `#49376F` | hover/pressed |
| `--brand-soft` | `#F0EBF7` | subtle highlights |
| `--peach` | `#F7D8CB` | illustration / category decoration |
| `--mint` | `#D7E9DF` | illustration / category decoration |
| `--border` | `#E8E4E2` | outlines |
| `--danger` | `#A12C40` | error text (verify contrast) |
| `--focus` | `#2F65C7` | focus indicator |
| `--shadow` | `0 10px 28px rgba(41,40,50,.06)` | rare elevated surfaces |

Typography: **Plus Jakarta Sans** preferred for headings and UI; fallback `system-ui, sans-serif`. Use 400/500/600/700, not 900 everywhere. If font loading adds latency, system font is acceptable. Type scale mobile: display 36/42, H1 30/38, H2 24/32, H3 20/28, body 16/25, small 14/21, micro 12/18. Desktop display clamp(44px, 4.6vw, 72px); body 16–18px. Do not use text below 12px for critical information.

Spacing scale 4/8/12/16/24/32/48/64/96 px. Card radius 20px, input/button 12px, section/hero panel 28px, pill 999px. Touch targets at least 44×44px; primary actions generally 48–52px high. Content width 1200px max; editorial text column 560px max; functional reading width 720px max. Desktop 12-column grid; tablet fluid; mobile one column with 16–20px gutters. Test 320, 375, 390, 768, 1024 and 1440px widths.

### Color and interaction rules
- Brand violet for primary actions only; secondary uses white with border, tertiary is text.
- Don't rely on category colors alone; always label categories.
- Error/success always includes words and an actionable next step.
- Sticky mobile bottom action only when it does not cover content or keyboard.
- Visible 2px focus ring, keyboard reachable controls, no hover-only information.
- Reduced motion disables nonessential movement. Result entry: fade + translateY(6px) 200–250ms max if motion permitted.
- Minimum body text contrast WCAG AA; validate exact combinations before implementation.

## Visual language
Use warm ivory, white cards, selective peach/mint/lavender highlights, restrained rounded corners, natural toy photography, and small soft-3D teddy/character illustrations. Avoid sticker overload, gradients behind paragraphs, fake handwritten annotations in the PWA, random emoji-as-icons, and decorative testimonials. Use consistent outline icon family at 20–24px; SVGs have accessible names where interactive.

## Responsive layout
Landing: desktop split hero with text left and actual product demo right; mobile headline → CTA → trust microcopy → demo. PWA: centered functional column; desktop may use supporting context but primary workflow remains dominant. Signed-in mobile uses four-item bottom navigation (Home, My Toys, Activities, Profile), safe-area padding, clear active state; desktop can use header/side navigation.

## Component inventory
| Component | Variants / behavior |
|---|---|
| BrandHeader | public nav vs app nav; CTA on public |
| Button | primary, secondary, text, destructive; busy, disabled |
| PhotoPicker | camera, limited photo selection, preview, remove, retry |
| RecognitionTile | confirmed, uncertain, editing; per-toy label |
| AgeSelector | 2–8, accessible labels; group selection when signed in |
| ActivityCard | category, duration, materials, parent role, steps preview, save/try |
| ActivityDetail | full steps, safety notes, report tried, alternative |
| ToyTile | photo/icon, name, child assignment, status |
| StatusControl | explicit parent confirmation; never auto-update |
| ReminderCard | possibility wording, dismiss/snooze/turn off |
| EmptyState | helpful next action, minimal illustration |
| InlineNotice | info, warning, error, success; no blocking toast for critical errors |
| Dialog/Sheet | destructive confirmation, feedback, small edits |
| Navigation | URL-backed routes, Back behavior, focus restoration |
| InstallPrompt | contextual, dismissible, nonblocking |

## Content rules
Write for a busy parent. Lead with action and benefit. No “guaranteed safe,” “we know your child hasn't played,” “photos never leave your device,” or “your photos stay private” without verified implementation. Don't invent customer testimonials or statistics. Use “may” and “based on what you've shared” where uncertainty matters. Avoid claims of developmental outcomes.

## Landing website (D1)
Sections: (1) nav, (2) outcome hero + real 3-step product demonstration, (3) How it works: photo → confirm → play, (4) sample useful activity, (5) benefits without unsupported statistics, (6) rediscover older toys, (7) privacy and parent control, (8) FAQ with truthful answers, (9) final CTA/footer.
Hero headline: **Their next favorite toy is already at home.**
Subtext: **Discover fresh ways to play with the toys your child already owns. Snap a photo, check what we found, and get practical ideas for their age.**
Primary: **Find Play Ideas**. Secondary: **See How It Works**.
Microcopy: **No download needed to try it.**
No fake testimonial from prior visual concept; avoid “safe, happier childhood” as a promise.

## PWA experience (D2–D4)
First use: photo → editable recognition → minimal age → generation state → 1–3 activity cards → detail/try → optional save-account invitation. Guest age must not require a child profile. On return: Home primary CTA, child/group switch, recent activities, contextual rediscovery; inventory and history become useful only after signup.
Inventory: progressive, one toy or shelf/multiple items, explicit correction and duplicate confirmation; statuses In Use / Stored / Donated / Removed, outgrown separately.
Reuse: only possibly overlooked toys based on app signals; never infer offline disuse. No nudges for toys known acquired under 2 months. Email opt-in separate from phone/WhatsApp consent.
Settings: children, reminder frequency, privacy/retention, account/data deletion. Payment UI hidden only in approved isolated testing environment; never change production entitlements as a visual task.

## Asset and illustration specification
Character: friendly small bear with simple rounded silhouette, matte 3D/clay texture, neutral expression, lilac accessory. Use consistently, not as a floating mascot on every screen. Toy photography: natural soft daylight, uncluttered, no identifiable child faces or home details in mock content. Product demos must label examples as illustrative until they are real captures. Export responsive image variants, use alt text for informative assets, hide decorative assets from assistive tech.

## QA gates before design signoff
Desktop and mobile screenshots for every key route; functional states (empty/loading/error/success); real-text overflow; 200% zoom; touch/keyboard/focus; color contrast; reduced motion; iOS/Android camera; narrow headers; screen-reader order; no fake proof; verified copy against implemented privacy policy. See `DESIGN_HANDOFF.md` for checklist.
