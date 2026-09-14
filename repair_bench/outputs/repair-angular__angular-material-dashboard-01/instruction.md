# Repair Task - angular-material-dashboard (Angular 8 + Angular Material 8 + Highcharts 7, an admin dashboard demo)

You are working on the source code of **angular-material-dashboard**, a small
Angular CLI 8 dashboard demo built out of Angular Material, `@angular/flex-layout`
and Highcharts (through the `highcharts-angular` wrapper). It is an ordinary
NgModule application - no standalone components, no signals - with a routing
module, one layout component, two page modules and a folder of shared widgets.
Everything the user can see is rendered by that one application; there is no
server, no API and no database behind it.

The whole site lives inside a single shell. Across the top is a Material toolbar
in the primary palette carrying a menu button on the left, the text `APP LOGO`,
and on the right three more buttons: a settings icon, a help icon and a person
icon. The person icon is meant to open a small dropdown menu holding one item,
`Sign out`. Under the toolbar sits the layout's drawer container: a side panel in
`side` mode, **open at load**, holding the sidebar; and a content region
holding the router outlet. Under all of that is a footer - a divider, then
`© All rights reserved 2019`.

The sidebar is a Material navigation list with a profile card at the top (a name,
address and a round avatar image), then a `Pages` subheader with three links
(Dashboard, Posts, Articles), then a `Tools` subheader with two more links
(Contacts and Leads, each with its own icon). The menu button in the toolbar is
the sidebar's toggle: clicking it is meant to flip the drawer between open and
closed, and clicking it again is meant to flip it back.

The route table has a root entry that renders the shell, with two children: the
empty path renders the **Dashboard** page and `posts` renders a **Posts** page
whose entire content is the sentence `posts works!`. There is no wildcard route.

The Dashboard page is the substance of the app, and all of its data comes from a
single in-memory Angular service - nothing is fetched. From the top:

- One **big area chart** (Highcharts, 400px tall, titled `Random DATA` with the
  subtitle `Demo`) plotting five named series - Asia, Africa, Europe, America and
  Oceania - over seven points each, with a legend listing all five names. It is
  an *area* chart: each series is drawn as a filled band, not as a bare line.
- A row of **four stat cards** (`New Users`, `Users retention`, `Users
  engagement`, `Referral`), each showing a total, a percentage, an `of target`
  suffix, a `trending_up` icon in the **primary** palette colour, and its own
  60px-tall Highcharts **sparkline**. The sparklines are configured with credits
  off and exporting off, so they carry no attribution text and no export button.
- A **`mat-table` of the first twenty periodic elements** with four columns -
  `No.`, `Name`, `Weight` and `Symbol` - where the Symbol column prints the
  element's chemical symbol (`H`, `He`, `Li`, ...), followed by a **`mat-paginator`**
  offering page sizes 5, 10 and 20.
- One **pie chart** (Highcharts, titled `RANDOM DATA`) with nine browser-brand
  slices, the Chrome slice exploded and selected, each slice labelled with its
  name and percentage, credits off and exporting on.

The project builds with its own local Angular CLI through npm (`npm run build`,
which runs a bare `ng build`), and its output folder is `dist/dashboard`, served
by the verifier at the site root - the built document carries `<base href="/">`.
This is a webpack-4-generation toolchain, so the build needs
`NODE_OPTIONS=--openssl-legacy-provider` on a modern Node; the harness sets that
for you, and the verifier refuses a build that did not run with it. Dependencies
are provisioned offline by the harness. A healthy build is **not silent**: it
prints a Browserslist "caniuse-lite is outdated" line and a couple of dozen
Node deprecation warnings and still succeeds, so a warning is not by itself a
problem.

Environment notes - properties of this offline harness, not defects:

- There is **no network access**, and nothing in this project needs it. Every
  script, style, image and data point is served from the same origin as the page
  itself, so the same screen shows the same bytes on every run and on every
  machine. The built document performs **zero remote-origin requests**. Do not add
  a remote reference, a CDN script, a web font or an analytics tag: that would be
  a regression, not a repair.
- Consequently the two Google font stylesheets the upstream project used to load
  (Roboto and Material Icons) are **gone, on purpose**, and the sidebar's avatar
  picture is a small local SVG instead of a photo from the Angular Material site.
  Because the icon webfont is not loaded, every `<mat-icon>` shows its **ligature
  name as ordinary text** - you will literally see the words `menu`,
  `settings`, `help_outline`, `person_outline`, `trending_up`, `exit_to_app`,
  `import_contacts` and `contact_phone` on screen where a glyph used to be.
  **That is intended, and it is not one of the defects.** Do not "fix" it by
  re-adding a font link, and do not delete the icons or their text: the checker
  reads those words, and the icon inventory is part of the contract.
- The harness drives the site in a real browser at a **1440x900 viewport**, with a
  spoofed desktop user agent and a fixed locale and time zone. Every checkpoint
  starts from a **fresh browser context**, so nothing carries over between checks,
  and the app persists nothing - no local storage, no session storage, no cookies,
  and nothing in the URL beyond the route itself.
- Some readings only exist as a *sequence in time*: a menu that only exists after
  its button has been clicked, a drawer whose state only changes a few hundred
  milliseconds after the toggle (the seed dispatches a window `resize` on a timer
  of its own), a navigation that only happens after a sidebar link is clicked, a
  table whose row window only changes after a page size is picked. Those are
  checked by performing the sequence with real settling time between the steps, so
  a page that merely looks right at load is not enough.
- The harness ships a small **read-only observation bridge** inside the
  application (one new TypeScript file under the app folder, loaded by a single
  added import line at the entry point). It publishes getters for things the
  browser has already rendered - element censuses, class names, text, one
  computed box height, resource timings and storage counts - plus a handful of
  drivers that only perform clicks a user could
  perform, so the checker can read the live page instead of guessing at it. It
  writes to no component field, changes no behaviour, carries no styling, and adds
  no markup hook and no `data-testid` anywhere. **Do not remove, rename, repurpose
  or extend it, and do not delete the statement that loads it** - it is required by
  the checker. Equally, do not add markup, attributes or styling to the page in
  order to make a reading come out right: the bridge reads the real DOM, so a
  hardcoded value shows up exactly where it was hardcoded.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and in a different layer than the one you can see:
  a service method and the chart two directories away that renders its output are
  halves of one contract, and so are a component's column list and the template
  that instantiates a cell per column, a toolbar button's directive binding and
  the overlay panel it is supposed to open, and a child component's `@Output`
  emit and the parent handler subscribed to it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- **Not every defect is necessarily mentioned in these reports** -
  **并非所有缺陷都有报告提及**（本报告清单不完整：有的缺陷没有任何一条报告提到，需要你自己在代码里找出来）.
  Behaviors you break while fixing other things still count against you, and the
  four stat cards, the two charts and the table all share the same widgets, the
  same service and the same shell, so a change made for one report is visible
  everywhere else.
- Keep the read-only observation bridge described above exactly as it is.

The reports, in no particular order:

1. "The left-hand sidebar is closed every time I open the dashboard now. It used to be open on arrival - I could see the profile card, the Dashboard/Posts/Articles links and the Contacts/Leads links straight away, and the page content sat next to it. Now the page loads with the sidebar tucked away and the content taking the full width, and I have to go hunting for the little menu button in the top-left corner to get it back. It does not matter which page I am on or how often I reload, it always starts closed."

2. "The big chart at the top of the dashboard has lost its shading. It is the same five lines over the same seven points with the same title and subtitle, but it renders as a plain line chart now - thin strokes and nothing under them. It used to be a filled area chart, each series a coloured band stacked under its own line, and that filled look is the whole point of that panel. The four little sparkline charts in the stat cards below it still look like they always did, so it is only the big one."

3. "Three of the links in the sidebar do nothing. I click Articles and nothing happens at all - the address in the bar does not change, the page does not change, no error, nothing. Contacts does the same and so does Leads. Dashboard and Posts both work fine and take me where they should. Is somebody going to build those three pages, or should the links come out of the menu until they exist?"

4. "The little person icon at the right-hand end of the toolbar is dead. Clicking it used to drop down a menu with a `Sign out` entry in it; now the click does nothing at all, no menu, no animation, and clicking it a second or a third time is just as silent. The icon itself is still there and still looks the same as the settings and help icons next to it, and the rest of the toolbar is fine - it is only that button's menu that never comes up."

5. "One of the regions has gone missing from the big chart. The legend under it lists four names now - Asia, Africa, Europe, America - and there used to be five, with Oceania as the last one. The four that are left still plot correctly with the same values they always had, and the rest of the chart (title, subtitle, axes, the filled bands) is untouched, so it looks like the fifth series simply fell off the end of the data rather than anything being redrawn wrong."

6. "The hamburger button in the top-left corner has stopped working. Clicking it does nothing to the sidebar - it stays exactly as it was, open or closed, however many times I press it. I know the button itself is alive because it is still there and still styled like the other toolbar buttons, and I know the sidebar can still change state because it responds to other things. It is specifically that click-to-flip-the-sidebar behaviour that has gone. Reloading the page does not bring it back."

7. "The periodic-element table is only showing five rows. There are twenty elements in it - I can see the paginator underneath saying the range is 1 to 5 of 20 - but the table body stops at Boron. Is the rest of the data missing, or has somebody truncated the table? I would have expected all twenty to be on screen."

8. "The Symbol column has disappeared from the periodic-element table. The header row reads `No.`, `Name`, `Weight` and then nothing - there used to be a fourth column headed `Symbol` showing `H`, `He`, `Li`, `Be`, `B` and so on. The three columns that are left are all still correct and still lined up with their headers, and the rows are all still there, so it is only that one column that has vanished from the table."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the toolbar shell and its four icons and brand text, the drawer's `side`
mode and the sidebar inside it with its profile card, its local avatar image, its
two subheaders and all five of its links (dead ones included), the footer and its
divider, both routes and the `posts works!` page, the big chart's five series and
its filled area rendering, the four stat cards with their totals, percentages,
`of target` suffixes, primary-coloured trend icons and 60px sparklines, the pie
chart's nine slices with the Chrome slice selected and its percentage data labels,
the table's four columns and twenty rows of data, the paginator with its 5/10/20
page sizes and its range label, and every reading that was already correct - none
of which any single report describes in full. The project must still build with
the command above when you are done.
