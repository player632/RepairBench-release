# Repair Task - TailAdmin (a free React + Tailwind CSS admin dashboard template)

You are working on the source code of **TailAdmin**, an open-source admin
dashboard template written in TypeScript with React 19, Tailwind CSS v4 and
Vite. It is a single-page app with a client-side router: a fixed sidebar of
navigation entries (several of them opening a submenu of their own), a header
with a sidebar toggle, a command-style search field, a theme switch, a
notification bell and a user menu, and a content area that renders one page per
route.

What is on screen: an e-commerce dashboard on the served root (a statistics
block with a date-range picker and a line chart, a monthly target gauge, a
monthly sales chart, a demographic card and a recent-orders table), a user
profile page, a calendar that carries three seeded events and an add/edit event
dialog, a blank starter page, a form-elements page (input states with live
validation, a grouped phone-number input, a multi-select with removable chips,
dropzones, switches and more), a basic-tables page, and a run of UI-element
showcase pages - alerts, avatars, badges, buttons, images, videos, line chart
and bar chart - plus sign-in and sign-up screens. Any address that is not a
registered route falls through to a "page not found" screen. The chosen colour
theme is the only thing the app keeps in the browser's own storage; there is no
backend, and nothing in the flows QA exercised talks to a server.

The project lives in this workspace and is fully offline. Dependencies are
supplied as an already-installed tree, the production build is written to
`dist/` and served as the site root, and the build writes nothing back into the
source tree. Because the machine has no network access, a few things are
degraded or pinned **on purpose** and are **not** defects - please do not
"repair" them:

- The app no longer downloads its own webfont from a font CDN. The font stack
  still names that family first, so the text simply falls back to the local
  sans-serif. Typography looking slightly different from the marketing
  screenshots is expected.
- The four video frames on the videos showcase page no longer embed a
  third-party player. Each frame keeps its element, its title and its
  aspect-ratio box, but loads a blank same-process document, so the page opens
  without reaching out to any external host.
- Dates are pinned so that a run is reproducible. The calendar always shows
  August 2025 with the same three seeded events, the statistics date-range
  picker on the root dashboard always reads the same fixed week, and the
  copyright year on the not-found screen is a fixed number rather than the
  current year.
- A few links in the markup still name external sites (an upgrade link at the
  bottom of the sidebar, and the social profiles on the user profile page).
  They are inert unless somebody clicks them, they are meant to stay, and
  nothing in this task asks you to follow them.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different module
  than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- **并非所有缺陷都有报告提及** - not every defect is mentioned in these
  reports. Behaviors you break while fixing other things still count against
  you, and a defect nobody reported is still a defect.
- Do not remove, rename or repurpose any `data-testid` attribute - they are
  verification probes required by the checker. Adding your own is fine.

The reports, in no particular order:

1. "The dark-mode button in the header does nothing. I am on the light theme, I
   click it, and the page stays exactly as light as it was - once, twice, ten
   times. The button is not dead though: I can see it reacts to the mouse. It
   just never takes me to the dark theme."

2. "The sidebar will not collapse. There is a toggle for it up in the header and
   clicking it does not narrow the sidebar at all - it stays full width with all
   the labels showing, however often I click. On a narrow window the mobile
   drawer still opens and shuts fine, so it is only the wide-screen collapse
   that is stuck."

3. "The red dot on the notification bell never goes away. I click the bell, the
   list drops down and I can read the notifications, but the little dot is still
   there afterwards, and it is still there the next day. It used to clear as
   soon as I had opened the list."

4. "The phone-number field on the form elements page will not keep the country I
   choose. I pick another country from the country dropdown and it jumps
   straight back to the very first country in the list. Strangest part: the
   dialling code printed next to the box *does* change to the country I picked,
   so the field clearly heard me - only the selected country snaps back."

5. "The e-mail validation on the form elements page is backwards. When I type a
   perfectly good address the box turns red and shows the error message, and
   when I type obvious rubbish like `abc` it turns green and tells me it is
   valid. It is exactly the wrong way round."

6. "Editing a calendar event rewrites the wrong ones. I clicked the first event
   in the month, changed its title in the dialog and saved. The event I had been
   editing still showed its old title afterwards, and two other events that I
   never touched had both picked up the new title. Deleting an event still
   works, it is only saving an edit."

7. "Is the sidebar's '404 Error' entry broken? Clicking it just shows the
   generic not-found screen - the big 404 and the line about not being able to
   find the page you are looking for. I expected a proper error page of its own
   there. Before I file this as a bug: is that maybe what it is supposed to do?"

8. "One more from the calendar, and I am not sure whether this counts: if I open
   an event to edit it, type a new title, and then press Escape instead of
   saving, everything I typed is thrown away and the event is unchanged. I would
   have expected it to keep my text, or at least to ask me. Is that intended?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself during
  the session; a separate verifier installs nothing, rebuilds from your tree and
  drives the app in a browser. Focus on reading the code and fixing root causes.
- Repair the root cause in the application code. Do not special-case the
  verification probes, do not hard-code an expected value, and do not delete a
  feature to make a symptom disappear.
