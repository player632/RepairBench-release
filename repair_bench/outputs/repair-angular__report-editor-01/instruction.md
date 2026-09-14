# Repair Task - report-editor (Angular 9 + TypeScript, a canvas-drawn spreadsheet / report editor)

You are working on the source code of **report-editor**, an Angular 9 application
built the classic NgModule way - a root module, a router module, one lazily loaded
feature module, ordinary components with templates, services and a couple of
attribute directives. There are no standalone components, no signals and no
third-party UI kit: the toolbar, the palettes and the sheet are all hand-written
markup, hand-written SCSS and one large hand-written drawing class that paints the
sheet onto HTML canvases.

The application is a small spreadsheet-style report editor, and the sheet is not
made of table elements. Almost everything you see below the toolbar is drawn by
that one class onto a stack of five canvases: the row and column rulers, the cell
grid with its borders and text, the selection highlight, an animation layer and a
floating-element layer. Because the sheet is drawn rather than laid out, the
positions and sizes it uses come from a handful of geometry constants and from a
scale factor, and the only real DOM elements floating over the drawing are the
toolbar, the formula bar and a small editing box that appears on top of the cell
you are typing into.

There is one route with content. The bare address of the site redirects to the
editor, and the editor page is the whole user-visible surface: a thin header
carrying a link to the project's repository, the toolbar, the formula bar and the
sheet. Everything below describes that single page.

The **header** holds one link to the project's repository on GitHub, with a small
icon image beside the word "GitHub". The icon is served from inside the project
itself.

The **toolbar** is a row of anchor-wrapped icon buttons plus a few form controls.
In document order it offers: an image-insert control (a hidden file input behind
a button labelled in Chinese, "插入图片", which accepts images), a merge/un-merge
button, three alignment buttons (left, centre, right), a font-colour button, a
fill/background-colour button, a zoom-in button and a zoom-out button, then a
bold toggle and an italic toggle rendered as text spans, and finally two drop-down
selectors - one for the cell font family (seven choices, "sans-serif" selected)
and one for the font size (thirty choices, "10" selected). The icons come from a
small icon font that ships inside the project, so every glyph resolves offline.
The alignment buttons all show the same glyph and are told apart only by their
position in the row and by the colour each one is drawn in: the one whose
alignment matches the active cell is drawn blue, the others black.

The **formula bar** sits under the toolbar. On its left is a small grey label
showing the address of the active cell in spreadsheet notation - the top-left cell
of the sheet is `A1`, the one to its right is `B1`, the one below it is `A2` - and
next to it a text input that mirrors the value of the active cell and lets you
type a value into it.

The **sheet** fills the rest of the window. Clicking a cell makes it active; the
active cell is drawn with a heavier green border, and a selection of several cells
is drawn as a translucent block. The sheet scrolls inside itself: the wheel moves
the drawing and the rulers follow, while the window around it never scrolls. Rows
are 30 pixels tall and columns 100 pixels wide at the default scale, and the whole
drawing can be scaled up or down with the two zoom buttons between 0.5 and 1.5 in
steps of 0.1.

**Editing a cell** starts as soon as you press a printable key while a cell is
active, or when you press the mouse down on the formula bar input. A small
editing box - a DOM element you can type into, positioned exactly over the cell
being edited and sized to that cell - appears inside the selection highlight,
showing what you have typed so far, and it takes the keyboard focus so the
characters go into the cell rather than into the page. `Enter` and `Tab` finish
the edit and put the value into the sheet, `Escape` throws it away, and the
editing box disappears. While a cell is being edited the formula bar shows its
text.

**Colour palettes**: clicking the font-colour button drops down a palette of nine
colour squares (grey, dark grey, red, orange, yellow, green, light blue, dark
blue, white) and clicking the fill-colour button drops down the same nine squares
for the cell background. Picking a square applies that colour to the active cell -
to its text if you used the font-colour palette, to its background if you used the
fill palette - and the two colour buttons in the toolbar are themselves drawn in
the active cell's current text colour and background colour, so they always show
what the cell looks like.

**Merging**: select a range by holding shift and pressing an arrow key, then press
the merge button and the range becomes one cell whose width is the sum of the
merged columns and whose height is the sum of the merged rows. Pressing the merge
button again on a merged cell un-merges it.

The project builds with the Angular CLI through npm: `npm run build`, which runs
`ng build`. This is an Angular 9 project, so its bundler is webpack 4, and on a
modern Node it must be run with `NODE_OPTIONS=--openssl-legacy-provider` or the
bundler dies on a legacy hashing algorithm before it emits anything. The build is
a development-configuration build (no production flag): it type-checks the whole
app with AOT, emits a pair of bundles per chunk for differential loading, and
writes its output into a folder named after the project which the verifier then
serves **at the root of the site**. The document carries a relative base address,
so relative references inside the app resolve against whatever path the document
is served from, and the verifier's own readiness checks depend on that. The editor
route is lazy, so its bundle is fetched when the route is first reached.
Dependencies are provisioned offline by the harness.

Environment notes - properties of this offline harness, not defects:

- There is **no network access**, and nothing in this project needs it. The sheet's
  content is generated in memory, there is no API call, no upload, no analytics tag
  and no webfont request anywhere: the icon font and every image are served from
  the same origin as the page. The one external address in the whole user interface
  is the repository link in the header, which the application never fetches and
  which no check follows - it is there to be read, not to be visited, and it is
  meant to stay.
- Nothing is random and nothing is remembered between runs. The app writes no
  storage, no cookie and no query parameter, and it keeps no state that survives a
  reload, so the same screen produces the same readings every time. Two internal
  timestamps exist (a double-click discriminator on the sheet and a per-cell
  "last modified" stamp) and neither is rendered anywhere.
- Some behaviour is checked **after a sequence**, not at load: a key press that
  opens the editing box, a zoom click that rescales it, a range selection followed
  by a merge, a palette opened and closed and opened again, an `Enter` that should
  close the editor. Those are exercised by performing the sequence with real
  settling time between the steps, so a page that merely looks right at load is not
  enough - and equally, a repair that only works on the first interaction is not
  enough.
- The build must still succeed when you are done. It is a strict AOT build, so
  every file must still type-check and every template binding must still be
  type-correct. A healthy build prints one harmless Node deprecation warning about
  a legacy utility API and still succeeds, so that warning is not by itself a
  problem.
- The harness loads a small **read-only measurement layer** inside the application
  at bootstrap. It publishes getters for things the browser has already rendered -
  element censuses, computed styles, text, layout boxes, resource timings - so the
  checker can read the live page instead of guessing at it. It writes to no
  component field, changes no behaviour, carries no styling and adds no markup.
  **Do not remove, rename, repurpose or extend it, and do not delete the statement
  that loads it** - it is required by the checker. Equally, do not add markup,
  attributes, styles or globals to the page in order to make a reading come out
  right: the checker reads the real DOM and the real window, so a hardcoded value
  or a leftover global shows up exactly where it was left.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and in a different layer than the one you can see: a
  geometry constant, a template expression, a stylesheet declaration, a key code
  table and the drawing class behind a button are halves of one contract.
- At least one report describes behavior that is actually intended; verify a report
  before changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Behaviors you break while fixing other things still count against you, and the
  toolbar, the palettes, the formula bar, the editing box and the sheet all read
  the same cell model and the same geometry constants, so a change made for one
  report is visible in the others.
- Keep the read-only measurement layer described above exactly as it is.

The reports, in no particular order:

1. "Two things about the alignment buttons look broken to me. First, all three of them show exactly the same icon - three identical little left-align glyphs in a row, so you cannot tell left from centre from right by looking at them. Second, when the editor opens the LEFT one is already coloured blue before I have clicked anything at all, as if the app thinks I chose it. Can you give the three buttons their proper distinct icons and stop the left one lighting up on startup?"

2. "The colour palette keeps closing on me. I click the font-colour button, the nine squares appear, and the instant I click a square the whole palette disappears - I have to reopen it for every single cell I want to colour. It should stay open while I work, like a normal toolbar palette. Please make it stop closing."

3. "I open the editor and the little address box on the left of the formula bar already says B1 - before I have clicked anything. The top-left cell of a sheet has always been A1. Now every cell I click on is one letter further to the right than it should be: click the first column and it says B, click the second and it says C. The row numbers are still right, it is only the letters."

4. "The background-colour button does nothing. I click the font-colour one and the little palette of nine squares drops down as usual, I click it again and it goes away, but when I click the fill/background-colour button no palette appears at all - no squares, no white box, nothing, however many times I click it or how slowly I click. Both buttons used to bring up the same set of squares."

5. "The page itself has become scrollable. The sheet is supposed to be bolted to the window with only the grid scrolling inside it, but now the document moves: wheel or drag at the edge of the window and the header, the toolbar and the whole grid travel together, and the drawing ends up out of line with where my clicks land. It used to be locked solid - the only thing that ever scrolled was the sheet itself."

6. "The colour picker is dead. I open the font-colour palette, I click the red square, and the text stays black - the little colour icon on the toolbar stays black too, and so does the fill icon next to it, which stays white exactly like it always does at startup. I cannot tell you whether it is painting the wrong thing or painting nothing at all, because I cannot get anything to change; all I know is that picking a font colour does not colour the font. The alignment buttons next to it seem just as dead, for what that is worth."

7. "Merging cells only half works. I select two cells side by side (I hold shift and press the right arrow) and press the merge button, and instead of getting one double-width cell I get something that is still one column wide - the editing box that pops up is the width of a single cell and the second column is still sitting there on its own. Merging two rows one on top of the other seems fine, it is only the side-by-side merges that come out too narrow."

8. "Pressing Enter no longer finishes editing a cell. I start typing, the little editing box opens, and then Enter just sits there - the box stays open with the cursor still in it and the value never lands in the sheet. I have to click somewhere else on the grid to get rid of it. Oddly, Tab still commits the edit exactly like it always did, and so does Escape, so it is only the Enter key."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the header and its single repository link, the toolbar's ten icon
buttons and their order, the bold and italic toggles, the font-family and
font-size selectors and every option in them, the image-insert control, the
formula bar's address label and its input, the five-canvas sheet with its rulers
and selection highlight, the internal scrolling and the zoom range, the editing
box and the way it is placed over the cell, the nine colour squares and both
palettes, the merge and un-merge behaviour in both axes, the key handling for
`Enter`, `Tab`, `Escape`, the arrow keys and shift-arrow range selection, and
every reading that was already correct - none of which any single report describes
in full. The project must still build with the command above when you are done.
