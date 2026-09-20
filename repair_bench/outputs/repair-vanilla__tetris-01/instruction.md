Repair task: a falling-block puzzle game on a terminal-styled page


What you have is a single-page falling-block puzzle game, shipped as plain
browser JavaScript. There is no framework, no bundler, no transpiler, no
type step and no dependency directory anywhere in the tree. One document at
the root of the tree loads 15 of the game's own script files plus 1
third-party library that ships inside the tree, in the order the document
declares them. The game runs entirely out of the globals those scripts leave
behind, and the tree is served straight off the disk: the directory that is
served is the source directory, nothing is compiled first and nothing is
fetched from anywhere else, so the files you read are the files that run.

The game is played in a well ten cells across and twenty rows deep, drawn onto one
canvas. Seven different pieces, four cells each, come one at a time from the top of
the well. A side panel shows the next few pieces before they arrive, and one slot
holds a piece the player has set aside to fetch back later. The player moves the
falling piece sideways, turns it a quarter turn at a time in either direction, lets
it fall one row at a time on purpose, sends it straight to the bottom, or exchanges
it with the set-aside piece. A turn that would push the piece into a wall or into
the stack is allowed to slide it a short distance instead, using a fixed table of
candidate offsets - and the straight four-cell piece has its own table, different
from the one the other six share.

When a piece can fall no further it locks in place. Any row that is then full across
all ten cells is removed, everything above it falls down by that many rows, and the
score goes up. Removing several rows at once pays more than removing one; removing
rows in consecutive moves chains a bonus; turning the T-shaped piece into place and
clearing with it pays a special rate; and doing two of the big clears back to back
pays more again. Every fixed number of cleared rows takes the run up a level, the
counter beside the canvas counts down to that moment, and each level shortens the
interval between one automatic fall and the next. There is a top level, and reaching
it wins the run. A run is lost when a new piece has nowhere legal to appear.

Around the canvas the document carries the furniture of the game: a menu down one
side with an entry for the game itself, an entry for the page of control options and
entries about the game and about its author; a short block of playing instructions
under the menu; a table under the canvas printing the key that does what; a
promotional banner across the very top of the page with a small cross on it; four
read-out panels beside the canvas, showing the score, the number of rows still
needed for the next level, the level itself, and a running message box; and an
end-of-run panel that the stylesheet keeps hidden until a run actually ends, at
which point the game fills it in and reveals it itself.

Those four read-out panels are terminal-styled. Their text appears one character at
a time with a blinking underscore after it, and the message box scrolls its lines up
through the panel with the same short prefix in front of every line. That is the
page's own presentation and it is meant to look that way.

A separate page in the same tree lets a player rebind the keys and change how a held
key repeats. Those choices are kept in the browser's own storage and read back when
the game page loads; with nothing stored, the bindings and timings the tree ships
with are the ones in force, and they are the ones the table under the canvas prints.

Some of the artwork the page asks for is not in the tree at all - 5 of the
15 picture files it references are absent, upstream, and always have been.
Those requests fail, the affected pictures simply never appear, and the page
keeps running. That absence is a property of the tree you were handed; it is
not something your repair caused and it is not one of the things to repair.

The pages are examined at a 1280x720 window with the en-US locale, and every check
starts from a freshly loaded page in a fresh browser context, so nothing - not a
score, not a stack, not a set-aside piece, not a stored binding - carries over from
one check into the next.

## What visitors reported

9 reports came in. They are quoted as their authors wrote them. They are
starting points, not diagnoses: they are not always precise, they do not always
say which of several similar things is affected, and they do not always agree
with each other.

1. The level counter takes longer to move than it used to. I used to go up a
  level every five lines I cleared, and the little Lines panel counted down to
  it, so I always knew where I was in the level. Now it needs six, and the
  panel counts down from six as well, so the whole speed-up curve feels
  shifted - the game stays slow for ages and then ramps later than I expect.
  It is consistent, it just is not the pace it was.

2. The very first level is unplayable fast. I start a game and the piece is
  basically dropping straight to the floor, several rows a second, before I
  have got it across to where I want it. It used to fall one row at a time at
  a comfortable pace at the start and only got quick later on. This is from
  the first piece of the first game, every time, and it is not my machine -
  the rest of the page is fine.

3. Clearing three lines at once now pays out far more than clearing four. I set
  it up deliberately to check: a three-line clear gives me a huge jump, bigger
  than the four-line clear I did on the next go, and the message box still
  says the ordinary word for three lines rather than the big one for four.
  Single and double clears still look right. It is only the three-line clear
  that is out of line with the others.

4. Blocks can be pushed one column too far to the right. If I hold the right
  key the piece keeps going until part of it is off the playing field - I can
  see it sitting outside the well, over the panel beside it - and it stays
  there and locks there. It used to stop flush with the right-hand wall. The
  left wall still stops it properly, and the bottom still stops it properly,
  so it is only the right-hand side.

5. Lines never clear any more. I fill a row completely, all ten cells across,
  and nothing happens - the row just stays there and the blocks keep piling on
  top of it. I have played several games to be sure and I have never once seen
  a line disappear, so my score stays at whatever the drops and soft drops are
  worth and the game ends quickly because the field fills up. It used to clear
  one, two, three and four rows fine.

6. Rotating has gone wrong. When I turn a piece clockwise it comes out the
  wrong way round - the bit that should swing over to one side swings over to
  the other, as though it has been flipped in a mirror instead of turned. It
  looks like the piece has come loose from where it was sitting, and after two
  turns it is somewhere else altogether. Both turning keys do it; one just
  goes further round than the other. The pieces used to stay put around their
  centre, I am certain of that.

7. The queue on the right does not match what actually comes next. I plan
  around the next few pieces shown in the side panel and then a different one
  turns up, and after that the panel seems to be showing me the pieces I have
  already had. It is not random in the good way any more - it used to be a
  fair mix but you could always trust the panel. Now the panel and the piece
  that drops disagree constantly, from the very first piece.

8. There is an advert across the top of the page for some other game, in a blue
  bar, and another entry for it in the menu down the left side. It looks like
  something somebody left in by mistake and I would have thought a game page
  should just be the game. Should that be there? It is on every time I load
  the page, and there is a little cross on the bar as well.

9. The numbers on the left look broken. They type themselves out one character
  at a time with a blinking underscore after them, and the little message box
  underneath keeps scrolling lines up through it with a > in front of every
  line. It flickers the whole time I play. Is that meant to be like that? It
  looks like debug output somebody forgot to turn off.

## Not every defect is described in these reports

Not every defect is necessarily mentioned in the reports. Behaviors you break while
fixing other things still count against you.

There are more things wrong with this tree than there are reports above, and some of
the reports above describe things that are not wrong at all. Fixing only what is
listed will not finish the job. Read the game's own logic through, work out what it
is supposed to do, and check the parts nobody wrote in about - what a drop straight
to the bottom is worth per row it travels, which way the stack above a removed row
actually travels, what a quarter turn does when it is turned past the start of the
cycle, which column the straight piece appears in, and whether the bindings the page
prints and the bindings the code honours still agree with each other. Each of those
is measured, whether or not anybody reported it.

2 of the 9 reports above are not faults. Each is described, with what the
behaviour actually is, in the next section. Changing any of those 2
behaviours to answer its report counts against you.

## Things that are not faults

10 things in this tree look as though they might be wrong and are not. They
are listed here so that nobody wastes a repair on them, and so that nobody
is tempted to change one in order to make a symptom go away.

1. There is a promotional banner across the top of the page for some other
   game, in a blue bar, and a matching entry for it in the menu down the side.
   Both are shipped content: they are ordinary links that the page does not
   follow and does not fetch anything from at load time, and the cross on the
   banner hides the bar with its own inline handler. Neither is an injected
   advertisement and neither is a fault. Do not remove them, do not blank them,
   do not rewrite their wording, and do not stop the cross from working.
2. The four read-out panels type their text one character at a time with a
   blinking underscore after it, and the message box scrolls its lines up
   through the panel with a short prefix in front of every one. That is the
   page's own terminal styling: the typing interval, the blink period, the
   prefix and the scroll-on-full behaviour are all shipped presentation. They
   are not debug output, they are not a rendering fault, and they are not
   flicker to be smoothed away. Do not turn the typing off, do not remove the
   prefix, and do not restructure the panels.
3. Several references in the tree used to point at machines outside it: a
   remote webfont stylesheet, two analytics beacons, a tag-manager loader and
   two advertising-slot loaders. They now point at two small inert files that
   the harness ships inside the tree - one script and one stylesheet - and both
   files do nothing at all. The two no-script tracking pixels that went with
   the beacons have been removed outright rather than repointed, because a
   no-script body never runs while scripting is enabled and shipping a binary
   pixel stand-in would put a non-text file into a text-only patch. All of that
   is the harness, not a fault, and it is why the advertising slot stays empty.
   Do not restore the outside references, do not put the pixels back, do not
   delete the two inert files, do not give them any behaviour, and do not treat
   the empty slot as something to fill.
4. Two files that the tree used to carry have been retired by the harness: a
   single-script bundle of the game's own sources, and the page shell whose
   only job was to load that bundle. The entry document now loads the game's
   own uncompressed sources directly, in the same order that the tree's other
   copy of that document already declares them. The bundle and those sources
   are the same code, so nothing about the game's behaviour changed; the bundle
   is gone because leaving it in the tree would have handed you a second copy
   of everything. That retirement is part of the harness. Do not restore either
   file, do not re-bundle or re-compress the sources, and do not concatenate
   them.
5. 5 of the 15 picture files the page asks for are not in the tree:
   backdrop.png, endconsole.png, topbar.png, continue.png, restart.png. Those
   requests fail, the pictures never appear, and the page carries on. That
   absence is upstream and it is not a fault. Do not add artwork, do not draw a
   replacement in code, do not change any geometry or colour to hide the gap,
   and do not treat a failed request for a missing picture as a symptom of
   anything you are being asked to repair.
6. The end-of-run panel is in the document from the start and is hidden by the
   stylesheet until a run actually ends, at which point the game reveals it and
   writes its own lines into it. That is shipped structure. Do not make the
   panel permanently visible or permanently hidden, do not remove it, do not
   pre-fill it, and do not restructure it.
7. The third-party library that ships inside the tree is shipped as it is. It
   is not part of the examined surface and it is not faulty. Do not edit it, do
   not replace it with a newer copy, do not strip it down and do not remove it
   because you think the game no longer needs it.
8. Everything drawn on the canvas is drawn from scratch by the game's own loop,
   and the drawing itself is not faulty. Where a report says something goes the
   wrong way, or lands in the wrong place, or never arrives at all, the code
   that decides the direction, the position or the timing is wrong and the
   drawing is fine. Do not redraw, re-order, re-scale or replace any artwork,
   colour, cell size, geometry constant or label in order to make a symptom go
   away.
9. The rules of the game are the rules of the game: seven pieces of four cells
   each, a well ten cells across and twenty rows deep, a fixed table of
   candidate offsets per quarter turn with a separate table for the straight
   piece, a scoring table that pays more for bigger clears and more again for
   the special ones, a chain bonus for clearing in consecutive moves, a
   back-to-back bonus, a fixed number of cleared rows per level, a table of
   fall intervals indexed by level, a top level that wins the run, and a
   default set of key bindings. None of those is a fault and none of them is a
   knob. Do not change a rule in order to make a symptom disappear.
10. The game reads its key bindings and repeat timings from the browser's own
   storage, where a different page of the same tree puts them, and falls back
   to its own defaults when nothing is stored. Both the reading and the
   defaults are its own doing and both are meant to be there. Do not add any
   other storage of any kind, do not add a preferences or configuration layer,
   do not put anything in the address bar, and do not clear, rewrite or
   relocate what the game already reads.
## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one.
  They carry no behaviour; they are how the page is addressed while it is being
  examined, and they must survive your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it needs is
  already inside the tree, except for a few missing pictures that are nobody's fault.
  Do not add a remote reference of any kind, do not assume anything can be downloaded,
  and do not reintroduce a library, a font, an icon set, an advertising slot or an
  analytics beacon from outside.
- Repair the behaviour a player experiences. Do not special-case the examination, do
  not add flags, hidden state or a hard-coded test-identifier branch, do not write
  anything into the browser's storage that the page does not already write, and do not
  leave anything on the global scope that was not there before.
- Do not delete shipped content, artwork, copy, panels, buttons or libraries to make a
  symptom go away, and do not reorder or rebuild a region unless the report you are
  answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the page must
  still load and run exactly as it does now: no build step, no new dependency, no
  network access, and the same document reachable at the same address.
- While you are answering, do not run this project's own test, build or serve commands
  and do not start a browser of your own to check yourself. The grading harness
  measures the page for you, and a fix that only holds up under your own private way of
  running it is not a fix.
