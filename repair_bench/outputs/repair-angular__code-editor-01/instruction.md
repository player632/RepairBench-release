# Repair Task - code-editor (Angular 20 + TypeScript, a CodeMirror 6 editor library and its demo site)

You are working on the source code of **code-editor**, an Angular monorepo that
ships two things: a small editor library, and the demo site that exercises it.
The library wraps CodeMirror 6 - a browser code-editor toolkit - in two
standalone Angular components: a single-document editor (`<code-editor>`) and a
two-document merge/diff editor (`<diff-editor>`) that can render its two
documents either side by side ("split") or as one document with inline change
markers ("unified"). Both are ordinary Angular components with `@Input()`
properties and `ControlValueAccessor` support, so a host application can
two-way bind a document to them with `[(ngModel)]`.

The demo site is the part that gets built and served, and it is the whole of the
user-visible surface. It is a two-page site inside a fixed shell: a Material
toolbar across the top carrying the project's tagline on the left, a flexible
spacer, and one round icon link to the project's repository on the right (it
opens in a new tab), with the routed page underneath. There are three routes -
the bare address of the site, a home page and a diff page - and the bare address
is meant to land you on the home page. Both pages render inside that same
toolbar shell, so anything wrong with the shell is wrong on both of them.

The home page is two side-by-side sections, each a sticky configuration panel on
the left and live editors on the right.

The first panel is titled "Code Editor Config" and drives the main editor. Its
form is generated from one configuration object and offers a language picker (a
searchable combobox of 143 languages, sorted alphabetically, JavaScript selected
at load), a Light/Dark Theme toggle, a Basic/Minimal/None "Setup" toggle that
chooses how much editor chrome the component builds, five on/off switches
(Disabled, Readonly, Indent with tab, Line wrapping, Highlight whitespace) and
two text fields (Placeholder, Indent unit). To its right sits a "Toggle output"
button above the editor, then the editor itself - five hundred pixels tall and
two-way bound to a document signal - and, when the output pane is open, a plain
`<textarea>` beside it bound to that very same signal, so the two always show the
same text. Below that, under the heading "Unified diff-editor", a second editor
shows one fixed demo document as a unified merge view against another fixed
original.

The second panel is titled "Diff Editor Config" and drives the split view. Its
form offers an Orientation toggle (a-b or b-a), a Revert controls toggle (a-to-b,
b-to-a or none) and two switches (Highlight changes, Gutter - both on at load).
To its right, under the heading "Split diff-editor", a `<diff-editor>` shows the
same two fixed demo documents with those four settings bound straight from the
form.

Documents on the home page are not typed in: when the page opens the app fetches
a short sample source file for the selected language out of a folder of 58 sample
texts that ships inside the site itself, and puts it in the main editor. Picking
a different language in the combobox fetches that language's sample the same way.
The demo documents behind the unified and split views are fixed five-line strings
built into the page, so they never vary between runs.

The diff page is a working bench for the split editor. It shows one
`<diff-editor>`, two-way bound to its own document signal, with its orientation,
revert controls, highlight-changes, gutter and disabled settings all driven by
seven plain buttons underneath it - "change original value", "change modified
value", "orientation", "revertControls", "highlightChanges", "gutter" and
"disabled" - each of which flips or rewrites exactly one of those settings. The
"orientation" button is a two-way flip: one click exchanges the two sides, the
next click puts them back. Below the buttons sits one more `<code-editor>`
showing a unified merge view of a third fixed document.

The project builds with the Angular CLI through Yarn (`yarn run build`, which
runs `ng build dev-app --base-href=/code-editor/`). It is a production-style AOT
build under a strict TypeScript configuration with strict template type
checking, and its output folder is served by the verifier under the
`/code-editor/` path - which is why the built document carries a `<base>` tag for
that path, and why relative addresses inside the app resolve against it rather
than against the origin. Dependencies are provisioned offline by the harness.

Environment notes - properties of this offline harness, not defects:

- There is **no network access**, and nothing in this project needs it. Every
  document, sample text and icon is served from the same origin as the page
  itself, so the same screen shows the same bytes on every run and on every
  machine. The built document performs **zero remote-origin requests**; the only
  external address anywhere in the UI is the repository link in the toolbar,
  which is a plain anchor the app never fetches and that no check ever follows.
  Do not add a remote reference, a CDN script, a web font or an analytics tag:
  that would be a regression, not a repair.
- The harness drives the site in a real browser at a **1440x900 viewport**, with a
  spoofed desktop user agent and a fixed locale and time zone. Every checkpoint
  starts from a **fresh browser context**, so nothing carries over between
  checks, and the app persists nothing - no local storage, no session storage, no
  cookies, and no state in the URL beyond the route itself.
- Some readings only exist as a *sequence in time*: a toggle that must flip and
  then flip back, a click that must swap two panes and a second click that must
  restore them, a value written into an editor that already holds text. Those are
  checked by performing the sequence with real settling time between the steps, so
  a page that merely looks right at load is not enough.
- The build is a strict AOT build: every file must still type-check and every
  template binding must still be type-correct when you are done. It prints
  bundle-budget warnings and a few stylesheet-selector warnings on a healthy tree
  and still succeeds, so a warning is not by itself a problem.
- The harness ships a small **read-only observation bridge** inside the demo
  application. It is loaded at bootstrap and publishes getters for things the
  browser has already rendered - element censuses, computed styles, text, layout
  boxes, resource timings - so the checker can read the live page instead of
  guessing at it. It writes to no component field, changes no behaviour, carries
  no styling, and is not part of the library. **Do not remove, rename, repurpose
  or extend it, and do not delete the statement that loads it** - it is required
  by the checker. Equally, do not add markup or styling to the page in order to
  make a reading come out right: the bridge reads the real DOM, so a hardcoded
  value shows up exactly where it was hardcoded.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and in a different layer than the one you can see:
  a template binding, a stylesheet rule, a decorator's metadata array, a route
  record and the component method behind a button are halves of one contract, and
  the library and the demo site are halves of another.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Behaviors you break while fixing other things still count against you, and the
  two pages share the same toolbar, the same two editor components and the same
  stylesheets, so a change made for one page is visible on the other.
- Keep the read-only observation bridge described above exactly as it is.

The reports, in no particular order:

1. "On the home page I clicked "Minimal" under Setup and all the line numbers disappeared from the two editors. The fold arrows and the current-line highlight went with them. An editor without line numbers is unusable - please bring them back."

2. "In the diff view there are little "Accept" / "Reject" buttons floating inside the editor between the two documents, and on the home page the same pair shows up in the unified demo editor. They do not match the rest of the UI and look like leftovers from some merge tool that were never removed."

3. "Opening the site at its plain address drops me on the diff page now. It always used to come up on the home page with the two config panels. If I type the home page address in myself it works fine, and the diff page address works fine too - it is only the bare address that lands in the wrong place."

4. "The main editor on the home page is empty. Just the grey "Type your code here..." placeholder and no code at all, where it used to come up with the JavaScript sample in it. Changing the language does not help either - I picked Python, I picked Rust, the box stays empty every single time. The unified editor underneath it and the split view on the right still have their text, so it is only the big one that lost it."

5. "The entire site has gone dark and I cannot find the setting that did it. Black page background, white text, a near-black toolbar, dark form fields - from the very first load, before I have clicked anything, and the same in a fresh profile and after a reload. The Theme control on the home page still reads Light, and flipping it to Dark only changes the code editors, which is what I would expect that control to do; it does not put the page around them back the way it was. Nothing looks broken, everything is just inverted."

6. "The "Toggle output" button on the home page works backwards. When the page loads there is already a big empty text box sitting next to the editor and squashing it to half the width, and clicking the button makes it go away. It used to start with just the editor at full width and bring the text box up when you asked for it."

7. "On the diff page the "orientation" button only works once. The first click swaps the two documents over exactly as it should, and then every click after that does nothing at all - it stays swapped however many times I press it. The only way I can get it back is to reload the page. The other six buttons on that page all still work as many times as I like."

8. "Small cosmetic thing: the repository icon at the right-hand end of the toolbar has lost its button styling. It is a bare link now - no round background, no hover effect, the wrong size, and it does not line up with the bar the way it used to. It still points at the right place and still opens in a new tab, so the link itself is fine."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the toolbar shell and its single repository link, the three routes and
their deep links, the two configuration panels and every field in them, the
language picker and the sample it loads, the Setup and Theme presets, the output
pane and its two-way text, the unified and split demo documents and the settings
that drive them, the seven control buttons on the diff page, the merge view's own
chunk controls, and every reading that was already correct - none of which any
single report describes in full. The project must still build with the command
above when you are done.
