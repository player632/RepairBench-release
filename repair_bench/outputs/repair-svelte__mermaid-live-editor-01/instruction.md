# Repair Task - mermaid-live-editor (Svelte 5 / SvelteKit diagram editor)

You are working on the source code of the **mermaid-live-editor**, a
browser-based editor for Mermaid diagrams (code/config editing, live
preview, hand-drawn mode, history/timeline, share & embed links, view and
embed pages). The project lives in this workspace; it builds with
`pnpm build` and the static result is served from the `docs/` folder.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  place (a different file or layer) than the one where the symptom appears.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "I like switching to dark mode in the evening to look at my diagrams.
   The page chrome does turn dark, but the diagram itself keeps its light
   color scheme, as if the toggle never reached it."

2. "There is that clock-like History button in the top bar of the editor.
   I click it and nothing happens at all - the history side panel never
   shows up, no matter how often I click."

3. "These days, the instant I type a syntax error the red error panel
   shoots up immediately. I remember it used to wait until I paused typing
   before showing anything, so it never flashed while I was mid-edit."

4. "In the Share dialog, under Embed: I change the Width and Height
   values, but the embed code snippet below them never changes - it keeps
   showing the old numbers."

5. "The hand-drawn mode button shows as pressed when I toggle it, but the
   diagram does not turn hand-drawn. Then I edit the diagram code a little
   and suddenly it *is* hand-drawn. Very strange."

6. "A colleague sent me one of those old-format links (the address
   contains `#/edit/`). The page opens but the diagram area is empty, even
   though the link clearly carries content."

7. "Every time I open the page there is this promotional banner across the
   top. Are we loading some advertising script on the side? Can we make it
   go away for good?"

8. "When my code has an error, the preview on the right turns
   semi-transparent, which looks like the renderer is broken. I would
   prefer it to stay fully opaque all the time."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they
  are verification probes required by the checker.
- The app must remain buildable with `pnpm build`.
- The application must stay fully offline-capable; do not introduce
  network requests or new dependencies.
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

- Build: `pnpm build` (Vite/SvelteKit static build; `node_modules` is
  already installed)
- Output: `docs/` (static site: `/edit`, `/view`, `/embed` plus the root
  redirect)
- Task type: `repair` (multiple independent defects)
