# Repair Task - Admin One, a Vue 3 + Tailwind admin dashboard

You are working on the source code of **Admin One**, a free admin dashboard
template built with Vue 3, Pinia, Vue Router, Tailwind CSS 4 and Chart.js, and
bundled by Vite. It is a multi-route single-page app with no backend of its
own: a start page that asks you to pick a visual style, then a dashboard (three
statistic tiles with counting numbers, a transactions column, a clients column,
a "star on GitHub" button, a trend line chart with a reload button and a clients
table), a tables page, a forms page, a UI elements page, a responsive-layout
page showing device screenshots, a profile page with two forms and an identity
card, plus a login page and an error page. Every authenticated page shares one
chrome: a fixed top bar with a search field, a user dropdown, a light/dark
switch and a few outbound links, and a left sidebar with the navigation and a
logout entry at the bottom. The routes live behind a `#`, so pages are reached
as `#/dashboard`, `#/tables` and so on. Sample clients and history rows come
from two small JSON files that ship inside the project and are fetched over the
same origin.

The project lives in this workspace and is fully offline. Dependencies are
supplied as an already-installed tree, the production build is written to
`dist/` and served as the site root. Because the machine has no network access,
a few things are degraded on purpose and are **not** defects: the analytics
beacon in the document head is gone; every user avatar and every device
screenshot is a plain local placeholder picture instead of the upstream
generated one, though each still carries its own distinguishing query string;
and the page metadata that points at the author's promotional image is still
there, because a browser never fetches it. The light/dark switch is also worth
knowing about before you chase it: the app deliberately does **not** restore a
saved theme when it starts, so a fresh page always comes up in light mode no
matter what was chosen before.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "I updated my details on the profile page. I typed a new name and a new
   e-mail address into the two boxes and pressed the Submit button under them.
   The name never took: the greeting card at the top of the page now welcomes me
   by my e-mail address instead of by my name, and the e-mail box still shows
   the old one that came with the demo. Pressing Submit again does the same
   thing. The two boxes themselves accept what I type just fine."

2. "The three big numbers on the dashboard feel sluggish now. Clients, Sales
   and Performance used to count up and land on their final figures almost
   immediately - a blink. Now I sit and watch them crawl for a couple of
   seconds before they get there. They do end on the right figures, it just
   takes much longer than it should, and the page looks unfinished while they
   are still moving."

3. "The clients table is broken. There are twenty people in it and the pager
   under the table correctly offers four pages, but every page shows exactly
   one single row. Page 1 shows one name, page 2 shows a different one name,
   page 3 another. It is like the whole list collapsed. The same one-row table
   also appears at the bottom of the dashboard page."

4. "On the tables page, clicking the little eye icon on any row opens a popup
   titled 'Sample modal'. Its Done button does nothing at all - the popup just
   sits there. I cannot click through it and I have to reload the page to make
   it go away. Oddly, the other popup on that page, the red one you get from
   the trash icon, closes properly when I press its Cancel button or hit the
   Escape key, so it is only this Done one that is stuck."

5. "The very first page asks me to pick a style and shows two cards. I click
   one of them and it does throw me over to the dashboard, so the click is
   registered - but the app looks exactly the same as before. I go back, try
   the other card, same thing: I get sent to the dashboard and nothing about the
   appearance changes. It used to actually restyle the whole thing."

6. "On the forms page there is a small demo with a coloured status bar and a
   Trigger button next to it. Clicking Trigger steps the bar through four
   states, and you can read the name of the current state above the bar. It
   goes through all four properly, but on the fifth click the bar loses its
   colour completely and the state name disappears instead of starting over at
   the first one. Clicking a sixth time does not bring it back either."

7. "Something looks wrong with the Performance tile on the dashboard. Next to
   the percentage it says 'Overflow' in red, where the other two tiles say
   things like '12%'. Did one of the numbers overflow? Should I be worried
   about that tile, or is that label supposed to be there?"

8. "I am a bit uncomfortable with how many outside links this build carries.
   There is a 'Star on GitHub' button at the top of the dashboard, another one
   in the middle of the page, a GitHub icon and a 'React version' icon in the
   top bar, and a GitHub entry near the bottom of the sidebar. Is this thing
   talking to those sites behind my back, or sending my data anywhere? I have
   not clicked a single one of them."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
