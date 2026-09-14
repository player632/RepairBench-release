# Repair Task - material-angular-dashboard (Angular 10)

You are working on the source code of **material-angular-dashboard**, an
Angular 10 + TypeScript admin template built on Google's Material Design Lite
(MDL): a fixed left drawer titled `darkboard` whose menu has collapsible
groups, a top bar with an expandable search field, a notification bell, a
message dropdown and an avatar/account menu, and a set of demo pages - a
classic dashboard (weather card, projects table, to-do list, line and pie
charts, trending card), a custom dashboard, a tables page (four static tables
plus an advanced table with sortable column headers, a previous/next pager and
a "Go to page" form), a components page (toggles, progress bars, chips,
sliders, tooltips, badges and lists), a charts page, an account form page and
the sign-in / sign-up / forgot-password / 404 pages. Routing is hash based
(`#/app/dashboard`, `#/ui/tables`, `#/app/components`, ...). There is no
backend: a fake HTTP interceptor compiled into the bundle answers the sign-in,
sign-up and log-out calls, and the session is kept in browser storage.

The project builds with `npm run build` (the Angular CLI in its default
development configuration, output in `dist/`, served from that directory at
the site root). On a modern Node runtime the build needs
`NODE_OPTIONS=--openssl-legacy-provider`. `node_modules` ships with the
workspace.

Environment notes - properties of this offline harness, not defects:

- There is no network access. Upstream pulled its icon font from a CDN and its
  map pages from the Google Maps script; in this workspace those external
  references are replaced by a local inert `google.maps` stub, so the map
  pages render their card frame with no tiles and no markers, and text falls
  back to system fonts.
- Three seed pages (the account form page, the "right sidebar" demo page and
  the UI "Forms" demo page) log a console TypeError that comes from a
  third-party select widget, and can lose the drawer while they are open. That
  behavior is already present in the untouched seed, it is out of scope here,
  and no report below refers to it.
- This is a desktop layout with a fixed drawer and it needs a wide viewport
  (the harness uses 1600x900). Below roughly 1440px the drawer goes
  off-canvas and the menu entries cannot be clicked at all.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors
  you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "The groups in the left menu don't expand any more. I click UI - or Maps,
   or Pages - and nothing slides out, so I can't reach Tables, Buttons, Sign
   in, any of them. Oddly, if I reload the browser while I am already standing
   on one of those pages the group IS open and the links are there, so the
   menu itself still renders; it is only the clicking that is dead."

2. "Signing in has become slow. I type a valid address and a password, press
   SIGN IN, and then I sit on the login card for about three seconds before
   the dashboard shows up. It used to switch over almost immediately."

3. "When I add a task with the round + button on the to-do card, the new task
   lands at the TOP of the list, above 'Fix bugs'. It belongs at the end -
   that list is supposed to keep the order I added things in."

4. "On the tables page: if I click the left (previous) arrow while I am
   already on page 1, the advanced table goes completely empty and the little
   counter reads '0 of 4'. Clicking it again does not bring the rows back."

5. "Logging out doesn't clean up after me. I log out, I land back on the
   sign-in card, but the browser storage for this site still holds my username
   and my email address - only the token is gone. Whoever uses this machine
   after me can still see who I was."

6. "The bell in the top bar used to carry 4 notifications. Now the badge says
   3 and the 'Database error' entry is simply not in the list any more; the
   other three are still there."

7. "The line chart on the classic dashboard has its axis titles the wrong way
   round: the horizontal axis is labelled REVENUE and the vertical one TIME.
   It should read TIME along the bottom and REVENUE up the side."

8. "The teal ADD TO CART buttons in the advanced table don't do anything. I
   click one on a row and there is no cart, no counter, no message, nothing
   changes anywhere on the page. Is the shop part of this demo just not wired
   up?"

9. "Small thing, but it confuses me: the moment I press the + button to write
   a new to-do, the REMOVE SELECTED button goes grey and stays grey until I
   press Enter. So I can't clear my checked tasks while the new-task box is
   open."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior byte-for-byte
intact - including the pages, menus, charts and forms that no report mentions.
The project must still build with the command above when you are done.
