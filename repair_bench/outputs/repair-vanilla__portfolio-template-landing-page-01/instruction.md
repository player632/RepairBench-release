# Repair Task - Crimson personal portfolio landing page (vanilla, zero build)

You are working on the source of **Crimson**, a single page personal
portfolio template. It is a plain static site: one entry document at the
source root, a folder of stylesheets, and a folder of scripts that hold a
hand written controller plus a set of bundled third party plugins
(jQuery 3.6, a filter/layout engine, a lightbox, a carousel, a circular
gauge widget, an animated headline widget, an image glitch effect and a
custom cursor). There is no package manifest, no bundler, no
preprocessor, no TypeScript and no dependency directory anywhere in the
tree - nothing to install and nothing to build. The served face **is**
the source tree, so the file you edit is the file the browser loads.

The page is a six panel one pager: Home, About, Portfolio, Service, News
and Contact. Only one panel is on screen at a time; the top menu (and the
narrow window side menu) swaps panels in place without ever reloading or
changing the address bar. About carries the skill bars, the three
language gauges, the résumé blocks and a testimonial carousel. Portfolio
carries a filter bar and a grid of items, one of which opens a dark
detail overlay. News carries a list of posts with a floating image
preview that follows the hovered row. Contact carries a message form and
a map panel.

The whole site is fully offline in this environment. There is no backend
and no network access: the message form has no server endpoint to post
to, the video and audio items in the portfolio point at external media
that cannot be fetched here, and the map panel has been replaced by an
in-tree placeholder of the same size. None of that is part of what you
are asked to verify, and no checkpoint depends on reaching the network.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the tree. The root cause may sit in a different
  file, and in a different layer, than the place where the symptom shows
  up - a missing visual state is often produced by a script that never
  writes it, and a script that never writes it is often driven by a
  contract in the markup.
- At least one report describes behavior that is actually intended. Verify
  a report before changing anything because of it; "fixing" normal
  behavior counts against you.
- **Not every defect is described in these reports.** Some of the things
  that are wrong with this build are not mentioned anywhere below, and you
  are expected to find them by reading the code and exercising the page.
  Behaviors you break while fixing other things also count against you.

The reports, in no particular order:

1. "Panel switching half works. I click a menu entry, the right panel does
   come up, but it never becomes the panel that is actually in charge -
   everything the template keys off the in-charge panel is missing, and
   the panel keeps behaving like one that is merely on screen."

2. "On a narrow window I tap the hamburger. The icon animates into the
   close cross, but the side menu never slides in. Tapping again just
   flips the icon back. I cannot reach any panel from a phone width
   window."

3. "The three skill bars under Programming are completely empty. The
   printed percentages next to them are right (95, 80, 90) but the bars
   themselves never fill - not even a sliver - on every panel visit."

4. "The three language gauges on the About panel are all wrong. English,
   Russian and Arabic each spin up and then settle on a completely full
   circle reading 100%, whatever the real level is supposed to be. They
   all look identical."

5. "The portfolio detail overlay is empty. I click the item that has a
   detail view, the dark overlay does slide up, but there is nothing
   inside it - no write up, no pictures, no title. Just a blank dark box
   with a close control."

6. "On the News panel, when I move the pointer over a post row the little
   floating image preview that is supposed to come up alongside it never
   appears at all. Nothing follows the row."

7. "The rotating job title under the name is frozen. It shows the first
   word and just stays there forever. On the template demo that slot
   cycles through all three words every couple of seconds."

8. "I read that this template ships a custom magic pointer, but I only
   ever see the ordinary system arrow. The two pointer elements the page
   builds seem to be dead - they never appear and never move."

9. "The dark block that sits behind the top menu does not follow the
   pointer. I move across the menu entries and the block stays where it
   started, behind the first entry. I expected it to slide along."

Ground rules for the fix:

- Repair the source. Do not paper over a symptom with a stylesheet
  override, a timer, a hardcoded value or a special case keyed to a
  probe attribute; the verification drives the real page and reads the
  real document, and it also checks that you left no residue behind
  (storage, address bar, globals).
- Keep the bundled third party plugins working. They are part of the
  delivered page and other panels depend on them.
- The page must still boot to the same six panels, with the same markup
  inventory, after your change.
