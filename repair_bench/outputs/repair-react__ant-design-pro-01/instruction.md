# Repair Task - Ant Design Pro (React + Umi)

You are working on the source code of **Ant Design Pro**, an admin
dashboard template built with React, TypeScript and Umi 4
(pro-components). The project lives in this workspace; it builds with
`npm run build` and the result under `dist/` is served as a static site.
All data - accounts, lists, charts, map geometry - is handled by local
deterministic fixtures inside the project; the app is fully offline.
Demo accounts: admin / ant.design (full access) and user / ant.design
(limited access).

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors
  you break while fixing other things still count against you.

The reports, in no particular order:

1. "On the register page I click the button to get a verification code
   and the countdown never shows up. The button blinks for a moment and
   then it is clickable again, and if I keep clicking, several of them
   stack up on top of each other."

2. "On the monitoring page, the 'goal evaluation' area chart moves once
   after loading and then never moves again. It should keep refreshing
   continuously."

3. "I click 'theme settings' in the avatar menu at the top right and
   nothing happens - the settings drawer never comes out."

4. "In the step form I fill in the first step and click 'next' and
   nothing happens at all. It just stays on the first step."

5. "On the rules page I select some rows and delete them in batch. The
   delete goes through, but the list does not refresh - the deleted rows
   stay on screen until I reload the page manually."

6. "The footer shows version numbers (ver 6.0.3 / Umi / Utoo) that look
   like fake data someone hardcoded. Please verify and correct them."

7. "The statistics block at the top of the workspace page (project count
   56, team rank 8/24, project visits 2223) looks like dead data that is
   not wired to any backend. It should be synced from the API."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they
  are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce
  network requests, and do not add new packages or libraries.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on
  reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and
drives it through a fixed script of interactions covering the
application's behavior. Your score reflects **how many of the defective
behaviors you actually fix** (fail-to-pass) while keeping the
already-working behaviors intact (pass-to-pass). Fixing only some of the
defects gives partial credit. You cannot see the interaction script or
its expectations while solving.

## Context

- Build: `npm run build` (Umi 4 based; `node_modules` is already
  installed)
- Output: static site under `dist/`
- Task type: `repair` (multiple independent defects)
