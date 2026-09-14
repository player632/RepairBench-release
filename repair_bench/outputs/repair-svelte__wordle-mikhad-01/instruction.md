# Repair Task - Wordle+ (Svelte)

You are working on the source code of **Wordle+**, a Svelte 3 + Vite word
guessing game: guess the hidden five-letter word in six tries. After every
submitted guess the tiles flip and reveal which letters were right (green),
present elsewhere (yellow) or absent (grey), and the on-screen keyboard
recolors to match. The game has three modes - a Daily word, an Hourly word
and an Infinite mode - switchable by tapping the WORDLE+ title or from the
settings menu. It keeps per-mode statistics, can resume an unfinished game,
supports shareable links to specific past games, and shows what the word
means once a game is over. The project lives in this workspace; it
builds with `npm run build` (Vite, output in `dist/`, served from that
directory at the site root). The app is fully offline - there is no backend.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "After I submit a word, nothing updates. The row I just played doesn't
   flip to the colored result and the keyboard keys stay their default grey,
   even though I clearly got some letters. Weird thing: the moment I start
   typing my NEXT word, the previous row suddenly shows its colors. It's
   like the display is always one word behind."

2. "That stats popup at the end of a game - the one with the played/win
   numbers, the guess distribution and the word's meaning - it's
   supposed to pop up by itself a couple of seconds after you win, lose or
   hit 'give up'. It doesn't anymore. The game just sits there and I have to
   open everything manually."

3. "The Dark Theme toggle in settings is broken. I tap it, the little knob
   slides over like it's working, but the colors of the whole app never
   change. Light or dark, it just stays whatever it was."

4. "When a game is over there's a green 'share' button in that stats popup
   that copies your result so you can paste it to friends. I click it and
   absolutely nothing happens - no 'Copied' message, and when I paste
   somewhere, my clipboard still has whatever I copied before."

5. "People send me links to specific old puzzles, they end in something
   like #daily/5 for the fifth daily puzzle. Opening one of those links used
   to load exactly that old puzzle. Now it just loads today's game and
   ignores the number completely."

6. "Infinite mode seems to think its word expires instantly. Barely a
   second into the game the refresh symbol appears in the top-left corner,
   and when I look at the end-of-game popup the countdown area is already
   showing the green refresh button instead of a timer. The timer must be
   broken, a word can't possibly be over before I've even guessed."

7. "Careful with the settings footer: I double-clicked that 'Daily word
   #...' line once and it wiped EVERYTHING - my theme, my stats, all of it.
   That's way too aggressive, it should really only reset the stats of the
   mode you're currently playing."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid`, `data-answer` or
  `data-value` attributes - they are verification probes required by the
  checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies. Word definitions come from a local provider
  that ships with the code - keep it that way.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and reasoning about it.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the application's
behavior (typing and submitting guesses, the on-screen and physical
keyboard, toasts, settings toggles, themes, statistics, the end-of-game
popup, sharing, historical games and links, mode switching, reloads). Your
score reflects **how many of the defective behaviors you actually fix**
(fail-to-pass) while keeping the already-working behaviors intact
(pass-to-pass). Fixing only some of the defects gives partial credit. You
cannot see the interaction script or its expectations while solving.

## Context

- Build: `npm run build` (Vite; `node_modules` is already installed).
  Output: `dist/`, served from the site root.
- A how-to-play popup appears on a fresh profile; it can be dismissed with
  its close button.
- The Daily/Hourly word depends on the current date; to get deterministic,
  replayable puzzles use links to historical games (e.g. `#daily/5`) or the
  historical-game picker in the settings menu.
- Task type: `repair` (multiple independent defects).
