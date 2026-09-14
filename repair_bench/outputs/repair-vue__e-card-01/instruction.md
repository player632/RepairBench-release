# Repair Task - e-card (Vue 3 + TypeScript)

You are working on the source code of **e-card**, a small single-page card
mini-game that imitates the "E-Card" gambling game from *Gambling Apocalypse
Kaiji*. It is built with Vue 3 (`<script setup>` + Composition API), TypeScript,
vite, vue-router, a four-locale translation layer and UnoCSS in attributify
mode. There is no backend of any kind: the whole game runs in the browser and
persists its own progress in the page's local storage.

## The game

Three roles exist - **emperor**, **citizen** and **slave** - and each side plays
with a hand of **five** cards: four citizens plus exactly one of the two special
cards. The emperor beats the citizens and loses to the slave; the slave beats the
emperor and loses to the citizens; two citizens cancel each other out. Whoever
wins a round scores **1**, a cancelled round scores **0**, and the match runs to
**eleven** points, or ends immediately the moment an emperor or a slave is
killed (the killed side loses). Roles swap every round and a full match is 21
rounds.

The single screen reads top to bottom. A narrow navigation strip on the left
carries seven nodes: the game-status button, the language button, a link out to
the source repository, a button that shows and hides the match-information panel,
a light/dark appearance toggle, a background-picture toggle and a fullscreen
toggle. The board itself holds, in order, the opponent's hand, the opponent's
**check area**, your own **check area**, your hand and the **discard area**; the
match-information panel beside it shows the round number, both roles, the result
of the last round, the two running scores and a log table with one row per
completed round.

Cards are three-dimensional: a card you hold shows its picture, a card in the
opponent's hand shows only the shared **back** pattern, and when you click one of
your own cards it flips face down, travels into your check area, and two seconds
later both check areas flip over, are compared, and the two cards move into the
discard area, where they pile up at small random angles. Clicking is rate-limited
on purpose so a player cannot play twice inside the same comparison.

On first load an opening menu covers the board with three entries - start the
game, read the rules, see the credits - and three cards animate behind it. The
rules panel spells out the ten published rules of the game, including the hand
size of five and the winning target of eleven. An address that does not match the
game is supposed to show the project's own small "404" screen.

## Building and running it

The project builds with the project's own local vite (output in `dist/`, which
is what the verifier serves from the **site root**, i.e. `http://127.0.0.1:PORT/`).
Dependencies are provisioned offline by the harness; you never need to install
anything and you never need the network. Every picture and every sound effect the
game uses ships inside the source tree.

Environment notes - properties of this offline harness, not defects:

- There is no network access and nothing in this project needs it. No request
  ever leaves the origin.
- The harness drives the app in a real browser at a **1440x900 viewport**, i.e.
  the wide desktop layout, with the board and the information panel side by side.
- Every checkpoint starts from a **fresh browser context**, so nothing - not the
  address, not any local storage, not anything held in memory by the page -
  carries over from one checkpoint into the next. A first-visit behaviour is
  therefore measured as a first visit, every single time.
- The verifier serves `dist/` with a fallback that answers the page for an
  address that is not a file, because the game's own routing needs it and because
  one checkpoint drives a genuinely unknown address into the "404" screen.
- The match-information panel is hidden at first load and is revealed by its own
  navigation button; that is intended, not a defect.

## The reports

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, **not** as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different module than
  the one the symptom appears in, and a single reported symptom can have more
  than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- **Not every defect is described in these reports.** 并非所有缺陷都有报告提及 -
  some of them nobody wrote in yet, and at least one of them is hiding behind
  another, so its own symptom cannot be seen until the first one is repaired.
  Behaviors you break while fixing other things still count against you, so
  check the neighbouring behavior of anything you touch.
- Do not "repair" anything by deleting a feature, hardcoding a value the game is
  supposed to compute, or special-casing the harness. The published rules of the
  game, the four translations, the whole navigation strip and the board layout
  are all part of the intended behaviour and are all measured.

The reports, in no particular order:

1. "I cleared my browser's site data for this page and opened it again, and the
   whole game now opens in **English**. The menu, the rules panel, the column
   headers of the round log, everything. I am Chinese and it has always opened in
   Chinese before. Strangely, once I click the language button and pick Chinese
   it behaves normally again, and it even remembers that afterwards - it is only
   the very first open, with nothing stored yet, that comes up in the wrong
   language. Something is seeding the wrong default."

2. "The **opponent's hand is dealt face up**. I can read all five of the
   computer's cards before I choose mine, including which one is the emperor and
   which one is the slave, which obviously destroys the entire game. My own hand
   is fine - it shows the pictures, as it should - and the three cards animating
   behind the opening menu are fine too, it is specifically the five cards on the
   other side of the board that should be showing their backs and are not."

3. "The **back of a card is a broken picture**. Wherever a card is supposed to be
   showing its back - and I mean the shared back pattern that every turned-away
   card uses - there is nothing there, just an empty box, and the browser's own
   developer tools say the picture address it asked for does not exist. The front
   pictures (emperor, citizen, slave) all load perfectly, and the board's four
   background pictures load perfectly, so it is only that one shared back image."

4. "**Clicking a card in my hand does nothing at all.** Not 'it plays the wrong
   card', not 'it plays twice' - nothing. It does not lift, it does not flip, it
   does not move into my check area, and the round never advances. I have waited
   minutes and clicked again and again; the very first click of the session is
   already dead, so it is not that I clicked too fast and got rate-limited. The
   rest of the buttons on the page all work, so the page itself is alive."

5. "I only get **four cards** in my hand, and the computer only gets four. The
   rules panel of this very game says each side has five cards, four citizens and
   one special card, and every screenshot I have ever seen shows five slots. Here
   there are four cards and an empty gap in the row, and it is the same on both
   sides of the board. Which special card I get still seems random, so the deal
   works, there is just one card too few."

6. "The **scoring is backwards for the emperor**. I was the emperor, I played the
   emperor against the computer's citizen - which the rules say the emperor wins
   - and I *lost* the round, the computer got the point. Then I tried the other
   way, emperor against slave, which is supposed to kill me and end the match,
   and I *won* the point and the game carried on. The citizen rows and the slave
   rows all behave correctly, it is only when I hold the emperor that the result
   is the opposite of what the rules say."

7. "The **background picture toggle goes one step too far**. I click it and the
   board background changes, click again, changes again - there are four
   backgrounds and it is supposed to cycle 1, 2, 3, 4 and then come back round to
   1. Instead the fourth click takes it to a fifth step that does not exist: the
   whole board loses its background and sits on a flat colour. One more click and
   it comes back. So the cycle is off by one at the wrap."

8. "The **discard area is untidy**. The cards that have been played are supposed
   to pile up at slightly different angles, that is the whole look of it, and I
   have seen it work. On my build the *first* discarded card lies perfectly
   straight at zero degrees and only the later ones are tilted. It is a tiny
   thing and it may well be on purpose, but it looks like a mistake, so I am
   reporting it."

9. "Not a bug exactly, more something I noticed: the **language button's tooltip
   says 'GitHub'**. When I hover the button that switches the language, the
   little browser tooltip reads 'GitHub', exactly like the tooltip on the real
   repository link next to it. Surely that is a copy-paste mistake and the
   language button should say something about language? Can you fix the tooltip
   while you are in there?"

## What to do

Work in the source tree, repair the **root cause** of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the ten published rules and their four translations, all seven
navigation nodes and what each of them does, the opening menu and its three
animated cards, the board layout and its placeholder slots, the discard pile's
tilted stacking, the round log table's five columns and its colouring, the 21
round rotation, the "404" screen, and the light/dark appearance toggle - none of
which any report asks you to change.

The project must still build cleanly and type-check when you are done: the
harness builds it with the project's own tooling and serves `dist/` from the site
root. Repairing a symptom by weakening the build, deleting a component, or
hardcoding a value the game computes is not a repair and will be measured as a
regression.
