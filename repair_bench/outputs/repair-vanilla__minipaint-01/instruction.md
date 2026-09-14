# Repair Task - miniPaint (vanilla JS)

You are working on the source code of **miniPaint**, a browser-based image
editor built with plain JavaScript modules bundled by webpack. The project
lives in this workspace; it builds with `npm run build` and is served from
the project root (`index.html` loads `dist/bundle.js`).

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

1. "When I edit a value in the layer details panel - say the opacity or the
   rotate angle of the current layer - and then undo, the value does not go
   back to what it was before my edit. Undo seems fine for other things, it
   is only the details panel values that stick."

2. "In the color area of the right sidebar I collapsed the channels section
   to get some room, and when I expanded it again the R/G/B inputs were
   dead. I can type into them but the current color does not change at all
   anymore."

3. "I open a menu (File, Edit, whatever), change my mind and click somewhere
   neutral like the canvas to dismiss it - the menu just stays open.
   Clicking away has no effect anymore."

4. "Playing with the Animation tool: I toggle Play on and later off again,
   but the preview never stops. The layers keep cycling through visibility
   forever until I reload the page."

5. "Animation again, the other direction this time: with several layers I
   toggle Play on and nothing happens at all. No cycling, nothing - the
   layers just sit there."

6. "I like confirming dialogs with the keyboard: I type my values and press
   Enter instead of clicking Ok. Lately that just closes the dialog and does
   nothing - my resize values are lost and I have to click the button."

7. "I switched the units to inches in the settings and then resized an image
   to 5 by 3.75 inches. The result was a canvas only a few pixels across -
   everything tiny. Resizing by percentage still works normally."

8. "The arrows in the layers panel: when I press the 'move layer up' arrow,
   my layer moves in the wrong direction, away from the top of the stack."

9. "Every time I reload the page the zoom jumps back to 100%. The app should
   remember my zoom level!"

10. "Also: I picked my own color in the color area, reloaded the page, and
    the color was back to that default green. It should remember the last
    color I used."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` / `data-active`
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

- Build: `npm run build` (webpack; `node_modules` is already installed)
- Entry: `index.html` -> `dist/bundle.js`
- Task type: `repair` (multiple independent defects)