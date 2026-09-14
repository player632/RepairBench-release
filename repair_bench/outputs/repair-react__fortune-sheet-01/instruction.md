# Repair Task - Fortune-Sheet (React spreadsheet)

You are working on the source code of **fortune-sheet**, a React + TypeScript
canvas spreadsheet component library (the `packages/core` and
`packages/react` workspaces), together with its Storybook demo app under
`stories/` and `.storybook/`. The project lives in this workspace; it builds
with `yarn build-storybook` (node_modules is already installed) into a static
`build/` directory, and the spreadsheet runs inside the demo stories.

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

1. "The formula bar is lagging behind: I click on a different cell and the
   bar keeps showing what was in the cell I had selected before. It seems to
   refresh only when I actually edit something, not when I move around."

2. "Sometimes when I am still typing in a cell and I quickly click the
   little + button in the sheet tab bar to add a new sheet, whatever I was
   typing just disappears - the cell ends up empty. If I press Enter first
   it is fine."

3. "Find & Replace is completely dead. I click the search button in the
   toolbar and nothing happens at all - no dialog, no popup, nothing. I can
   never open it."

4. "I switch back and forth between two sheets a lot. Lately when I return
   to a sheet, the cell I had selected there is no longer selected - the
   selection seems to reset or to come back wrong."

5. "The little statistics in the bottom status bar look wrong. I select a
   few cells that contain text and the Count it shows is smaller than the
   number of cells I selected - like some cells are not being counted."

6. "The zoom is off. I open the zoom dropdown and pick 70%, but the sheet
   is clearly not displayed at 70% afterwards. The other presets look fine,
   only 70% seems wrong. Something in the zoom handling must be broken."

7. "When I drag a selected cell to move it somewhere else, after I drop it
   the highlighted (active) cell jumps to the opposite end of the moved
   selection from where it was before. Continuing to type lands in the wrong
   place."

8. "I typed =1+2 into a cell and pressed Enter. When I click back into
   that cell, the formula bar shows =1+2 instead of 3. Is the calculation
   not being applied? It feels like formulas are not evaluated."

9. "When I zoom in with the + button until I reach 400%, clicking + again
   does nothing anymore. Please remove this upper limit or fix whatever is
   blocking zoom beyond 400%."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid`, `data-disabled` or
  `data-selected` attributes - they are verification probes required by the
  checker.
- Do not modify the demo harness under `stories/` and `.storybook/`,
  including the small status readout panel rendered next to the sheet -
  it is part of the verification setup.
- The app must remain buildable with `yarn build-storybook`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
- Do not run the project's build to verify yourself during the session; a
  separate verifier rebuilds and drives the app. Focus on reading the code
  and fixing root causes.

## How your work is verified

The verifier rebuilds the demo app, serves it in a headless browser, and
drives it through a fixed script of interactions covering the spreadsheet's
behavior (cell editing, toolbar, formula bar, sheet tabs, search & replace,
zoom, context menus, drag operations, status-bar statistics). Your score
reflects **how many of the defective behaviors you actually fix**
(fail-to-pass) while keeping the already-working behaviors intact
(pass-to-pass). Fixing only some of the defects gives partial credit. You
cannot see the interaction script or its expectations while solving.

## Context

- Build: `yarn build-storybook` (Storybook 7 static build -> `build/`)
- Demo entry points: the Features stories (a basic data sheet, a two-sheet
  tabs demo, and an empty sheet)
- Task type: `repair` (multiple independent defects)
