# Repair Task - ng-tailadmin (Angular 22 + Tailwind CSS 4, a multi-page admin dashboard template)

You are handed a working checkout of an Angular admin dashboard template. It is a standalone-component
application (no NgModules) bootstrapped directly from the application entry point, routed through a single route table, styled with
Tailwind CSS 4 through PostCSS, and it renders a fixed left navigation rail, a sticky header, and a set of
demo pages: an e-commerce dashboard at the site root, plus a calendar, a user profile, form elements, basic
tables, invoices, two chart pages, six UI-element showcases, and separate sign-in / sign-up pages. All of the
data on screen is static demo data that ships inside the application; there is no backend, no API key and no
data plane to stub.

The application is expected to build and run completely offline. Build it with the project's own scripts
(`npm install --no-audit --no-fund`, then `npm run build`) and serve the emitted `dist/ng-tailadmin/browser`
directory as a static site at the site root.

Something has gone wrong. Users and reviewers filed the reports below. Your job is to find the underlying
cause of each one and repair it properly, in the application source, so that the behaviour a first-time
visitor sees is the behaviour the template documents.

## How your repair will be judged

- The repaired application is graded by driving a real browser over the built site and reading what is
  actually on screen: element censuses, class tokens, attributes, inline and computed styles, text, and
  element geometry. Nothing is graded by reading your diff, and nothing is graded by a unit test.
- Every filed report must end up fixed, and **everything else must keep working exactly as it does now**.
  A large set of guard readings is taken on every page you touch and on pages you are not expected to touch
  at all; if a guard reading moves, the repair scores as a partial fix no matter how many reports you closed.
- The report list below is **what users noticed**. It is not a complete inventory of what is wrong, and it
  is not a map of where the problems live. Several of the faults are invisible to the people who filed these
  reports and will only show up as guard failures if you break something while fixing what you can see.
  Expect to review the whole dashboard, not just the screens named below.
  Not every defect is described in these reports.
- Two of the numbered items are **questions, not faults**. They are recorded here because reviewers raised
  them, and the answer in both cases is that the behaviour is intended and must be preserved. Changing them
  will cost you guard readings.

## Ground rules

1. Fix root causes in the application source. Do not special-case a screen, a route, a viewport size or a
   piece of demo data just to make a symptom disappear.
2. Do not add, remove or rename any attribute that exists purely to let a test find an element. The grading
   harness finds elements the way a user would - by tag, by role, by visible text, by class and by structure -
   and it never depends on an attribute you add. Adding such attributes changes the emitted markup and is
   treated as tampering with the measurement surface.
3. Do not restructure templates, move elements between components, re-order sibling blocks, or add bindings
   unless the repair genuinely requires it. Cosmetic churn on pages nobody complained about is the most
   common way to fail the guard readings.
4. Do not touch the build configuration, the dependency manifest, the lockfile, the asset pipeline or the
   routing table's page titles. The production build enforces bundle-size and per-component-style budgets;
   a repair that fixes a symptom by making the bundle or a component stylesheet larger can fail the build
   outright, which loses every reading on every page at once.
5. Keep the application offline. Do not introduce a request to any external origin, and do not make any
   visible behaviour depend on a network resource being reachable - the grading environment has no network
   at all, so anything fetched from outside the site is guaranteed to be missing on every run.
6. Do not delete or weaken existing behaviour to silence a symptom. Removing a control, hiding a card,
   emptying a table or short-circuiting a conditional is not a repair.
7. Preserve the demo data as shipped unless a report says the data itself is wrong.

## Filed reports

1. **The dashboard opens in dark mode for a first-time visitor.** With a completely fresh browser profile -
   no stored preference of any kind - the very first load of the site root comes up in the dark theme: the
   root element is flagged dark, the page background goes near-black, and the theme control in the header
   shows the "switch to light" glyph. A visitor who has never been to the site before should get the light
   theme, and the dark theme should only appear after they ask for it.

2. **The navigation rail starts collapsed.** On the same fresh first load at a normal desktop width, the left
   rail comes up as a narrow icon-only strip: the word "Menu" that heads the first group is missing, the
   brand mark has degraded to the small icon-only logo, the group labels are gone, and the main content area
   has slid left to sit against the narrow rail. The rail is supposed to start fully expanded at its wide
   setting, with labels and the full brand mark visible, and only collapse when the user asks it to.

3. **A waiting order is styled like a failed one.** In the Recent Orders table on the dashboard, the second
   row (the Apple Watch Ultra) still reads "Pending" in words, but its status pill is coloured with the same
   red treatment the cancelled order in the fourth row gets. Waiting orders are supposed to carry the amber
   "warning" treatment, delivered orders the green one, and only cancelled orders the red one. The pill
   wording is correct; only its colour family is wrong, and it is wrong for the waiting rows specifically.

4. **A good number is dressed as a bad one.** The first of the two summary metric cards at the top of the
   dashboard - the Customers card, 3,782 with +11.01% - shows its trend chip in the red "something went
   down" treatment while still carrying an upward-pointing arrow and a positive percentage. The second card
   (Orders, 5,359) legitimately trends down at 9.05% and correctly shows red with a downward arrow. The
   Customers chip should carry the green "something went up" treatment that matches its own arrow and sign.

5. **The demographic split does not add up.** On the Customers Demographic card, the United States row - the
   one the card's own world map highlights and the one that is described everywhere else as the dominant
   market, with 2,379 customers against France's 589 - draws its progress bar at 47% and prints 47% next to
   it. The France row beside it prints 23%. The USA row should read 79%, with the bar drawn to match, which
   is the proportion the rest of the panel is built around.

6. **One of the UI-element showcases is unreachable.** In the navigation rail, the UI Elements group lists
   Alerts, Avatar, Badge, Buttons, Images and Videos. Five of them open their showcase page. Clicking
   **Badge** - or typing the address that item points at into the address bar - lands on the template's
   "page not found" screen instead of the badges showcase, even though the showcase page itself is still in
   the project and still renders correctly if you can reach it. The other five entries in that group are
   fine, and the rail's own label and icon for this entry are fine.

7. **QUESTION, not a fault - the Monthly Target card's closing sentence.** Reviewers noticed that the
   sentence under the ring chart on the Monthly Target card ("You earn $3287 today, it's higher than last
   month. Keep up your good work!") has nothing to do with the percentage the ring chart draws, and asked
   whether the copy is out of sync with the data. It is not: that sentence is fixed marketing copy in the
   template, it was never derived from the ring value, and the same is true of the two summary figures under
   it. Leave the sentence, the ring chart and those figures exactly as they are.

8. **QUESTION, not a fault - the sidebar's "Purchase Plan" button links off-site.** Reviewers asked whether
   the promotional block at the bottom of the navigation rail should route internally instead of pointing at
   the vendor's own pricing page in a new tab. It should not: that block is the upstream template's own
   promotion, it is deliberately an external link that opens in a new tab and is marked as not endorsed, the
   dashboard never fetches anything from it, and no screen in this application depends on it resolving.
   Leave its destination, its new-tab behaviour, its endorsement marking and its wording untouched.

## What "done" looks like

- A fresh browser profile loading the site root comes up in the light theme, with the navigation rail fully
  expanded, the summary metric chips coloured to match their own arrows and signs, the Recent Orders status
  pills coloured by the state they name, and the Customers Demographic bars matching the proportions the
  card describes.
- Every entry in the navigation rail reaches the page it names, including the badges showcase.
- Both questions in items 7 and 8 still read exactly as they do today.
- Nothing else about the dashboard, the other pages, the header controls, the theme control, the language
  control or the demo data has moved - including things no report mentions. Several faults in this checkout
  are not covered by any report above, and they are graded just as strictly as the ones that are.
