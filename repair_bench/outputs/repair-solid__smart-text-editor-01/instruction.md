# Repair Task - smart-text-editor (a keyboard-first text editor that lives in the browser)

You are working on the source code of **Smart Text Editor**, a single-page text
editor whose own tagline is "the text editor that requires only a browser and a
keyboard". It is TypeScript on solid-js 1.9 bundled by vite 7, and it ships as
an installable app: there is a service worker, a web manifest and an install
prompt behind the settings menu. There is no backend of any kind - every
document lives in the page.

`npm run build` is the whole build step: it type-checks the sources with `tsc`
(strict, and it fails the build on an unused local or an unchecked index) and
then bundles into `dist/`, which is the directory that gets served. A source
edit only becomes visible after a rebuild.

What the one page shows, in the words of someone using it:

- a **tab bar** of open documents across the top of the workspace, with a
  button at its right-hand end that opens another editor. Each tab carries the
  document name, becomes active when clicked, has its own close button, and can
  be renamed in place: right-clicking a tab turns its label into a text field.
- the **editor surface** under it. Every document is rendered by a `num-text`
  element - a code-editor widget with line numbers, a colour scheme, syntax
  highlighting for the languages the bundled highlighter knows, and a scaling
  handle that resizes the pane.
- three **views** of the same documents: Code (editors only), Split (editor and
  live preview side by side) and Preview (the rendered document on its own, in a
  frame). Split can be laid out horizontally or vertically, and there is a
  Display entry for a distraction-free page.
- a **Preview** menu that decides which document the preview renders: the active
  editor by default, or one particular editor picked from the list, plus a
  Refresh entry and a Base URL entry for the previewed document.
- a **Tools** menu of small utility cards that float over the workspace and can
  be minimised or closed: Replace Text (find and replace across the active
  document, with a Flip button that is meant to swap the two fields), JSON
  Formatter (Format / Collapse / Clear on a JSON payload), URI Encoder
  (encode and decode, with a tick box for component mode), UUID Generator (a
  result box and a Generate button), and Insert Templates (an HTML skeleton, a
  Bedrock pack manifest) which types a template into the active document.
- a **Settings** card: a Default Orientation choice, a "Syntax Highlighting
  (Beta)" tick box, an "Automatically Refresh Preview" tick box, and Install /
  Customize Theme / Clear Cache / Reset Settings buttons. Settings are kept in
  the browser's own storage between visits.
- a **File** menu: New Editor, New Window, Open (from disk), Rename, Save, and a
  Save As list of formats (.txt, .html, .css, .js, .json, .svg, .webmanifest,
  .md, .mcmeta, .xml).
- the browser **tab title** follows the document: with one open it reads
  "Smart Text Editor - <name>", and with none open it is just
  "Smart Text Editor".

Keyboard, exactly as the menus state it. Every entry carries its own shortcut and
the app keeps two columns for each - a default one and an Apple one - and picks
between them from the platform the page believes it is running on. In the
default column: `Ctrl+Shift+1` Code, `2` Split, `3` Preview, `4` Orientation,
`5` Display; the tool cards are `Ctrl+Shift` plus a letter (F Replace Text,
G JSON Formatter, Y URI Encoder, O UUID Generator, H HTML template, B preview
Base URL, R rename); `Ctrl+N` new editor, `Ctrl+W` close, `Ctrl+S` save,
`Ctrl+O` open, `Ctrl+,` settings. The Apple column advertises the same entries
with `Cmd` in place of `Ctrl`. Moving between documents is `Ctrl+Tab` and
`Ctrl+Shift+Tab` on every platform, and `ArrowLeft` / `ArrowRight` step between
tabs when the tab bar itself has the focus.

Runtime facts about how this task is verified:

- The tree is built and served over a local static server with **no network
  access**. The editor widget, the menu widget, the syntax highlighter and the
  stylesheets those widgets need are carried inside the tree already; nothing
  may be pointed back at a remote host and nothing is fetched at runtime.
- The harness drives the built page in a real browser at a **1280x720
  viewport**.
- That browser context reports a desktop Chrome window on a non-Apple platform,
  so the app takes its default platform branch: the `Ctrl+Shift` column above is
  the live one and the Apple-only branch is never reached. No check depends on
  Apple-specific behaviour, and the way the app detects the platform is not
  itself a defect.
- Every checkpoint starts from a fresh browser context, so a saved setting, an
  opened card, a typed document or a switched view from an earlier interaction
  never carries into the next one. Each checkpoint sees the app's own first-run
  state: one empty document, the Code view, horizontal orientation.
- Native browser dialogs are not part of the harness: `alert`, `confirm` and
  `prompt` popups are closed without an answer. Anything that only happens after
  the user confirms something - resetting settings, clearing caches, closing a
  document that still has unsaved edits, the Rename entry in the File menu -
  therefore cannot be exercised, and no check depends on it. The in-tab rename
  (right-click a tab, type, leave the field) uses no dialog and is the rename
  path that is measured.
- The preview is a real frame holding the document being previewed, and its
  contents are read out of the frame itself.
- Syntax highlighting covers the languages the bundled highlighter ships with
  (markup/html/xml/svg, css, clike/javascript/js, json, webmanifest). A plain
  `.txt` document has no grammar to highlight with; that is the seed's own
  behaviour, not a defect.
- The UUID generator is random by design, so two runs give different values. No
  check depends on a particular UUID - only on the shape of the value and on the
  digits the format pins down.
- The app registers its service worker only when it is running as an installed
  window, which a plain browser tab is not. No check depends on it.
- The `data-testid` attributes present in the tree, and the read-only
  measurement object the harness installs on the window, are verification
  probes. Do not remove, rename or repurpose them, and do not try to drive the
  app through them: the measurement object has no setters and no methods, so it
  can only ever report what the app itself is doing.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different part of the
  editor than the place the symptom shows up, and a single reported symptom can
  have more than one root cause behind it.
- At least one report describes behaviour that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviours you break
  while fixing other things still count against you.
  并非所有缺陷都有报告提及；修别的问题时弄坏的行为同样会扣分。
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "The browser tab title reads backwards. With a document open it says
   `notes.html - Smart Text Editor`, and every other page of the product puts
   the app name first - it is supposed to be `Smart Text Editor - notes.html`.
   It only started reading the other way round recently. Oddly, when I close my
   last document the short title on its own is still correct, so it is just the
   two-part one that has the wrong order."

2. "Switching views does not switch the view. I am in Code, I press `Ctrl+Cmd+2`
   (or pick Split from the View menu), the menu ticks Split, the app clearly
   believes it is in Split - the Preview menu starts offering preview things -
   and yet the window never rearranges: no preview pane appears, the editors
   stay exactly as they were. It is not the shortcut either, the menu entry does
   the same. Worse, if I switch again I end up with the two layouts fighting
   each other, and the only way back to something sane is to reload the page.
   Split used to open side by side immediately."

3. "The preview stopped following my typing. I work in Split with 'Automatically
   Refresh Preview' ticked in Settings - it is ticked by default and I have not
   touched it - and the preview pane used to update as I typed. Now it just sits
   on whatever was in it when I opened the view, however much I edit. If I go to
   Preview > Refresh by hand it does update, so the preview itself still works;
   it is the automatic part that never happens."

4. "Collapse in the JSON Formatter card does nothing. I paste a blob of JSON,
   hit Format and get it nicely laid out over many lines with two-space indents -
   that part is fine. Then I hit Collapse expecting one long line I can copy, and
   I get the same multi-line indented text back again. Pressing Collapse twice,
   or Format then Collapse, always leaves it laid out. Clear still empties the
   box, so the card is not dead."

5. "The Flip button in the Replace Text card is broken. The whole point of it is
   to swap the two fields - I search for `foo` and replace with `bar`, then Flip
   should give me `bar` in the top field and `foo` in the bottom so I can undo
   what I just did. Instead both fields stay exactly as they were. Nothing about
   the card looks disabled, and Replace itself still replaces text in my
   document."

6. "The 'Syntax Highlighting (Beta)' tick box in Settings has no effect at all
   on my documents. Untick it, tick it again, untick it - the box itself always
   moves and the choice is remembered next time I open the app, but an `.html`
   or a `.json` document keeps exactly the colouring it had. I expected the
   colours to go away when I turn it off and come back when I turn it on. It
   behaves like the setting is being written down and then applied to nothing."

7. "Is the empty `Untitled.txt` tab that is already open when the app starts
   leftover developer scaffolding? There is also a button at the right end of
   the tab bar that just adds another blank one of those. It looks like
   something a developer left in while testing and forgot to take out before
   shipping - should the app not start with no documents at all, and should
   that button not be hidden behind a flag?"

8. "I think the UUID Generator card is broken in two ways. I cannot type into
   the result box at all - it refuses keystrokes, so I cannot paste a value in
   to check it - and every single press of Generate gives a different answer,
   so I cannot reproduce a UUID I already generated. Should the box not be
   editable, and should Generate not be stable for the same input?"

Work in the source tree, repair the root cause of each real defect, and leave
the intended behaviours alone: the document the app opens with and the button
that adds another, the read-only UUID result box and the fact that a generated
UUID is different every time, the shortcut sets the menus advertise (including
the two-modifier view shortcuts on Apple hardware and the arrow-key step
between tabs), the hand-driven Preview > Refresh path, the Format and Clear
buttons of the JSON card, the Replace and Clear buttons of the Replace Text
card, the decode direction of the URI card, the settings the app keeps in
browser storage, the short title shown when no document is open, the preview
frame and its Base URL, the scaling handle, the templates, and the offline,
vendored way the page loads. The tree must still type-check and build with
`npm run build` when you are done, and must still need nothing from the network.
