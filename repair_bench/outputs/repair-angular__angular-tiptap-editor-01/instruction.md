# Repair Task - angular-tiptap-editor (Angular 18 + TipTap / ProseMirror, a rich-text editor library and its showcase)

You are working on the source code of **angular-tiptap-editor**, a rich-text
editor library for Angular, together with the demonstration application that
ships beside it in the same repository. The library exposes one component which
wraps TipTap - and therefore ProseMirror - behind a formatting bar, a bubble
menu, slash commands, block handles, a contents list and a footer of counters.
The demo beside it is the only thing you can open in a browser: it puts one
instance of that component in the middle of the screen, holds a bundle of
configuration for it in memory, and surrounds that with controls which change
the configuration live. The two halves are separate trees in one repository, and
the defects are not all in the same half.

Nothing in this task talks to a service. There is no API key, no database and
no call to anything outside the page. The demo has no routing at all - no
`provideRouter`, no `RouterModule`, one address, `/` - and the document it
opens on is generated when the page starts, out of the demo's own translation
bundle. Everything you can read on screen is derived from that one generated
document and from the configuration the demo holds, and the interface can be
switched between English, French and German.

One qualification about the face you are handed. Upstream, the page also loads
its interface typeface from an external font service. That link has been removed
here, because this task runs with no network access. The icons on the buttons
are not affected by the removal: they come from a font package that travels
inside the repository's own dependencies and are drawn as ligatures, and no
reading in this task depends on the shape of an icon. The removal is part of the
delivered face, it is not a defect, and putting the link back is not a repair.

## The surface a user sees

**The action bar.** One row of controls across the top of the page. On its left
is a two-position switch: a button labelled Editor and a button labelled Code &
Content, one of which is marked as the position you are in. To the right of it,
separated by thin rules, there is a switch for a minimal writing mode, a switch
for dark and light, a switch for the interface language, and a red Clear button
that empties the document.

**The document sheet.** A sheet in the middle of the page holding the document
itself: a title, a subtitle, sections of prose under their own headings,
bulleted and numbered lists, and a table six columns across and four rows down.
The sheet is editable - you can click into it and type. When the formatting bar
is showing, a row of buttons sits above the text carrying the character styles,
a colour picker, three heading levels, the two list kinds, a quotation, a link,
an image, a table, and undo and redo, with thin separators between the groups.
Which buttons are in that row is decided by the configuration, and the
configuration ships with some of the library's options switched off. Selecting
text raises a small bubble menu beside the selection; typing a slash on an empty
line raises a menu of blocks you can insert.

**The contents list.** Down the right-hand edge there is a floating list of the
document's headings, under the title Table of Contents, narrowed to a strip
until you point at it. Each entry carries a small dash whose width marks how
deep that heading sits in the document. Clicking an entry jumps to the heading.
Whether the list floats there or sits inline above the sheet, and how far down
the headings it goes, are both configuration.

**The code and content side.** Flipping the two-position switch turns the sheet
over. The back of it carries three tabs - Code, MD and HTML - and opens on one
of them. Code shows the Angular snippet that would reproduce the editor you
have just configured: a block of text in which the options you switched on are
live lines and the options you switched off are crossed out with a comment
marker. MD shows the document converted into markup notation; HTML shows the
document as markup. Beside the tabs there are Copy and Download buttons, and
copying slides a small confirmation strip into a corner of the page.

**The configuration sidebar.** A button of its own opens a sidebar on the right,
headed Configuration. At the top of it there is a button that puts every option
back to its shipped value. Below that the sidebar is in three sections: one for
the formatting bar, one for the bubble menu and one for the slash commands. Each
section carries a status line naming it and counting how many of its options are
currently on - the formatting bar's line reads Select options followed by a
number in brackets - and below the line a list of rows, one row per option the
library knows about for that section, each row with a checkbox and a label.

**The theme panel.** A second button opens a panel on the left for the colour
scheme, laid out in sections. Each colour in it has a swatch you can pick from
and a text box beside the swatch carrying the same colour written out. The
first control of the first section is the accent colour.

**The rest of the page.** An inspector along the foot of the page shows the
editor's live state, a container in the corner carries the confirmation strips,
and a set of first-run hints can appear over the sheet.

## What users are reporting

Nine reports have come in. They are quoted as users wrote them, so they describe
symptoms rather than causes, and they are not in any particular order.

> **1. The view switch has stopped showing which side I am on.** The two
> buttons that flip between the writing view and the code view have stopped
> showing which one I am in. While I am typing, neither of them looks picked,
> and once I flip over to the code side both of them look picked at the same
> time.

> **2. The heavy button on the bar slants instead of thickening.** The first
> button on the formatting bar - the heavy-weight one - now slants my
> selection instead of thickening it. The button right next to it does exactly
> the same thing, so I have two identical buttons and no way at all to make
> text heavy from the bar.

> **3. The confirmation strip after a copy never goes away.** The little
> confirmation strip that slides in after I copy something simply does not
> leave. I sit there for half a minute staring at it, and if I copy twice in a
> row they pile up on top of each other.

> **4. Some formatting buttons are not on the bar at all.** Some of the
> formatting buttons I need are not on the bar at all - no superscript or
> subscript, none of the alignment ones, no highlight, and nothing to clear
> formatting. Were they removed?

> **5. The minimal writing mode works backwards.** The minimal writing mode is
> backwards now. Turning it on leaves the whole formatting bar parked at the
> top of the page, and turning it off again takes the formatting bar away
> completely, so I end up with no way to format anything in the normal mode.

> **6. The tables I insert come out one column too wide.** The grid I insert
> from the formatting bar keeps coming out one column too wide. I press the
> same button I always press and I get four columns across instead of three,
> so it no longer lines up with the tables that are already in my document.

> **7. My writing is gone after a reload and the sample is back.** Every time
> I refresh the page everything I typed is gone and the sample document is
> back. Is it not saving my work at all?

> **8. The code and content side opens on the wrong tab.** When I flip over to
> the code and preview side it now opens on the raw markup tab. I have to
> click across to the component tab every single time; it always used to land
> there for me.

> **9. The generated snippet lists my options upside down.** The code side
> writes me a snippet with its option list upside down. Every option I
> actually switched on is crossed out with a comment marker, and the ones I
> never touched are the live lines. Pasting that into my project gives me the
> exact opposite of what I configured.

## Reproducing what they saw

Build the demo with the build script the repository already declares, and serve
the directory that build writes into over plain HTTP - any free port will do,
nothing here depends on a particular one. There is only one address, so the
server has nothing to fall back to, but it does have to hand back the assets the
bundle asks for. Then open the page and walk the surface the reports talk about:
the two-position switch, and the sheet it turns over; the formatting bar above
the sheet, with the bubble menu and the slash menu that come out of the sheet
itself; the contents list down the right-hand edge; the three tabs on the back
of the sheet, with the Copy button beside them; the configuration sidebar,
opened from its own button, for the three sections of checkboxes and the counts
printed above them; and the theme panel, opened from its own button, for the
colour swatches and the text boxes beside them.

## What you are being asked to do

Find and fix the defects behind these reports, and fix any further defects you
find in the same surface while you are in there: the reports above are what
users happened to notice, not a complete inventory, and several of the things
wrong with this build produce no report at all because nothing visible looks
broken to a casual user. Not every defect is mentioned in these reports (并非所有缺陷都有报告提及).
Behaviors you break while fixing other things still count against you.

Reproduce a report before you change anything for it. A report is a description
of what somebody saw, not a diagnosis and not a verdict on which part of the
application is at fault, and nothing in these reports is a licence to change
behaviour that is not itself broken. A report can also be somebody asking for
the application to be other than it was built to be; where that is what you are
looking at, the correct repair is no repair, and your reasoning belongs in your
notes rather than in the source.

Some of these symptoms are entangled. The snippet on the Code tab only exists
while that tab is the one showing, and the side you land on when you flip the
sheet over is a separate question from what the snippet says - so if you flip
over and cannot see the snippet at all, that is two things to look at, not one,
and clicking across to the Code tab is a legitimate step in reproducing either
of them. Three of the reports are about the same row of buttons above the sheet
and are not the same question about it: which buttons the row contains, which
position of the minimal-mode switch the row is shown in, and what the first
button in the row does when you press it are three separate mechanisms, and a
change made for one of them can alter what another looks like. Treat a symptom
that changes shape part-way through as information, not as a regression you
caused, and keep going until every one of them reads correctly on its own.

Do not repair these by narrowing what the application does. Removing a control,
hard-coding a value that a report happens to quote, special-casing one tab or
one button or one heading level, deleting a button, a tab, a section or a list
entry so that it can no longer misbehave, and pinning anything to a fixed value
instead of letting it be computed from the document and the configuration the
editor is actually holding are all failures, not fixes. The two-position switch
still has to mark exactly one of its two positions and still has to turn the
sheet over; the formatting bar still has to be there in the ordinary mode and
still has to hold one button per option the configuration switches on, each
doing the thing its own label says; the minimal writing mode still has to take
the decorations away when it is on and give them back when it is off; the
contents list still has to list the headings of the document that is loaded and
still has to jump to them; the snippet still has to name every option the
library knows about, with the ones you switched on live and the rest crossed
out; inserting a table still has to insert a table, of the size the library has
always inserted; the colour swatches still have to show the colour their own text
box names; the confirmation strip still has to arrive when you copy and still
has to leave again by itself; the checkboxes in the sidebar still have to
switch the options they name, and the counts printed above them still have to be
computed from those options; and the markup and notation tabs still have to
convert the document that is actually loaded, at the depth the library has
always used. Everything the application shipped is meant to keep working.

## Environment

The application builds with the package-manager scripts the repository already
declares, and the build writes a static bundle into an output directory that can
be served over plain HTTP. Nothing in this task needs network access at run
time: the document the editor opens on, the three interface languages, and every
icon and typeface the page uses all travel inside the bundle or inside the
repository's own dependencies, so the only things the page fetches are files
served back out of its own output.

Configuration is kept between page loads and the document is not. The demo
writes the editor's option state and the contents-list settings into a single
browser-storage key whenever they change, and reads that key back when it
starts, so a switch you left in an odd position is still there after a reload;
the button at the top of the configuration sidebar puts everything back to its
shipped value. The text of the document is not part of that - it is regenerated
from the translation bundle on every load - so a reload brings the sample
document back and undoes whatever you typed. If the order of your steps matters
to what you see, use that reset button, or reload, between them.

Work in the source tree. The output directory is a build product and is not part
of your answer; anything you change has to be changed in the source, and the
bundle is regenerated from it. A fix that belongs in the library should be made
in the library rather than worked around in the demo that consumes it.
