# Repair Task - solid-primitives documentation site (SolidJS + TypeScript)

You are working on the source tree of **solid-primitives**, the SolidJS
community's collection of utility primitives. It is a pnpm workspace monorepo:
about 85 small standalone library packages under `packages/`, plus a
documentation site under `site/` built with SolidStart, vite and Tailwind
utility classes.

The site is what this task verifies, not any individual library's published
bundle. The site resolves every workspace package through its SOURCE entry
rather than through a prebuilt output directory, so a change you make in a
package's sources shows up on the site the next time the site is built - you do
not have to build the library package itself first. For every package that
ships an interactive dev harness the site prerenders a playground page at
`/playground/<package-name>/`; the packages without a harness still get a
documentation page. Each of those is a real static document on disk, so the
checker navigates directly to one page at a time and interacts with that page
only.

The two build steps below are BOTH required, in this order. The first one
regenerates the site's package manifest; the site's own vite configuration
imports that generated file and refuses to configure itself without it.

```
pnpm -dir site run generate && pnpm -dir site run build
```

The static face lands in `site/dist/client`, which is what the verifier serves
from the site root. Dependencies are provisioned offline by the harness, and
neither the build nor the running site makes any network request.

Environment notes - properties of this offline harness, not defects:

- There is no network access, and nothing in this project needs it. The many
  external links rendered on the documentation pages (to the npm registry, to
  the SolidJS site, to GitHub, to specification drafts) are ordinary anchor
  tags: they are never fetched, and no script, stylesheet, image or font is
  loaded from a remote origin on any page the checker visits.
- The harness drives the pages in a real browser at a **1280x900 viewport** and
  spoofs a desktop user-agent string. Nothing in this project branches on the
  user agent, so that has no effect on what you see.
- Every checkpoint starts from a fresh browser context, so state left over from
  an earlier interaction never carries into the next one. The pages themselves
  persist nothing: no local storage, no session storage, no cookies, no URL
  state. The one storage key the site ever touches is a theme preference that
  is only READ at boot and only written when a visitor clicks the theme button,
  which the checker never does.
- The playground pages are prerendered as static documents and then finish
  rendering in the browser, and each one pulls its harness in as a separate
  lazily loaded chunk. A page is therefore briefly empty after navigation and
  fills in a moment later. That is normal here, not a defect.
- The site build prerenders well over a hundred documents and prints routine
  toolchain advisories while doing so. Warnings on stderr are not defects as
  long as the build still succeeds and the documents are still emitted.
- The pages are demo pages: their copy is short, their sample data is fixed, and
  several of them deliberately render a placeholder when a case is not handled.
  Read a page's own captions before concluding that a placeholder is a bug.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different module
  than the one the symptom appears in - on this site it very often sits in the
  library package the page demos rather than in the page itself - and a single
  reported symptom can have more than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.
- Do not remove, rename or repurpose any `data-rb-*` attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "On the keyboard demo (`/playground/keyboard/`) the three-key combination
   has stopped working. Pressing Q on its own still pops the little red message
   'Q pressed', and Control+P still pops 'Control P pressed', but Control+E+R
   pops nothing at all, no matter how carefully I hold Control down first and
   then tap E and R in order. The page is definitely seeing my keys - the
   'Pressed keys' readout under 'Is pressing Shift?' shows CONTROL, E, R while
   I hold them. It is only the three-key combination that never fires."

2. "The text highlighter page (`/playground/marker/`) does not highlight
   anything any more. I click into the box under 'Highlight search', type
   lorem, and the two paragraphs of sample text below stay completely plain -
   not one highlighted span, and no error either. The box keeps the text I
   typed, so the field itself is fine. I also tried reloading and typing a
   different word; same thing, nothing is ever marked."

3. "On the timers page (`/playground/timer/) there are two counters stacked
   vertically, the top one headed setTimeout and the bottom one headed
   setInterval, each with a 'Delay: ... ms' line, a 'Count: ...' line and four
   buttons (x10, Reset, Pause/Unpause, ÷10). Pause is broken: I press Reset so
   the count is back to 0, I press Pause/Unpause, and the count just keeps
   climbing. The delay line still reads 'Delay: 1000 ms' and the button still
   looks pressed, so it is not that the button is dead - the counter simply
   ignores it. Both counters do it."

4. "The translations page (`/playground/i18n/) has a 'Change Name' button
   that is supposed to flip the name used in the greetings back and forth
   between User and Viewer. It only works once now. First click takes 'hello
   User, how are you?' to 'hello Viewer, how are you?' and 'goodbye User' to
   'goodbye Viewer'; from then on every further click leaves both lines on
   Viewer for ever. The three language buttons (English, French, Spanish) and
   the 'Current locale' line all still behave."

5. "On the flux store demo (`/playground/flux-store/`) the Ages list shows
   three people - Alice, Bob and Tom - each as a clickable name followed by
   their age. Clicking a name is supposed to age that person by one year, and
   now it does nothing: I clicked Alice's name three times and her line still
   reads 'Alice : 45 years old'. Bob still reads 40 and Tom still reads 35, and
   the Counter Information panel and its button underneath still work, so the
   page is alive. It is only the ageing click that has gone dead."

6. "The list operations page (`/playground/list/) starts with five rows
   holding 0, 1, 2, 3, 4, and each row has four buttons: 'Insert before',
   'Delete', 'Replace' and 'Insert after'. 'Insert before' is eating a row
   instead of adding one. I press 'Insert before' on the very first row and I
   end up with FIVE rows reading 5, 1, 2, 3, 4 - the 0 has been destroyed -
   where I expect six rows reading 5, 0, 1, 2, 3, 4. 'Insert after' on the same
   row is fine and gives me six rows, and 'Delete' and 'Replace' behave too.
   The array readout at the bottom of the page shows exactly what I described."

7. "On the pattern matching page (`/playground/match/`) there is a dropdown to
   pick an animal and three panels below it. When I pick the bird, the middle
   panel - the one captioned 'Partial Match / Only handles dogs and cats' -
   shows 'Fallback content', while the bottom panel shows the bird emoji and
   'Can fly'. Is the middle panel broken for birds? It seems inconsistent that
   one panel knows the bird and the other does not."

8. "Two things about the keyboard demo (`/playground/keyboard/`). The red
   message that pops up in the top-right corner when a shortcut fires deletes
   itself about three seconds later without me doing anything - I expected it
   to stay until I dismissed it. And the page never remembers anything between
   loads: reload it and the corner is empty again, the 'Pressed keys' line is
   blank again. Should it not remember where I left off, the way a real app
   would?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the other shortcuts and readouts on the keyboard page, the sample
paragraphs and the search field on the highlighter page, the other buttons and
both delay readouts on the timers page, the language switching and every other
translated line on the translations page, the counter panel, the boxes demo and
the wizard annotations on the flux store page, all three panels and the
dropdown on the pattern matching page, the todo list's add / toggle / remove
controls and its double-click-to-edit flow on the state machine page, the
keyed list's add and remove controls and its empty-state message on the keyed
page, the calculator heading and its rendered expression on the tokenizer page,
and the shuffle, rotate and custom-array controls on the list page - none of
which any single report describes in full. The site must still build with the
two commands above, and must still emit a playground document for every package
that has a dev harness, when you are done.
