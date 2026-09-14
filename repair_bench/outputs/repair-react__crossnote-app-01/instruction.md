# Repair Task - Crossnote (a markdown notebook that runs entirely in the browser)

You are working on the source code of **Crossnote**, a note-taking app written in
TypeScript with React 17 and Material-UI v4, bundled by Vite. It is a
single-page app with no backend and no account: the notebook lives in the
browser's own storage volume, every note is a markdown file in that volume, and
nothing is ever uploaded anywhere. The whole app is served from one document at
the site root.

What is on screen. A permanent sidebar on the left holds a tree with the single
local notebook (called Drafts) and, once you expand it, entries for today's
note, a graph view and the full list of notes; below the tree is a *quick
access* section listing the notes you have marked as favourites, each with a
small count of how many other notes link to it, and at the very bottom a
settings entry. Everything to the right of the sidebar is a tabbed workspace:
you can have the notes list, several open notes, the graph and the settings page
open side by side as tabs, drag them into splits, and the arrangement is
remembered between visits.

The notes list itself has a search box, a button that creates a new note, a
button that opens a sort menu (by title, by creation time or by modification
time, ascending or descending), and a small chip that announces how many notes
are in the list. Under that is the list of note cards. Each card shows an icon,
the note's title, its path, how long ago it changed, a one-line summary taken
from the note's own text, a pin marker if the note is pinned, and a `...`
button. Pinned notes are supposed to sit at the top of the list. The `...`
button opens a menu with pin/unpin, add or remove from quick access, edit the
note's aliases, change its path, split the workspace horizontally or vertically,
share, print, check out and delete. The alias editor is a small popover with a
text box - type a name and press Enter to add it - and, under it, the note's
existing aliases each with their own remove control.

Opening a note gives you a note tab with the title at the top, three buttons
that switch the editor between the rendered preview, the plain source and a
combined view, and - in the two modes that show the plain source - a small
readout of the cursor's line and column. The settings page carries the
interface language, the theme, the default editor mode, the keyboard layout,
the author name and email that go into a note's front matter, and a line
recording which build you are looking at. The graph view draws the notebook and
its notes as a force-directed graph and captions it with how many nodes and
links it drew. The very first time the app is opened in a browser profile it
puts up a modal window asking you to choose one of four interface languages;
after you choose, it does not come back.

The project lives in this workspace and is fully offline. Dependencies are
supplied as an already-installed tree, the production build is written to
`dist/` and served as the site root, and the build writes nothing back into
the source tree. Because the machine has no network access, a few things are
degraded on purpose and are **not** defects: the build step no longer runs the
project's little emoji-picture downloader, so emoji are rendered from what is
already in the repository; the first-boot notebook is filled from a small
bundled set of sample notes written into the local volume instead of the
upstream behaviour of cloning a welcome notebook from a public code-hosting
site; the build line shown on the settings page is a fixed string rather than a
value read out of a git checkout at build time; and the project's own unit-test
files and test-runner scripts are gone, so there is nothing to run and no test
to consult.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different module than
  the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "The search box above my list of notes has stopped working. I click into it, I type a word - the word shows up in the box as I type, so the box itself is fine - and the list underneath just keeps showing every single note. I sat and watched it once for about half a minute out of pure stubbornness and it never filtered. It used to narrow down roughly half a second after I stopped typing, which was fine by me. Clearing the box still brings everything back, so it is not stuck on an empty result either."

2. "The order of my note list is wrong. I keep exactly one note pinned so that it sits at the top and I can find it instantly - it has been at the top for months. Now it is at the very BOTTOM, below all six of the others, and the six that are not pinned come first in their usual order. Nothing is missing, all seven are still there, and the little pin marker is still on the same note. It is purely the ordering."

3. "My author name does not stick. On the settings page there is a box for the name that goes into a note's front matter; I type my name into it and it appears in the box straight away, so I assume it saved. Then I reload the page and the box says Anonymous again. Every single time. The email box next to it behaves the same way as far as I can tell, and the theme and the keyboard-layout choices on that same page do survive a reload, so it is not the whole page."

4. "The new-note button has lost the behaviour I depend on. My habit is one note per day for my log, and the app used to help me: if I did not already have a note for today, the one it created was named with today's date, ready to go. I checked this morning before making anything else and I definitely had no note for today, and the note it created came out with a generic placeholder name instead. It does not matter how many I make, none of them get the date name now."

5. "The little alias editor you open from a note's ... menu does not update itself. I type a shortcut name into its box, press Enter, and the list under the box stays exactly as it was - my new name is not in it. Same in reverse: I click the remove control on one of the existing names and it stays on the list. Here is the part that convinces me it did save: if I close that popover and open it again, or reload the page, the change IS there. So the write works and the little list on screen just never refreshes. It does this in both directions, adding and removing."

6. "Something is wrong with the language window that appears the very first time you open the app. I chose Japanese and it did nothing at all - the window closed as if I had chosen, but everything on screen stayed in English. I made sure it was not the window itself: I cleared my browser data so the window came back and chose English, and English worked. I tried Japanese a second time after clearing again and it refused a second time. The other two choices in that window I have not tried, I only care about Japanese."

7. "I set my default editor mode to source code on the settings page. I know it saved, because that same settings page still says source code afterwards and still says source code after a reload. But it makes no difference to anything: every time I open a note it comes up in the rendered preview, and I have to click the source button to get the plain text with the line and column readout I actually want. It used to open the way I had asked. The three mode buttons themselves all still work fine once the note is open, it is only the opening that ignores me."

8. "Two things about the first time you open this app, and I cannot tell if either is a fault. A window pops up in the middle asking me to choose a language, and until I choose, NOTHING behind it responds - I tried clicking the sidebar and the list and the clicks just do not land, it is like the whole app is locked. And it only ever happens once: after I pick a language, reloading the page does not bring it back, even if I pick a different one. Is the app hanging on start, or is that window supposed to swallow my clicks?"

9. "The graph view is miscounting, or I am misreading it. I have seven notes - the list says seven, and I counted them - but the graph view's little caption at the bottom says there are eight nodes. One too many. And when I created an extra note today it went to nine nodes for eight notes, so the gap does not close. Something is being double counted in there, surely?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself during
  the session; a separate verifier rebuilds and drives the app. Focus on
  reading the code and fixing root causes.
- Fix the underlying cause of each defect. Do not special-case the sample
  corpus, the observed strings, or the verification probes: the checker drives
  the real application through a real browser and reads what the application
  itself renders and stores.
- Leave the rest of the application behaving as it does now. In particular the
  first-run language window, the graph's node-and-link caption, the way the
  sidebar tree is rendered twice for narrow and wide screens, and the way note
  menus stay mounted for every card are all intended behaviour and are checked.
