# Repair Task - SVGOMG (vanilla JS)

You are working on the source code of **SVGOMG**, a browser-based GUI for
minifying SVG files. The project lives in this workspace; it builds with
`npm run build` (gulp-based, output goes to `build/`) and the result is
served as a static site. All compression happens locally inside bundled Web
Workers (SVGO is vendored in `node_modules`); there are no external
services and the app is fully offline.

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

1. "After I load a file, the menu is sometimes still open. Pressing Esc no
   longer closes it - I have to click the grey area behind it. The keyboard
   shortcut used to work."

2. "When a file has finished compressing, the small spinning circle next to
   the download button appears a moment later and just keeps spinning,
   even though the work is clearly done."

3. "After an image finishes loading, the menu closes by itself. Did it
   forget what I was doing? Feels like state is being thrown away."

4. "The Number precision slider seems broken at the far-left position: I
   set it to 0 and the output does not change at all, while every other
   position works fine. Is the slider widget itself defective?"

5. "After pressing Reset all I get the confirmation banner. Clicking UNDO
   does nothing - everything stays reset. But when I click DISMISS, my old
   settings suddenly come back. That feels backwards."

6. "Once an image has loaded, switching to the Markup tab shows an empty
   code area. The code only appears after I toggle one of the settings on
   the right."

7. "I dragged Number precision up to 7, then pressed Reset all. The
   toggles went back to their defaults, but the value bubble on the slider
   still shows 7 and the handle did not move back."

8. "In the menu, Contribute takes me to GitHub in the same tab instead of
   opening a new one. Not sure if that is a bug?"

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they
  are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests, and do not add new packages or libraries.
- Do not run the project's build, lint or test commands to verify yourself
  during the session; a separate verifier rebuilds and drives the app.
  Focus on reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the application's
behavior. Your score reflects **how many of the defective behaviors you
actually fix** (fail-to-pass) while keeping the already-working behaviors
intact (pass-to-pass). Fixing only some of the defects gives partial
credit. You cannot see the interaction script or its expectations while
solving.

## Context

- Build: `npm run build` (gulp orchestration; `node_modules` is already
  installed)
- Entry: `src/index.html` (nunjucks template) -> static site under
  `build/`
- Task type: `repair` (multiple independent defects)
