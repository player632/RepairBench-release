# Repair Task - angular-rpg (Angular + TypeScript)

You are working on the source code of **angular-rpg**, a small 2D RPG built
with Angular 17 (TypeScript, NgModules, ngrx store + effects) that renders
its world on a canvas. The project lives in this workspace; it builds with
`npm run build:prod` and the result is served as a static site. The game is
fully client-side: world/character state lives in the ngrx store, and
savegames are kept in the browser's local storage. There is no backend and
the app must stay fully offline (all maps, sprites and sounds are local
assets).

Quick orientation with the game itself: on a fresh start you get a party of
three characters and begin in the starting town. You walk around the tile
map with the arrow keys, open the party screen with the round floating
button (or Escape, which also closes it again), and the party screen has
pages for the roster, the item list and the options (save, reset,
auto-save). Number keys on the keyboard toggle extra toolbars. The world
has other locations you can travel to, and outside of town random encounters
can happen while you walk - the town itself is safe.

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

1. "After I tap an arrow key just once, my party keeps walking in that
   direction forever, even though I've long released the key. The only way
   to stop them is to press the opposite direction for a moment. It's as if
   the game never notices that I let go of the key."

2. "The little message banner along the top never goes away. For example
   when I save my game, the confirmation text appears and then just stays
   there forever - still there minutes later. It should disappear on its
   own after a couple of seconds."

3. "The auto-save switch on the options page doesn't stick. I flip it on,
   and it looks on, but the next time I start the game it is off again. I
   have to flip it every single session."

4. "Saving seems broken: I click the Save Game button and I do get the
   confirmation message, but when I reload the page afterwards, the game
   starts over from scratch instead of resuming where I was. The save just
   doesn't survive."

5. "A character name looks wrong. The healer in my starting party is called
   'Wizard', but she is clearly the healer type - I'm pretty sure she used
   to have a different name."

6. "I think the party screen has its page labels mixed up. The page that
   shows my item list is titled 'Settings', while the page with the
   save/reset options is titled 'Inventory'. Looks like somebody swapped
   the two headers."

7. "When I press the '2' key, a toolbar drops down from the top with 'Gain
   Gold' and 'Level Up' buttons. That looks like leftover cheat/debug stuff
   that should not be in the game at all - it should probably just be
   gone?"

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Notes on the game

- Walking happens tile by tile on a small tick; not every tile is walkable
  (water and buildings block you), and walking around in the wilderness is
  not the same as walking around in town.
- Savegames are written to and read from the browser's local storage; a
  fresh browser profile always starts a new game.
- Some screens update from the store asynchronously - give the game a
  moment to settle before you judge a state.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build:prod`.
- The application must stay fully offline-capable; do not introduce network
  requests to external hosts, and do not add new packages or libraries.
- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the game's behavior
(booting a new game, walking on the map, the party screen and its pages,
saving/resetting, the auto-save switch, the hotkey toolbars, and reloading
from a savegame). Your score reflects **how many of the defective behaviors
you actually fix** (fail-to-pass) while keeping the already-working
behaviors intact (pass-to-pass). Fixing only some of the defects gives
partial credit. You cannot see the interaction script or its expectations
while solving.

## Context

- Build: `npm run build:prod` (Angular CLI 17 + custom-webpack;
  `node_modules` is already installed)
- Output: `dist/` static site
- Task type: `repair` (multiple independent defects)
