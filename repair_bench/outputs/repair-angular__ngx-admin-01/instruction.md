# Repair Task - ngx-admin (Angular)

You are working on the source code of **ngx-admin**, an Angular 15 admin
dashboard built on the Nebular UI kit. The project lives in this workspace;
it builds with `npx ng build` and is served from the `dist/` output folder.

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

1. "On the page that keeps loading more news articles as you scroll: when I
   scroll down to the bottom, sometimes the same articles get loaded again.
   It is easiest to reproduce when I scroll fast - then a batch of items I
   already saw shows up a second time in the list."

2. "One of the entries in the left sidebar menu leads to a page that does not
   exist - I get the 'page not found' screen instead of content. I don't
   remember which entry it was, but it is one of the regular ones."

3. "The round temperature dial on the IoT dashboard does not react anymore.
   I drag the handle around the arc but the shown value never changes, no
   matter how carefully or how far I drag."

4. "In the header there is a dropdown to pick the look of the app. I can pick
   a different entry and the dropdown shows it, but the colors of the
   interface stay exactly the same."

5. "The chat demo page: when I send a normal greeting to the bot, it answers
   with the usage instructions text instead of greeting me back. The bot
   seems to mix up what I typed."

6. "In the big people table demo, deleting does not work: I click the trash
   icon on a row, confirm the dialog that pops up, and the row just stays
   there."

7. "The music player card on the IoT dashboard looks broken to me: right
   after the page loads, the progress bar does not move at all. I have not
   pressed any button yet - is it supposed to be dead like that?"

8. "On the same dashboard, the contacts card has a 'Recent' tab with times
   next to the names. Those times look stale - I see the same values every
   time I look, whenever I open the page. I think the live updating there is
   broken."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes, and do not
  modify or delete `src/assets/wlb-shim.js` - these are verification probes
  required by the checker.
- The app must remain buildable with `npx ng build`.
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

- Build: `npx ng build` (Angular 15 dev configuration; `node_modules` is
  already installed)
- Entry: `src/index.html` -> `dist/`
- Task type: `repair` (multiple independent defects)
