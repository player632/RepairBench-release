# Repair Task - minesweeper (vanilla JavaScript)

You are working on the source code of a small browser **Minesweeper** clone
written in plain JavaScript. There is no framework, no package manifest, no
lockfile, no bundler and no build step of any kind: the tree you are given is the
tree that runs. The harness serves it over plain HTTP from its own root directory
and loads the game's single top-level page, which pulls in one local stylesheet,
three classic scripts in a fixed order and a folder of local pictures. Everything
the game needs is already inside the tree, so nothing at all is fetched from the
network at runtime.

The whole interface is one table of square cells, a status bar above it and a
footer below it. The status bar carries a three-digit mine counter on the left, a
smiley face that restarts the game in the middle, and a three-digit clock on the
right. The footer carries a start button with a picture in it, the three
difficulty buttons, and a short hint about how to place a flag.

The rules the game is meant to follow:

- There are three difficulties. Easy is a 9 by 9 grid holding 10 mines, Medium is
  16 by 16 holding 40 mines, and Hard is 30 by 30 holding 160 mines. Medium is
  what the page opens on.
- The mine counter starts at the number of mines on the current grid, printed as
  three digits with leading zeroes, so a fresh Medium game reads `040`. It goes
  down by one for every flag you place and back up by one for every flag you take
  away, and you cannot place a flag once it has reached zero.
- The clock reads `000` until you make your first left click on a cell. From that
  moment it advances one second at a time, and it stops when the game ends.
- Both number readouts are red digits on a black background. That is the whole look
  of the game: it is meant to hold for the mine counter and for the clock alike, on
  every difficulty and across every restart.
- A left click uncovers a cell. A click while holding Shift toggles a flag on a
  cell that is still covered.
- Every covered cell knows how many of the eight cells around it hold a mine, and
  an uncovered cell shows that number - unless the count is zero, in which case it
  shows nothing.
- A square is labelled by where it is drawn. The top-left square of the grid is row
  0 and column 0, the square to its right is row 0 and column 1, and the square
  below it is row 1 and column 0; the row and the column a square carries always
  match the place it appears in. Anything that walks the grid in the order the
  squares sit in the page - the checker among them - relies on those labels to talk
  about the square it is actually looking at, so a square that is labelled for a
  different place than the one it is drawn in is broken even when playing with the
  mouse still feels completely normal.
- Uncovering a cell whose count is zero is meant to open up the whole connected
  blank region around it in one go, which is the only way the game clears space
  quickly.
- Uncovering a mine ends the game: the whole grid is turned face up, the cell you
  clicked is marked red, the smiley becomes a dead face, and the clock stops.
  Flags that were placed on cells with no mine behind them are shown as crossed
  out.
- The game is won once every cell that does not hold a mine has been uncovered.
- The smiley in the status bar starts a brand new game on the current difficulty,
  and the three difficulty buttons each start a brand new game on their own grid
  size.
- Every picture the page asks for is a local file that really is inside the tree,
  and every one of them really shows: the mine, the flag, the crossed-out flag, the
  faces in the status bar, the three difficulty buttons and the icon inside the
  start button at the bottom left. Nothing is loaded from anywhere else, so a
  picture that does not show is a picture the page is asking for under a name the
  tree does not hold.

Environment notes - properties of this offline harness, not defects:

- There is **no build step and no dependency install**. Do not add a package
  manifest, a bundler, a transpiler or a framework, and do not split the game into
  modules; the verifier serves the tree exactly as you leave it. Repair the code in
  place.
- There is **no network access, and nothing in this tree needs it**. Every picture
  and the one stylesheet are local files, and the two outbound links in the footer
  are ordinary anchors that the harness never follows. Nothing has been taken out
  for you: the game is self-contained exactly as delivered.
- The harness drives the game in a real browser at a **1440x900 viewport**.
- Every checkpoint starts from a freshly loaded page in a **fresh browser
  context**, so nothing at all - not a game, not a flag, not a clock reading, not
  any stored value - carries over from one checkpoint into the next.
- To make a randomly generated grid measurable, the mine placement now comes from
  a fixed, reproducible pseudo-random sequence instead of a fresh one on every
  load, so **the same grid appears every time the page is loaded**. That is
  harness furniture, not a defect. The sequence is deliberately *not* restarted
  when a game ends or when you press the smiley or a difficulty button, so a
  restart gives you a **different** grid - exactly as it did before. Do not remove
  or "tidy up" that behaviour, and do not make anything depend on its absence.
- One small strictly read-only helper is published on the page so the checker can
  ask whether the page finished loading and read a few coarse facts about the live
  game: which cells are covered, flagged or uncovered, how many mines a given cell
  touches, how many mines are left on the counter, whether the game has ended or
  been won, and how much the clock has advanced since a moment the checker marks.
  It writes nothing, holds no expectation, and is not part of the game. Leave it
  where it is; do not repair through it and do not hook your own changes onto it.
- The checker reads the game's own state, the page's own elements and their
  computed styles - not screenshots. A repair that only changes what gets painted,
  or that changes a value the game never exposes anywhere, will not be seen.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, their own noise and their own
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and one root cause can show up as more than one
  complaint.
- **At least two reports describe behavior that is actually intended.** Verify a
  report before changing anything because of it: a "fix" to normal behavior is
  itself a regression, and it is checked for.
- **Not every defect is described in these reports** in full. Each one quotes only
  what a single user happened to notice, and several of the defects have further
  consequences that nobody wrote in - a repair that merely makes the quoted
  sentence stop being true, without restoring the whole behavior around it, will
  not pass.
- At least one complaint is hiding behind another. Two broken things can cancel
  each other into a symptom that looks like neither of them, and a visibly broken
  thing can stop looking broken because a second broken thing stops it from ever
  running - so what a report quotes is not always the whole of what is wrong, and
  repairing one thing can make a second thing visible for the first time. Check the
  neighboring behavior of anything you touch, and re-check the grid, the counter,
  the clock and the end-of-game paths after you repair them rather than assuming
  they were fine.
- Several of these are one-character or one-token mistakes, and at least one looks
  like a problem in a layer that is provably healthy. Read the whole of a small
  function before you decide which line is wrong.

The reports, in no particular order:

1. "The game does not end when I hit a mine any more. I click straight onto one and
   the mine picture does show up in that one square, but that is the whole of it:
   the rest of the grid is not turned face up, the smiley stays a smiley, the square
   I clicked does not go red, the clock keeps ticking, and I can carry on clicking
   as if the game were still live. It used to be over the instant I hit one."

2. "The grid is one column short. On the normal 16 by 16 game I count 240 squares
   instead of 256: all sixteen rows are still there, but only fifteen across, so it
   is the right-hand column that is just gone. The other two sizes look short in the
   same way. Everything else about the game seems to be running on the full grid, it
   is only what is drawn that is missing a column."

3. "Placing a flag does not take the mine counter down. I shift-click one covered
   square to mark it and the flag picture appears exactly like it should, but the
   number does not move at all, where it is supposed to go down by one for a mine I
   have accounted for. The flag is definitely there - I can see it - it is only the
   number that does not follow."

4. "Clicking an empty area does not open anything up any more. I click a square that
   has no number on it and only that one square turns over - the blank region around
   it stays covered, so I have to click every single square by hand. It used to
   flood out a big patch in one click, which is the only way to actually play."

5. "The clock runs far too fast. It ticks over roughly every tenth of a second
   instead of once a second, so a game I have been playing for a minute reads as ten
   minutes. It starts at the right moment and the digits themselves are fine, it is
   only the rate that is wrong."

6. "Some of the numbers on the grid are one lower than they should be. There are
   squares with a mine right next to them that show nothing at all instead of a 1 -
   and a square that shows nothing is supposed to mean there is nothing touching it,
   so those squares are lying about their own neighbourhood. Most numbers are right,
   which is what makes this so hard to see. I cannot find a pattern in which squares
   are wrong and which are fine, and after a while I stopped trusting any number on
   the grid at all."

7. "Taking a flag back off does not give me the mine again. I mark a square, then I
    change my mind and shift-click the same square to unmark it - the flag goes away
    but the counter drops by one instead of coming back up, so it ends up lower than
    the number of mines actually left. Flag and unflag the same square ten times and
    the counter has fallen by ten. It is the unmarking that loses the count."

8. "If I click the little picture inside one of the difficulty buttons instead of
    the button's label, the game breaks completely - the grid goes to a size that
    makes no sense and the whole thing falls over. Clicking the words works fine.
    Is that a bug?"

9. "Your markup is invalid. All four of the difficulty button wrappers in the
    footer carry the very same element identifier, which is not allowed - an
    identifier is supposed to be unique in a page. Somebody should clean that up
    before it causes a real problem."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the game intact - including the
three grid sizes and their mine counts, the three-digit zero-padded shape of both
readouts, the clock starting on the first click and stopping when the game ends,
the flag toggle and the rule that a flag cannot be placed once the counter reaches
zero, the connected blank region opening in one go, the whole end-of-game sequence
when a mine is uncovered, the win condition, the smiley and the difficulty buttons
each starting a fresh game, the number shown on every uncovered cell, the row and
the column every square is labelled with, the colors and pictures the game is drawn
with, and the fact that a restart produces a different grid - none of which any report asks you to change. The tree must still
load and run exactly as it does now when you are done: no build step, no new
dependency, no module system, no network access.
