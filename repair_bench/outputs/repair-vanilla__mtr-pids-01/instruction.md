# Repair Task - mtr-pids (a zero-build railway platform display simulator)

You are working on the source code of a browser page that imitates the passenger
information screens on a railway platform. It is plain JavaScript with no
framework build, no bundler, no TypeScript step and no dependency directory
anywhere in the tree: the page served from the root of the tree loads three
libraries that the project already keeps inside itself, then loads its own
modules directly, and everything you see is drawn into that one page. There is
nothing to install and nothing to compile - you edit the sources and reload.

What that one page shows, in the words of the staff who use it:

- a **header strip** along the top with a running clock, a place where the
  weather picture and the air temperature would normally sit, and a button that
  opens the settings sheet.
- a **line banner** under the strip, naming the line you are looking at in both
  languages and tinted with that line's own colour.
- an **arrivals board** of up to four rows. Each row is one movement: where the
  train is going, which side of the platform it will use when the operator has
  asked for that column, and how long away it is - either a whole number of
  minutes, the words for "about to arrive", or, in the clock-time mode, the time
  of day the train is due.
- a **promotion frame** that takes over the screen and then hands it back to the
  arrivals on a repeating cycle, exactly as a real platform screen advertises
  between trains. Which promotion is showing, and whether the board or the
  promotion wins, is chosen in the settings sheet.
- a **settings sheet** that opens over the page: where the data comes from,
  which line, which station, which direction, which promotion to show, how the
  board is laid out, how far away the first train of the list may be before the
  board is left blank, whether the platform column and the line banner are
  shown, and which of the two languages the sheet itself uses. Its start button
  remembers all of that in the browser and closes the sheet.

Rules of the display, exactly as the product intends them:

- a movement is only listed while it is real: it needs a destination and a
  number of minutes that is a number, and a movement that is not carrying
  passengers is only worth listing while it is at most a minute away;
- the rows are kept in order of how soon they arrive, soonest first;
- the minutes shown are whole minutes, never more than two digits, and the two
  very closest movements are announced by word rather than by number;
- a platform whose service has already ended for the night contributes nothing;
- the names on the board are written in both languages in the source data and
  the screen alternates between the two halves on its own cycle;
- the distance at which the board is left blank rather than showing a train that
  is too far away to be useful is the operator's own setting.

Runtime facts about how this task is verified:

- The tree is served as it stands, over a local static server, with **no network
  access**. Everything the page needs is carried inside the tree already,
  including the arrival data it reads and the fonts the promotion pages use.
  Nothing may be pointed back at a remote host.
- The data source the page boots into is the product's own offline one, which is
  a supported, user-visible choice in the settings sheet, not something invented
  for this task. The arrival data it reads lives in the tree and is shaped
  exactly like the payloads the online service returns, so the page still runs
  its own reading, ordering, filtering and rendering code end to end.
- The weather picture and the temperature in the header strip stay empty on this
  face, because the observatory service they come from is off-site and this task
  runs offline. That is the product's own "no data, show nothing" behaviour and
  it is intended here.
- The harness drives the page in a real browser at a **1280x720 viewport**, in
  the Hong Kong time zone.
- Every checkpoint starts from a fresh browser context, so a setting you changed,
  a sheet you opened or a preference the page remembered earlier never carries
  into the next one.
- The board repaints itself once a second and the promotion cycle runs on its own
  ten-second beat, and the two languages trade places on a slower beat again.
  Where a check depends on that alternation it waits for it explicitly rather
  than hoping to catch it.
- Do not remove, rename or repurpose any of the probe attributes the harness
  added to the page's own elements - they are verification probes required by
  the checker.

QA collected a batch of reports about this build. They are quoted below roughly
as the staff wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different part of the
  page than the place the symptom shows up, and a single reported symptom can
  have more than one root cause behind it.
- At least one report describes behaviour that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviours you break
  while fixing other things still count against you.
  並非所有缺陷都有報告提及；修別的問題時弄壞的行為同樣會扣分。

The reports, in no particular order:

1. "One station on the line never shows anything at all. I pick it, I wait, and
   the board stays completely empty - not one row, ever - while every other
   station on the same line lists its trains normally. It is always that one
   station. I have reloaded plenty of times."

2. "On the light rail the order of the trains is nonsense. A train that is
   further away is listed above the one that is next, so the top row is not the
   next train. It looks like the list is being sorted the way a dictionary sorts
   words rather than the way numbers sort. The heavy rail lines come out in the
   right order, it is only the light rail that is wrong."

3. "Some trains are announced one minute earlier than they should be. The screen
   says three minutes when the train is really a fraction over three minutes
   away, so the number changes too soon. It is not every train, only the ones
   whose time does not fall on an exact minute, and it is always one minute
   early, never one minute late."

4. "A train that is physically standing at the platform is missing from the
   board, and everything underneath it has moved up one place. The train in
   question is one of the ones that is not carrying passengers - it is running
   empty to the depot - and it is right there at the platform with the doors
   open, so the screen should still be telling people about it for as long as it
   is basically arriving. Instead the row is gone and the board shows one fewer
   train than is really due."

5. "Changing the first-train setting does nothing. In the settings sheet there
   is a number that says how far away the earliest train may be before the board
   is left blank. I raise it from thirty to sixty, I press start, and the board
   still blanks out at exactly the same distance as before. The number in the
   sheet does move and it is still there when I reopen the sheet, so the sheet
   itself is not broken - it just has no effect on the board."

6. "The maintenance address stopped working. We keep a special form of the page
   address for maintenance work: you add one extra word to the address, with no
   value after it, and the page is supposed to keep the board filled in so we
   can look at it while a station is closed. Since some recent change, adding
   that word does nothing at all - the board blanks out exactly the way it does
   for a normal visit. Adding it with a value after the equals sign still seems
   to do something, which is why we think the bare form is the part that broke."

7. "Every ten seconds or so the arrivals disappear and an advertisement takes
   over the whole screen, then the arrivals come back. It has done this since
   the display was installed and it happens on every station we have tried. Is
   the advertisement meant to interrupt the board like that? It is distracting
   for the passengers."

8. "The weather picture and the temperature in the top strip never show up at
   all - that whole part of the header stays empty, on every station, every
   time, since the screen was put in. The clock next to it works fine. Has the
   weather part been switched off?"

Work in the source tree, repair the root cause of each real defect, and leave
the intended behaviours alone: the promotion cycle and the settings that choose
which half of the screen wins, the empty weather strip and everything else in
the same header, the alternating languages and the beat they alternate on, the
two closest movements being announced by word instead of by number, the platform
column and the line banner and the settings that hide them, the offline data
source the page boots into and the arrival data it reads, the settings the sheet
remembers in the browser and the language the sheet itself opens in, the way a
platform whose service has ended contributes nothing, the way the two languages
are carried together in the source data, and the offline, self-contained way the
page loads. The tree must still need nothing from the network when you are done.
