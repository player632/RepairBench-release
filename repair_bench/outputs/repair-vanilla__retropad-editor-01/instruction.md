# Repair task: RetroPad Editor

## What this application is

RetroPad Editor is a small single-page tool for editing onscreen-gamepad layouts of the kind a retro-gaming emulator draws on top of a video feed. The user loads a layout (or starts from the built-in default one), sees the pad drawn as a set of labelled rectangles on a preview area, selects one rectangle - or drags a marquee around several of them - and then edits geometry, shape, artwork and command of the selection through the panel on the right. Layouts are organised in overlays, an overlay holds a named set of buttons, and the whole thing is serialised to a plain-text configuration that the user can export and later import again. Screenshots of the underlying game can be imported as a positioning backdrop. The page is entirely static and offline: no build step, no server side, no network access at runtime.

The delivered copy of this application is broken in several distinct places. Your job is to repair it so that it behaves as described below, without breaking anything that already works.

## How the application is meant to behave

1. The pad preview is a faithful picture of the loaded configuration: one rectangle per configured button, placed and sized as a percentage of the pad area, and labelled with the command that the button sends.
2. Every editable numeric property of the selected button is offered twice in the right-hand panel - once as a slider and once as a number box - and the two always display the same value. Editing either of them updates the other one and updates the pad preview immediately.
3. Numeric values keep the precision the user supplied. A fractional value stays fractional all the way into the exported configuration text; exported numbers are never truncated to whole numbers.
4. A button whose configuration names an image is drawn with that image as its background, taken from the set of images the page has loaded - not from the bare name of the image.
5. Shape is honoured as written: a button the configuration marks as round is drawn round, and a button it does not mark as round is drawn as a plain rectangle.
6. Moving a multi-selection moves every selected button by the same offset on the axis the user edited. A horizontal edit is measured against the selection's own horizontal centre; the vertical centre is not consulted for a horizontal move.
7. Resizing a multi-selection scales the selected buttons proportionally and never lets a size fall below the visible minimum, so a resize can never collapse a button out of existence.
8. Mirroring a button horizontally places it at the mirrored horizontal coordinate - one minus its own horizontal coordinate - and leaves its vertical coordinate untouched.
9. Normalising a button to the pad's aspect ratio converts its height into the width that looks square on this particular pad, using the pad's own width-to-height ratio in the same direction the pad is actually drawn (a pad that is wider than it is tall must not produce a button taller than it is wide).
10. A configuration that asks for a full-screen background puts the background layer over the whole pad area; a configuration that does not ask for it keeps the background inside the imported-screenshot frame.
11. Creating a new overlay appends exactly one entry to the overlay list, and the new entry's visible label, its stored parameter lines and its description lines all refer to the same new index. The overlay count grows by exactly one.
12. Importing a file through any of the three pickers shows the imported file's own name in the caption next to the picker that was used.
13. The page is and stays completely self-contained: it never reaches the network for scripts, styles, fonts or images, and it leaves no trace in browser storage or in the address bar.

## How to read the reports below

The reports are written by users of the tool, in their own words, from what they could see on screen. They are the only description of the trouble you get, and they are deliberately imperfect:

- **Not every defect is described in these reports.** Several of the broken behaviours are not mentioned anywhere, and you are expected to find them by reading the code against the intended behaviour listed above and by exercising the application yourself.
- **At least two of the reports describe behavior that is actually intended.** Those are not defects. Changing the behaviour they complain about will be counted against you, because the intended behaviour is verified by the grading run just as strictly as the broken behaviour is.
- A report describes a symptom, never a cause, and it may point at the wrong control: the thing a user sees misbehaving is not necessarily the place where the mistake sits.
- Reports never name source files, functions or variables, and neither does this brief. Locate the responsible code yourself.

## Reports

**Report 1.** When I drag one of the sliders in the right-hand panel, the pad preview moves but the small number box that belongs to that slider keeps showing the old value. I can no longer read off the exact number I just set, and if I drag the slider back and forth the box never follows.

**Report 2.** Every value I enter loses its decimals. I set a width of about one eighth of the pad and the exported configuration comes out as a whole number, so fine positioning is impossible and small buttons collapse to nothing when I export and reload them.

**Report 3.** The shapes on the pad preview are wrong: the buttons that my configuration marks as round are drawn as plain boxes, and the ordinary rectangular ones are drawn as if they were round. It looks as if the two cases were swapped.

**Report 4.** As soon as I select several buttons and resize the selection, all of them shrink away to nothing - the widths come out essentially zero and the buttons are no longer visible on the pad. Resizing a single button by hand is fine; it is the group resize that destroys them.

**Report 5.** My configuration asks for the background to cover the whole pad, but the background layer ends up inside the imported-screenshot frame instead of behind the full pad area. With a different configuration that does not ask for full screen it is the other way round, so the decision seems to be taken backwards.

**Report 6.** Importing a screenshot does nothing visible: the caption beside the file picker stays empty and the developer console shows an error at that moment. Picking the very same file twice does not help.

**Report 7.** The two display checkboxes above the pad look inconsistent to me. Button names are drawn even though I never asked for them, while the shape outlines stay invisible until I tick the second checkbox myself. Please make both of them show all the time so the preview is consistent.

**Report 8.** The Edit and Delete buttons in the toolbar are greyed out when the page loads and only wake up after I click a button on the pad. That looks like a permissions bug - toolbar buttons should be clickable all the time.


## What you must leave alone

Repair only what is broken. Keep every other behaviour byte-for-byte as it is: the built-in default layout and the shipped defaults of the display toggles, the toolbar's disable-until-a-selection-exists behaviour, the contents of the command list, the image list and the shape list, the geometry of the pad and of the screenshot frame, the overlay list as loaded, the exported configuration's text format, and the fact that the page never touches the network and never writes to browser storage. The grading run checks a broad set of these untouched behaviours as invariants, so a repair that improves one symptom while disturbing any of them scores zero.

There is no build step and no dependency installation: the tree you are given is the tree that is served. Do not add a bundler, a framework, a package manifest, a remote font or any other new runtime dependency, and do not add debugging hooks of your own to the page.
