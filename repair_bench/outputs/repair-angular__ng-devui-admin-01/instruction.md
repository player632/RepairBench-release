# Repair Task - ng-devui-admin (Angular 15 + TypeScript, a DevUI admin dashboard template)

You are working on the source code of **ng-devui-admin**, an admin dashboard
template built on Angular 15 and Huawei's DevUI component library. It is a
single-page application: a sign-in page in front of a fixed application shell,
and behind the shell a set of routed demo pages that show off the template's
list, form, dashboard and profile patterns. All of the data it displays is
generated locally by in-app mock services - there is no backend, no API key and
no network call in the data path. Those services are deliberately asynchronous:
every collection they hand back arrives after a short delay, so a page's table or
card grid is empty for a moment after navigation and then fills in. Anything you
observe in the UI has to be observed after that settling time.

## The surface a user sees

**Sign-in.** The app opens on a sign-in card. The account and password fields
arrive already filled in with a demo credential, and a row of tabs above them
lets you switch between signing in with an account name, with a phone number,
and with an email address. Signing in succeeds against a small built-in roster
of demo accounts; on success the app remembers that you are signed in and takes
you into the shell. Every page behind the shell is guarded: if the app does not
think you are signed in, navigating to one of those addresses sends you back to
the sign-in card instead. Signing out is available from the user menu in the
shell, and after signing out the guarded pages are supposed to be closed to you
again.

**The shell.** Once inside, every page renders in the same frame: a header bar
across the top carrying the product logo on the left, the main navigation in the
middle, and on the right a current-user area, a language switch and a
notification bell; a navigation menu down one side; and the routed page in the
main area. The bell opens a dropdown with three tabs - notifications, messages
and to-dos - each tab's heading carrying a count in parentheses, and each tab
listing its own items with a "clear" action at the bottom. The dropdown also
drives a small unread badge on the bell itself. Clicking an individual item is
meant to mark that one item as read and take it out of the unread counts.

Two drawers hang off the shell. One is a **settings drawer** that lets you pick
the overall arrangement of the frame - navigation across the top, navigation in a
side panel, or a combined side-and-top arrangement - and that choice is meant to
stick, including across a reload of the page. The other is a **personalisation
drawer** for the look of the app: a colour theme, a dark/light choice, a text
size and a corner-rounding amount. Those four are also meant to stick across a
reload: pick a text size, reload, and you should still have that text size.

## How your repair will be judged

- The repaired application is graded by driving a real browser over the built site and reading what is
  actually on screen: element censuses, class tokens, attributes, computed styles, visible text, table and
  grid contents, and what the app itself persists in browser storage. Nothing is graded by reading your
  diff, and nothing is graded by a unit test.
- Every filed report must end up fixed, and **everything else must keep working exactly as it does now**.
  A large set of guard readings is taken on every page you touch and on pages you are not expected to touch
  at all - the dashboard, the form area, the profile area, the error pages, the shell itself and the
  sign-in page. If a guard reading moves, the repair scores as a partial fix no matter how many reports you
  closed.
- The report list below is **what users noticed**. It is not a complete inventory of what is wrong, and it
  is not a map of where the problems live. Several of the faults in this checkout are invisible to the
  people who filed these reports: nothing on screen looks broken, and they only show up as guard failures
  if you break something while fixing what you can see, or as readings that stay wrong after you believe
  you are finished. Expect to review the whole application, not just the screens named below.
  Not every defect is described in these reports (并非所有缺陷都有报告提及).
- Two of the numbered items are **questions, not faults**. They are recorded here because reviewers raised
  them, and the answer in both cases is that the behaviour is intended and must be preserved. "Fixing"
  either of them will cost you guard readings.

## Ground rules

1. Fix root causes in the application source. Do not special-case a page, a route, a viewport size, a
  session state or a piece of demo data just to make a symptom disappear.
2. Do not add, remove or rename any attribute that exists purely to let a test find an element. The grading
  harness finds elements the way a user would - by tag, by role, by visible text, by class and by structure -
  and it never depends on an attribute you add. Adding such attributes changes the emitted markup and is
  treated as tampering with the measurement surface.
3. Do not restructure templates, move elements between components, re-order sibling blocks, or add or
  remove bindings unless the repair genuinely requires it. Cosmetic churn on pages nobody complained about
  is the most common way to fail the guard readings.
4. Do not touch the build configuration, the dependency manifest, the lockfile or the asset pipeline. The
  bundle you are graded on is rebuilt from the source you change; a repair that needs a configuration or
  dependency change in order to work is not a repair of this application.
5. Keep the application offline. Do not introduce a request to any external origin, and do not make any
  visible behaviour depend on a network resource being reachable - the grading environment has no network
  at all, so anything fetched from outside the site is guaranteed to be missing on every run. (A few demo
  pictures in the shipped data already point at external origins and simply arrive broken; that is the
  template's own doing, it is not one of the faults, and it must not be "repaired" by fetching them
  somewhere else.)
6. Do not delete or weaken existing behaviour to silence a symptom. Removing a control, hiding a tab,
  emptying a table, dropping a persistence write or short-circuiting a conditional is not a repair.
7. Preserve the demo data as shipped unless a report says the data itself is wrong, and preserve the
  deliberate delay with which the in-app services hand their data over: pages are meant to fill in a
  moment after they appear.

## The pages

**The pages.** Under the shell the navigation reaches a dashboard area (an
analysis page of charts and stat cards, a monitor page, and a work-space page),
a **list area** with five pages, a **form area** with four pages, a **profile
area** with a user centre and a user settings page, and three error pages.

The five list pages are the densest part of the app and most reports concern
them:

- a **basic list** page: a paginated table of generated work items with a
  filter panel above it, an inline edit action per row that opens a dialog form,
  and a delete action per row that opens a confirmation dialog before removing
  anything;
- a **card list** page: the same kind of generated data rendered as a grid of
  cards, with a search box above the grid and a pager below it. Typing into the
  search box and submitting it is meant to narrow the grid to the cards whose
  name matches what you typed, and the match is meant to ignore letter case, so
  a lower-case query and an upper-case query find the same cards;
- an **editable list** page: a paginated table you can edit in place, with an
  "add a row" control in the table header that opens a small form, and a delete
  action per row. A newly added row is meant to land at the top of the table,
  where you can see it;
- a **tree list** page: the same data as a nested, expandable table with
  checkboxes, where ticking a parent ticks its descendants and ticking all of a
  parent's descendants ticks the parent back;
- an **advanced list** page: a bigger table with column filtering, resizable
  columns, batch selection with a batch-delete action, and a "load more" control
  at the bottom that fetches the next page of generated data and adds it to what
  is already on screen - the rows you already had keep their place and the newly
  loaded ones go underneath them.

## What users are reporting

Six reports have come in. They are quoted as users wrote them, so they describe
symptoms rather than causes, and they are not in any particular order.

> **1. Card list search does nothing.** On the card list page I type a name into
> the search box and submit it, and the grid stays exactly as it was - the same
> cards, the same number of them. It does not matter what I type, and it does not
> matter whether I type it in lower case or in upper case: I always get the full
> first page of cards back. Searching used to narrow the grid down.

> **2. Basic list delete removes the wrong row.** On the basic list page I click
> delete on a row in the middle of the table and confirm the dialog. A row does
> go away, so it looks like it worked - but it is always the top row of the table
> that disappears, not the row I asked about. The row I clicked is still there.

> **3. New rows on the editable list turn up at the bottom.** On the editable
> list page I use the add-a-row control in the table header and fill in the form.
> The row is created, but it appears at the very end of the table instead of at
> the top, so on a full page I cannot see the row I just added at all.

> **4. The notification tab heading counts the wrong things.** In the
> notification dropdown, the heading of the notifications tab shows a number in
> parentheses that is meant to be how many notifications I have not read yet. It
> is not. Right after opening the app, when nothing has been read, the heading
> shows zero, and it goes up as I click items and mark them read. It is counting
> the read ones.

> **5. Signing out does not sign me out.** I sign out from the user menu, and
> then I go straight back to one of the pages behind the shell by its address.
> It loads. I am still signed in as far as the app is concerned, and I have to
> close the browser to get rid of the session.

> **6. Load more on the advanced list scrambles the order.** On the advanced
> list page I scroll to the bottom and use the load-more control. The right
> number of rows arrives - the table gets longer, so nothing looks missing - but
> the rows I had already loaded are no longer at the top. The page I just asked
> for is sitting above them, and the row that used to be first is now somewhere
> in the middle of the table.

## What you are being asked to do

Find and fix the defects behind these reports, and fix any further defects you
find in the same surface while you are in there: the reports above are what
users happened to notice, not a complete inventory, and several of the things
wrong with this build produce no report at all because nothing visible looks
broken to a casual user. Not every defect is mentioned in these reports
(并非所有缺陷都有报告提及). Two cautions follow from that.

First, some of these symptoms are entangled. Where two reports describe the same
control, or where one report describes a control that another defect also
touches, fixing one of them can change what the other one looks like - including
making a symptom that was invisible become visible, and including making a
reading change to a third value that matches neither the broken behaviour nor
the correct one. Treat a symptom that changes shape part-way through as
information, not as a regression you caused, and keep going until every one of
them reads correctly on its own.

Second, do not repair these by narrowing what the app does. Removing a control,
hard-coding a value that a report happens to quote, special-casing a page, or
deleting a feature so that it can no longer misbehave are all failures, not
fixes. The card grid still has to be searchable and still has to ignore letter
case; the table still has to delete the row you asked about; the notification
heading still has to count unread items; signing out still has to end the
session; load more still has to append. Everything the template shipped is meant
to keep working.

## Environment

The application builds with the package manager scripts the repository already
declares, and the build writes a static bundle that can be served over plain
HTTP; the served site is a single-page application, so any address under it has
to fall back to the entry document. Nothing in the task needs network access at
run time: the data is generated in-app, the translations ship with the bundle,
and the fonts and icons the shell uses are served from the bundle too. The build
is not optimised or minified, which is intentional - it keeps the delivered
bundle readable and keeps source text out of it.

Work in the source tree. The delivered bundle is a build product and is not part
of your answer; anything you change has to be changed in the source, and the
bundle is regenerated from it.
