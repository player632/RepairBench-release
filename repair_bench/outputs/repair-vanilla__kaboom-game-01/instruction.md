# Repair task: Kaboom - a "cruel but fair" Minesweeper

## What you are looking at

A single-page browser game, served as plain static files from the source root. There is no
framework, no bundler, no package manifest, no dependency directory and no build step of any
kind: the entry document at the source root loads a stylesheet, two vendored runtime libraries,
a SAT-solver wrapper and the game script as classic scripts, and every reference is relative.
Nothing is fetched from the network at runtime - the four outbound links in the "See also"
section are plain anchors the page never requests.

The game is Minesweeper with one twist, stated in its own rules section: **the mines are not
placed at the beginning, but determined as you play. There is no hidden state.** When you open a
tile, a SAT solver is asked for a mine placement that is consistent with everything already
revealed, and it deliberately picks the worst case for you - unless you are *forced* to guess, in
which case the guess is safe. Consequences you will need while reproducing the reports:

* The first tile you open is always safe, so on a board where the mine count is one less than the
  number of tiles, opening any tile immediately proves that every other tile is a mine.
* Opening a tile whose neighbourhood holds no mine floods outward, exactly like the classic game.
* A tile carries three mark states, cycled by repeated right-click: empty, flag, question mark.
* The status line under the board reads `Mines: <flags placed>/<mine count>` while playing,
  `You win!` on a win and `You lose!` on a loss.
* Four options sit beside the board: Debug mode, Allow guessing anywhere, Safe mode
  (double-click to reveal) and Countdown mode (show the *remaining* mines around a tile based on
  the flags you placed, instead of the total).
* Four difficulty buttons fill the width / height / mines boxes with a preset.
* A "Give me a hint" button prints a one-line solver verdict into a message area that is meant to
  fade away again about a second later.
* An "Undo" button takes back the last opening. It is deliberately greyed out unless Debug mode is
  on or the game has been lost.

## Your job

Twelve separate defects have been introduced into this face. Restore the behaviour. Some are one
character of polarity, some are a deleted declaration, some are two landings of one mechanism.
Nothing else may change: the rules copy, the shipped placeholder text, the option wording, the
tile geometry, the solver stack and the way the game decides a mine placement are all load-bearing
and are verified as they ship.

## 🔴 Not every defect is described in these reports

**Not every defect is described in these reports.** 7 of the 12 are
written up below; the other 5 are not mentioned anywhere and you
are expected to find them by reading the face against the behaviour the page documents for itself.
Two of the reported symptoms also interact: fixing one of them changes what you can observe of
another, so a report that stops reproducing is not necessarily a report that is fixed.

## User reports

### Report 1

> Numbers on revealed tiles are too small, and a tile that should be a 3 shows up blank/zero.

### Report 2

> The game never says "You win!" - the last safe tile is opened and the board just sits there with the mines unmarked.

### Report 3

> Right-clicking a third time to clear the "?" mark leaves the "?" painted on the tile even though the counter says it is gone.

### Report 4

> The "Give me a hint" message appears and then never fades away - it stays on screen for the rest of the game.

### Report 5

> Left-clicking a tile does nothing at all unless you tick "Safe mode" first - and then it reveals on a single click, which is what safe mode is supposed to prevent.

### Report 6

> After I change the height box, the mines field still lets me type a number far bigger than the board - the max only moves when I change the width.

### Report 7

> The mines box lost its up/down spinner and now takes letters - and typing 0 mines no longer gets rejected when I press New game.

## Two reports that are NOT defects

Both of the following were filed by users and both describe the shipped, intended behaviour. They
are recorded here so that you do not "repair" them - doing so is penalised.

### Report A - "the difficulty buttons are broken"

> Clicking *Hurt me plenty* does not start a game. It just fills in the boxes and nothing happens.

That is what the difficulty buttons are for. They write the three preset values into the width,
height and mines boxes and recompute the mines ceiling; starting the game is the **New game**
button's job and always has been. The board is deliberately left alone until you press it.

### Report B - "the Undo button does not work"

> Undo is greyed out. I cannot click it at all.

Also intended. There is nothing to undo on a fresh board, so the control is disabled until either
Debug mode is on or the game has been lost - at which point it becomes available. A greyed Undo on
a fresh board is the correct face, not a defect.

## How this is verified

The face is served statically from the source root and driven in a real headless browser at
1280x720. Every check is a scalar reading of the live document, the
computed style, the two storage objects or the page's own game instance, taken after explicit
setup waits; nothing is asserted about a monotonic clock value, so timings are measured by waiting
and then reading a frozen scalar. A strictly read-only verification facade is installed on the
window - it is enumerable so that the state-isolation sentinel can see it, it has no setter, it
caches nothing and it writes nowhere, so it cannot be satisfied instead of the game.

Reward is all-or-nothing over two partitions: the twelve failing-to-passing checks, which must turn
green, and the passing-to-passing checks, which must stay green. The passing-to-passing side
includes one territory guard per defect - the invariant beside each defect that a correct fix must
not disturb - plus the two decoy guards above, a census of the installed probes, a census of the
shipped static copy, and a state-isolation sentinel that asserts the page leaves nothing behind in
localStorage, sessionStorage, the URL or the global scope.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry no
  behaviour; they are how the board, the status line, the four options and the shipped copy are
  addressed while the face is being examined, and they must survive your repair exactly where they
  are. The probe census is itself one of the passing-to-passing checks, so a page that addresses a
  symptom by moving, retitling or thinning out the markup the probes sit on fails on that census
  even if the game plays correctly afterwards.
- Work in the source tree. Do not add dependencies and do not add a build step: this page ships as
  plain static files served from the source root and must keep doing so.
- Do not rewrite the page around the verification probes, and do not delete or rename anything the
  reports above describe as shipped behaviour.
- The page runs with no network at all and must keep doing so - everything it needs is already
  inside the tree. Do not add a remote reference, and do not assume anything can be downloaded.
- Repair the behaviour a player experiences. Do not special-case the examination, do not add flags or
  hidden state, do not write anything into browser storage that the page does not already write, and
  do not leave anything on the global scope that was not there before.
