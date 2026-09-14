# Repair Task - a GoldSrc demo viewer (TypeScript + WebGL + a SolidJS control overlay)

You are working on the source code of a browser viewer for GoldSrc games (Half-Life and
Counter-Strike). It is shipped as a library: a host page hands it a container element and a
resource path, asks it to load a recorded demo, and gives it a title string. The viewer parses
the recording and its map, renders the map with WebGL, plays the recording back, and draws a
control overlay on top of the canvas.

The page the verifier drives is a fixed 960 x 600 box playing a recording that is two minutes
and fifty-two seconds long, on a climbing map. Everything below describes what that page is
supposed to do.

## The overlay

Two parts. A title line sits in the top-left corner and shows the text the host gave the viewer.
Along the bottom sits the control bar, which holds, in order:

1. the progress bar - a full-width strip with a thin filled line, a round knob marking the
   playhead, and a faint preview marker plus a small time label that are meant to follow the
   pointer;
2. a slower button, a play/pause button, a faster button;
3. a speaker button whose picture shows the current level (muted, part, full) and that toggles
   mute, next to a short horizontal volume strip with its own knob;
4. a clock reading "current / total", for example 01:05 / 02:52;
5. on the right, a settings button that opens a small panel holding a replay-mode button and a
   free-move button, and a fullscreen button.

The whole overlay is hidden at rest. It appears when the pointer moves over the box and fades out
again about two seconds after the pointer stops moving; any interaction with the overlay restarts
that two-second countdown. The mouse cursor is hidden while the overlay is hidden and shown while
it is visible. Clicking the picture itself plays or pauses.

## The contract you are repairing against

- Progress: the knob sits at the fraction of the recording that has played - left end at the
  start, middle at half, right end at the finish - and the filled line complements it.
- Preview: hovering the progress bar without pressing shows the preview marker under the pointer
  and the small time label reads the time at that position. Moving the pointer off the bar hides
  the preview again and the label goes back to 00:00.
- Dragging the progress bar moves the playhead to that fraction of the recording and pauses.
- Clock: the playhead position and the total length are both shown as whole seconds,
  zero-padded, in the form current / total.
- Speed: the faster button doubles the playback speed, up to a ceiling of 4x. The slower button
  halves it, down to a floor of 0.25x.
- Keyboard, which only does anything while the overlay is active (that is, after a click inside
  the box): left arrow or J steps back 5 seconds, right arrow or L steps forward 5 seconds, up
  and down arrows move the level by 0.05, M toggles mute, space or K plays and pauses. Stepping
  backwards past the start of the recording must stop at the start.
- Volume: dragging the volume strip sets the level, and its axis runs left to right - dragging
  towards the RIGHT end makes it louder, towards the LEFT end quieter. The knob is clamped
  between 5% and 95% of the strip so that it stays visible.
- Remembered level: the level you set survives a page reload. On a fresh load with nothing
  remembered the viewer starts at its own default of 0.3.
- Mute: muting remembers the level it replaced, and un-muting restores exactly that level.
- Title: the title line shows the host's text, and follows it whenever the host changes it.
- Fullscreen: the fullscreen button's picture reflects whether the document is really in
  fullscreen. On a normal page it shows the enter-fullscreen picture labelled Fullscreen, and it
  only becomes the exit picture labelled Exit fullscreen once fullscreen has actually been
  entered.
- Stillness: while playback is paused or stopped the playhead must not move, however many frames
  run.

## Environment notes - properties of this offline harness, not defects

- There is **no network access** and nothing here needs it. The map, the recording, the sounds and
  the skybox are all served from the same origin, next to the built library, and the page makes
  zero requests that leave it.
- The harness installs a **read-only observation bridge** - one extra module and the single global
  object it publishes - which the verifier reads. Do not remove, rename or repurpose it. It only
  reads the app's own state and dispatches real mouse and key events; it never changes behaviour.
- The **host page is part of the harness**, not part of the product: it only calls the library's
  public API and holds no logic of its own. Do not move application logic into it and do not
  repair anything there.
- Every checkpoint starts from a **fresh browser context**, so nothing carries over between
  checks. In particular the remembered level starts out empty every time, which is why a fresh
  load always shows the default 0.3.
- The browser runs **headless at a 1440 x 900 viewport** with a desktop user agent, and WebGL is
  available through the software rasteriser, so the map really is parsed and really is rendered.
- The build must still **type-check** when you are done: the project's own build command runs a
  full type-check before it bundles.
- Two things look wrong but are normal here, and neither is a defect: the loading log reports the
  sound resources at 0% because the sample set this recording references is not part of the
  shipped data, and the page logs one console error at startup for the same reason. The viewer is
  designed to carry on without those samples. Leave both alone.

## The reports

QA collected a batch of user reports about this build. They are quoted below roughly as users
wrote them - with their own steps, noise and assumptions. Treat them as starting points, not as
diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause somewhere in the
  codebase. The root cause may sit in a different file than the one the symptom appears in, and a
  single reported symptom can have more than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a report before
  changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose the harness's observation bridge or its host page - they are
  verification fixtures, not product code.

The reports, in no particular order:

1. "the fast-forward button is useless now. one click and the recording is racing - it goes from
   normal speed straight to something like four times over, and then the slow button only steps
   down a little at a time so I cannot get back to anything watchable. it used to go 1x, 2x, 4x
   and stop there."

2. "my volume setting does not survive a refresh. I set it where I like it, reload the tab, and it
   is back at the quiet default again. it used to come back at whatever I had left it at."

3. "the progress bar is broken. the little knob is not on the bar at all - the moment the
   recording starts it flies off past the right end and stays there, and the filled part of the
   bar disappears with it. I cannot see where in the recording I am."

4. "the title line in the top-left corner is blank. the page definitely has a name for this
   recording, but nothing ever appears there, no matter how long I wait or what I click."

5. "there is no preview any more when I hover the progress bar. I run the mouse along it and no
   marker follows, and the little time label stays at 00:00 the whole time, so I have to click and
   hope. it used to show me the time under the cursor before I committed to it."

6. "the volume slider works backwards. I drag it to the right to turn it up and it goes down
   instead, so I have to drag left to get louder. the speaker button and the arrow keys still
   behave normally - it is only the slider."

7. "This may be me not understanding the thing, but: when the page opens there are no controls at
   all, just the picture. I have to wiggle the mouse before anything appears, and then they vanish
   again a couple of seconds after I stop moving. Is that a bug, or is the bar meant to hide
   itself?"

8. "Following on from the loading screen: the log it prints while loading says the sounds are at 0
   percent, while the recording, the map and the sky are all at 100. So the sounds never load? The
   browser console also shows an error at startup. Shouldn't both of those be fixed, or is the
   missing sound data expected?"

Work in the source tree, repair the root cause of each real defect, leave the intended behaviors
alone, and keep the rest of the seed's behavior intact - the hide-and-show overlay and its
two-second countdown, the preview marker and its label, drag-to-seek and the pause that goes with
it, the clock format, the speed ceiling and floor, the keyboard steps and their behaviour at the
start of the recording, the volume axis and its 5-95% knob clamp, the remembered level and its
default, the mute memory, the title line, the fullscreen picture, the stillness of a paused
playhead, the loading panel and its four progress lines, and the parsed recording itself - none of
which any single report describes in full. The project must still build with its own build command
when you are done.
