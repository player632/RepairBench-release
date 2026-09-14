# Repair Task - 1255 Burgomaster (vanilla JS)

You are working on the source code of **1255 Burgomaster**, a browser-based
medieval town-management idle game: the player watches over a small city in
the year 1255, raises walls, towers, homes, a treasury, an inn, a university,
a stable and an archery range, collects taxes each turn as the seasons and
years advance, feeds and grows the population, hires sergeants, turkopols and
knights and eventually a hero, researches technologies, fights auto-resolved
battles against bandits, saves and loads the city, and toggles preferences
such as autosave, night colours, mobile layout and event-log size. The
project lives in this workspace and has no build step at all: it is a plain
static page (the entry point is `index.html`, loading classic scripts from
`js/` and locale tables from `langs/`). There is no package installation to
run, no bundler, and no backend or network access; serving the directory
statically is enough to run it.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "I saved up and raised a tower on top of my wall. The gold that
   disappeared from my treasury was noticeably more than the tower is
   supposed to cost at this stage - I lost a chunk of my savings on a
   single upgrade and I cannot see where it went."

2. "The treasury button on the Building tab is lying to me. I have no
   treasury yet, so it is offering me level 1, and the price it prints
   under that offer is four hundred gold - many times what a first treasury is
   supposed to cost. Nobody can plan their economy around a number like
   that."

3. "Look at the strip along the top of the screen: the gold figure updates
   fine, but the citizen figure never becomes a number. Where my
   population should be, there is just some leftover placeholder text in
   curly braces sitting there from the moment the page loads."

4. "I built the university and opened it, expecting to finally research
   something - I am well past the opening year and I have plenty of gold -
   but the research area is completely empty. Not one thing is offered to
   me, so the whole building is decoration and my gold is stuck."

5. "My wall artwork never grows up. I paid for the second wall level and
   the game accepted it, but the picture on the Building tab still shows
   the same flimsy wooden palisade as at level 1. Only much later does the
   stone castle finally appear."

6. "The little lamp next to the autosave option in Settings shows the
   opposite of the truth. With autosave switched off the lamp is green and
   looks reassuring, and the moment I switch autosave on it turns red as
   if something were wrong. I have no idea whether my city is being saved."

7. "Small thing, but it jumps at you every single time you load the game:
   the first tab in the navigation bar is spelled wrong. It is the name of
   your own city view and it is misspelled."

8. "One thing I could not get to do anything in this copy, in case it
   matters: the link on the How To Play tab that offers a downloadable
   offline copy of the game never gets me anywhere. I click it and I do
   not end up with an archive of the game. I assume that is just because
   this build has no internet."

9. "The panel that is supposed to show the community feed, and the little
   countdown to the next seasonal event next to it, stay empty forever.
   The countdown never counts down to anything and the feed area just
   tells me the widget is not available. Again, maybe that is the missing
   internet."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier serves the page statically and
  drives the app in a real browser. Focus on reading the code and fixing
  root causes.
- Keep every fix inside this workspace and preserve the existing behavior
  of everything you do not intend to change.
