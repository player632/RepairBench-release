# Repair Task - material-dashboard-react (React)

You are working on the source code of a **Material Dashboard 2 React
admin template**: a dashboard application built with React 18, Vite-free
Create React App tooling and the Material UI component library. Users
land on a Dashboard with statistics cards, a bar chart, two line charts,
a projects table and an orders overview, reach demo pages (Tables,
Billing, Notifications, Profile, Sign In, Sign Up, an RTL showcase)
through a dark side menu, and tune the whole layout from a configuration
panel (side menu colors, navbar mode, light/dark appearance). The
project lives in this workspace and is fully offline: install with
`npm install`, build with `npm run build` (Create React App, output in
`build/`, served from that directory as the site root). There is no
backend and no network access: every figure, name and timestamp you see
is static sample content bundled with the template, and remote font and
CDN assets have been removed for offline use - which is why the little
pictures in menus and toolbars show up as their plain text names (for
example the word "dashboard") instead of drawn glyphs. That visual
quirk is environmental, not something to fix.

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

1. "The top bar on the dashboard no longer stays in place when I scroll
   the page down. It used to remain pinned at the top of the window, but
   now it scrolls away with the rest of the content."

2. "The little pictures in the left menu and in the top bar are broken.
   Instead of proper icons I read plain words like 'dashboard' or
   'table_view' where the icons should be. I think the icon set of this
   build is corrupted."

3. "There is a round floating button with a gear in the bottom right
   corner of the screen that is supposed to open the layout
   configuration panel. Clicking it does absolutely nothing - the panel
   never appears."

4. "On the Notifications page there are four buttons that each demo a
   different popup style. The 'success notification' one is dead: I
   click it and no message ever shows up. The other three seem fine."

5. "In the left menu, the entry for the page I am currently on is not
   highlighted anymore. All entries look exactly the same, so I cannot
   tell where I am."

6. "The dashboard shows timestamps like 'campaign sent 2 days ago' and
   'updated 4 min ago', and they never change no matter when I open the
   app. I suspect the data feed is frozen."

7. "On the dashboard there is a projects table card. The three-dot
   button in the corner of that card used to open a small dropdown with
   a few actions, but clicking it does nothing now."

8. "The two line charts on the dashboard look swapped to me: each chart
   carries the legend name that belongs to the other one."

9. "On the sign-in page, the 'Sign up' link for people who do not have
   an account just brings me back to the sign-in page. I can never reach
   the registration page from there."
