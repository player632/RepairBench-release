# Repair Task - Annihilate (vanilla JS, three.js + cannon-es + XState)

You are working on the source code of **Annihilate**, a browser-based 3D
action game. The player controls maria, a sword-and-guard fighter, in a small
physics arena: she runs, jumps, dashes, air-bashes, blocks and chains guard
moves into special attacks (a fireball-style projectile, a rising uppercut and
a counter-burst), and she trades blows with a paladin carrying a shield, three
mutants, a robot, a parrot and a distant robot boss. A character row across
the top of the screen hands control over to any of those roles - and when you
take over an enemy, its own AI is suspended while every other enemy keeps
hunting you. Everything is driven by explicit state machines: one for the
page-level "which role am I" question, one per character for its animation and
combat states, and one per enemy AI for its engagement logic. Rendering is
three.js, physics is cannon-es, and the two are glued together by a per-frame
update list that copies physics bodies onto render meshes.

The project lives in this workspace and has **no build step at all**: it is a
plain static page served from the tree root, loading one ES module from `src/`
which in turn imports the vendored libraries under `lib/` and the character
models under `model/`. There is no package installation to run, no bundler, no
test runner and no backend; serving the directory statically is enough to run
it. There is no network access in this environment - that is expected and is
not a defect. In particular the small banner in the top-right corner is a
decorative outbound link to the project's public repository and simply cannot
resolve here.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module, a different layer (render vs. physics vs. state machine vs. static
  markup) or a different role's code path than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- One reported symptom can hide behind another: until the hiding defect is
  repaired, the hidden one may be impossible to reproduce at all.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "I clicked robot in the character row. The robot button greyed out exactly
   like it should, so the switch obviously registered - but I am still maria.
   The camera never travelled over to the robot, and the movement and attack
   keys still run maria around the arena. Picking robot just does not take."

2. "The character row points at the wrong slot. When I hand over to
   robotBoss, the button that greys out is the robot one, and the robotBoss
   button still looks clickable, as if I were not already playing it. Every
   other hand-over in the row highlights correctly, it is only this one."

3. "The L key stopped working. Guarding used to be on L and now maria never
   raises her guard when I press it - she just stands there. And because I
   cannot get into the guard pose from the keyboard at all, none of the guard
   combos come out either, so my whole keyboard kit is gone."

4. "The dash feels broken now. One tap of I and maria stays locked in the
   dash pose for what is easily two or three seconds before she stands up
   again. It used to snap back to standing almost immediately, so now every
   dash leaves me wide open."

5. "The enemies do not react to me any more. The paladin and the robot just
   stand where they spawned and never come at me, even when I walk right up
   to them and wait. They used to close in and swing as soon as I got near.
   It is like they cannot see me at all."

6. "The green wireframe pads mounted on the wall section of the arena do not
   teleport me. I step onto one, my character model twitches for a single
   frame, and then I am still standing exactly where I was. None of the pads
   work."

7. "The character row mislabels the slots. The mutant button is numbered 6,
   which is the same number the boss button carries. One of those two numbers
   has to be wrong - the row is supposed to run 1 through 6 in play order and
   those numbers double as the digit-key shortcuts."

8. "Every time I switch to another character the enemies keep hunting me. I
   expected the arena to hold still, or at least the enemy AI to stop, while I
   am not playing maria - otherwise the hand-over is unusable. Is the pause
   switch wired up at all?"

9. "The little frame-rate readout in the corner and the collapsible debug
   panel look dead to me. The panel object prints as null in the console, the
   readout never seems to change, and I cannot see anything being logged. Did
   somebody rip the debug tooling out of this build?"

Reproducing notes, offered without diagnosis: the page reads a few of its own
query switches at start-up (they are declared together near the top of the
source) which selectively turn off enemies, enemy attacks, damage, the debug
panel and the camera mode; they are ordinary product features and are useful
for isolating a report. Because the game is a real-time simulation, prefer
reading a discrete piece of state after a deliberate, repeatable action over
watching a value that changes every frame.
