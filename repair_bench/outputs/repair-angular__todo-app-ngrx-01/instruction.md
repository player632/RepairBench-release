# Repair Task - todo-app-ngrx (Angular + TypeScript)

You are working on the source code of **todo-app-ngrx**, a TodoMVC-style
daily task list ("My Day") built with Angular 22 and `@ngrx/signals`
(TypeScript, standalone components, signal-store state management). The
project lives in this workspace; it builds with `npm run build` and the
result is served as a static site. The app is fully client-side: tasks are
kept in memory and persisted to the browser's local storage. There is no
backend and the app must stay fully offline.

Quick orientation with the app itself: type a task into the field at the top
and press Enter to add it. Double-click a task to edit it (Enter commits the
edit, Escape cancels). The checkbox toggles a task done/undone, the × button
removes it, and the footer carries the pending counter, the All / Pending /
Completed filter links (backed by the `/`, `/pending`, `/completed` routes)
and a "Clear completed" button.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "When I double-click a task to edit it, the edit box appears but the
   cursor is not inside it - I always have to click into the box first
   before I can type. It should be ready to type right away."

2. "Since some time, when I rename a task the whole list entry seems to get
   thrown away and rebuilt from scratch - the row visibly flickers and
   anything that row had going on is gone afterwards. It should just update
   the text in place."

3. "Something odd: when I delete a task and then add a new one, ticking off
   one of the remaining tasks sometimes ticks another task at the same time.
   It's as if two tasks suddenly shared the same identity."

4. "After I reload the page, my completed tasks are still marked as done -
   they are struck through - but the checkbox next to them is unticked. That
   looks wrong; the tick should still be there after a reload."

5. "Clicking the Pending / Completed / All links in the footer feels
   sluggish. The list only changes a noticeable moment after the click. It
   should switch instantly."

6. "If I switch to the Completed view and nothing is completed yet, the
   whole bottom bar disappears - item counter, filter links, clear button,
   everything. I still have tasks, so the bar should stay."

7. "A colleague sent me a direct link to the Pending view, but when I open
   it I land on the full list instead. Links that point straight at a
   filtered view don't seem to work."

8. "New tasks always get appended at the bottom of the list. I think the
   newest task should appear at the top instead - please flip the order."

9. "When I'm editing a task and just click somewhere else, my change is
   lost. It should be saved automatically when I click away, without having
   to press Enter."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Notes on the task list

- Tasks are persisted in the browser's local storage; reloading the page
  restores them.
- The filters are backed by real routes (`/`, `/pending`, `/completed`), so
  both in-app links and externally shared URLs matter.
- The app decides by itself how new tasks are ordered and how edits are
  committed - check what it actually does before assuming a report is right.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests to external hosts, and do not add new packages or libraries.
- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the app's behavior
(adding, editing, toggling, removing, filtering, counting, persistence and
routing). Your score reflects **how many of the defective behaviors you
actually fix** (fail-to-pass) while keeping the already-working behaviors
intact (pass-to-pass). Fixing only some of the defects gives partial credit.
You cannot see the interaction script or its expectations while solving.

## Context

- Build: `npm run build` (Angular CLI 22 / esbuild; `node_modules` is
  already installed)
- Output: `dist/myapp/browser/` static site
- Task type: `repair` (multiple independent defects)
