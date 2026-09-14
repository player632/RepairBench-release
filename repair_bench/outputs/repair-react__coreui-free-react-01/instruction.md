# Repair Task - coreui-free-react (React)

You are working on the source code of a **CoreUI free React admin
template**: a dashboard application built with React, Vite and the CoreUI
component library. Users land on a Dashboard with KPI widgets and a
traffic chart, reach dozens of demo pages (components, forms, icons,
widgets, charts) through a dark sidebar, switch the whole app
between light and dark color modes from the header, show or hide the
sidebar with the toggler buttons, search from the header search dialog,
and browse breadcrumbs that track the current route. The project lives
in this workspace and is fully offline: install with `npm install`,
build with `npm run build` (Vite, output in `build/`, served from that
directory as the site root). There is no backend and no network access:
links that point to external documentation sites cannot load in this
environment, and demo data on the dashboard is generated locally.

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

1. "The button at the far left of the top bar that is supposed to hide
   the sidebar does nothing at all. I click it and the sidebar stays
   where it is; clicking again changes nothing either. The little
   toggler at the bottom of the sidebar also seems completely dead."

2. "The small blue 'NEW' badge that used to sit next to the Dashboard
   entry in the sidebar menu is gone. I'm sure it was there before -
   now the menu item shows just the text."

3. "A colleague sent me a link to the app with `?theme=dark` appended so
   it would open in dark mode, but when I open it, everything is still
   light. The link definitely has the parameter in it."

4. "The big traffic chart on the dashboard looks broken. The lines are
   squashed completely flat along the bottom of the chart area, as if
   the vertical scale is way off - you can barely see any movement."

5. "On the Components > Toasts demo page there is a button labeled
   'Send a toast'. I click it and nothing happens - no toast message
   ever appears."

6. "When I open the app at its bare address, without any route in the
   URL, I land on the Widgets page. I expect to land on the Dashboard."

7. "On the Forms > Validation page, the first demo (the 'Custom styles'
   form) misbehaves: when I click 'Submit form' while the username field
   is empty, instead of marking the invalid fields the whole page
   reloads and I'm back at the start."

8. "A lot of entries in the sidebar menu - Calendar, Smart Table, Date
   Picker and others - open coreui.io pages that never load. I think
   those links are broken in this build."

9. "The numbers in the dashboard traffic chart change every single time
   I reload the page. Something must be corrupting the analytics data -
   it should be stable."
