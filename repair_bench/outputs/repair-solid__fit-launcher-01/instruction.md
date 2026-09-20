# Repair Task - Fit-Launcher (SolidJS + Vite + Tailwind, the browser UI of a desktop game launcher)

You are working on the source code of **Fit-Launcher**, an open-source game
launcher and library manager - version 4.2.0 of the upstream
`CarrotRub/Fit-Launcher` project. What is here is the application's entire user
interface: a SolidJS 1.9 single-page front end in TypeScript, routed in memory by
`@solidjs/router` 0.15, bundled by Vite 7, styled with Tailwind 4. It is built to
run inside a Tauri v2 desktop shell, and every byte of content it shows comes
from that shell: the UI issues host commands for the catalogue, the library, the
settings and the download queue, and subscribes to a host event stream that
pushes transfer progress in. State lives in the framework's own reactive values
per page, plus one shared download queue that those pushes are folded into. The
tree also carries the Rust host crate, but **none of that is part of this task**:
the graded surface is the static client build only, the Rust side is never
compiled here, and the app is expected to be fully usable with no host attached.

What the app gives a user, and what the checks therefore drive:

- A **front page**, which the nav calls GameHub: a hero carousel of featured
  releases that swaps between them on its own, with a row of dots and a detail
  strip of genre, company, language and repack-size lines; a collapsible filter
  bar - collapsed at boot, headed "Filters", with a badge counting the filters
  you have set, a genre picker reading "Select genres..." and two size ranges;
  and two rails of cover cards, **Newly Added Games** and **Recently Updated
  Games**.
- A **Discovery** page: the same kind of filter bar, a pager showing
  "current / total" with previous and next arrows, a line reading "Showing N of M
  games" that gains a "(filtered)" suffix once a genre is chosen, and ten rows
  per page.
- A **Downloads** page: filter buttons `All`, `Torrents`, `Direct` and `Active`,
  the two source ones each carrying a count badge; global speed badges with an
  active-transfer count; and one row per transfer with its cover, title, size,
  percentage, status line and speeds.
- A **Library** page of expandable collections, each with a name, a member count
  and a removable row per game.
- A **Settings** page, and a **search field in the top bar** ("Search Game...")
  that waits a beat after you stop typing and then opens a dropdown of matching
  releases.
- Five nav labels - GameHub, Discovery, Library, Downloads, Settings - move the
  app through an in-memory history: switching destination never reloads the
  document.

**How your work is checked.** The verifier restores the project's dependencies
offline, builds the app with the project's own local toolchain (`npm run build`,
output in `dist`), serves that build from a static origin and drives it in a
headless browser at a fixed **1440x900** viewport, `en-US` locale, UTC clock,
with every off-origin request blocked. Each check is a real interaction - a click
on a nav label, a tick in the genre picker, a drag of a size range, a click on a
pager arrow, a key pressed in the search field, a pointer parked on the hero, a
wait for a debounce or for the host's next progress push - followed by reads of
what the running app now shows: which cards a rail lists and which cover each
carries, what the hero's title and detail strip read, how many rows the discovery
list has and what its count line says, which page the pager sits on, what a
transfer row's size, percentage and status read, what the filter counts say,
which collections the library lists, and what the search dropdown offers.

The interactive surface carries a set of inert `data-testid` marker attributes so
a check can address the same control on every build. They carry no behaviour and
no styling. **Keep them exactly as they are** - a check that cannot find its
handle reports a broken state rather than a repaired one. Equally, do not add
markup, state or a special case to make a reading come out right: the checks read
the live app, so a hardcoded value shows up exactly where it was hardcoded, and a
repair that publishes state on `window`, in storage, in a cookie or in the URL is
checked for directly. Two more things that are easy to trip over:

- **There is no desktop host and no network in the checker.** A plain browser has
  no Tauri shell in it, so the tree you are given carries a same-origin offline
  desk: it answers every host command the app issues from local fixture data,
  answers its remote fetches the same way, and refuses and counts anything else
  that tries to leave the origin. That is the app's normal, intended state here -
  the whole UI is explorable with no host, no network and no real transfers in
  flight, and no check expects a host, a real download or a reachable server.
  Anything you add must keep it that way: no remote script, font, stylesheet or
  image, and no server endpoint.
- **Routing is in memory.** The app renders a memory router, so the address bar
  never changes and the document is never reloaded: every destination switch is
  an in-memory history push. Checks read the live in-app view and never a URL,
  and a repair that tries to express state through the URL has no effect on any
  reading.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the source tree. The root cause is frequently in a different file
  from the one the report names, and in a different layer from the one you can
  see: what a page draws, the catalogue helpers underneath it and the queue the
  host's pushes are folded into are three halves of one contract.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Behaviors you break while fixing other things still count against you, and
  because the pages share helpers, one queue and one set of card, filter and row
  primitives, a change made for one report is visible in every other page using
  the same primitive.
- Keep the inert marker attributes described above exactly as they are.

The reports, in no particular order:

1. "I cannot filter Discovery by more than one genre. With one genre ticked the
   list narrows properly, so the picker works. Tick a second and it collapses to
   almost nothing: I ticked Action and Puzzle and got a single row, and games I
   know are in the catalogue - Iron Vantage, Kiln Song - are gone, though Iron
   Vantage is plainly Action and Kiln Song is plainly Puzzle. It behaves as if a
   game has to carry both at once. Untick either and the rows come back."

2. "The genre list on the front page is missing genres. The picker under the hero
   offers six options, but Horror is not one of them and neither is Indie - and I
   know there are games in those very rails tagged with both. The two size
   sliders are short-changed the same way: their bottom end starts far above the
   smallest game on the page. The confusing part is that Discovery has a filter
   bar of its own and that one lists every genre including Horror, so the two
   pages disagree."

3. "Every picture in the Newly Added Games row is on the wrong card. The titles
   are right and in order, but the artwork next to each belongs to a different
   game - not at random: the pictures run backwards through the row, so the card
   titled Alpha Tide wears the art of the game at the far end. Clicking is where
   it bites - a card takes me to the game its title names, which is not the game
   whose picture is on it. The Recently Updated row underneath is fine, picture
   and title agreeing on every card."

4. "The little numbers on the Downloads filter buttons lie as soon as I click
   them. The page opens with All selected and Torrents says 1 while Direct says
   0, which is what I would expect: of my two transfers only the magnet one has
   reported any progress so far. But I click Direct to look at the other job, and
   the Torrents badge drops to 0 while I am looking at it, as though the magnet
   transfer had stopped existing. Back on All it reads 1 again. Those counts are
   how I tell what is on the other side of a filter before I switch, so they are
   useless exactly when I need them."

5. "The downloads page stops updating right after it opens. My two jobs are
   listed, the first bit of progress comes through - and after that nothing
   changes again. A running job moves once and then sits on that percentage
   forever; a transfer added later never shows up at all. Reloading buys one more
   update and then it freezes the same way. The rest of the app keeps working, so
   it has not hung. It is as if the page only ever hears the first thing it is
   told."

6. "Search shows results for what I was typing a moment ago, not what is in the
   box. Type slowly and it is fine. Type at normal speed - I keep trying `alp` -
   and the dropdown settles on a much longer list that is plainly the answer for
   the first letter alone: rows for games with no `alp` in their names. The field
   says `alp`, the list disagrees and never catches up. Typing one character at a
   time with a pause gives the short list I expected."

7. "Discovery goes blank and still claims it found things, if I change page
   before I filter. Open Discovery, click the next arrow once so I am on page 2,
   then tick a genre: the list empties out and says "No games found matching your
   criteria", while the line above it says it is showing 0 of 7 games and the
   pager sits on 2 of 1 with the previous arrow still clickable. Tick the genre
   first, from page 1, and it works - seven rows and a sensible pager. So it is
   the order: page first, filter second."

8. "Is the front page supposed to move by itself? I leave the app sitting on
   GameHub and every ten seconds or so the featured card at the top swaps to a
   different game on its own - title, artwork, the genre and company lines, and
   the dots follow along. I am not touching anything. It holds still while my
   mouse is over it and starts again when I move off. Is that a feature, or is
   something wrong with my install?"

9. "Question about the Downloads page: the size has a dash in it. When the app
   opens both my transfers are listed with their covers and titles and the speed
   badges along the top have real numbers, so the page is not empty and not stuck
   loading - but on one of the two rows the size reads just `-`, where the other
   row has a size. Does that fill in by itself later, or is it broken?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the app's behavior intact -
including everything no report describes: the app opening cleanly on all five nav
destinations with nothing failing at boot; that it issues only the host commands
it already issues and never reaches for another origin; the hero's own
ten-second cycle and the hover that pauses it; the discovery list as it renders
with no filters set, its "Showing N of M games" line and its paging; both
front-page rails drawing their cards; the downloads page's row set at boot, the
row whose size is still a dash then, and the global speed badges beside them; the
library's collections and which games belong to them; the search field as it sits
before you have typed anything; the filter bar starting out collapsed; the hero's
detail strip with its genre, company and language lines; the recently-updated
rail's own pairing of cover and title; and the counts on the Torrents and Direct
buttons while the default All filter is on. The app must still build with the
command above when you are done.
