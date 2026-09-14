# Repair Task - Pixel Paint (vanilla JS, zero build)

You are working on the source code of **Pixel Paint**, a small browser page for
drawing pixel pictures. The whole picture is a 32 by 32 field of little squares:
you paint them one at a time or drag out a stroke, and a row of buttons along
the top covers undo, redo, pencil, bucket, eraser, the dashed box tool, the
dropper, the square guides and saving the picture as an image file. Under the
buttons sit two colour chips with a little code box that shows the code of
whichever chip is currently active, a tray of 56 colours, and a two-way choice
that swaps that tray for an 8-shade handheld set. A ghost square follows your
pointer across the field to show where the next paint will land, a small readout
reports which square the pointer is over, and a message line flashes short notes
(copied, nothing to paste, saved) that are supposed to fade away on their own
after a few seconds. Hovering the Shortcuts tab in the corner reveals the list
of keys.

The project lives in this workspace and has **no build step at all**: it is a
plain static page with a handful of classic scripts and one stylesheet - no
package manager, no dependency chain, no bundler, no test runner, no backend.
Serving the directory statically is enough to run it. There is no network access
in this environment; that is expected and is not a defect. The page needs
nothing from outside and draws its text with the local font stack.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file, a
  different layer (the markup, the styling, the key and pointer handling, the
  colour and history bookkeeping, or the drawing routines) or a different code
  path than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- One symptom can hide behind another: until the hiding defect is repaired, a
  second root cause may be impossible to see at all.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "Undo needs two tries now. I paint one square, press the undo key once and
   absolutely nothing happens - the square is still there. Press it a second
   time and it finally goes away. The undo button in the row behaves the same
   way. It used to be one press per square, so now every little mistake costs me
   twice the key presses."

2. "The ghost square lies about my colour. I keep two colours on the go: I
   picked a green into the first chip, then swapped so that the second chip (a
   white) is the active one - the code box under the chips agrees with me and
   shows the white code - but the ghost square that follows my pointer is still
   green. The paint that actually lands on the picture is white, so it is only
   the ghost that is wrong. Swap back and it looks right again, which is what
   makes this so confusing to describe."

3. "The dashed box will not stay put. I drag out a small box over a few squares,
   let go of the mouse, and then merely move the pointer somewhere else on the
   picture - and the box stretches out after it, bigger and bigger. I cannot
   rely on it for anything either: copying the box does nothing at all, no note
   on the message line, no copy."

4. "After I press Escape the pencil stops working. Sometimes I hit Escape out of
   habit, or to get rid of a box I dragged out by accident. From that moment on,
   clicking squares does nothing - no paint comes out at all - and it stays dead
   until I reload the page. Picking a different button from the row seems to
   bring it back, but picking the same one again does not."

5. "The square guides depend on how long I hold the key. A quick tap of the
   guides key turns the little dashed lines on, exactly as it should. But if I
   lean on the key for a moment and then let go, the lines are not there - or
   they blink on and end up off again. It is an on/off switch, it should not
   care how long I hold it down. The button in the row always does the right
   thing; it is only the key that misbehaves."

6. "The brush gets stuck to my pointer. I started a stroke, dragged off the edge
   of the picture and let go over the row of buttons, and now paint keeps coming
   out with no button held down: just moving across squares paints them. I have
   to click once on the picture to make it stop. Letting go while I am still
   inside the picture is fine, so I have trained myself to do that."

7. "Quick strokes come out dotted. If I drag slowly the line is solid, but if I
   move at any speed at all, the squares my pointer never actually visited are
   left empty, so I get paint, gap, paint, gap. It is worst when I go straight
   across a row; slanted strokes look all right to me."

8. "I lost a picture. I had been at it a while and I refreshed the page to check
   something, and the whole field came back empty. Every drawing page I use
   remembers what I drew after a refresh - can you make this one remember too?
   Losing an afternoon of work to one keystroke is not acceptable."

9. "The code box prints rubbish. When I use the dropper on a square I have not
   painted yet, the box shows a hash sign and a couple of letters instead of a
   colour code, and the chip behind it goes blank. That has got to be a broken
   conversion: it should either refuse to pick from an empty square or show
   something sensible."

Reproducing notes, offered without diagnosis: the field is 32 squares by 32
squares and every square is an element of its own in the page, so whatever you
can see with your eyes is also readable in the document; the key list behind the
Shortcuts tab is the page's own documentation of the key contract; the save
button produces an image file download, and in this environment that download
goes nowhere, which is expected; and nothing on the page reads settings out of
the address bar. Because some of what this page does happens over time (notes
that fade away by themselves, keys that can be held down, strokes that are drawn
while the pointer travels), prefer reading the page after a deliberate,
repeatable action over trying to catch a value mid-flight.
