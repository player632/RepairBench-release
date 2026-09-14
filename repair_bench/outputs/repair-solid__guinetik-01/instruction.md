# Repair Task - a single-page personal portfolio site

You are working on the source of a personal portfolio website: one long page that
presents its owner's featured interactive experiment, a short bio, a row of
coding-activity statistics boards and three galleries (projects, demos, pinned
repositories), plus a footer of outbound links. It is a small reactive front-end
written in JSX-flavoured JavaScript on top of a CSS component kit. There is no
backend and no router: everything the page shows - the text, the links, the
numbers, the twelve experiments it can feature - is read at start-up from one
content file that ships inside the tree.

What that one page shows, in the words a visitor would use:

- a **featured experiment** panel at the very top, carrying a title, a short
  description, a "View Source" link, a button that loads another random
  experiment, and either a static teaser card or the experiment's own embedded
  demo. Twelve experiments live in the content data and one of them is chosen at
  random when the page opens.
- a **colour-mood picker**: five named moods, each of which reskins the whole
  page through the CSS component kit and also re-tints the pictures the page
  builds for the statistics boards and for the repository pins. The picker is
  mounted twice - once in the header and once inside the slide-out side menu -
  so its five moods are ten clickable entries in total.
- a **top navigation bar** with five entries, and a **slide-out side menu** with
  the same five entries in its own order, each label carrying an emoji in front
  of it. Clicking an entry marks that entry as the current one and moves the
  address bar to that section.
- an **About** panel: a portrait, a headline, a sub-headline, a location line,
  nine paragraphs of bio holding nine links, and three counters stating how many
  demos, repositories and projects the site lists.
- a **Code** panel with five statistics boards about the owner's coding activity
  (most-used languages, weekly activity, all-time activity, current streak,
  contributions calendar). Each board is a picture the page builds out of a
  query string, and that query string carries the palette the current mood asks
  for.
- a **Projects** gallery of nine cards, a **Demos** gallery of six cards, and a
  **Repositories** panel with nineteen pin pictures. Every card carries a title,
  a short description and a row of small technology tags.
- a **Footer** with twelve outbound links.

Runtime facts about how this task is verified:

- The tree is compiled from source and the compiled output is what gets served,
  over a local static server, with **no network access**. Dependencies are
  restored from a local archive rather than fetched, so the build has to keep
  working when you are done.
- Every picture, embedded demo and outbound link the page shows has already been
  pointed at a placeholder that lives inside the tree. Nothing may be pointed
  back at a remote host and no request may leave the machine.
- The harness drives the compiled page in a real browser at a **1280x720
  viewport**.
- Every checkpoint starts from a fresh browser context, so a mood you picked, a
  menu entry you clicked or an experiment you shuffled never carries into the
  next checkpoint.
- The galleries below the fold put their content in place a moment after they
  are reached, so a checkpoint that reads one of them scrolls there and waits
  first. That is the shipped behaviour, not a defect.
- Which experiment is featured when the page opens is **random**, and that is
  intended. No checkpoint depends on a particular experiment being chosen: the
  ones that care compare the panel before and after an explicit click, and the
  page re-rolls until it lands on a different one.
- The page's own visit-tracking helper only ever talks to a tracker object this
  build does not load, so it stays silent. That is intended, and nothing depends
  on it.

Two known quirks of the shipped tree are **not** defects and are not asked
about: the mood picker really is mounted twice (ten entries for five moods), and
the statistics boards really are pictures built from query strings rather than
live API calls. Leave both alone.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different part of the
  page than the place the symptom shows up, and a single reported symptom can
  have more than one root cause behind it.
- At least one report describes behaviour that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviours you break
  while fixing other things still count against you.
  并非所有缺陷都有报告提及；修别的问题时弄坏的行为同样会扣分。
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "The colour moods stopped working. I open the picker, choose a different
   mood, and the page stays exactly as it was - same background, same accents,
   nothing moves. The picker itself seems to accept the choice and shows the
   mood I picked as the current one, but the site never actually wears it."

2. "The five statistics boards in the coding panel never change palette. Whichever
   mood the page is wearing, those boards keep their default dark colours: three
   of them should switch to the mood's own light palette, one should get a white
   background and one should fall back to the plain palette. I compared against
   an older screenshot of the same panel - the boards used to follow the mood."

3. "The counters on the About panel do not match the site. It says there are 9
   demos, but the demos gallery has 6 cards in it - and 9 is exactly how many
   projects there are, so the demos number looks like it is reading the projects
   pile. The other two counters (19 repositories, 9 projects) are correct."

4. "The 'load another random experiment' button on the featured panel is dead.
   Clicking it does nothing at all: the title never changes, the picture never
   changes, no new experiment ever appears. It used to swap in a different one of
   the twelve on every click."

5. "The featured experiment never shows the live demo. The panel is supposed to
   open on the static teaser card and then, a moment after the page settles,
   replace that teaser with the experiment's own embedded demo. In this build
   the teaser stays there forever - no embed ever appears, however long I wait."

6. "The small technology tags on the gallery cards are broken. They render as
   empty pills with no text inside them, and they are no longer clickable: the
   link behind each tag is gone. Each pill should show its technology's name and
   should still lead out to that technology's page through the local stand-in
   this offline build uses."

7. "The slide-out side menu has lost its own ordering and its icons. It should
   list the five sections in the menu's own order with an emoji in front of each
   label, but it now shows the top bar's order and the plain labels with no emoji
   at all. Same five entries, wrong list."

8. "Half the pictures on this site are missing. The About panel is full of
   identical grey placeholder boxes where pictures should be, and the portrait
   next to the bio is not a photo either. Is the image handling broken? Can we
   get the real pictures back?"

9. "Every link in the footer opens a blank page. All twelve of them, no
   exceptions. That cannot be right - they name profiles and posts, so they
   should go somewhere."

Reports 8 and 9 describe the offline build working as designed, not defects: in
a tree that is verified with no network access, every remote picture and every
outbound link is deliberately routed to a placeholder that lives inside the
tree, so a grey box and a blank stand-in page are exactly what a visitor with no
network should see. Restoring the real remote targets would break the offline
contract this task is verified under; deleting the placeholders would remove
content the page is supposed to carry. Leave both alone.

Work in the source tree, repair the root cause of each real defect, and leave
the intended behaviour alone - the offline placeholders and stand-in links, the
two copies of the mood picker, the random experiment the page opens on, the
lazily filled galleries, the silent visit tracker, and the build-from-source
pipeline. The tree must still compile with its own local toolchain and serve the
same single page when you are done.
