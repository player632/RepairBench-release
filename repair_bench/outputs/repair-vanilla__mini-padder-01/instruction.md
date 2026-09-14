# Repair Task - Mini Padder (vanilla JavaScript gamepad input overlay)

You are working on the source code of **Mini Padder**, a small browser overlay
that draws the controllers and joysticks a player has plugged in, so that a
stream or a recording can show what they are pressing. It is written in plain
JavaScript: there is no framework, no package manifest, no bundler and no build
step of any kind, and the tree you are given is the tree that runs. The harness
serves it over plain HTTP from its own root directory and loads the page's
top-level HTML document. Every stylesheet, script, skin definition, mapping
table and image the overlay needs is already inside the tree, so nothing at all
is fetched from the network at runtime.

The page has two halves. The upper half is the overlay area: four empty slots
stacked in a column, one for each controller the browser can report, up to four
at once. A slot stays empty until the controller in it actually produces an
input; once it does, the slot fills with that controller's own picture - a
handful of image layers stacked on top of one another, each with its own size
and its own offset inside the slot - and every button or stick that is pressed
lights up, then fades back out through a ladder of decreasing opacity levels,
one step of the ladder per level.

The lower half is the settings panel, a column of seven groups:

- **Gamepad Skin** - four dropdowns, one per slot, each listing every layout the
  overlay ships with. There are fifty-eight of them: thirteen for each of the two
  standard controller families, three disc-shaped D-pad variants, eleven joystick
  layouts, three mega-pad layouts, two super-pad layouts, eleven fight-pad
  layouts and two single-word layouts at the very end of the list.
- **Import Custom Skin** - a drop area that takes one JSON definition and up to
  four images.
- **Display Width** - a three-notch range control that sets how many slots wide
  the overlay is drawn, with the recommended crop figures printed underneath.
- **Fade-out** - three text fields: the seconds for each level of the fade, the
  opacity for each level, and how long the transition between levels takes. The
  fields carry an example of the expected format as their placeholder text.
- **Input Assignment** - four buttons, one per slot. Press one, then make an
  input, to rebind it.
- **Update Deadzone** - eight small buttons, a left and a right one for each of
  the four slots, which apply a new stick deadzone at the moment of the click.
- **Export & Import** - five buttons that open an in-page text viewer on the
  skin list, the custom skin, the controller tables, the panel's own saved
  values, and the error log. Each view is a title bar, a close button, a text
  area and a pair of Save and Load buttons; the error-log view is read-only, so
  it has nothing to save.

The panel keeps what it can in the browser's local storage: the controller
tables, the loaded skin list, the panel values worth remembering, the fade-out
settings and a version stamp - five keys and no others. On a first run it also
walks a short chain of one-shot migrations that bring settings written by older
releases up to date.

Environment notes - properties of this offline harness, not defects:

- There is **no build step and no dependency install**. Do not add a package
  manifest, a bundler, a transpiler or a framework; the harness serves the tree
  exactly as you leave it. Repair the code in place.
- There is no network access. The handful of outward-pointing references the
  upstream page carried in its document head - a canonical address, some
  sharing-preview metadata, an embed descriptor and a search-engine
  verification token - have already been taken out for you, because they were
  the only things in the tree that pointed off this origin and nothing the
  overlay does depended on any of them. That removal is harness furniture, not a
  defect, and there is nothing for you to restore.
- There is no physical controller plugged into this machine, and the overlay only
  ever draws a pad once that pad produces an input. The page therefore loads a
  small harness fixture that can present synthetic controllers to the browser's
  controller API and feed them button and stick readings on demand. That fixture
  is harness furniture too: it is not part of the application, it is not a
  defect, and removing or renaming it breaks the checks instead of fixing
  anything.
- The harness drives the page in a real browser at a **1440x1000 viewport**.
- Every check starts from a freshly loaded page in a fresh browser context with
  empty local storage, so nothing - not a pad, not a skin choice, not a saved
  value - carries over from one check into the next. A first run therefore always
  takes the migrations and always takes the "remember this panel value" path.
- The fade-out is animated frame by frame and the page polls the controller API
  on a timer. Nothing you are asked to fix depends on wall-clock timing; where a
  check has to let an animation or a deferred interface state settle, it waits a
  fixed interval that is several times the measured handler latency.

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
  cannot currently reach, because a different defect stops you reaching it,
  still counts against you once it is reachable. So check the neighbouring
  behavior of anything you touch, and re-check the stick, button, skin,
  persistence and save/load paths after you repair them rather than assuming
  they were fine.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "The Fade-out group in the settings panel is showing the wrong numbers. Its
   Time field is supposed to hold seconds - the label says so, and the
   placeholder gives `0,8,12` as the example - but mine reads `0,8000,12000`.
   It gets worse than a display problem, too: I left the field exactly as the
   panel had written it and the fade then took effectively forever to finish. I
   worked it out from the crop figures and a stopwatch - the overlay was
   waiting something like three and a half hours before the last level of the
   fade elapsed. Typing the seconds in by hand looks right for a moment and
   then drifts the same way on the next load."

2. "Two of the built-in layouts have disappeared. HBox and Biker - the two
   single-word names at the bottom of the Gamepad Skin list - are simply not in
   the dropdowns any more, and a slot that was set to one of them now draws
   nothing at all. Every other layout is still there and still selectable,
   including all the coloured variants, so it is not the skin folder that went
   missing. It is only those two."

3. "Brand new profile, first time I open the page, and the overlay is already
   drawn four slots wide. The Display Width control is sitting at its topmost
   notch and I have not touched it. I expected it to come up at the narrowest
   notch, one pad wide, the way the crop figures underneath describe. Worse, it
   survives a reload, so the page has apparently remembered a choice I never
   made and keeps applying it."

4. "The in-page text viewer has its Save button the wrong way round. Open the
   Error Log from the Export & Import group and Save is clickable - on the one
   view that is read-only and has nothing to write back. Open any of the views
   you actually want to edit (the controller tables, the skin list, the panel's
   own values, a custom skin) and Save is greyed out, so you cannot store
   anything. Load works everywhere, including in the read-only view, so it is
   only Save that is inverted. If you look at the button in the first instant
   after the view opens it looks normal; it flips to the wrong state about half
   a second later."

5. "The analog sticks are dead on the overlay. I push the left stick in any
   direction - up, down, hard, soft, past the deadzone by a mile - and nothing
   lights up and no stick element moves. The D-pad, the face buttons and both
   pairs of shoulders all respond perfectly, and the pad is obviously connected,
   because everything else about it works. It is the same on every pad I own
   that has sticks, so it is not one controller being odd."

6. "My controller is being read against the wrong button table. It is a modern
   standard-layout pad and the overlay even picks the right picture for it - the
   slot shows the skin I chose, so the layout side of things looks fine - but
   the buttons that light up are the other family's. Clicking the left stick
   does not report as a left-stick click at all. It behaves exactly as if the
   page had worked out what kind of pad I have and then filed it under a
   different family, while the skin picker went and found the right one anyway."

7. "On the layouts whose picture is built out of several stacked image layers,
   the layers are in the wrong place inside the slot. A layer that is supposed
   to sit partway down the slot is flush against its top edge, and a layer that
   is supposed to be flush is pushed down instead - it is as though the
   horizontal and vertical offsets had been exchanged. The layers are all still
   there and all the right size, only their positions are wrong, and the
   layouts that draw a single background picture instead of stacked layers are
   completely unaffected."

8. "This might be nothing but it worried me: the very first time I opened the
   page, before I had touched a single setting, the Error Log view already had
   an entry in it, and the browser's developer console had printed a pile of
   messages while the page was loading - something about versions and about the
   controller tables. Have I inherited a corrupted save from somewhere, or is
   the page failing to read its own settings?"

9. "I plug a controller in and the page still shows nothing: four empty boxes
   and a banner across the top telling me to make an input. The banner does go
   away a moment after I plug the pad in, so the page can clearly see it - it
   just never draws it. Do I have to press a button before anything appears, or
   is the drawing side of this broken?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the four empty slots before anything is pressed and the rule that a
pad is drawn only once it produces its first input, the two informational
notices the page raises on a first run and the fact that connecting a pad
removes the input-await one while drawing nothing yet, the seven panel groups
with their nineteen buttons, four skin dropdowns and five text and range fields,
the nine controller tables the page boots with and every button index inside
them, the way a pad's reported name resolves to a table - an exact hit for a
vendor the page knows, the standard-layout family's own entry, the generic
family as the fallback for a vendor it does not know, and a display name for an
unrecognised pad - the loaded skin list of fifty-eight layouts and the order
the overlay draws them in, the shape of the fade-out model with its three
levels and its own transition length, the whole disconnect lifecycle so that a
pad that goes away frees its slot, the D-pad direction tracking and the way a
press is encoded as a value, a delta and a pressed flag, the slot and canvas
geometry, the graded value an analog trigger reports, two pads driven at once,
the writable text viewer opening on the controller tables with its own text and
both of its buttons usable, the Display Width control resizing the overlay and
being remembered when the user moves it, the deadzone buttons retuning a stick,
the input-assignment mode arming and aborting on a second click, a
stick-reported D-pad on a joystick-class pad, and local storage holding exactly
the application's own five keys with no residue of the harness left behind -
none of which any report asks you to change. The tree must still load and run
exactly as it does now when you are done: no build step, no new dependency, no
network access.
