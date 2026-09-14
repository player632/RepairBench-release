# Repair Task - holodevdao (SolidJS + TypeScript)

You are working on the source code of **holodevdao**, a small single-page viewer
for Developer DAO membership tokens, built with SolidJS, TypeScript and vite and
styled with tailwind. There is no backend and no wallet to connect: you ask for a
Dev by its number and the page shows you that Dev's ticket.

The page reads top to bottom. A title block spells out "Developer DAO" with the
word "holographic" picked out in the middle, then a short paragraph explains what
the site is and a one-line hint invites you to look a Dev up by number. Under it
sits the lookup form: a number field and a button that reads "Lookup" with a pair
of eyes, and that changes to "Looking up..." with the same eyes while a lookup is
running. Below the form is the ticket itself, which is the heart of the page. It
starts as a loading face - a big animated "D_D" in the middle - and once the data
arrives it flips over, and the flipped ticket carries: a strip at the top with a
barcode and the Dev's number printed under it, a serial in the corner in the form
"3 / 8000", a grid of nine labelled cells (Owner, OS, Language, Text editor,
Location, Industry, Mind, Vibe, Clothing), a small "Dev 3" badge with the line
"Gn Web2. Gm Web3." beneath it, and a holographic sheen that slides across the
card as you move the mouse over it - the whole ticket also tilts slightly towards
the cursor. Under the ticket two share buttons appear, "View on OpenSea" and
"Share on Twitter", and the page ends with a footer of four links: the author's
Twitter, SolidJS, the hosting provider and the source repository.

An address that does not match the page is supposed to show a small "404: Not
Found" screen with its own message and the same footer.

The project builds with vite (output in `dist/`, which is what the verifier
serves from the site root). Dependencies are provisioned offline by the harness.
Nothing is fetched at runtime: the token records live in a small data file that
ships with the app and is served from the same origin.

Environment notes - properties of this offline harness, not defects:

- There is no network access, no blockchain node and no wallet, and nothing in
  this project needs them. Reading a token's attributes, reading who holds it and
  reading what else that holder owns are all answered from the bundled records.
- So that the page's own loading behaviour stays visible and repeatable, those
  three reads each take a small fixed amount of time instead of returning
  instantly. A lookup therefore genuinely passes through a "still loading" phase,
  and the page's own reaction to that phase (the animated face, the caption above
  and below the ticket, whether the field and the button are usable, whether the
  ticket has flipped) is part of the intended behaviour. The lengths of those
  pauses are harness furniture: they are not defects and they are not yours to
  tune.
- The harness drives the app in a real browser at a **1440x900 viewport**, i.e.
  the wide desktop layout, with the ticket shown whole and the share buttons
  underneath it.
- Every checkpoint starts from a fresh browser context, so nothing - not the
  address, not any storage, not anything held in memory by the page - carries
  over from one checkpoint into the next.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different module than
  the one the symptom appears in, and a single reported symptom can have more
  than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is described in these reports. Some of them nobody wrote in
  yet, and one of them is hiding behind another: behaviors you break while
  fixing other things still count against you, so check the neighbouring
  behavior of anything you touch.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "I type another Dev's number into the box and press the button, and the
   address at the top of the browser does change to the number I asked for - so
   the page clearly heard me - but the ticket never moves. It still shows the
   Dev I landed on, same nine cells, same owner, everything. Reloading the page
   on the new address does show the right Dev, so it is only the search itself
   that does nothing. I assume the page is caching the first answer and never
   asking again; can you clear that cache?"

2. "when I open one of the shared links, like the ones people post with a number
   already in the address, the number box is empty. It should show the Dev I am
   looking at, the way the rest of the page does - the ticket, the badge and the
   serial all agree on the number, only the box is blank. If I want to look up
   the next one I have to type it from scratch, and I cannot even tell what I
   was sent."

3. "the top strip of the ticket is supposed to have a barcode on it - I have seen
   screenshots of other people's Devs with a proper barcode and the number under
   it. On mine that strip is empty, every Dev I look at, however long I wait and
   however many times I flip it around with the mouse."

4. "the little caption that sits above and below the ticket is stuck. It says
   'Loading (probably nothing...)' and it never says anything else, even once the
   ticket has fully turned over and all nine cells are filled in. It looks like
   the page forgot to tell that one line that the wait is over."

5. "some of these Devs have never been claimed by anybody - the Owner cell says
   so in as many words - and yet the page still offers me 'View on OpenSea' and
   'Share on Twitter' for them, as if there was something to look at. For a Dev
   that does have an owner both buttons are correct, so it is only the unclaimed
   ones that are being advertised to me."

6. "if I mistype the address, or follow a link to a page that does not exist, I
   get a completely empty white page. No message, no footer, nothing - I have to
   look at the address bar to work out what happened. There is a proper '404:
   Not Found' screen in this site, I have seen it, it just never shows up any
   more."

7. "the serial in the corner of the ticket used to tell you how big the
   collection is, like '3 / 8000'. Now it reads '3 / 3' for Dev 3, and I checked
   a couple of others: it is always the same number twice. Either the whole
   collection is three Devs, which it obviously is not, or the second number is
   reading the wrong thing."

8. "the browser console is absolutely full of warnings every single time the page
   opens - dozens of them, about font files that cannot be found, and they scroll
   past so fast I cannot read them. The text does look right, but surely all of
   that noise means the styling is half broken? Can you clean that up?"

9. "not a bug report exactly, more something I noticed while watching the page:
   every time anything at all changes - a lookup finishes, the mouse moves - the
   tilt effect seems to set itself up again from scratch, and the old one is
   never taken apart. After a while I would expect that to pile up and start
   costing memory. Is that something you should put right while you are in
   there?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the title block, the intro text, the nine-cell grid and its labels, the
Dev badge, the footer and its four links, the share buttons for a Dev that does
have an owner, the holographic sheen and the tilt, none of which any report asks
you to change. The project must still build cleanly when you are done: the
harness builds it with the project's own local vite and serves `dist/`.
