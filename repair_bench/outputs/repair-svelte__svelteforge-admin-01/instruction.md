# Repair Task - svelteforge-admin (SvelteKit + Svelte 5)

You are working on the source code of **svelteforge-admin**, an admin
dashboard built with SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 and a
local SQLite database (Drizzle ORM). The project lives in this workspace;
it builds with `pnpm build` and runs as a self-contained Node server
(`node build/index.js`). All users, pages, notifications and settings are
seeded into the local database; the app is fully offline.

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

1. "Searching for users works fine, but if I browse to the next page of
   results and then clear the search box, the list doesn't go back to the
   start - I'm left staring at some middle page of the full list until I
   reload."

2. "In the user list I changed the rows-per-page dropdown from 10 to 50.
   The dropdown itself shows 50, but the table still renders only 10 rows.
   Clicking around the pagination doesn't help either."

3. "I added a new user and the dialog closed like nothing was wrong, but
   the person never shows up in the table - I have to reload the page to
   see them. Editing a user does the same: the dialog closes, the table
   keeps showing the old data."

4. "On the dashboard, the 'Content Production' chart never appears - it
   just keeps showing the grey skeleton placeholder forever. All the other
   charts on that page render fine."

5. "When I write a new page I typed my own slug by hand. Then I went back
   and tweaked the title a little, and the slug silently reverted to the
   auto-generated one. My manual slug should stick."

6. "The bell badge in the top-right says I have a bunch of unread
   notifications, but the Notifications card on the dashboard only lists 5
   items, and the Unread Notifications stat card shows a third number that
   matches neither. Are notifications being lost, or is one of these
   counting wrong?"

7. "Every time I log in again or refresh, my dark theme is gone and I'm
   back on light. Please make it remember my theme."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they
  are verification probes required by the checker.
- The app must remain buildable with `pnpm build`.
- The application must stay fully offline-capable; do not introduce network
  requests, and do not add new packages or libraries.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and fixing root causes.

## How your work is verified

The verifier reinstalls dependencies, re-seeds the database, rebuilds the
app, serves it, and drives it through a fixed script of interactions in a
headless browser covering the application's behavior. Your score reflects
**how many of the defective behaviors you actually fix** (fail-to-pass)
while keeping the already-working behaviors intact (pass-to-pass). Fixing
only some of the defects gives partial credit. You cannot see the
interaction script or its expectations while solving.

## Context

- Build: `pnpm build` (SvelteKit + adapter-node; `node_modules` is already
  installed)
- Run: `node build/index.js` (PORT / ORIGIN environment variables)
- Database: local SQLite file, initialized via `pnpm db:push` + `pnpm db:seed`
- Seeded logins: `admin / password123` (administrator) and
  `demo / SvelteDemo2026!` (read-only viewer, pre-filled on the login page)
- Task type: `repair` (multiple independent defects)
