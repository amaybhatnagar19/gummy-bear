# CONTENT_COPY.md — Gummy Bear V1
**Status:** Draft production microcopy, subject to verification against actual privacy and safety implementation.
**Voice:** warm, calm, clear, never childish to parents. Sentence case. Short verbs. No pressure.

## Landing
- Hero: **Their next favorite toy is already at home.**
- Support: **Discover fresh ways to play with the toys your child already owns. Snap a photo, check what we found, and get practical ideas for their age.**
- Primary: **Find Play Ideas**; secondary: **See How It Works**
- How it works: **1. Snap a toy. 2. Check what we found. 3. Choose a way to play.**
- Benefits: **More ways to play. Less guesswork. Make more of the toys you own.**
- Reuse: **Give a familiar toy a fresh role.** / **Rediscover ideas for toys you've added to your collection.**
- Privacy: **You choose which photos to share. Review our privacy information before uploading.**
- Final CTA: **Ready for a new play idea?** / **Try Gummy Bear**
- Avoid fabricated testimonial, numerical adoption claims, and unverified “photos never saved” promises.

## First use
- Add toy: **Let's find a new way to play.** / **Take a photo of a toy, or choose one from your photos.** / **Take a photo** / **Choose a photo**
- Selected: **Photo ready** / **Change photo**
- Recognition: **Is this the right toy?** / **We think we found: Teddy bear.** / **Looks right** / **Edit toy name** / **Try another photo**
- Uncertain: **We're not sure about this one. Can you tell us what it is?**
- Age: **How old is your child?** / **We use their age to make ideas more relevant.** / **Continue**
- Loading: **Thinking of ways to play…** / **This may take a moment.**
- Results: **Here are some ideas to try.** / **Choose what fits your day.**
- Categories: **Quick Play** / **Creative Adventure** / **Play Together**
- Card actions: **See steps** / **Save idea** / **Try something different**
- Detail: **What you'll need** / **How to play** / **Your role** / **A note on safety**
- Post-value signup: **Want to keep these ideas?** / **Create an account to save your toys and activities for next time.** / **Save my ideas** / **Not now**

## Returning experience
- Home: **Ready for a little playtime?** / **Find a Play Idea** / **Pick from My Toys** / **Recent activities**
- Empty inventory: **Your toy collection starts here.** / **Add a toy whenever you're ready.** / **Add a toy**
- Empty saved activities: **No saved ideas yet.** / **When you find one you like, save it here.** / **Find an idea**
- Feedback: **Did you try this activity?** / **How did it go?** / **Loved it** / **It was okay** / **Didn't work**
- Status change: **Move this toy to Stored?** / **You can change it back anytime.** / **Confirm change**
- Reminder: **Want to revisit this toy?** / **You haven't explored ideas for it here recently.** / **See new ideas** / **Not now**
- Donation choice: **Would you like ideas for using it at home, or guidance on donating it?** / **Reuse at Home** / **Explore Donation**

## States
| State | Heading | Message | Action |
|---|---|---|---|
| No photo | Add a toy photo | One photo is enough to begin. | Take a photo |
| No toy detected | We couldn't identify a toy | Try a closer, clearer photo, or tell us what the toy is. | Try again |
| Slow generation | Still working on it | Finding useful ideas can take a little longer. | Keep waiting / Go back |
| No safe ideas | We couldn't find a suitable idea this time | Try another toy or adjust the details. | Try another photo |
| AI/network error | We couldn't load new ideas | Your previous ideas are still here. Please try again. | Retry |
| Offline | You're offline | You'll need a connection to find new ideas. | Retry when online |
| Save success | Saved for later | Find this in Activities. | View Activities |
| Auth link failure | We couldn't save your progress yet | Your current ideas are still visible. Try signing in again. | Try again |
| No reminders | Nothing to rediscover yet | Add toys over time and we'll help you revisit them. | View My Toys |
| Delete confirmation | Delete this information? | This may be permanent. Review what will be deleted. | Delete / Cancel |

## Copy guardrails
Never claim: “We know this toy hasn't been used,” “guaranteed safe,” “guaranteed development,” “your photos stay on your device,” or “your account was deleted” before confirmation. Do not pressure a parent to buy, donate, sign up or enable reminders.
