# Repair Task - vditor (Vanilla TypeScript)

You are working on the source code of **vditor**, a block-level,
"what you see is what you get" markdown editor written in TypeScript
with no framework: users write markdown in one of three editing modes
(rich-text, instant rendering, or plain source view), get live syntax
highlighting in code blocks, a rendered preview, a document outline,
character counting, undo/redo history, light and dark interface themes,
and a fullscreen writing mode. The project lives in this workspace and
is fully offline: it builds with `npm run build` (webpack, output in
`dist/`), and the page served at the site root is the workspace root
itself - a small host page that boots the editor and loads the bundle,
styles and localization assets from `dist/` on the same origin. There
is no backend and no network access.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "After I undo an edit, redo does nothing. I undo a change, press
   redo, and the text does not come back - it behaves as if there is
   nothing to redo, even though I just undid something."

2. "When I type our mention trigger character the suggestion list takes
   forever to appear. I keep typing and sit there for more than ten
   seconds before anything shows up; it used to pop up almost
   instantly."

3. "The character counter is permanently in its over-limit warning
   state. My document is short and far below the configured maximum,
   but the number is styled as if I had exceeded it the whole time."

4. "There is a layout where you write on one side and see the rendered
   result next to it. When I switch to that layout the rendered side
   simply vanishes and I am left with the editor alone."

5. "Changing the syntax highlighting theme for code blocks from the
   toolbar does nothing. I pick a different theme, the menu closes, and
   the code keeps exactly the same colors as before."

6. "I cannot leave fullscreen. Entering it works, but clicking the
   same button again does not bring the editor back to normal size -
   the page stays stuck in fullscreen."

7. "Switching the interface to the dark theme has no effect. I choose
   it, the menu closes, and everything stays light."

8. "The undo and redo buttons in the toolbar are greyed out right
   after the page loads, before I typed anything. I think the toolbar
   is broken from the start."

9. "The character counter never matches what I count myself - it
   always shows more characters than the text I can see on screen.
   Your counting must be wrong."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
