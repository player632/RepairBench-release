# Repair Task - SVG-Edit (vanilla JS)

You are working on the source code of **SVG-Edit**, a browser-based SVG
vector editor built with plain JavaScript (web components + a canvas
package) and bundled by Vite. The project lives in this workspace; it
builds with `npm run build` and the servable app is produced under
`dist/editor/` (`index.html` loads the bundled editor script).

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

1. "The undo button is completely dead. I draw something, press the undo
   button (or Ctrl+Z) and nothing happens at all - the shape stays there,
   the canvas does not change one bit. Redo seems equally useless. When I
   draw something wrong I have to select it and delete it manually, which
   is really annoying. The buttons look clickable, they just do nothing."

2. "Clicking once on the small up-arrow next to the magnification
   percentage box makes the displayed percentage go up by one step like it
   should - but then it just keeps going. 110, 120, 130... it climbs on its
   own and never stops, even though my mouse button is long released. The
   only way out is reloading the page. This started recently, the arrow
   used to step exactly once."

3. "Minor thing maybe: right after opening the editor the undo button is
   greyed out. I think undo is broken from the start, before I even drew
   anything. Can you make it always available?"

4. "In the layers panel on the right I like hiding layers with the small
   eye symbol. After I have worked for a bit - for example after pressing
   undo once, or doing other edits - the eye stops reacting entirely. I
   click it several times and nothing happens, the layer stays visible.
   Freshly after loading the page the eye still works, it dies later."

5. "I drew a four-sided shape and colored it red using the color swatches
   at the bottom, and afterwards I picked the text tool and clicked
   somewhere free to write a label. The new text comes out red! New text
   should be black, the red shape should not leak into the text color. If I
   reload the page the text is black again, so it has something to do with
   what I did before."

6. "When I select a shape and drag the middle handle on its bottom edge
   downwards to make it taller, the shape actually shrinks instead - it
   gets shorter the further down I pull. Pushing the same handle upwards
   makes it grow. The side handles behave normally, only the bottom one is
   inverted."

7. "Every time I open the editor the canvas is completely empty and my
   drawing from the previous session is gone. An editor should remember
   what I was working on! Please make it restore my last drawing when I
   come back."

8. "I copied a shape with the right-click menu and chose paste. Instead of
   one copy I suddenly had two identical shapes on the canvas. I tried
   again: open the right-click menu, paste - and it duplicates again for
   every time I had the menu open before. One paste click should give
   exactly one copy."

9. "The undo/redo buttons do not keep up with what I do. After I draw a
   shape, the undo button stays greyed out even though there is clearly
   something to undo. When I press undo once, redo does not become
   available either - the buttons just never update their state on their
   own. Oddly, the moment I click on any shape on the canvas, both buttons
   snap to the correct enabled/disabled state. It feels like the toolbar
   only notices changes when I select something."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they
  are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on
  reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the application's
behavior. Your score reflects **how many of the defective behaviors you
actually fix** (fail-to-pass) while keeping the already-working behaviors
intact (pass-to-pass). Fixing only some of the defects gives partial
credit. You cannot see the interaction script or its expectations while
solving.

## Context

- Build: `npm run build` (Vite; `node_modules` is already installed)
- Entry: `dist/editor/index.html` (the Vite lib-mode bundle produced by the
  build is loaded from that page)
- Viewport: 1280x800, locale en-US
- Task type: `repair` (multiple independent defects)
