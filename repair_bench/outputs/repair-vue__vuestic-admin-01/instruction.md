# Repair Task - vuestic-admin (Vue 3 + Vite + Pinia)

You are working on the source code of **vuestic-admin**, an admin dashboard
application built with Vue 3, Vite and Pinia, using the vuestic-ui component
library. The project lives in this workspace; it builds with
`yarn build:ci` and the result is served as a static site. All user,
project, payment and settings data is handled by local modules inside the
project; the app is fully offline and there are no external services.

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

1. "On the Users page the search box and the Active/Inactive toggle feel
   broken. I type a name into the search, or flip between active and
   inactive people, and the table just sits there - the list never changes,
   no matter what I do. Clearing the search does nothing either."

2. "When I click Edit for someone in the users list, the form that opens is
   often completely empty - no name, no email, nothing filled in. I have to
   close the dialog and open it again, and then the person shows up fine."

3. "The Projects page opens with the projects in a weird order: old,
   long-finished projects sit right at the top and the newest ones are
   buried at the bottom. I would expect the recent work to come first."

4. "I was adding a new user, filled in a few fields, then closed the
   dialog. Next time I clicked Add User everything I had typed was still
   sitting in the form. Is this form carrying data over between entries?
   Feels wrong to me."

5. "On the Projects page I switch to the table view and try to page through
   the entries - the pagination buttons do nothing. I click next and it
   stays on the first page, forever."

6. "In Preferences I changed my display name. It told me it was saved, but
   the name shown at the top of the page is still the old one. Only after I
   reload the whole page does the new name appear."

7. "The card/table view choice on the Projects page does not seem to be
   remembered after a refresh - I pick the table view, reload, and I am
   pretty sure it forgets. I would like it to stay on the view I picked."

8. "On the dashboard there is that region revenue table at the bottom. I
   switch the period between Today, Week and Month - the highlighted button
   changes, sure, but none of the numbers move. They are stuck on the same
   values whatever I pick."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` / `data-state`
  attributes - they are verification probes required by the checker.
- The app must remain buildable with `yarn build:ci`.
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

- Build: `yarn build:ci` (Vite; `node_modules` is already installed)
- Entry: `index.html` -> bundled app under `dist/`
- Task type: `repair` (multiple independent defects)
