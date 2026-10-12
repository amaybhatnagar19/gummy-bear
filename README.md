# Gummy Bear

Take or choose one toy photo, choose an age (2–8), and get toy names and three play ideas. The original photo flow is preserved; access is checked before the AI action. No saved chat history, child profiles, reminders, WhatsApp, or landing page.

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
- For access, Convex saves browser counts, auth/account records, payment dates, bonus flags and temporary reservations. For AI requests, only bounded quota timestamps are saved; photos and play replies are not written to app storage. The OpenAI request uses `store: false`; provider processing rules still apply.
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
