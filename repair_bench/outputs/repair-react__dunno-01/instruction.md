# Repair Task - dunno (React + Redux)

You are working on the source code of **dunno**, a small IMDb-style catalog
app built with React, TypeScript and Redux Toolkit. The project lives in this
workspace; it builds with `npm run build` (Create React App based) and the
result is served as a static site. All catalog data, accounts and lists are
handled by local modules in the project; the app is fully offline.

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

1. "On the home pages I scroll down to see more titles in a row - that is
   how it always worked, more posters keep coming in as you go. Now the
   page just ends. I wait there for a while and nothing else loads, for
   any row."

2. "When the search box is open and I change my mind, I click somewhere on
   the page behind it to dismiss it. Nothing happens - it stays open. The
   only ways to get rid of it are the little clear button or clicking one
   of the results."

3. "I am sure I saved a title to my list a while ago. But when I open that
   title's page again, the save button looks like it was never saved, and
   if I press it again I end up with the same title twice in my list."

4. "I removed one title from my list and now almost everything else is
   gone - the only thing left is the one I wanted to remove. What is going
   on?"

5. "When I go from one title's page straight to another - say I pick the
   next result from a search - the page shows the new artwork, but the big
   heading is still the name of the previous title. Reloading fixes it."

6. "Some titles show the wrong details. I opened what I clicked as a movie,
   but the page described a TV show - name, rating, everything belonged to
   something else. It only happens for some titles, and for those it shows
   the same wrong thing every time I come back."

7. "The sign-in page has a 'Sign in with Google' button, but clicking it
   never opens Google's page. Is sign-in broken? I just want to get to my
   list."

8. "Not sure if this counts as a bug: when a page with posters loads, the
   poster areas are grey for a moment before the image appears. It feels
   like the images are broken at first."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` / `data-state`
  attributes - they are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests, and do not add new packages or libraries.
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

- Build: `npm run build` (Create React App based; `node_modules` is already
  installed)
- Entry: `public/index.html` -> bundled app under `build/`
- Task type: `repair` (multiple independent defects)
