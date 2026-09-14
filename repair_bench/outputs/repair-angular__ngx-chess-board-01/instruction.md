# Repair Task - ngx-chess-board (Angular 17 chess board library + demo page)

You are working on the source of **ngx-chess-board**, an Angular library that
renders a playable chess board, together with the small demo application that
ships beside it in the same workspace. The demo page is what the harness loads
and what the users below are talking about; the behaviour they describe is
produced by the library underneath it. Unlike a plain static page, this tree is
**built before it is served**: the workspace holds two Angular projects (the
library and the demo app), the dependencies are already installed, and the
verifier compiles the demo app and then serves the compiled output.

The demo page reads top to bottom. A heading names it. Under the heading sits the
board itself, 400 pixels square and centred, with the eight file letters running
along the bottom (`a` to `h`, left to right) and the eight rank numbers running
down the left side (`8` at the top down to `1` at the bottom) - that is the
ordinary White-at-the-bottom orientation the page starts in. The pieces are the
usual 32, in the usual starting array, and they can be dragged.

Below the board is a column of controls:

- three text inputs for the **light tile colour** (it starts as `#BAA378`), the
  **dark tile colour** (it starts as `rgb(97, 84, 61)`) and the board **size** in
  pixels (it starts as `400`);
- four buttons - **Reset**, **Reverse**, **Undo** and **Display moves**. Reverse
  turns the board through 180 degrees so Black sits at the bottom;
- five small on/off switches, each with a live caption next to it: *Piece dragging
  is ON*, *Drawing with right mouse button is ON*, *Light tiles are ON*, *Dark
  tiles are ON*, *Free mode is OFF*;
- a **FEN** text box holding the standard starting position string, with **Set
  FEN** and **Show FEN** buttons beside it;
- a **PGN** text area, empty when you arrive, with **Set PGN**, **Show example
  PGN** and **Get PGN** buttons;
- a **Manual move** box, pre-filled with `d2d4`, and a **Move** button: typing a
  from-to pair such as `e2e4` or `e1g1` there and pressing Move makes that move on
  the board through the engine, exactly as dragging it would;
- an **Add piece** box pre-filled with `a4`, two dropdowns for piece type and
  colour, and an **Add** button.

Every time a move is made - by dragging, or through the Manual move box - the page
writes the resulting position back into the FEN box and the resulting move list
back into the PGN box. Those two boxes are therefore the readable record of what
the engine thinks the position and the game history are, and they are where almost
every complaint below shows up.

Environment notes - properties of this offline harness and of the seed, not
defects:

- There **is** a build step. The verifier installs nothing and reaches nothing on
  the network; it compiles the demo app with the workspace's own build command and
  serves the compiled output. Dependencies are already present in the tree, so
  repair the code in place and make sure it still compiles - a tree that does not
  build scores nothing at all. Do not add a new package, a new registry
  dependency, or a second build system.
- There is no network access, and nothing on this page needs it. The one
  third-party analytics snippet the upstream tree used to load has already been
  taken out for you, because it was the only thing in the tree that reached off
  this origin and no behaviour of the board depended on it; that removal is
  harness furniture, not a defect, and there is nothing for you to restore.
- The page really is unstyled apart from its dark background and white text. The
  button and input class names in the markup have no stylesheet behind them in
  this tree, so the controls render as plain browser widgets. That is how the seed
  ships and it is not one of the things you are being asked to fix.
- The harness drives the page in a real browser at a **1280x720 viewport**. The
  board is 400 px square at the top and the controls run down below it, so the
  page is taller than the window and the lower controls are reached by scrolling.
- Four of the buttons - **Reset**, **Show FEN**, **Get PGN** and **Display moves** -
  also pop up a browser alert box. The harness dismisses those pop-ups on its own
  and reads nothing from them; what matters is what each button leaves behind in
  the board, the FEN box and the PGN box. Do not remove the alerts and do not rely
  on them.
- Every check starts from a freshly built, freshly loaded page in a fresh browser
  context, so nothing - not a position, not a move list, not any stored value -
  carries over from one check into the next. The page also keeps nothing of its
  own anywhere: it writes no cookies, no local storage and no session storage, and
  that is how the seed is meant to behave.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses, and note that they do not cover
everything that is wrong:

> **Report 1.** "I open the page and play the obvious first move - I type `d2d4`
> into the Manual move box and press Move. The board is right, the pawn is on d4.
> But look at the FEN it prints: the little field that's supposed to name the
> square a pawn just skipped over says `e6`. It should say `d3`, the pawn came
> from d2. Weird part: if I press Reverse first and then play the same kind of
> move, that field looks correct. So it's only wrong the normal way up, which is
> the way I actually use."

> **Report 2.** "The castling part of the FEN is backwards. Straight after loading
> it reads `kqKQ` where it should read `KQkq`. Capital letters are White's rights
> and small letters are Black's - everybody knows that - so right now the page is
> telling me Black can still castle and White can't, on a board where nobody has
> moved anything."

> **Report 3.** "Knights are being written down as bishops. I play `g1f3` and the
> move list says `Bf3`. It should be `Nf3`; `B` is the bishop and there is no
> bishop involved. I'm also pretty sure reading a game back in is broken the same
> way - I pasted a score with knights into the PGN box and pressed Set PGN and the
> position I got was not the position I expected - but I haven't proved that part,
> I mainly noticed it in the move list."

> **Report 4.** "The Reverse button only does half its job. Press it and the
> letters along the bottom do flip, `h` is now at the left. But the numbers down
> the left side don't move at all - still `8` at the top and `1` at the bottom.
> After reversing they should read `1` at the top down to `8`, otherwise the
> labels on the side of the board simply don't name the squares they're next to
> any more."

> **Report 5.** "Undo puts the piece back where it came from and the FEN box does
> go back to the previous position, so far so good. But the move list doesn't
> shrink. I play `d2d4`, the list says `1. d4`, I press Undo, the board and the
> FEN are back to the start - and the list still says `1. d4`. Take back two moves
> and both are still listed. The history and the board have stopped agreeing."

> **Report 6.** "King-side castling drops the rook in the wrong place. I set up a
> position where White can castle, play `e1g1`, and the king arrives on g1 like it
> should - but the rook ends up on e1, right in the middle of the back rank,
> instead of on f1 next to it. The FEN's back rank comes out wrong too, naturally."

> **Report 7.** "The move list has lost all its numbering. It used to read
> `1. d4 d5 2. c4` and so on. Now it's just one long run of moves with no numbers
> in front of them at all, so after a dozen moves you can't tell which move was
> White's and which was Black's. Nothing else about the list looks changed."

> **Report 8.** "The Add button is greyed out. I typed `a4` into the Add piece box,
> picked a knight and a colour, and the button stays disabled so I can't put
> anything on the board. Is that broken?"

> **Report 9.** "This thing has no memory whatsoever. I get a position set up, I
> reload the tab, and I'm back to the opening array with an empty move list. Every
> single time. Surely it's meant to remember?"

Reports 8 and 9 are worth a look but they are not what they sound like: the Add
button is disabled until Free mode is switched on, exactly as its own label says,
and the page deliberately persists nothing, so a reload really does start again
from the opening position. Neither is a defect, and neither should be "fixed" -
changing either one would break the page as it is meant to behave.

Your job is to repair the source so that the board engine, the notation it
writes, the coordinates it draws and the history it keeps all behave the way the
reports above describe them as *not* behaving, and so that everything else about
the page keeps working exactly as it does now. Not every fault in this build is
described in the reports, and the reports are not ordered by importance: expect
to find things wrong that nobody mentioned, including faults that only show up
several moves into a game or only in one of the two board orientations. Fix root
causes in the library and the demo page rather than special-casing the positions
or the move strings the users happened to quote, and leave the tree compiling.

Do not remove, rename or repurpose any data-testid attributes - they are
verification probes required by the checker.
