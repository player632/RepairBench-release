# Repair Task - comine (SvelteKit + Svelte 5 + TypeScript)

You are working on the source code of **comine**, a cross-platform media
downloader: a desktop application shell built with SvelteKit (Svelte 5 runes),
TypeScript and vite, packaged for the desktop by a native wrapper. The wrapper
supplies every backend capability - the job queue, the finished-download
history, the settings store, the disk-space and dependency checks, the update
check, the clipboard and the notification centre - so the frontend reaches the
outside world only through that bridge and never talks to a server of its own.

The window opens on a splash screen and then reveals the app: a title bar with
the product name and an aggregate transfer-speed read-out, a left-hand sidebar,
a content area, and a bottom navigation strip. The sidebar and the strip carry
the same five destinations - Download, Downloads, Settings, Info and Logs - and
the Downloads entry grows a badge while anything is in flight.

The Download view is where you paste an address. The app works out what you
gave it: a single video, a playlist, a channel or a profile page, a direct link
to a media file, or something it cannot handle at all, and it changes the
options it offers accordingly. Beside the field sit the quality, mode and audio
choices, a set of one-tap presets, and the button that resolves the address and
queues the work. The Downloads view lists the queue and the finished history
with a thumbnail, a length, a size and a status for each item, and offers
search over both. Settings holds the appearance and behaviour preferences -
including the unit sizes are displayed in, the accent colour the whole theme is
generated from, the window background and the local extension port - and Info
and Logs report the build and the runtime log.

Throughout, the same handful of small helpers do the everyday work: turning a
byte count or a transfer rate into text, turning a number of seconds into a
length, deciding what kind of address was pasted, scoring how well an item
matches the words you typed, matching a key chord against a declared shortcut,
converting a colour between representations, bounding the small in-memory
caches, and delaying a burst of edits into one action.

The project builds with the package manager's own build script, which first
type-checks the whole tree and then bundles it; the verifier serves the
resulting static output from the site root. Dependencies are provisioned
offline by the harness, and the app makes no network request of any kind at
runtime.

Environment notes - properties of this offline harness, not defects:

- There is no network access, and nothing in this project needs it. The one
  place the app used to reach an external address for its published defaults
  now reads the same document from the application's own origin, byte for
  byte, so the behaviour is unchanged and the runtime is offline.
- The desktop wrapper is not present in a plain browser, so the harness answers
  the bridge on its behalf with fixed, constant replies: an idle session with
  nothing queued and nothing in the history, all optional components reported
  installed, plenty of disk, no pending update, no broadcasts and an empty
  preferences store. Every reading you see therefore starts from the
  application's own shipped defaults. That is a property of the test
  environment, not something to undo, and no application code path is altered
  to produce it.
- The harness drives the app in a real browser at a **1440x900 viewport** and
  spoofs a desktop user-agent string. The application does read that string in
  a few places, always as a mac/linux/other capability switch, and every
  reading that depends on the outcome of such a switch is pinned by a
  checkpoint, so a different desktop family would show up as a red checkpoint
  rather than as a silently different number.
- The shipped default for the animated background pointed at a media file on
  an external host, and that default is emptied by the harness so the offline
  face makes no media request at all. The setting itself, the component that
  consumes it and the settings-page control that changes it are all untouched:
  the value stays user-settable and the animated branch stays reachable.
- Readings are reproducible: the two platform entropy sources this bundle
  reaches for are pinned to a fixed deterministic stream. Neither feeds any
  graded reading - they only name shimmer widths, element identifiers and
  internally generated ids - so pinning them removes run-to-run noise without
  hiding or manufacturing a symptom.
- Every checkpoint starts from a fresh browser context, so state left over
  from an earlier interaction never carries into the next one. The app itself
  persists nothing between loads beyond the two entries its own boot writes:
  no cookies, no session data, no URL state.
- The build stamps the commit identity and the build date into the bundle. In
  this offline tree those stamps read as unknown, which is expected and is not
  a defect. Nothing you are asked about depends on them.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different module
  than the one the symptom appears in, and a single reported symptom can have
  more than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is described in these reports. Behaviors you break while
  fixing other things still count against you.
- Do not remove, rename or repurpose anything the harness added - the bridge
  answers, the reading surface published on the window, or the vendored
  defaults document. They are verification probes required by the checker.

The reports, in no particular order:

1. "I pasted a playlist address - a proper one, with the list id in it - and
   the app treated it like a single video. It offered me the single-item
   options and queued one thing. Playlist links used to be recognised and gave
   me the whole list."

2. "Direct links to video files stopped being recognised when the file sits in
   a folder. I paste something like a CDN address with a couple of path
   segments and a media extension at the end, and the app no longer picks the
   file name out of it - it asks me what to call it. An address where the file
   is the only path segment still works, which is the confusing part."

3. "The size column reads wrong now. Small values lost a decimal place and big
   ones gained one, so the column looks ragged: where it used to say 1.50 it
   says 1.5, and where it used to say 15.0 it says 15.00. The unit itself is
   still the binary one I chose in preferences, so it is not that."

4. "Streams with no known length show `--:--` in the length column. That is
   what a missing length looks like, and it used to say `Live` for these. A
   track that is genuinely zero seconds long still reads 0:00, so it is only
   the live ones that changed."

5. "Searching my history is too generous. If I type two words and an item
   matches only the first of them, it still comes back with a positive score
   instead of being dropped. It used to require every word I typed to match
   something."

6. "The accent colour is off everywhere. Anything the app tints from my chosen
   accent - the lighter side of the wheel especially - comes out over-saturated
   and clipped, as if the colour were being pushed past full intensity. The
   darker shades look right, and the accent value in preferences is unchanged."

7. "This might be me misreading the app, but: a brand-new item in the queue
   shows a size of `0 B` and a speed of `0 B/s` until the first bytes arrive,
   and an item whose length could not be read shows `--:--`. Should those be
   blank or a dash instead, or is that the intended zero contract?"

8. "Following on from the paste field: an ordinary single-video address - no
   list id at all - never offers me the playlist path, and a plain video-page
   address from a site the app does not know as a channel is not treated as a
   channel either. Is that a bug, or is refusing to guess the intended
   behaviour?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the window shell and its five destinations, the paste-and-resolve
flow, the queue and history listings, the preferences defaults, the theme
generation, the log and update plumbing, none of which any single report
describes in full. The project must still type-check and build with the
commands above when you are done.
