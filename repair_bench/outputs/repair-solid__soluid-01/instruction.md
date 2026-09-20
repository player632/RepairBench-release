# Repair Task - soluid (SolidJS + TypeScript, a component library and its catalog site)

You are working on the source code of **soluid**, a SolidJS component library.
It ships a little under seventy UI components - overlays, form controls, data
display, navigation, feedback - as plain TypeScript source that its own CLI
copies into a consumer project, together with a CSS-variable theme and no
runtime styling dependency. Everything the components share lives in a small
`core/` folder of headless primitives: an overlay primitive that owns mounting,
the closing animation and the page scroll hold; a focus-trap primitive that
moves focus into an overlay, keeps it there and gives it back on close; a toggle
primitive; and a toast queue. Most components are thin: they render markup and
hand the behaviour to one of those primitives, so a defect that shows up in a
component's demo is quite often rooted in the primitive underneath it, and the
same primitive usually has more than one consumer.

The library documents itself with a **catalog site**: one page per section, and
a Components page that renders one card per component. Each card has three tabs
- Demo, Code and API - and the Demo tab mounts a live, interactive instance of
that component with a small amount of demo data around it (a four-row table of
people, a file tree, a three-item checkout flow, a three-slide carousel, a
dialog with Cancel and Confirm, a drawer, a toast queue with a handful of
buttons, two switches, an accordion whose third item is disabled, three text
fields of which one has a hint and one has an error). The catalog is built from
the same source tree as the library, so a change to a component is visible in
its card immediately.

**How your work is checked.** The verifier restores the project's dependencies
offline, builds the catalog with the project's own local vite
(`./node_modules/.bin/vite build --config vite.config.catalog.ts`, output in
`docs/`), serves that build from a static origin, and drives the Components page
in a headless browser at a fixed 1440x900 viewport. Every check is a real
interaction on that page - a click on a demo control, a Tab or Escape keypress,
a wait for an animation to finish - followed by reads of the resulting DOM:
which element holds focus, what a control's `aria-checked` / `aria-sort` /
`aria-expanded` / `aria-current` / `aria-describedby` says, which rows are
rendered, what text a toast prints, whether `<html>` and `<body>` still carry an
inline `overflow`, whether any storage, cookie, URL or global residue survives
the interaction. The demo instances carry a few inert `data-testid` marker
attributes so a check can address the same control on every build; they carry no
behaviour and no styling. **Keep them exactly as they are** - the checks address
them, and a check that cannot find a handle reports a broken state rather than a
repaired one. Equally, do not add markup, state or a special case in order to
make a reading come out right: the checks read the live component, so a
hardcoded value shows up exactly where it was hardcoded, and a repair that
publishes state on `window`, in storage or in the URL is checked for directly.

Two more things about the graded surface, because they are easy to trip over:

- The checks read the **live component inside a card's Demo area**, never the
  card's own Demo/Code/API tab strip and never the Code or API panels. Those two
  things look alike in the markup - the tab strip is built from the same tab
  primitive the components use - and confusing them produces a repair that
  changes the catalog instead of the library.
- The catalog page is fully offline: no remote stylesheet, font, script or image
  is referenced by the build the verifier serves, and no check depends on the
  network. Anything you add must keep it that way.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the source tree. The root cause is frequently in a different file
  than the one the symptom appears in, and in a different layer than the one you
  can see: the overlay primitive, the focus primitive and the scroll hold are
  three halves of one contract shared by every popup in the library, and the
  toast queue and the toast that renders it are two halves of another.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Behaviors you break while fixing other things still count against you, and
  because the components share primitives, a change made for one card is visible
  in every other card that uses the same primitive.
- Keep the inert marker attributes described above exactly as they are.

The reports, in no particular order:

1. "After I close a dialog - or the slide-in panel from the right, same thing -
   the page behind it stays frozen. I can scroll nothing any more: the wheel
   does not move, the scrollbar does not move, arrow keys do not move. The
   popup is really gone, focus is back on the button I pressed, and the page
   just refuses to scroll until I reload. It also happens with the drawer, so it
   is not one component."

2. "If I close a dialog and click the same trigger again straight away - not
   even a second, just as it is fading out - the dialog does not come back. The
   screen goes back to normal for a moment and then there is nothing on it, and
   the page is stuck unscrollable again, so I have to click the trigger a second
   time to get the dialog I asked for the first time. If I wait a beat before
   re-opening, it is fine."

3. "Every toast now prints the name of its style instead of my message. I raise
   an info toast that should say something like `Info notification` and the box
   says `info`. A success toast says `success`, an error toast says `danger`.
   The colours are right, the icon is right, the little close button is right
   and the screen reader announcement is right - it is only the words, on every
   single toast, all the time."

4. "Sorting in the table only goes one way. I click the Name header and it sorts
   A to Z with the little arrow pointing up, good. I click the same header again
   to reverse it and nothing happens at all: same order, same arrow. Click it a
   third time, a fourth - always A to Z. The other sortable column behaves the
   same. I cannot get a descending sort out of it any more."

5. "The checkout progress indicator ticks off the step I am actually on. It
   shows three steps, I am on the second one, and the second one is drawn as
   completed with a check mark and the word `completed` in its label, exactly
   like the first. Nothing in the whole list is marked as the current step any
   more, so I cannot see where I am - and the same is true of the vertical
   copy of the indicator underneath it."

6. "The accordion has gone backwards. The third item is the one that is supposed
   to be disabled - it is greyed out, it is not keyboard reachable, and clicking
   it has always done nothing. Now clicking it opens it. And the two items that
   are supposed to work will not: I click the second one and it stays shut, I
   click the first one and it will not close. It is exactly inverted."

7. "Small thing but it looks unfinished: the carousel's arrow buttons never grey
   out. On the very first slide the left arrow still looks clickable, and on the
   very last slide the right one does too. Every other slider I use disables the
   arrow at the end it cannot go past, so a user clicks it and nothing happens.
   Shouldn't they be disabled at the ends?"

8. "There is a dead row in the file-tree demo. `src` and its children respond,
   `README.md` responds, but the last entry - the lockfile - does nothing at
   all when I click it: it does not get selected, it does not expand, no focus
   ring, no highlight, as if the click handler is not attached. I tried it in
   two browsers."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the library's behavior intact -
including everything no report describes: the overlay contract that puts focus
into a popup, keeps Tab cycling inside it and returns focus to whatever opened
it; the scroll hold that a popup takes while it is open and the fact that a
popup which is closed leaves nothing behind; the controlled form components that
report a press back to the owner that holds their state, and the ones that are
deliberately disabled and must never move; the queue semantics behind the toast
container, including which toast leaves when one of several is dismissed; the
accessible descriptions a field advertises and the fact that a field with
nothing to describe advertises nothing; the wrapping behavior of a looping
carousel in both directions and by direct dot selection; the tree's
expand/collapse contract and the roving tabindex that goes with it; the
distinction between the step you finished, the step you are on and the step you
have not reached; which accordion item is interactive; the catalog cards
themselves with their three tabs; and every reading that is already correct.
The catalog must still build with the command above when you are done.
