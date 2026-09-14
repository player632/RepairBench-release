# Repair Task - architectui-angular (Angular 22)

You are working on the source code of **ArchitectUI Angular**, a free
admin dashboard template: Angular 22 with zoneless change detection and
classic NgModule declarations, NgRx for the shared layout state,
ng-bootstrap plus Bootstrap 5.3 for the widgets, and Chart.js for the
chart demos. Users land on an analytics dashboard. A left-hand
navigation column with seven collapsible groups reaches the demo pages
(pages, elements, components, tables, forms, charts, widgets and a
couple of sign-in style screens); the bar across the top carries a
search box, a bell dropdown with a handful of sample notifications, and
a user dropdown; and the project also bundles its own written
documentation section with a separate menu of articles and code
samples. Everything you see is static sample content that ships with
the template - there is no backend.

The project lives in this workspace and is fully offline. Install the
dependencies with `npm install` (or reuse the dependency folder that is
already present if there is one), build with `npm run build`, and serve
the produced `dist/architectui-angular-free/browser` directory as the
**site root**. Routing is path-based with a catch-all, so the static
server must fall back to the single page document for any unknown path -
without that fallback a deep link or a reload lands on a 404 instead of
the app. One remote web-font reference was dropped so nothing reaches
the network at build time or at run time, and text falls back to local
fonts. These environmental traits are not something to fix.

The checkout also contains a long architecture write-up and two very
large plain-text server logs sitting at the top level. They came with
the project. We skimmed the write-up and it does not describe any of the
problems below; please leave all three files exactly as they are.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different file or a different layer than the place where the symptom
  shows up, and one defect can hide behind another.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "The navigation column on the left has seven collapsible groups and it
   is meant to work like an accordion - one group open at a time. Now,
   when I open a group and then open a different one, the first group
   stays open as well. After clicking around I end up with three or four
   groups hanging open at once and the column gets very long. It used to
   close the previous group for me."

2. "There is a small three-line button at the top-left of the bar across
   the top. It is supposed to shrink the navigation column down to a
   narrow strip, and bring it back on a second press. Pressing it does
   nothing at all - the column stays wide and the button does not even
   look pressed afterwards. I am on an ordinary desktop window, not a
   phone, and I am not resizing anything."

3. "On the collapsible panels demo there is a box headed 'One panel at a
   time'. The second entry in that box is dead: clicking its heading does
   nothing, it never opens. And it gets worse - if I click the first
   entry to shut it, then after that neither of the two can be opened
   again no matter what I click. The other boxes on the same page behave
   normally."

4. "On the page-numbers demo, the first card has three rows of numbers
   and a line underneath saying which page is current. The top row is
   broken. Clicking a number in it never moves that current-page line off
   3. Meanwhile the three rows in the card on the right - the one about
   alignment - jump to whatever number I clicked, which they obviously
   should not. The second and third rows of the first card work fine."

5. "On the pop-up demo, the first button opens a small window with a
   cross in its top corner. Clicking that cross does print a summary line
   under the buttons, but the wording is wrong: it says the window was
   closed, when it should say it was dismissed. And if I get rid of the
   window with the Escape key, or by clicking the dimmed area behind it,
   then no summary line is printed at all - the line keeps whatever it
   said before."

6. "On the charts demo there is a line chart with a table of its data
   underneath and a row of buttons above it. One button is supposed to
   append a new data point. The extra numbers do turn up in each of the
   three series rows, but the row of month names across the top of the
   table never gains another entry, so the newest point has no heading
   and the table looks ragged. Pressing it again just adds more numbers
   with still no heading."

7. "In the bundled documentation articles every code sample has a little
   copy button whose label flips to 'Copied' for a moment and then back
   to 'Copy'. Single presses are fine. But if I press the same button
   twice in quick succession the label snaps back to 'Copy' almost
   immediately after the second press, instead of staying for the usual
   moment. It looks like it is in a hurry to forget."

8. "On the tabbed panels demo, the third entry of the first strip is
   greyed out and will not take a click, while the two next to it open
   their panels normally. The second strip on that page has the same
   greyed-out third entry. That looks like leftover breakage to me -
   please make those entries work like the others."

9. "On the progress bar demo, in the card that lists the current values,
   one of the bars is only about three quarters full and its label says
   75%. I checked what sits behind it and the value is 150, so either the
   percentage or the length is wrong - 150 should fill the bar
   completely. Can you make that bar honest?"

A note on how we tested: everything above was reproduced in an ordinary
desktop browser window at 1280 by 720 with the zoom at 100%, reloading
the page between checks so each observation started from a clean state.
Several of the demo pages look very much alike and some cards repeat the
same widget three or four times with slightly different settings, so it
is worth being sure you are looking at the exact card a report means
before you change anything.
