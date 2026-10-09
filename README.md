# Gummy Bear — milestone 1

One page: take a photo or choose one photo, choose a child age (2–8), then see detected toy names and three play ideas. No login, profiles, saved history, reminders, WhatsApp, or landing page.

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

The browser test uses an actual public-domain teddy-bear photograph, verifies the one-file picker, 768-pixel resize, preview, action reply, retry state and mobile overflow. It records a configuration error when a key is missing; that does **not** count as live AI proof. Require successful live AI proof with:

```sh
REQUIRE_LIVE_AI=1 npx playwright test
```

Successful replies are saved verbatim to `.impeccable/review/raw-ai-output.txt`. Raw action replies and screenshots are in the same review directory. Phone camera access must also be checked on a real phone; desktop browser automation verifies the camera-input configuration only.

## Cost and privacy controls

- Only `convex/play.ts` calls OpenAI. The browser has no API key.
- `gpt-6-luna`, low reasoning, low image detail, at most 500 output tokens including reasoning, no automatic retries, 60-second provider timeout.
- The browser redraws one photo to JPEG, removes metadata, limits its longest edge to 768 pixels and its encoded length to 350,000 characters before sending.
- An internal, atomic Convex mutation reserves each call against a global rolling-hour quota. The 101st call is blocked, including concurrent requests. Failed provider calls still consume a reservation.
- Only the bounded quota timestamps are saved. Photos and play replies are not written to app storage. The OpenAI request uses `store: false`; provider processing rules still apply.
- Bad input, missing configuration, timeout, rate limit, unclear toys and incomplete output produce recoverable messages. No result is invented when the provider fails.

## Hosting

Convex static hosting is configured. Deploy with:

```sh
npm run deploy
```

This builds and publishes to the production `.convex.site` address. A Git push does not deploy the app.

Live page: https://sensible-avocet-370.convex.site

Production has a separate API key from development. Until it is set, the live page opens but returns a connection setup message when requesting ideas.

Check the deployed page with a real toy photo:

```sh
GUMMY_TEST_URL=https://sensible-avocet-370.convex.site REQUIRE_LIVE_AI=1 npx playwright test
```

Live proof files are saved separately under `.impeccable/review/live/`.
