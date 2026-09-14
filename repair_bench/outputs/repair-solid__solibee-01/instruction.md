# Repair Task - solibee (a SolidJS component-library documentation site)

You are working on the source code of the documentation site for a small SolidJS
component library. It is a Vite project: SolidJS with the SolidJS router, some
TypeScript, Tailwind for styling, and a syntax highlighter that renders every
code snippet. The site documents nine components. Each component gets its own
page with a heading, a description, a live **Preview** box running the real
component, a **Features** list, and the component's own source code in a
highlighted block with a copy button, plus the install command for that
component. Dependencies are already installed in the tree.

What the site shows, in the words a reader would use:

- a top bar carrying the bee logo and the word "Solibee", a **Docs** link, a
  **Components** link, a GitHub icon, and a sun/moon icon that switches the
  whole site between its light and its dark theme.
- a left-hand menu, visible at desktop width, with a **Getting Started** section
  (Introduction and Installation) and a **Components** section listing all nine
  components. Three of the nine entries carry a small italic **Beta** tag.
- a landing page with the library name, a short pitch, four pictures and two
  links that go straight to a component page.
- an **Introduction** page with the project's pitch, the same menu, and five
  contributor portraits.
- an **Installation** page with eight highlighted code blocks - the CLI install
  command, the Tailwind configuration, the stylesheet, and the four manual
  dependency steps - each with its own small copy button in the block's bottom
  right corner.
- nine component pages: **Accordion**, **Drag And Drop**, **Generate OTP**,
  **Input File**, **Input Form**, **Input OTP**, **Search Button**, **To Do
  List** and **Switch**.
- a footer, and a **404** page for any address the site does not know.

How the live components in the Preview boxes are meant to behave:

- **Accordion** - four questions. Clicking one opens its answer and closes any
  other answer that was open; clicking the open one again closes it. Only one
  answer is ever open, and the open state of each question is announced to
  assistive technology.
- **To Do List** - type something, press **Add Todo**, and a row appears with
  that text while the typing box is emptied for the next entry. An empty or
  whitespace-only entry is not added. Each row has a small round checkbox:
  ticking it strikes the row's text through, unticking it restores the text.
- **Input OTP** - six single-character boxes. Typing a digit fills the box and
  moves the cursor on to the next one, so six digits can be typed straight
  through; **Submit OTP** reports what was entered and then empties all six
  boxes. If fewer than six digits were entered it says so instead, and still
  empties the boxes.
- **Generate OTP** - shows a numeric one-time password. **Regenerate** replaces
  it with a freshly generated one, so every press gives a different number.
  **Copy** copies it.
- **Drag And Drop** - four columns with two cards to start, one card in each of
  the first two columns. Each column has a **New Item** button that adds a card
  to that column, and every card has a small **×** that deletes that card and
  only that card. Cards can also be dragged between columns.
- **Switch** - a pill with a knob that slides from one end to the other when it
  is clicked, and a label under it reading **Light Mode** or **Dark Mode** to
  match which end the knob is at.
- **Search Button**, **Input File** and **Input Form** - a search field inside a
  search-role form; a file chooser with an upload button that reports the chosen
  file (and complains on the console when nothing was chosen); a two-field form
  with a submit button.

Runtime facts about how this task is verified:

- The tree is built with the project's own build script and the result is served
  from its build output directory over a local static server, with **no network
  access**. Nothing on the served pages may reach a third-party host: no fonts,
  no avatars, no scripts from a CDN.
- Measurements are taken in a headless desktop browser at 1280x720. That browser
  **denies clipboard writes**, so nothing that depends on a copy actually
  succeeding is observable there, and the checker does not ask about it.
- **Do not run the build, the dev server or the project's own test suite while
  answering.** The checker builds the tree and measures the served pages itself;
  running those commands yourself is recorded. Read the code and reason about
  what it does instead.
- Do not remove, rename or repurpose any `data-testid` attribute - they are
  verification probes required by the checker. Adding none of your own is fine.

Before you change anything:

- At least one report below describes behaviour that is actually intended.
  Verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviours you break
  while fixing other things still count against you.
  并非所有缺陷都有报告提及；修别的问题时弄坏的行为同样会扣分。
- A report may be impossible to reproduce while a different problem is still in
  the way. Re-read the reports and re-check them after every repair you make.
- Several reports can share one root cause, and one repair can be worth more
  than the report that asked for it.

The reports, in no particular order:

1. "Seven of the nine component pages are gone. If I pick **Drag And Drop**,
   **Generate OTP**, **Input File**, **Input Form**, **Input OTP**, **Search
   Button** or **To Do List** from the left-hand menu I land on the 404 page
   instead. **Accordion** and **Switch** still open normally. The menu entries
   look exactly like they always did and the address bar shows the name I
   clicked, so I do not think the menu is the problem - but I can only read the
   documentation for two components out of nine right now, which makes the
   library look abandoned."

2. "The **Components** link in the top bar does not go where it used to. It used
   to open the first component in the library's own list, the same one the menu
   starts with, so it was a sensible 'jump straight into the docs' shortcut. Now
   it drops me somewhere in the middle of the list, on a different component
   from the one the menu's first entry points at."

3. "One of the **Beta** tags has disappeared from the menu. There used to be
   three of them marking the components that are not finished yet, and now I can
   only find two. I use those tags to decide what is safe to put in front of a
   client, so please do not just drop them."

4. "The sun/moon icon in the top bar has stopped working. I click it and
   absolutely nothing happens - the page stays light, the icon stays a sun, the
   GitHub icon does not change either. Clicking it a second and a third time is
   the same. It used to flip the whole site to the dark theme and back."

5. "On the six-box password entry component, typing straight through does not
   work any more. I type a digit and the cursor moves on for the first few
   boxes, then it stops moving and every further digit lands in the same box,
   overwriting what is there. The last box never gets anything, so I can never
   submit a full six digits by typing."

6. "The **Regenerate** button on the password generator page is not regenerating
   anything. I press it and the number on the page is exactly the number that
   was already there. I pressed it five times in a row to be sure. It is still a
   perfectly good-looking six-digit number each time, which is why it took me a
   while to notice it never changes."

7. "On the drag-and-drop board, the little **×** on a card deletes the wrong
   card. I clicked the **×** on the second card and the first card vanished
   instead, leaving the one I had meant to remove still on the board. It is not
   a dragging problem - I am not dragging anything, just clicking the delete
   button on the card I want gone."

8. "None of the copy buttons under the code snippets confirm anything. On the
   installation page and on every component page I click the little button in
   the corner of a code block and there is no feedback at all - no tick, no
   change in what a screen reader would read out, nothing. Is the copy handler
   even wired up? It feels unfinished."

9. "When I open the site the icon in the top bar is a sun and the page is light,
   even though my laptop is in dark mode and every other site I use follows it.
   Should the site not pick up my system preference when it loads, rather than
   always starting light and waiting for me to click?"

Work in the source tree, repair the root cause of each real defect, and leave
the intended behaviour alone: the nine component pages and the live components
inside their Preview boxes, the menu and its three Beta tags, the theme switch
and everything it restyles, the copy buttons and the highlighted code blocks
they sit on, the contributor portraits, the landing page, the installation
steps, the 404 page, and the offline, dependency-complete way the site builds.
When you are done the tree must still build with the project's own build script,
must still serve every one of its routes, and must still make no request to any
host other than the one serving it.
