# Repair Task - synced-lyrics-editor-webapp-v2 (Vue 3 + TypeScript synced-lyrics editor)

You are working on the source code of **Synced Lyrics Editor and Maker v2**, a
browser application written in Vue 3 with TypeScript and bundled by Vite. It
makes timed ("synced") lyrics for a music file: you bring in a track, type or
import the words, stamp each line with the moment it is sung, and export the
result as an LRC document. The tree is an ordinary Vite project - a package
manifest, a directory of single-file components, a build that emits a static
bundle - and the harness installs the dependencies from an offline supply, runs
that build, and serves the built output over plain HTTP from this origin.

The app reads as a four-destination workspace under a top bar. The bar carries
the name of the app, the four destinations **Home**, **Edit**, **Timing** and
**Lyric**, a **Settings** entry and a language chip that arrives showing **EN**.
Home is the landing screen: a heading, the sentence "Create your own synced
lyrics for the music you love right from your browser. A sound file is
required", and the two ways in - **Get Started** / **Upload Music** for a sound
file and **Upload LRC** for an existing lyrics document. Edit is where the words
themselves are written, line by line, with Add, Delete, Edit, Save and Cancel
controls. Timing is where each line is stamped: the list of lines with their
times, a **Set now** control that stamps the focused line with the current
playback position, **Play from focused**, and a tip that reads "Press {1} to add
a new line". Lyric is the read-back of the finished document, with **Export**,
**Download**, **View source** and **Sync tags**. A player sits alongside all of
it - Play, Pause, Stop, Forward, Backward and Repeat, with an Artist and a Title
slot that read "No audio" and "No artist" until a file is loaded.

Everything those screens show comes out of one shared in-memory lyrics document
that the app holds for you: a small set of metadata fields (the usual LRC header
- artist, title, album and friends) plus an ordered list of lines, each line
being a text string and a time in milliseconds. A line that has no time is kept
too, carrying a sentinel time that marks it as untimed. One converter owns the
whole relationship between that document and its textual form: it takes an
imported document apart into fields and lines, and it puts them back together
again on export. It also owns the little arithmetic around times - turning a
bracketed clock reading into milliseconds and back, and answering "which line is
playing at moment T". Most of the reports below are that converter misbehaving
through one screen or another.

Environment notes - properties of this offline harness, not defects:

- There **is** a build step here, and the harness runs it for you. The
  dependencies arrive from an offline supply and are already resolved; do not
  add a dependency, do not add a network fetch, and do not switch the project to
  a different bundler or framework. Repair the code in place.
- The manifest's build entry has been pinned to the bundler step alone for this
  harness. That is harness furniture, not a defect, and there is nothing for you
  to restore. A repair that does not compile still fails the build, so the code
  you leave behind has to be real.
- There is no network access. The two web-font stylesheets the upstream page
  linked have already been taken out for you, so the interface falls back to
  system fonts and text metrics may differ slightly from any screenshot you have
  seen; that removal is harness furniture, not a defect, and no report is asking
  you to put a font back.
- The interface's icon set is fetched at runtime from a remote icon service
  (which itself has a second, fallback host). Offline, no icon graphics arrive at
  all, so the icon slots render empty. That is a property of this harness and not
  a defect - nothing you can do in this tree will make those icons appear, and no
  report about icons is asking you to add any.
- One unresolved build-time placeholder in the page template has been removed,
  because it reached the built page as a literal token and showed up as visible
  body text. Also harness furniture, also not a defect.
- The harness drives the app in a real browser at a **1440x1000 viewport**, so
  the top bar, the landing screen and the player are all on screen at once.
- Every checkpoint starts from a freshly loaded app in a fresh browser context,
  so nothing - not a document, not a language choice, not any storage - carries
  over from one checkpoint into the next.
- The app keeps no lyrics document of its own anywhere: there is no save path
  that survives a reload, the browser-side store the app opens stays empty, and
  that is how the seed is meant to behave.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and a single reported symptom can have more than
  one root cause behind it.
- At least one report describes behavior that is actually intended, or that is a
  property of this offline harness rather than of the code; verify a report
  before changing anything because of it.
- Not every defect is described in these reports. Some of them nobody wrote in
  yet, and at least one of them is hiding behind another: a broken behavior you
  cannot currently reach, because a different defect stops you reaching it, still
  counts against you once it is reachable. Two of them sit on the two halves of
  the very same operation, so one report can be describing both at once, and
  mending only one half will leave the behavior just as broken as it was. Check
  the neighbouring behavior of anything you touch, and re-check the import, the
  export and the timing paths after you repair them rather than assuming they
  were fine.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "I bring in a lyrics file that has the usual header at the top - the artist,
   the title, the album - and afterwards the app has them the wrong way round.
   The artist slot is showing my song title and the title slot is showing the
   artist's name, and the album ends up somewhere else again. The words
   themselves come through fine, it is only the header fields that are backwards.
   Re-exporting gives me a file with the same fields swapped, so it is not just
   the display."

2. "Some of my files write the clock with two digits after the dot, like
   [00:12.75]. Those files come in completely empty - not one line survives, and
   the app acts as if I had loaded nothing but a couple of stray header fields.
   A file that writes three digits after the dot, [00:12.750], comes in
   perfectly. Same document, same words, only the number of digits differs, and
   only the two-digit one dies."

3. "My documents have a few plain lines with no clock on them at all - an intro
   credit, a translator's note, a line I have not timed yet. When I bring such a
   file in, those lines are simply not there afterwards. Every line that does
   carry a time arrives, so it is specifically the untimed ones that get thrown
   away, and they are gone from the export too."

4. "The file it gives me on export has the words glued straight onto the closing
   bracket - [00:12.75]Hello instead of [00:12.75] Hello. Every timed line, every
   time. It reads badly in other players and it looks like a formatting mistake
   on my part when I paste it into a forum. The untimed lines and the header
   fields look normal, it is only the join between the clock and the words."

5. "I focus a line and use the control that adds a new line after it. The new
   line turns up ABOVE the line I was focused on, not below it - so my new verse
   lands in the middle of the previous one. Adding a line at the very end of the
   document still behaves, and the line I was focused on keeps its own text and
   time, so nothing is being overwritten; the new line is just on the wrong side
   of it."

6. "Nothing I change on an existing line takes. I rewrite the words of a line and
   confirm, and the line reads back exactly what it said before. I try moving its
   time instead - same thing, the old time comes back. Adding brand new lines
   works and deleting works, so it is only editing a line that already exists
   that goes nowhere. It is as if my change is applied and then immediately
   overwritten by the line's own previous contents."

7. "After I delete a line the document gets shorter, which is right, but the
   timing side of the app has not heard about it. The list of times it works from
   still has the old entry in it, so the line that is supposed to be current
   during playback is the wrong one from that point on, and it stays wrong until
   I do something that forces the whole document to be rebuilt. Delete two lines
   in a row and it is two out."

8. "Every time I reload the page my lyrics are gone. There is no save button
   anywhere that I can find and nothing ever comes back, so I assumed saving was
   broken. Is there a save in this thing that has stopped working, or was there
   never one?"

9. "This may be nothing, and it may just be my machine: all the little pictures in
   the interface are blank - the buttons are there and they work, but the icons
   on them are empty boxes - and the text does not look like the font in the
   screenshots I saw. Did the theme fail to load?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the four destinations and the language chip in the top bar, the player
and its "No audio" / "No artist" placeholders, the fact that a document whose
lines all carry three-digit clocks imports and exports unchanged, the fact that
the header fields are written back above the lyric lines on export in the order
they were read, the fact that an empty document exports as an empty string and
still reports no fields and no lines, the fact that a line with no time is
written back as bare text with no bracket around it, the fact that a time which
is not a real moment at all still serialises to an empty string rather than to a
negative clock, the fact that asking which line is playing before the first
line's time answers "no line", the fact that a line genuinely added before a
given line lands above it, the fact that removing the last line leaves the
document one shorter and that line no longer findable, the fact that the
document's own line identifiers stay unique and stay in step with the list the
timing side reads, and the fact that the app persists nothing between loads -
none of which any report asks you to change. The project must still install from
its offline supply, still build, and still boot to the landing screen exactly as
it does now when you are done: no new dependency, no network access, no
re-plumbing of the harness.
