# Repair Task - swadit (Angular 16 + Bootstrap, a browser-based reader for Swagger / OpenAPI documents)

You are working on the source code of **swadit**, an application that takes an API
description document - a Swagger or OpenAPI file - and lays it out as a set of
linked pages you can read: the document's headline information, the reusable
shapes it defines, the addresses it exposes, the operations behind each of those
addresses, and the text of the document itself. It is a single-page application
with no server in the data path. Everything you see is derived from one document
that the app fetches out of its own bundle when it starts; there is no API key, no
database and no call to any outside service anywhere in this task. On the face you
are handed, the app opens on a bundled sample - the description of a pet-store API
- and a second sample sits in the same menu if you want a different document to
look at.

One qualification about what this face offers. Upstream, the application can also
create a document, open one from disk, add one to the loaded document and edit the
loaded document where it stands. The configuration that ships with this bundle
switches all of that off and runs the app as a read-only showcase, so the editing
controls and the file dialogs are simply not offered. That absence is the shipped
behaviour of this face, it is not a defect, and turning the editing affordances
back on is not a repair.

## The surface a user sees

**The shell.** Every page renders inside the same frame. Across the top there is a
dark bar which carries, on its left, the product's own name followed by the title
of the loaded document, and, on its right, a drop-down menu holding the two sample
documents, an item that downloads what is loaded, an item that converts it to the
newer revision of OpenAPI (carrying a small red warning that this support is still
provisional), and links out to the Source page and to the Swagger UI page. Down one
side there is a navigation column with the same menu, an entry for each of the
reading pages, a box for filtering the list of addresses, and then the addresses
themselves as links. At the foot of that column sit a few links to places on the
internet.

**API Info.** The document's own front matter: its title and version, who to
contact about it, its longer description, where its fuller documentation lives and
under what licence.

**Definitions.** This page shows the reusable shapes the document defines. Across
the top there is one tab per category the document has, each carrying a small count
of what is in it. Below that sit a filter box, labelled Filter by key name, and a
checkbox labelled Display sorted. Below that there is one card per entry: the
card's heading shows the entry's name plus whatever short text the document gives
it, and clicking the heading opens the card out into a table of the entry's fields,
each field on its own line with its name, its type and whatever the document says
about it. A field that holds a nested shape can be clicked open in turn. Near the
bottom of an opened card there is a line marked Generated example which, when
clicked, renders a sample instance of the whole entry as text you can read.

**Paths.** This page lists the addresses the document exposes. It has the same
kind of filter box (labelled Filter by path name here) and the same Display
sorted checkbox, and above the list a line reading Select Paths with a count of
how many rows are selected and a group of buttons beside it - All, None, Invers,
and one more that is disabled and announces itself as not yet implemented. Each
row carries a checkbox and the address on the left, and on the right a small
badge for each kind of request the list tracks: a badge is drawn solid when the
document defines that kind of operation at that address and faded when it does
not. Clicking a row marks it as the one you are on; clicking it a second time
opens that address's own page.

**A single address's page.** Opening one of the addresses gives a page with one tab
per operation the document defines there, each tab labelled with the kind of
operation in capitals and, where the document says so, carrying a small warning
badge beside it. Under the tabs sit the details of whichever operation is showing:
its summary, its longer text, what it takes in and what it gives back.

**Source.** This page puts the text of the loaded document into a code editor, and
shows above it whether the app's own check of that text passed or failed, together
with controls for running that check again and for putting the text back to what the
app loaded. The editor paints only the lines that are in view; the rest of the
document is still there and has to be scrolled to.

**Swagger UI.** The same document rendered through the Swagger UI distribution that
travels inside the bundle.

**Two qualifications, neither of them a defect.** The labels on the shell's menus
and buttons are looked up in a set of translation tables that follow the language
your browser asks for, and the tables that ship with this bundle do not cover every
label - so some labels are shown as the plain English words they are keyed as, and a
browser set to another language may show others in that language. And a handful of
links in the shell and at the foot of the navigation column point at places on the
internet: the project's own pages, its licence and terms, its issue tracker. This
face is offline, so following them goes nowhere. Neither of these is a defect and
neither belongs to anything reported below.

**Pages to leave alone.** The bundle also carries a sign-in page and a sign-up page,
left over from the dashboard template this application was built on. Nothing on this
face asks you to sign in and no page is guarded, and the buttons on both of those
pages point at an address the application does not have, so pressing one lands you
on a not-found page. There is also a page that lays the document out for printing,
whose entry the configuration switches off. None of these is part of anything
reported here.

## What users are reporting

Nine reports have come in. They are quoted as users wrote them, so they describe
symptoms rather than causes, and they are not in any particular order.

> **1. Text about a field is being cut short on the Definitions page.** Field
> descriptions are being cut off much earlier than they used to be - the
> status field on Pet used to show its whole description and now it ends in
> dots halfway through.

> **2. The Paths list shows what the document has as though it had not.** On
> the Paths list the little method badges are shaded the wrong way round - the
> operations my document actually defines look faded out, and the ones it does
> not define are the solid ones.

> **3. Every address opens on the same operation.** Every path I open lands on
> the same operation - I click a path and it always shows the first one. It
> never remembers what I was last looking at.

> **4. Filtering in capitals finds nothing.** I typed a name in capitals into the
> filter box on the Definitions page and the list went completely empty - the very
> same letters in lower case still find the entry.

> **5. Fields are called read only when the document never says so.** Two of the
> fields in the Pet definition are labelled read only in the type column, but
> nothing in my document marks them as read-only.

> **6. The title bar looks like two titles glued together.** The title bar reads
> PETAPI - Swagger Petstore, with a dash stuck in the middle. It looks like two
> titles got glued together, or a stray character leaked into the heading.

> **7. The operation tabs on a path have gone.** When I open the path that only has
> a GET operation there are no method tabs at all and the detail area is empty. On
> the pet id path the GET tab has vanished and it opens on POST.

> **8. Sorting the Definitions list runs backwards.** When I tick Display sorted on
> the Definitions page the list comes out backwards - it starts at the end of the
> alphabet instead of the beginning.

> **9. Selecting every path selects nothing, and still counts.** On the Paths page
> I pressed All and not a single row lit up as selected, yet the counter above
> claims six are selected - my document has eight paths.

## Reproducing what they saw

Build the application with the build script the repository already declares, and
serve the directory that build writes into over plain HTTP - any free port will do,
nothing here depends on a particular one. The site is a single-page application, so
the server has to hand back the entry document for every address under it and not
only for the root. Then open the site in a browser and walk the pages the reports
talk about: **Definitions**, for the filter box, the Display sorted checkbox, the
cards and the generated example inside an opened card; **Paths**, for the badges on
each row and for the selection buttons and the count above the list; the page for a
single address, reached by clicking a row a second time or by following one of the
links in the navigation column, for the operation tabs and the details under them;
and **Source**, for the document text and the app's own check of it. The address bar
carries the address you opened, encoded, so any of these pages can be reloaded
directly.

## What you are being asked to do

Find and fix the defects behind these reports, and fix any further defects you find
in the same surface while you are in there: the reports above are what users happened
to notice, not a complete inventory, and several of the things wrong with this build
produce no report at all because nothing visible looks broken to a casual user. Not
every defect is mentioned in these reports (并非所有缺陷都有报告提及). Behaviors you
break while fixing other things still count against you.

Reproduce a report before you change anything for it. A report is a description of
what somebody saw, not a diagnosis and not a verdict on which part of the
application is at fault, and nothing in these reports is a licence to change
behaviour that is not itself broken.

Some of these symptoms are entangled. The filter box and the Display sorted checkbox
on the Definitions page are not two independent mechanisms: one routine turns the
document's list of names into the list on screen, and those two controls are two
halves of that one routine, so a change you make for one of them can alter what the
other looks like - including making a symptom that was invisible become visible, and
including making a reading settle on a third value that matches neither the broken
behaviour nor the correct one. The badges on the Paths list and the tabs on a single
address's own page are two readings of one question about the document - which
operations it really defines at that address - so they move together, and a change
that satisfies only one of them is not a fix. Treat a symptom that changes shape
part-way through as information, not as a regression you caused, and keep going
until every one of them reads correctly on its own.

Do not repair these by narrowing what the app does. Removing a control, hard-coding
a value that a report happens to quote, special-casing one page or one entry,
deleting a badge, a tab, a card or a filter so that it can no longer misbehave, and
pinning anything to a fixed value instead of letting it be computed from the
document that is loaded are all failures, not fixes. Filtering still has to narrow
the list and still has to ignore letter case; sorting still has to produce the order
the checkbox asks for; the badges still have to show, on every row, exactly the
operations the document defines at that address, drawn one way for those and the
other way for the rest; a single address's page still has to offer one tab for every
operation the document defines there, with that operation's details underneath; what
the document says about a field still has to be shown whole up to the length this
application has always used and cut short only beyond it; the type shown for a field
still has to say only what the document says, and call a field read only only when
the document does; selecting every address still has to select the addresses, and
the count beside it still has to be the number of rows actually selected. Everything
the application shipped is meant to keep working.

## Environment

The application builds with the package-manager scripts the repository already
declares, and the build writes a static bundle into an output directory that can be
served over plain HTTP. Nothing in this task needs network access at run time: the
two sample documents, the configuration the app reads when it starts, and every icon
and typeface it uses all travel inside the bundle, so the only things the app
fetches are files served back out of its own output.

Nothing is kept between page loads. The loaded document lives in memory only, so a
full page load brings the bundled sample back and undoes everything you did since.
If the order of your steps matters to what you see - after switching to the other
sample, or after asking the app to convert the loaded document to the newer revision
of OpenAPI, which happens in memory and cannot be undone - reload the page between
them.

The delivered bundle is a production build: it is optimised and minified, and it
carries no source maps, so it cannot be read back into the sources that produced it.
Work in the source tree. The output directory is a build product and is not part of
your answer; anything you change has to be changed in the source, and the bundle is
regenerated from it.
