# Repair Task - A Very Mogul Christmas (plain HTML/CSS/JS, a 19-page static fan site)

You are handed a **workspace** containing a fan site for a 2020 Christmas album: nineteen pages of
hand-written markup, ten stylesheets, and seventeen small classic browser scripts - three of which no
page loads at all. There is **no package manifest, no bundler, no build step and no server component**
in this workspace, and none is expected: what is on disk is what runs. The CSS framework, the two
icon-font stylesheets and the handful of placeholder assets the pages point at are all vendored
locally, and the site makes no cross-origin requests while it is being checked.

The main page is the product in miniature. It opens on a hand-drawn Christmas tree, then a header
carrying the site title, the two icons that open and close a slide-in navigation menu, and a light/dark
theme switch. Below that are a falling-snow decoration, a "days left until Christmas" heading, two
greeting banners that are only meant to appear on the day itself, a playlist of the album's seven songs,
a bar of player controls - play, pause, stop, shuffle, repeat and a volume slider - and a video frame.
Two further pages are graded beside it: a *you may also like* page that paginates a fixed list of
twenty-two recommended songs five to a page behind a row of five page buttons, and the *Last Christmas*
lyrics page, which renders sixty paragraphs of lyric out of a shared data array and gives each blank line
of the source a line break of its own.

The interesting thing about this codebase is that it is **several small scripts deep, and the layers
address each other by name**. One script owns the main page: it holds the album data, renders the
playlist, wires every control and paints the theme. It reaches into the markup by class and by id, the
markup reaches back into it through inline handlers, and the stylesheet declares the utility classes
and the colour variables that the script toggles and reads. So a symptom on screen routinely
originates a layer away from where it shows up: an empty playlist can be the fault of one class name
in the markup, and things that should be out of view can be the fault of one declaration in the
stylesheet. Several pages also load a script that was written for a different page, which is a standing
source of pre-existing noise you should not chase.

## What the graded surface is

- The **playlist on the main page**: seven rows, one per album track, built from the album data during
  script evaluation with no network involved. Each row carries the song title as a link plus a small
  readout beside it, and each row is individually addressable by a handle derived from its title.
- The **bar of player controls**: six children in a fixed order - play, pause, stop, shuffle, repeat
  and the volume slider. Pause and stop start out concealed and are revealed only while something is
  playing; the bar itself starts out concealed and is revealed once the page has loaded, in the same
  breath as the loading spinner is concealed.
- The **theme switch**: flips the page between light and dark, moving the body's own state class, the
  inline backgrounds painted onto three surfaces, and the ink colour of the five strokes the header's
  two icons are drawn with, all together. The preference persists across visits, and a first visit with
  nothing stored has one defined side it lands on.
- Three further **persisted preferences** - repeat, shuffle and volume - each written by its own
  control's handler and each re-read on the next visit, so a control comes back in the state the
  visitor left it in.
- The **slide-in navigation menu**: opened by the header's three-bar icon, closed by the icon that
  replaces it, travelling in and out over a declared transition.
- The **concealment utility** the page leans on everywhere: one class that the stylesheet defines and
  the script adds and removes in a number of places, and that a few elements are authored already
  wearing.
- The **colour variables** the stylesheet declares once for light and once for dark, and every surface
  that resolves through them.
- The **two date-gated greeting banners** and the countdown heading that sits above them.
- The **video frame**: graded as markup only - its element type, its accessibility title, the shape of
  its attributes, and the fact that it points at a local placeholder.
- The ***you may also like* page**: twenty-two items in the data, five rows on the page, five buttons
  in the pager, exactly one of them lit, and clicking a button moving the lit state rather than adding
  to it.
- The ***Last Christmas* lyrics page**: one paragraph per entry of a sixty-entry data array, with a
  line break inside exactly those paragraphs whose entry is blank in the source.
- **Browser state**: after a full round trip through the controls, the only things the page may have
  left behind are the four preferences its own handlers already write.

Everything is served from one static origin and **there is no network access at all** while this is
checked.

## How the work is checked

- Your tree is served **statically, exactly as it sits in the workspace** - nothing to install, nothing
  to build - and driven by a headless browser at **1440x900**, locale `en-US`, timezone `UTC`.
- **There is no build step**, so nothing catches a malformed file for you before it runs: what is on
  disk is what the browser parses, and a syntax error surfaces as a red check rather than as a build
  failure.
- The checks **use the page the way a person does**. They load a page, click the theme switch, click
  the repeat and shuffle controls, open and close the menu, drive the volume slider through a real
  change event, click a page button, wait, and then read what is on screen: element text and counts,
  class lists, inline styles, computed styles and resolved colour variables, element geometry, and what
  is in browser storage.
- They are interaction-level, not code-level. They never import your scripts, never call your
  functions, and never read your source.
- **Each check gets its own fresh browser context**, so nothing carries over between checks and every
  one of them starts from a first visit with empty browser storage - which is exactly the situation the
  persisted-preference defaults and the theme's default side are graded in.
- Some readings are **relations rather than frozen values**. The theme is read at load, then after one
  click of the switch, then after a second click, and the round trip is compared against the value
  frozen at load rather than against a hardcoded colour: one click must move the theme and two must
  restore precisely what was there, so a repair cannot pass by hardcoding one side of the switch.
- Other readings are **declared values rather than mid-animation samples**. The menu's transition is
  read as the duration the stylesheet declares, never as a position sampled while the panel is
  travelling, so no reading depends on when the reader happened to run.
- The **wall clock is pinned to a fixed non-holiday instant**, 2024-06-15T12:00Z, so the two date-gated
  banners take the same branch on every run date instead of flipping if this package happens to be
  scored on a holiday. That pin is part of the harness, not a defect. **Do not remove it and do not
  "restore" the real clock** - repairing the pin back to the live wall clock will fail a check.
- **No check depends on a video or an audio stream playing.** The scope ruling is stated in full below.

## Reading the reports

- Most reports describe **real, reproducible defects**, each with its own root cause. The root cause is
  frequently **not in the layer where the symptom shows up**: this site's markup, its stylesheets and its
  scripts all address each other by name, so a symptom in one of them is very often caused in another,
  and the layer a reporter blames is not a reliable guide to where to look.
- **A report is a witness account, not a diagnosis.** A user tells you where they saw the damage, which
  is not the same place as where it was done, and their own theory about it is worth exactly as much as
  your ability to reproduce it. Read the reports for *what* happened and work out *where* it happened
  yourself.
- **At least one fault is hiding behind another.** Something that appears to do nothing may be doing
  nothing because a step it depends on throws first. Repairing what you can see can expose a second
  fault that was unreachable before it, and a check can stay red afterwards for a *different reason*
  than it was red before. That is the expected shape of a correct repair here, not a sign that you
  failed - but it does mean you should keep going past the first thing you fix.
- Two of the things users mention below describe behaviour that is **actually intended**; verify a report
  before you act on it. "Changing" intended behaviour is scored as a regression.
- **Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.**
  (并非所有缺陷都有报告提及。) Some broken behaviour is described nowhere below and will only be found by
  exercising the site - both sides of the theme switch, all four persisted preferences and the values
  they fall back to on a first visit, the menu round trip and how long it takes, the player bar's reveal,
  the colour variables behind the light palette, the paginated list and its pager, and the lyric page -
  rather than by reading the list.
- Keep the rest of the page intact. A fix that makes one report pass by hardcoding a value, deleting an
  element, renaming something the rest of the page addresses by name, swallowing an error, narrowing what
  a list is allowed to render, or inventing a new place to stash state will be caught by the guard checks
  and score zero.

---

## Reports from users

**Report 1 - the playlist on the home page is completely empty.**
"The song list has gone. The heading, the artwork, the snow and the player bar are all still there, but
the seven song titles that used to be listed underneath the heading are simply missing - not greyed out,
not collapsed, just not in the page. Reloading does not bring them back, and neither does clearing my
browser storage. It is the first thing you see on the site and it is the whole point of the page, so
nothing else on it matters much while this is broken."

**Report 2 - the site keeps opening in its dark colours and I cannot get rid of it.**
"I have never used the theme switch on this site, not once, and yet every time I open it it comes up
dark. I assumed it had remembered a preference from somewhere, so I cleared the site data, closed the
browser, opened a private window and then tried a different browser altogether. It comes up dark every
single time. The switch itself still works - one click gives me the pale cream look I was expecting to
see in the first place, and another click takes me back to dark - so it is only the side the page starts
on that is wrong. There has to be a stored preference sitting somewhere that I cannot reach, because
nothing I can clear makes any difference."

**Report 3 - the bar of player controls never comes out properly.**
"The page loads with a spinner and, once it is ready, is meant to hand over to the bar of player
controls: the bar comes out and the spinner goes away. For me that hand-over never completes, so the bar
never really arrives. What is on screen is not the finished bar - its six controls are jammed over
against the left edge of the page instead of sitting centred under the song list the way they do in
every screenshot of this site I have seen. I have been through the stylesheet rule that lays the bar out
and through the markup for the bar itself and I cannot find anything wrong with either: the rule reads as
though it ought to centre them, and the markup looks exactly like the markup that produced those
screenshots. Reloading never gets any further."

**Report 4 - everything the page tries to conceal is shown instead.**
"Pause and Stop are on screen from the very first moment the page loads, sitting either side of Play,
even though nothing is playing and there is nothing to pause or stop. Those two are supposed to stay out
of the way until a track is actually running. And the little spinning loader icon never goes away - it is
still spinning minutes after everything else has settled. My assumption is that whoever last touched this
added or dropped a class on those elements in the markup, so I have been comparing the tags for the three
icons and for the loader against older copies; they look to me as though they carry what they always
carried. It is not only the player bar either - on this site anything that is meant to be out of view is
in view, which is why I keep coming back to the markup."

**Report 5 - the Last Christmas lyric has lost its line breaks.**
"The lyric on the *Last Christmas* page has gone double-spaced. Every single line now has an extra blank
line underneath it, and the genuine stanza breaks - the ones where the source itself has a blank line -
no longer stand out from the rest at all, so the whole thing reads as one long unbroken column. The words
are all present and in the right order, and the number of paragraphs has not moved: it is still exactly
sixty. Somebody on our side counted the line breaks in the page and there are forty-nine of them now
where there used to be eleven."

**Report 6 - Repeat forgets itself on a reload.**
"I switch Repeat on, reload the page, and it is off again. It never remembers. Shuffle remembers itself
across a reload perfectly well, so it is only Repeat that comes back in the wrong state. While I stay on
the page the control behaves normally - clicking it twice turns it on and then off again, and the icon
lights up and goes dark again as it should."

**Report 7 - the recommended-songs list shows the wrong number of rows and has lost a page button.**
"On the *you may also like* page the list has started showing seven songs per page instead of five, and
the row of page buttons underneath has one fewer button than it used to - four now, five before. The
songs themselves are all still in the data and in the right order, and clicking a button still changes
the page, but the page size and the number of pages are both wrong for a twenty-two song list."

---

## Two things users mentioned that may not be bugs

**Observation A - "the countdown under the header is completely empty".**
"It should be telling me how many days are left until Christmas. Instead the heading is there but there
is nothing in it at all - no number, no text, not even a zero. On a Christmas album site that has to be
broken."

**Observation B - "the YouTube player is invisible and nothing plays when I press play".**
"The embed area is just blank. The frame where the album's video is supposed to be shows nothing at all,
and pressing play produces no sound and no picture."

Both of these are **normal for this workspace and must not be changed**.

- Observation A is the shipped behaviour of this seed on every date. The countdown's target moment is a
  fixed date that is already in the past, so on its very first tick the interval finds a negative
  distance, clears the heading to the empty string and stops itself. It is not one of the defects and
  there is a guard check that fails if you advance the target date or write a live countdown in its
  place.
- Observation B is the scope ruling, stated in full in the next section. The frame is deliberately
  concealed at load and no audio or video ever plays here. The frame keeps its element type, its
  accessibility title, the shape of its attributes and its local placeholder target, and a guard check
  fails if you reveal it, replace it with a local media element, or re-point it at the live service.

---

## Rough edges that are NOT part of this task

These are real, reproducible, and **out of scope**. They are either the shipped behaviour of this
codebase or a consequence of running it offline, and no check grades them. Do not repair them, and do
not let a repair of something else change them.

**Audio and video playback is outside the graded surface entirely.** The site's playback channel is a
third-party video frame, and it can never be exercised here: the graded environment has zero network
access, a third-party player cannot be vendored into a text patch, and the player object the transport
controls call into is already undefined offline in the unmodified seed - so the play, pause and stop
  controls and the playlist rows' own click handlers throw there too, before you change anything. No
  check clicks them and no check depends on a video playing. Leave the playback path alone.

**The offline posture is part of the harness, not a defect.**

- There is **no network at all** at grading time. Every stylesheet, script and asset the pages reference
  is vendored locally, and the workspace as delivered makes no cross-origin request. Do not re-point
  anything at a live origin, and do not add a fetch.
- **Icon webfonts cannot ship inside a text patch**, so icon glyphs render as empty boxes or
  placeholder squares throughout the site. That is cosmetic, it follows from vendoring, and no check
  reads an icon. Do not go looking for a missing font file and do not replace the icons with text.
- The **wall clock is pinned** to 2024-06-15T12:00Z so that the two date-gated banners take the same
  branch on every run date. Both banners are therefore concealed on every run. The pin is harness
  furniture: removing it, or letting the real clock back in, fails a check.

**Five pages each raise one uncaught error in the unmodified seed.** The main page, the lyrics index,
the Ludwig socials page and the artists page each throw once at load - two of them because the same name
is declared twice at the top level of two scripts the page loads, the others because a script reaches
for an element that does not exist on that page. The *you may also like* page throws repeatedly, once a
second, because a countdown script runs there and the element it writes into does not exist on that
page. All five are pre-existing, none of them is part of this task, and **no check asserts their
absence**. Do not chase them, and do not "clean up the console" as a side effect of something else.

**The main page's script is loaded by two other pages that are missing an element it needs**, so it
throws early on both of them and everything after that point never runs there. One consequence is worth
internalising before you start: the song list on those two pages is empty in the unmodified seed and is
meant to stay empty, and anything that lives in the main page's script is observable on the main page
only.

**The artists page loads the theme script written for the *you may also like* page but has no theme
switch**, so the switch is permanently unavailable there and the page throws. That is shipped behaviour.

**Two leftovers in the markup are never fetched and are out of scope.** The main page's canonical link
carries a malformed address with the scheme written twice (`https://https://...`), and the
song-suggestion form posts to an external script endpoint. Neither is ever requested offline, neither
affects anything on screen, and neither is graded. Leave both exactly as they are.

**Eleven links are dead under a static server.** Five navigation destinations on the main page point at
paths with no directory on disk, and each of the six lyrics pages links to a sibling download file that
does not exist. All eleven are shipped dead links; none is part of this task.

**Three scripts are dead code.** Two belong to the rate-a-song page and one to an "other projects"
panel; no page loads any of them, so changing them changes nothing observable. The "other projects" one
also refers to two day/night images that are not in the tree.

**Several surfaces are defined and never used.** The credits page defines four related functions that
nothing on that page ever calls, and one of them leaves an undeclared implicit global behind. The
random-song script assigns a lowercase handler property to a button, which is not a handler at all -
that button only works because the markup carries an inline handler of its own. Two element lookups in
the theme scripts select something that is then never read, and an element lookup in the main page's
script is referenced only from commented-out lines. All of it is shipped.

**The theme render on the main page is bound twice**, once through a load listener and once through the
load handler. Both fire. It is redundant but harmless, and it is the reason a theme symptom is visible
with no interaction at all.

**The seventh album entry has no end timestamp**, unlike the other six. It is the "play everything"
entry and the missing value is intentional; the render must still produce a row for it.

**One iframe on the news articles page sits inside an HTML comment**, so it is not live markup. Do not
resurrect it.

**The markup is inconsistent in ways a browser does not care about but a text search does.** One id
attribute is written with spaces around the equals sign, one uses single quotes, one uses a capital
first letter in the attribute name, and one image element on the podcasts page is closed with a
mismatched tag. All of it parses and renders fine. Do not normalise the quoting or the casing as a
tidying pass.

**The countdown's own target date is a hardcoded date already in the past**, which is why the heading is
always empty. That is Observation A above and it is a guard, not a target.

---

## Keep the rest intact

Specifically, these territories are exercised by guard checks and must keep behaving exactly as they do
now, whether or not a report mentions them:

- the **boot contract** on every graded page: the document parses, the page's own scripts run to
  completion, and the elements the page authors in its markup are all still present with their element
  types and their attribute shapes intact;
- the **theme switch round trip**: one click must move the theme and a second click must restore exactly
  what was there at load - the round trip has to be symmetric, so a repair cannot pass by hardcoding one
  side, by dropping the body's state class, or by stopping the preference from being persisted;
- the **repeat control's own toggle**: an on/off round trip must leave it unlit and must leave the
  persisted flag holding the value the handler last wrote. The toggle path is not what is broken, so
  rewriting it to make the reload symptom go away is a regression;
- the **volume slider's real handler**: driving the slider through a change event must move the control
  and must persist what it was moved to. Only the value it starts from on a first visit is wrong;
- the **player bar's inventory**: all six controls, in the authored order, still children of the bar,
  and the two that are authored concealed still carrying that state - so a repair may not delete them
  from the markup, rename them, or move them out of the bar to make a symptom disappear;
- the **album data and its mount point**: seven entries, including the awkward seventh one with no end
  timestamp, and a container that still exists and is still the same kind of element. Neither the data
  nor the container may be trimmed, emptied or replaced to dodge a crash;
- the **lyric page's paragraph count**: one paragraph per entry of the sixty-entry data array, whatever
  the line-break logic does. A repair that skips the blank entries would also move the line-break count
  and is a regression;
- the **paginated list's own data**: twenty-two items, still all present, and the pager still built from
  that data rather than from a hardcoded button count;
- the **colour variables the defective one sits among**: the neighbouring tokens in the same block must
  still resolve to what they resolve to now, so a repair may not rewrite, reorder or truncate the block
  to fix one value;
- the **menu's declared transition shape**: which properties transition must not change, only how long
  they take, and an open-then-close round trip must leave the same inline values behind on both icons
  and on the panel;
- the **two date-gated banners and the countdown heading**: both banners concealed under the pinned
  clock, the countdown heading still the same kind of element and still empty after its first tick;
- the **video frame**: still a frame, still carrying its accessibility title and its full attribute
  shape, still pointing at the local placeholder, and still concealed;
- **state hygiene**: after a full round trip through the controls the only browser state left behind is
  the four preferences the site's own handlers write - no new storage key, no session storage, no
  cookie, no navigation off the page that was loaded, no query string, no fragment, and no stray globals
  parked on the window. A repair that stashes a flag anywhere else to make a reading pass fails here
  even if every other check goes green.

Fix the defects at their root cause. Do not special-case a reading, do not hardcode a colour, a count, a
page size or a default, do not delete an element to make a symptom go away, do not rename something the
rest of the page addresses by name, do not swallow an error, and do not narrow what the playlist, the
paginated list or the lyric page is allowed to render.
