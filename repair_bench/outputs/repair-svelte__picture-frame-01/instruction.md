# Picture-frame dashboard: repair brief

## What this is

A Raspberry-Pi photo frame. The Pi runs a small Go service that owns the photo library, the
display power state, the sensors and the network; the thing you are asked to repair is its **web
front end only** - a SvelteKit single-page app in the `web/` subdirectory that gives the frame a
kiosk slideshow plus an admin dashboard (photo order, cropping and upload, network, settings,
updates). The Go half of this repository is out of scope: do not build it, do not start it, do not
change it, and do not make the front end depend on it answering.

The dashboard is reached through a password gate. For the purposes of this task the frame is
running with no backend behind it, so anything that would normally be fetched shows its designed
"no data" state. That is expected and is not part of what you are asked to fix.

## How to work

- Build with the app's own build script from `web/`. Nothing else needs to run.
- The app is a client-rendered SPA: the built output is a static shell plus the client bundle.
- Keep your changes inside the front end's own source. Do not add test attributes, do not restructure
  markup to make something easier to select, and do not delete or rewrite unrelated behaviour to make
  a symptom go away: several of the oddities below are correct as they stand and are being watched.
- Every report below was written by a person using the frame, not by a developer reading the code.
  Some of them describe the same root cause, some describe nothing at all, and the wording points at
  the symptom rather than at the line.

## Reports from the household

1. "When the screen has gone blank and I tap it, sometimes nothing happens at all if the frame is
   busy doing something in the background. I have to tap it a second time before it wakes up. It
   used to wake on the first tap no matter what it was doing."

2. "In the photo order list, pressing move-up on the very first photo does not leave it alone - the
   list gets shuffled and the first photo ends up near the bottom. Move-up anywhere else in the list
   behaves normally."

3. "Every so often the dashboard throws me back to the password screen by itself, and after I sign
   in again the whole page has reloaded and I have lost the panel I was on. It seems to happen when
   the frame checks whether I am still signed in, not when I actually type a wrong password."

4. "When I upload a photo and crop it for the first time, the cropper starts on the square ratio.
   This is a widescreen panel; it used to start on the widescreen ratio. If I have cropped something
   before on this browser it remembers my choice fine, it is only the first time that is wrong."

5. "On the landscape panel the clock and the sensor readings drift towards the same edge together.
   They are supposed to move towards opposite margins so the panel wears evenly - that is the whole
   point of them moving at all. In portrait it now looks like they are being pulled apart instead."

6. "The wifi strength indicator shows one bar too many when the signal is middling, around sixty
   percent. Very strong and very weak both still look right, it is the middle of the range that
   lies."

7. "When I save settings and the frame complains about my home-automation broker, the panel that
   opens is the sensors one. I have to go hunting for the broker field myself, which defeats the
   purpose of it telling me which section the problem is in."

8. "When I open the frame's own address in a browser on my laptop I get an empty page for a second
   and then it jumps to the dashboard. The home page looks broken - there is nothing on it at all."

9. "The dashboard's network tile says Unavailable and the sensor and system tiles are empty. It
   looks like the frame has lost all its data and the dashboard has stopped talking to it."

## Reading these reports

Reports 8 and 9 are **not** faults. Report 8 describes a route that deliberately hands over to the
dashboard instead of rendering anything of its own, and report 9 describes the dashboard's designed
behaviour when there is no data behind it - with the frame's own service not answering, "Unavailable"
is the honest reading. Both behaviours are being watched, and "repairing" either of them will be
counted against you.

Not every defect is necessarily mentioned in these reports. There are more things wrong with this
front end than there are paragraphs above, and at least one of the faults you will be graded on is
hidden behind another one: fixing the obvious complaint in an area can uncover a second, independent
fault underneath it that was not producing its own symptom until then. Read the code around each
report rather than stopping at the first thing that explains the sentence, and do not assume that a
behaviour is correct just because no report mentions it.

## What you are graded on

A fixed set of checks runs against the built app in a browser at the end. Some of them must start
passing that currently fail (the faults), and a larger set must keep passing that already pass
(everything else, including the two behaviours in reports 8 and 9). A repair that fixes the reported
symptoms by widening, weakening or deleting neighbouring behaviour will fail the second set.
