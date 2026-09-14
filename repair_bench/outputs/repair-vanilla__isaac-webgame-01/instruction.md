# Repair Task - THE BINDING (vanilla JS)

You are working on the source code of **THE BINDING - 地下室的束缚**, a small
browser roguelike written in plain JavaScript. A player lands on a title
screen, starts a run, and then works down through generated floors: each floor
is a handful of rooms joined by doors, you are meant to be locked into a room
until everything in it is dead, you find a treasure room and a shop on the way,
you shoot tears in whichever direction you press, you collect hearts and coins,
picked-up items change your numbers, and each floor ends in a boss room. When
your last heart goes the run is supposed to be over and a death screen is
supposed to report how the run went; when you beat the final floor you escape
and a win screen reports it instead. The project lives in this workspace and
has no build step at all: it is a plain static page - the entry point is the
page at the root of the workspace, the scripts and the stylesheet sit next to
it, and every pixel of the game is drawn by code into one canvas (there are no
image assets). There is nothing to install, no bundler, no backend and no
network access; serving the directory statically is enough to run it.

QA collected a batch of player reports about this build. They are quoted below
roughly as players wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit somewhere other than
  where the symptom shows up, and a single reported symptom can have more than
  one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

The reports, in no particular order:

1. "Rooms do not lock any more. I walk into a room that still has monsters in
   it and I can just turn around and walk back out, or carry straight on into
   the next one, with everything in there still alive. Nothing ever holds me
   until the room is finished, so I have been walking past whole fights. It
   used to be that the room shut behind me and only let me out once the last
   monster was down."

2. "Every doorway now costs me three or four seconds. I step through and the
   whole screen slides and dims and I cannot move or shoot or do anything at
   all until it finishes, and it takes an age. It is not stuck - it does
   eventually end and I am standing in the new room - but it is maybe ten times
   longer than it should be, and I keep eating a hit the moment I can move
   again because I was helpless through the whole thing."

3. "Running out of hearts does not end the run. I watched my last heart go -
   the heart row at the top was empty and my character was standing there
   getting hit - and the game just carried on. No death screen, no summary of
   the run, no button to start again, and I could still walk around and shoot
   with nothing left. I had to reload the page in the browser to get out of
   it."

4. "One touch takes far more than it should. A single monster brushing past me
   costs two or three hearts in a blink instead of one, and standing in a crowd
   empties me almost instantly. There is no moment of grace after you get hit
   any more - every contact while you are standing there bites again, and again,
   and again. The first floor kills me now."

5. "There is an item that is meant to give you extra tears. I picked it up, the
   game told me I had it, it shows in my list afterwards, and my other numbers
   moved the way they should - but my shot is exactly what it was before. Still
   one tear going out, no wider shot, nothing. I took two of them in one run and
   it made no difference. Other items I have picked up do change how I shoot, so
   it is not that items are broken across the board."

6. "Shooting is stuck on the first direction I press. I hold up to shoot
   upwards, then I press left while I am still holding up, and my tears keep
   going up. It only changes if I let go of everything and press the new
   direction on its own. It is supposed to follow the last key I pressed - that
   is how the game this is copying works, and it is what the help text on the
   title screen implies."

7. "All the end-of-run screens are up at once. From the moment my run starts I
   can see the title screen, the YOU DIED screen, the ESCAPED screen and the
   PAUSED screen piled on top of the game, all four readable at the same time,
   with their buttons sitting there. The game underneath still plays and I can
   still move and shoot, so it is not a crash - it is just that nothing that
   should be out of the way is out of the way. Pressing P still does something,
   but the pause text was already on screen before I pressed it."

8. "The help text on the title screen says phone players get an on-screen stick
   and four shoot buttons, and I can see that whole block of controls sitting in
   the page. On my laptop none of it ever appears - no stick, no buttons,
   nothing, in any situation, however long I play. Is that part of the page
   dead? It seems like a lot of work to have sitting there unused."

9. "The title screen has two links at the bottom, one to the author's code
   repository and one to their video channel. This build runs with no network at
   all, so neither of them can ever do anything useful, and they read like
   leftovers from somebody else's page. They also open in a new tab, which felt
   wrong for a game. Should they be taken out?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier serves the page statically and
  drives the app in a real browser. Focus on reading the code and fixing root
  causes.
- Everything the game draws is drawn by code onto one canvas, so do not expect
  to diagnose anything by looking at the page's markup alone.
- Keep every fix inside this workspace and preserve the existing behavior of
  everything you do not intend to change.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.
