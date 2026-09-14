# Repair Task - vue-pure-admin instance (Vue 3)

You are working on the source code of an internal admin dashboard built
with Vue 3 + Vite + TypeScript. Users sign in with a demo account and get
a shell with a sidebar menu, a top bar, a strip of open-page tabs under
the top bar (the home page stays pinned there), a small path indicator
over the page area that shows which menu levels you are in, a global
menu search, and a settings drawer on the right with
theme options and a control that clears local data and returns to the
sign-in screen. Pages you visit are cached so their state survives moving
between tabs. The backend is a built-in mock layer served from the app
itself, so the project is fully offline. The project lives in this
workspace; it builds with `npm run build` (output in `dist/`, served from
that directory at the site root).

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "When I open a page from the menu, its tab never shows up in the tab
   strip - the strip keeps showing whatever was there before, so I lose
   track of what I have open. To make it weirder, sometimes the home tab
   ends up listed twice."

2. "I keep notes in the text field on one of the nested menu pages. Those
   pages are supposed to remember what you typed while you move around.
   But after I refresh the browser tab, the field comes back empty the
   next time I open that page - everything I typed before the refresh is
   gone."

3. "In the settings drawer there is a button that clears everything and
   takes you back to the sign-in screen. It does take you back, but it
   clearly does not clear anything: when I sign in again, the look and
   layout choices I made before are all still there."

4. "I sign in with the admin demo account. Two whole top-level menus are
   missing from the sidebar - the one for managing users, roles and
   departments, and the monitoring one. Other accounts in the team can
   see them. The pages themselves still answer if you know the exact
   address, so it looks like the menu lost them, not the app."

5. "The little path indicator over the page area - the one that shows
   which menu levels you are in - has stopped updating. I move to another
   page and it keeps showing the trail of wherever I was before; it only
   ever matches the page I opened first after signing in."

6. "On the user-management page the enabled/disabled switch in each row
   seems inverted: accounts that are enabled display as disabled, and
   flipping a switch stores the opposite state of what I clicked."

7. "In the settings drawer I chose the dark theme option and nothing
   happens - the interface stays exactly as light as before. Clicking it
   again does nothing either."

8. "Not sure if this is a bug: on the welcome dashboard the user
   satisfaction statistic shows 100 with '+100%' underneath it. That
   reads like a percentage running away past its maximum - or maybe it is
   just how the demo numbers are meant to look?"

9. "Minor thing: one entry in the sidebar is labeled 'chat-ai' in plain
   lowercase Latin letters while every other menu entry has a proper
   Chinese label. Looks like somebody forgot to translate it. Should it
   be fixed?"

For context, everything else seems fine: signing in with the demo account
works, the welcome dashboard renders with its charts, the menu search
opens and finds pages, and logging out from the account dropdown returns
to the sign-in screen.

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
