# Repair Task - angular-tailwind (an Angular 2202-line admin dashboard kit, styled with Tailwind CSS)

You are working on the source code of **angular-tailwind**, a free and open source admin
dashboard starter kit: one Angular application (there is no library half) whose
every visual decision is a Tailwind utility class written straight into the
templates. The census of the face you are handed, counted on the tree itself:
**146 own source files** and **4,254 lines** under `src/` (TypeScript, templates and stylesheets,
excluding the repository's own unit-test files, which are not part of this face).
The kit ships a dark-first shell: a collapsible sidebar on the left, a top bar
with an account menu on the right, a router with a handful of demonstration
pages behind it, and a footer on every page that uses the shell.

Nothing in this task talks to a service. There is no API key, no database, no
socket and no call to anything outside the page. Everything you can read on
screen comes from the kit's own templates, its own constant tables and the one
list of people that ships inside the repository.

Three things upstream did reach outside the page. All three have been repointed
or removed in the face you are handed, because this task runs with no network at
all. They are part of the delivered face, they are not defects, and undoing them
is not a repair:

- **The interface typeface.** Upstream, the global stylesheet began by importing a web font from an external font service. That import has been removed here, so the font stack falls back to the system interface face. No reading in this task depends on the shape of a glyph, and putting the import back is not a repair.
- **The Team Members rows.** Upstream, the table page fetched its rows from a public test API when it was constructed and only fell back to a list that ships inside the repository if that request failed. It now reads the shipped list directly - 8 people - so the rows are on the page the moment it is built, with or without a network. The list itself is untouched.
- **Avatars and card pictures.** Upstream, the account button, the panel behind it, every table row and the cards on the opening page all loaded pictures from four external image hosts. They now all point at one picture that ships inside the repository's own assets directory. Nothing about how those elements are laid out, labelled or shown has changed.

## The surface a user sees

**The shell.** A sidebar on the left carrying the logo, one arrow that folds the
whole sidebar down to icon width, and the navigation itself: 10 groups
("Dashboard", "Auth", "Errors", "Components", "Download", and 5 more) holding 10 top-level entries, of which 13 are leaves that
actually navigate somewhere. Groups with children open into a submenu; the entry
you are standing on is marked with a small dot. A top bar sits above the page
with a desktop menu on the left and, on the right, an account button carrying an
avatar. Clicking that avatar drops down a panel with 3 account entries (Your Profile, Settings, Log out)
and three small choice grids beneath them - a colour, a mode and a direction -
which re-theme the whole application live. The footer repeats on every page of
the shell: a copyright line carrying a year, the project name as a link, and
3 more links on the right.

**The pages.** The bare address settles on an NFT dashboard: a row of statistic
cards, a chart, and a table of auctions whose pictures come from that one local
asset. `/components/table` is the Team Members page. `/auth` is the
authentication section, which contains a login form and a registration form; each
of those two pages carries 4 buttons. There are also two error pages for a
missing address and a server fault.

**The Team Members page.** Above the rows: a headline naming the table, and a
static line of text about how many records are being shown. Then the controls -
a search box, a status dropdown with the choices All / Active / Disabled / Pending, and an
ordering dropdown with the choices Newest / Oldest. Then the rows themselves, one per
person, each with a picture, a name, contact details, a status and a selection
box; when a filter leaves nothing to show, the body carries a single placeholder
row saying so instead. Below the rows: a "show N per page" dropdown offering
5 / 10 / 20 / 30 / 50, a line stating which range of records you are looking at, and a pager of
6 buttons of which the first is disabled.

**One qualification about a small badge.** The kit contains a developer aid that
paints the current Tailwind breakpoint in the bottom-right corner of the window.
It is gated so that it only appears while the kit is being developed. The face
you are handed is built the way it ships, so under normal circumstances that
corner of the window is empty - if you ever see a breakpoint label there, that
is information about how the build was made, not a feature.

## What users are reporting

Nine reports follow. Read all of them before you change anything: **not every
report describes a defect.** Some of them describe the application behaving
exactly the way it was written to behave, and "repairing" one of those means
breaking working software. Equally, **not every defect is described in these
reports** - there is wrong behaviour in this application that nobody has written
in about, and finding that out for yourself by reading the code and driving the
page is part of the task.

**Report 1 - The dashboard opens in light colours.**

> The whole dashboard opens in light colours now. It used to open dark, and that was the point of the kit - refreshing the page or opening it in a new window does not bring the dark back either, it is light every single time. I have not touched any setting.

**Report 2 - The sidebar will not collapse.**

> The little arrow at the top of the left sidebar stopped working. I click it and nothing happens at all - the sidebar stays wide. It used to fold down to just the icons, which is what I want when I am on a small window.

**Report 3 - The sidebar keeps opening itself again.**

> Every time I collapse the sidebar and then click any entry in it, the sidebar pops wide open again on its own. I want it to stay collapsed. Can you make clicking a menu entry stop re-expanding the sidebar?

**Report 4 - My account menu will not drop down.**

> Clicking my avatar in the top-right corner does nothing any more. The account panel with the colour and mode choices never drops down - no animation, no panel, nothing. It works in the version I had before.

**Report 5 - Searching by a full name finds nobody.**

> On the Team Members page, if I type somebody's whole name into the search box - first name and last name together - the list goes completely empty and says there is nobody there. If I type only one of the two words the person is found, and searching by an email address still works. It is only the two-word search that lost its mind.

**Report 6 - The headline count above the table.**

> The table page says "Showing 08 of 100 users" above the rows, but there are only eight people in the list and there is no page 2 anywhere. That headline number looks wrong - please make it show the real count.

**Report 7 - The range under the table lost a zero.**

> At the bottom right of the Team Members table there is a line that says which range of records you are looking at. It used to read "1-10 of 100" and now it reads "1-10 of 10". Nothing else about that corner changed - the little page buttons are the same.

**Report 8 - The footer says last year.**

> The copyright line in the footer shows last year instead of this year. Every page has that footer, so it is wrong everywhere.

**Report 9 - The sign-in address lands on the registration form.**

> When I open the sign-in part of the app - just the section address, without naming a page inside it - I land on the registration form asking me to start a free trial. I have to click through to the login form by hand. It used to land on the login form directly.

## Reproducing what they saw

The dependency tree is already in place, so the application builds offline:

```
npm run build          # angular-tailwind 0.11.0; package.json:24 runs the Angular build
```

The build writes a browser bundle into a directory under `dist/`; serve that
directory as the site root (deep links need the single-page fallback, because
the router uses real paths rather than a fragment). Then open `/` and drive the
page. The addresses worth visiting are `/`, `/components/table`, `/auth`,
`/auth/sign-in` and `/auth/sign-up`.

Two habits make these reports reproducible. First, use a window at least
1280 pixels wide: the sidebar only renders from the large breakpoint up, and the
developer badge in that corner only renders from the small breakpoint up. Second,
the things that misbehave here are things you have to *do* - click the arrow,
click the avatar, type into the search box, open the section address - not things
you can see in a screenshot of a freshly loaded page.

## What you are being asked to do

Repair the application. Concretely:

- Find the code that produces each wrong behaviour and make it produce the
  right one. A repair changes the mechanism, not the reading of it.
- Not every defect has a report. Some of the wrong behaviour in this
  application is silent, and one of the reports above is about a page whose
  numbers are wrong in a way that has nothing to do with any defect. Read the
  source; do not stop at the list.
- Leave intentional behaviour alone. Two of the nine reports describe the kit
  working as designed. Changing that behaviour to satisfy a reporter is a
  regression, and it will be measured as one.
- Do not delete, stub out or hide a feature that misbehaves; do not hard-code a
  value, a year, a count or a class list to make a symptom disappear; do not add
  a conditional keyed on being watched; do not reintroduce a network call.
- Keep the build green. The project compiles under strict TypeScript with strict
  templates, so a repair that does not typecheck is not a repair.
- Do not touch the three offline adaptations listed at the top, and do not
  re-point anything back at an external host.

## Environment

No network access at any point. Node.js and the dependency tree are already
installed; `npm run build` is the whole build. The measurements that decide this
task are taken in a headless browser at 1280x720 with locale en-US and time zone
UTC, each measurement in its own fresh browsing context, so nothing carries over
between one look at the page and the next - not the storage, not the address,
not the state of a dropdown. Every reading is taken from the running
application's own document, its own storage and its own address bar.
