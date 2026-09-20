# Repair Task - SLUGG (vanilla JavaScript canvas game, CoffeeScript sources)

You are working on the source code of **SLUGG**, "a simple little up-going game":
an endless vertical climbing game drawn on one full-screen canvas. A small running
character climbs a stack of platforms and roadways, jumps from one to the next,
crouches and slides, and shares the screen with trains that drive along the
roadways and buildings that stand beside them. Being knocked by a train leaves the
character briefly immune while a red haze fades out. The page is a plain static
site with **no build step at all**: an entry page at the tree root creates the
canvas, loads a vendored CoffeeScript compiler that ships inside the repository,
loads a table of per-frame drawing data, and then loads fifteen small CoffeeScript
sources which that compiler fetches from the same origin and evaluates in the
browser. There is no package installation to run, no bundler, no test runner and no
backend; serving the directory statically is enough to run it. There is no network
access in this environment - that is expected and is not a defect. Nothing in the
tree tries to reach the network at runtime in any case: every picture and every
script the page uses is a local file inside the tree.

QA collected a batch of user reports about this build. They are quoted below roughly
as users wrote them - with their own steps, noise and assumptions. Treat them as
starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different source file, in a
  different layer (input handling vs. the per-step simulation vs. drawing vs. level
  generation vs. asset bookkeeping) or in a different object's code path than the one
  the symptom appears in.
- At least two reports describe behavior that is actually intended; verify a report
  before changing anything because of it.
- One reported symptom can hide behind another: until the hiding defect is repaired,
  the hidden one may be impossible to reproduce at all.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while
  fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "Space does not jump any more. I tap space while my runner is standing on solid
   ground and nothing happens at all - she just keeps running. The up arrow and the
   two letter keys that also used to jump still work exactly as before, so jumping is
   not gone; it is only that one key of the set that went dead."

2. "I can only ever move right. Holding the left arrow does nothing - the character
   keeps drifting rightwards or stands still, and I can never walk back towards the
   left end of a platform. Right works exactly like it always did. It feels as though
   the two directions are no longer being weighed against each other."

3. "Jumping from the ground throws her into the floor. I press jump while she is
   standing on a platform and instead of leaving the ground she is pushed downwards;
   she never gets airborne from a standing start. Pressing jump while she is already
   in the air still moves her upwards, which is what makes this one so confusing."

4. "Crouching lifts her off the ground. When I hold crouch her body does shrink, but
   at the same time the whole figure rises, so her feet hang in the air above the
   platform instead of staying planted on it, and she drops back down a moment later.
   Standing up again looks normal."

5. "The red haze after a knock fades about twice as fast as it used to. It is supposed
   to hang around long enough for me to walk clear of the train that hit me; now it is
   gone in roughly half that time and I get knocked twice in a row."

6. "The trains drive the wrong way. A train that is plainly facing right travels to the
   left, and the ones facing left travel to the right. Their speed looks unchanged -
   only the direction is backwards - so at first I assumed the level had simply been
   laid out oddly."

7. "The climb is much shorter than it used to be. There are far fewer levels above me
   now: the stack of platforms, roadways, buildings and trains simply stops after a
   short height and I run out of climb within a few jumps. It used to keep going for a
   very long way up."

8. "The first second of the page is frozen. I load it and the picture does not move at
   all for a moment, and then it starts running normally. Is the game loop broken at
   start-up, or is something holding it back on purpose?"

9. "Trains drive straight through the buildings. A train reaches a building at the side
   of the roadway and just keeps going, overlapping it, instead of stopping or turning
   around. It looks as though collision between trains and buildings was never
   switched on at all."

Reproducing notes, offered without diagnosis: the page reads the URL fragment at
start-up and treats two particular fragments as developer switches - one asks for a
small hand-built test level, the other turns on debug drawing - and changing the
fragment regenerates the level. Those are ordinary product features and they are
useful for isolating a report, but they also mean the level layout is not fixed from
one page load to the next, and the number of things in a freshly generated level
varies between loads. Because the game is a real-time simulation that steps on every
frame, prefer reading a discrete piece of state after a deliberate, repeatable action
over watching a value that changes every frame; a pause switch bound to a single
letter key freezes the simulation and blurs the canvas while it is on. Assets are
fetched at start-up and the frame loop holds still until the last of them has
arrived, which is why report 8 looks the way it does on a cold load.
