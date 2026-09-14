# Repair task: a dependency-free SVG chessboard widget

## The page you are repairing

What you have is a small front-end library rather than an application: a chessboard
widget written as plain ES6 modules, with no framework, no bundler, no transpiler,
no type step and no runtime dependency of its own. The board is drawn as SVG, it
reads and writes FEN strings, it animates pieces between positions, it resizes with
its container, and it can be extended - markers, arrows, a promotion dialog, saved
positions, piece rotation and an accessibility helper all ship as optional
extensions that a page can switch on.

The tree is served straight off the disk. The browser loads an HTML document and
the modules that document imports, in the order the document declares them, and the
directory that is served is the source directory. Nothing is compiled first and
nothing is fetched from anywhere else, so the files you read are the files that run.

Alongside the library the tree ships a gallery of example pages, and those examples
are the surface a visitor actually looks at. There is a page that sets different
positions with and without animation and prints a move-by-move log; a page with
move input enabled, where every input event the board emits is written into a log
block underneath the board; a page of simple view-only boards, one from White's
point of view and one from Black's; and one page per extension - automatic
markers, right-click annotation with coloured arrows and dots, saved positions,
piece rotation, and the promotion dialog. Every board on those pages is a real
instance of the library, driven by that page's own buttons, so a fault in the
library shows up on whichever example page exercises it.

The pages are examined at a 1280x720 window with the en-US locale, and every
check starts from a freshly loaded page in a fresh browser context, so nothing -
not a position, not an orientation, not a saved game, not a log line - carries over
from one check into the next.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are
starting points, not diagnoses: they are not always precise, they do not always
say which of several similar things is affected, and they do not always agree
with each other.

1. The button that turns the board round only works once. I open the animation
   example, click it, and the board flips to the other player's view as it should.
   I click it again to flip back and nothing happens at all - the board just sits
   there. I tried clicking it five or six times, waiting between clicks, and it
   never moves again. Reloading the page gives me one more flip and then it is
   stuck again. The rest of that page is fine; the position buttons all keep
   working.

2. I cannot drag a piece any more. I press down on it, drag it across to the
   square I want and let go, and the piece springs straight back to the square it
   came from. It does this every time, on every square, on both the plain input
   example and the board with the log underneath. The piece does follow the
   pointer while I am holding it down, so it is not that the drag is dead - it is
   only the letting go that goes wrong.

3. The arrow colours on the annotation page are the wrong way round. That page
   prints its own legend at the top: no modifier key gives a green arrow, Shift
   gives a red one, Alt gives a blue one and both together give an orange one.
   When I actually draw with Shift held down I get a blue arrow, and with Alt I get
   a red one. Green and orange are still right. It is as if somebody swapped the
   two middle entries over.

4. The saved-position example does not save anything. I make two or three moves on
   it, reload the page, and the board is back at the starting position. Every
   time. The example's whole purpose is to remember where you got to, and the
   moves themselves do happen on screen - the board shows them - so it is only
   the remembering that has gone.

5. The rotation animation on the piece-rotation example runs backwards. I pick
   90 degrees and the pieces jump straight to the rotated position, then slowly
   turn back towards where they started, and when the animation finishes they are
   sitting at the un-rotated angle again. So the control looks like it does
   something for a moment and then undoes it. It is the same for 180 and 270, and
   the same whether I rotate one colour or both. Turning the "animated" checkbox
   off gives the correct angle immediately, so it is only the animated path that
   is wrong.

6. Look at the board from Black's point of view on the simple-boards page and the
   row numbers down the left are wrong. White's board on the same page is right:
   the rows read 8 at the top down to 1 at the bottom. But Black's board, which
   should be the mirror image and read 1 at the top down to 8 at the bottom, shows
   exactly the same 8 down to 1 as White's does. The letters along the bottom are
   correct on both boards - it is only the numbers, and only on the Black one.

7. On the promotion-dialog example the four piece buttons do not work. I get the
   dialog to appear, and it looks right - four pieces to choose from - but
   clicking any of them does nothing at all, and the browser console shows an
   error each time I click. The rest of that page still responds, including the
   button that turns the board round.

8. On the markers example, if I click a square to put a dot on it and then click
   the same square again, the dot goes away. Is that a bug? I would have expected
   a second click to be ignored, or maybe to add a second dot, not to undo the
   first one. It happens on every square I try.

9. The "Remove dots" button on that same markers page does not clear the page. I
   put a few dots on and draw a couple of circles as well, press the button, and
   the dots go but every circle is still there. Shouldn't a button called "Remove
   dots" clean the board up? Half a cleanup feels like a half-finished feature.

## Not every defect is described in these reports

Some of the faults in this library are not mentioned by any report at all, and -
just as importantly - not everything above is a fault. You are expected to read
the code and work out what is actually wrong rather than to work down the list:
repairing only the reported items will not finish this task, and "repairing"
something that was never broken will cost you.

Two things follow from that, and they are worth stating plainly:

- The reports point at symptoms, not at causes. A symptom can be produced
  somewhere other than where it shows up, two similar-looking symptoms can have
  different causes, and one cause can show up as more than one symptom. Several of
  the reports above describe a board doing the wrong thing with a piece, and those
  are not all the same fault. Verify before you change anything.
- A fault that only shows up in one interaction path is still a fault. If a
  behaviour works when you reach it one way and fails when you reach it another
  way, both ways are part of the page, and the one that fails is the one worth
  reading.

## What is NOT a fault - leave these exactly as they ship

Every line below is either the library's own intended behaviour or an honest
consequence of running it in this harness. None of them is a defect, none of them
is something a report asks you to fix, and each of them is checked:

1. There is no build step and no dependency install, and nothing may add one. The
   tree you are given is the tree that runs, and the directory that is served is
   the source directory. The manifest that ships in the tree declares one
   development-only helper for the library's own unit-test page and nothing else;
   it is not part of the running surface. Do not add a bundler, a transpiler, a
   type step, a framework or a runtime dependency, and do not move anything into a
   build output directory.

2. Five of the pages - the entry page's own demo and four of the examples - drive
   themselves from a chess rules engine that does not live in this tree. This
   harness has no network at all, so what reaches those pages is a small local
   stand-in that reports no legal moves and no finished game. Those pages
   therefore boot, draw their board correctly and then simply never play a move,
   and the two "validate a move" examples sit waiting for input that never comes.
   That is the harness, not a fault: do not implement a rules engine, do not
   fetch one, do not hard-code a game or a move list, and do not point anything at
   a remote host. The boards on those pages are still real boards and still have
   to render.

3. Report 8 and report 9 are the page behaving as designed. Clicking a square that
   already carries your dot takes the dot off again - that toggle is the example's
   own behaviour and the page relies on it. The button labelled "Remove dots"
   removes dots and deliberately leaves circles alone; it is named after what it
   removes. Do not change either behaviour, and do not add a "clear everything"
   path, a confirmation step or a second toggle to answer those two reports.

4. The board fetches its piece artwork once, from its own origin, and caches it so
   that many boards on one page do not each re-read the same sprite sheet. That
   request is same-origin, it is expected, and it is the only request the library
   makes. Do not remove the caching, do not inline or duplicate the artwork, and
   do not add any other request of any kind.

5. Only the saved-position example writes to browser storage, and it writes a
   single key because remembering the position is that example's entire job. Every
   other page in the gallery keeps nothing at all across a reload - no storage, no
   cookies, nothing in the address bar - and that is by design. Do not add
   persistence to any other page, and do not add a settings or preferences layer
   anywhere.

6. The library prints one warning to the console when the saved-position extension
   is constructed, saying that the extension is a work in progress. That warning
   is the library's own and is not a symptom of anything. Leave it alone; do not
   silence it, and do not treat console output as something to clean up.

7. The library's own unit-test page and its headless runner sit in their own
   folder and are not loaded by any example page. They are not part of the
   examined surface. Do not wire them into a page, do not run them, do not extend
   them and do not delete them.

8. Several example pages are not examined at all - the ones that build a wall of
   boards, the one that destroys them again, the two move-validation pages and the
   sandbox pages. They still have to load and still have to render their boards.
   Do not delete them, do not stub them out and do not leave them broken because
   nothing looks at them.

9. Nothing about the artwork, the sprite sheets, the stylesheets, the board
   geometry, the piece set or the labelling scheme may be re-drawn, re-ordered,
   re-numbered or replaced in order to make a symptom go away. Where a report says
   a label is wrong, the labels are being produced by code that is wrong; the
   scheme itself is fine.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add
  one. They carry no behaviour; they are how the pages are addressed while they
  are being examined, and they must survive your repair exactly where they are.
- The pages run with no network at all and must keep doing so. Everything they
  need is already inside the tree. Do not add a remote reference, do not assume
  anything can be downloaded, and do not reintroduce a library, a font, an icon
  set or a rules engine from outside.
- Repair the behaviour a visitor experiences. Do not special-case the examination,
  do not add flags, hidden state or a hard-coded test identifier branch, do not
  write anything into the browser's storage that the page does not already write,
  and do not leave anything on the global scope that was not there before.
- Do not delete shipped content, examples, controls, copy, artwork or extensions
  to make a symptom go away, and do not reorder or rebuild a region unless the
  report you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the pages must
  still load and run exactly as they do now: no build step, no new dependency, no
  network access, and the same set of example pages reachable at the same
  addresses.
- While you are answering, do not run this project's own test, build or serve
  commands and do not start a browser of your own to check yourself. The grading
  harness measures the pages for you, and a fix that only holds up under your own
  private way of running them is not a fix.
