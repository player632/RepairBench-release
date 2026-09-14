# Repair Task - solid-game-of-life (SolidJS + TypeScript)

You are working on the source code of **solid-game-of-life**, a small
single-page demo of Conway's Game of Life built with SolidJS, TypeScript and
vite, and styled with Tailwind utility classes. There is no router, no backend
and no account: one screen, rendered top to bottom.

At the top sits the title - the Solid logo next to the words "Game of Life".
Under it is a row of five round icon buttons, evenly spaced across the width:

1. a shuffle button (teal) that draws a brand-new random board,
2. a reset button (cyan) that clears the board,
3. a back-arrow button (blue) that steps one generation into the past,
4. a forward-arrow button (blue, labelled "Next Generation") that advances the
   board by one generation,
5. a transport button that reads "Play" (green) while the board is stopped and
   "Pause" (red) while it is running.

Below the controls is the board: a square grid of 40 x 40 = 1600 small round
cells. A dead cell is a flat dark grey. A live cell is painted with a rainbow
colour derived from its own position on the board, so a healthy board carries a
spectrum that spreads outward from the top-left corner and cells at the same
distance from that corner share a hue. When a cell changes state its colour
crosses over in about a tenth of a second rather than snapping. Under the board
floats a small round pill that reports the frame rate while the board runs,
sampling once a second.

The board is interactive. Pressing the left mouse button on a cell toggles it,
and holding that button down while dragging across the board paints the cells
you pass over; simply moving the mouse over the board without holding anything
must not change it. Pressing Play advances the board one generation per
animation frame and counts those frames, which is what the pill reports;
pressing it again stops the loop and clears the count. The app also keeps a
history of the generations it has produced (the most recent hundred), and that
is what the back arrow walks through - so it is greyed out until there is
something to go back to, and it is greyed out while the board is running. The
forward arrow is likewise greyed out while the board is running, because a
running board is already advancing itself.

The project builds with vite (output in `dist/`, which is what the verifier
serves from the site root). Dependencies are provisioned offline by the
harness, and the app makes no network request of any kind at runtime.

Environment notes - properties of this offline harness, not defects:

- There is no network access, and nothing in this project needs it.
- The harness drives the app in a real browser at a **1440x900 viewport**. At
  that size each row of the board is a flexible item, so a cell's USED width
  and height can sit a fraction of a pixel away from the size the stylesheet
  declares. That is layout, not a defect.
- The random board is reproducible here: the board the page opens with, and the
  board each shuffle press produces, are the same on every run and every
  machine, because the harness pins this app's entropy source to a fixed seed.
  That is a property of the test environment and not something to undo.
- Every checkpoint starts from a fresh browser context, so state left over from
  an earlier interaction never carries into the next one. The app itself
  persists nothing between loads - no local storage, no cookies, no URL state.
- The harness spoofs a desktop user-agent string. This project never branches
  on the user agent, so that has no effect on anything you see here.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different module
  than the one the symptom appears in, and a single reported symptom can have
  more than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.
- Do not remove, rename or repurpose any `data-rb-*` attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "the board comes up almost full. When the page loads nearly four cells
   out of five are lit, and the shuffle button hands me the same near-solid
   sheet again. It used to open with a sparse scatter, roughly one cell in
   five, and the patterns had room to move."

2. "the rule itself is wrong: a living cell with four live neighbours
   survives now. Classic Life kills that cell - it only survives with two or
   three - and I am certain this demo used to follow that. Solid blocks now
   collapse in on themselves in a single step instead of settling."

3. "I cannot draw on the board any more. Pressing the left mouse button on a
   cell and dragging does nothing at all. Stranger still, if I move the
   mouse across the cells without holding anything down, cells light up and
   go out by themselves."

4. "the frame-rate pill is backwards. While the board is running it never
   appears at all, and it only pops into view after I pause, showing a
   number that keeps climbing from however many frames it had already run. I
   never see a rate while it is actually playing."

5. "everything looks laggy now. When a cell turns on or off the colour takes
   about a second to fade across, so the picture smears behind what the
   board is really doing. It used to snap over almost instantly."

6. "the back arrow is live straight after the page loads, before I have
   stepped once. It used to be greyed out until there was something to go
   back to. It also stays live while the board is running, which it
   definitely did not before."

7. "This might be me misreading the demo, but: pressing Reset wipes the
   board completely blank - every cell goes dark and the generation history
   is gone with it. I half expected Reset to bring back the pattern the page
   opened with. Is Reset broken, or is clearing the board what it is
   supposed to do?"

8. "Following on from the frame-rate pill: when the board is just sitting
   there and nothing is running, the pill shows no number and is not visible
   at all. Should it read 0 fps while idle, or is hiding it until the board
   runs the intended behaviour?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the title block, the five-button control row, the board geometry, the
generation history, the frame counter and the rainbow painting of live cells,
none of which any single report describes in full. The project must still build
with the command above when you are done.
