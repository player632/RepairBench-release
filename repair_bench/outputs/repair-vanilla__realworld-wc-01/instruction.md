# Repair Task - Conduit (Vanilla Web Components)

You are working on the source code of **Conduit**, a small social blogging
app built with plain JavaScript Web Components (custom elements, no
framework) and webpack. The project lives in this workspace; it builds with
`npm run build` and the result under `dist/` is served as a static site. All
content - articles, accounts, comments, tags - is handled by local modules in
the project; the app is fully offline.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "The site is losing posts. I know there are 20 articles but the home feed
   only ever shows the first 10 and I cannot reach the rest from anywhere."

2. "On an article page the Favorite and Follow buttons next to the author
   info do nothing when I click them - no error, no change. The little hearts
   on the feed cards still work fine."

3. "Article dates show up like Fri February 20 2026 - no leading zeros and no
   time of day. I think the date display is broken."

4. "I write a comment under an article and press Post Comment - nothing
   happens. The text stays in the box and the comment never appears, even
   after waiting."

5. "Right after I sign in, the home page still looks like I am a guest -
   there is no Your Feed tab. If I reload the page everything is normal. The
   menu in the top bar does show my name immediately, which is confusing."

6. "On someone's profile I unfollowed and then followed again. The button
   text changed when I unfollowed, but after following again it still says
   Follow - looks like the follow request never goes through."

7. "When I open an article page without signing in, there is no comment box
   under the article - just a note telling me to sign in or sign up to add
   comments. I cannot tell whether the comment form is broken or whether that
   is how it is supposed to be."

8. "Whenever I open a user profile, the article lists underneath never show
   up - it just says Loading articles forever, for both tabs."

9. "My account data must be corrupted on the server: the Settings page comes
   up completely blank, and my personal feed is empty too. Please restore my
   profile."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests, and do not add new packages or libraries.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the application's
behavior. Your score reflects **how many of the defective behaviors you
actually fix** (fail-to-pass) while keeping the already-working behaviors
intact (pass-to-pass). Fixing only some of the defects gives partial credit.
You cannot see the interaction script or its expectations while solving.

## Context

- Build: `npm run build` (webpack 4; `node_modules` is already installed)
- Entry: `app/index.html` -> bundled app under `dist/`
- Accounts for manual exploration: alice@wlb.local / alice-pass-1,
  bob@wlb.local / bob-pass-2
- Task type: `repair` (multiple independent defects)