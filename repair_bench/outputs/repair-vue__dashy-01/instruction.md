# Repair Task - dashy (self-hosted dashboard)

You are working on the source code of **dashy**, a self-hosted dashboard
aggregator. The project lives in this workspace; the frontend builds with
`npm run build` and the result is served by `node server.js` (the port is
taken from the `PORT` environment variable). Configuration lives in
`user-data/conf.yml` (plus per-page YAML files referenced from it).

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

1. "I set a theme in the config (the `theme` value under `appConfig`), and
   when I load the dashboard it shows up in the plain default look instead.
   Strange bit: the moment I open the options panel and pick any theme from
   the dropdown, the board switches to it correctly and behaves normally from
   then on - even when I switch between themes again. Only the very first
   load ignores what I configured."

2. "The options panel (the gear popup at the right side of the header) is
   misbehaving. When I click somewhere outside it - say on the page title -
   it just stays open. But when I click one of the controls inside the panel,
   the whole panel disappears. It feels exactly backwards."

3. "I bound one of my tiles to a number key so I can launch it from the
   keyboard. Pressing the number opens the tile in a new tab - great. But
   once I have visited the minimal view and switched back to the normal view,
   pressing the same number opens two tabs at once (and it gets worse the
   more I hop between views). I expect exactly one new tab per key press."

4. "I set up a second page and it is listed in the top navigation bar.
   Clicking that link changes the address in the browser, but the content
   still shows my main board - same sections, same tiles. If I navigate to
   the address directly in a new tab, the second page renders fine with its
   own sections."

5. "One of my tiles has a local fallback address configured (`localUrl`)
   plus a re-check every couple of seconds, so the board keeps verifying
   whether that local address is reachable. Watching the network panel, I see
   exactly one such check right after the page loads, and then nothing - the
   periodic re-checks never fire while the board stays open. They should keep
   running at the configured interval for as long as the tile is on screen."

6. "Small thing, but it drives me nuts: when I copy a tile's address from the
   right-click menu, a confirmation note pops up at the bottom of the screen.
   If my mouse happens to be hovering over that note, it stays there forever
   and never fades away - I have to reload the page to get rid of it. When I
   don't touch it, it disappears by itself after a few seconds like it
   should."

7. "When I change the tile size in the options panel (small / medium /
   large), nothing happens on screen until I reload the page. That can't be
   right - the new size should show up right away, without a reload. Please
   make it take effect straight away."

8. "I intentionally hid one tile from the homepage (the vault one), but as
   soon as I type something into the search box it shows up in the results
   again. Hidden should mean hidden, no? Please make sure it never appears
   while searching either."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build` and servable with
  `node server.js`.
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

- Build: `npm run build` (the frontend build; `node_modules` is already
  installed)
- Serve: `node server.js` with `PORT` set (serves the built app and its
  local API endpoints)
- Config: `user-data/conf.yml` and the page files it references
- Task type: `repair` (multiple independent defects)
