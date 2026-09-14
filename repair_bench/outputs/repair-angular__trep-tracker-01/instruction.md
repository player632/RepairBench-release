# Repair Task - trep-tracker (Angular)

You are working on the source code of **trep-tracker**, an Angular 18
(esbuild) project- and task-tracking app: you organise work into
projects, each project shows vertical columns ("lanes") full of task
cards, and the cards carry priorities, dates, notes and tags. You can
fold columns, move and select cards with keyboard shortcuts, open a
Gantt view and statistics charts, search across everything, and quickly
create the next task by pressing Enter while a card is selected. On the
very first launch a welcome dialog offers two choices: start a fresh,
empty project, or try the bundled demo project. The project lives in
this workspace; it builds with `npm run build` (Angular CLI, output in
`dist/trep-tracker/browser/`). The app is fully offline - all data
stays in the browser's local storage, there is no backend.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors
  you break while fixing other things still count against you.

The reports, in no particular order:

1. "I load the bundled demo project, arrange a few things, maybe add a
   card - then I refresh the page, and everything is gone. Back to the
   welcome dialog, as if I never opened the app. Nothing survives a
   reload, it's like the app never saves anything."

2. "Folding a column works, but unfolding never does. The first click
   on the fold control folds the column fine; I click it again and
   nothing happens - the column stays folded, the cards stay hidden,
   and no amount of clicking brings them back. Only reloading the app
   restores the column."

3. "The layout keeps breaking on me. Whenever I resize the app window
   - even on my wide monitor, just dragging the window edge a little -
   the whole project area suddenly squeezes into a cramped
   single-column layout. It only goes away after I reload."

4. "Small thing, but it looks sloppy: on the welcome dialog, right
   under the app title, it prints the version as 'vUnknown'. It should
   show the real release version there."

5. "Adding tasks with the keyboard is broken. I click a card to select
   it and press Enter to create the next task - nothing happens. No
   new card appears, Enter is just dead. I have to use the little
   add-task control under the column every single time, which kills my
   flow."

6. "A colleague warned me the desktop edition of this tool phones home
   to check for updates. I use the web version and I've never seen an
   update notice, so I mainly want reassurance that nothing is secretly
   calling out to a server in the background. If it doesn't, that's
   fine - please don't add any update nag just to look busy."

7. "Honestly, I don't trust the statistics charts. Every time I open
   them I get the feeling the numbers are off somehow. Can somebody
   look at them and tell me whether they are actually broken or I'm
   just paranoid?"

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes -
  they are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce
  network requests or new dependencies. Data belongs in the browser's
  local storage - keep it that way.
- Do not run the project's build or tests to verify yourself during
  the session; the checker builds and verifies your tree as-is.
