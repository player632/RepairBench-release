# Repair Task - solid-minesweeper (SolidJS + TypeScript)

You are working on the source code of **solid-minesweeper**, a small single-page
Minesweeper built with SolidJS, TypeScript and vite, styled with Tailwind
utility classes and using Kobalte for its popover and slider primitives. There
is no router, no backend, no account and no persistence: one screen, rendered
top to bottom.

At the top sits the title, the word "Minesweeper". Under it is a slot that
holds a terminal banner - a red "Game over :(" alert when the player has lost,
a "You win :D" alert when they have cleared the board - and next to that the
toolbar: a badge naming the current difficulty, a badge showing how many flags
are still available, a six-digit clock badge, a round red restart button, and a
small settings button that opens a card.

The settings card lists the three difficulties the app ships with - easy
(9×9 with 10 mines), medium (16×16 with 40) and hard (30×16 with
99) - each row printing its own shape, its mine count and its mine density.
Selecting a row marks it, and the card's **start** button commits the choice:
the board is rebuilt at that difficulty, the flag budget is set to that
difficulty's mine count, the clock is zeroed and the card closes. The card also
has its own **X** in its top-right corner, which dismisses it without changing
anything. The card is open when the page loads.

Below the toolbar is the board: a square grid of small cells. Left-clicking a
cell opens it. Right-clicking a cell flags or unflags it, and the flag badge
counts the flags the player has LEFT, starting equal to the mine count. Opening
a mine reveals the whole field, stops the clock and raises the game-over
banner; the restart button then builds a fresh board at the same difficulty,
clears the flags and the clock, and takes the banner down again. Opening a
square that has no mined neighbour opens it and then keeps opening outward
through the connected empty region, stopping at the ring of numbered squares
around it - except that a square the player has flagged is never opened by
somebody else's cascade, and the first square of a game is never a mine.
Numbered squares print their own neighbour count as a small digit glyph.

Under the board floats a zoom slider labelled "Zoom", with a readout of the
current zoom value; the mouse wheel over the board drives the same zoom, wheel
up magnifying and wheel down shrinking, and dragging with the mouse held down
pans the board inside its viewport.

The project builds with vite (output in `dist/`, which is what the verifier
serves from the site root):

```
./node_modules/.bin/vite build
```

Dependencies are provisioned offline by the harness, and the app makes no
network request of any kind at runtime.

Environment notes - properties of this offline harness, not defects:

- There is no network access, and nothing in this project needs it.
- The harness drives the app in a real browser at a **1280x900 viewport**. At
  that size a cell's USED width and height can sit a fraction of a pixel away
  from the size the stylesheet declares, because each row is a flexible item.
  That is layout, not a defect.
- The board is reproducible here: the board the page opens with, and every
  board a restart or a difficulty change produces, are the same on every run
  and every machine, because the harness pins this app's entropy source to a
  fixed seed. That is a property of the test environment and not something to
  undo. Consecutive boards within one session still differ from each other
  exactly as they did before.
- Every checkpoint starts from a fresh browser context, so state left over from
  an earlier interaction never carries into the next one. The app itself
  persists nothing between loads - no local storage, no cookies, no URL state.
- The harness spoofs a desktop user-agent string. This project never branches
  on the user agent, so that has no effect on anything you see here.
- The build prints two advisory lines on stderr (a vite CJS-node-API
  deprecation notice and a browserslist/caniuse-lite age notice). They are
  warnings from the toolchain, the build still succeeds, and they are not
  defects.

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

1. "The clock at the top of the screen is a digit too long. Before I have
   clicked anything it reads 0000000 - that is seven zeroes - and after I lose
   a game it reads things like 0000004. It has always been a six-digit clock."

2. "The zoom is backwards. Rolling the wheel UP over the board makes it shrink
   and rolling DOWN makes it grow, so I have to fight the gesture to get the
   size I want. The slider under the board still works the way it should."

3. "The board is giving the game away. Before I click a single square, about ten
   of them already come up looking dug-in - the flat grey colour an opened empty
   square wears - and they are always exactly the mines. I have not opened
   anything yet, so nothing should look dug."

4. "Restart does not clear the banner any more. I step on a mine, get the red
   'Game over :(' alert, press the round restart button, and the board does
   rebuild - fresh squares, flags back to ten, clock back to zero - but the
   game-over alert is still sitting there over the new game."

5. "Switching difficulty leaves the flag counter behind. I open settings, pick
   medium, press start: the board is right, it is 16 by 16 and when I
   eventually lose I can count forty mines. But the flags badge still says 10,
   exactly what easy had, so I run out of flags long before I run out of
   mines."

6. "I cannot close the settings card with its X any more. It opens over the
   board when the page loads, the little X in its top-right corner is right
   there and clicking it does nothing at all. Pressing **start** in the card
   still makes it go away, so it is only the X that is dead."

7. "This may be me misunderstanding the game, but: when I right-click a square
   to flag it, the number in the flags badge goes DOWN by one. I would have
   expected flagging to reserve a flag, not to spend one - is the budget
   running backwards?"

8. "Following on from the settings card: it is open on top of the board every
   single time I load the page. It never remembers that I closed it last time.
   Should it not remember where I left it?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the title block, the toolbar's three badges and two buttons, the
board geometry, the flag veto over the cascade, the first-click guarantee, the
zoom readout, the pan gesture, the difficulty card's own copy and the terminal
banners, none of which any single report describes in full. The project must
still build with the command above when you are done.
