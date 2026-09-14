# Repair Task - ng-alain (Angular)

You are working on the source code of **ng-alain**, an Angular 21 admin
dashboard built on the NG-ZORRO component library. The project lives in
this workspace; it builds with `ng build` (see Constraints) and is served
from the `dist/ng-alain/browser` output folder.

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

1. "The basic list page keeps showing its loading state forever. The list items never appear, no matter how long I wait, and reloading the page does not help."

2. "On the query table page I type a rule number into the search box and press search, but the results are completely wrong - sometimes the table does not move at all, sometimes the rows I get back do not match what I typed."

3. "On the basic form page, after I click submit the button keeps its loading spinner forever, as if the app froze. Strangely the success message does pop up, so maybe it submitted, but the button never recovers."

4. "In the advanced form, in the user/member table: no matter which row I click the delete link on, it is always the last row that disappears instead of the one I clicked."

5. "The activity feed on the workbench page shows broken text - every team or project name inside the activity sentences has a stray @ character left in front of it, as if the name replacement only half worked."

6. "In the advanced form, when I edit a row and press save, the inputs stay there as if nothing happened. The values I typed do get kept, but the row never goes back to normal display mode - only cancel seems to close the editing state."

7. "The notification bell in the top-right corner shows a badge number that looks off to me - I think it should reflect my real unread message count instead of whatever it shows now."

8. "In the basic list, the delete action of each item looks broken: I click delete and get a success toast, but the item is still there afterwards. It feels like nothing actually happened."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - these
  are verification probes required by the checker.
- The app must remain buildable with `ng build` (production configuration).
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

- Build: `ng build` via yarn 4 (Angular 21 production configuration;
  `node_modules` is already installed)
- Entry: `src/index.html` -> `dist/ng-alain/browser/`
- Task type: `repair` (multiple independent defects)
