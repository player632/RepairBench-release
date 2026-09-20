# Repair Task - vue-maze (a browser maze game drawn on a canvas)

You are working on the source code of a small single-page **maze game**. It is
TypeScript on Vue 2, bundled by vue-cli 4 into a static `dist/` directory that
gets served as plain files. There is no backend, no router and nothing kept in
browser storage: one page, one maze, one little figure you walk with the arrow
keys.

`npm run build` is the whole build step: it bundles into `dist/`, which is the
directory that gets served. A source edit only becomes visible after a rebuild.

What the one page shows, in the words of someone using it:

- two drop-downs at the top. The first picks how **difficult** the maze is
  (Easy, Normal, Hard): a harder choice means a smaller square and therefore a
  much bigger maze. The second picks **how the maze is made** - the default
  style grows a tangle of short dead ends, the other style digs one long
  winding corridor instead.
- the maze itself, drawn as a grid of squares with walls between them, sitting
  in the middle of the page with a band of empty page all the way round it.
- a little **bird** figure that you walk with the arrow keys. It starts in the
  top left corner, and it can only step through a gap in a wall.
- a **flag** in the bottom right corner: that is where you are going. Walking
  onto it flashes a short celebration over the maze and then, roughly four
  fifths of a second later, the page throws that maze away, builds a brand new
  one and puts the bird back at the beginning.
- a **stopwatch** readout in milliseconds. It stays at zero until you take your
  first step, then it counts up, and it stops when you reach the flag.

## Things that are true of this build and are not defects

- The page needs **nothing from the network** while it runs. Both pictures it
  uses are carried inside the bundle, and no check depends on any server other
  than the one serving `dist/`.
- The measurement object the harness installs on the window is read only: it
  reports what the app is doing and has no way of changing it. Do not remove,
  rename or repurpose it, or any probe attribute the harness adds to the tree -
  they are verification probes required by the checker.
- Both maze styles build a **fresh random** layout every single time one is
  needed, so two runs never give you the same maze. No check depends on one
  particular layout; what is guaranteed is that the squares you can reach always
  connect the starting corner to the flag.
- Every check runs in a browser window of 1280x720.
- The tree must still build with `npm run build` when you are done, and must
  still need nothing from the network.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as a place to start, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different part of the
  page than the place where the symptom shows up, and a single reported symptom
  can have more than one root cause behind it.
- At least one report describes behaviour that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviours you break
  while fixing other things still count against you.
  并非所有缺陷都有报告提及；修别的问题时弄坏的行为同样会扣分。

The reports, in no particular order:

1. "In the default maze style the way out is missing. It is supposed to be a gap
   on the right-hand edge, on the bottom row - you could see it plainly in the
   older build. Now that edge is solid all the way along, so there is nowhere to
   leave by. The gap on the left edge, where the bird starts, is still there."

2. "The default style used to be a proper tangle: dead ends everywhere and one
   way through to the flag. Now it is full of rings - you can walk a round trip
   and come back to where you started - and there are far more gaps in the walls
   than there used to be. It plays like a much easier maze than the one we
   picked."

3. "In the second style, the one that digs a single winding corridor, the way in
   has disappeared. On the older build there is a gap in the left edge on the top
   row, and that is where you are meant to come in. Now that piece of the edge is
   drawn as a wall and the maze looks sealed on the left. Everything else about
   that style looks right and the bird still walks around inside it."

4. "Right at the start, before we have moved at all, pressing the LEFT arrow key
   walks the bird straight off the maze. It goes past the left edge, out of the
   drawing, and then no arrow key brings it back, so we have to reload the page.
   Up, down and right at the start all behave."

5. "The picture is lying to us. Corridors the bird walks straight through have a
   wall drawn right across them, and a lot of the places that really are walls
   are drawn as open space. The whole thing looks like a solid block you cannot
   get into. Strangely the bird still goes exactly where it should - through the
   drawn walls and nowhere near the blank gaps - so it is only the drawing that
   is wrong."

6. "The walls have changed colour. They used to be the same dark grey as
   everything else on the page and now they come out pure black, noticeably
   harsher, so the maze looks much heavier than it should. The bird and the flag
   both still look right."

7. "The first drop-down at the top has stopped doing anything. We pick Easy and
   the box shows Easy, but the maze does not change at all - same size squares,
   same number of them. Same story for the harder choice. It used to be obvious:
   Easy gave a small maze with big squares, and the harder one gave a huge maze
   with tiny squares. The second drop-down, the one that picks how the maze is
   made, still works fine."

8. "Two things about how the maze sits on the page, and we cannot tell whether
   either is a fault. First, it does not fill the window: there is a band of
   empty page all the way round it and it is not snug against any edge. Second,
   when we drag the window to a different size the maze does not come back to
   exactly the same place - the empty band at the left and at the top is a few
   pixels different from what it was before. Should it not fill the window, and
   should it not land back in the same spot afterwards?"

9. "Every reload gives a completely different maze, and so does finishing one:
   about a second after we reach the flag the celebration flashes and the page
   throws that maze away and starts another. We cannot send a colleague the same
   maze to try and we cannot retry one we nearly finished. Should the maze not
   stay put until we ask for a new one, and should the celebration not stay on
   the screen?"

Work in the source tree, repair the root cause of each real defect, and leave the
intended behaviours alone: the band of empty page around the maze and the few
pixels it drifts by when the window is dragged to a new size, the fresh random
layout on every load and after every finish, the celebration that clears itself
and starts a new maze, the stopwatch that stays at zero until the first step, the
two drop-downs and what each of them is for, the bird and the flag, and the
offline, self-contained way the page loads. The tree must still build with
`npm run build` when you are done, and must still need nothing from the network.
