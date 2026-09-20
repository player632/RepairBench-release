# Repair Task - Minimal Notes (three vanilla Vue 2 note pages over one shared browser slot)

You are working on the source code of **Minimal Notes**, a deliberately small note
taking app. There is no package manifest, no dependency install, no bundler, no
transpiler and no build step of any kind: the tree you are given is the tree that
runs. The harness serves it over plain HTTP from its own root directory, and the
pages under test sit at that root.

What is unusual about this tree is that it is not one application but **three
independent ones**, each a single self-contained page that carries its own markup,
its own styling and its own inline Vue 2 instance written against an in-DOM
template. They are:

- **the main page** - a heading, a multi-line composer, a Submit button, and a
  column of note cards. Each card has a small close control and a small line for
  the note's timestamp, with the note's own text underneath.
- **the colour page** - the same idea, plus an export control in the header and a
  round colour control. Every note card here has a coloured head bar (carrying the
  close control and the timestamp) above the note's text, and a note takes the
  colour that was selected when it was filed. On this page the composer also has a
  keyboard shortcut: Enter on its own starts a new line inside the note, and the
  modified shortcut files it.
- **the mobile page** - a phone-shaped variant of the main page with the same
  composer, Submit button and note cards, plus one extra thing the other two do
  not have: a statement that runs when the page opens and sizes the app container
  to the height of the browser window before the app itself is built.

The three pages are separate apps but they are **not** separate stores: all three
read and write the same single slot in the browser's own local storage, so a note
filed on one page is what the others find when they next open. That shared slot is
the app's intended design and is worth remembering before you change any key or
any storage area on one page only.

The tree also contains a packaged desktop-app bundle with its own copy of an older
page and its own copy of the framework. Nothing in that bundle is served, nothing
in it is reachable from the pages under test, and it is not part of this task;
repair only the pages at the tree root.

Environment notes - properties of this offline harness, not defects:

- There is **no build step and no dependency install**. Do not add a package
  manifest, a bundler, a transpiler or a framework; the verifier serves the tree
  exactly as you leave it. Repair the code in place.
- There is no network access, and nothing in these pages needs it. The three pages
  used to fetch their framework build and a web font from two remote CDNs; both
  have already been taken out for you. The framework build the pages load now is a
  byte-for-byte copy of the very build this repository already ships inside its
  packaged desktop-app bundle, so the framework the app was written against is
  unchanged, and the font was decorative typography only - no behaviour here reads
  a font metric or a glyph box. Nothing is mocked or substituted. That removal is
  harness furniture, not a defect, and there is nothing for you to restore.
- The harness drives the pages in a real offline browser at a **1280x800
  viewport**.
- Every checkpoint starts from a freshly loaded page in a **fresh browser
  context**, so nothing at all - not a note, not a colour choice, not any storage
  entry - carries over from one checkpoint into the next. Each page therefore
  always opens onto the single starter note it was built with, unless that
  checkpoint itself filed or removed something first.
- The starter note's timestamp is taken from the clock when the page opens, so it
  is never the same value twice. Only its shape is meaningful.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker. Adding behaviour is fine; taking the
  probes away, or special-casing them, is not.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different place than the
  one the symptom appears in, and a single reported symptom can have more than one
  root cause behind it.
- At least one report describes behavior that is actually intended; verify before
  you "repair", because changing an intended behavior counts against you.
- **Not every defect is described in these reports.** Some of them nobody wrote in
  yet, and at least one of them is hiding behind another: a broken behavior you
  cannot currently reach, because a different defect stops you reaching it, still
  counts against you once it is reachable. So check the neighbouring behavior of
  anything you touch, and re-check the other two pages after you repair one - they
  share a store but they do not share code, and a fix that is right on one page can
  be missing on another.
- The reports name pages by what they look like, not by filename. There are three
  pages under test and you have been told what each of them contains.

The reports, in no particular order:

1. "On the main page every note card is inside out. The small line that is
   supposed to tell me when I took the note shows the note's own text instead, and
   the big area underneath shows the date and time. It is like that on every card,
   including the starter one that is already there when I open the page, so it is
   not something I did. The heading at the top is fine, it is just the cards."

2. "The main page remembers nothing. I file three notes, refresh, and I am back to
   the single starter note. I close the starter note, refresh, and it is sitting
   there again. Whatever I do, a refresh puts the page back to how it was when it
   was new. I only use the main page so I have not checked whether the other two
   do it as well."

3. "On the main page, once I have more than one note, closing a note closes the
   wrong one. I click the little cross on the FIRST card and the first card stays
   put while the LAST one vanishes. With only one note on screen it behaves itself,
   which is why it took me a while to notice - it only goes wrong when there is
   something after the card I clicked."

4. "I cannot write a multi-line note on the colour page any more. I press Enter to
   go to a second line and the whole note is filed immediately and the box is wiped
   clean. So every note I write gets cut off at the first line. The Submit button
   still works, that is not the problem - it is that the Enter key on its own now
   does what the keyboard shortcut is supposed to do, and the keyboard shortcut is
   the only way I can file anything from the keyboard at all."

5. "The colour control on the colour page does not stick. I pick a strong red,
   type my note, file it - and the note's head bar comes out in the same yellow as
   the starter note, every single time. And it is not just the notes: after I have
   typed anything into the composer, the little round control itself snaps back to
   showing yellow too, as if it forgot what I chose."

6. "The mobile page is completely dead. Where the heading should be it shows the
   page's own raw template placeholder text on screen, and nothing on the page
   reacts to anything - typing into the box does nothing, the Submit button does
   nothing, the little cross does nothing. The other two pages open normally, so it
   is only this one."

7. "This may be nothing, or it may be how it was always meant to be: on the colour
   page every note I file lands at the BOTTOM of the list, underneath the older
   ones, so the newest note is the one I have to scroll to. I expected the newest
   to appear at the top where I can see it. Is that a defect, or is that just the
   way this app files notes?"

8. "On the main page, if I type something into the box and then refresh without
   filing it, what I typed is gone and the box is empty again. I assumed there was
   some kind of draft saving that had stopped working. Is there supposed to be one,
   or does this app only ever keep notes I actually filed?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the heading, composer, Submit button and starter note each page opens
with; the shape of a note card on each page and the fact that a card keeps its own
timestamp slot and its own close control; the colour page's export control, its
round colour control and the app's own default colour for a note that was filed
without picking one; the colour page's keyboard contract, in which a bare Enter
adds a line and the modified shortcut files the note; the fact that notes are filed
in order, oldest first and newest last; the fact that a colour picked but never
filed is not remembered across a reload; the fact that a draft typed but never
filed is not kept anywhere; the fact that an empty composer files nothing; the fact
that the three pages keep sharing the one slot they already share; and the fact
that these pages run with no network access at all - none of which any report asks
you to change. The tree must still load and run exactly as it does now when you are
done: no build step, no new dependency, no network access.
