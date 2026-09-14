# Repair task: a browser step sequencer

## The app you are repairing

One static web app: a minimalistic step sequencer for making electronic music in the browser.
There is no build step, no framework, no package manifest and no dependency directory anywhere in
the tree - the browser loads the entry document at the source root and that document pulls the
app's own classic scripts (`js/*.js`), its vendored audio library (`lib/`), its four stylesheets
and its demo songs (`data/tracks/*.json`) straight off the disk with relative paths. Nothing is
fetched from outside the tree at runtime, and the task runs with no network at all.

Top to bottom, the app carries:

- a startup dialog on every load, offering a new track, the shipped demo songs and an import.
- a pattern view: a piano column of 60 keys over five octaves beside a step grid that is 64 steps
  wide (one bar is 16 steps by default, up to four bars), with a row of pattern-layer tabs above
  it and an automation row below it. Clicking a cell places a note, clicking it again erases it.
- a transport with play/stop, a tempo field, a bar-length control and a pattern menu carrying the
  pattern name, the pattern length, a colour picker and a per-layer editor.
- an arrange view: a sidebar listing the patterns beside a grid of 32 columns, where a click on a
  cell places or removes a block, a short click on a column header sets the play start point and a
  long press on a header opens the column menu (insert or remove bars).
- an instruments sidebar listing the synths, each opening a synth editor with its own parameter
  pages, plus a reorder panel reached from the arrange corner.
- a settings dialog with a zoom control and an advanced page (scheduling lookahead), a demo-track
  list, export/import, and the app's own alert, prompt and toast chrome.
- its own persistence: the song is backed up and the settings are stored in the browser's local
  storage under the app's two own keys.

The app is examined at a desktop window, 1280 by 800. Dialogs, toasts and menus are part of the
surface being examined, and several of them are transient, so anything that depends on a dialog, a
toast or a press takes a moment to arrive.

## What users reported

Nine reports came in. They are quoted as their authors wrote them. They are starting points, not
diagnoses: they are not always precise, they do not always say which of several similar things is
affected, and they do not always agree with each other.

1. When I add a second voice to a pattern and flip between the layer tabs, the tab highlight moves
   but the step grid keeps showing the previous layer's notes until I click somewhere else.

2. After I change the lookahead in the advanced settings and reload, the value is gone and the
   stored settings look corrupted - other settings I had saved are gone too.

3. When I reorder patterns from the arrange view the name order changes but the placed blocks stay
   on their old rows, so the song plays back in the wrong order.

4. The little toast messages never disappear any more - they stay on screen over the UI until I
   reload the page.

5. Copying a pattern layer and then editing the copy also changes the original layer - the two
   layers behave as if they were linked.

6. Long-pressing a column header in the arrange view no longer opens the column menu; instead
   holding an ordinary grid cell pops that menu up out of nowhere.

7. The vertical bar separators in the pattern grid are off by one step - they sit between the wrong
   steps, one step before each bar boundary.

8. In the pattern view the piano column shows "#" instead of note names on some rows, and the step
   numbers only appear every fourth column and look one higher than the column they sit over. It
   reads like a broken label render.

9. The automation row under the step grid is greyed out, and clicking it only shows "No automation
   target present" - my filter edits seem to do nothing there.

## Not every defect is described in these reports

并非所有缺陷都有报告提及。Some of the faults in this app are not mentioned by any report at all,
and - just as importantly - not everything above is a fault. You are expected to read the app and
work out what is actually wrong rather than to work down the list: repairing only the reported
items will not finish this task, and "repairing" something that was never broken will cost you.

## What is NOT a fault - leave these exactly as they ship

Every line below is the app's own intended behaviour. None of them is a defect, none of them is
mentioned in the reports as something to fix, and each of them is examined:

1. Submitting the bar length that the song already has does nothing at all - no dialog, no toast,
   no redraw. That early return is the shipped guard against a pointless destructive change.

2. Opening the layer editor on a layer that has no notes raises the alert "Layer is empty" and
   goes no further. That is the shipped answer, not a dead control.

3. Adding a pattern opens a prompt that is already filled with the next free pattern name, and
   cancelling it creates nothing. Both the pre-filled name and the no-op cancel are shipped.

4. A pattern's length can be changed from the pattern menu itself, in bars, without importing or
   exporting anything; the grid widens or narrows to match. That local path is shipped.

5. The reorder panel is opened from the corner of the arrange view, lists one entry per pattern
   with an up and a down control, and is closed by its own close control, which refills the song
   view. Opening and closing it without reordering anything changes nothing.

6. The startup dialog is present on every load and has to be answered before the workspace is
   reachable. It is not a stuck overlay.

7. The app writes the song backup and the settings into the browser's local storage under its own
   two keys. Those writes are the app's own persistence, not residue, and they must keep working.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry no
  behaviour; they are how the app is addressed while it is being examined, and they must survive
  your repair exactly where they are.
- The examination reads the app through a set of read-only handles that are already installed on
  the page. Do not remove, reimplement, satisfy or special-case them, and do not add anything of
  your own to the app's global scope.
- The app runs with no network at all and must keep doing so. Everything it needs, including the
  demo songs, is already inside the tree. Do not add a remote reference and do not assume anything
  can be downloaded.
- Repair the behaviour a user experiences. Do not special-case the examination, do not add flags or
  hidden state, do not write anything into the browser's storage that the app does not already
  write, and do not leave anything on the global scope that was not there before.
- Do not delete shipped content, controls, copy, artwork or demo data to make a symptom go away,
  and do not reorder or rebuild a region unless the report you are answering is about that region's
  order.
- Keep every change inside this app's own files. Nothing outside the app may change.
