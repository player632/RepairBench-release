# Repair Task - Arya, an online Markdown editor (Vue 2 + Vditor)

You are working on the source code of **Arya**, a browser-based Markdown
editor built with Vue 2, Element UI and the Vditor editor kernel, bundled by
vue-cli. It is a small multi-route single-page app: the root route is the
editor itself - a header (brand, a theme picker, an export dropdown with six
entries, a fullscreen toggle and a link to the about page), a collapsible left
sidebar that lists your documents (each row can be renamed inline or deleted,
and there is a button to create a new document) and the Vditor editing surface
in the middle; then one page per export format (image, PDF, Word, PPT preview
and a WeChat-styled HTML export), each of which renders a read-only preview of
the current document and offers a download button; and an about page that also
carries a preview pane. Documents, the active-document pointer and the theme
choice are all kept in the browser's local storage - there is no backend, no
account and no network call anywhere in the flow.

The project lives in this workspace and is fully offline. Dependencies are
supplied as an already-installed tree, the production build is written to
`dist/` and served as the site root, and the routes are real paths rather than
hashes, so pages such as the export pages and the retired legacy address are
reached as ordinary deep links. Because the machine has no network access, a
few things are degraded on purpose and are **not** defects: the Inter and
Newsreader webfonts are gone and every font stack falls back to the local
system faces; the analytics beacon is gone (the in-page shim that the app's own
event helper talks to is still there); and the editor kernel's lazily fetched
extras - code-block colour themes, KaTeX maths, diagram and chart code fences,
and the emoji hint popover - are not vendored, so those specific renderings come
out plain. Two more environment facts worth knowing before you chase them: the
export buttons start real browser downloads, and the app's own global toast
helper is mis-wired upstream and throws on every namespaced call, so a refused
action shows up as "nothing was downloaded", never as a readable message.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "My document list is upside down. I have three notes in the sidebar and I
   always expect the one I touched last to be at the top - that is how it used
   to be. Now the note I have not opened in weeks sits first and the one I just
   finished editing is at the very bottom. Nothing else about the list looks
   wrong: the names are right, the counts are right, only the order is
   backwards."

2. "Every preview pane in this build is empty. I write a full document in the
   editor - headings, paragraphs, a list - and then open any of the export
   pages: the preview on the right stays completely blank, as if there were
   nothing to export. The about page shows the same empty pane. The editor
   itself still has my text, so the document is there; the previews just never
   pick it up."

3. "I cannot switch between documents any more. Clicking a row in the left
   sidebar does absolutely nothing - the highlight stays on the document I was
   already on and the editor keeps showing its text. The strange part: while an
   inline rename box is open on a row, that same click *does* switch me to it.
   So the rows are not dead, they only answer at exactly the wrong moment."

4. "The browser tab title is frozen. It reads like the app's own name and it
   never changes, no matter where I go. The address bar does change and the
   page I land on is the right one - export pages, the about page, all of them
   load fine - but the tab keeps the same title forever, so with three tabs
   open I cannot tell them apart."

5. "An old bookmark of mine is broken. It points at the legacy address the app
   used to have, the one ending in `/index`, which always brought me straight
   into the editor. Now the same address drops me on the about page instead,
   with the editor nowhere in sight. Typing the plain site root still works."

6. "The HTML export hands me an empty file. If I open that export page and
   click the button before the preview has finished rendering - which is easy,
   it takes a moment - it used to refuse and tell me to wait. Now it happily
   runs the whole export and downloads a file with nothing in it. Exporting
   after the preview is fully there still works, so the file itself is fine;
   it is only the too-early case that produces a blank download."

7. "The editor refuses to save an empty document. I selected everything in the
   editor, deleted it so it was completely blank, and waited - but the stored
   document still holds the old text. My clearing was thrown away. Is my
   document held hostage until I type something?"

8. "One entry in the export dropdown, the custom-style one, is greyed out and
   cannot be clicked at all. The other five entries work. Is that a bug, or is
   it meant to be like that?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
