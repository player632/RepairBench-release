# Repair Task - x-spreadsheet (vanilla JS)

You are working on the source code of **x-spreadsheet**, a canvas-based
spreadsheet widget written in plain JavaScript (its own tiny `h()` DOM helper,
no framework) and bundled by webpack. The project lives in this workspace;
it builds with `npm run build` and the built app in `dist/` is what gets
served. The demo page loads one workbook with two sheets ("sheet1" with a
small fixture table, and "sheet2").

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

1. "The formatting buttons in the toolbar don't seem to follow what I have
   selected. I click on a cell that is bold and the Bold button stays dark;
   then I move to a normal cell and the button still shows whatever the
   previous cell had. It only updates when I actually change something."

2. "On a column that has the little filter arrow, I open the sort/filter
   popup, choose the descending sort and press OK. The rows just stay in
   their original order. Ticking values off in the filter list still works,
   it is only the sorting that does nothing."

3. "When I am editing a cell (double-clicked into it, text in the little
   editor box) and then click a different cell, my text ends up in the cell
   I clicked instead of the one I was editing. I lost half an hour of
   entries to the wrong cells."

4. "I selected one cell and clicked Bold, and suddenly a bunch of other
   cells I never touched turned bold as well. They are nowhere near the one
   I formatted. Undo fixes it, but it keeps happening."

5. "Menus and dropdowns stopped closing. I open the number-format dropdown
   or the right-click menu, change my mind, click somewhere neutral on the
   sheet - and it just stays open. Clicking away does nothing."

6. "The little blue square at the corner of the selection: I drag it down
   over the cells below to continue my 'A-0, A-1, ...' series and nothing
   happens. The dashed outline shows while I drag, but when I release, the
   target cells are still empty."

7. "This one is weird: after I edit a cell and press Enter, the cell
   sometimes ends up containing the literal word 'finished' instead of what
   I typed. It looks like some internal label leaks into the data."

8. "Also: when I open the page the undo arrow is greyed out and not
   clickable. I think it should always be enabled so I can undo anything at
   any time."

9. "About five seconds after the page loads, the text 'timer-probe' appears
   in some far-away cell on its own. That looks like leftover debug garbage
   - please remove whatever is writing it."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` / `aria-label`
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

- Build: `NODE_OPTIONS=--openssl-legacy-provider npm run build` (webpack 4;
  `node_modules` is already installed)
- Entry: `dist/index.html` -> `dist/xspreadsheet.js` (demo workbook with two
  sheets is embedded)
- Task type: `repair` (multiple independent defects)
