# Repair Task - Database Diagram Editor (React)

You are working on the source code of a **browser-based database diagram
editor** built with React (Vite build). Users design database schemas
visually: they place tables on a canvas, edit fields and relationships in a
side panel, undo/redo their edits, and export SQL for several database
dialects. Diagrams auto-save to the browser's local storage as you work.
The project lives in this workspace; it builds with `npm run build` and the
production build is served from `dist/`.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "The keyboard shortcut stopped working: I press Ctrl+Z to undo my last
   change and absolutely nothing happens. Weirdly, clicking the undo arrow
   in the toolbar does work. I tried the keyboard many times, same result
   every time."

2. "When I rename a table in the right-hand panel, the input box shows the
   letters as I type, but the table's header on the canvas refuses to
   change. Occasionally it suddenly catches up when I do something else.
   Spooky."

3. "I added a few tables and edited some fields, and the top-right corner
   never shows that anything was saved. But the moment I rename the diagram
   (or just zoom), it saves right away. Does auto-save only react to
   renames?"

4. "The exported MySQL script has a problem: in the CREATE TABLE statement
   the auto-increment on the id primary key is gone. I have to add it back
   by hand before running the script. Scripts I exported before had it."

5. "When I pick Generic as the database type, exporting the SQL gives me
   nothing - empty. Is the export broken?"

6. "Every time I create a new table its name is some random-looking string
   like table_V1StGXR8_Z5jdHi6. Is my diagram corrupted?"

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they
  are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
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

- Build: `npm run build` (Vite; `node_modules` is already installed)
- Entry: `index.html` -> `dist/`
- Task type: `repair` (multiple independent defects)
