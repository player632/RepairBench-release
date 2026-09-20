# Repair Task - Suricate (Angular + TypeScript, a self-hosted monitoring dashboard)

You are working on the source code of **Suricate**, an Angular single-page
application that assembles monitoring dashboards out of widgets. The front end
is the whole of this workspace: a widget catalogue, a home page of dashboards,
an administration area (users, repositories, widget configurations, dashboards),
a preferences page with a user-experience tab and a security tab, and a sign-in
plus sign-up pair of pages. Shared behaviour lives in a small set of reusable
pieces that most pages are built from - one generic list component that owns
searching, paging and the page header actions, one form sidenav that builds a
form out of a field description handed to it by the page, one input component
that sizes itself and its nested fields, one notification component, and a
handful of validators and front-end services. Because those pieces are shared,
something that looks like a page-level problem is very often rooted in the
shared piece underneath it, and the same shared piece usually has several
consumers - a change that helps one page can quietly change another.

The application talks to a backend over its HTTP layer. This workspace is
self-contained: the HTTP layer answers every route the interface uses from a
deterministic in-app fixture, so the whole interface is exercisable with no
network, no database and no second process. Sign-in works against that fixture
with the account `admin@suricate.local` and the password `Suricate1!`; that
account is an administrator. Other fixture accounts exist and are not
administrators. Translations are loaded at runtime from the application's own
assets and the English bundle is the default.

**How your work is checked.** The verifier restores the project's dependencies
offline, builds the application with the project's own local Angular CLI
(output in `target/dist/public/browser`), serves that build from a static
origin, and drives the pages in a headless browser at a fixed 1440x900 viewport.
Every check is a real interaction - navigating to a route, opening a form,
picking a value from a select, typing into a search field, pressing a button,
waiting for a notification's own lifetime to run - followed by reads of the
resulting page: which rows are rendered and in what order, what a paginator's
range label says, which buttons are enabled, what a notification prints, which
class list the document body carries, which fields a form rendered and how wide
they are, how many validation messages are on screen, where the router ended up,
and what survives in storage, cookies, the URL and the global scope. A number of
checks are deliberately about state *evolution* rather than about the first paint,
so a page that settles into the wrong state after a moment is caught.

A few inert `data-testid` marker attributes sit on the shared list rows, the
form sidenav, the notification, the sidenav menu and the page header, so a check
can address the same element on every build. They carry no behaviour and no
styling. **Keep them exactly as they are** - the checks address them, and a
check that cannot find a handle reports a broken state rather than a repaired
one. Equally, do not add markup, state, a route special case or a global flag in
order to make a reading come out right: the checks read the live application, so
a hardcoded value shows up exactly where it was hardcoded, and several checks
read storage, cookies, the URL and the global scope specifically to detect
residue left behind by a shortcut.

**Reports.** Below are the reports that reached us, in the words of the people
who sent them. Not every defect is necessarily mentioned in these reports: some
of them have no report at all and will only turn up if you exercise the
application yourself, and some of these reports describe behaviour that is
entirely normal and must be left alone. Read them as a user's description of
what they saw, not as a diagnosis - several of them name the wrong cause, and
two of them describe things that are working as designed.

1. *"I was on the second page of the widget catalogue and typed something into
   the search box. The list went completely empty, but the counter underneath
   still said three items matched, and it claimed I was looking at items 11 to
   20 of them. If I do the same search from the first page it works fine and
   shows the three."*

2. *"I set my theme to Dark on the preferences page and pressed Save. Nothing
   happened, the page stayed light. If I then reload the browser tab it comes up
   dark, so the value was clearly stored - it just never got applied when I
   saved it. Same thing with the language."*

3. *"On the sign-up page: if I fill in the confirm-password box before I have
   typed anything in the password box, it immediately tells me the passwords do
   not match. The password box is still empty and untouched - I have not got to
   it yet. It should not be complaining about a field I have not filled in."*

4. *"I signed in with an ordinary account - definitely not an administrator - to
   look at a dashboard, and the left-hand menu showed me the whole Admin
   section: settings, configurations, dashboards, users, repositories. That
   account has no business seeing any of it."*

5. *"In the administration repositories page I opened an existing record and
   pressed Save without touching a single field. It refuses, and tells me
   another repository already has this priority - but the priority it is
   complaining about is that record's own. I cannot re-save an untouched
   record."*

6. *"When I start 'synchronise all repositories' from the page header, the
   success notification does arrive, but every control on the page stays greyed
   out afterwards - the header buttons and the buttons on each row. Only a full
   reload of the page brings them back."*

7. *"Signing in with a correct account and password is broken. It accepts the
   credentials, flashes the home page for a moment and then throws me straight
   back to the sign-in form. Nothing is remembered, so I cannot get in at all."*

Two further reports came in that we believe are **not** defects. They are
recorded here so that nobody changes working behaviour on the strength of them,
and the checks will fail a submission that does:

8. *"In the administration configurations list, two of the four entries show
   their value as a row of dots instead of the real text. I think the values got
   corrupted at some point."* - They did not. Those two entries are secret
   values and the list masks them on purpose; the other two entries in the same
   list are ordinary text and are shown in full. The masking is the intended
   behaviour, including after a search.

9. *"The repository list is not in alphabetical order - the entry beginning
   'Core' is listed above the one beginning 'Community'. The sorting must be
   broken."* - It is not sorted by name and never was. That administration list
   is ordered by each record's synchronisation priority, which every row prints
   next to its name, and the order is intentional.

**Ground rules.** Fix the behaviour in the application's own source. Do not
modify the checks, the fixture backend's data, or the marker attributes; do not
disable, weaken or delete a validation rule to make a message disappear; do not
shorten or lengthen a notification's lifetime to win a timing reading; do not
force a theme, a role, a route or a width. Where a report names a cause that
turns out to be wrong, repair what the behaviour actually shows. The
application must still build, and every page that worked before must keep
working: a large part of the checks are about behaviour that is already correct
and must stay correct.
