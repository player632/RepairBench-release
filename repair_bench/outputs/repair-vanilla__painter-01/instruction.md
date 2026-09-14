# Repair Task - painter (vanilla JavaScript + svg.js drawing board)

You are working on the source code of **painter**, a small browser drawing board
written in plain JavaScript on top of jQuery and svg.js. There is no framework,
no package manifest, no bundler and no build step of any kind: the tree you are
given is the tree that runs. The harness serves it over plain HTTP from its own
root directory and loads the board's top-level HTML page; every library the board
needs (jQuery, svg.js, the colour picker popup and the small context-menu plugin)
is already vendored inside the tree, so nothing at all is fetched from the
network at runtime.

The board reads top to bottom. A short header names the app. Under it sits a
toolbar of twenty-one icons: a pencil, a straight line, a multi-point line, a
rectangle, a circle, an ellipse, a select arrow, a paint bucket, a rubbish bin,
two layer-order buttons (bring to front, send to back), a clear-the-board button
and a handful of others. Beneath the toolbar is a row of six panels holding the
line-weight dropdown (four weights, the second one selected when you arrive), a
line-style toggle, and two colour chips - one for the line colour and one for the
fill colour - each of which opens a colour popup with a flat grid of twenty ready
made swatches plus the usual picker area. The line chip is the active one when you
arrive, and it starts blue; the fill chip starts pale grey.

The rest of the window is the board itself: a white drawing surface, 1198 pixels
wide and 600 high at the harness viewport, with a 1:1 mapping between drawing
units and screen pixels and no scrolling. You draw by pressing on the board and
dragging; the pencil is the tool that is already armed when you arrive, and the
board shows a pencil cursor. Selecting a shape with the select arrow puts eight
small square grips around it - one on each corner and one in the middle of each
side - and those grips are what you drag to resize it, while dragging the shape
itself moves it. Hovering a shape with the select arrow armed outlines it in red
without selecting it. Right-clicking empty board space opens a three-item menu
(Cancel, Select, Clear screen). A double-click on the pencil icon switches that
tool into its smooth-stroke mode, in which a freehand drag is committed as a
smoothed curve rather than as straight segments. The multi-point line tool works
click by click: each left click adds a corner, and a right click finishes the
shape.

Environment notes - properties of this offline harness, not defects:

- There is **no build step and no dependency install**. Do not add a package
  manifest, a bundler, a transpiler or a framework; the verifier serves the tree
  exactly as you leave it. Repair the code in place.
- There is no network access, and nothing in this board needs it. The one
  third-party counter script the upstream tree used to load has already been
  taken out for you, because it was the only thing in the tree that reached off
  this origin and no behaviour of the board depended on it; that removal is
  harness furniture, not a defect, and there is nothing for you to restore.
- The harness drives the board in a real browser at a **1440x1000 viewport**, so
  the whole board is on screen at once and the toolbar and the colour chips are
  above it.
- Every checkpoint starts from a freshly loaded board in a fresh browser context,
  so nothing - not a shape, not a colour choice, not any storage - carries over
  from one checkpoint into the next.
- The board keeps no drawing of its own anywhere: there is no save path, no
  restore path and no storage use in this tree at all, and that is how the seed
  is meant to behave.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and a single reported symptom can have more than
  one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is described in these reports. Some of them nobody wrote in
  yet, and at least one of them is hiding behind another: a broken behavior you
  cannot currently reach, because a different defect stops you reaching it, still
  counts against you once it is reachable. So check the neighbouring behavior of
  anything you touch, and re-check the select / resize / colour paths after you
  repair them rather than assuming they were fine.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "I drag a rectangle from the bottom-right towards the top-left - you know,
   starting where I want the far corner and pulling back - and the box does not
   end up under my mouse. It ends up hanging off the corner I pressed on,
   sticking out to the right and below, as if the board refused to accept that I
   was dragging backwards. Dragging the other way, from the top-left down to the
   bottom-right, is perfectly fine, so it is only the backwards direction that
   lands in the wrong place."

2. "the circle tool is unusable. I press where I want the centre, drag out maybe
   an inch, and the circle comes out enormous - far past my cursor, off the board
   - even though the drag was tiny. Small drag, gigantic circle, every time. The
   ellipse tool at least stays near my mouse, so it is the circle on its own."

3. "I cannot draw an ellipse that is not a circle. I drag a wide flat shape and
   what I get is as tall as it is wide; I drag a tall thin shape and it comes out
   the same. The width is right, the height always copies the width."

4. "the line-weight dropdown is lying to me. I open it, pick a thicker weight,
   and the dropdown does show it as the selected entry afterwards - the highlight
   moves, exactly as it should. But everything I draw next is still the thin
   default weight. It is as if the board reads the weight list from the top
   instead of reading the entry I chose."

5. "the colour popup writes to the wrong chip. I click the FILL chip so that it
   is the active one, open the popup, choose a strong red - and the red turns up
   on the LINE chip instead, while the fill chip stays pale grey. Then when I
   spray a shape with the paint bucket it gets the old grey, not the red I picked.
   Do it the other way round, choosing a colour for the line, and the fill chip
   is the one that changes. The two are swapped."

6. "the select arrow does nothing at all. I click a shape and no grips appear
   around it, the shape does not look selected in any way, and a second click is
   just as dead. So I cannot resize anything and I cannot bring a shape to the
   front, because the layer buttons only act on a selection and I can never make
   one. Hovering still outlines the shape in red, so the board knows my mouse is
   on it - it is the click that goes nowhere."

7. "when I spray a shape with a colour I actually chose, the shape turns see-
   through. The outline is the colour I picked, but the inside vanishes against
   the white board, as if the paint had been poured with the transparency left
   wide open. I can see it clearly on shapes I sprayed before I changed anything:
   those are solid."

8. "every time I refresh the page my drawing is gone, and there is no save button
   anywhere and nothing ever comes back. I assumed the save was broken. Is there
   a save in this thing that has stopped working, or was there never one?"

9. "this may be nothing, but: on a brand new board, before I have touched a
   single colour, the shapes I draw look washed out. The outline shows in blue
   but the inside is essentially invisible against the white board, like the fill
   is not being applied. It is only once I go and choose a different fill colour
   that shapes start looking properly painted. Is the default fill broken?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the toolbar and its twenty-one icons, the six panels, the default
pencil tool and blue line colour and pale grey fill colour the board arrives
with, the four-entry weight list, the twenty-swatch flat grid in the colour
popup, the red hover outline, the eight grips around a selected shape, dragging a
selected shape to move it, the layer-order buttons, the right-click menu and its
three items, the clear-the-board button, the rubbish-bin tool, a rectangle drawn
in the ordinary top-left-to-bottom-right direction, a diagonal straight line, a
finished multi-point line, an ordinary single-click pencil stroke, the fact that
a perfectly horizontal line and a pencil press with no movement produce nothing
at all, and the fact that the board persists nothing between loads - none of
which any report asks you to change. The tree must still load and run exactly as
it does now when you are done: no build step, no new dependency, no network
access.
