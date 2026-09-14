# Repair Task - summernote (vanilla)

You are working on the source code of **summernote**, a rich-text
(WYSIWYG) editor built on jQuery, in its standalone "summernote-lite"
build. In this workspace the editor is mounted on a minimal host page
that boots it over a textarea: a toolbar offers paragraph styles,
bold/italic/underline and friends, font size, bulleted and numbered
lists, tables, link insertion, fullscreen, a code view and undo/redo
history, and a status bar sits under the editing area. Document content
and some editor options (height, placeholder text, character limits) are
seeded per session from a small configuration stored in the browser's
local storage before the page loads. The project in this workspace
builds with `npm run build` (a webpack production bundle, output in
`dist/`, served from that directory at the site root). There is no
backend to start and no network access.

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

1. "Whatever reacts to my edits gets the news late. I keep a live panel
   hooked into the editor's change notifications, and when I type it
   just sits there - it only updates ten seconds or more after I stop
   typing. It used to follow my keystrokes almost instantly."

2. "The fullscreen button's highlight is backwards. The button lights up
   as 'active' while I am editing in the normal window, and the moment I
   actually go fullscreen the highlight switches off. It reads exactly
   inverted."

3. "The placeholder hint has its logic upside down. When my document is
   completely empty the hint is nowhere to be seen, but as soon as I
   type anything it pops up and stays on screen next to my text. It
   should show only while the document is empty."

4. "Turning paragraphs into lists became unreliable. I select a few
   lines and press the numbered-list or bullet-list button, and nothing
   happens unless every selected line is a plain paragraph. If the
   selection also contains something else - a heading, or a line that is
   already part of a list - the whole action silently does nothing. It
   used to convert the plain paragraphs in the selection even when they
   were mixed with other blocks."

5. "The insert-link dialog opens with its two input boxes swapped. I
   select some text, open the dialog, and the 'Text to display' box is
   prefilled with my selection's web address while the address box is
   prefilled with the display text. I end up clearing and retyping both
   fields every single time."

6. "The character limit cuts me off one character early. With a limit of
   eight characters I can only type seven - the eighth is already
   rejected. It behaves as if the limit is counted wrong by one."

7. "The undo and redo keyboard shortcuts are swapped. Pressing the usual
   undo combination (Ctrl+Z, or Cmd+Z on a Mac) redoes my last change
   instead of undoing it, and the redo combination performs an undo.
   The undo/redo buttons in the toolbar still do the right thing - only
   the keys are mixed up."

8. "Pressing Tab inside the editor moves the focus out of the editing
   area entirely, to whatever comes next on the page, instead of
   indenting my text. I expected Tab to insert an indent like in a word
   processor."

9. "When I switch to the code view, every button in the toolbar goes
   dim and disabled, as if the editor had crashed. Only the code-view
   button itself stays clickable. The toolbar looks dead the whole time
   I am editing raw markup."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
