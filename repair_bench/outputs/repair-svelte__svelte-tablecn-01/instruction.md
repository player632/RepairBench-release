# repair-svelte__svelte-tablecn-01 — repair brief

## The application

A single-page showcase of a very large data grid. The page generates ten thousand people — a name,
an age, an email, a website, a note, a salary, a department, a status, a list of skills, a start
date and a list of attachments for each — from a fixed seed, and shows them in a spreadsheet-like
grid you can scroll, sort, edit, copy out of and paste into. Rows can be marked and deleted, a
column can be filtered from the toolbar, the whole grid can be searched from a find panel with a
match counter and step buttons, what you see can be exported to a spreadsheet file, and every edit
can be undone and redone. A second view on the same page shows a small plain table of the same kind
of data. It is front-end only: no server, no database, no accounts, and after the offline adaptation
described below the page makes no network requests at all.

## What you are being asked to do

The tree you are handed installs, builds and serves, and every screen renders. But a set of
behaviours are wrong. Find them, repair them in the application source, and leave everything else
working. The build must still succeed, the grid must still be a usable grid over the same ten
thousand generated rows, and the repairs must be real: a change that makes one observed symptom
disappear by disabling the feature behind it, or that special-cases the exact situation a check
looks at, is not a repair and will be caught by the sentinels described at the end of this brief.

## Reports from users

Nine reports follow. **7 describe things that are genuinely broken. 2 describe
behaviour that is intentional upstream and must be left exactly as it is** — they are included
because a well-meaning repair that "fixes" them makes the application worse, and because telling the
two apart is part of the task.

1. Pasting a range I copied out of a spreadsheet shreds one of the cells. The cell I copied held a
   comma, so the spreadsheet had wrapped it in double quotation marks; after I paste, the text that
   followed the comma sits in the column next to the one I pasted into, and the quotation marks are
   gone from what landed. Pasting a single plain cell still behaves.

2. Numbers lose their decimals when I paste them. I pasted a value of 12.75 into the age-style
   numeric column and the cell came out as 12 — everything after the decimal point is simply gone.
   Pasting the same value into a text column keeps it whole, and typing 12.75 into the numeric
   column by hand keeps it whole too.

3. Every start date in the grid now reads like `2022-02-18`. The column used to show a localised
   date; now the whole column shows the raw stored form instead, on every row, in both the grid and
   nowhere else. The dates themselves are right, only the way they are printed changed.

4. Deleting marked rows takes extra rows with it. I ticked the row checkbox of one row, then clicked
   a cell of a different row to read it, and pressed the delete shortcut. Both rows were gone, not
   just the one I had ticked. If I tick a row and delete without touching any cell, only the ticked
   row goes, which is what I expect.

5. Copying a tall range out of the grid scrambles the row order. I selected a dozen rows in one
   column, copied, and pasted into a spreadsheet: the tenth row arrived before the second one. Short
   ranges of two or three rows come out in the right order.

6. The find panel reports far fewer matches than the data holds. I searched for a surname that
   appears in dozens of rows and the counter said three; the matches it did find were all cells
   whose text begins with what I typed. Cells that carry the same text further along are not found
   at all.

7. Undo announces itself and then changes nothing. I edited a cell, pressed undo, got the
   confirmation that one action was undone — and the cell still shows the value I was trying to get
   rid of. The value that was there before the edit never comes back. Redo has nothing to redo
   afterwards either.

8. *(Intentional — do not change.)* The toolbar says the grid holds 10,000 rows, but the page itself
   only ever contains about two dozen row elements, and the rows that are there change as I scroll.
   This is not missing data and it is not a bug: the grid only builds the rows the viewport can show
   and rebuilds them as you move. Please do not "repair" it by mounting all ten thousand rows.

9. *(Intentional — do not change.)* The toolbar row counter and the grid's own published row count
   disagree by exactly one, and both are right. One of them counts the data rows; the other counts
   the rows a screen reader is told about, which also counts the always-present empty row at the bottom
   that you type a new record into. Leave the difference alone; do not make the two numbers agree by
   removing either the placeholder row or the count.

## Not every defect is described in these reports

Not every defect is described in these reports. Some of the broken behaviour in this tree has no
user report at all, and some reports overlap: two different underlying faults can produce what looks
like one symptom, and one fault can hide another so completely that repairing the hidden one on its
own changes nothing observable. Treat the reports as leads, not as a checklist, and read the running
application rather than the report list when you decide whether something is fixed.

## Ground rules

- Repair the application source. Do not edit, delete, add or skip any verification artefact, and do
  not weaken a check to make it pass.
- Keep the build working. The production build must still succeed and still produce a servable
  static tree.
- Do not add network access. The app is verified offline; any new external request will hang the
  page load and every check with it.
- Do not special-case a check. Sentinels pin the behaviour that must not change — the plain-table
  view and its stored values, the shape of a copy, the row a plain delete removes, the empty-find
  state and its disabled step buttons, the forward step of the find panel, the redo path, the filter
  that already matches the column's own capitalisation, the reset action, the exported file's row
  count, the two intentional behaviours reported above — and they are scored alongside the repairs.
- Leaving intentional behaviour alone is a correct answer. Reports 8 and 9 are traps in the ordinary
  sense: "fixing" them turns a green sentinel red.

## How the repair is verified

A headless browser drives the served application through a fixed script of interactions and reads
what the application itself reports, both before and after your repair. Checks are split in two:

- **Repair checks** are red on the tree you are handed and must turn green. Each one is the exclusive
  detector of a single underlying fault, with one deliberate exception that is registered as a
  conditional pair: two faults share one repair check because the first hides the second, so that
  check only turns green when both are repaired.
- **Sentinel checks** are green on the tree you are handed and must stay green. They cover the
  behaviour that is correct today, including the two intentional behaviours reported above, so a
  repair that breaks something else does not score.

The score is all-or-nothing across the two groups: every repair check green and every sentinel check
still green.
