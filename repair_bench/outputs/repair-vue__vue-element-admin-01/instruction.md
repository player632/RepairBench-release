# Repair Task - vue-element-admin (Vue 2)

You are working on the source code of **vue-element-admin**, a widely used
admin dashboard built with **Vue 2**, **element-ui** and **vuex**, bundled
by webpack (vue-cli). The project lives in this workspace; it builds with
`npm run build:prod` and the deployable app is emitted to `dist/` (served
from that directory, entry `dist/index.html`). Log in with the username
`admin` (the bundled mock backend accepts any password); the app is fully
offline - all API responses come from an in-browser mock.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "On the Complex Table page I tried adding a new article. The Add form
   opens fine, I fill in the fields, press Confirm, even get the nice little
   'Created Successfully' notification - and then nothing. The new row is
   nowhere in the table. I refreshed, still nothing."

2. "Same Complex Table page, editing this time: I click Edit on a row, the
   form opens with the row's data, I change the title, press Confirm, it
   says 'Update Successfully' - but the table row keeps showing the old
   title. Like my edit never happened."

3. "And deleting on that same page: I click Delete on a row, it says
   'Delete Successfully', the row stays. I tried several rows, they all
   just stay there."

4. "The Complex Table sorting is confusing me: I click the ID column header
   to sort, and the order I get contradicts the arrow the header shows. I
   keep clicking and it never does what the arrow promises."

5. "On the Dashboard there is that Todo List card. In the card header there
   is a checkbox that is supposed to mark every todo as done at once. I
   click it and absolutely nothing happens - none of the items change."

6. "Dashboard again: the row of four stat panels (New Visits, Messages,
   Purchases, Shoppings). Clicking a panel is supposed to switch the line
   chart below to that dataset. I click them one after another - the chart
   keeps showing the exact same curve no matter what I click."

7. "I have a link that opens the Tabs demo page with a specific tab
   preselected - the address bar ends with something like ?tab=US. It used
   to open that tab directly; now it always shows the first tab and I have
   to click over manually."

8. "On the Inline Edit page each row has an Edit button that should turn
   the title cell into an input so I can edit it in place. I click Edit and
   nothing happens - no input appears, the text just sits there."

9. "I was playing with the Permission demo page (the Directive one). There
   is a role switcher at the top; when I switch away from admin, the block
   that is labeled admin-only should disappear. It does not - it stays on
   the page for the other role too."

10. "Security question: I typed a completely wrong password at login and
    still got in. The app should really reject wrong passwords."

11. "Minor UX thing: I collapsed the sidebar with the little hamburger
    button, and after I reload the page it is still collapsed. I expect the
    sidebar to come back expanded after a reload."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` / `data-active`
  attributes - they are verification probes required by the checker.
- The app must remain buildable with `npm run build:prod`.
- The application must stay fully offline-capable; do not introduce network
  requests or new dependencies.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and reasoning about it.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the application's
behavior (login with different accounts, navigation, the tags bar, the
navbar search, forms and tables, the dashboard widgets, the permission demo,
sidebar state). Your score reflects **how many of the defective behaviors
you actually fix** (fail-to-pass) while keeping the already-working
behaviors intact (pass-to-pass). Fixing only some of the defects gives
partial credit. You cannot see the interaction script or its expectations
while solving.

## Context

- Build: `npm run build:prod` (webpack 4; `node_modules` is already
  installed). On recent Node versions the build requires the legacy OpenSSL
  provider, e.g. `NODE_OPTIONS=--openssl-legacy-provider npm run
  build:prod`.
- Entry: `dist/index.html` (hash-based routing, e.g. `/#/dashboard`).
- Login: username `admin`, any password (mock backend). The mock backend
  accepts any known username (for example `editor`) with any password; each
  username is assigned its own role set.
- Task type: `repair` (multiple independent defects).