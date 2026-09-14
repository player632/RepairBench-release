# Repair task: a one-page personal portfolio site

## The page you are repairing

One static page: a personal portfolio site for a single developer. There is no build step, no
framework and no dependency directory anywhere in the tree - the browser loads the entry
document and the page's own scripts and stylesheets straight off the disk, and everything a
visitor sees is produced by those files. Nothing is fetched at runtime.

Top to bottom, the page carries:

- a fixed header with a wordmark, a dark/light theme control, and - at phone width - a menu
  control that slides a panel up from the bottom edge of the screen. That panel lists six
  entries (home, about, skills, services, portfolio, contact), each with a small pictogram and
  a label, and it has its own close control in its corner.
- a first screen with a large headline whose tail types itself out, a short paragraph, a button
  that leads down to the contact section, and an affordance that leads to the introduction.
- an introduction section with a portrait, a paragraph and three statistics.
- a skills section with three collapsible panels (front end, back end, design). Each has a header
  you can tap and a list of rows; each row is a named skill with a published percentage and a bar.
- a certificates strip that scrolls sideways, carrying two downloadable documents.
- a services section with three cards. Each card has a "view more" affordance that brings up a
  full-screen detail panel with its own title, its own bullet list and its own close control.
- a second sideways strip with three portfolio items, then a project banner, then a client-quote
  strip with four quotes - each a name, a role, a photograph and a pagination control.
- a contact section with two contact cards and a form of four labelled fields plus a submit control.
- a footer with a wordmark, three links, three social links and a credit line.
- a back-to-top control that is meant to appear in the corner of the screen once the page has
  been scrolled far enough down.

The page is examined at a phone-sized window, 390 by 844, because the sliding menu panel only
exists at phone width. It is a long page and it scrolls smoothly, so anything that depends on a
scroll position takes a moment to arrive.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are starting points, not
diagnoses: they are not always precise, they do not always say which of several similar things is
affected, and they do not always agree with each other.

1. On my phone I open the menu, tap the entry I want, and the page does jump to that section - but the menu panel stays up over the screen and I have to get rid of it before I can read anything. It used to close itself as soon as I picked an entry.

2. The skills panels will not open. I tap the collapsed one - the backend list, or the designer one - and nothing comes down; the rows stay hidden. And if I tap the panel that is already open, it closes and I cannot get it back.

3. In the services section all three "view more" affordances bring up the same panel - the design one, with the four design bullets. The other two services have no panel of their own any more, whatever I tap.

4. Once a service panel is up I cannot get rid of it. I tap the little cross in its corner and the dimmed overlay just stays there covering the whole page; I have to reload to see the site again. It does not matter which of the three I opened.

5. The client quotes at the bottom look half finished. The little round photographs are all the same plain grey figure instead of faces, there seem to be more slides than there are clients, and under the heading there is a leftover line that reads "Slide here to see next>>>" with a class name that says error. It looks like somebody abandoned this strip halfway through.

6. The dark choice does not stick. I switch the site to dark, and it looks right while I am there, but the next time I open the page it is light again and I have to switch it once more. It remembers nothing between visits.

7. The little back-to-top control never shows up. I scroll well past the first screen and the corner stays empty, so on a long page I have to scroll all the way back up by hand.

8. The big headline on the first screen will not sit still. The words after "Hi, I'm Mrinmoy" keep typing themselves out, deleting themselves and typing the next one, round and round forever - a Web Developer, an OS developer, a student, a UI Designer. It never settles on one, which looks like something is stuck in a loop.

9. The menu lists the sections in the wrong order. Skills and services have changed places, so the menu no longer matches the order the sections actually come in on the page and I keep tapping the wrong one.

## Not every defect is described in these reports

Some of the faults on this page are not mentioned by any report at all, and - just as importantly -
not everything above is a fault. You are expected to read the page and work out what is actually
wrong rather than to work down the list: repairing only the reported items will not finish this
task, and "repairing" something that was never broken will cost you.

## What is NOT a fault - leave these exactly as they ship

Every line below is the page's own intended behaviour, or an honest consequence of running it with
no network. None of them is a defect, none of them is mentioned in the reports as something to fix,
and each of them is checked:

1. Two horizontal strips share one container class and the carousel library is started on that class, so it takes BOTH of them: the certificate strip and the portfolio strip below it each get their own instance and each run in loop mode. That is how the page ships; it is not one of the reported faults and it must be left exactly as it is.

2. The menu entry that leads to the skills section carries a list-item class spelled one underscore short of its five siblings. It has no effect on anything and it is not a reported fault: leave the spelling alone.

3. The client-quote carousel is configured with a responsive breakpoint whose slides-per-view key is misspelled, so that breakpoint does nothing and the strip shows one quote at a time at every width. Leave it as it ships.

4. The client-quote carousel runs in loop mode, so it clones slides: the number of slide elements in the document is larger than the number of quotes. That is the library doing its job, not a duplication fault.

5. The four client photographs that the page asks for are not in the shipped snapshot at all; the offline face points all four at one neutral in-tree placeholder. The artwork is deliberately plain and is not a reported fault.

6. The scroll-reveal library is configured with a long duration and a large offset, so revealed blocks fade in slowly and only once they are well into the viewport. Slow reveals are the shipped configuration.

7. The document scrolls smoothly: asking the page for a position animates to it instead of jumping. Anything that reads a scroll-driven state has to let the animation finish first.

8. The multi-line message field carries two name attributes in the markup and the browser keeps the last one. It looks wrong and it is harmless: leave it as it ships.

9. The contact form is addressed to a third-party form endpoint. Nothing is ever sent: no reported fault, no check and no repair requires the form to be submitted, and the task runs with no network at all.

10. The scroll pass that marks the current menu entry assigns its loop variable without declaring it, so the page carries one stray global of its own from the first scroll onwards. That stray global is the page own, it is not residue from a repair, and it must not be "cleaned up" as part of any fix.

11. The remote icon font and the remote web font are not available offline and are dropped by the adaptation: the small pictograms keep their box but have no glyph artwork, and the text falls back to the local sans-serif stack that the page already declares. Neither is a reported fault and no glyph or font file is expected to reappear.

12. The back-to-top control is wrapped in a plain unclassed container element and the control itself is the link. The wrapper is markup noise, not a fault.

13. The off-canvas menu panel is declared to the scroll-reveal library with a fade, and the library never runs that fade on a fixed-position sheet it cannot scroll into view, so the panel computes to fully transparent even when it is open and sitting on-canvas. Its six entries are still in the document and still reachable. That is how the page ships; it is not one of the reported faults and it must be left exactly as it is.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry no
  behaviour; they are how the page is addressed while it is being examined, and they must survive
  your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it needs is already inside
  the tree. Do not add a remote reference, do not assume anything can be downloaded, and do not
  reintroduce a font, an icon set or a library from outside.
- Repair the behaviour a visitor experiences. Do not special-case the examination, do not add flags or
  hidden state, do not write anything into the browser's storage that the page does not already
  write, and do not leave anything on the page's global scope that was not there before.
- Do not delete shipped content, sections, controls, copy or artwork to make a symptom go away, and do
  not reorder or rebuild a region unless the report you are answering is about that region's order.
- Keep every change inside this page's own files. Nothing outside the page may change.
