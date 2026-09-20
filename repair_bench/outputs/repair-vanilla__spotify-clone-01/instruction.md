# Repair task — a vanilla multi-page music front end

## What you are looking at

A self-contained music browsing front end written as plain documents, plain stylesheets and
one plain engine script. There is no framework, no build step, no dependency directory, no
package manifest and no test suite anywhere in the tree, and you must not add any of them.
Open the entry document at the source root in a browser and everything runs as shipped: the
engine script reads three JSON catalogues over HTTP (twelve tracks, seventeen performers,
fifteen moods) and renders three horizontally scrolling rails on the home view, a sidebar
with a recently played list, a top bar with a search field, a desktop navigation group and a
separate mobile menu, and a signed-out / signed-in chrome switch.

Opening a track does **not** navigate. The engine fetches a track fragment document over HTTP
and writes it into the track pane, so the fragment replaces the home view in place. The track
pane therefore shows artwork, the track title, a credits line, a lyrics pane with a
show-more / show-less control, a related-performers panel, and a player bar pinned to the
bottom of the window with previous / play / pause / next controls, a seek strip, a
now-playing label and a clock. The fragment document carries its own style block, and that
style block is live once the fragment is written into the pane.

Everything is offline: the served face makes no external requests, and the twelve audio
files are in-tree. Keep it that way.

## Ground rules

- 🔴 **Not every problem is reported below.** Seven of the problems a user would notice are
  described here; the rest are not, and you are expected to find them yourself by reading the
  shipped behaviour and reasoning about what the page promises. A fix that only addresses the
  reported list is an incomplete fix.
- Fix root causes in the shipped code. Do not restructure the tree, do not introduce a build
  step, a dependency, a bundler, a preprocessor, a framework or a test harness, and do not
  move, rename, split or merge any file.
- Do not add a network dependency of any kind. No remote stylesheet, font, icon, script,
  image or API call may be introduced.
- Preserve everything that already works. The graded surface includes a large set of
  behaviours that must keep behaving exactly as they do now, so a wide fix that happens to
  change unrelated behaviour is a failed fix.
- Some things that look like bugs are **intended behaviour** and must be left alone. Two of
  them are called out below; changing them counts against you exactly like breaking
  something.
- The card order in the rails is deliberately randomised on every load. Nothing about the
  order of cards is a defect, and no fix should attempt to make the order stable.
- Some shipped behaviour is genuinely broken in a way that is *outside* the scope of this
  task and cannot be fixed from inside it. Leave such behaviour exactly as it is; do not
  "improve" it.

## Reported problems

**R1 — the related-performers panel collapses to a single suggestion.**
Open a track whose performer is not present in the performer catalogue (most tracks in this
catalogue are like that — the performer names in the track data and the names in the
performer data only overlap for two of the twelve tracks). The panel under the lyrics pane is
meant to fall back to a short list of suggested performers when there is no real match. It
now shows exactly one suggestion instead of the short list. When a track *does* match a
catalogue performer, the panel is correct and shows just that performer — that half still
works and must keep working.

**R2 — an unfilled template marker survives on the track pane.**
Open any track. In the credits line just under the big title, a raw template marker is still
visible: the dollar-sign-and-braces form of the words "song dot title" is printed literally
instead of the track's title. The big title itself above it is filled in correctly, so only
the second occurrence is wrong. Nothing else on the pane shows a raw marker.

**R3 — every track claims to have no lyrics.**
Open any track. The lyrics pane shows the "not available" placeholder text for all twelve
tracks, including the ones whose lyrics are plainly present in the catalogue data and were
being displayed before. The show-more / show-less control still expands and collapses the
pane, and the pane is never empty — only its contents are wrong.

**R4 — the queue does not wrap at the end.**
Open a track, then keep pressing the next-track control. When the queue reaches its last
track, pressing next-track does nothing at all: the track pane stays on the last track, the
now-playing label does not change, and the queue does not wrap round to the first track. It
is supposed to be a ring — the track after the last one is the first one. Advancing anywhere
else in the queue still works.

**R5 — the mobile menu is open on arrival.**
Load the home view at a normal desktop window size. The mobile menu panel — the one that
slides out under the menu button in the corner and carries the navigation links, the install
link, the sign-up and log-in entries and the signed-in user block — is already open on
arrival, hanging over the top-right of the page. It is supposed to start tucked away and
only appear when the menu button is pressed. Pressing the menu button still flips it, and
the close control inside it still tucks it away again.

**R6 — the "NEW" badge no longer stands out.**
On the home view, track cards carry a small badge with the catalogue label on it: some say
"NEW", some say "HITS", some say "Top 10". The "NEW" badge used to be visually distinct from
the others — a different badge colour scheme, so a new release caught the eye in the rail.
All badges now look identical. The badge *text* is correct on every card, including the
two-word label, which is rendered as three separate style tokens and always has been; that
is intended and not part of this problem.

**R7 — the player bar is not attached to the window any more.**
Open a track and press the play control. The player bar appears, but it is no longer pinned
to the bottom of the browser window: it sits inside the track pane's own content flow, so it
appears wherever the end of the pane happens to be and it scrolls away with the text instead
of staying put. It is supposed to stay glued to the bottom edge of the window at all times,
above the page content, while it is showing. Hiding and showing it still works: it is absent
before you press play and present after.

## Two things that are NOT problems — do not "fix" them

**N1 — every track appears twice in the home rail.**
The trending-tracks rail on the home view lists all twelve tracks **twice**, so twenty-four
cards for a twelve-track catalogue. This is the shipped behaviour of the page and it is not
a rendering bug. The performers rail and the moods rail, by contrast, each list their
catalogue exactly once (seventeen and fifteen cards). Do not de-duplicate any rail, do not
make the multiplicities consistent with each other, and do not change how many times any
loader runs.

**N2 — the recently played list grows without limit and keeps repeats.**
Every single play action appends one more entry to the sidebar's recently played list:
opening a track from a rail, and every press of the next-track or previous-track control.
The list is never trimmed, never de-duplicated and never capped, so playing the same track
three times leaves three identical entries. That is the shipped behaviour. Do not add
de-duplication, a cap, a most-recent-first reorder or a trim.

## What "fixed" means

The graded surface is the behaviour of the served face in a desktop-sized window with no
network access: the home view and its three rails, the track pane and everything the fragment
brings with it, the player bar, the sidebar, the mobile menu, and the signed-out / signed-in
chrome. Every reported problem above must be gone at its root cause, the unreported ones
must be gone too, the two intended behaviours must be untouched, and every other observable
behaviour of the page must be byte-for-byte the same as it is now.

Nothing in this task requires a build, an install, a network call or a new file. If your fix
needs any of those, it is the wrong fix.
