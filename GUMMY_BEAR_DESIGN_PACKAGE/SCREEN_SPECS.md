# SCREEN_SPECS.md — Gummy Bear V1
**Status:** Complete screen-by-screen design specification; visual approval still required for implementation.
**Legend:** P = primary action; S = secondary action. A “screen” may be a route, inline state, or sheet.

| ID | Screen / state | Primary action | Layout and key information | Essential edge cases |
|---|---|---|---|---|
| L01 | Public landing | Find Play Ideas | Header, editorial hero, real demo, three steps, example activity, benefits, reuse, privacy, FAQ, CTA | Mobile hero; no invented proof; CTA links to PWA |
| G01 | Guest add toy | Take a photo | Simple welcome, photo picker, secondary Choose Photo, concise privacy note | invalid format, large file, HEIC unsupported, camera denied, no photo |
| G02 | Recognize & confirm | Confirm toys | Photo thumbnail, editable toy chips/cards, confidence/uncertainty, correction control | no toy, multiple toys, blurred photo, wrong category, non-toy |
| G03 | Child age | Continue | Age 2–8 selector, no name/profile requirement, optional existing child switch | missing age, shared play youngest child |
| G04 | Generating | Wait / cancel | Progress indicator, neutral status, photo/age summary | slow, offline, timeout, cancellation, no false “checked safety” claim |
| G05 | Activity suggestions | Choose an activity | 1–3 differentiated cards with category, time, materials, short summary | 0/1/2 ideas, repetition, retry failure preserves prior result |
| G06 | Activity details | Try this activity | Full numbered steps, materials, duration, parent role, relevant safety note | long content, missing materials, unavailable toy, save while guest |
| G07 | Save invitation | Save my ideas | Optional signup prompt after first value, Not now | dismissal retains result, auth failure, guest linking |
| A01 | Sign in | Continue with Google | Google button + email OTP, clear existing-user recovery | invalid OTP, expired OTP, existing password account migration |
| A02 | Verify email | Verify & continue | Six-digit code or accessible text field, resend timer | rate limit, resend, wrong account, network failure |
| O01 | Child profile | Save child | Name/label, DOB or age, interests optional, gender optional | skip optional fields, privacy, sibling additions |
| O02 | Optional inventory setup | Add toys | Add single/shelf, skip for now | duplicate suggestions, partial recognition |
| H01 | Home | Find a Play Idea | Child/group selector, primary CTA, recent activity, contextual rediscovery | no children/toys/history, signed-out state |
| T01 | My Toys | Add a toy | Search/filter, inventory cards, status indicators, multi-child tags | empty, many toys, duplicates, deleted items |
| T02 | Toy details | Find play ideas | Toy name/photo, assignments, outgrown flag, explicit status editor | Donated/Removed, missing acquisition date, damaged |
| T03 | Add / edit toy | Save toy | Camera/limited picker, recognition, editable metadata | duplicate merge confirmation, bulk/shelf handling |
| A03 | Activities | Open activity | Suggested, Saved, Tried, Favorites filters; accurate statuses | no saved activities, deliberate favorite revisit |
| A04 | Activity feedback | Submit feedback | Loved It / It Was Okay / Didn't Work; optional reason | dismiss, never infer attempted play from view |
| R01 | Rediscover | Explore play ideas | Possibly overlooked toy, evidence-neutral copy, dismiss | known <2 months excluded; unknown acquisition |
| R02 | Reuse or donate | Choose option | Reuse at Home vs Explore Donation; condition/sibling/sentimental context | unsafe/damaged toys; no marketplace |
| S01 | Profile/settings | Manage children | Children, reminders, privacy, account, optional phone | legacy auth migration, missing profile |
| S02 | Reminder settings | Save preferences | In-app frequency, email opt-in and cadence, disable | no permission, unsubscribe, opt-out |
| S03 | Privacy & data | Manage my data | Photo retention choices, deletion/export if implemented, policy | confirm destructive actions, pending deletion |
| S04 | Install PWA prompt | Install / dismiss | Contextual after value, OS-specific instructions where possible | unsupported browser, dismissed prompt, offline |
| X01 | Global offline/error | Retry | Clear message, preserve work, Back | session expiry, unavailable AI, permission denied |
| X02 | Payment (post-test only) | Review access | Redesigned existing ₹99/month flow after approval | no production bypass; pending manual confirmation |

## Detailed component patterns

### Photo upload
- Primary camera action and secondary limited picker; neither requests entire photo library.
- Show selected thumbnail and “Change photo” / “Remove”; image processing states separate from provider processing.
- Use native picker affordances; never imply direct camera access on unsupported browsers.

### Recognition
- “We think this is a teddy bear” is a guess, not a fact. Show “Correct” and “Edit name”.
- Multi-toy recognition: list individually, uncertain items flagged, parent can omit uncertain items.
- Correction must be reflected in downstream generation; no silent auto-merge.

### Activity cards
- Top row: category chip + estimated minutes; title and toy(s); 1–2-line outcome; materials preview; parent involvement; action.
- Full details: materials list, 3–5 concise steps when practical, supervision note, optional safety callout.
- Avoid child-development promises. Don't show unsupported “100% safe” badge.
- Preserve existing successful results when “Try something different” fails.

### Home
- Greeting without intrusive name usage; child switch accessible in header.
- One dominant Find a Play Idea CTA; secondary My Toys and Saved Activities.
- Reuse suggestion is conditional on actual inventory signals, not a permanent fake card.

### Settings
- Use sections with short labels and clear consequences.
- Account deletion confirmation requires explicit action and accurate description of retention exceptions.
- Phone number is optional; WhatsApp opt-in is separate and deferred from actual messaging.

## Empty/loading/error/success copy rules
See `CONTENT_COPY.md`. Never show success until the relevant mutation is confirmed. Never label “Saved” as “Tried.”
