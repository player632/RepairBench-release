# Repair task: Fifteen Puzzle Maker - a sliding-picture puzzle and the panel that configures it

## What you are looking at

A small zero-build browser tool with no framework, no bundler, no dependency directory and no test suite:
one entry document that is both the configurator panel and the host of the game, one engine script that
carries the whole puzzle mechanism, and a second entry document that runs the same engine with its own
hard-coded settings. Two bitmap assets and a pages-config file make up the rest of the tree.

The tool has two halves and both are in scope:

* **The panel** (left-hand column): load your own picture, set the board width and height, set how many
  pieces across and down, set how vigorously the pieces are scrambled, set how long a move animates,
  switch the piece numbers on, switch the fit-to-window behaviour on, edit the tile decoration as a style
  string, refresh the board, and finally export a standalone single-file copy of the game you configured.
  Two of those controls re-derive settings for you: loading a picture proposes a piece layout from the
  picture's own aspect, and it also recomputes the tile decoration (corner rounding and numeral size) so
  that the numerals stay in proportion to the pieces.
* **The board**: a classic sliding picture puzzle. One cell is empty; a piece that shares a row or a column
  with the empty cell can be moved, and a whole run of pieces between the clicked piece and the empty cell
  slides over in one move. You can play with the mouse, with the four arrow keys, or with a gamepad. When
  the pieces are all back in order, the game announces that you won and stops accepting moves.

The picture is cut into pieces by painting each piece with the same artwork and offsetting it, so the piece
in a given cell shows the part of the picture that belongs to that cell.

## Your job

Something in this build is wrong. Twelve separate defects were introduced into the two files that carry
behaviour. Find them, fix them, and leave everything else alone.

Your fix is measured by behaviour, not by shape: the page is served as-is, driven in a real browser, and
thirty readings are taken. Twelve of them are expected to be red on the build you receive and must turn
green; eighteen of them are green on the build you receive and must **stay** green. A fix that repairs one
behaviour while breaking a neighbouring one scores zero, so read the whole panel and the whole board before
you change anything, and prefer the smallest change that restores the documented behaviour.

## 🔴 Not every defect is described in these reports

**Not every defect is described in these reports.** 7 of the 12 are reported below in user terms, which is
58% - deliberately under the reporting budget. The other 5 are real, are measured, and are **not**
mentioned anywhere: part of the task is to notice them yourself. Several of the unreported ones sit in the
same code as a reported one, so a fix that only chases the reported symptom will leave a neighbour broken.
Nothing outside these two files needs to change, and no defect requires adding a dependency, a build step
or a network request.

## User reports

### Report 1 - "the board has too few pieces"
I ask for three pieces down and four across, which always used to give me a board four across by five down
(the empty cell is the extra one). Now the same request gives me four across by only three down. Two rows
are simply gone, there are far fewer pieces than I asked for, and the whole board is a different shape.

### Report 2 - "the picture is cut along the wrong axis"
The pieces no longer show the right part of my photo. It looks as if the picture had been sliced the wrong
way round: pieces along the left edge show slices that belong along the top edge, and only the pieces on
the diagonal look correct. The artwork itself is fine - it is the same file - and the piece sizes are right,
so it is purely which part of the picture each piece paints.

### Report 3 - "solving it does nothing any more"
When I get the last piece into place, nothing happens. It used to announce that I won and then stop
accepting moves. Now the completed board just sits there, keeps taking moves, and never says anything. I
know I solved it: every piece is in order with the empty cell last.

### Report 4 - "the piece numerals are too small"
With the piece numbers switched on, the numerals used to be sized in proportion to the pieces - big pieces,
big numerals. Now they come out clearly smaller, roughly a third smaller than they should be for the piece
size, and the corner rounding of the pieces is still correct, so it is only the numeral sizing that drifted.

### Report 5 - "my photo comes out with the wrong shape"
When I load my own picture, the board takes the wrong shape from it. A landscape photo is treated as though
it were portrait: the board is built with the two dimensions exchanged, so the pieces are stretched and the
piece layout that gets proposed for the picture is computed for the wrong aspect. The photo previews
correctly, so the file is being read - it is the dimensions that get stored the wrong way round.

### Report 6 - "the numbers toggle does the opposite"
The "Numbers" switch is backwards. When I flip it ON the piece numbers disappear; when I flip it OFF they
come back. It used to follow the label - ON meant the pieces show their numbers. The numerals render
correctly whenever they do appear, so the drawing of them is fine; it is the toggle that disagrees with
the label and with the config it is supposed to set.

### Report 7 - "the standalone export produces nothing"
The button that exports a self-contained copy of my configured game does nothing now. It used to hand me a
single file I could open anywhere, with the engine and my settings baked in. Now no file arrives, there is
no error message either, and the export just silently fails. My picture was loaded first, so the "please
upload a picture" path is not what I am hitting.

## Two reports that are NOT defects

These two look like bugs and get reported by users. They are **shipped behaviour**, they are **not** among
the twelve defects, and they must be left exactly as they are. Each is guarded by a reading that must stay
green, so "fixing" either of them scores zero.

### Report A - "the panel numbers do not match the game"
The panel's width and height fields read 1024 and 1281 and the move-time field reads 0.4, while the board
on screen is built at 512 by 640 with a move time of 0.1. **This is normal.** Those fields are inputs, not
a display of the live settings: they are seeded with the author's own last-used example values and are only
read when you actually edit one, at which point the value you typed is pushed into the board and the board
is rebuilt. Nothing is out of sync; the fields simply have not been touched yet. Harmonising the fields
with the live values (or the live values with the fields) is a behaviour change and is measured as one.

### Report B - "switching off the fit-to-window toggle does nothing and logs an error"
Turning the fit-to-window toggle off records the preference but does not rebuild the board, and the browser
console shows a reference error at that moment. **This is normal for this build.** The toggle's handler
mentions two helper names that were never defined anywhere in this tree, so when the toggle is switched off
the handler aborts halfway: the preference is stored, and the rebuild that follows in the same handler never
runs. Switching the toggle back on works normally, because that path does not touch the missing names. This
is a wart the seed ships with; it is not one of the twelve defects, no report above describes it, and
defining the missing names would make the board rebuild on a path where the verification measures that it
does not - so leave it alone.

## How this is verified

* The tree is served statically from its own root with no SPA fallback, and driven by a real headless
  browser in a fixed desktop posture (1280 by 720, en-US). No network is available: every request that does
  not go to the local server is blocked, so a fix that reaches for a CDN cannot work.
* Thirty readings are taken from the page. Twelve of them are the reported and unreported defects and must
  turn green; eighteen are territory guards around them and must stay green. Both entry documents are
  measured, and so are the panel controls, the automatic proposals, the picture upload path, the export
  path and the board mechanics.
* 🔴 **No reading asserts an absolute piece position.** The board is scrambled at random on every load, so
  an absolute reading would be a coin flip. Every reading is either a relational invariant computed from the
  board's own live settings and state (does each piece paint the slice that belongs to its own cell; does a
  run of pieces shift by exactly one cell; does the gap end up where the move says it should), or it is taken
  from a board that the panel itself can put in order: the scramble-strength field accepts 0, and with 0 the
  scrambling loop runs zero times, so the board starts ordered and every subsequent move is exact. Moves are
  driven through the page's own controls and the real keyboard, never by writing to the board directly.
* The four states are measured, not assumed: the instrumented seed must be fully green, the delivered build
  must be red on exactly the twelve defect readings and green on all eighteen guards, the same build plus
  your fix must be fully green, and one intermediate build (a single defect repaired while the others stay)
  must show that the repaired defect's reading turns green on its own. That intermediate state exists
  because two of the defects overlap on one reading: the vertical-slide defect corrupts the board that the
  arrow-key reading then measures, so the arrow-key defect can only be attributed once the slide defect is
  out of the way. Both are real; neither hides the other once separated.
* Contract: on the delivered build the verifier exits 1 and the reward is 0.0; with a complete fix it exits
  0 and the reward is 1.0. A verifier error (a missing entry document or engine) exits 2 and is not a
  behavioural red.

## Ground rules

* Change only what is needed to restore the documented behaviour. Do not restructure, reformat, rename,
  re-architect or "improve" the tool, and do not delete either entry document.
* Do not add a dependency, a build step, a package manifest, a bundler or a network request: the tree is
  deliberately zero-build and the verifier serves it as-is.
* Do not special-case the verification. The readings are taken through the page's own controls and through
  read-only observation handles that were added to the tree before the defects were; nothing is writable
  through them, and a fix that tries to satisfy a reading instead of the behaviour will leave the reading
  red and the guards red as well.
* Keep the two shipped warts in Report A and Report B exactly as they are.
* Every one of the twelve defects is a mechanism-level mistake (a wrong divisor, a dropped term, a
  transposed pair, an inverted toggle, a drifted path). None of them is a typo in a string, a colour or a
  comment, so a fix that only touches cosmetics will not turn anything green.
