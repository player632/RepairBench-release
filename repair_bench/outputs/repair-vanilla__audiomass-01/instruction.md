# Repair Task - AudioMass (vanilla JS)

You are working on the source code of **AudioMass**, a browser-based audio
editor written in plain JavaScript with **no build system at all**: the app
is a static site served straight from `src/` (`index.html` loads the scripts
and the bundled wavesurfer fork via `<script>` tags). There is no package
manager, no bundler, no test runner - just edit the sources.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  file than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "The loop button in the transport bar: if I have NOT selected a region
   and press it, nothing happens and the console throws an error. I expected
   it to just loop the whole file like it does when something is selected."

2. "The rewind button (the one that skips backwards) used to keep rewinding
   while I held it focused - press and hold, the cursor walks back faster
   and faster. Now it moves exactly one tiny step and stops, even if I keep
   holding."

3. "After I load a file, the total duration readout on the right of the
   timing bar stays at 00:00:000 forever. The waveform is there and plays
   fine, the number just never updates."

4. "Keyboard shortcuts go haywire after I use Shift once. Example: I undo
   with Shift+Z, then later I press a plain 'z' - and it undoes again, even
   though plain z should do nothing. It is as if the Shift key stays stuck
   inside the app after I let go."

5. "When I apply Effects > Speed / Playback Rate to a selection, the render
   finishes (I can see the waveform changed) but after that the whole app is
   frozen: the play button does nothing and the menus at the top will not
   open anymore. Only a reload helps."

6. "The L / R channel buttons above the waveform are dead. I click L to
   mute the left channel - the button does not change to OFF, nothing
   happens. Same for R."

7. "When the app starts it shows that Welcome dialog. After I click it
   away, the menu bar at the top is completely dead - File, Edit, nothing
   opens. If I skip the dialog with ?skipintro=1 the menus work, so it is
   something about closing that dialog."

8. "Not sure if this is a bug: when I am fully zoomed out, the zoom-out and
   reset-zoom buttons in the toolbar look greyed out / inactive. They only
   become clickable after I zoom in first. Looks broken to me, they should
   always be enabled."

9. "Every time I toggle Edit > Zero Cross Selection, a little floating text
   'Zero Cross Selection Off' (or On) pops up near the top and fades away.
   That looks like debug output someone forgot to remove - please get rid
   of it."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they
  are verification probes required by the checker.
- The app has no build step and must stay that way; it must keep working
  when `src/` is served statically.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
- Do not try to run the app or drive a browser to verify yourself during
  the session; a separate verifier serves the app and drives it
  automatically. Focus on reading the code and fixing root causes.

## How your work is verified

The verifier serves `src/` statically, opens the app in a headless browser
and drives it through a scripted checkpoint suite (mouse, keyboard, DOM and
state assertions - no audio-output assertions). Checkpoints cover both the
reported defects and the behaviors that must keep working; breaking an
unrelated behavior fails the corresponding checkpoint.
