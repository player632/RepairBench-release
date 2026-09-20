# Repair Task - Ouro (Phaser 3 canvas game)

You are working on the source code of **Ouro**, a local two-player browser
game built with Phaser 3 and webpack 4. It mixes snake with pong: each
player steers a snake that acts as a paddle for a shared ball, and the
snakes also crawl their own half of the court looking for food so they
grow longer. Player 1 uses W/A/S/D, player 2 uses the arrow keys. When
the ball gets past a player's side the opponent scores, the ball is
served again from the middle, and the running score is shown beside the
centre line together with a small food tally above each half. A title
screen offers a Local and an Online choice, the Local branch opens a
menu where both players pick one of four colours before the match
starts, and the [m] key is meant to mute and unmute the music. The whole
thing renders into one HTML canvas, so there are no ordinary page
elements to inspect - the score, tally, colour and scene readouts you
need are mirrored into a small fixed overlay strip, and a browser-side
read-out object installed by that same harness exposes the live scene
objects. Both are part of the prepared environment: leave them in place
and do not treat them as defects.

The project lives in this workspace and is fully offline. Install with
`yarn install --non-interactive --no-progress --network-timeout 600000`
and build with
`NODE_OPTIONS=--openssl-legacy-provider yarn run build` (webpack 4, the
site is served from the `build/` directory as the site root). There is
no backend and no network access. The remote font bootstrap that the
upstream project used to fetch at start-up has already been taken out of
this workspace so that boot needs no network at all, and the game
therefore renders with whatever local fonts the browser falls back to -
that substitution is part of the prepared environment, not something you
need to restore.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Steering as player 1 is half broken. When my snake is sliding
   sideways, pressing W or S is simply ignored and it keeps going the
   way it was. Worse, when it is already travelling straight down,
   pressing W makes it fold straight back up into its own body instead
   of being refused."

2. "My snake keeps losing its tail for no reason, and it happens all the
   time. Separately, food disappears the moment I am merely in the same
   row or the same column as it - I do not even have to reach it. It is
   as if touching is being judged far too generously."

3. "The match starts and my snake takes exactly one step, then freezes.
   It sits there for something like ten seconds, jumps one step again,
   and freezes once more. My opponent's snake does the same. The game is
   unplayable at that speed."

4. "The food tally is stuck. I keep eating and eating, but the little
   number above my half never climbs past 1 - it looks like every mouthful
   resets it instead of adding to it."

5. "The scoring is backwards. When the ball gets past my own side and I
   lose the rally, the point is added to me instead of to my opponent.
   Whoever fails to return the ball is the one who is rewarded."

6. "The colours we choose before the match come out crossed. I pick red
   for player 1 and blue for player 2 in the menu, the match starts, and
   player 1's snake is blue while player 2's is red. The menu itself
   looks correct while we are picking."

7. "The very first screen is broken. It offers Local and Online, and
   choosing Local drops me straight into the 'Online coming soon'
   placeholder instead of the colour-picking menu."

8. "The little OURO heading that sits at the top of the menu and of the
   match screen has no margin at all - it is jammed right up against the
   top edge with its text starting from the very first pixel. Looks like
   somebody forgot the padding."

9. "The court has no walls. My snake drives straight off the top of the
   screen and comes back in at the bottom, and the same the other way
   round, instead of dying when it hits the edge. Surely that is not how
   it is supposed to work."
