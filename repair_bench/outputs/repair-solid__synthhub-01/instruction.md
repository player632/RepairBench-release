# Repair Task - SynthHUB (Astro + SolidJS + TypeScript, a browser-side synthesizer manager)

You are working on the source code of **SynthHUB**, a progressive web app for
managing Music Tribe / Behringer synthesizers from the browser. The front end is
an Astro 7 site whose pages are prerendered and whose interactive parts are
SolidJS 1.9 islands written in TypeScript; state lives in a small zustand-style
store plus two browser-side persistence layers: one holds the sequencer's own
snapshot and a couple of UI preferences, the other holds the patch and pattern
libraries. The tree also contains a Go service and an Astro
server adapter, but **none of that is part of this task**: the graded surface is
the static client build only, and the app is expected to be fully usable with no
synthesizer connected and no network access at all.

What the app gives a user, and what the checks therefore drive:

- A **workspace** with a transport bar (USB bus state, MIDI state, synth count,
  connect / enable / scan / panic controls), a **catalogue of 71 device models**
  with a filter field, a device editor in the middle and a **MIDI monitor /
  SysEx log column** on the right that can be hidden and shown.
- A **device editor** per model, with a strip of function tabs - device
  settings, step sequencer, poly chain, calibration, firmware info - where each
  tab renders a different subtree. The settings tabs render the device profile's
  controls: on/off switches, number fields with steppers, dropdowns, radio
  groups and, on some profiles, sliders. Changing a control writes to the store
  and echoes a SysEx message into the monitor column.
- A **step sequencer**: a 16-step mono grid (gate / note / accent rows), pattern
  slots in 8 banks, transport (play, rec, roll, on-screen keyboard, generative
  tools, libraries), tempo, swing and pattern-length controls. Editing persists
  into the browser a fraction of a second after the edit.
- **Generative tools** (euclidean, melody, evolve, humanize) that write into the
  current pattern, a **pattern library** and a per-device **patch library**
  backed by the browser's own object store, a **command palette**, a **keyboard-shortcut help modal**,
  and a set of global hotkeys (including single-letter ones such as the clear
  command and the device-to-device navigation keys).
- Picking a model in the catalogue navigates **in-app**: the address bar moves,
  the editor swaps, and the document is not reloaded.

**How your work is checked.** The verifier restores the project's dependencies
offline, builds the site with the project's own local toolchain
(`cd app && ./node_modules/.bin/astro build`, output in `app/dist/client`),
serves that build from a static origin and drives it in a headless browser at a
fixed **1440x900** viewport, `en-US` locale, UTC clock, with every off-origin
request blocked. Each check is a real interaction - a click on a step cell, a
press of a stepper arrow, a drag of a slider, a key combination, a page reload,
a wait for a debounce to land - followed by reads of what the running app now
shows: the rendered text and attributes of a control, which cells are lit, what
the app wrote into its own storage, which rows a library lists, where the
address bar ended up, how deep the session history is. A few checks read the
state that survives a reload, because persistence is part of the product.

The interactive surface carries a set of inert `data-testid` marker attributes
so a check can address the same control on every build. They carry no behaviour
and no styling. **Keep them exactly as they are** - a check that cannot find its
handle reports a broken state rather than a repaired one. Equally, do not add
markup, state or a special case in order to make a reading come out right: the
checks read the live app, so a hardcoded value shows up exactly where it was
hardcoded, and a repair that publishes state on `window`, in storage, in a
cookie or in the URL is checked for directly. Two more things that are easy to
trip over:

- The checks read the **live app inside the workspace** - the catalogue, the
  editor, the sequencer, the libraries, the palette, the monitor. They never
  read a marketing page, and nothing in them reaches the network: no remote
  script, font, stylesheet or image, and no server endpoint. Anything you add
  must keep it that way.
- With no hardware present the transport bar reports an idle USB bus, a denied
  MIDI access and zero connected synths, and that is the app's normal, intended
  state - the whole editor is explorable offline. It is not a fault and no check
  expects a device.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the source tree. The root cause is frequently in a different file
  from the one the symptom appears in, and in a different layer from the one you
  can see: the editor, the sequencer engine underneath it and the browser
  storage the engine writes to are three halves of one contract, and the
  catalogue, the palette and the global hotkeys are three consumers of another.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Behaviors you break while fixing other things still count against you, and
  because the panels share primitives and a store, a change made for one report
  is visible in every other panel that uses the same primitive.
- Keep the inert marker attributes described above exactly as they are.

The reports, in no particular order:

1. "Whatever pattern I am currently working on is gone after a reload. I light
   up a few steps on pattern 1A, give it a second, reload the page, and the grid
   comes back empty. The maddening part is that it is not the saving that is
   broken: if I move to another pattern slot first and then reload, that other
   one is there. It is always the one I was actually editing that disappears."

2. "The generative tools do not know when I resize the pattern. I open the GEN
   bar, then drag the pattern length from 16 down to 8, then run one of the
   generators - and it fills the pattern as if it were still 16 steps long, with
   pulses in places that make no sense for the length I just set. If I close the
   GEN bar and open it again after resizing, it behaves. So it seems to remember
   the length from when I opened it."

3. "Tempo changes are lost if I am quick. I drag the tempo to somewhere around
   178 and immediately click another function tab - or click another synth in
   the catalogue - and when I come back the tempo is what it was before. If I
   wait about a second after moving the slider before switching, it sticks. Same
   thing if I edit steps and switch away at once."

4. "The controls on the device page do not respond. I click an on/off switch and
   it stays where it was, I click the little up arrow next to a number field and
   the number does not move. The odd part: the MIDI monitor at the right *does*
   print a message when I click, so the app knows I clicked something - the
   control just never shows the new value. Dropdowns and the rest look the same
   story. It is like that on every synth I open, and a reload does not help."

5. "Once I have used the on-screen keyboard, my keyboard shortcuts are dead. I
   open the little piano from the sequencer transport, play a couple of notes,
   close it again - and from then on none of the single-letter shortcuts do
   anything for the rest of the session: clear does not clear, the keys that
   walk me from synth to synth do not move. Space still plays and stops, the
   command palette still opens with its shortcut, the help still opens with `?`.
   Reloading the page brings the letters back, until I open the piano again."

6. "In the command palette: I open it, press the down arrow a few times to get
   to the entry I want, then type to narrow the list - and Enter does nothing at
   all. No navigation, the palette does not even close, and no row is highlighted
   any more. If I open the palette and just type without touching the arrow
   keys, Enter works fine and takes me to the first match. It only breaks once I
   have arrowed down before typing."

7. "Is the app broken? The bar at the top says `0 synth(s)`, `USB:idle (0)` and
   `MIDI:denied - in 0 / out 0`, and clicking connect or scan never finds
   anything. I cannot see my hardware anywhere and I assumed nothing in here
   would work without it."

8. "Question about the euclidean generator, I think it is off by something. With
   the rot knob left at zero, four pulses over sixteen steps always come out on
   steps 1, 5, 9 and 13 - the first pulse is always on the very first step and
   the knob at zero changes nothing at all. Six pulses gives me six, evenly
   spread, again starting on step 1. Shouldn't the rotation do something there?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the app's behavior intact -
including everything no report describes: the function tabs and the fact that
each one mounts and disposes its own subtree; the widget set on every device
profile, its initial values, its bounds and the SysEx line a change writes to
the monitor; the step grid's editing, clearing, randomizing, its pattern-length
geometry and the slot switching that keeps an edit when you come back to it; the
transport's play/stop state machine; the tempo, swing and length controls and
what they persist; the pattern library's empty state, its per-device scope and
the deliberately unscoped "all devices" view; the patch library's per-device
listing; the catalogue's filtering and the in-app navigation that never reloads
the document; the command palette's filtering, its Escape and its Enter; the
help modal and the rest of the global hotkeys; the monitor column's show/hide
preference; the offline, no-hardware state of the transport bar; and the fact
that a session leaves no residue behind - no stray storage keys, no cookies, no
globals, nothing appended to the URL. The site must still build with the command
above when you are done.
