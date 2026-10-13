# Gummy Bear

The public landing is at `/`. The existing application is at `/app` (also `/app/`). Take or choose one toy photo, choose an age (2–8), and get toy names and up to three play ideas. The original application flow and access rules are preserved. Saved toy collections, child profiles, recognition correction and reminders are planned; landing demonstrations are labeled illustrative.

## Free turns and payment access

Each browser gets two successful free runs. Its random visitor ID stays in local storage and its count lives in Convex. Failed or empty replies do not consume a turn. A browser can reset this guest allowance by clearing its data; this is a simple browser-based trial, not proof of a person's identity.

After two turns, create an email/password account (minimum eight password characters; no email verification). The payment screen appears immediately. Each account may choose **Use free one last time** once. After that, ideas are blocked until the owner confirms payment. Logging out or back in does not reset the account bonus.

`users.paidFrom` and `users.paidUntil` are optional timestamp fields, so older user records remain valid. Dates use UTC and one calendar month, clamped at month end (January 31 → February 28/29). Confirming another payment starts a fresh month from the moment you confirm it. At expiry, paid access is blocked, even if the account never used its free bonus. The existing global limit of 100 AI calls per rolling hour still applies.

There was no stored visitor count or toy history before this change, so existing visitors start with two free turns. The existing AI quota is preserved. Old cached pages need a refresh to send a visitor ID; the `play:discover` endpoint remains in place and all existing reply fields are preserved. The OpenAI request body and `OPENAI_API_KEY` are unchanged.

## Your UPI QR image

Put your real PNG image at:

`/Users/amaybhatnagar/build-sprint-app/public/payments/upi-qr.png`

The payment page displays **₹99 a month** and serves that image at `/payments/upi-qr.png`. Until the image is supplied, it shows an honest missing-QR message; no fake payment details are used. Adding the image requires another frontend build/deployment.

## Confirm a payment in the Convex dashboard

1. Open https://dashboard.convex.dev/t/amay-bhatnagar/build-sprint-app.
2. Select **Development / intent-poodle-393** for the local app. After publishing this change, select **Production / sensible-avocet-370** for live parents.
3. Open **Functions** and select **access:markPaid** (an internal mutation).
4. Click **Run Function**. Enter `{"email":"parent@example.com"}`, replacing the email with the parent's signup email. Leave **Act as a user** off.
5. Click **Run** after checking the actual payment. The reply includes `email`, `paidFrom`, and `paidUntil`.
6. The signed-in parent's page unlocks automatically. After expiry, repeat these steps for their next confirmed payment.

Internal functions can be run by the dashboard owner but cannot be called by the parent's browser. A missing or ambiguous account produces an error without updating anyone. Email is trimmed and normalized to lowercase. Always check the payment and exact email before running the mutation.

Owner CLI equivalent: `npx convex run access:markPaid '{"email":"parent@example.com"}'` (development), or add `--prod` for production after deployment.

## Convex Auth setup

The development deployment has been configured and tested with real signup/login. Passwords are hashed by Convex Auth; no passwords are stored in the users table. `scripts/setup-auth.mjs` creates only missing `JWT_PRIVATE_KEY` and `JWKS`, keeps existing signing keys, never prints key values, and does not touch OpenAI configuration.

Before publishing auth to production, run `node scripts/setup-auth.mjs --prod`, then `npm run deploy`. Auth HTTP routes keep their standard root paths alongside Convex static hosting. Do not rotate existing auth keys unless you intend to invalidate existing sessions.

## Run locally

```sh
npm install
npx convex dev
```

In a second Terminal in this folder:

```sh
npm run dev
```

Open http://127.0.0.1:5173.

## Set the API key yourself

Run this in zsh in your Terminal. Do not paste a key into chat, source code, or `.env.local`.

```zsh
cd /Users/amaybhatnagar/build-sprint-app
read -rs "gummy_key?OpenAI API key: "; printf '\n'
npx convex env set OPENAI_API_KEY "$gummy_key"
unset gummy_key
```

The variable belongs to the selected Convex development deployment. Before production deployment, set it separately with `npx convex env set --prod OPENAI_API_KEY "$gummy_key"` using the same hidden prompt.

## Check

```sh
npm test
npm run build
npx playwright test
```

The browser tests use an actual public-domain teddy-bear photograph. They verify the original photo flow plus two guest runs, signup, the one-time bonus, a manual **test** payment on development, wrong-password recovery and returning login. Backend tests cover the exact expiry boundary, month-end dates, refunds, concurrent access and old records. The browser test leaves clearly named `paywall-test-…@example.com` accounts in development; no real customer payments are marked. Require successful live AI proof with:

```sh
REQUIRE_LIVE_AI=1 npx playwright test
```

Successful replies are saved verbatim to `.impeccable/review/raw-ai-output.txt`. Raw action replies and screenshots are in the same review directory. Phone camera access must also be checked on a real phone; desktop browser automation verifies the camera-input configuration only.

## Cost and privacy controls

- Only `convex/play.ts` calls OpenAI. The browser has no API key.
- `gpt-6-luna`, low reasoning, low image detail, at most 500 output tokens including reasoning, no automatic retries, 60-second provider timeout.
- The browser redraws one photo to JPEG, removes metadata, limits its longest edge to 768 pixels and its encoded length to 350,000 characters before sending.
- An internal, atomic Convex mutation reserves each call against a global rolling-hour quota. The 101st call is blocked, including concurrent requests. Failed provider calls still consume a reservation.
- Convex saves access/account records and photo-run metadata (time, existing anonymous browser ID, authenticated email when present, and success/completion flags). Photos and play replies are never written to app storage. The OpenAI request still uses `store: false`; provider processing rules apply.
- Bad input, missing configuration, timeout, rate limit, unclear toys and incomplete output produce recoverable messages. No result is invented when the provider fails.

## Hosting

Convex static hosting is configured. Deploy with:

```sh
npm run deploy
```

This builds and publishes to the production `.convex.site` address. A Git push does not deploy the app.

Live page: https://sensible-avocet-370.convex.site

Production has its own OpenAI key and Convex Auth signing keys, configured in Convex. The paywall/auth change and the owner's UPI QR image are now published. The real-photo flow, production signup, returning login, and QR display are checked on the live site. Manual payment/expiry rules are covered by development tests; no production test payment was marked.

Check the deployed page with a real toy photo:

```sh
GUMMY_TEST_URL=https://sensible-avocet-370.convex.site REQUIRE_LIVE_AI=1 npx playwright test
```

Live proof files are saved separately under `.impeccable/review/live/`.

## Production daily report

Run this one command in Terminal:

```sh
cd ~/build-sprint-app && node --experimental-strip-types scripts/production-report.mjs
```

The script hardcodes production (`--prod`), reads internal queries in bounded pages, and prints JSON only. It does not submit photos, change payment access or modify data. Days are in IST (Asia/Kolkata). Photo runs count requests allowed past the access check, including failures; rejected paywall clicks are not photo runs. Unique visitors count distinct browser IDs with an allowed request. Signups use account creation dates. Paid users count distinct emails with a payment confirmed that day; new confirmations have their own durable events, while older records supply only their latest known payment date.

Reports exclude `amay.bhatnagar@gmail.com`, email addresses on example.com/org/net, test prefixes deploy-test-/paywall-test-/codex-test-/test-/test+, and browser IDs marked as tests. Automated tests label their browser before submitting a photo. Owner/test sign-in links that same browser to the exclusion, so its earlier recorded guest runs are also excluded. An anonymous human test in a separate browser cannot be recognized automatically: mark its ID with the internal `analytics:markTestVisitor` mutation. Legitimate anonymous users are not excluded merely because they are anonymous.

The recording start is printed in the report. Earlier days show `null` for photo metrics; the start day is explicitly partial. Older photo runs cannot be reconstructed and are not fabricated. Current-day figures cover only the report time. Pending runs remain distinguishable from successful/failed runs; interrupted runs are marked failed after 90 seconds.

No photo, image URL, base64 content, toy names, play ideas or passwords are saved in the new analytics tables. An authenticated legacy caller without a browser token is represented by an account-based anonymous fallback ID to keep its call working; current pages always supply the existing browser token. Signup and paywall behavior, model settings and the OpenAI key are unchanged.

## D1 landing checks and rollback

D1 adds only the public landing, shared landing foundations and a two-page URL switch. Plain links open `/app`; the app uses the same Convex/Auth provider and URL namespace, so route changes do not change stored session keys. Refresh and Back rely on static hosting serving `index.html` for page addresses. Assets remain rooted at `/`, including `/payments/`.

The supplied design-package HTML is a visual reference, not production code. The landing uses the specified palette with the approved system-font fallback and a text brand mark. Planned recognition, inventory and reminders are clearly labeled. No mascot or photo assets were added.

Safe browser checks use the existing Playwright installation and a fresh browser profile. Start a dedicated local server with a synthetic backend address:

```sh
VITE_CONVEX_URL=https://d1-isolated.invalid npm run dev -- --port 5184 --strictPort
```

Then run only the isolated D1 file:

```sh
npm test
npm run build
GUMMY_TEST_URL=http://127.0.0.1:5184 npx playwright test tests/browser/d1.spec.ts
```

D1 tests block external HTTP and replace external WebSockets with synthetic replies. They do not connect to Convex, create accounts, confirm payments or call AI. Synthetic signed-in checks exercise the real client/provider and unchanged controls; they do not verify a real account session. Layout screenshots are temporary files under ignored `test-results/`. The text-size check enlarges text to 200%; actual browser zoom and screen-reader checks remain separate manual checks.

**Do not run the full browser suite as a D1 check.** `photo.spec.ts` and `paywall.spec.ts` remain live integration tests that can spend credits or mutate accounts/payments. They now open `/app`.

Before D1 edits, the current HEAD, working-tree status, copies of changed existing files, and hashes of protected files were saved under `.git/d1-baseline/`. This local baseline is not published and may contain pre-existing uncommitted work.

To undo D1 locally, stop the development server, restore only the files listed in `.git/d1-baseline/state.json` from `.git/d1-baseline/files/`, and remove only the new D1 files listed in the D1 handoff. Run `npm test` and `npm run build`. Never use a repository-wide reset or clean. If additional work has since changed those same files, compare and remove D1 changes selectively instead of overwriting later work. The final D1-only change is also saved in the private local Git reference `refs/d1/complete`, with `refs/d1/before` as its baseline. These checkpoints do not move your branch, stage files in your normal index, or commit unrelated work to your branch. Review with `git diff refs/d1/before refs/d1/complete`.

For the exact local undo, run `python3 .git/d1-baseline/rollback.py`. It refuses to overwrite any D1 file changed after this handoff, restores the five original files, and removes only the nine newly created D1 files. Run this only when you intend to undo D1. No database rollback is needed. No D1 deployment has been authorized or performed.
