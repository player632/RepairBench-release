# Repair Task - Method Draw (vanilla JS)

You are working on the source code of **Method Draw**, a browser-based
SVG vector editor: users draw rectangles, ellipses and freehand paths,
add and edit text, paint shapes with fill and stroke colors from a
palette, group and ungroup objects, nudge selections with the arrow
keys, zoom the canvas, undo and redo their steps, tweak the canvas size
and title, switch between dark and light UI, and inspect or edit the
raw SVG source of the document. The project lives in this workspace and
has no build step at all: it is a plain static page (the entry point is
`src/index.html`, loading classic scripts from `src/js/` and styles from
`src/css/`). There is no package installation to run, no bundler, and no
backend or network access; serving the `src/` directory statically is
enough to run it.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "When I switch between tools on the left, the button I used before
   stays highlighted as if it were still the active one. I end up with
   two buttons looking 'current' at the same time and no way to tell
   which tool I am actually holding."

2. "Undo feels broken. I draw a shape, choose Edit > Undo, and the shape
   just stays on the canvas. Nothing gets taken back. Redo seems to have
   nothing to do either, so the whole history feels dead."

3. "The text tool is useless to me: I pick it, click where I want the
   text, type my words into the little input that appears - and the
   canvas stays empty. No letters ever show up where I clicked."

4. "When I click on a shape to select it, the color indicators in the
   panel keep showing whatever color I had picked before, not the colors
   of the shape I just selected. I have to guess what a shape is painted
   with."

5. "Zooming is painfully slow. I change the zoom to 200% and the view
   keeps crawling and animating for ages before it finally settles. It
   should be over in a moment."

6. "I resized my canvas to 640 x 360 and it came out the wrong way
   around - I got a tall 360 x 640 canvas instead of the wide one I
   asked for. It feels like my numbers get swapped somewhere."

7. "When a shape is selected and I press the left arrow key to nudge it
   left, it moves to the right instead. Up and down feel fine, but
   horizontal nudging goes the opposite way of my key."

8. "Every time I click into the document title field at the top, the
   whole current title gets highlighted/selected on its own. It feels
   like a bug - I just want to place my cursor there."

9. "The File > New Document menu item looks completely dead to me. I
   click it and at first glance nothing happens, my drawing stays there.
   Either it should wipe the page like it says or it should not sit in
   the menu."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
