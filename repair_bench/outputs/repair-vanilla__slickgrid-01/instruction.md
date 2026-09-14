# Repair Task - slickgrid (TypeScript data-grid library and its demo suite)

You are working on the source code of **SlickGrid**, a dependency-light
TypeScript data-grid library. The repository carries the library itself under
`src/` - the grid, its data view, its cell editors and formatters, its
mouse/keyboard interaction helpers, and a folder of optional plugins that add
range selection, copy and paste, tooltips and so on - and, next to it, a suite
of a little over a hundred standalone demo pages under `examples/`. Each demo
page builds one grid in the browser and shows off a single feature. That demo
suite is the whole user-visible surface of this task: every report below is
about something one of those pages does.

The pages the reports talk about, by the names the suite gives them:

- **Basic grid** - the plainest demo there is: a few hundred rows, six columns
  ("Title", "Duration", "% Complete", "Start", "Finish", "Effort Driven"), each
  column header draggable at its right-hand edge to make the column wider or
  narrower.
- **Spreadsheet** - an editable sheet with a narrow row-number column and a
  hundred formula columns, a hundred rows of data plus an empty row at the
  bottom for adding one. Cells can be clicked, dragged over to select a block,
  copied and pasted, and the block you are dragging over is outlined while you
  hold the button down. Double-clicking a cell opens a small text editor.
- **Grouping** - the same kind of data driven through the library's data view,
  with buttons along the top to group the rows by duration in several ways and
  a **Clear grouping** button that takes the groups away again. Column headers
  are clickable to sort.
- **Highlighting and Flashing cells** - five hundred rows of fake server load
  with four buttons: **Start simulation** / **Stop simulation** (which keep
  changing cell values and painting the changed ones), **Find current server**
  (which scrolls to one random row and blinks a single cell there a few times so
  you can spot it), and **Highlight 2nd Row**.
- **Multi Column Sort** - a grid whose headers can be sorted one after another,
  with the usual little direction arrow in the header you last sorted by.
- **Footer Row with Totals** - two grids on one page, each with a totals strip
  underneath that adds up the column above it. The first grid's number cells
  open an integer editor when you double-click them.
- **AutoTooltips** - a narrow grid demonstrating the tooltip plugin: when a
  cell's text is too wide for its column, hovering the cell is supposed to show
  the full text as a tooltip.
- **Spreadsheet with Excel compatible cut and paste** - two grids, the first one
  the live one. Copying a block of cells paints a highlight over them, and that
  highlight is supposed to go away again on its own after a couple of seconds;
  one of its columns holds a full date stamp that is far too wide for the
  column, so hovering those cells does show a tooltip.

The verifier builds the library bundles out of `src/`, compiles the
stylesheets, and assembles the served face under `dist/`: the built bundles
plus a copy of the demo pages with their relative script paths rewritten to
point at those bundles, and the one third-party drag-and-drop script the demos
use served from the tree instead of from a CDN. There is no type-check and no
lint step in that build, and the pages are then served from `dist/` at the site
root, with the demo index page linking every one of them.

Environment notes - properties of this offline harness, not defects:

- There is no network access, and nothing in this project needs it after the
  adaptation described above.
- The harness drives the pages in a real browser at a **1280x720 viewport**.
- Every checkpoint starts from a fresh browser context, so a selection, an open
  editor or a highlight left over from an earlier interaction never carries into
  the next one.
- Several demos build their rows with a random number generator when the page
  loads, so the exact numbers, dates, totals and group counts differ on every
  load. That is the seed's own behaviour, not a defect, and nothing you are asked
  to repair depends on a particular random value.
- Only some of the hundred-odd demo pages are exercised at all; the rest of the
  suite must simply keep working the way it does now.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different part of the
  library than the page the symptom shows up on, and a single reported symptom
  can have more than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.
  并非所有缺陷都有报告提及；修别的问题时弄坏的行为同样会扣分。
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "On the Basic grid demo I grab the right-hand edge of the Title column header
   and drag it to the right. The handle is there and the cursor changes, but the
   column never gets wider - it stays exactly as narrow as it was, and when I let
   go nothing has changed. Same on every demo that has draggable column edges."

2. "Keyboard paging is backwards on the Spreadsheet demo. I click a cell about
   twenty rows down, press Page Down, and I end up at the very top of the sheet
   instead of one screen further down. Pressing Page Up afterwards brings me back
   to roughly where I started, so it is not losing my place - each of the two keys
   just does the other one's job."

3. "On the Highlighting and Flashing cells demo, 'Find current server' is supposed
   to blink one cell a couple of times so I can see which server it picked.
   Instead the cell lights up and then stays lit. Forever. Reloading the page is
   the only way to get rid of it, and pressing the button again just leaves a
   second cell lit as well."

4. "On the Grouping demo I press 'Clear grouping' so I can see the plain rows,
   then I click the Duration header once to sort ascending - that is fine, small
   values on top. I click it a second time to get descending, and the list does
   not change: I still have the smallest durations on top and the biggest at the
   bottom. Descending sorting simply does not happen."

5. "On the Footer Row with Totals demo I double-click the first number cell of the
   top grid, type 10 and press Enter. The cell comes back showing 2, and the
   totals strip underneath moves by the same wrong amount, so it really did store
   2 rather than just painting it oddly. Whatever number I type in there comes
   back as something else."

6. "On the Spreadsheet demo Ctrl+C does nothing at all. I drag over a few cells to
   select them, press Ctrl+C, and no copy highlight appears anywhere; pressing
   Ctrl+V over another cell then pastes nothing, so the value I had just typed
   into a cell never travels. Interestingly the Excel compatible cut and paste
   demo copies and highlights just fine, so it is not my keyboard or my browser -
   it is that one page."

7. "This may be me misreading the demo: on the Multi Column Sort page, when I sort
   by a column the little direction arrow shows up in that header, but the other
   headers look like they have lost theirs. Should the arrow really vanish from
   every column I have not sorted? Next to the one that is sorted it looks
   broken, so I assume the indicators are being thrown away."

8. "The AutoTooltips demo looks half finished. I hover over the cells and not one
   of them shows a tooltip, while on the Excel compatible cut and paste demo
   hovering a cell does show one. So the tooltip thing only works sometimes -
   can you make it show tooltips on the demo that is named after it?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the suite intact - the row and
column selection, the cell editors, the group rows, the simulation buttons, the
totals strips, the virtual scrolling that only renders the rows currently on
screen, and every demo page no report mentions. The build described above must
still succeed when you are done.
