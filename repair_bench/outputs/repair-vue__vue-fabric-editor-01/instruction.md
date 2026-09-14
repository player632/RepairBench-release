# Repair Task - vue-fabric-editor (Vue 3 + fabric.js canvas editor)

You are working on the source code of **vue-fabric-editor**, a browser-based
canvas editor built on Vue 3, Vite and fabric.js: a top toolbar (insert /
history / zoom / ruler / save), a left panel with drawing tools and a layer
list, the canvas workspace in the middle, and an attribute panel on the
right. The project lives in this workspace; dependencies install with
`pnpm install` and the app builds with `APP_BASE_PATH=/ pnpm build` into
`dist/`, which is served as static files.

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

1. "When I select an element and then click another one, the number fields
   in the right panel (X position and friends) still show the values of the
   previous element. Strange bit: if I edit a value while the stale number
   is showing, and then click the first element again, it looks normal -
   but keep clicking through elements and the wrong values keep showing."

2. "I clicked the line tool in the left toolbar, then switched over to the
   layers panel to check something, and when I came back the canvas was
   broken. Clicking anything does nothing, I can't select elements anymore,
   and I have to reload the whole page to get it working again."

3. "After I drag an element to a new spot and press the undo button, the
   element just disappears entirely instead of going back to where it was.
   It feels like undo skipped the move I just made."

4. "Right after I add a new element to the canvas, the undo button is still
   greyed out as if there were nothing to undo, while the redo button looks
   clickable. The two buttons seem confused about which direction of the
   history they are in."

5. "When I lock an element, the lock button doesn't change its appearance at
   all, so I can't tell whether it actually got locked. And clicking it
   again doesn't seem to unlock anything either."

6. "I pasted some SVG code into the 'insert SVG string' dialog and pressed
   OK, and nothing appears on the canvas. I assumed my code was broken, but
   the same snippet renders fine in other tools."

7. "When I turn the ruler switch off, the grid background around the canvas
   disappears as well. I'd like the grid to stay visible all the time
   regardless of the switch - it just feels more solid that way."

8. "I zoomed in to about 120% and clicked the 1:1 button, and the view
   snapped back smaller. That button shouldn't touch my zoom level - it
   should keep me exactly where I am."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `APP_BASE_PATH=/ pnpm build` and
  servable as static files from `dist/`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it, and drives it in a headless
browser through a fixed script of interactions covering the application's
behavior. Your score reflects **how many of the defective behaviors you
actually fix** (fail-to-pass) while keeping the already-working behaviors
intact (pass-to-pass). Fixing only some of the defects gives partial credit.
You cannot see the interaction script or its expectations while solving.

## Context

- Install: `pnpm install` (set `HUSKY=0` to skip git hooks)
- Build: `APP_BASE_PATH=/ pnpm build` → `dist/`
- Serve: any static file server over `dist/`
- Stack: Vue 3 + Vite + fabric.js; the workspace canvas is 900x1200 by
  default and the UI locale follows the browser
- Task type: `repair` (multiple independent defects)
