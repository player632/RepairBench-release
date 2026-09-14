Subject: Drum machine update broke half the workflow — please help

Hi,

I produce beats with this step-sequencer web app and the latest update ruined my workflow. I'll list everything I notice from the music side; sorry it's a long one.

1. The transport is dead. I press the play control and nothing happens — the button never flips to its pause state, the pattern never starts running. Pressing it again is equally fruitless.

2. Editing the pattern while it is running used to work: I'd enable an empty cell mid-playback and hear it join the loop on the next pass. Now the edit shows in the grid but the running playback completely ignores it, as if the scheduler never hears about changes made while it is active.

3. Tempo changes don't stick. I type a new value into the tempo field, and for a split second it looks accepted — then the field snaps back to the old number and the song keeps running at the old speed. The little plus/minus steppers behave the same way.

4. Undo is broken. I toggle a cell, press undo, and the cell stays exactly as I left it. The button is clickable (not greyed out), it just has no effect on the pattern.

5. Muting a track doesn't work anymore. I press the M control next to a track name and it never lights up as muted; the track keeps its place in the pattern view as if nothing happened.

6. Dragging across a row of cells used to paint them all with the opposite of whatever the first cell held — a quick way to fill in a run of steps. Now the drag finishes and the cells keep whatever they had before. Single-cell clicks still toggle fine; it's the multi-cell drag that paints nothing.

7. Exporting to MIDI is broken. I open the MIDI export dialog, the file name looks prefilled as usual, but the moment I press the export button the dialog just closes and no file ever downloads. I tried a dozen times — never a single file.

Two more things that may or may not be bugs:

- When I deliberately type an absurd tempo like 500, the field flags itself and nothing reaches the song. Feels like a guard doing its job — mentioning it just in case.
- If I press redo while there is nothing to redo, nothing changes at all. I assume that's the intended floor behaviour, but flagging it for completeness.

I work in a normal desktop browser window, no extensions, everything local. Please help — deadlines are looming and right now the app is barely usable.

One more thing before you start: not every defect is necessarily mentioned in the reports above. Behaviors you break while fixing other things still count against you.

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
