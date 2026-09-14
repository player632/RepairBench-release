# Repair Task - fabritor-web (React + fabric.js)

You are working on the source code of **fabritor**, a browser-based canvas
design editor built with React 18, ICE.js 3, antd 5 and fabric.js 5. The
page is a single editing screen: a top bar with the logo, an editable
document title, two history arrows, a hand tool, a clear-canvas button and
an export menu; six tabs on the left (Design, Text, Image, Material, Paint,
App) that offer the layer list and a bundled demo document, plain and
preset texts, picture sources, shapes/lines/hand-drawn figures, brushes and
freehand drawing, and small apps such as a QR code generator and an emoji
picker; a canvas in the middle where the white page and everything on it
live; and a property panel on the right that follows the current selection -
canvas size and background when nothing is selected, otherwise alignment,
opacity, lock, duplicate, delete, flip, a position/size drawer and, for
texts, font family, font size and font style. Right-clicking the canvas
offers copy, paste, create a copy, delete, grouping and layer moves, and the
usual keyboard shortcuts work too. The project lives in this workspace and
runs fully offline: install with `npm install`, build with `npm run build`
(an ICE.js production build, output in `build/`, served from that directory
as the site root). There is no backend and no network access, so the
features that fetch a picture from a remote address - the picture-from-URL
picker and the icon field of the QR code card - cannot work in this
environment and are not part of verification; fonts, emoji data,
translations and the demo document are all bundled locally.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

The reports, in no particular order:

1. "The two arrows in the top bar never wake up. From the moment the page
   finishes loading they are pale gray, and they stay pale gray whatever I
   do - I add a title, drop in a shape, move things, delete things. Clicking
   them does nothing at all. The rest of that bar is fine: the hand tool,
   the clear button and the export menu all answer, so the bar itself is not
   dead."

2. "Typing numbers into the position fields is useless. I select an element,
   open Adjust Position, type a new X value and press Enter: the box happily
   shows the number I typed, but the element does not move one pixel. Same
   story for Y, for the width and for the rotation, so I end up dragging
   everything with the mouse."

3. "The QR code card does not show me what I am doing. In the App tab I open
   the QR code card; above the Add button there is a preview of the code. I
   replace the text with my own link and the preview stays on the original
   code while I type - it only catches up much later, if at all, usually
   after I have clicked somewhere on the canvas. Half the time I cannot tell
   which code I am about to put on the page."

4. "The hand tool is a mess, in two different ways. When I click it the
   button picture never changes and its hint still says Pan, so I can never
   see which mode I am in. And the selecting behaves backwards: with the
   hand tool switched on I can still grab my elements and drag them around
   (so panning the view barely works), while after switching it off again
   nothing on the page can be selected at all - I click a title, a shape,
   anything, and the right panel just keeps showing the canvas properties."

5. "Sending an element one layer down makes it vanish. I right-click a
   shape, pick Layer and then Move Down, and the shape is gone from the
   page. It was not deleted - it is still listed in the layer list on the
   left - but nothing shows where it was. It is as if the white page
   swallowed it."

6. "Renaming my work is not something the app remembers. I click the title
   in the top bar, type a new name, press Enter, and the new name shows up
   right away. But no amount of undoing ever gives me the previous name
   back, as if the rename never happened as far as the app's memory is
   concerned."

7. "The four preset cards under Presets in the Text tab are all the same.
   They are printed as a big bold title, a subtitle, a body paragraph and an
   outlined one, but whichever card I click I get the same small ordinary
   text box dropped in the middle of the page - none of the fonts, none of
   the sizes, not even the wording shown on the card."

8. "Every new text I add arrives already picked: a red frame with round
   handles around it, and the right panel jumps straight to the text
   properties. I expected it to sit quietly on the page until I click it
   myself. Is that a defect or is that how it is meant to be?"

9. "When I duplicate an element - Ctrl+C then Ctrl+V, or the duplicate icon
   in the right panel - the copy never lands exactly on top of the original.
   It is always shifted down and to the right by what looks like the same
   fixed amount every time. Sloppy."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds the app and drives it.
  Focus on reading the code and fixing root causes.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build`.
