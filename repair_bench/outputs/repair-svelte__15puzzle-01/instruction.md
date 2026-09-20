# 15puzzle — repair brief

## The application

A small progressive web app that plays the classic fifteen-tile sliding puzzle on a four-by-four
grid. The player slides a numbered tile into the single empty square next to it; the app counts the
moves and the elapsed time, offers a pause, remembers an unfinished game across a refresh, lets the
player choose a light or a dark appearance, and celebrates a completed board. It is front-end only:
no server, no database, no accounts, and after the offline adaptation described below it makes no
network requests at all.

## What you are being asked to do

The tree you are handed installs, builds and serves, and every screen renders. But a set of
behaviours are wrong. Find them, repair them in the application source, and leave everything else
working. The build must still succeed, the app must still be a playable puzzle, and the repairs must
be real: a change that makes one observed symptom disappear by disabling the feature behind it, or
that special-cases the exact situation a check looks at, is not a repair and will be caught by the
sentinels described at the end of this brief.

## Reports from users

Nine reports follow. **Seven describe things that are genuinely broken. Two describe behaviour that
is intentional upstream and must be left exactly as it is** — they are included because a
well-meaning repair that "fixes" them makes the application worse, and because telling the two apart
is part of the task.

1. Finishing a game no longer ends it. I slid the last tile into place, the board was visibly
   complete, and nothing happened at all: no completion panel, no celebration, no way to start a
   fresh game except reloading the page. It used to end the moment the board was right.

2. When a game does end, the celebration is missing. The completion panel appears, but the burst of
   coloured paper that used to fly in from both bottom corners is simply not there any more. The
   panel itself looks fine.

3. The boards look wrong from the very first deal. One of the squares shows no number at all where a
   tile should be, and I have not been able to finish a single game since it started.

4. Tiles jump across the edge of the board. A tile sitting in the first position of a row slides
   into the last position of the row above it, which should never be a legal move: the empty square
   was nowhere next to it.

5. The clock keeps counting while the game is paused. I pause, walk away for a minute, come back and
   resume, and the elapsed time has grown by that whole minute. Pausing used to stop the clock.

6. After a refresh the board and the clock come back, but my move count is gone. It always restarts
   from zero even though the rest of the unfinished game was restored correctly.

7. The left and right arrow keys move the wrong tile. Pressing left moves the tile on the right of
   the empty square and pressing right moves the one on its left, so the two are exchanged. Up and
   down still behave correctly, and clicking or tapping a tile still behaves correctly.

8. *(Intentional — do not change.)* The app always opens in the dark appearance, even on a machine
   whose system preference is light, and the corner button therefore always starts by offering a
   sun. This is how the app has always shipped: the dark appearance is its deliberate default and
   the button still alternates correctly afterwards. Please do not "repair" the first paint.

9. *(Intentional — do not change.)* Two things in the save path look like mistakes and are not. When
   a finished game is cleared, its slot is written with nothing in it rather than being deleted, and
   the restore path treats that as "no saved game" and starts a fresh one, which is the correct
   outcome. Separately, the deal loop gives up after a handful of attempts and hands back one fixed
   board; that board is a legitimate, playable, solvable arrangement, so every deal is still a
   proper game. Leave both alone.

## Not every defect is described in these reports

Not every defect is described in these reports. Some of the broken behaviour above has no user
report at all, and some reports overlap: two different underlying faults can produce what looks like
one symptom, and one fault can hide another so completely that repairing the hidden one on its own
changes nothing observable. Treat the reports as leads, not as a checklist, and read the running
application rather than the report list when you decide whether something is fixed.

## Ground rules

- Repair the application source. Do not edit, delete, add or skip any verification artefact, and do
  not weaken a check to make it pass.
- Keep the build working. The production build must still succeed and still produce a servable tree.
- Do not add network access. The app is verified offline; any new external request will hang the
  page load and every check with it.
- Do not special-case a check. Sentinels pin the behaviour that must not change — the appearance
  default, the shape and solvability of every deal, the paused clock, the restored move count, the
  untouched vertical keys, the untouched diagonal gesture, the absence of any celebration surface
  before a game is actually completed — and they are scored alongside the repairs.
- Leaving intentional behaviour alone is a correct answer. Reports 8 and 9 are traps in the ordinary
  sense: "fixing" them turns a green sentinel red.

## How the repair is verified

A headless browser drives the served application through a fixed script of interactions and reads
what the application itself reports, both before and after your repair. Checks are split in two:

- **Repair checks** are red on the tree you are handed and must turn green. Each one is the exclusive
  detector of a single underlying fault, with one deliberate exception that is registered as a
  conditional pair: two faults share one repair check because the first hides the second, so that
  check only turns green when both are repaired.
- **Sentinel checks** are green on the tree you are handed and must stay green. They cover the
  behaviour that is correct today, including the two intentional behaviours reported above, so a
  repair that breaks something else does not score.

The score is all-or-nothing across the two groups: every repair check green and every sentinel check
still green.
