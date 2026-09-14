# Repair Task - jira-clone-angular (Angular + TypeScript)

You are working on the source code of **jira-clone-angular**, a simplified
Jira-style kanban board built with Angular (TypeScript, standalone
components, Akita stores, ng-zorro UI kit). The project lives in this
workspace; it builds with `npm run build` and the result is served as a
static site. Everything is fully client-side: project data (users, issues)
is loaded from local JSON assets, and all state lives in memory. There is
no backend and the app must stay fully offline.

Quick orientation with the app itself: the board shows four status columns
with issue cards; the toolbar above the board lets you search, filter by
assignee avatar, "Only My Issues" and "Ignore Resolved". Clicking a card
opens an issue popup where you can edit status, reporter, assignees,
priority, description and comments, or delete the issue. The left rail has
icons for searching issues and creating new ones, plus the project
navigation menu.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Board filters are stuck. I tick 'Ignore Resolved' to hide finished
   work, look around, then hit 'Clear all' to get back to normal - and the
   Done column just stays gone until I reload the page. My teammate says it
   worked fine last sprint, no idea what changed."

2. "'Ignore Resolved' does the exact opposite of what it says. I switch it
   on and suddenly EVERYTHING disappears except the Done column. It's
   supposed to hide resolved issues, not keep only them??"

3. "Card ordering in the columns looks upside down. Issues I pinned to the
   top of Done ages ago are now sitting at the bottom and the newest stuff
   floats on top. Backlog looks fine, honestly I mostly notice it in Done."

4. "All the little assignee avatars on the board cards are gone. The cards
   still open normally and inside the popup the people are still listed,
   but on the board itself every card is just text now. Feels empty."

5. "In the issue popup there's a hint 'press M to comment'. I press M and
   nothing happens - the comment box never focuses, I always have to click
   into it with the mouse. Keyboard workflow is broken for me."

6. "Assignees: when I add another person to an issue in the popup, everyone
   who was assigned before instantly drops off and only the person I just
   added remains. I had two people on a ticket, added a third, and ended up
   with only the third. Very embarrassing in standup."

7. "Tiny one: the menu entry for the settings page is mislabelled - it
   reads 'Project Setting' without the trailing s. Looks unpolished, please
   fix the wording."

8. "There is this constant snowflake animation drifting over the whole app,
   like some Christmas easter egg. It's really distracting in a project
   management tool - looks like seasonal leftovers someone forgot to remove.
   Can you take it out?"

9. "Every time the page loads there's a big loading spinner flashing for a
   moment before the board appears. Feels like an unnecessary delay to me -
   the board should just render instantly without any spinner at all."


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
