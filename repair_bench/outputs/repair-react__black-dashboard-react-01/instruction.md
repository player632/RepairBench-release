# Repair Task - black-dashboard-react (React)

You are working on the source code of **Black Dashboard React v1.2.2**:
a dark-themed admin template built with React, react-router, the
reactstrap/Bootstrap component set and Chart.js. Users land on a
Dashboard page with a big area chart that has three dataset buttons
(Accounts, Purchases, Sessions), a sales bar chart, two line charts and
a tasks card, and they reach demo pages (Icons, Map, Notifications,
User Profile, Table List, Typography and an Arabic RTL showcase)
through a colored sidebar. A floating gear button in the bottom-right
corner opens a settings panel to change the sidebar color and to switch
between the dark and the light appearance; the top bar carries a search
dialog and the page name of the current screen. The project lives in
this workspace and is fully offline: install with `npm install`, build
with `npm run build` (Create React App tooling, output in `build/`,
served from that directory as the site root). There is no backend and
no network access: every figure, name and row you see is static sample
content bundled with the template. A few parts of the stock template
depend on the outside world and cannot work in this offline
environment - the Map page needs an external maps service and renders
nothing, external links (the vendor links in the sidebar, the footer
and the settings panel) never load, and remote web fonts were removed,
so text falls back to local fonts. These environmental traits are not
something to fix.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "The top bar has a small search icon that opens a search dialog.
   Opening works, but afterwards I cannot close it anymore - clicking
   the close (x) button does nothing, and the dialog stays stuck on the
   screen until I reload the page."

2. "A bunch of links never open: the 'Upgrade to PRO' entry at the
   bottom of the sidebar, the vendor links in the footer, the buttons
   inside the settings panel. Clicking them just waits forever and
   nothing loads. I think the build shipped with broken URLs."

3. "On the dashboard there is a big chart card with three small buttons
   on top - Accounts, Purchases and Sessions. Pressing them seems to do
   nothing: the chart always shows the very same series no matter which
   button I press, so I can never compare the three views."

4. "When I open the site at the bare address, without any page path, it
   should land on the main dashboard page. Instead it lands on the
   Table List page. Bookmarking the site root is broken."

5. "On the Notifications page a row of buttons demos a popup in each
   screen corner. The button labelled for the top-right corner
   misbehaves: its popup shows up in the top-left corner instead."

6. "There is a floating button with a gear in the bottom-right corner
   that should open the settings panel where I can change the sidebar
   color and flip between dark and light. Clicking it does absolutely
   nothing - the panel never appears."

7. "The bar at the top of the screen is supposed to show the name of
   the page I am on ('Dashboard', 'Icons', and so on). It shows the
   single word 'Brand' all the time, no matter which page I open."

8. "The demo popups on the Notifications page pick their color
   randomly - I click the same button twice and get a different color
   each time. Looks like a state leak to me; the colors should be
   consistent for each button."

9. "The template advertises itself as a dark dashboard and earlier
   builds booted with the dark look. This build boots with the light
   look instead - bright background where everything should be dark."
