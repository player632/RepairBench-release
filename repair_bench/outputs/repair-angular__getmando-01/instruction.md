# Repair Task - getMando (Angular 21 + Tailwind 4 self-hosted start page)

You are working on the source code of **getMando**, a small self-hosted start
page / application dashboard written in TypeScript with Angular 21 (standalone
components, signals, the new application builder) and Tailwind 4. Unlike a plain
static page, this tree **does have a real build step**: the verifier installs
nothing from the network, runs the project's own build, and then serves the
built output directory over plain HTTP. Everything the page needs at runtime is
either compiled into the bundle or shipped inside the tree, so the built page
makes **no request to any other origin**.

The page is driven by a single YAML configuration document that the running app
fetches from its own origin, validates against a schema and then projects onto
the screen. That document is what decides the page title and tagline, the
categories, the applications (each with a name, a description, a target address,
an icon, a category and a list of tags), the bookmarks, and a settings block
covering the theme, the clock, the grid density, the card text and the list of
web search engines. A sample of that document ships with the tree and is the one
in force here: four categories, ten applications, one bookmark and four search
engines.

The page reads top to bottom. A header carries the dashboard title and its
tagline, a clock on the right showing the time and - under it - today's date, a
single navigation control that takes you to the configuration editor and back,
and a button that flips the whole page between the dark and the light look.
Under the header sits a row of category chips: an aggregate chip that means
"everything", a chip for your bookmarks, and then one chip per configured
category; the aggregate is the one selected when you arrive. Under that is a
finder row: a text box that narrows the grid as you type, a clear button that
appears only while there is text in it, and next to it a small dropdown that
chooses which web search engine the finder will use when you press Enter. Its
first entry is not an engine at all - it is the local "search my applications"
scope, which is the scope you arrive in. The rest of the window is the
application grid: one frosted-glass tile per entry, each with an icon, a name, a
description and its tag chips, five tiles across at the harness viewport. When
nothing matches, the grid is replaced by a short "no applications found" message. A footer
closes the page with the running version and two documentation links. Activating
a tile is how you launch an application; the configuration editor lives on its
own route and is a lazily loaded part of the bundle.

Environment notes - properties of this offline harness, not defects:

- There **is** a build step. Repair the TypeScript and the templates in place;
  the verifier builds the tree exactly as you leave it and serves the built
  output. Do not add a new dependency, a new build tool or a network fetch, and
  do not check built output into the source tree.
- There is no network access. Two things were arranged for you because of that,
  and both are harness furniture rather than defects, so there is nothing for you
  to restore or to undo:
  - Upstream resolved tile and engine icons against three public icon services.
    Those three lookups now resolve against a folder of small local icon files
    shipped inside the tree, one per icon the configuration asks for. The
    resolution logic itself - the name sanitising, the caching, the fallbacks -
    is untouched seed code and still runs.
  - Launching an application, and pressing Enter in the finder once a web engine
    is chosen, would normally open the target address in a new tab. In this
    harness that intended navigation is **recorded** (address, target and order)
    instead of being performed, and the code that reacts to a successful launch
    still sees a successful launch. So a tile that records the right address is
    working; do not "repair" the absence of a real new tab.
- The harness drives the page in a real browser at a **1440x1000 viewport** with
  an English (US) locale, so the whole page is on screen at once.
- Every check starts from a freshly loaded page in a fresh browser context, so
  nothing - not a category choice, not a query, not any stored preference -
  carries over from one check into the next.
- The page keeps no state of its own beyond the single look (dark/light)
  preference you set with the header button; that one preference is remembered
  between loads and is meant to be. Nothing else is stored, and no query,
  category or tile launch ever leaves a trace in storage or in the address bar.
- The clock's time and date values are read from the machine's own clock, so no
  check depends on what time it is; what matters is the shape and the placement
  of the clock's parts.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and a single reported symptom can have more than
  one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is described in these reports. Some of them nobody wrote in
  yet, and at least one of them is hiding behind another: a broken behavior you
  cannot currently reach, because a different defect stops you reaching it, still
  counts against you once it is reachable. So check the neighbouring behavior of
  anything you touch, and re-check the engine dropdown, the finder's web-search
  path, the aggregate category and the light look after you repair them rather
  than assuming they were fine.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "The little dropdown beside the search box is dead. I click it and no list of
   engines appears - not even a flicker. Keyboarding into it does nothing either.
   The rest of the page looks completely normal, all ten of my tiles are there,
   so I don't think my configuration is broken; I just cannot choose an engine
   any more, and without that the search box never sends me anywhere on the web."

2. "The page opens on the wrong thing. I used to land on the 'everything' view
   with all my applications on it. Now the chip row starts with 'Bookmarks', the
   'everything' chip is not in the row at all, and the page loads showing my one
   single bookmark on an otherwise empty grid. My configuration is untouched -
   all ten applications and all four categories are still listed in it, and the
   other chips are still there."

3. "The photograph behind the whole page has disappeared. The frosted panels are
   sitting on flat black now instead of on the picture, in the dark look, and the
   light look has lost it too. It is not a slow image or a broken image icon -
   there is just nothing behind the panels at all."

4. "If the search box gets focus and I hit the space bar by accident, every tile
   vanishes and I get the 'no applications found' message with the sad little
   paragraph under it - as if I had searched for something that does not exist.
   I did not search for anything; the box only has a space in it. Backspacing the
   space brings all ten tiles straight back."

5. "My tiles are in the wrong order. I list them deliberately in my
   configuration - Plex first, then Jellyfin, then Ombi, and so on - and that is
   the order the page used to show them in. Now the whole grid comes back
   alphabetical, and my one bookmark has been shuffled into the middle of the
   applications instead of sitting at the end where it belongs."

6. "The clock in the header prints today's date twice: once above the time and
   once below it. It used to be a single line under the time. The time itself
   looks right."

7. "I use a screen reader. Every tile on the grid now announces itself as one
   run-together word - 'OpenPlex', 'OpenJellyfin' - instead of two words. It is
   one missing pause, but it makes the whole grid unpleasant to listen to, and it
   happens on every tile, not just one."

8. "The clock only ever shows hours and minutes, never seconds. Is the seconds
   part of the clock broken, or is that how this thing is meant to be? I would
   have expected a dashboard clock to tick."

9. "The page does not remember where I was. I read somewhere that a start page
   keeps your place, but if I am looking at my media tiles and I reload, I am
   back at the beginning with the query box empty, every single time. Only the
   dark/light choice seems to survive a reload. Is the remembering part broken,
   or was it never there?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the ten applications and the order your configuration lists them in,
the single bookmark entry trailing them, the four configured categories plus the
aggregate and bookmark chips, the four-engine roster in the dropdown and its
leading local-scope entry, arriving in the dark look with the photograph behind
the panels, the clock's single date line under an HH:MM time, the finder
narrowing the grid as you type and revealing its clear button only while there
is text, the "no applications found" message when nothing matches, launching a tile and
pressing Enter with an engine chosen, the header control that walks between the
dashboard and the configuration editor, the footer's version chip and its two
links, the local icon set, the fact that the page stores nothing except the look
preference and reaches no other origin - none of which any report asks you to
change. The tree must still build and run exactly as it does now when you are
done: same build command, same output layout, no new dependency, no network
access.
