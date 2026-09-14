# Repair Task - Vue Color Avatar (Vue 3 + Vite)

You are working on the source code of **Vue Color Avatar**, a small
browser-based avatar generator built with Vue 3 (Pinia, vue-i18n) and
bundled by Vite. The project lives in this workspace; dependencies are
installed with pnpm and the app builds into a static `dist/` folder.

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

1. "After I click the Download button it changes to 'Downloading...' and the
   image file actually arrives - but the button never goes back to normal
   afterwards. It stays stuck on 'Downloading...' forever and only a page
   refresh fixes it."

2. "The avatar shape selector does nothing: I click the circle or the square
   option and nothing happens at all - the avatar keeps its old shape and the
   selection highlight does not move either."

3. "The 'Generate multiple' button is dead. I click it and no list of
   generated avatars appears; the page just sits there. Nothing ever shows
   up."

4. "When I open the code view it only shows an empty object {} instead of the
   avatar configuration that is on screen."

5. "Undo misbehaves only for background color changes: I pick a new
   background color, press undo, and it skips that color change entirely and
   reverts something I did much earlier."

6. "My browser is in English but the site opens in Chinese anyway. There is
   a language switch in the footer and I can get English back with it - but
   as soon as I reload the page it is Chinese again."

7. "When I press the flip button the avatar gets mirrored. I think that is a
   bug - it should not mirror the picture."

8. "Every time I reload the page my avatar is replaced by a brand new random
   one. The site should remember my avatar."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any of the existing `data-...`
  hook attributes in the markup - they are verification probes required
  by the checker.
- The app must remain buildable (Vite build into `dist/`).
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

- Build: Vite (`node_modules` is already installed)
- Entry: `index.html` -> `src/main.ts`
- Task type: `repair` (multiple independent defects)
