# Repair task: a real-time Hong Kong city dashboard

## The page you are repairing

One static document: a personal-scale city dashboard for Hong Kong that pulls
together government open data - weather, transport, bus arrival times, tides,
hospital waiting, air quality, parking, ferries, public holidays, climate
normals, beaches, traffic cameras and household waste collection. There is no
build step, no framework and no dependency directory anywhere in the tree: the
browser loads the entry document, 2 stylesheets and 17 page scripts straight off the
disk, in the order the entry document declares, and everything a visitor sees is
produced by those files.

Fifteen pages share that one document - home, weather, transport, bus, tides,
health, environment, parking, ferry, holidays, climate, beach, map, cameras and
waste - and they are switched in place rather than navigated to. A top tab bar
carries 14 of them; a phone-width bottom bar carries all 15. Above the pages sits a header with a
live clock (time, and the date with its weekday), a lunar-date chip and a
dark/light theme control.

Six of the panels are fully offline: they read datasets that ship inside the
tree, so they are the parts of this page that actually have content in this
harness. They are the beach panel (34 beaches, each with a region, a water-grade
and a tidal guide, filtered by a row of region chips and a search box), the
traffic camera wall (24 cameras grouped under 5 road/area headings, which you
pick before anything is shown), the household waste panel (whether today is a
collection day and what the hours are, a district dropdown listing 19 districts
that fills in a detail block for the district you pick, a recycling guide and the
special-services list), the public holiday panel (51 statutory holidays across
2024-2026 plus 48 solar terms for 2025 and 2026, each upcoming one with a
days-to-go countdown, and a lunar-date line), the environment panel's risk and
air-quality-health-index tables (14 risk labels mapped to numeric levels, each with a
label, a colour and a background band) and the climate normals panel.

The other panels call 41 government open-data endpoints. This harness has no
network at all, so every one of those calls fails; the page swallows each failure
in its own error wrapper and boots through an all-settled pass, which means the
shell, the navigation, the header and the six offline panels all still work and
nothing throws. Those networked panels simply sit in their own empty or
"could not load" state.

The page is examined at a 1440x900 window with the zh-HK locale, and every check
starts from a freshly loaded page in a fresh browser context, so nothing - not a
page choice, not a district, not a theme - carries over from one check into the
next.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are
starting points, not diagnoses: they are not always precise, they do not always
say which of several similar things is affected, and they do not always agree
with each other.

1. The clock at the top is broken. It shows a time when the page opens, and the
   date and weekday next to it look right, but the seconds never run. I sat and
   watched it for two minutes and it moved once. Every other clock I own moves
   every second, so this one is clearly not updating like it should.

2. The beach page is empty. I tap Beach and the tab lights up and the page does
   switch - I can see I am on it - but there is nothing there. No region chips,
   no list of beaches, no tidal guide, just the headings and empty space
   underneath. Reloading and tapping it again gives the same nothing. The other
   offline pages (the holidays one, the waste one) do have their content, so it
   is only the beaches.

3. Today is Saturday and the waste page tells me there is no collection today.
   That is wrong where I live: collection runs Monday to Saturday, and the page
   says so itself on the very next line, where it prints today as Saturday and
   then quotes the collection days as Monday to Saturday. The headline above it
   still says there is no collection today, as if today were Sunday, and the tag
   on the right calls today a rest day. The rest of that panel looks fine.

4. The district dropdown on the waste page does nothing. I open it, pick my
   district, and the box underneath still says to choose my district. I tried
   three different districts and it is the same every time - the list is there
   and it lets me pick, but the detail never comes.

5. The public holiday dates are all wrong, shifted by about a month. New Year's
   Day is listed in February instead of January, and everything under it is out
   by the same amount. The ones that were in December have turned up in January
   of the following year, so the end of the list looks like next year already.
   The names are right; it is the dates that have slid.

6. The days-to-go numbers on the holiday page are a day out. For the same
   holiday my phone and this page disagree by one day, and it is not always the
   same direction as far as I can tell - some are one day too many, some one day
   too few. It is only a day, but a countdown that is wrong by a day is worse
   than no countdown.

7. On the camera wall each area only ever shows one camera. I know some of those
   stretches have a dozen cameras along them, and the area heading is there, but
   underneath it there is a single thumbnail instead of the row I expect. It is
   the same for every area I try, so it is not one broken camera.

8. Half the dashboard is empty. Weather, bus arrivals, parking, tides, ferries,
   the maps - they sit there with dashed placeholder blocks or a line saying the
   data could not be loaded, and nothing ever fills them in. Is the data feed
   broken, or is this page just not getting through to the government servers?

9. Nothing is remembered. Every time I reload I am back on the home page, my
   district is back to "choose your district", and the theme is back to whatever
   it decided on its own. There is no setting that survives a reload anywhere in
   this thing. Was there meant to be a saved-preferences bit that has stopped
   working?

## Not every defect is described in these reports

Some of the faults on this page are not mentioned by any report at all, and -
just as importantly - not everything above is a fault. You are expected to read
the page and work out what is actually wrong rather than to work down the list:
repairing only the reported items will not finish this task, and "repairing"
something that was never broken will cost you.

Two things follow from that, and they are worth stating plainly:

- At least one fault is hiding behind another. There is a broken behaviour on
  this page that you cannot currently reach, because a different fault stops you
  reaching it; it still counts against you once it becomes reachable. So when
  you get a dead page alive again, read what that page was supposed to fill in
  and check it, rather than assuming the rest of it was fine.
- The reports point at symptoms, not at causes. A symptom can be produced
  somewhere other than where it shows up, two similar-looking symptoms can have
  different causes, and one cause can show up as more than one symptom. Verify
  before you change anything.

## What is NOT a fault - leave these exactly as they ship

Every line below is either the page's own intended behaviour or an honest
consequence of running it in this harness. None of them is a defect, none of them
is something a report asks you to fix, and each of them is checked:

1. There is no build step and no dependency install, and nothing may add one.
   The tree you are given is the tree that runs; the served directory is the
   source directory. Do not add a package manifest, a bundler, a transpiler, a
   type step or a framework, and do not move anything into a build output
   directory.

2. The networked panels are empty (report 8). There is no network in this
   harness, the 41 open-data calls all fail, and the page's own error wrapper plus
   its all-settled boot turn that into an empty or "could not load" panel with no
   thrown error and no blank page. That is the page behaving correctly with no
   data. It is not a defect, and it must not be "fixed" by inventing data, by
   hard-coding readings, by stubbing the calls with made-up responses, or by
   pointing anything at a remote host.

3. The wall clock is pinned. The harness freezes the page's clock at one fixed
   instant - Saturday 7 March 2026, 10:30 local time - so that anything date-dependent
   (whether today is a collection day, which holidays are upcoming, how many days
   to go, the header date and its weekday) gives the same answer on every run.
   The frozen date is furniture, not a fault: do not "restore" the real clock, do
   not remove the pin, and do not make a panel read a different date than the
   rest of the page.

4. No service worker is registered. The upstream tree registered one that
   precached the whole page; in this harness that would serve cached bytes over
   the tree you are repairing and wash a missing file into a hit, so the
   registration is gone. The manifest reference stays. Do not add a service
   worker, a cache, or any other layer between the page and its own files.

5. The remote web fonts are not available offline and have been dropped, so the
   text falls back to the local font stack the page already declares. That is not
   a reported fault and no font file is expected to reappear; do not reintroduce
   a remote font, icon set or library.

6. The top tab bar has 14 tabs and no waste tab, while the phone-width bottom bar has
   15 items and does include waste. The waste page is reachable from the bottom bar
   and from the page's own navigation. That asymmetry is how the page ships;
   leave it alone unless a report asks you to change it.

7. The holiday dataset is 51 statutory entries across 2024-2026 plus 48 solar terms for
   2025 and 2026, and the beach and camera datasets are the ones that shipped.
   Those counts are the shipped data. Do not trim, re-sort away, re-date or
   extend a dataset to make a symptom go away, and do not delete rows
   or panels: the fault in each case is in the code that reads the data.

8. Nothing persists between loads (report 9). There is no save path, no restore
   path and no storage use anywhere in this tree - not local storage, not session
   storage, not cookies - and the theme is carried in the address bar fragment
   rather than in a preference file. Starting over on every load is the page's
   own design. Do not add persistence to make report 9 go away.

9. The page keeps its own state in a handful of globals - which page is current,
   which panels have already been filled in, which theme is showing. Those
   globals belong to the page. They are not residue from a repair and they must
   not be "cleaned up" as part of a fix.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add
  one. They carry no behaviour; they are how the page is addressed while it is
  being examined, and they must survive your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it
  needs is already inside the tree. Do not add a remote reference, do not assume
  anything can be downloaded, and do not reintroduce a font, an icon set, a
  library or a data feed from outside.
- Repair the behaviour a visitor experiences. Do not special-case the
  examination, do not add flags or hidden state, do not write anything into the
  browser's storage that the page does not already write, and do not leave
  anything on the page's global scope that was not there before.
- Do not delete shipped content, sections, controls, copy, datasets or artwork to
  make a symptom go away, and do not reorder or rebuild a region unless the report
  you are answering is about that region's order.
- Keep every change inside this page's own files. Nothing outside the page may
  change, and when you are done the tree must still load and run exactly as it
  does now: no build step, no new dependency, no network access.
