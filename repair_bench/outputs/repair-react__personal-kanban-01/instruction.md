# Repair Task - personal-kanban (React)

You are working on the source code of **Personal Kanban**, a small
self-contained kanban board for one person: a horizontal board of
columns, each holding a stack of cards, all editable in place and all
drag-and-droppable with the mouse or with the keyboard (focus a card or
a column and use Space to lift, the arrow keys to move, Space again to
drop). Each column can be renamed, recoloured from a swatch picker,
given an optional work-in-progress ceiling that locks further additions
once it is reached, and emptied or deleted; each card carries a heading,
a note, a colour and the time it was created. The top bar adds
columns, wipes the whole board, opens an info panel, switches between a
light and a dark appearance, and switches the interface between eight
languages. There is no account and no server: the board is kept in the
browser's own storage between visits, so what you leave on screen is
what you come back to.

The project is React 17 with TypeScript on Create React App 4 tooling
and the Material-UI component library. It lives in this workspace and is
fully offline: install with `npm install`, then build with
`NODE_OPTIONS=--openssl-legacy-provider GENERATE_SOURCEMAP=false npm run
build` (webpack 4 needs the legacy OpenSSL provider on a modern Node,
and source-map generation has to stay off there); the output lands in
`build/` and is served from that directory as the site root. The dev
server (`NODE_OPTIONS=--openssl-legacy-provider npm start`) is the
quickest way to click through the app while you work. There is no
backend. The remote web font and the analytics snippet that upstream
shipped in the page shell have been removed for offline use, so the
interface text falls back to a plain system font - that is
environmental, not something to fix.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended, or
  that this offline environment causes on its own; verify a report
  before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "I opened a column's edit sheet, picked a different background swatch
   and renamed the column while I was there, then saved. The new name
   stuck, but the column is still wearing its old background colour. I
   tried three different colours and it never moves."

2. "The dark appearance button in the top bar does nothing. I click it
   and the board stays exactly as it was - no flicker, no change,
   nothing. Clicking it again does not help either."

3. "Dragging a card over to another column often just snaps back to
   where it came from. Strangely it does work when I drop it underneath
   the card that is already in the target column, but if I drop it into
   the top slot of that column nothing happens at all."

4. "I switched on the work-in-progress ceiling for a new column and
   forgot to type a number. Instead of complaining about the missing
   number the form just accepted it and created the column - and now
   that column refuses to take any cards whatsoever."

5. "The language menu is crossed. Picking Français gives me Spanish, and
   picking Español gives me French. The rest of the languages behave."

6. "Every card shows its own text the wrong way round now: the bold
   heading line carries the long note, and the note area underneath
   shows the short heading."

7. "Columns that have a work-in-progress ceiling used to state that
   ceiling in the small line at the bottom of the column, something like
   'WIP Limit :2'. Now every column shows a date and a time down there
   instead, whether it has a ceiling or not."

8. "Two of the buttons here are supposed to take you out to the
   project's own websites - the repository button in the top bar and the
   floating button parked in the bottom-right corner. Neither of them
   goes anywhere; the pages never come up."

9. "When I open the little info panel from the top bar, the picture at
   the top of that panel is just an empty broken box."
