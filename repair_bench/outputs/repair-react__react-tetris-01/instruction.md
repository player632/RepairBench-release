# Repair Task - react-tetris (React)

You are working on the source code of **react-tetris**, the classic Tetris
game written in React + Redux + Immutable.js: a 20x10 playfield rendered as
a cell matrix, a next-piece preview, score / high-score / cleared-lines
counters, a start-line setting, pause and sound toggles, and a keyboard
panel (rotate, left, right, soft drop, hard drop, reset, pause, sound) that
mirrors the physical keys (arrow keys, space, R, P, S). Finishing a game
saves the score, the high score and the cleared-line count to the browser's
local storage, and the next visit resumes from that record. The project
lives in this workspace; it builds with
`npx webpack --config webpack.production.config.js`
(the production bundle is emitted to `docs/`, which is served as the site
root). The app is fully offline - there is no backend and all data is
local.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "I came back the next day to beat my record and the game had forgotten
   everything - my score, my high score, all of it. It is supposed to
   resume from where I left off; the save was definitely there before I
   reloaded."

2. "Scoring feels broken. Every time a piece locks in I only get a single
   point. It used to be a proper chunk of points per lock, now it crawls
   up one by one."

3. "My high score never goes up anymore. I cleared line after line, the
   current score climbed past the old record, and the record display just
   sat there untouched."

4. "Something is off with the T piece. When I rotate it twice it ends up
   shifted one column to the side of where it used to land. Other pieces
   rotate fine as far as I can tell."

5. "The left arrow moves my piece to the RIGHT. I press left, it slides
   right. Right arrow seems normal. I checked my keyboard with other
   games, it is fine."

6. "Hard drop does not drop all the way. I hit space and the piece stops
   floating a couple of rows above the floor, and then the next piece
   starts. It used to slam straight to the bottom."

7. "The start-line setting on the title screen goes the wrong way. I tap
   the down arrow and the number counts UP - I want to lower the starting
   rows, it keeps climbing (and wraps around at the ends). Up does the
   opposite."

8. "Pause does not actually pause. I press pause and the 'paused' state
   shows, but the piece keeps falling in the background. By the time I
   unpause it has dropped several rows."

9. "Game over way too early. My stack was still low, nowhere near the top,
   and the game just ended on me after a lock. Happens again and again
   once there is any decent pile on one side."

10. "When I clear two lines with one piece, the cleared-lines counter only
    goes up by one. I had a double clear for sure - the rows both
    vanished - but the counter said one."

11. "Every time I open the game it plays a short game-over animation
    before the board is ready. Looks like a crash recovery to me - is the
    game broken on startup?"

12. "The music starts playing by itself the moment the page loads. I did
    not press anything. Can you make it start silent?"

Fix every genuine defect so the game behaves as a correct implementation
of this codebase would. Leave intended behavior alone.

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
