# Repair Task - Piskel (vanilla JS)

You are working on the source code of **Piskel**, a browser-based pixel art
and sprite animation editor built with plain JavaScript (jQuery-era
architecture, no framework) and bundled by Vite. The project lives in this
workspace; it builds with `npm run build` and the production output is the
static site under `dest/prod/`.

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

1. "The keyboard shortcuts cheatsheet only shows up once per page load. I
   open it, close it, and then pressing ? again - or clicking that little
   keyboard icon in the corner - does nothing at all. Only refreshing the
   page brings it back."

2. "Undo goes back too far. I painted a stroke, then added a new frame, and
   when I press Ctrl+Z once, the new frame is gone AND the stroke I painted
   is gone with it. One press should undo one thing."

3. "After saving, that little success message in the corner just stays there
   forever. It never disappears on its own, I have to click the x to get rid
   of it."

4. "Clicking the swap arrow next to the two color pickers does nothing - the
   colors do not move. But when I press the X key, they swap fine. Weird."

5. "Undo sometimes ignores me: when I press Ctrl+Z twice quickly, only one
   step is undone. If I press slowly, one at a time with a pause, it works
   normally."

6. "All the tool keyboard shortcuts pick the color picker tool now. I press P
   for the pen, B for the paint bucket - the selected tool is always the
   color picker. Clicking the tool icons with the mouse still selects the
   right tool."

7. "I set the pen thickness I like, then refresh the page, and it is back to
   the thinnest setting again, like it never remembered anything."

8. "When I open the app there is a short black screen saying 'Loading Piskel
   ...' before the editor appears. Is the load failing? It feels like
   something is broken at startup."

9. "When I click the alpha symbol next to a layer, the browser pops up one
   of those input boxes asking me for a number. Is that an error dialog? I
   did not expect the browser itself to ask me anything here."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves the production output in a headless
browser, and drives it through a fixed script of interactions covering the
application's behavior. Your score reflects **how many of the defective
behaviors you actually fix** (fail-to-pass) while keeping the already-working
behaviors intact (pass-to-pass). Fixing only some of the defects gives
partial credit. You cannot see the interaction script or its expectations
while solving.

## Context

- Build: `npm run build` (sprites + Vite + partials; `node_modules` is
  already installed)
- Output: `dest/prod/index.html` (pure static site)
- Task type: `repair` (multiple independent defects)
