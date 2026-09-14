# Repair Task - Visual Sorting (Svelte)

You are working on the source code of **Visual Sorting** ("The Sound Of
Sorting"), a SvelteKit + Svelte 4 application that visualizes sorting
algorithms: an array of bars is sorted on screen while live metrics
(comparisons, swaps, array accesses) tick in the header, optionally with
sound. The project lives in this workspace; it builds with `npm run build`
(SvelteKit static adapter, output in `build/`, served from that directory at
the site root). The app is fully offline - there is no backend.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "I start a sort and watch the bars moving for a while - the sort is
   clearly doing work - but the three counters up in the header
   (comparisons, swaps, accesses) just sit at 0 for the whole run. I tried
   several algorithms, it is the same everywhere. The numbers never tick."

2. "The Delay slider in the controls card does nothing. I drag it left and
   right, the millisecond value shown next to it stays frozen at whatever it
   was when I opened the page, and the sorting speed does not change at all
   either."

3. "I use compare mode a lot. When I set the second panel to Bitonic Sort,
   the size control should switch to that picker that only offers powers of
   two (Bitonic cannot handle other sizes). It does not switch - I keep the
   normal slider and can pick a size that Bitonic then chokes on."

4. "Sound thing: I pick a different sound in the speaker menu up top, say
   Sine, and it plays fine. But when I press m to mute and m again to
   unmute, it comes back as the original Triangle sound instead of the Sine
   I had chosen. Every time."

5. "I cycle through the algorithms with the keyboard shortcuts (the [ and ]
   keys). It used to wrap around the list, but now it just stops when I
   reach the first or the last algorithm - pressing the key again does
   nothing, I have to cycle all the way back the other direction."

6. "I keep bookmarks like .../?algorithm=quick-sort or ones that also have
   &compare=merge-sort at the end. Opening such a link used to start the app
   with exactly that selection; now it always comes up with the defaults and
   ignores the link."

7. "That What's New popup: I click it away, and the very next time I load
   the page it is back. It only stays away while I keep the same tab open -
   after a reload or a new tab I get it again."

8. "Small annoyance: I set the speed slider to a slower setting yesterday,
   and today after a refresh the slider was still sitting at that slow
   setting. It should really go back to the default speed on every refresh."

9. "I was tracking my numbers while experimenting: I ran a few steps, noted
   the comparison and swap counts, hit Shuffle to get a fresh array - and all
   three counters were reset to zero. I expect the counters to keep their
   values across a shuffle."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` / `data-active`
  attributes - they are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and reasoning about it.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the application's
behavior (control buttons, algorithm and pattern selection, the size and
delay sliders, running sorts, the sound menu, compare mode, themes, keyboard
shortcuts, reload persistence). Your score reflects
**how many of the defective behaviors you actually fix** (fail-to-pass)
while keeping the already-working behaviors intact (pass-to-pass). Fixing
only some of the defects gives partial credit. You cannot see the
interaction script or its expectations while solving.

## Context

- Build: `npm run build` (SvelteKit/vite; `node_modules` is already
  installed). Output: `build/`, served from the site root.
- A first-visit "What's New" dialog appears on a fresh profile; it can be
  dismissed with its button.
- Keyboard shortcuts exist (start/stop, step, shuffle, speed, sound mute,
  algorithm cycling) - press `?` in the app for the list.
- Task type: `repair` (multiple independent defects).