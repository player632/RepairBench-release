# Repair Task - Luckysheet (vanilla JS)

You are working on the source code of **Luckysheet**, an online spreadsheet
built with vanilla JavaScript and jQuery: a canvas-rendered grid with a
formula bar, a full toolbar (font/format/alignment/borders/merge, conditional
formatting, data bars, color scales), cell editing with rich formulas,
drag-fill of series and formulas, sorting, freeze panes, comments, multiple
sheets with a tab bar and a sheet-list popup, search & replace, pivot tables,
sparklines and a bottom status bar that summarizes the current selection
(count/sum/average). The project lives in this workspace and is fully
offline: dependencies are already installed, build with `npm run build`
(gulp + rollup, output in `dist/`, served from that directory as the site
root; `dist/index.html` boots a bundled demo workbook with eleven sheets).
There is no backend and no network access: the chart plugin depends on
remote CDN scripts, so chart rendering is switched off in this build and is
not part of verification.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Redo is dead after the matrix moves. I mark a block of cells,
   right-click and run one of the matrix operations on it - flip it upside
   down, transpose it, that kind of thing. When I botch one, undo puts the
   block back exactly as it was, no complaint there. But if I then change my
   mind and hit redo, nothing happens at all: the block stays the way undo
   left it and the flipped values never come back, so I end up running the
   whole operation again by hand. Normal typing is fine - type something,
   undo it, redo it and the text comes back - it's only these matrix
   operations where redo refuses to do anything."

2. "The bold button in the toolbar doesn't work. I click a cell that has
   text in it, press Bold, and the text stays plain. Same for italic,
   strikethrough and underline - none of the four buttons ever change
   anything when my selection is a single cell or a range that all shares
   the same formatting. Oddly, if I select a messy mix of formatted and
   unformatted cells the buttons do seem to apply the format."

3. "Sorting puts empty cells in the wrong place. I sort a column that has
   some blank cells and the blanks all jump to the very top of the list -
   both with sort-ascending and sort-descending. Blanks belong at the
   bottom."

4. "Duplicating sheets mangles the names. I duplicate a sheet tab and the
   copy comes out right - 'Cell(Copy)'. But when I duplicate *that* copy,
   the new tab is named '(Copy)(Copy)': the original sheet name is gone
   entirely and the copy marker is doubled up. A third duplicate is
   '(Copy)(Copy)(Copy)'. Duplicating a sheet that is not already a copy is
   always fine, it only goes wrong once the thing I duplicate is itself a
   copy."

5. "The comment menu is stuck in the past. I add a comment to a cell
   through the comment button, then click the comment button again for the
   same cell and the menu still offers 'insert comment' - the edit and
   delete entries never show up, so I cannot reach them from the toolbar."

6. "We embed the spreadsheet in our page and persist the workbook through
   the sheet-file API. Since a recent build, whenever a user switches to
   another sheet, the file list we read back marks two sheets as active at
   the same time - the one we switched to and the one we came from. The
   sheet-list popup in the app agrees: two sheets carry a checkmark."

7. "Toolbar state sync is half broken: when I click a cell whose text is
   underlined, the underline button does not light up as active - although
   the bold button does light up correctly when I click a bold cell."

8. "The Chart demo sheet is empty. I open it expecting to see the embedded
   chart from the demo data and there is nothing - the chart area never
   renders. Looks like the demo data got corrupted."

9. "The input line above the grid shows garbage. Whenever I click a cell
   that contains a computed number, the box up there fills with some text
   starting with '=' instead of showing the number I see in the cell."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
