# Repair Task - Crypto Dashboard (Vue)

You are working on the source code of a **cryptocurrency dashboard**, a
browser-based market board built with Vue 2, Vuex and Vue Router, bundled by
vue-cli-service. The project lives in this workspace; it builds with
`npm run build` and the production output is served from the project root.
The app shows a board of live coin cards, a per-coin detail view with 24h
statistics and a price chart, a news column, and controls for adding and
removing coin pairs.

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

1. "When I click the small three-dot button on a coin card, nothing happens.
   The little dropdown never appears, so I cannot open a coin from the menu
   and I cannot remove one either. Double-clicking a card still takes me to
   the coin page, so the card itself is not frozen - only the menu is dead."

2. "The 24h change badge on one of the cards keeps flickering between green
   and red, flipping about once a second. It is really distracting. I think
   the color rendering is broken there - please make it stay one stable
   color."

3. "When I open the page for a single coin, it comes up completely empty: no
   coin name, no 24-hour numbers, no chart, nothing. The main board keeps
   updating fine, so data is clearly reaching the app - the coin page just
   looks like a skeleton."

4. "I wanted to tidy up my board and removed one card from the middle of the
   list via the card menu. The card I removed disappeared - but so did every
   card that was listed after it. Only the ones before it survived. I
   removed one coin and lost a whole row."

5. "The Clear All button at the bottom wipes the whole board instantly
   without asking. I hit it once by accident and everything I had added was
   gone. Please add a confirmation dialog before it clears."

6. "After I open a coin page, there is no back arrow in the header anymore.
   The bar just shows the title, and the only way to get back to the board
   is to edit the address bar. The arrow used to be there."

7. "On the coin page the price direction indicator looks wrong: it marks the
   price as rising when the price is actually flat or falling. It looks like
   a styling glitch at first, but it is consistent - a coin whose price is
   not moving shows up as going up. The percent figures on the board look
   right, it is only this indicator."

8. "When I pick a coin in the selector and press the plus button to add it
   to the board, nothing happens on the first press. Pressing plus a second
   time makes the card appear - once, not twice. It feels like the first
   press gets swallowed."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` or `data-*`
  attributes - they are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
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

- Build: `npm run build` (vue-cli-service; `node_modules` is already
  installed)
- Data: the board updates from a deterministic local data feed with a fixed
  cadence; charts and news come from local fixtures as well.
- Task type: `repair` (multiple independent defects)
