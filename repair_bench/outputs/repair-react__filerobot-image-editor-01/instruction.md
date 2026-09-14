# Repair Task - filerobot-image-editor (React)

You are working on the source code of **filerobot-image-editor**, a
browser image editor built with React 18 on top of an HTML canvas: the
user loads a picture, picks one of six editing sections in the left
column (Adjust, Finetune, Filters, Watermark, Annotate, Resize), chooses
a tool inside that section, drives it from the panel that appears above
the tool strip, watches the canvas and the size and zoom readouts in the
top bar follow along, and finally saves the result under a file name of
their choosing. The repository is a monorepo; the runnable application
is the demo page at its root, which imports the editor straight from the
workspace source folders rather than from a published bundle. The whole
thing is offline: the demo mounts one small bundled sample picture
(640 x 420 px), all interface wording comes from the local translation
table, and saving simply hands the result to an empty callback. It is
built with
`BABEL_ENV=production NODE_ENV=production VITE_BUILD_TYPE=gh-pages node_modules/.bin/vite build --outDir dist`
and the site root is the produced `dist/` folder.

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

1. "The zoom control only ever works once. I click the plus button, the
   percentage goes up exactly as it should, and then I click it again -
   twice, five times, whatever - and the number just stays where it
   landed. The minus button keeps reacting every single time, so the
   control is not frozen, it is only the zooming in that gives up after
   the first step."

2. "In the Filters section I click one of the little preview tiles and
   the picture on the canvas really does change, so the filter is being
   applied. But the tile I clicked never looks chosen. It stays exactly
   as it was, and whichever entry was marked when I opened the section
   is still the one marked afterwards."

3. "In the Resize section the two size boxes are supposed to be linked by
   the little padlock between them, and that link looks broken. I type a
   new width and the height box keeps the number it had before. The
   strange part is that the size readout up in the top bar does show the
   new pair of numbers, so the app clearly worked out the matching height
   - the box just refuses to display it."

4. "The section list on the left never moves its marker. I click Finetune
   and the middle of the screen genuinely switches over to the finetune
   tools, so the click lands, but the highlighted entry in the left
   column is still the first one and it stays there no matter which
   section I open."

5. "When I press Save, the name box in the dialog already has text in it
   - sample-image - before I have typed anything. A fresh editor should
   ask me for a name instead of pre-filling one. And when I press Cancel
   the dialog just goes away and nothing is saved at all, which looks
   like the cancel path is not doing its job."

6. "This editor seems able to remember only one adjustment at a time. I
   dial in a contrast value, move over to brightness and change that,
   and when I come back to contrast my setting is gone - the box sits at
   0 as if I had never touched it. If I only ever adjust a single thing
   and leave it alone, that one is kept perfectly."

7. "The tool strip under the canvas has the same illness as the section
   list, only more annoying: I click a different tool and its panel does
   open above the strip, so the click is clearly registered, but the
   highlighted tool button never moves off the one I started with."

8. "When I open the crop preset list and pick one of the named ratios - I
   used the portrait one - the crop itself is applied to the picture, but
   the small caption beside the preset dropdown still reads Crop. It
   never picks up the name of the ratio I chose, so I have no way of
   telling what the current crop is set to."

9. "The Filters strip is enormous, dozens and dozens of entries, and the
   very first one is called Original, which is not a filter at all. I am
   fairly sure the list has been padded with filler entries: the tiny
   previews all look near-identical at that size."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
- The verifier drives the app in a browser at a 1280 x 720 viewport against
  the bundled sample picture, with no network access.
