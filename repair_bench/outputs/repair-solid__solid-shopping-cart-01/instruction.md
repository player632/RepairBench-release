# Repair Task - solid-shopping-cart (SolidJS + TypeScript)

You are working on the source code of **solid-shopping-cart**, a small
single-page shop demo built with SolidJS, TypeScript and vite, styled with CSS
modules and localised with a two-dictionary i18n primitive (English and
German). There is no router and no backend: one page, rendered top to bottom.
A dismissible info bar sits above a header that carries the logo, a search
box, a language dropdown, a favourites (heart) button with its own counter and
a cart button with a small orange counter. Under it a hero banner advertises
the winter drop with a "Shop now" button, then comes the product grid - four
articles (three pairs of shoes and one handbag), each card showing a picture,
a name, a price, an "Add to Cart" button that briefly spins while it adds, and
a heart that marks the article as a favourite. A newsletter block follows: a
heading, two radio choices for what the reader is interested in, an email box
with an "Add my Email" button, and a small toast that confirms or rejects the
address, carries a thin progress strip along its bottom edge and can also be
closed by its X. Below that a short list of frequently asked questions folds
open and closed, and the footer ends the page with four page links, five
social icons and a second language dropdown.

Clicking the cart button opens the cart pop-up: one line per article with its
name, the money for that line, a quantity cell like "2X", a minus and a plus
button and a way to drop the line, then a Total Amount row and an Order
button. Clicking the heart button opens the favourites pop-up. Both the cart
and the favourites are kept in the browser's own storage, so they are still
there after a refresh. Categories filter the grid: the wide layout offers them
in the header navigation, and the narrow layout puts them behind a hamburger
button that drops down a menu.

The project builds with vite (output in `dist/`, which is what the verifier
serves from the site root). Dependencies are provisioned offline by the
harness and nothing is fetched at runtime: the four products are read from a
small JSON file that ships with the app and is served from the same origin.

Environment notes - properties of this offline harness, not defects:

- There is no network access, and nothing in this project needs it.
- The harness drives the app in a real browser at a **768x1024 viewport**, i.e.
  the narrow layout: the hamburger button and its drop-down category menu are
  the reachable navigation, the search box sits in its own row, and the second
  language dropdown is the one in the footer.
- Every checkpoint starts from a fresh browser context, so storage left over
  from an earlier interaction never carries into the next one.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different module
  than the one the symptom appears in, and a single reported symptom can have
  more than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.
- Do not remove, rename or repurpose any `data-rb-*` attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "the little orange number on the cart icon counts my lines, not my items:
   two pairs of the same sandals still show 1, and the cart pop-up heading
   says 'Cart (1)' while the Total Amount underneath is clearly the price of
   two"

2. "if I add two of something and then take one back out with the minus
   button, the pop-up shows 1X like it should - but the moment I refresh the
   page it is back to 2X"

3. "the newsletter box rejects my email address. I type a perfectly normal
   address, press Add my Email, and I get a red 'Invalid input' toast. My
   partner typed a random word with no @ in it just to see, and that one
   came back green as 'Email was added'"

4. "the little confirmation toast after subscribing stays on screen for
   something like forty seconds. It used to slide away on its own after
   about four. The progress strip at the bottom does move, just incredibly
   slowly, and clicking its X still dismisses it straight away"

5. "on my phone the hamburger button does nothing at all. I tap it and no
   menu comes down, so I can only ever see Shoes and Bags - there is no way
   to get to Women, Men or Sport any more"

6. "in the cart pop-up the money on each line is wrong: two pairs of sandals
   at 24.99 read '26.99 $' on the line, but the Total Amount at the bottom
   correctly says '49.98 $'. The quantity cell next to it still says 2X"

7. "This is probably me not understanding the demo, but: I put something in
   the cart, open the cart pop-up and press Order, and nothing happens at
   all. The pop-up stays open, my items stay in it, and nothing is written
   anywhere. Is the checkout broken, or is that button just decoration in
   this demo?"

8. "Following on from the wrong line amounts: I checked the Total Amount at
   the bottom of the cart pop-up and it does not match what the lines add up
   to either, so I think the whole cart maths is broken and the total is
   probably computed from the wrong numbers too. Can you make the total
   consistent with the lines?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the info bar, the hero, the search box, the favourites pop-up, the
FAQ list, the footer and both language dropdowns, none of which any report
mentions. The project must still build with the command above when you are
done.
