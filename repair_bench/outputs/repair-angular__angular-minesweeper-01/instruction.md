# Repair Task - angular-minesweeper (Angular + TypeScript)

You are working on the source code of **angular-minesweeper**, a classic
Minesweeper game built with Angular 11 (TypeScript, NgModules, rxjs). The
project lives in this workspace; it builds with `npm run build` and the
result is served as a static site. The game is fully client-side: board
state lives in memory and best scores are kept in the browser's local
storage. There is no backend and the app must stay fully offline.

Quick orientation with the game itself: pick a difficulty, open squares by
clicking them, plant flags (right click, the `f` key, or a long press on
touch), use the arrow keys to move around the board, and open all safe
squares to win. The face button and the "New game" button start a fresh
board; "Game commands" opens a help popup.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "When I start a new board and click my very first square, nothing happens
   at all - it just stays closed. If I click another square afterwards the
   game suddenly behaves normally. Every single time, the first click is
   dead."

2. "The stopwatch is unreliable. I'm playing along and after I've opened a
   few squares the time suddenly jumps back to a smaller number and then
   keeps counting strangely. I timed it against a real clock - it's wrong."

3. "When I hit a mine and lose, the board never shows me where the other
   mines were. Everything just stays covered, so I can't even learn from the
   loss. The square I clicked does show the explosion, but that's it."

4. "The 'Game commands' popup ignores my Escape key. I open it, press Esc,
   and it stays there until I click something with the mouse. It used to
   close with Esc."

5. "Keyboard play is broken: I put focus on a square and press an arrow key,
   and the focus simply doesn't move. Stays where it is, no matter which
   arrow I press."

6. "I cleared the whole board - every square that wasn't a mine, I opened
   them all - and the game never declared a win. No sunglasses face, nothing
   in the scores table, I just sat there. I had literally nothing left to
   open."

7. "The flag counter counts the wrong way. I plant a flag and the number
   goes UP; I remove the flag and it goes down again. It should show how
   many flags I have left."

8. "When a fresh board loads, the stopwatch shows 000 and only starts
   counting after I open my first square. I think it should start counting
   right away with the new board."

9. "While I keep the mouse button held down on a square, the smiley face up
   top turns into a scared face for as long as I hold it. Looks like a
   glitch to me - it should probably just keep smiling."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Notes on the minefield

- The board is generated with JavaScript's `Math.random`, so mine positions
  differ from game to game; any report you reproduce may play out on a
  different layout each time.
- The first square you open in a game is special in classic Minesweeper -
  keep the usual rules of the game in mind while diagnosing.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests to external hosts, and do not add new packages or libraries.
- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the game's behavior
(opening squares, flagging, winning, losing, keyboard navigation, the help
popup, timers and scores). Your score reflects **how many of the defective
behaviors you actually fix** (fail-to-pass) while keeping the already-working
behaviors intact (pass-to-pass). Fixing only some of the defects gives
partial credit. You cannot see the interaction script or its expectations
while solving.

## Context

- Build: `npm run build` (Angular CLI 11; `node_modules` is already
  installed)
- Output: `dist/minesweeper/` static site
- Task type: `repair` (multiple independent defects)
