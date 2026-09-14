# Repair Task - coreui-free-vue (Vue)

You are working on the source code of **coreui-free-vue**, the CoreUI
free Vue admin template: a Vue 3 + Vite single-page app with a Pinia
sidebar/theme store, hash-based routing, and the CoreUI component
library rendering a fixed sidebar, a sticky header (search dialog,
theme switcher, account dropdown), a breadcrumb bar, a footer and a
dashboard full of stat widgets, charts, progress groups and a user
table. The project in this workspace builds with `npm run build` (a
Vite production bundle, output in `dist/`, served from that directory
at the site root). There is no backend to start and no network access.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors
  you break while fixing other things still count against you.

The reports, in no particular order:

1. "The sidebar toggle in the header is dead. I click the hamburger
   button to hide the sidebar and nothing happens - it stays exactly
   where it was. Clicking it again is just as useless."

2. "The search button in the header does nothing. I click it and the
   search dialog never shows up. It used to open a modal with a search
   field and my recent searches."

3. "The custom validation demo on the Forms > Validation page is
   broken. When I leave the required fields empty and press Submit
   form, I expect the red invalid markers to appear under the fields.
   Instead the page flashes and comes back as a fresh, empty form with
   no markers at all. The other two demos on that page still show
   their validation styles fine."

4. "The Dashboard entry in the sidebar navigates to the wrong page. I
   click Dashboard and I land on Widgets - the address bar says
   widgets too. The rest of the sidebar links seem fine."

5. "The breadcrumb never marks the page I am on. The last crumb looks
   like a normal clickable link and nothing is highlighted as the
   current location."

6. "Our wiki says you can force dark mode by adding ?theme=dark to the
   URL. The app ignores it completely and always boots in light mode."

7. "The Traffic card on the dashboard boots with the wrong period
   selected. The range switch shows Year as the active period even
   though the card is set up for monthly data - Month should be the
   selected one."

8. "The counters in the account dropdown look broken. Updates,
   Messages, Tasks, Comments - every single one shows the same number,
   42. It looks like the notification counts are not syncing with real
   data at all."
