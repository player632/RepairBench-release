# Repair Task - portfolio (vanilla HTML / CSS / JS, zero build)

You are working on the source of a **personal portfolio site** for a front-end
developer: a hand-written static site with no framework, no bundler and no
package manager. The home page carries a full-screen header with a scroll hint,
an "about" teaser, a filterable portfolio grid of thirteen project cards (four
buttons sort them into All / Websites / CSS Images / Web Apps), a contact block
and a footer. A slide-out navigation panel sits behind a hamburger button in
the top-right corner and is shared by every page. A separate "about me" page
adds a twelve-card skills grid that reveals itself in stages behind a "Show
more" button, plus three biography blocks that each expand and collapse behind
their own "read more" button. Every project card links to its own case-study
page.

The whole tree is the deliverable: there is nothing to install and nothing to
compile, and the folder you are given is served verbatim as the site root. All
third-party network dependencies have already been taken out of this copy - the
remote web-font links, the analytics snippet and the CDN-hosted helper library
are gone, and the one piece of behaviour that used that library is now written
in plain DOM code - so the site runs completely offline. Do not reintroduce a
network request.

Verification drives a real browser at a 1280x720 viewport over the served pages
and reads the resulting DOM, the inline styles and the computed styles.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the tree. The root cause may sit in a different file, and
  in a different layer, than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is described in these reports. Behaviors you break while
  fixing other things still count against you.

The reports, in no particular order:

1. "The navigation panel slides out when I press the hamburger button, but
   every link inside it is dead - I click Home, About, Portfolio, Contact and
   nothing happens at all. I have to reload the page to get anywhere."

2. "After I close the navigation panel the hamburger button itself vanishes.
   The top-right corner is empty and there is no way to open the panel again
   without reloading."

3. "The Websites filter is losing a card. I count four website projects on the
   page, but the filter only ever brings back three of them - the Livet
   template card never comes back, whichever filter I pick."

4. "Filtering leaves holes. When I switch from All to Web Apps the cards that
   should go away do fade, but the space they occupied stays behind: the grid
   never closes up and I end up scrolling past a lot of blank area."

5. "'Read more' on the about page does the opposite of what it says. I press it
   under the Story block expecting the full text, and the block snaps shorter
   instead - while the button still claims I can now read less."

6. "The navigation panel is already open when the page loads. It covers the
   right-hand strip of the header on every single page, and I have to press the
   cross first to get it out of the way before I can see the content."

7. "Closing the panel is painfully slow. I press the cross, or click away, and
   the panel hangs around for several seconds sliding shut instead of getting
   out of the way."

8. "The scroll hint at the bottom of the header never settles. The little wheel
   inside the mouse outline just keeps looping forever - surely that is meant
   to stop after a while?"

9. "The skills grid on the about page looks broken. Only four cards render and
   underneath them there is a big empty band, as if the rest of the cards had
   failed to load."
