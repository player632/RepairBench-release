# Repair Task - angular-material-admin-full (Angular + Angular Material, a full admin dashboard template)

You are working on the source code of **angular-material-admin-full**, a large
admin dashboard template built on Angular and the Angular Material component
library. It is a single-page application: a sign-in page in front of an
application shell, and behind the shell a wide set of routed demo pages that show
off the template's dashboard, table, form, chart, e-commerce and page-layout
patterns. On the face you are handed, everything the pages display is produced
inside the application itself - there is no server in the data path, no API key
and no network call. The roster of people the administration pages work with is
generated in the app the first time you open it and is then kept in the browser's
own storage for that site, so what you do through the user interface persists
across a reload until that storage is cleared. Several of the dashboard panels are
fed from fixed built-in tables of numbers and dates that never vary from one run
to the next.

## The surface a user sees

**Sign-in.** The app opens on a sign-in card. On this face the app signs you in
locally rather than against a remote service: a successful sign-in leaves the
session recorded in the browser's storage for the site, and the app reads that
record back when it decides whether you may see a page. Every page behind the
shell is guarded, so if the app does not find that record, going to one of those
addresses sends you back to the sign-in card instead.

**The shell.** Once inside, every page renders in the same frame: a header bar
across the top with the product mark, the current-user area and the usual
notifications and settings affordances; a navigation menu down one side with a
breadcrumb above the routed page; and the routed page in the middle. The shell's
typography and its icons need one honest qualification, because this face takes
nothing from outside itself. The template was written around two different icon
sets. One of them travels inside the delivered bundle and draws as pictures. The
other was normally supplied by a third-party font service, so on this face it is
not loaded at all, and the places that use it show the short lower-case word each
icon is written as where a picture would otherwise be - a small word sitting
inside a button or beside a heading instead of a shape. Typefaces behave the same
way: the design asks for a particular web font, and with no third-party service to
fetch it from, the browser falls back to a face already present on the machine.
Neither of these is a defect and neither belongs to anything reported below. Words
standing where icons were meant to stand, and a substituted typeface, are simply
what an offline face looks like, and a page is not broken because it shows them.

**The dashboard.** The landing page behind the shell is a dashboard: a row of
small statistic cards, a group of charts drawn from the fixed built-in number
tables, and a card listing recent support requests. The support-requests card is a
table with a tick-box at the head of its first column that is meant to select or
clear every row at once, a tick-box on each row, and text attached to each of
those tick-boxes describing what activating it would do.

**The user administration pages.** Under the administration section of the menu
there is a list of the people in the roster, a page for adding a new one, and a
page for editing an existing one. The list page is the busiest surface in the
template: a search filter above the table, a set of add-a-filter controls, a
table whose column headings can be clicked to sort, a per-row set of actions
including a delete that asks for confirmation in a dialog, a paging control under
the table, and a link out to the project's API documentation. The table carries a
column of tick-boxes showing which accounts are marked as out of service, and a
column of small profile pictures. The add-a-new-person page presents an empty form
whose fields start on sensible defaults, including a role choice and an
out-of-service flag.

**Two pages to leave alone.** A couple of demo pages in the template embed
third-party map providers, and one of the static pages is a long document of
typography samples. Those pages are not part of anything reported here, and the
map pages cannot be exercised at all without network access.

## What users are reporting

Nine reports have come in. They are quoted as users wrote them, so they describe
symptoms rather than causes, and they are not in any particular order.

> **1. Searching the user list always comes back empty.** On the list of people I
> type a name into the search filter and submit it, and the table goes empty - no
> rows at all. It does not matter whose name I type and it does not matter whether
> I type it in lower case, in upper case or exactly as it appears on screen: I
> always get nothing. Searching used to narrow the list down to the people who
> matched.

> **2. Clicking a column heading sorts the wrong way.** On the same list I click a
> column heading to sort it. The rows do reorder, so nothing looks broken at first
> glance, but they come back in the opposite order to the one the heading asks
> for: I ask for ascending and I get descending, and the next click gives me the
> other one round. The set of rows is right; only the direction is inverted.

> **3. The out-of-service box on the edit form reads the wrong way round.** The
> roster has exactly one person in it who is marked out of service, and the list
> of people gets that right: one ticked box in that column and the rest of them
> clear. The page for editing somebody says the opposite. When I open the edit
> page for the one person who really is marked out of service, the out-of-service
> box on that form is empty, as though nothing at all were wrong with the account.
> When I open the edit page for anybody else, that same box is already ticked. So
> the form I would use to take somebody out of service, or to put them back into
> service, opens by telling me the reverse of the truth about them, and anybody
> who trusted what it showed would end up disabling the wrong people.

> **4. All the profile pictures have gone blank.** The small picture column in the
> list of people shows nothing in any row now. The cells are still there and still
> take up the same space, so the table does not look damaged, but every one of the
> images is empty. They all used to show a face.

> **5. A column has disappeared from the list.** The list of people used to show a
> contact telephone number for each person, between the name columns and the email
> address. That column is not there any more - it has gone from the heading row
> and from every row of the table alike. The other columns are all still present.

> **6. Asking for a second filter makes the whole filter panel vanish.** On the
> list of people I press the control that adds a filter and the filter panel
> appears, as it should. When I press the same control a second time, because I
> want to filter on two things, the panel disappears entirely instead of giving me
> another filter row. Pressing it a third time brings it back.

> **7. The new-person form starts on the wrong role.** When I open the page for
> adding someone to the roster, before I have touched anything, the role choice is
> already set to the administrator option. It used to open on the ordinary member
> option, and I would change it only when I actually wanted an administrator.

> **8. The sign-in card opens with somebody's details already typed in.** When I
> go to the sign-in page the email box and the password box are not empty. They
> already hold an address - admin@flatlogic.com - and a password, and pressing the
> sign-in control straight after that lets me in without my typing anything.
> Nobody here put those values in, and nobody had signed in on that machine
> before, so either the last person's session was never properly cleared out of it
> or the page is being handed to us with somebody's credentials built into it.
> Both readings worry me. A sign-in form ought to open with the two boxes empty
> and wait for me to supply my own details, and it ought not to know a working
> password before I have told it one.

> **9. The tick-box that selects every support request reads backwards.** On the
> dashboard card that lists recent support requests there is a tick-box at the
> head of the first column, the one that is meant to select or clear every row at
> once. Straight after the page opens, when not a single row is selected, the text
> attached to that tick-box for assistive technology - the words a screen reader
> reads out for it - says 'deselect all'. Nothing is selected, so there is nothing
> to deselect, and the wording reads as though the card were in the opposite state
> from the one it is actually in. The text on the tick-boxes in the rows
> themselves reads sensibly, and pressing the head tick-box does select every row
> as it should, so the way the card behaves is right and it is only the
> description hung on that one tick-box that seems to be the wrong way round.

## What you are being asked to do

Find and fix the defects behind these reports, and fix any further defects you
find in the same surface while you are in there: the reports above are what users
happened to notice, not a complete inventory, and several of the things wrong with
this build produce no report at all because nothing visible looks broken to a
casual user. Not every defect is mentioned in these reports
(并非所有缺陷都有报告提及). Two cautions follow from that.

First, some of these symptoms are entangled. The search filter and the column
sorting on the list of people are not two independent mechanisms - they read the
same values out of the same rows through the same place - so a change you make for
one of them can alter what the other one looks like, including making a symptom
that was invisible become visible, and including making a reading settle on a
third value that matches neither the broken behaviour nor the correct one. The
support-requests card on the dashboard has the same shape of coupling in the other
direction: the state of the tick-box at the head of the column and the descriptive
text attached to the tick-boxes are two readings taken from one underlying
question, so they move together. Treat a symptom that changes shape part-way
through as information, not as a regression you caused, and keep going until every
one of them reads correctly on its own.

Second, do not repair these by narrowing what the app does. Removing a control,
hard-coding a value that a report happens to quote, special-casing a page,
deleting a column or a filter or a tick-box so that it can no longer misbehave,
and pinning anything to a hard-coded size or value instead of letting it be
computed from the configuration the page gives it are all failures, not fixes.
Searching still has to narrow the list and still has to ignore letter case;
sorting still has to honour the direction the heading asks for; the out-of-service
marking still has to show the true state of each account, in the list of people
and on the form for editing one of them alike; the pictures still have to render;
the telephone number column still has to be there; adding a filter still has to
add one, however many times it is pressed; and the new-person form still has to
open on its intended defaults. Everything the template shipped is meant to keep
working.

## Environment

The application builds with the package-manager scripts the repository already
declares, and the build writes a static bundle into an output directory that can
be served over plain HTTP. The served site is a single-page application, so any
address under it has to fall back to the entry document. Nothing in this task
needs network access at run time: sign-in is resolved locally, the roster is
generated in the app, the dashboard panels are fed from fixed built-in tables, and
the shell's icons and typefaces come out of whatever the bundle itself carries,
with the set that depended on a third-party font service left unloaded - which is
why some icons appear as the words they are written as, and why the type falls
back to a local face. Because the roster lives in the browser's storage for the
site, anything you do through the create, edit or delete controls is still there
on the next page load - if the order of your steps matters to what you see, clear
that storage for the site between them.

The delivered bundle is a production build: it is optimised and minified, and it
carries no source maps, so it cannot be read back into the sources that produced
it. Work in the source tree. The output directory is a build product and is not
part of your answer; anything you change has to be changed in the source, and the
bundle is regenerated from it.
