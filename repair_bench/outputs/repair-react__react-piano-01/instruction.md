# Repair Task - react-piano (React)

You are working on the source code of **react-piano v3.1.3**: a small
React component library that renders a playable piano keyboard, together
with the single-page demo site that ships with it and that is what QA
actually clicked through. The workspace holds both halves: the library
sources live at the top level of the repository, and the demo site lives
in the `demo/` folder. The demo page shows a dark header with the project
name and a tagline, then a wide playable keyboard you can drive with the
mouse, with touch, or by typing the letters that are printed on the keys;
below it a row of three dropdowns ("First note", "Last note",
"Instrument") plus a hint that the left and right arrow keys slide the
printed letter mapping up and down the keyboard. Under a divider sits a
second, non-playable keyboard with a "Start" button that walks a short
bundled tune step by step and lights the keys as it goes, and below that
an installation blurb and a yellow footer credit line.

The project is fully offline. Building is a two-step process that the
verifier runs for you: the library is compiled first, its compiled output
is copied over the vendored copy the demo keeps inside its own dependency
folder, and then the demo page is compiled (Create React App tooling,
output in `demo/build/`, served from that directory as the site root).
Edit whichever half of the source the evidence points at - a symptom
visible on the demo page can have its root cause in the library half.

A few things about this build are environmental and are not defects:

- The demo cannot make any audible sound. The original audio sample sets
  were fetched from a public CDN that is unreachable here, so they were
  replaced with local **silent** sample sets. Everything else about the
  audio path still works: keys light up, the loading gate opens, the
  playback demo advances. Silence itself is expected and must not be
  "fixed".
- Only the two sample sets that the two keyboards actually use are
  bundled locally. The instrument dropdown still lists the full catalogue,
  but picking any other entry cannot fetch samples offline, so the
  playable keyboard drops back into its greyed-out loading state (no
  letters, keys not clickable) until an instrument with bundled samples
  is selected again. That is the offline environment, not a defect.
- External links never open: the GitHub docs buttons in the header and in
  the installation blurb, and the author link in the footer, all point at
  the internet and simply hang. The page stylesheet is served from a local
  copy.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "On the playable keyboard, when I press a key with the mouse and let
   go, the key stays lit. It never goes dark again on its own - I have to
   reload the page. Click around for a while and the last key you touched
   is always the one stuck highlighted."

2. "The letters printed on the keys look scrambled to me. They are not in
   alphabetical order at all, and the narrow black keys carry letters from
   the row above the home row (q, w, e ...) while the wide white keys
   carry the home row letters (a, s, d ...). Looks like somebody mixed two
   layouts together. Shouldn't the letters just run in order?"

3. "Typing on my computer keyboard does nothing. The page literally
   invites you to play with the keyboard and even prints letters on the
   keys, but pressing those letters never lights a single key up. Clicking
   with the mouse still works, so the page is not frozen - it is only the
   typing that is dead."

4. "The instrument dropdown below the keyboard used to offer a long
   catalogue of instruments to choose from. In this build it contains
   exactly one entry, so there is nothing to choose. The dropdown still
   works, it is just empty of choices."

5. "Notes fire when I am not pressing anything. Sweeping the mouse pointer
   across the keyboard - button up, just moving - lights the keys one after
   another as the pointer passes over them. It used to do that only while I
   held the mouse button down and deliberately dragged across the keys."

6. "The 'First note' dropdown does the wrong end of the keyboard. When I
   pick a higher value in it, the bottom of the range stays where it was
   and the TOP of the range moves down instead, so the keyboard shrinks
   and loses its high keys. The 'Last note' dropdown next to it behaves
   correctly."

7. "There is no sound whatsoever. Pressing keys lights them up and the
   playback demo visibly runs, but nothing is audible at all, from either
   keyboard. I think the audio output is broken."

8. "The keyboards are one key short. They are supposed to run from the low
   C up to a high F, and that topmost F key is simply not rendered - the
   keyboard stops on the note before it. Both keyboards on the page are
   affected, and the printed letter mapping runs out one key early too."

9. "Two neighbouring keys are printed with the exact same letter. The
   narrow black key between the first two white keys carries the very same
   letter as the white key right next to it, so you cannot tell them apart
   any more - and one letter obviously can only ever reach one of them."
