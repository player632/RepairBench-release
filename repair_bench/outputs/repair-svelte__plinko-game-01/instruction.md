# Repair Task - Plinko (Svelte)

You are working on the source code of **Plinko**, a SvelteKit + Svelte 5
web game in the style of a casino peg-board: the player drops balls from the
top of a triangular pin field (rendered on a canvas by a physics engine),
each ball bounces down and lands in one of the payout slots along the
bottom, and the wager is settled against that slot's multiplier. A side
panel holds the wager controls (manual drops and an automatic mode), the
risk level and the number of pin rows; small floating panels show the game
settings and live session statistics, and a header bar shows the balance.
The project lives in this workspace; it builds with `npm run build`
(static adapter, output in `build/`, served from that directory at the
site root). The app is fully offline - there is no backend and all data is
local.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "I set the automatic mode to a fixed number of rounds - say 3 - and
   start it. It fires the balls fine, but after the last one the panel
   never unlocks: the big button keeps saying Stop Autobet and all the
   fields stay greyed out forever. Only refreshing the page gets me back
   to normal."

2. "I top up my balance, play a bit, then reload the page - and the money
   I added is gone, it shows the old amount again. I swear it was higher
   before I refreshed."

3. "Switching the risk level does nothing to the payout strip along the
   bottom of the board. I expected different numbers for low and high
   risk, but the strip looks exactly the same whichever one I pick."

4. "In the live statistics panel, the profit history chart never draws
   anything. I dropped dozens of balls, real wins and losses, and the
   chart area just stays flat - no line ever appears."

5. "I keep trying to open the game settings with the little gear button at
   the bottom of the side panel, but a different panel pops up instead. I
   cannot reach the settings at all anymore."

6. "Not sure if this is a bug: sometimes a ball takes a weird floaty
   bounce off a pin near the edge of the board and drifts sideways for a
   moment before it settles into a slot. The physics looks off in those
   moments."

7. "Minor thing: right after I top up, the balance figure in the header
   seems to take a split second to settle. I worry it might be showing the
   wrong amount sometimes."


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
