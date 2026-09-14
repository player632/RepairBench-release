# Repair Task - angular-example-app (Angular + TypeScript)

You are working on the source code of **angular-example-app**, a Pokemon-themed
single-page web app built with Angular (TypeScript, standalone components,
prerendered pages, English and Spanish locales). The project lives in this
workspace; it builds with `npm run build` and the result is served as a static
site. All backend data (accounts, sessions, Pokemon data, images) is served by
a local mock server that the verifier starts; the app itself must stay fully
offline.

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

1. "I caught a new Pokemon: the ball-throw animation plays all the way to the
   end, but then nothing happens - the app never shows the congratulations
   message, and the POKEBALL button stays disabled afterwards. Reloading the
   page is the only way to try again."

2. "On the My account page I changed my display name and pressed Save.
   Nothing happened - no confirmation message, and when I came back the old
   name was still there."

3. "I enter my correct e-mail and password and press the login button, and it
   looks like nothing happens at all. But when I fill in random wrong values,
   I immediately get an error about invalid credentials. It feels like the
   server rejects my real account."

4. "The cookie consent banner never shows up on this site. I open the home
   page, wait a few seconds, scroll a bit - it just never appears."

5. "On the register page I tick the terms and conditions box, then press
   Create account, and nothing happens - no error message either. When I look
   closer, the field under the checkbox says 'Field required.' even though it
   is ticked."

6. "When I type capital letters into the e-mail field on the login page, they
   stay capital. The app is supposed to turn them into small letters while I
   type."

7. "If my e-mail accidentally has a space at the end when I log in, I get an
   invalid-credentials error even though the address and password are right.
   Deleting the trailing space makes it work. It feels like the field should
   clean that up by itself when it loses focus."

8. "When I scroll down the home page, the feature cards first flash a short
   'Loading...' placeholder before they appear. Looks like something did not
   finish loading - can you check?"

9. "On each Pokemon detail page, heights are given in dm and weights in hg. Are those units
   wrong? I would expect cm and kg."

Your task is to **fix the defects behind these reports** - verify each report
first, keep the intended behaviors intact.

## Test account

- E-mail: `trainer@example.com`, password: `Pikachu1!`
- The account already has three caught Pokemon visible under My pokemon.
- Logging in resets the demo data to its initial state.

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

The verifier starts the local mock server, rebuilds the app, serves it in a
headless browser, and drives it through a fixed script of interactions covering
the application's behavior. Your score reflects **how many of the defective
behaviors you actually fix** (fail-to-pass) while keeping the already-working
behaviors intact (pass-to-pass). Fixing only some of the defects gives partial
credit. You cannot see the interaction script or its expectations while
solving.

## Context

- Build: `npm run build` (Angular CLI; `node_modules` is already installed)
- Output: `dist/pro/` static site (prerendered English + `/es/` Spanish)
- Task type: `repair` (multiple independent defects)
