# JSMinesweeper — field reports from the people who actually play it

We host a little minesweeper-and-solver page internally: a player grid, a second
mode for building and studying a position by hand, a suggestion overlay you can
switch on, and a settings dialog. Since the last round of changes the complaint
pile has grown. Below is that pile, roughly in the order the messages arrived.

A few notes on how to read it. Nobody who wrote these knows how the page is put
together, so nothing here names a file, a routine, a setting or a direction to
fix anything in — they only describe what they saw. Some of the writers are not
sure whether they are looking at a fault or at their own mistake; treat every
report the same way and use your judgement. Some of them are almost certainly
not faults at all.

---

**Report 1 — "It shouts at me when I mark one too many."**

If I put one marker too many around a number I have already opened — easy to do,
I click fast — and then I click that same number again, the status line comes
back with `Unable to continue`. It never used to complain about that. It simply
did nothing and let me carry on. Now every sloppy click earns me an error.

**Report 2 — "The overlay has its two labels backwards."**

With the suggestions switched on, the squares the page is *certain* about are
labelled the wrong way round. The ones it is sure I can open safely say `Mine`,
and the ones it is sure are actually mines say `Safe`. I nearly walked into a
loss trusting it. The in-between squares, the ones with a percentage, still read
correctly, so it is only those two definite words that are swapped.

**Report 3 — "The second visit shows my real game instead of the scratch pad."**

The first time I switch over to the by-hand mode I get the empty building grid,
which is what I expect. If I switch back to playing and then switch over a
second time, it is now showing my actual game — same dimensions, same markers,
my opened squares and all. It should still be the empty grid I was given.

**Report 4 — "Bigger squares don't make the picture bigger."**

There is a dropdown for how large each square is drawn. When I pick a larger
one, the drawing area keeps its old dimensions and the squares only pick up the
new size later on, once something else happens to redraw the whole grid. So for
a while the picture is either cropped or floating in a box that is too small.

**Report 5 — "The verdict in the by-hand mode is frozen."**

In the by-hand mode there is a line that tells me whether the position I have
built is legal and how many markers I have put in. It has stopped updating. I
add a marker, I take one away, I wait, and the verdict stays exactly what it
was — it only ever seems to report the very first position it saw.

**Report 6 — "Suggestions die the moment I have marked something."**

This is the one that annoys me most. Start a fresh game, open one square, then
mark a handful of squares as mines — nothing else, no peeking — and ask for a
suggestion. The status line says the probability engine is unable to run and
there is nothing offered at all. If I mark nothing whatsoever, the suggestion
appears normally.

**Report 7 — "Winning takes my own markers back off."**

If I finish a game having already marked some of the mines myself, then at the
instant I win those markers get removed again and the counter of mines left
climbs back up, as though the page redid my work for me and got it wrong. When I
win without having marked anything, the page marks all of them for me and that
part behaves properly.

**Report 8 — "Not sure if this is a fault: the line after my very first click."**

Straight after opening the first square the status line reads `The solver is not
running. Press the 'Analyse' button to see the solver's suggested move.` I half
expected a suggestion immediately. A colleague says that is simply how the page
is built — it only thinks when you ask it to — but I would rather that were
confirmed than assumed, so please look at it.

**Report 9 — "Not sure if this is a fault: the by-hand grid is completely empty."**

The first time I switch over, the whole grid is blank: every number zero, no
mines anywhere, and the header says I am in the by-hand mode. It looks as though
it has forgotten the board. Somebody told me this is deliberate, that the grid
is a scratch pad you build a position in rather than a copy of your game. Please
check that too before changing it.

**Report 10 — "Completely unrelated, but while you are in there."**

Two of the export links stay hidden until a game is finished, and the welcome
line still says the page is dedicated to Annie, and the little face in the
corner still changes when you win or lose. People are fond of those three
things. Nobody asked for them to move.

---

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.
