# Repair Task - Arcomage HD (a React remake of the Arcomage card game)

You are working on the source code of **Arcomage HD**, a browser remake of the
Arcomage card game written in TypeScript with React 19, Redux Toolkit and a set
of redux-observable epics, bundled by Vite. It is a single-page app with exactly
one document and no router: the board, the six windows and the card zones all
live on the served root.

What is on screen: your tower and wall on one side and the opponent's on the
other, three resource counters (bricks, gems, recruits) with their per-turn
production under each tower, your hand of cards along the bottom and the
opponent's hand along the top, a discard pile, and a bar of six buttons that
open the game's windows - the tavern (the settings form: the two names, towers,
walls, resources, production, both victory conditions, hand size, AI level, a
dropdown of ready-made tavern records and a two-player panel), sound and
graphics, language, help, plus a fullscreen toggle and a link to the project.
Every window is a modal with its own cancel control. On your turn you either
play a card, which costs resources and moves the towers, or discard one; then
the opponent answers - by default an AI player, with a short delay so its move
reads as a move. A game ends when a tower reaches its victory height, when a
tower is knocked down to nothing, or when a player's resources reach the victory
amount. The settings, sound, graphics and language choices are kept in the
browser's own storage; there is no backend, and nothing in the single-player
flow talks to the network (a two-player-over-the-network mode exists in the code
and QA did not exercise it).

The project lives in this workspace and is fully offline. Dependencies are
supplied as an already-installed tree, the production build is written to
`dist/` and served as the site root, and the build writes nothing back into the
source tree. Because the machine has no network access, a few things are
degraded on purpose and are **not** defects: the page's own icon and banner
addresses are pinned to the served origin instead of the project's public site;
the offline-caching service worker and the extra legacy-browser bundle are not
produced; and the "you are about to leave an unfinished game" browser prompt is
switched off, so navigating away never shows one.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different module
  than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "The tavern form lags behind me. I change a number - the starting tower, the
   resources, anything - and the rest of the form does not react for nearly a minute. I
   put 60 in the starting tower and the victory-tower box, which is supposed to
   follow it, just sat at its old number. If I click into another box or tab out
   of the one I typed in, it snaps into place instantly, so it does work, it
   only takes ages while I keep typing. It used to catch up about a second after
   I stopped."

2. "My sound setting is forgotten every time I reload. I switch the sound off in
   the sound-and-graphics window and it stays off while I play, but after a
   refresh the sound is back on and the slider sits where it started. The
   graphics choices in that same window do come back, and so does my language -
   it is only the sound."

3. "Since I switched the interface to Arabic the layout is mirrored the wrong
   way round. The words themselves read right to left, which is correct, but the
   page is still laid out left to right, so everything sits on the wrong side.
   And when I switch back to English the page comes out mirrored instead. It is
   as if the two had been swapped over."

4. "The windows will not close. I open the tavern, or the help window, and click
   the cancel button at the bottom - nothing happens, the window stays exactly
   where it was. Clicking on the dark area outside it does not close it either,
   and neither does the Escape key. The only way out is to reload the whole
   page. Every one of the windows behaves like this."

5. "I cannot play a single card. Every card in my hand is greyed out and clicking
   it does nothing at all - not even at the start of a fresh game. I went into
   the tavern, set bricks, gems and recruits all to 99, started a new game so
   that nothing could possibly be too expensive for me, and still not one card
   is clickable. The opponent keeps playing happily."

6. "Two things about the keyboard. The reset I have always used for the graphics
   settings - Alt together with the letter O - does nothing now. And worse, if I
   press the letter O on its own, anywhere on the page, my graphics settings get
   wiped back to their defaults. I hit it by accident while I was typing my
   player name and lost the filter I had picked."

7. "Before I file this as a bug I want to be sure about it: in the tavern, if I
   raise the starting tower above the victory tower - I put 60 in the starting
   tower when the victory tower was 50 - the victory tower immediately moves to
   61 by itself. I never typed that. Is the form fighting me, or is it meant to
   keep the victory target above the starting tower?"

8. "Is the deal fixed? Every single new game both sides are dealt exactly five
   cards, and it is always five, no matter how many times I restart. I expected
   a bit of variety in the opening hand."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself during
  the session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and fixing root causes.
