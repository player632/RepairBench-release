Repair task: a hexagonal stacking puzzle game

## The page you are repairing

What you have is a single-page arcade puzzle game, shipped as plain browser
JavaScript. There is no framework, no bundler, no transpiler, no type step and no
dependency directory anywhere in the tree. One document at the root of the tree
loads a handful of third-party libraries that ship inside the tree, and then the
game's own dozen or so script files, in the order the document declares them. The
game runs entirely out of the globals those scripts leave behind, and the tree is
served straight off the disk: the directory that is served is the source directory,
nothing is compiled first and nothing is fetched from anywhere else, so the files
you read are the files that run.

The whole game is drawn onto one full-window canvas. There is a hexagon in the
middle with six faces it can stack blocks on, an outer grey ring marking how far
out a stack is allowed to grow before the run ends, and blocks that fall in from
outside towards whichever face they are aimed at. The player turns the hexagon so
that the falling blocks land where they are wanted; blocks that settle on a face
stay stuck to it and turn with it. When three or more settled blocks of the same
colour touch, they clear and score, and clearing several groups close together
chains a bonus. The run ends when a stack on any face grows past the outer ring.

Around the canvas the document carries the furniture of the game: a play button in
the middle of the screen before a run starts, a pause button and a restart button
in the corners during one, a help button and a help screen, a line showing the best
score so far, and an end-of-game panel with the score just achieved and a three-place
table of best scores. The panel is in the document from the start and is hidden by
the stylesheet until a run actually ends.

The game keeps a save of the running board in the browser's own storage so that
leaving and coming back resumes where you left off, and it keeps the best-score list
there too. Both are the game's own doing and both are meant to be there.

The pages are examined at a 1280x720 window with the en-US locale, and every check
starts from a freshly loaded page in a fresh browser context, so nothing - not a
score, not a saved board, not a best-score list, not a paused or un-paused button -
carries over from one check into the next.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are
starting points, not diagnoses: they are not always precise, they do not always
say which of several similar things is affected, and they do not always agree
with each other.

1. The game ramps up far too quickly now. I used to get a couple of minutes of
  gentle play before it got serious; now two or three clears in and the blocks
  are coming at me like I am several minutes into a run. It is not a small
  change - the jump is enormous, as if it skipped a whole stretch of the
  warm-up. Every game does it, right from the first clear.

2. Two blocks of the same colour sitting next to each other now disappear and
  give me points. It has always taken three. I only noticed because I was
  awarded something that should not have counted - a plain pair, side by side
  on the same face, and it vanished. Threes and fours still clear the way they
  should, so it is only the small end that has changed.

3. When I turn the hexagon, the shape itself goes one way and the blocks stuck
  to it go the other. After one turn the stack looks like it has come loose
  from the faces it was sitting on, and after two turns it is somewhere else
  altogether. Both turning keys do it; one just goes further round than the
  other. The blocks used to stay glued to their faces, I am certain of that.

4. The game never actually gets going. I press the button in the middle, it
  disappears and the pause button appears in the corner like it should, the
  grey ring is there, the hexagon is there - and then nothing ever falls. I
  have waited ten seconds, thirty seconds, over a minute. Not one block, from
  any side. The score stays at zero. Turning the hexagon still works, so the
  page is not frozen; it is only the blocks that never come. Reloading and
  starting again does exactly the same thing.

5. If I leave part way through a game and come back, the board is exactly as I
  left it - same blocks on the same faces, same shape of it - but my score has
  gone to zero. It used to carry on from whatever I had got to. It happens
  whether I close the tab or just reload, and it happens every time I have any
  points at all. Zero points loses nothing, obviously, which is why it took me
  a while to see the pattern.

6. The end-of-game screen only ever shows one high score now. It keeps three -
  there are three numbered lines printed on the panel - but the second and
  third are always zero. Play a few games and only the very best one survives;
  the other two are gone. I cleared my browser storage and built the list up
  again from nothing and it does the same: after each game over the list
  collapses back to a single entry.

7. After I pause, the little button in the corner still shows the pause
  picture. It should turn into the resume picture so I can tell that clicking
  it again will carry on - that is what it used to do. The game does pause
  properly: the board goes pale, the paused panel comes up in the middle,
  everything stops. It is only the picture on the button that never changes,
  so I keep clicking it twice and wondering.

8. When the game is paused, the panel in the middle has a big heading saying
  the game is paused and underneath it a line of text which turns out to be a
  link inviting me to buy an ad-free mobile version. That looks like an
  advertisement to me, and I would have thought pausing should just pause. Is
  it supposed to be there? It comes up every single time I pause, on the
  desktop browser.

9. Before I have played a single game the end-of-game panel already has numbers
  on it - a score of 1843 and three high-score places all showing 0. That
  looks like leftover test data somebody forgot to take out. Shouldn't that
  panel be empty until I actually lose a game?

## Not every defect is described in these reports

Not every defect is necessarily mentioned in the reports. Behaviors you break while
fixing other things still count against you.

There are more things wrong with this tree than there are reports above, and some of
the reports above describe things that are not wrong at all. Fixing only what is
listed will not finish the job. Read the game's own logic through, work out what it
is supposed to do, and check the parts nobody wrote in about - the way blocks are
arranged as a run goes on, the way a group is scored, the way one clear makes the
next one easier to chain, the exact moment a run is declared over, and the way the
running board is handed back when you resume. Each of those is measured, whether or
not anybody reported it.

Two of the nine reports above are not faults. Both are described, with what the
behaviour actually is, in the next section. Changing either of those two behaviours
to answer its report counts against you.

## Things that are not faults

Nine things in this tree look as though they might be wrong and are not. They are
listed here so that nobody wastes a repair on them, and so that nobody is tempted to
change one in order to make a symptom go away.

1. When a run is paused, the panel in the middle of the screen carries a heading and,
   underneath it, a line of text that is a link inviting the player to buy an ad-free
   mobile version of the game. That link is shipped content: it is part of the paused
   panel's own desktop wording, it makes no request of any kind, and it only goes
   anywhere if the player clicks it. It is not an injected advertisement and it is not a
   fault. Do not remove it, do not rewrite the wording, and do not stop the panel from
   appearing.
2. The end-of-game panel already has figures printed on it before a single run has been
   played: a score of 1843 and three numbered places all showing 0. Those are the
   document's own placeholder figures. The panel is hidden until a run ends, and when one
   does end the game overwrites all four figures itself. They are not leftover test data
   and they are not a fault. Do not blank them, do not renumber them and do not remove the
   panel or restructure it.
3. Three references in the tree used to point at machines outside it: an advertising
   slot loader and two analytics beacons. They now point at two small inert files that the
   harness ships inside the tree - one script and one stylesheet - and both files do
   nothing at all. That is the harness, not a fault, and it is the reason the advertising
   slot stays empty. Do not restore the outside references, do not delete the two inert
   files, do not give them any behaviour, and do not treat the empty slot as something to
   fill or as a symptom.
4. One more outside reference has been removed outright rather than repointed: a bare
   request that used to fire at the moment a run ended, sending the score to a machine
   addressed by number and throwing the reply away. With no network at all it would have
   hung every game over, so the harness deleted it. That deletion is part of the harness.
   Do not put it back, do not replace it with a request of your own, and do not add any
   other reporting, telemetry or beacon.
5. The tree used to fetch a webfont from outside. It no longer does: the tree carries
   its own local copy of the same family, and glyph fallback is unchanged. Do not re-add
   the remote reference and do not treat the absent remote font as a fault or as a
   rendering bug.
6. The third-party libraries that ship inside the tree are shipped as they are. They
   are not part of the examined surface and none of them is faulty. Do not edit them, do
   not replace them with newer copies, do not strip them down and do not remove one
   because you think the game no longer needs it.
7. Everything drawn on the canvas is drawn from scratch every frame by the game's own
   loop. The drawing itself is not faulty. Where a report says something moves the wrong
   way, or lands in the wrong place, or never arrives at all, the code that decides the
   direction, the position or the timing is wrong and the drawing is fine. Do not redraw,
   re-order, re-scale or replace any artwork, colour, geometry constant or label to make a
   symptom go away.
8. The rules of the game are the rules of the game: four block colours, six faces, a
   fixed number of rows a stack may reach before the run ends, a minimum group size for a
   clear, a scoring table that rewards bigger groups more than proportionally, and a
   chaining window that makes a quick second clear worth more. None of those is a fault
   and none of them is a knob. Do not change a rule in order to make a symptom disappear.
9. The game writes to the browser's storage in exactly two places - the save of the
   running board, and the best-score list. Both are its own and both are meant to be
   there. Do not add any other storage of any kind, do not add a preferences or configuration
   layer, do not put anything in the address bar, and do not clear, rewrite or relocate
   what the game already writes.
## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one.
  They carry no behaviour; they are how the page is addressed while it is being
  examined, and they must survive your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it needs is
  already inside the tree. Do not add a remote reference of any kind, do not assume
  anything can be downloaded, and do not reintroduce a library, a font, an icon set,
  an advertising slot or an analytics beacon from outside.
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
