# Repair Task - solomd (Vue)

You are working on the source code of **solomd**, a local-first Markdown
editor built with Vue 3, Vite and TypeScript on a CodeMirror 6 core:
users keep a workspace of documents open in tabs, edit them with
markdown-aware affordances (task-list checkboxes, outline panel, word
counts, writing goals), jump between files through a quick switcher and
a command palette, run a Pomodoro focus timer from the status bar, and
switch color themes. Everything persists to the browser's local storage;
the project in this workspace builds with `npm run build` (vue-tsc type
check + vite production bundle, output in `dist/`, served from that
directory at the site root). There is no backend to start and no network
access.

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

1. "Switching between open documents is broken. I click another tab and
   the tab strip highlights it, but the editor itself keeps showing the
   text of the document I came from. I have to click around or reload to
   get the right file on screen, and I never know if what I am reading
   is actually the file I clicked."

2. "Task lists don't work anymore. I have lines like '- [ ] buy milk'
   and when I click the little checkbox it just bounces back - the
   marker in the text never turns into '[x]', so nothing ever gets
   checked off. Unchecking seems equally broken."

3. "Your word counter is inflating my numbers. My document starts with a
   YAML front-matter block (title, tags, a goal line) and the status bar
   counts those header words into the total as well. A twelve-word body
   shows as fourteen words. Please make the counter ignore the front
   matter."

4. "When I type, the status bar word count just sits there. I can write
   whole paragraphs and the number stays at the old value for what feels
   like twenty seconds, then suddenly jumps. Other views that read my
   text are equally stale. It used to follow my typing almost
   instantly."

5. "The cursor position readout at the bottom lies about line and
   column. I put the caret at the very start of line 3 and it says
   'Ln 1, Col 3'. Move the caret anywhere and the two numbers are
   always the wrong way around."

6. "Closing tabs jumps to the wrong neighbour. I have A, B, C open with
   B active; I close B and expect the app to continue with C, the tab
   that slid into B's place - instead it jumps back to A. It always
   picks the left one, which is not how any of my other editors behave."

7. "The focus timer behaves strangely when a session finishes: the
   little pill in the status bar flashes green for a few seconds and
   then disappears by itself, as if the app crashed out of the session.
   I expected it to stay there so I can see that I finished."

8. "The Pomodoro countdown in the status bar is frozen. I start a
   session and the pill shows the full time, but it never ticks down -
   the same minute/second stays on screen for the whole session,
   pausing or not. I have no idea how much time is left."

9. "I set a daily writing goal of 20 words on a document, and the goal
   capsule immediately claims I am far past it even though I only wrote
   a dozen words. It looks like it is counting characters (or something
   much bigger) instead of the words I actually set as the unit."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
