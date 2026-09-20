# Repair Task - spartan-admin-dashboard (Angular 22 + TypeScript, an admin dashboard on spartan/ui)

You are working on the source code of **spartan-admin-dashboard**, an admin
template built with Angular 22 and TypeScript 6 on the spartan/ui component set
(Tailwind 4, signals-based state, standalone components throughout). It is a
whole application rather than a library: a shell with a collapsible sidebar, a
header, a command palette bound to Ctrl/Cmd+K, and a set of feature routes that
sit behind a login - two dashboards, a users table, a calendar, a kanban board,
a file manager, a settings page, an assistant page, and the authentication
screens.

Three cross-cutting concerns sit underneath the shell, and they are worth
knowing about before you read the reports because several symptoms land on the
same surfaces:

- **Appearance.** A stored preference, the operating system's own light/dark
  choice, and two controls that change it - the switch in the header and the
  two entries in the command palette - all feed one resolved appearance, which
  is written onto the document and remembered for the next visit.
- **Language and writing direction.** Three locales (English, French, Arabic)
  across 33 translation files, switchable at runtime from the command palette.
  Arabic is right-to-left, so a language switch also has to turn the whole
  layout around, and assistive technology has to be told which language it is
  now reading aloud.
- **Session.** A credential in browser storage, a session user synthesised from
  it, and a guard in front of every route in the shell. Signing out is supposed
  to end the session for the next person on that machine.

Everything the app renders comes from local fixture data (200 users, six
folders and eleven files, ten header alerts, calendar and kanban rows) and from
the translation files, so the whole graded surface is deterministic and works
with no network at all.

**How your work is checked.** The verifier restores the project's dependencies
offline, builds the app with the project's own local Angular CLI
(`./node_modules/.bin/ng build`) and then runs the project's own i18n optimiser
over the built translation directory - both steps, in that order, because the
served app reads its labels out of that directory at runtime - serves
`dist/spartan-admin-dashboard/browser` from a static origin, and drives the
resulting app in a headless browser at a fixed 1440x900 viewport, en-US locale
and UTC timezone. Every check is a real interaction on a real route: signing in,
opening the palette, picking an appearance or a language, searching and paging
and resizing the users table, opening the file manager, opening the header's
alert list, dismissing and marking alerts read, waiting for a countdown to move.
Each interaction is followed by reads of the resulting DOM and of the browser
state around it - what an element's text says, which attributes the document
root and the body carry, how many rows or markers or cards are rendered, what a
control's accessible name is, what sits in `localStorage` and `sessionStorage`,
whether any global or URL residue survives the interaction. Every check starts
from a **fresh browser context**, so nothing - not a stored preference, not a
credential, not a page index, not an alert's read flag - carries over between
checks; whatever a check needs, it sets up itself.

Because the checks read the live app rather than the source, three habits lose
points here:

- Do not add state, markup or a special case in order to make a reading come out
  right. A value hardcoded for one route shows up exactly where it was
  hardcoded, and a repair that publishes state on `window`, in storage or in the
  URL is checked for directly.
- Do not delete or disable a feature to silence a report. Every graded symptom
  also has checks that read its neighbourhood through a path the defect does not
  touch, so removing the header switch, the alert badge, the trail above the
  page title, or a column of the users table turns those checks red instead.
- Keep the app offline and keep it building with the two commands above. The
  build the verifier serves references no remote stylesheet, font, script or
  image, and no check depends on the network.

Two more things about the graded surface, because they are easy to trip over:

- The users table's two-letter avatar labels and its status column are
  **intended** behavior, and there are checks that pin them exactly as they are.
  Two of the reports below complain about them. Both complaints are wrong.
- The header's alert list, the command palette and the appearance switch look
  like three separate concerns but share the shell underneath, and the users
  table's search box, its filters and its pager are three views over one data
  source. A change made for one of them shows up in the others.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the source tree. The root cause is frequently in a different file
  than the one the symptom appears in, and in a different layer than the one you
  can see: the shell's shared concerns, the small formatters the templates run
  their values through, and the table's own controls are three different layers
  a single visible symptom can sit on top of.
- At least two reports describe behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Several of the things that are broken in this build nobody reported at all,
  and they are graded all the same - some of them only show up on a second
  visit, in a mirrored layout, in what a screen reader is told, or in what is
  left behind after you sign out. Behaviors you break while fixing other things
  still count against you.
- The build must still succeed with the two commands above when you are done.

The reports, in no particular order:

1. "I set the dark theme from the palette on Friday and it stayed for the rest
   of the session, fine. Monday morning the dashboard is back in the light
   theme even though I chose Dark - my pick did not survive the weekend. And a
   refresh forgets it too, so it is not just the new tab: I choose dark, it
   goes dark, I hit F5 and I am squinting at a white screen again. Choosing it
   a second time works, which is why I kept not raising this."

2. "Searching a phone number finds nobody. I paste a colleague's number into the
   search box above the users table - the full international form with the
   plus, or just the local digits, I have tried both - and the table empties
   out and tells me there is nothing there. Searching the same person by name
   works, and by email works. The numbers are definitely in the data, I can see
   the column right there with the value in it. Only the search box refuses."

3. "The file sizes in the file manager are all wrong. A folder I know is about
   one and a half gigabytes is displayed as a fraction of a terabyte, and the
   small ones are worse - a document that is clearly a few hundred kilobytes
   reads as a decimal megabyte. Nothing shows a sensible number any more. Every
   single entry is off, in both the card view and the list view, and they are
   all off in the same direction, which is why I think it is one thing and not
   twelve."

4. "Changing rows-per-page while on page 3 leaves me on the wrong slice of the
   list. I am three pages into the users table, I switch the page size from ten
   to fifty so I can see more at once, and the pager still says three - of
   four. So I land somewhere in the middle of the data with no idea where, and
   the first rows I see are not the first rows of anything. If I do it from
   page one it behaves, which is how I worked out it is about where I was
   standing when I changed it."

5. "The bell badge and the unread dots disagree. The header says four unread,
   and when I open the list there are six rows with a dot next to them. I
   counted twice. It is not that the list is showing me old items either - six
   dots, six rows marked unread, and the number on the bell is a different,
   smaller number. Marking one of them read moves the dots but the badge still
   does not agree with what is on screen."

6. "The breadcrumb only ever shows Home. I am two levels deep - I went into the
   dashboard section and then into one of the two dashboards - and the trail
   above the page title has one entry in it, 'Home', with nothing between it
   and where I actually am. It used to show the section I came through and then
   the page. Now there is no way to jump back up one level, and no way to see
   which section I am in."

7. "The avatar initials in the users table are wrong. The first row is a man
   called Mathew Gulgowski and his circle says `MA`. That is not his initials -
   his initials are `MG`. It looks like it is taking the first two letters of
   his first name instead of one letter from each name. Same on every row:
   `CA` for Carl Gottlieb, `PA` for Patricia Wiza. Somebody's initials are
   being computed from the wrong thing."

8. "Some rows in the users table are stuck loading. Their status column just
   shows a little yellow spinner going round and round, forever - I left the
   page open ten minutes and came back and it was still spinning. The other
   rows are fine, they show a proper status with a tick or a cross. It looks
   like the request for those rows never came back and nobody told the table to
   give up."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the application intact -
including everything no report describes. That includes, at minimum: the
appearance the app resolves when nothing is stored and the one it resolves from
the operating system; the header switch and the palette entries both being able
to move the appearance in **both** directions and to remember it across a
reload; the runtime language switch actually re-rendering every label, and the
document telling assistive technology which language and which writing
direction it is now in; the layout mirroring end-to-end for a right-to-left
language and returning to left-to-right for a left-to-right one; signing out
leaving the next person on that machine signed out; the alert list's own
per-row and bulk actions and the counts they keep; the relative timestamps on
those alerts saying something true about when the event happened; the file
manager's two presentations and the entries in them; the users table's sorting,
its filters, its column controls, its selection state and its pager at rest;
the verification-code screen's own submit path and the credential it writes;
the trail above the page title on routes that only have one level; the
inert fixture data behind all of it; and every reading that is already correct.
The app must still build with the two commands above when you are done.
