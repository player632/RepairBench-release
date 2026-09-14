# Repair task: an administration console whose shell behaviour has drifted

## What you are handed

The source of a single-page administration console: a client-side router with
hash-based addresses, a central store for the shell's settings and session, a
component library for the widgets, and a set of small reusable behaviour helpers
that the demonstration panels are built from. The console answers all of its own
data requests in the browser from a built-in demo data layer, so it runs entirely
offline - there is no backend to start and no network access. Sign in with the
demo account `admin` and the password `123456` to reach the authenticated shell.

The console is delivered as source. The checker builds it and drives the built
application in a browser, so a repair only counts if it survives a production
build and shows up in the running interface.

## What users report

1. On the panel that demonstrates "click outside to dismiss", clicking a control
   that sits **inside** the highlighted area is reported as a click *outside* it:
   the status line flips to the outside wording while the pointer is still working
   inside the box. Clicking the box itself reads correctly, and clicking far away
   on the page also reads correctly - it is only clicks on children of the box
   that come out wrong.

2. On the panel that demonstrates a **deferred** action, pressing the button three
   times in quick succession produces three confirmation toasts instead of one.
   A single press behaves exactly as it should: nothing appears immediately, then
   one toast after the usual short delay.

3. The watermark demonstration panel is covered by an opaque painted block. The
   page copy is still underneath, but a fixed-size rectangle now sits in the
   middle of the panel and pushes the layout open.

4. The appearance control that hides the logo block at the top of the sidebar does
   not hide it - the logo stays put after the option is switched off. Other
   switches that write a single setting (for example collapsing the sidebar) still
   behave normally.

5. After signing in, the **side navigation is completely empty**: no groups, no
   entries, just blank space under the logo. Strangely the console is not broken -
   if you already know a page's address you can still open it and it renders
   normally, the header, the logo and the tab bar are all there, and signing in
   itself succeeds. Only the navigation list is blank.

6. Signing out does not sign you out. The page reloads as it always did, but
   afterwards you are still signed in as the same user and you land back inside
   the authenticated console instead of on the sign-in page.

7. In the tab bar, **closing the current tab does nothing at all**: the tab stays
   where it was and the view does not move. The neighbouring controls - reload the
   current page, close the other tabs, close all tabs - all still work.

8. The button on the deferred-action panel feels broken in a second way: when I
   click it, nothing happens *at all* for a moment and the confirmation only pops
   up a fraction of a second later. A button should react instantly. Please make
   it respond right away, and keep the confirmation on screen so I can read it.

9. Two things look unfinished. On the click-outside panel the status read-out is
   completely blank when the page opens - I expected it to say something before I
   click anywhere. And on the landing page there is no confirmation message at all
   after signing in, which made me think the notification layer was dead.

## How the repair is judged

A checker drives the running console in a browser and scores two groups of
observations: the behaviour that must change (one observation per real problem)
and the behaviour that must **keep** working (the surrounding contracts of each
area you touch - neighbouring controls on the same panel, the other operations of
the same helper, the shell furniture, the persistence of a signed-in session, and
the absence of leftover state in storage, in the address bar and on the global
object). A repair that turns a reported symptom green by breaking an adjacent
contract scores zero, so read the surrounding code before you change anything.

**Not every defect is described in these reports.** 并非所有缺陷都有报告提及。
Some of the problems listed above are entangled: fixing one of them will not make
its observation pass until a second, unreported problem in the same area is also
fixed, and you will not be told which. Other defects are not mentioned anywhere in
this document and are only reachable by reading the code or by noticing that a
neighbouring contract check fails. Repairing exactly the seven reported items and
nothing else will leave the console failing checks you were never told about.

Two of the reports above describe behaviour that is **working as designed**. They
are real user complaints, but the console is not wrong about them; "repairing"
them breaks the surrounding contract checks. Decide for yourself which is which -
you will not be told.

## Constraints

- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.
- Keep the console offline-runnable: do not introduce a network request, a remote
  script, a remote stylesheet, a web font or an analytics beacon. The checks run
  with no network access, so anything fetched from outside simply fails.
- Do not disable, stub out or short-circuit the checks themselves, and do not add
  special-case branches keyed on the presence of the verification probes, on a
  global flag, or on storage entries you left behind: the state-isolation
  observations exist precisely to catch that, and they are scored in the group
  that must keep working.
- Do not delete the demo data layer or the persistence of the shell settings; both
  are part of the intended design and both are covered by contract checks.
- Repairs belong in the application source. Build configuration is not the
  subject of this task and changing it will not fix any reported symptom.

## Environment adaptations already applied (not defects, do not revert)

The tree you receive has already been made offline-safe, and these three changes
are **environment** work, not part of the task:

- A statistics bootstrap that used to inject a third-party analytics beacon on
  every load has been disabled. It now does nothing.
- A reference to an externally hosted icon-font stylesheet has been removed. Icon
  glyphs may therefore render as fallback text or empty boxes in some places. That
  is expected, it is not a defect, and no check looks at icon artwork.
- One demonstration panel used to consist entirely of an embedded external web
  page. It now shows a short local placeholder instead.

## Areas that are out of scope

Two panels load third-party content on demand: one embeds a rich-text editor whose
skin is fetched from a package host, and one embeds a map whose script and tiles
come from a map provider. Neither is reachable offline, neither is exercised by
any check, and neither is part of this task. The placeholder panel mentioned above
is likewise never visited by the checker. Do not spend effort on these areas, and
do not treat their blankness as a defect.
