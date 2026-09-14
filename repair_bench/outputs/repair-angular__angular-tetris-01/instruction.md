# Repair Task - Angular Tetris (Angular 16)

You are working on the source code of **Angular Tetris**, a browser-based
Tetris game built with Angular (standalone components, signals and Akita
state). The project lives in this workspace; it builds with `npm run build`
and the production output is served from `dist/angular-tetris/`.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  layer than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Mid-game I press P or click the green Pause button on the cabinet and
   nothing happens - the pieces keep falling like I never touched anything.
   And on the rare chance something does get paused, pressing again does
   nothing either. The whole pause function feels dead."

2. "When you open the page - or right after a game ends - the board does
   that sweep where it fills from top to bottom once. I know that's normal.
   What's not normal: this time it fills up and never clears again. It just
   stays full."

3. "After I finish a game and I'm back on the idle screen, the score panel
   keeps showing 'Score 000000' forever. I can never see my max score
   anymore, it used to show up there."

4. "Clearing a single line should be worth 100 points, right? Lately every
   single line I clear gives me 300. Something's off with the scoring."

5. "When my stack reaches the top there is no game-over screen at all -
   the title screen never comes back, and that pause light keeps blinking
   like the whole thing is stuck. I have to reload to play again."

6. "The Next box on the side panel is frozen: it shows one piece and never
   changes, no matter how many pieces I drop. The one after next never shows
   up there."

7. "Before I even start a game, pressing P does absolutely nothing. Is the
   pause broken from the get-go?"

8. "The piece displayed in the Hold box always looks like it's unrotated -
   not matching the orientation of the piece I had in my hand when I stored
   it. Seems like a display bug to me."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` / `data-state` /
  `data-digit` / `data-active` / `data-filled` / `data-filled-count` /
  `data-game-state` attributes - they are verification probes required by
  the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
- The piece sequence is intentionally deterministic (the random source is
  pinned); do not change that behavior.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the game's behavior. Your
score reflects **how many of the defective behaviors you actually fix**
(fail-to-pass) while keeping the already-working behaviors intact
(pass-to-pass). Fixing only some of the defects gives partial credit. You
cannot see the interaction script or its expectations while solving.

## Context

- Build: `npm run build` (Angular production build; `node_modules` is
  already installed)
- Output: `dist/angular-tetris/`
- Task type: `repair` (multiple independent defects)
