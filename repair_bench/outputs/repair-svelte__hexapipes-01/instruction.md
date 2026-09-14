# Repair Task - a browser pipes-puzzle game (SvelteKit 2 + Svelte 4)

You are working on the source code of a single-page puzzle game that runs
entirely in the browser. It is built with SvelteKit 2 and Svelte 4 on vite 5 and
published as a **fully static site**: the build step writes a plain static
directory and the verifier serves that directory from the site root. There is no
backend of any kind - the app keeps its own progress in the page's local storage,
and the only data it ever fetches is a small JSON file that ships inside the
source tree.

## The game

The board is a grid of tiles and every tile carries pieces of pipe. You rotate
tiles until all the pipes are connected and no loop is left. Each tile is drawn
as its own little vector group: the tile's outline, the pipe strokes inside it,
and - while you interact with it - the rotation marks around its edges. The board
can be zoomed and panned, a timer runs while you play, and an animation speed is
applied to your moves.

Nine grid families exist - Hexagonal, Square, Octagonal, Elongated Triangular,
Cube, Trihexagonal, Snub Square, Rhombitrihexagonal and Triangular - and every
family also has a **wrap** variant in which the opposite edges of the board are
connected to each other. Each family offers the same seven sizes: 5, 7, 10, 15,
20, 30 and 40.

Three entries sit in the top navigation - **Home**, **Daily** and **Play** - and
the one you are currently under is marked as active. Home carries a gallery of
example boards, a section per grid family and the project's changelog. Play is
"choose your grid" plus a link to the custom generator. Daily opens today's
puzzle, found by the current date, under the heading "Daily Pipes Puzzle
<date>".

A stored puzzle lives at an address of the form `/<family>/<size>/<number>`, and
`/<family>/<size>` on its own picks one for you. Those pages carry a heading with
the family name, a **Grid:** bar (the family and its wrap variant, plus a link
back to the grid chooser), a **Size:** bar with the seven sizes and the current
one marked, the board, a row of puzzle buttons, and a collapsible **Solve stats**
panel. The custom page is a form (family, width, height, wrap, branching amount,
avoid-obvious, avoid-straights, unique-or-multiple solutions) with a **Generate**
button; generation runs off the main thread, and the page generates one board by
itself as soon as it opens.

The Solve stats panel reads "Total puzzles solved: N (M in a row)" above a
four-row table - Single puzzle, Mean of 3, Average of 5, Average of 12 - each row
with a Current and a Best column, and below it an improvements area that
announces it when you beat one of your own means. With no history at all, every
cell of that table shows `--:--` and the count reads `0 (0 in a row)`.

The app also remembers you. A settings panel offers a control mode, an
invert-rotation-direction switch, show timer, disable zoom and pan, animation
speed and an assistant switch, and all of them come back on the next visit.
Progress on an unfinished puzzle is written when you leave it, and returning to
that family and size is meant to drop you back into the puzzle you left. An
address that does not exist shows the framework's own error page.

## Building and running it

The project builds with its own local vite into a static directory, and that
directory is what the verifier serves from the **site root**, i.e.
`http://127.0.0.1:PORT/`. Dependencies are provisioned offline by the harness;
you never need to install anything and you never need the network. Every puzzle
the app can serve ships as a JSON file inside the source tree.

Environment notes - properties of this offline harness, not defects:

- There is no network access and nothing in this project needs it. The app's only
  two data fetches are same-origin JSON files from its own static directory; no
  request ever leaves the origin.
- The harness drives the app in a real browser at a **1280x720 viewport** with an
  en-US locale.
- Every checkpoint starts from a **fresh browser context**: local storage is
  empty, nothing is held in memory, and the address is whatever that checkpoint
  navigates to. A first-visit behaviour is therefore measured as a first visit,
  every single time. Some checkpoints put data into local storage themselves
  before they look at the page - that is the harness setting up a save file so a
  stats or resume behaviour can be observed at all, not the app misbehaving.
- The static directory is served with a fallback that answers the page shell for
  an address that is not a file, because the app's own client-side routing needs
  it: a stored puzzle, the daily page and the custom page are all real routes
  with no file behind them.
- The build output directory is deleted before every build, so what gets measured
  is always your own source. A build directory that happens to be lying around in
  the tree is never served and never counts as evidence.
- On the custom page the board is generated with unseeded randomness: which pipes
  you get differs between runs, how many tiles the board has does not.

## The reports

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, **not** as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different module than
  the one the symptom appears in, and a single reported symptom can have more
  than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- **Not every defect is described in these reports.** 并非所有缺陷都有报告提及 -
  some of them nobody wrote in yet, and at least one of them is hiding behind
  another one, so its own symptom cannot be seen at all until the first one is
  repaired. Behaviors you break while fixing other things still count against
  you, so re-check the parts of the app you touched.

1. "The **pipe drawing inside every tile is upside down**. I opened my usual 5x5
   hexagonal puzzle and all the strokes that should touch the top edge of a tile
   touch the bottom edge instead - every tile looks mirrored top-to-bottom. It is
   only the drawing: the board still has all 25 tiles, the outline of the board
   is the same as always, and the game still tells me correctly whether the pipes
   are connected when I finish. So the puzzle logic is fine and the picture of the
   pipes is not."

2. "The **board no longer fills its frame**. There is a band of dead space around
   it now, as if the frame the board is drawn into had been measured for one more
   row of tiles than the puzzle actually has, and the whole picture sits too high
   and too small in it. The tiles themselves are in the right places and there
   are the right number of them - I counted - and it is the same on every size.
   Oddly the wrap boards look exactly like they always did, it is the plain ones
   that changed."

3. "Since the last build the **board takes about six seconds to appear**. I click
   a puzzle, the page is there, the heading and the buttons are there, and the
   board area is just empty - then after something like six seconds all the tiles
   pop in at once. If I wait it out, the puzzle is complete and correct and plays
   normally. It used to be immediate. It happens on every puzzle page I open."

4. "Two things and I am fairly sure they are the same bug. **My whole solve
   history looks deleted**: the stats panel says 'Total puzzles solved: 0 (0 in a
   row)' and every row of the table is `--:--`, on every puzzle, including ones I
   have finished dozens of times. My settings are all still remembered, so the
   browser did not wipe the site. And **the Size: bar throws me into the wrong
   puzzle**: I was halfway through a 5x5, clicked 7x7 in the Size: bar to look at
   something, and instead of the 7x7 page I landed directly inside a numbered
   7x7 puzzle - and the number it landed on is the number of the 5x5 I had left
   half-finished. It is as if the game believes my unfinished save belongs to
   every size at once."

5. "The **headings of the two hexagonal variants are swapped**. On the plain
   hexagonal board the big heading says 'Hexagonal  Wrap Pipes' and the line
   under it says the same, and on the wrap board both say 'Hexagonal  Pipes'. The
   boards themselves are right - the wrap one does wrap and the plain one does
   not - so it is only the words. Both pages are wrong in opposite directions."

6. "**Some stored puzzles will not open.** `/hexagonal/5/900` gives me the
   framework's error page with no board at all, and the same for the other round
   numbers I tried. But `/hexagonal/5/953` opens perfectly, and so do 899 and
   901, so it is not that the puzzles are missing - it looks like it only hits
   the numbers that are exact hundreds."

7. "Small one: on the **custom puzzle page nothing in the top navigation is
   marked as current**. Home is marked on the home page, Daily on the daily
   puzzle, Play on every board page and on the grid chooser - but on the custom
   page all three entries look unselected, even though you get there from the
   Play page's own link."

8. "I opened the game in a **fresh browser profile** for the first time, clicked
   into a puzzle and opened 'Solve stats' out of curiosity. Every cell says
   `--:--`, the line above the table says 'Total puzzles solved: 0 (0 in a row)'
   and the improvements area underneath is completely empty. Is the stats feature
   broken, or is that what it looks like before you have solved anything?"

9. "Not a bug exactly, more something I noticed: on a **wrap board the browser
   tab title never says wrap**. The page's own heading does say 'Hexagonal Wrap
   Pipes', but the tab reads '5x5 Hexagonal Pipes Puzzle #953', exactly like the
   plain board's tab. Shouldn't the tab title match the page? Could you make it
   say wrap while you are in there?"

## What to do

Work in the source tree, repair the **root cause** of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the nine grid families and their wrap variants and the seven sizes each
of them offers, the Grid: and Size: bars and what they link to, the daily puzzle
found by date, the custom page's form and its automatic first board and its
off-main-thread generation, the settings panel and the fact that every setting is
remembered, the resume-into-your-unfinished-puzzle behavior, the zoom and pan and
rotation controls and the timer, the stats panel's structure (its four rows, the
Current and Best columns, the solved-count line and the improvements area), the
`--:--` placeholders a genuinely empty history produces, the changelog and the
example gallery on the home page, the tab title exactly as it is shipped, and the
error page for an address that does not exist - none of which any report asks you
to change.

Reports 8 and 9 describe behavior that is **correct as shipped**: verify them
before touching anything, and note that "fixing" either of them is measured as a
regression.

The project must still build cleanly when you are done: the harness builds it
with the project's own tooling and serves the resulting static directory from the
site root. Repairing a symptom by weakening the build, deleting a component,
hardcoding a value the app computes, or special-casing the pages the reports
happen to mention is not a repair and will be measured as a regression.
