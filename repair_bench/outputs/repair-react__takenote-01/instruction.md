# Repair Task - takenote (React + Redux)

You are working on the source code of **takenote**, a browser-based
note-taking app for developers built with React, TypeScript, Redux and
CodeMirror. The project lives in this workspace; it builds with
`npm run build` (webpack production build) and the result is served as a
static site. This is the demo form of the app: there is no server and no
account - notes, categories and settings are handled locally in the
browser, and data is only written when the app's own sync action runs.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Once I open the settings window I can't get rid of it anymore -
   pressing Escape does nothing, clicking on the dark area outside the
   window does nothing either. Only the little X in the corner still
   closes it."

2. "I clicked sync and watched it finish, but the status in the top bar
   stays on 'Unsaved changes' forever and never goes back to showing my
   last saved time."

3. "In settings I changed the note sort order from Last Updated to Title,
   but the note list didn't move at all - it is still ordered by when
   notes were last edited."

4. "A brand new empty note - I haven't typed a single character into it -
   already shows the full toolbar at the top and the little three-dot
   menu on its list row. An empty note should still be 'unformed' and
   shouldn't offer those controls yet."

5. "When I used to edit an older note it would jump straight to the top
   of the list. Now when I edit a note the list order doesn't move at
   all, like it's frozen."

6. "The search box is completely broken. I type a word that I know exists
   in one of my notes, and the list doesn't filter at all - every note
   stays there."

7. "I cleared all the content in my scratchpad, and it looks like the
   only way to keep it that way is to hit sync right away myself. The app
   should just save my edits automatically after every change instead of
   making me think about syncing."

8. "I collapsed the categories area on the left, but after I reload the
   page it pops back open. The app should remember that I collapsed it."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` / `data-active` /
  `data-dark` attributes - they are verification probes required by the
  checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce
  network requests, and do not add new packages or libraries.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on
  reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and
drives it through a fixed script of interactions covering the
application's behavior. Your score reflects **how many of the defective
behaviors you actually fix** (fail-to-pass) while keeping the
already-working behaviors intact (pass-to-pass). Fixing only some of the
defects gives partial credit. You cannot see the interaction script or
its expectations while solving.

## Context

- Build: `npm run build` (webpack production build; `node_modules` is
  already installed)
- Output: static site under `dist/`
- Task type: `repair` (multiple independent defects)