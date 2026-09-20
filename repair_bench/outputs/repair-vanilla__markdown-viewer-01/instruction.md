# Repair Task - Markdown Viewer (vanilla JavaScript)

You are working on the source code of **Markdown Viewer**, a browser-based
Markdown workspace written in plain JavaScript with no framework and no
bundling step: users keep a tree of documents in an Explorer sidebar, open
several of them as tabs, edit Markdown in a plain-text editor with a line
number gutter and a formatting toolbar, and watch a sanitized live preview
next to it. The app also offers synchronized scrolling between the two
panes, a light and a dark appearance, left-to-right and right-to-left text
direction, document statistics (characters, words and an estimated reading
time) in the status bar, a quick table picker, comments/review threads,
export to Markdown/HTML/PDF/PNG, snapshots shared through the URL, a Trash
with a 30 day retention window, and a workspace backup/restore flow. All
documents live in the browser's own storage, so everything survives a
reload. The project is in this workspace and is fully offline: install with
`npm install --no-audit --no-fund`, build with `npm run build`, and the site
root that gets served is the project directory itself. Optional add-ons that
the app fetches from the internet only when a document asks for them
(diagram engines, math typesetting, 3D and map viewers, PDF/image export
helpers) cannot load in this environment, so any behavior that depends on
them is out of scope for verification; the core editing, preview, statistics,
appearance, direction, table picker and persistence features do not need the
network and are what QA exercised.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  layer than the one the symptom appears in - markup, styling, application
  logic and the storage layer are all in play.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "The reading time estimate in the status bar went crazy. I have a short
   note open - a few hundred words at most - and the 'Min Read' figure says
   something like eighteen or twenty minutes. The word figure next to it
   still looks right, so it is not the document that is wrong."

2. "The appearance button in the workspace settings menu now lies to me. I
   switch to the dark appearance and the button icon still shows the sun,
   and its helper line still tells me to 'switch to dark'. Switch back to
   light and it shows the moon. The colors of the app do change correctly,
   it is only the button that is confused."

3. "Word counting broke for anything I paste in from a web page or from
   Word. Text I type by hand counts fine, but pasted paragraphs come out
   with far fewer words than they should. I counted by hand: five words on
   a line, and the status bar says three."

4. "Right-to-left text only half works. I turn on the right-to-left option
   from the alignment menu and the editor pane flips as it should, but the
   preview pane next to it keeps rendering left-to-right, so my Hebrew notes
   look fine on the left and wrong on the right."

5. "The gutter is one line short. My file has four lines and the gutter only
   shows numbers for three of them - the last line I type never gets a
   number. It is always exactly one behind, whatever file I open."

6. "The bulleted list button on the formatting toolbar inserts a numbered
   list. I put the cursor on a line, click the button with the three dots
   and dashes on it (its tooltip still says 'Bulleted list'), and I get
   '1.' at the start of the line instead of '-'. The button next to it, the
   one that is supposed to number the list, does the same thing."

7. "The quick table picker is empty. I click the grid icon on the toolbar,
   the little popup opens with the 'Select table size' caption and the
   'Custom table...' entry, but the square selection grid that is supposed
   to be between them is just not there at all - nothing to hover, nothing
   to click."

8. "The synchronized scrolling button in the header feels broken. I click it
   and I get no obvious feedback, so I assume the app ignores me and click
   it again. Nothing seems to happen either way. Is scrolling sync even
   implemented in this build?"

9. "Your own storage panel promises me that 'Deleted files stay in Trash for
   30 days'. I do not believe it - as soon as I delete something it feels
   like it is gone for good. Please make the retention actually work."
