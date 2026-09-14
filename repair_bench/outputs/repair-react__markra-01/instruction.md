# Repair Task - Markra (React + TypeScript, pnpm monorepo)

You are working on the source code of **Markra**, a local-first Markdown editor.
The repository is a pnpm workspace that ships two applications (a desktop shell
and a web app) on top of a set of shared packages: the editor surface itself, its
React bindings, a Markdown analysis package, a design-system package, an AI
package, storage providers and shared helpers. **The web application is the one
that is built, served and measured here.** The app is React + TypeScript with a
CodeMirror-based writing surface, a settings window with eleven sections, a
workspace drawer (file list plus a document outline) and a status bar. It talks
to no server: everything it knows is either in the source tree or in the
browser's own local storage.

## The editor

On first run a single untitled document is open. Its file name is shown as
`Untitled.md`, and the welcome text it holds is sixteen lines long: an H1
("Welcome to Markra"), a paragraph, a "Today" section with three bullets, and a
"Next" section with three more bullets. The document outline in the workspace
drawer therefore lists exactly three headings - "Welcome to Markra", "Today" and
"Next" - and at rest only the top-level heading carries a collapse chevron. The
status bar under the editor reports the document's own word count followed by a
save-state word, and at rest it reads `76 words saved`.

The title bar carries eight controls, in this order: toggle file list, file
actions, the **view mode** button, the **editor view mode** button, show history,
save, the light/dark **theme** button and the AI panel toggle. Two different
"mode" concepts live side by side and are easy to confuse:

- The **view mode** decides which pieces of chrome the whole application shows.
  Five values exist - full, daily, focus, immersive and custom - and the shipped
  default is *daily*. Each of the four presets carries its own table of element
  visibility flags (sidebar, recently used directories, file list, outline,
  document links, title-bar buttons, document tabs, AI panel, status bar, word
  count), and *custom* is resolved from the user's own rows instead of a preset.
  The settings window's **View** section renders the resulting list for whichever
  view mode is currently selected, so picking "immersive" or "focus" there must
  show that preset's own list.
- The **editor view mode** decides how the document itself is rendered and cycles
  on every click of its own button: Preview -> Source code -> Preview + Source ->
  Preview, and the button's own accessible label names the mode it just switched
  to.

The **settings window** has eleven sections: General, Storage, Backups, Sync,
Logs, Appearance, View, Editor, Templates, Keyboard shortcuts and Export. Among
the controls the verifier looks at are the interface-zoom list (60% to 200% in
eight steps, shipped default 100%), the appearance-mode radio group and the two
palette lists, the minimum-log-level list (debug / info / warning / error,
shipped default info), the body-font-size list (14px to 32px in ten steps,
shipped default 16px), the line-height and paragraph-spacing controls, the
language list (eleven languages, shipped default English) and the save interval.
Interface zoom is applied to the whole document element, so it scales every
piece of chrome; the body font size applies to the writing surface only.

Editing works the way a local-first editor works: typing into the document marks
it dirty, the save-state word in the status bar flips to `unsaved`, and the
window title gains the app's own dirty marker - the file name, a space, and an
asterisk. Nothing is written anywhere until the document is saved; the save
interval setting drives the app's own auto-save of the draft, not an upload.
Between the text column and the empty space beside it the editor draws a thin
width separator whenever the layout has room for it, and that separator is what
the user drags to change the content width (shipped default 860, minimum 640).
It is only withheld when the AI panel is open and the remaining space is too
narrow.

## Building and running it

Dependencies are provisioned offline by the harness; you never need to install
anything and you never need the network. The web application is built with the
workspace's own local TypeScript compiler and its own local vite, and the
verifier serves the resulting `apps/web/dist` from the **site root**, i.e.
`http://127.0.0.1:PORT/`.

Environment notes - properties of this offline harness, not defects:

- There is no network access and nothing in this project needs it. Measured on
  the delivered tree: 22 resources loaded, **0** of them from another origin,
  **0** requests blocked, **0** page errors and **0** unhandled rejections.
- The harness drives the app in a real browser at a **1280x900 viewport**, i.e.
  the wide desktop layout, with the workspace drawer and the editor side by side.
- Every checkpoint starts from a **fresh browser context**, so nothing - not the
  address, not any local storage entry, not anything held in memory by the page -
  carries over from one checkpoint into the next. A first-visit behaviour is
  therefore measured as a first visit, every single time, and a preference you
  change in one checkpoint cannot help you in another.
- The app renders markup characters (`#`, `-`, `*`, and friends) through the
  editor's own decorations, which de-emphasise them on the lines that do not hold
  the cursor. That is intended behaviour, and the underlying document text is
  never altered by it.
- The desktop shell is not built and not measured; only the web application is.

## The reports

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, **not** as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the workspace. The root cause may sit in a different package than
  the one the symptom appears in, and a single reported symptom can have more
  than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- **Not every defect is described in these reports.** 并非所有缺陷都有报告提及 -
  some of them nobody wrote in yet, and at least one of them is hiding behind
  another, so its own symptom cannot be seen until the first one is repaired.
  Behaviors you break while fixing other things still count against you, so check
  the neighbouring behavior of anything you touch - two of the reports below were
  filed by users who had no idea what they were actually looking at, and two of
  the things nobody reported live in the same drawer as things that were.
- Do not "repair" anything by deleting a feature, hardcoding a value the app
  computes, special-casing the verifier's browser, or weakening a preset table so
  that every mode renders the same chrome. The seed's own defaults and presets are
  part of the product and are measured.

1. "**The word count in the status bar is two too low.** On a brand new install
   the welcome document says `74 words saved`. I selected the whole document and
   counted it three different ways - by hand, with a command line tool, and in
   another editor - and it is 76 words. It is not a rounding thing and it is not
   off by one, it is exactly two. I think it stopped counting the little dashes
   in front of the bullet items under 'Next', because there are three of them and
   the one word in the second paragraph that has a hyphen in the middle now seems
   to be counted as two words instead of one, which would be minus three plus one.
   The rest of the status line is fine, it still says the document is saved."

2. "**The whole interface opens 20% too big.** Buttons, the sidebar, the settings
   window, the status bar - everything is oversized, like the page has been
   zoomed. If I open the appearance settings the zoom control is sitting on 120%
   and I have never touched it; on my other machine the same build opens at 100%.
   Setting it back to 100% fixes the look, but it should not have been on 120% in
   the first place. Note that this is the *interface* zoom: the text of my
   document is bigger too, but I am fairly sure that is a second, separate
   problem, because the two do not move together - see report 7."

3. "**I can no longer change the width of the text column.** There used to be a
   thin separator between the document column and the empty grey space to its
   right, and dragging it made the column wider or narrower. Now it is simply not
   there. I am not talking about a case where there is no room for it: my window
   is wide, the AI panel is closed (it is always closed, I never open it), and the
   settings still list the same width and the same minimum. The separator is gone
   from the page, not greyed out."

4. "**The title of the tab is squashed.** As soon as I type one character into a
   new document the title turns into `Untitled.md*`, with the asterisk glued
   directly onto the file name. It has always been `Untitled.md *` - name, space,
   asterisk - and every screenshot in your own documentation has the space. The
   status bar underneath still says `unsaved` correctly and the document still
   saves normally, so it is only the title string that lost its separator."

5. "**The preview/source button skips a step and then gets stuck.** The button in
   the title bar that says 'Editor view mode: Preview' is supposed to walk
   Preview -> Source code -> Preview + Source and come back round. On this build
   the very first click jumps straight to 'Preview + Source', so I never get to
   the plain source view; and once the editor *is* in the source view - I had to
   get there through the settings - clicking the button does not move it at all,
   the label stays 'Source code' however many times I click. The third step of
   the cycle still works. It is the same button in both cases, and the other seven
   buttons in the title bar all do what they say."

6. "**The dark mode button is dead.** I click the theme button in the title bar
   and absolutely nothing happens: the page stays light, and the button's own
   label does not even change - it still says 'Switch to dark theme' afterwards.
   I can switch the appearance from the settings window and that works, so it is
   not that dark mode is broken; it is only that one button. Clicking it ten
   times changes nothing ten times."

7. "**My document text is bigger than it should be, and only the document.** The
   interface being oversized is report 2, but this is different: the *text I am
   writing* is rendered two pixels larger than the shipped default. I checked the
   editor section of the settings and the font-size list still offers exactly the
   same ten sizes it always did, and the line height and paragraph spacing are
   untouched - it is only the size the editor starts with on a fresh install.
   Everything else in the writing surface is normal, the cursor, the line boxes,
   the sixteen lines of the welcome text."

8. "**The editor is eating my Markdown characters.** When the cursor is on a line
   I can see the `#` of the heading and the `-` of the bullet, but the moment I
   click anywhere else those characters fade out or disappear entirely, and the
   line reads like rendered text instead of Markdown. I am worried the file is
   being rewritten behind my back and that saving will lose the markup. Please
   make the characters stay visible all the time."

9. "**It never actually saves my work.** The status bar says `unsaved` from the
   moment I type the first character and the title gets that little asterisk, and
   it stays like that forever - I have left the app open for an hour. I can also
   see the save interval setting says ten minutes, so an auto-save should have
   happened by now, and yet nothing has been written to my disk. Either the
   auto-save is broken or the status is lying."

## What to do

Work in the source tree, repair the **root cause** of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the five view modes and what each of their preset tables says, the
eleven settings sections and every control in them, the eight title-bar controls
and their accessible labels, the workspace drawer's file list and outline and
their collapse/expand controls, the shipped defaults the reports name (interface
zoom, minimum log level, body font size, language, save interval), the
dirty-marker contract in both the title and the status bar, the width separator's
own geometry, and the light/dark theme plumbing - none of which any report asks
you to redesign.

The project must still build cleanly and type-check when you are done: the
harness builds the web application with the workspace's own local TypeScript
compiler and vite and serves `apps/web/dist` from the site root. Repairing a
symptom by weakening the build, deleting a package or a component, pinning a
preset table to one entry, hardcoding a value the app computes, or writing a
global flag that only the verifier can see is not a repair and will be measured
as a regression.
