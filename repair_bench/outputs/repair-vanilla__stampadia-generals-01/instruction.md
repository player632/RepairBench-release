# Repair Task - Generals Of Stampadia (vanilla JavaScript print-and-play Print Shop)

You are working on the source code of **Generals Of Stampadia**, the web side of a
small open-source print-and-play card game. It is written in plain JavaScript:
there is no framework, no package manifest, no bundler and no build step of any
kind, so the tree you are given is the tree that runs. The harness serves it over
plain HTTP from its own root directory. Everything the application needs is
already inside that tree - the PDF writer, the SVG-to-PDF converter, the two game
fonts and their stylesheets, the small SVG helper, the card templates, and the
card data itself as a folder of JSON files - so nothing at all is fetched from the
network at runtime.

The tree has three pages that link to each other. A **landing page** with a
header, two big panels (one leading to the rules, one leading to the Print Shop)
and a footer that is filled in from the application's own shared settings when the
page loads. A **rules page** written as a long question-and-answer list, with the
same footer. And the **Print Shop**, which is where all of the interesting
behaviour lives and where every report below was seen.

The Print Shop reads as two columns. On the left is the catalogue: one row per
card set that ships with the game - four of them, two full decks and two
expansions - each showing the set's code, its name, how many cards it holds and
what kind of set it is. Clicking a row adds that set to your selection; clicking
it again takes it back out. On the right is the working area, which always starts
with a small summary box and then shows one of three tabs:

- **Modules** - one detail block per selected set, listing its name, its type, its
  card count, the date it was created and the date it was last updated (each date
  is shown as a year/month/day stamp followed by a plain-English "how long ago"
  note in brackets), and its description.
- **Cards** - one row per individual card of the selected sets, showing the card's
  name, its printed code and a small type icon, plus one row per selected set
  carrying a control that selects or deselects that whole set at once. Clicking a
  card row cherry-picks that single card in or out of the print job, so you can
  print just the cards you actually want.
- **Download** - the print options and the button that produces the job: a
  dropdown for the print style (a full-colour default, a low-ink grayscale one and
  a heavier-outlined decorative one), a dropdown for the card back (which ships set
  to "do not print", because every card in the game shares the same back and
  leaving it blank saves ink), a dropdown for the paper size, a checkbox for
  leaving the printed card codes off, and the Download button itself.

Before you have selected anything, the working area shows a welcome panel instead
of a tab's content: a heading, the game logo, and two short tips - one explaining
that you browse the catalogue, pick sets, cherry-pick cards and then print, and
one explaining that you can drag your own custom card-set JSON files onto the page
to print those too. Pressing Download lays the selected cards out on a grid of
card slots, one sheet per page of the chosen paper, and builds the printable
document; each card is printed as a fold-over pair, so a card's second half is
drawn rotated in the same slot and reads the right way up once you fold the sheet.

Environment notes - properties of this offline harness, not defects:

- There is **no build step and no dependency install**. Do not add a package
  manifest, a bundler, a transpiler or a framework; the verifier serves the tree
  exactly as you leave it. Repair the code in place.
- There is no network access, and nothing in this application needs it. Three
  references to the outside world that the upstream tree carried have already been
  dealt with for you, and all three are harness furniture rather than defects: the
  landing page's link-preview image now points at the copy of that image that
  already ships in this tree instead of at the project's live web address, and the
  two font-specimen demonstration pages that ship alongside the game fonts - pages
  that none of the three real pages links to - no longer load a third-party script
  from a public CDN. Nothing was vendored in their place, no behaviour of the Print
  Shop depended on any of them, and there is nothing for you to restore. The many
  other outside addresses that appear in the settings and in the rules page are
  plain link targets that the pages only ever render as anchors; they are never
  fetched.
- The harness drives the application in a real browser at a **1440x1000 viewport**,
  so both columns of the Print Shop are on screen at once.
- Every checkpoint starts from a freshly loaded page in a fresh browser context, so
  nothing - not a selection, not a dropdown choice, not any storage - carries over
  from one checkpoint into the next.
- The Print Shop keeps nothing of its own anywhere: it writes no storage, sets no
  cookie, puts nothing in the address bar, and a reload always comes back with an
  empty selection and the first tab showing. That is how the seed is meant to
  behave, and it is why every report below can be reproduced from a plain load.
- Printing builds the document in the browser. The download itself is not part of
  what is being checked; what is checked is the printed layout the application
  produces - which cards appear, in what order, how they are placed on the sheet,
  and how each card is drawn.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and a single reported symptom can have more than one
  root cause behind it.
- At least one report describes behavior that is actually intended; verify a report
  before changing anything because of it.
- Not every defect is described in these reports. Some of them nobody wrote in yet,
  and at least one of them is hiding behind another: a broken behavior you cannot
  currently reach, because a different defect stops you reaching it, still counts
  against you once it is reachable. So check the neighbouring behavior of anything
  you touch, and re-check the per-card list, the print options and the printed
  layout after you repair them rather than assuming they were fine.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "Small thing but it looks broken: the summary box at the top of the working
   area cannot agree with itself about plurals. Pick one card set and it says I
   have selected *1 modules* - one modules. Pick two and it says *2 module*, pick
   three and it says *3 module*, so the noun is exactly backwards from the number
   in front of it: plural where there is one, singular where there are several.
   The single-set case is what caught my eye. It is the same box that lists my
   card tallies underneath."

2. "the card tallies in that summary box are wrong for anything with unit cards in
   it. I select one of the small expansion sets - nine cards, six of them units
   and three of them events - and the row for unit cards reads zero out of nine
   while the row for event cards reads nine out of nine, as if every unit card had
   been counted into the event row instead. The total at the top is still nine, so
   nothing is being lost, it is just landing in the wrong row."

3. "the catalogue on the left used to be in a sensible order and now it is not.
   Nothing is missing, all four sets are still listed, but the two small expansion
   sets have jumped to the top of the list and the two big core sets have dropped
   to the bottom, and the core sets always came first before. The detail blocks on
   the right follow the same wrong order, so it is the list itself and not just the
   left column."

4. "the dates on the module detail blocks are nonsense. The small expansion set I
   print most says it was created on 2023/28/11 - month twenty-eight, which is not
   a month - and updated on 2023/29/12. One of the core sets says 2023/07/11 where
   its own release notes say the seventh of November. So the last two parts of the
   stamped date have been put the wrong way round, and both the created row and the
   updated row do it."

5. "the Cards tab is dead. I select a set, I click Cards in the working area, and
   nothing happens at all - the tab bar ends up with nothing highlighted, as though
   I had not clicked anything, and the panel drops back to just the summary box, so
   I never get the list of individual cards. Which also means I cannot cherry-pick
   single cards any more, and I cannot reach the row that selects or deselects a
   whole set at once. The Modules tab and the Download tab both still work, so it
   is only that one."

6. "the print output is unusable. Every card on the sheet looks like two cards
   printed exactly on top of each other - the artwork is doubled up and you cannot
   read any of it - and there is not a single upside-down card anywhere on the
   sheet any more. These are fold-over cards: the second half is supposed to be
   drawn the other way up in the same place so that it reads correctly after you
   fold the paper. Now both halves come out the same way up, in the same spot."

7. "when I print with the normal full-colour style, the little element circles on
   the unit cards come out completely plain. No colour in them at all, just the
   bare shapes from the template, for all four elements. They are supposed to be
   colour-coded, one distinct colour per element. Oddly the grayscale style looks
   exactly the way it always did - but that style never coloured those circles in
   the first place, so I do not know whether it is related."

8. "I am sure this Print Shop had a fourth tab, a developer one, for messing about
   with your own card sets. I have been clicking through the tabs looking for it
   and it is not there - I only ever get the three. Did an update remove it, or am
   I imagining it? I have been switching back and forth to the Download tab with
   nothing selected, which is where I swear it used to show up."

9. "the sheets I print have no card backs on them at all, just the card fronts. I
   expected at least the game logo on the reverse. Is the back printing broken?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the three tabs and their captions and the order they appear in, the four
card sets in the catalogue and the fact that all four are always listed, the
welcome panel with its heading, logo and two tips that shows before you select
anything, the summary box and its four labelled rows, the per-set detail blocks and
the full set of rows each one carries, the catalogue rows and what each of them
shows, the whole of the Download tab's furniture - three dropdowns with all of
their entries, the checkbox, the button - and the values those three dropdowns ship
with, the card-back dropdown shipping on "do not print", the print styles and their
catalogue, the paper sizes, the way a set is added by clicking its row and removed
by clicking it again, the way the whole working area returns to the welcome panel
once nothing is selected, the fact that the developer tab stays hidden on a plain
load, the landing page with its two panels and its footer, the rules page with its
question-and-answer list and its footer, the shared settings both footers are built
from, the drag-and-drop import of your own card-set files, the way the printed
sheets are sized to the paper you chose, the way a job too big for one sheet
paginates onto several, the grayscale style leaving those element circles
uncoloured on purpose, and the fact that the application persists nothing between
loads - none of which any report asks you to change. The tree must still load and
run exactly as it does now when you are done: no build step, no new dependency, no
network access.
