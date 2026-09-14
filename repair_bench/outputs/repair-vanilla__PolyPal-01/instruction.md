# Repair Task - PolyPal (vanilla JS)

You are working on the source code of **PolyPal**, a small browser polygon
editor written in plain JavaScript. A user lands straight on the canvas and
builds pictures out of filled polygons: points are placed with the pen tool and
closed into a shape, shapes can be selected, dragged, duplicated by dragging,
rotated and scaled with the two sliders at the bottom, painted with a colour
picked from the palette on the left, and reordered in the stacking order with
the layer buttons. The palette itself can be edited - colours added, removed
and re-picked - and choosing a colour is meant to flash the shapes that already
use it. There is an undo history, a Save button that keeps the picture in the
browser so it is still there when the user comes back, a Load button that
brings it in again, a Reset button that throws everything away, and a Download
button that exports the picture as an image file. The project lives in this
workspace and has no build step at all: it is a plain static page - the entry
point is the page at the root of the workspace, the scripts sit in a subfolder
next to the stylesheet and the images, and nothing is fetched from anywhere.
There is nothing to install, no bundler, no backend and no network access;
serving the directory statically is enough to run it.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit somewhere other than
  where the symptom shows up, and a single reported symptom can have more than
  one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Adding a colour into the middle of the palette repainted one of my shapes.
   I expected the shapes further along the palette to shift over to make room -
   those were fine, they kept the colour they had. It was the shapes using the
   colour immediately after the one I inserted that changed, and they changed
   to the brand new colour I had never given them. So a picture I had finished
   came back from that one click with a stray shape in it."

2. "I cannot let go of a shape. Clicking one selects it, which is right, and
   clicking the same shape a second time is supposed to release it. It does
   not - it stays selected, and clicking it a third, fourth, tenth time changes
   nothing. The only way I have found to drop the selection is to clear it from
   somewhere else or hit Reset, and Reset deletes the whole picture, so that is
   not really a way."

3. "The point-building mode drops new points in the wrong place. I switch to
   building with points, press down where I want the point and pull the cursor
   out to where the corner should be, and on release the point is not there -
   it is back where I pressed down. Every point I add lands on the same spot as
   the one before it, so instead of a shape I get a pile."

4. "Duplicating a shape by dragging it takes forever to commit. The copy is
   meant to be a faint preview only while it is still sitting basically on top
   of the original, and to become a real shape as soon as I have pulled it a
   short way clear - it used to be a handful of pixels. Now I have to drag the
   copy most of the way across the canvas before it turns solid, and if I let
   go before that I get nothing at all."

5. "Save then Load loses my colours. The picture itself comes back: every shape
   in the right place with the right outline. But the palette is back to the
   handful it shipped with, and each shape that used a colour I had added or
   edited is now painted with whatever happens to sit at that position in the
   default set. Closing the tab and loading again does the same thing, so it is
   not just the current session."

6. "Rotating mirrors my shapes instead of turning them. I select a few corners,
   move the rotate slider, and the selection comes out reflected - the corners
   land where a mirror would put them rather than where a turn would. A shape
   that stepped down to the right now steps down to the left. Scaling with the
   other slider is fine, and so is dragging; it is only rotation that is
   wrong."

7. "Where two shapes overlap, clicking the overlap grabs the one underneath.
   The shape that is visibly on top can only be picked by clicking a part of it
   that does not overlap anything, which makes editing a dense picture almost
   impossible - I keep selecting the wrong thing and repainting it. The layer
   buttons still move shapes forward and back correctly, and I can see the
   stacking order change on screen, so the shapes are in the right order; it is
   only the picking that chooses the wrong one."

8. "This may not be a defect but it unsettled me enough to write it down. If
    you look at the page itself, every shape seems to be drawn twice - once in
    each of two stacked drawing layers. I counted the same outline in both and
    assumed the editor was double-painting, and that this might be why things
    look heavier than they should. But on screen there is one shape, the file I
    download has one copy of it, and the second outline follows the mouse and
    the selection around rather than sitting still. I think it is the copy the
    editor keeps on top for hovering and selecting, and it is supposed to be
    there."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier serves the page statically and
  drives the app in a real browser. Focus on reading the code and fixing root
  causes.
- Keep every fix inside this workspace and preserve the existing behavior of
  everything you do not intend to change.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.
