# Repair Task - factoriolab (Angular + TypeScript)

You are working on the source code of **FactorioLab**, a factory-planning
calculator for Factorio and similar games, built with Angular (TypeScript,
standalone components). The project lives in this workspace; it builds with
`npm run build` and the result is served as a static site. The app is fully
client-side: factory state lives in the URL and in the browser's local
storage. There is no backend and the app must stay fully offline.

Quick orientation with the app itself: on the start screen you pick the game
data set, set how many items per second you want, and choose an item or
recipe. The solver then builds a list of production steps (machines, belts,
outputs). The "List" tab shows that table, the "Flow" tab draws the
production chain as a diagram, and the "Data" tab is a browser for the game
data (items, recipes, belts, machines...) with sortable, paginated tables and
a detail page per entry. A settings sidebar and a preferences panel control
display options such as the theme and the rate unit.

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

1. "In the data browser, clicking a column header to sort does nothing - the
   table just keeps its original order. The pager at the bottom is the same:
   I click next or change how many rows to show and nothing moves. The page
   itself loads fine, it just never reacts."

2. "The belt picker on each step has gone strange. I open the little dropdown
   where you pick which belt to use, and instead of the four normal belts
   it's now full of odd duplicated belt entries I've never seen before, and
   the normal ones are gone. I can't even pick a plain transport belt
   anymore."

3. "The Flow tab just shows me the plain step table again - the same list I
   already get on the List tab. There's supposed to be a flow diagram there.
   It looks like the diagram never turns up."

4. "In the data browser, clicking on one of the entries doesn't take me to
   its detail page. I click a row and instead of the item details I end up
   back on the start screen."

5. "I switch the theme to Light in the preferences, but nothing changes -
   the app stays dark. The selector says Light, the page doesn't get any
   lighter."

6. "The displayed rates look wrong. I keep my rates set to per-minute, but
   the numbers on the steps look like per-hour figures to me. My goal of one
   item per second shows up as 3600 on the step row."

7. "Small thing: on the start screen the app shows its version as
   'FactorioLab (dev)'. That looks like a placeholder someone forgot to
   replace with the real version number - please fix it so it shows a proper
   version."

8. "Also, can you remove those Discord / Sponsor / Source buttons from the
   top bar? Community links like that don't belong in this build."

Your task is to **fix the defects behind these reports** - verify each report
first, keep the intended behaviors intact.

## Notes on the factory

- The step list, the flow diagram and the data browser all read from the same
  underlying state; the full factory is encoded in the page URL, so reloading
  or sharing a URL restores the same factory.
- The game data (items, recipes, qualities) is loaded from static data files
  that ship with the app; some entries in the data browser exist in several
  quality variants.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests to external hosts, and do not add new packages or libraries.
- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives it
through a fixed script of interactions covering the app's behavior (setting
objectives, solving, tabs, the data browser, details, belts, themes, rate
units, reloads and fallbacks). Your score reflects **how many of the
defective behaviors you actually fix** (fail-to-pass) while keeping the
already-working behaviors intact (pass-to-pass). Fixing only some of the
defects gives partial credit. You cannot see the interaction script or its
expectations while solving.

## Context

- Build: `npm run build` (Angular application builder; `node_modules` is
  already installed)
- Output: `dist/factoriolab/browser/` static site
- Task type: `repair` (multiple independent defects)
