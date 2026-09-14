# Repair Task - js-minecraft (vanilla JS, three.js + WebGL/2D canvas)

You are working on the source code of **js-minecraft**, a browser re-creation
of a very old version of Minecraft written in plain JavaScript. The tree is a
hand-rolled client: a procedurally generated block world (Perlin noise, caves,
trees, per-chunk sections, skylight and blocklight propagation), a player
entity with an axis-aligned collision box, gravity, jumping, sprinting, flying
and a nine-slot hotbar, a chunk mesh builder on top of three.js for the world,
a stack of 2D canvases for the chat, the debug readout, the player list and the
GUI items, a bitmap font renderer, a screen layer (title menu, create world,
options, controls, chat, creative inventory, loading, disconnect), three client
slash commands (`/help`, `/time`, `/tp`), a cookie-backed settings store and a
complete multiplayer protocol stack that this task never exercises.

The project lives in this workspace and has **no build step at all**: it is a
plain static page served from the tree root. That page loads a handful of
vendored libraries from `libraries/` as ES modules and then the client
bootstrap under `src/js/`, which loads the local texture set from
`src/resources/`. There is no package installation
to run, no bundler, no test runner and no backend; serving the directory
statically is enough to run it. There is no network access in this environment -
that is expected and is not a defect. In particular the Multiplayer menu path
and the title screen's "Quit Game" button both reach for outbound hosts that
cannot resolve here, and pasting into a text field reads the system clipboard;
none of that is part of this task.

Everything the player sees is drawn into canvases, so the visible document tree
is nearly empty and there is no text to read out of the markup. The interesting
state is the running client's own object graph: the settings record, the
command registry, the chat overlay's line list and sent-history list, the
current screen and its widget list, and - once a world exists - the world clock
and the player.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module, a different layer (screen widget vs. settings store vs. command
  dispatcher vs. chat model vs. entity) or a different code path than the one
  the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- One reported symptom can hide behind another: until the hiding defect is
  repaired, the hidden one may be impossible to reproduce at all.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "None of my settings survive any more. I switch the debug overlay on with
   F3, reload the tab, and it is off again. Same story with the options screen:
   I move a slider, close the screen, reload, and everything is back to how it
   was. It used to remember."

2. "The number row picks the wrong hotbar slot. Pressing 1 highlights the
   second slot, 2 highlights the third, and so on down the line - and pressing
   9 does not highlight anything at all. The mouse wheel still moves the
   selection, it is only the keys that are off."

3. "`/time set night` does not give me night. When the command lands at all,
   the world ends up in a washed-out dusk: the sky never goes properly dark and
   the stars are wrong for the hour. `/time set day` behaves, and giving an
   explicit number behaves too."

4. "Up-arrow in the chat box does nothing. It is supposed to bring back the
   last line I sent so I can edit it and send it again, but the field just
   stays empty no matter how many times I press it."

5. "Chat is broken. I type a sentence, press enter, and the line lands in the
   chat as bare text with no name in front of it - it does not look like
   anything I said. And nothing I type that starts with a slash runs as a
   command any more."

6. "In Options, the Render Distance slider moves the field of view. I drag it
   and the world zooms in and out; the chunk distance never changes. The FOV
   slider above it still does what it says."

7. "The spinning splash line on the title screen is misspelled. It reads
   'Minecraft written in Javascript!' with a lower-case s in the middle. It has
   always been spelled JavaScript."

8. "The 'Minecraft Realms' button on the title screen is greyed out and cannot
   be pressed. Every other button on that menu works. Is that one broken, or
   did somebody forget to wire it up?"

9. "The title screen looks frozen to me. The camera never moves, nothing seems
   to tick, and when I print the world from the console it comes back as null.
   Did the game loop die before the menu was even drawn?"

Reproducing notes, offered without diagnosis: this build has no query-string
switches, so isolation has to come from what you do after the page loads. A
world is created through the title menu (Singleplayer, then Create New World),
and the seed field accepts text; the same text seed always produces the same
terrain, which is the cheapest way to make a run repeatable. Lowering the view
distance before creating the world makes the loading lifecycle finish much
sooner. The world clock advances twenty ticks a second and the player starts
falling the moment a world exists, so prefer reading a discrete piece of state
immediately after a deliberate, repeatable action over watching a value that
changes every frame.
