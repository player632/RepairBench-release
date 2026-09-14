# Repair Task - FocusTide (Vue 3 / Nuxt)

You are working on the source code of **FocusTide**, a pomodoro-style focus
timer that runs entirely in the browser: a configurable plan of work and
break sessions, three timer display styles, a settings panel and an
optional task list. It is built with Vue 3 and Nuxt 3; all data stays in
the browser, nothing is sent to a server. The project lives in this
workspace; it builds with `npm run build` and the static `build/` output is
served for manual checking.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "I wanted shorter work sessions, so I opened the settings, went to the
   timer tab and typed 6 minutes into the work length field. I closed the
   settings and pressed start - and the timer counted down from 25 minutes
   anyway. I tried several different values in those time fields; nothing I
   type in there seems to reach the actual timer."

2. "The countdown feels sped up. I started a normal work session, switched
   the display style to the percentage view, and after maybe ten seconds it
   already showed more than ten percent gone. Time seems to run several
   times faster than it should."

3. "I can't finish any task. There is a checkbox next to each item in my
   task list, and clicking it does nothing at all - the item is never marked
   as done, nothing changes anywhere. So my list never shows any progress."

4. "Yesterday I let a whole 25-minute work session run all the way to the
   end. When it finished, the app did not move on to the break: the section
   indicator still said work, and instead of carrying on with the next part
   of the plan it just sat there showing some kind of finished state."

5. "I switched the task list feature on in the settings, and since then the
   task panel sits on the screen all the time. I can't make it go away -
   clicking its little close button does nothing, the panel stays exactly
   where it is."

6. "The control bar under the timer has a button for jumping to the next
   part of the session plan. Pressing it does nothing at all - the section
   stays the same, the remaining time stays the same, nothing moves."

7. "Every time I open the app in a brand-new browser (or after wiping the
   site data), the welcome walkthrough pops up again. I think the app should
   remember it already introduced itself and stop showing it."

8. "Whenever I open the page, the timer never starts by itself - it just
   waits there at the full session length until I press the play button. I
   think it should start automatically as soon as the page is ready."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the application's
behavior. Your score reflects **how many of the defective behaviors you
actually fix** (fail-to-pass) while keeping the already-working behaviors
intact (pass-to-pass). Fixing only some of the defects gives partial credit.
You cannot see the interaction script or its expectations while solving.

## Context

- Build: `npm run build` (Nuxt static generation; `node_modules` is already
  installed)
- Output: `build/` (statically served)
- Task type: `repair` (multiple independent defects)