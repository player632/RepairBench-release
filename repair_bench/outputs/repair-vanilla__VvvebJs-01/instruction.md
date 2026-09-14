# Repair Task - drag-and-drop page builder (vanilla JS)

You are working on the source code of a browser-based, drag-and-drop visual
page builder written in plain JavaScript - no framework, no build step. The
editor shell (top toolbar, left panels, right panels, bottom code view)
wraps an iframe that renders the page being edited; the editor
intercepts interactions with the embedded page and drives everything from the surrounding
document. The project is served statically as-is from the repository root
(the editor's top-level HTML document is the entry point), so your changes take effect directly.

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

1. "When I change something on the page and want to save, the Save button in
   the top bar stays grayed out, no matter what I edit. The only ways I found
   to make it clickable again are reloading the whole editor or typing
   something into the code view at the bottom and waiting a moment."

2. "Switching pages is broken. When I pick another page from the pages list
   in the left panel, the embedded page keeps showing the previous page -
   the new one never loads."

3. "The editing area started doing everything twice. When I clone an element I get
   two copies instead of one, and when I insert a section through the
   add-section popup the section shows up twice. Deleting elements has gotten
   weird as well."

4. "Clicking a page entry in the pages tree does nothing at all - the entry
   is not highlighted, nothing loads. It feels like the click is swallowed."

5. "When I switch the editor to preview mode I can still click elements on
   the page and select them - the selection box keeps popping up. Preview is
   supposed to show me the page the way a visitor would see it."

6. "In the left panel there is a Sections tab listing the sections of the
   current page. Clicking one of the section entries does nothing anymore -
   it used to select that section on the page."

7. "At the very bottom of the embedded page there is an extra strip
   with 'Blank section' and 'Add section' buttons. That looks like junk data
   that leaked into the page content - please clean it up."

8. "Links inside the embedded page don't open when I click them. I think the
   navigation got broken - clicking a link should take me somewhere."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The project must remain fully static: no build step, no new dependencies,
  no network requests introduced.
- Do not run the application or any verification scripts to check yourself
  during the session; a separate verifier serves the tree and drives the
  editor in a headless browser. Focus on reading the code and fixing root
  causes.

## How your work is verified

The verifier serves the source tree statically, opens the editor in a
headless browser, and drives it through a fixed script of interactions
covering the application's behavior. Your score reflects **how many of the
defective behaviors you actually fix** (fail-to-pass) while keeping the
already-working behaviors intact (pass-to-pass). Fixing only some of the
defects gives partial credit. You cannot see the interaction script or its
expectations while solving.

## Context

- Entry: the editor's top-level HTML document at the repository root (static serving)
- The edited page renders inside an iframe
- Task type: `repair` (multiple independent defects)
