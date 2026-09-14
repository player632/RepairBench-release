# Repair Task - minimal-chrome-tab (SolidJS + TypeScript)

You are working on the source code of **minimal-chrome-tab**, a small
single-page application built with SolidJS, TypeScript and vite, and styled
with Panda CSS. It is meant to replace a browser's new-tab page: there is no
router, no backend and no account, and the whole thing is one screen rendered
top to bottom.

At the top of the screen is a block headed by the sentence "We're now
through...". Under that heading sit four rows, one after another, and each row
shows the same idea for a different span of time: a percentage figure, a small
bar chart beside it drawn out of a handful of vertical bars, and a caption that
names the span. The four captions are, in order, "...of day", "...of week",
"...of month" and "...of year". Each percentage is how far the current moment
has progressed through that span, so the day row is a fraction of today, the
week row a fraction of the current week, and so on, and the bar chart beside a
row is a second rendering of the very same fraction - a row of bars that fills
up from left to right as the fraction grows.

Below that block is the clock: one large two-part readout of the current date
and time. It is a single live region announced as a unit, with the date and the
time as its two parts, and it is formatted for the reader's locale.

At the bottom of the screen is a footer carrying two things: a round button
with a gear icon, titled "Open settings", and a credits link reading "Made by
khmm12" that opens in a new tab.

Pressing the gear button opens a modal settings window titled "Settings". It
has a close button in its top corner and a form with three fields and a Save
button:

1. **Theme color mode** - a dropdown of "Auto (follow OS)", "Light" and
   "Dark". In Auto the page follows the operating system's colour scheme.
2. **Milestone progress style** - a dropdown of "Bars compact (default)",
   "Bars detailed" and "Horizontal bar". This chooses how the little chart
   beside each percentage is drawn: a compact row of bars, a denser row of
   bars, or a single horizontal track.
3. **Birth date** - a date field, optional, left empty by default.

The settings window behaves the way a modal is expected to: it can be dismissed
with its corner close button, with the Escape key, or by clicking on the dimmed
area outside the window - and clicking inside the window itself must not dismiss
it. While it is open, keyboard focus belongs to it: focus moves into the window
when it opens and Tab cycles within it rather than escaping to the page behind.
Saving the form writes the settings to the browser's local storage, and a saved
setting is still in force the next time the page loads.

When the page first appears it fades in over a fraction of a second.

The project builds with vite (output in `dist/`, which is what the verifier
serves from the site root). Dependencies are provisioned offline by the
harness, and the app makes no network request of any kind at runtime.

Environment notes - properties of this offline harness, not defects:

- There is no network access, and nothing in this project needs it.
- The harness drives the app in a real browser at a **1440x900 viewport**.
- **The clock is pinned.** This page reads the current date and time, and in
  this environment it always reads the *same* instant: a fixed moment in 2026,
  in the UTC time zone, with the locale fixed to en-US. That is a property of
  the test environment, and it is what makes the percentages and the clock
  readout reproducible at all. It is not a defect and it is not something to
  undo - do not restore a live wall clock, and do not change the time zone or
  the locale the page reads in.
- Every checkpoint starts from a fresh browser context, so state left over from
  an earlier interaction never carries into the next one. A page load starts
  with empty local storage unless a checkpoint has itself saved something.
- The stylesheet is **generated during the build**, not committed: there is no
  hand-written CSS file in the source tree to edit, and the generated directory
  is ignored by version control. Anything you need to change about how the page
  looks is changed in the source, not in the generated output.
- The harness spoofs a desktop user-agent string. This project never branches
  on the user agent, so that has no effect on anything you see here.

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

1. "the four percentages under "We're now through..." have gone absurd. The
   day one reads 5587% and the year one reads 5357% - four figures, all in the
   thousands of percent, all with a % sign on the end like they are meant to be
   there. A percentage of the day can't be more than a hundred. The little bar
   pictures next to them still look roughly right, which is the part that
   confuses me: the number and the picture next to it are telling me two
   different things."

2. "the bars beside each percentage are drawing outside their own box. The
   first few bars of every row shoot up past the top of the little chart and
   get cut off by whatever is above them, so the row looks like it has spikes
   sticking out of it. It used to be a tidy staircase - a handful of
   full-height bars, then one partway, then short stubs for the rest."

3. "the page takes about three seconds to appear now. I open a new tab and
   it sits there faint and washed out, slowly brightening, and only after what
   feels like ages is it properly visible. It used to snap in essentially
   instantly - a blink and it was there."

4. "the settings window has its dismissal completely backwards. If I click
   on the window itself - on the form, on a label, anywhere inside it - the
   window closes on me, and I lose whatever I was in the middle of changing.
   But if I click on the dimmed area OUTSIDE it, which is how I always dismiss
   a popup, nothing happens at all and it stays there. The little close button
   in the corner still works, and so does the Escape key, so it isn't stuck -
   it just reacts to the wrong clicks."

5. "I navigate by keyboard and the settings window doesn't take focus any
   more. When it opens, the focus stays wherever it was on the page behind it,
   and pressing Tab walks me straight through the popup and into the clock page
   underneath instead of cycling inside the window. It used to jump into the
   dialog the moment it opened and keep me in there until I closed it."

6. "the 'of week' figure is wrong, and it is the only one of the four that
   is. Mid-afternoon on a Wednesday it tells me I am just over halfway through
   the week. A week that starts on Monday is not half over on Wednesday
   afternoon - it should be a bit over a third. The day, month and year figures
   all look sane to me, it is only the week one that is out."

7. "I read in the settings that I can put in a birth date, and I expected a
   fifth row to show up in that list - a birthday one, sitting next to the day,
   week, month and year ones. I have never seen it. There are always exactly
   four rows, on every load, whether or not I have been into the settings. Is
   the birthday row broken, or does it only appear once a birth date is
   actually saved?"

8. "Small thing, but: the browser tab for this page is titled just 'New tab'
   and the little icon next to it looks like a plain placeholder rather than
   anything branded. I half expected the app to set its own title and icon once
   it loads. Is the page failing to finish setting up its tab identity, or is
   that literal title the intended one?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the heading block and its four rows, the two-part clock readout, the
footer's gear button and credits link, the settings window's three fields and
its three dismissal paths, the persistence of saved settings across loads and
the quick fade-in on first paint, none of which any single report describes in
full. The project must still build with the command above when you are done.
