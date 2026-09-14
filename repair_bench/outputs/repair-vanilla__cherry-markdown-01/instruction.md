# Repair Task - cherry-markdown (vanilla)

You are working on the source code of **cherry-markdown**, a
Markdown editor (editor pane on CodeMirror 6 plus a preview pane
rendered by the project's own engine). In this workspace the editor is
mounted on a minimal host page that boots it with an explicit toolbar:
bold/italic/strikethrough/underline, a heading dropdown, unordered /
ordered / check lists, quote, link, table, code block, undo/redo,
fullscreen, a preview switch and search. The editor runs in the split
"edit & preview" model, so the preview pane re-renders as the document
changes. Document content is seeded per session from a small
configuration stored in the browser's local storage before the page
loads. The project in this workspace builds with `npm run build:core`
(a Vite production build of the core package, output in
`packages/cherry-markdown/dist/`, served from that directory at the
site root). There is no backend to start and no network access.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors
  you break while fixing other things still count against you.

The reports, in no particular order:

1. "Whatever reacts to my edits gets the news late. I type in the
   editor and the preview pane just sits there - it only catches up ten
   seconds or more after I stop typing. It used to follow my keystrokes
   almost instantly, and the change callbacks I hooked into the editor
   fire just as late."

2. "The fullscreen button is dead. I click it and nothing happens - the
   editor stays the same size, the icon does not change, no fullscreen
   class appears anywhere. It looks like the click never reaches the
   handler."

3. "The undo/redo buttons in the toolbar behave swapped. I type
   something, press undo, and the text stays exactly as it was. If I
   then press redo, my last edit disappears - as if undo did nothing
   and redo took the undo slot."

4. "The table picker inserts transposed tables. I open the table menu,
   hover the grid somewhere around row 2, column 4 and click, and the
   inserted table comes out 2 columns wide with 4 sample rows - the
   dimensions arrive swapped."

5. "Headings render one level too deep in the preview. A single-hash
   title shows up as if it were a level-2 heading, a two-hash heading
   as level 3, and so on. The outline of every document is shifted."

6. "Scroll sync is inverted at the edges. When I scroll the editor all
   the way to the bottom, the preview jumps to the very top, and when
   I scroll back to the very top of the editor the preview jumps to
   the bottom. The middle of the document syncs normally."

7. "Toolbar clicks cancel themselves out. I select a word, click bold,
   and the word ends up unchanged - as if the action fired twice and
   the second pass undid the first. It happens with the plain toolbar
   buttons generally, not just bold."

8. "Preview sync feels imprecise mid-scroll. When I scroll slowly
   through the middle of a long document, the preview does not snap to
   the exact line the editor shows; it moves proportionally instead
   and lands slightly off. I suspect the whole sync engine is broken."

9. "The toolbar vanishes in preview mode. The moment I switch to
   preview-only, the entire toolbar collapses and I cannot see any
   buttons. I think the UI is broken in that mode."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
