# Repair Task - cursedSouls (vanilla JavaScript roguelike)

You are working on the source code of **cursedSouls**, a small browser roguelike
written in plain JavaScript on top of a vendored copy of the ROT.js engine. There
is no framework, no package manifest, no lockfile, no bundler and no build step of
any kind: the tree you are given is the tree that runs. The harness serves it over
plain HTTP from its own root directory and loads the game's single top-level HTML
page, which pulls in fourteen classic scripts in a fixed order and one stylesheet.
Everything the game needs, the engine included, is already inside the tree, so
nothing at all is fetched from the network at runtime.

The game draws into one character-cell display surface built by the engine and
attached to a single empty container element in the page. There are no buttons, no
forms, no links, no menus and no other elements of any kind: the whole interface is
glyphs on that one surface and the whole input is the keyboard. Movement is the
hjkl set plus the four arrow keys, waiting in place is z or the period key, and a
small set of fixed keys handles confirming, cancelling, the help screen, the
achievement list and a handful of developer aids.

You play a spellcaster descending a three-floor dungeon. Orbs are everything: the
bag holds at most six of them, they come in five kinds, they are spent to attack
and to cast, and they are also the player's health - taking a hit spends orbs out
of the bag, and a hit that would take more orbs than the player is carrying ends
the run. A run starts with a documented five-orb kit. Monsters are generated per
floor from a fixed four-group composition, they act on the same turn clock the
player does, and the floor is only revealed inside the player's field of view.
Clearing a floor and taking the stairs down is the one moment the game persists
anything, and the next run is meant to start one floor deeper with the orbs the
player finished on. Beating the third floor wins.

Environment notes - properties of this offline harness, not defects:

- There is **no build step and no dependency install**. Do not add a package
  manifest, a bundler, a transpiler or a framework, and do not split the game into
  modules; the verifier serves the tree exactly as you leave it. Repair the code in
  place.
- There is **no network access, and nothing in this tree needs it**. There is no
  third-party script, no web font, no CDN stylesheet and no analytics counter
  anywhere in the tree, and nothing has been taken out for you: the game is
  self-contained exactly as delivered.
- The harness drives the game in a real browser at a **1440x900 viewport**.
- Every checkpoint starts from a freshly loaded page in a **fresh browser context**,
  so nothing at all - not a run, not a floor, not a monster, not any stored value -
  carries over from one checkpoint into the next.
- To make a randomly generated dungeon measurable, the harness boots the game
  through the developer mode the seed itself already provides and pins a fixed run
  seed into the page's storage before loading. That is harness furniture, not a
  defect. It means a run starts directly inside the dungeon, on a known floor, with
  a reproducible layout, a reproducible monster placement and a reproducible
  starting bag. Do not remove or "tidy up" the developer mode, the seed pinning, or
  the generation log the game prints when both are active, and do not make any
  behaviour depend on their absence.
- One small strictly read-only helper is published on the page so the checker can
  ask whether the boot finished and read a few coarse facts about the live run. It
  writes nothing, holds no expectation, and is not part of the game. Leave it where
  it is; do not repair through it and do not hook your own changes onto it.
- The game renders into a single drawing surface, so **nothing here is checkable by
  looking at pixels**. The checker reads the game's own public state instead: the
  values its functions return, the entities and components it already exposes on its
  one global object, and the page's storage. A repair that only changes what gets
  drawn, or that changes a value the game never exposes, will not be seen.

QA collected a batch of user reports about this build. They are quoted below roughly
as users wrote them - with their own steps, their own noise and their own
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the one
  the symptom appears in, and a single reported symptom can have more than one root
  cause behind it.
- At least one report describes behavior that is actually intended; verify a report
  before changing anything because of it.
- **Not every defect is described in these reports.** Some of them nobody has written
  in yet, and at least one of them is hiding behind another: a broken behavior you
  cannot currently get a readable answer about, because a different defect destroys
  the very value it would be read from, still counts against you once that value
  becomes readable again. So check the neighbouring behavior of anything you touch,
  and re-check the seed, floor, visibility and turn-cost paths after you repair them
  rather than assuming they were fine.
- Several of these are one-token mistakes, and at least one looks like a problem in
  a layer that is provably healthy. Read the whole of a small function before you
  decide which line is wrong.

The reports, in no particular order:

1. "I keep dying one orb too early. When a hit takes exactly the last of my orbs -
   the bag goes completely empty - I expect to be left standing there with nothing,
   and that is what always used to happen. Now the same hit kills me outright. If
   the hit is smaller than my bag I survive fine, and if it is bigger than my bag
   then obviously I die, so it is only the exact-match case that has gone wrong. It
   happens every single time, on every floor."

2. "the orb economy is out by one. I took a hit that should have cost three orbs out
   of the five I was carrying and I still had three left afterwards, not two. It is
   consistent - every hit seems to cost one orb fewer than it should. The very
   smallest hit is fine though: a one-orb hit does take exactly one orb, so it is
   not that damage is being ignored altogether."

3. "my character will not walk. I press a direction key - any of them, the arrows or
   the hjkl set - and I end up exactly where I started. It is not frozen though: the
   turn still passes, the monsters still get their move, the screen still redraws,
   and it all looks like the game accepted what I did. Standing still on purpose
   works, and the keys are clearly being read because everything else responds. I
   also cannot bump into a monster to attack it any more, I just stand there next to
   it."

4. "the seed printed on screen is not the seed I typed in. I set 1234567890 and the
   game shows me 67890-12345. Same ten digits and the same hyphen in the middle,
   just the two halves the wrong way round, so when I read the seed off the screen
   and give it to a friend they get a completely different dungeon. The dungeon
   itself is fine and it is the same one every time I use the same seed, so it is
   only the display that is lying to me."

5. "a brand new run starts on the second floor. I clear everything out, start fresh,
   and I am not in the Churchyard - I am one level down, and I do not get the usual
   starting orbs either, I begin with an empty bag. It is as if the game thinks I am
   continuing a save that does not exist. When I really do have a save it reads the
   right floor, so it is only the nothing-saved case that is wrong."

6. "going down the stairs does not take me any deeper. I finish a floor, the game
   tells me my progress was saved exactly like it always does, and the next time I
   load I am back on the floor I just cleared instead of the one below it. I can do
   it three times in a row and I am still on the same floor. The messages are right
   and there is definitely a floor number being kept somewhere, it just never
   moves."

7. "monsters do not line up on me any more. Things that used to come straight down a
   corridor at me when I stood in their row or their column just mill around
   instead, as if they thought I was off at a diagonal even when I am standing dead
   centre of their line. It is worst in the open halls where there is nothing
   between us. Oddly, when a monster is right on top of me it still behaves
   normally."

8. "every time I refresh the page my run is gone. There is no continue option, no
   save slot, nothing comes back, and I cannot find a save button anywhere in the
   game. Did the saving break, or does this thing not save at all?"

9. "I want to play the same dungeon twice and I cannot. Every run is a completely
   different layout with different monsters, even when I did not ask for a new one.
   Is the generator ignoring my seed?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the three-floor descent and its per-floor monster composition, the
six-orb bag and the documented five-orb starting kit, the keyboard bindings for
moving, waiting, confirming, cancelling, help and the achievement list, the field of
view and the fog of war, the turn clock and the fact that one ordinary action costs
one turn, the seed the player types being the seed the run actually uses, the seed
shown on screen being the seed the run actually uses, the floor a saved run resumes
on, the achievement list and its nine entries, the generation log printed in
developer mode, the fact that a run is deliberately wiped when a dungeon is
entered, and the fact that a run with no seed pinned gets a fresh random one - none
of which any report asks you to change. The tree must still load and run exactly as
it does now when you are done: no build step, no new dependency, no module system,
no network access.
