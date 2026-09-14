# Repair Task - react-image-editor (React + Konva)

You are working on the source code of **react-image-editor**, a
browser-based canvas editor built with React, TypeScript and Redux
Toolkit on top of the Konva canvas library. Users work on a free stage:
they drag ready-made widgets from the side panel onto the page (text
snippets in various fonts, shapes, icons, lines, frames and photos),
move and resize objects, reorder them in layers, zoom the view, flip
objects, edit text directly on the canvas by double-clicking it, keep
several files open in tabs at once, and rely on the usual hotkeys for
duplicate, copy, paste, select-all, undo/redo and delete. The project
builds with `npm install` followed by `npm run build`, which produces a
static bundle in `dist/`; serving that directory is enough to run it.
There is no backend and no network access.

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

1. "The zoom buttons feel reversed. I click the zoom-in button in the
   left toolbar and everything on the page gets smaller instead of
   bigger. Zooming out makes it larger. It is as if the two directions
   were swapped."

2. "The layer buttons misbehave. I select an object and press the
   'bring forward' button in the toolbar, and the object sinks behind
   the others instead of coming forward. Pressing the 'send backward'
   button does the opposite of its name too."

3. "Editing text right on the canvas is broken. I double-click a text
   object, the little inline editor appears, I type my new words and
   press Enter to finish - and the old words come back. Oddly enough,
   when I finish the edit by clicking somewhere else on the canvas
   instead of pressing Enter, my new text sticks."

4. "I cannot drag text onto the page at all. I grab one of the
   ready-made text snippets from the widgets panel on the right, drag
   it over to the canvas and let go - nothing lands on the page. The
   other draggable widgets seem to react when I drop them."

5. "Undo has no sense of single steps. I put two or three things on the
   page one after another, press undo once, and instead of going back
   one step the whole page jumps to the very first state it had. One
   key press throws away everything I did recently."

6. "Working with several file tabs corrupts my pages. I open a second,
   empty tab, switch back to my first tab to look something up, then
   return to the second one - and it is suddenly full of the objects
   from my first tab. The empty page I left is gone."

7. "Clearing the page does not work. I choose select-all so every
   object is marked, press the delete key, and not a single object
   disappears. Selecting itself looks fine - the objects are clearly
   selected - but the key press does nothing."

8. "Something seems off with the square in the shapes panel. When I
   drag it onto the canvas it shows up extremely small - much smaller
   than the other shapes, although its size setting looks comparable.
   I think the sizing is broken."
