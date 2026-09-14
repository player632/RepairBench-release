# Repair Task - nimbo (Svelte Kanban)

You are working on the source code of **nimbo**, a browser-based Kanban
board app (boards, lists, cards, a zen focus view and a command palette).
The project lives in this workspace; it builds with `npm run build` and the
result is served from the `public/` folder (`public/index.html` loads
`public/assets/bundle.js`; routing is hash-based).

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  place than the one where the symptom appears.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "I ticked the first item of a card's checklist in the card editor, then
   went back to the board - the little counter on the card did not budge.
   Adding more checklist items is the same, the badge just never shows up.
   Only after I refresh the page does it look right again."

2. "On the home page there is that 'Show archived boards' toggle. When I
   click it, the text on the button itself changes, but the list of boards
   does not react at all - archived boards stay hidden or stay shown, no
   matter how often I click."

3. "Renaming a list: I type the new name, then click somewhere else, and
   the new name stays there on screen, so I assumed it was saved. It
   wasn't - the moment I reload the page the old name is back. Weird part:
   when I press Enter after typing, it does save. What is going on?"

4. "On a board page, pressing the space key used to open the quick search
   palette. Now I press space and nothing happens at all."

5. "Clicking a card on the board no longer brings up the editing panel -
   it does not matter which card I click, nothing appears."

6. "Deleting a list pops up a confirmation dialog. I always press Esc to
   cancel, but now Esc does nothing and I have to click a button or click
   outside the dialog. My keyboard habit is broken."

7. "The stopwatch on cards in zen mode is acting strange: after I press
   stop, the time keeps secretly ticking on. And when I press start again,
   it runs about twice as fast as before."

8. "I just created a brand new board and never even opened it, but it
   already shows up in 'Recently Viewed' on the home page. A board nobody
   has looked at should not be on that list, right?"

9. "On the home page pressing z jumps straight to zen mode, but on a board
   page pressing z does nothing. Shouldn't keyboard shortcuts work the
   same everywhere?"

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they
  are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce
  network requests or new dependencies.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on
  reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the application's
behavior. Your score reflects **how many of the defective behaviors you
actually fix** (fail-to-pass) while keeping the already-working behaviors
intact (pass-to-pass). Fixing only some of the defects gives partial
credit. You cannot see the interaction script or its expectations while
solving.

## Context

- Build: `npm run build` (rollup; `node_modules` is already installed)
- Entry: `public/index.html` -> `public/assets/bundle.js`
- Task type: `repair` (multiple independent defects)
