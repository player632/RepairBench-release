# Repair Task - a browser dashboard for search-server instances (React)

You are working on the source code of a **browser dashboard for managing
search-server instances**, built with React 18, TypeScript and Vite. Users register
one or more search-server instances from a dashboard page, open an instance to see
its indexes and their document counts, browse the documents inside an index (either
as a JSON view or as a table), watch the task queue - the operations the server has
run, is running, or got wrong - with a duration for each, inspect the instance's API
keys, and add, edit or remove instances through a settings dialog that can also
import a previously exported instance list from a JSON file. Routing is file-based
(TanStack Router), server data is fetched through TanStack Query, and the registered
instance list is kept in the browser's own local storage so that it survives a
reload.

The project lives in this workspace and is fully offline. There is no real search
server and no network access: a small local fixture stands in for the servers and
answers every request the dashboard makes from deterministic in-memory data. Three
instances are registered on every run - two healthy ones and one that deliberately
does not answer - and their indexes, documents, tasks and keys are always the same.
That fixture is part of the environment and not part of the task: it is not a
defect, and it must not be modified, stubbed out or worked around. The app is served
as a statically built single-page bundle, so deep links are expected to resolve
without a real backend, and the clock the app sees is frozen, so relative and
absolute times are reproducible from run to run.

QA collected a batch of user reports about this build. They are quoted below roughly
as users wrote them - with their own steps, noise and assumptions. Treat them as
starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different module than the
  one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a report
  before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.

The reports, in no particular order:

1. "In the documents view of an index, one of my document fields holds the address
   of a picture. When I switch that view over to the table layout, the cell used to
   render the picture itself as a small preview. Now it only ever shows the address
   as truncated text, and in the popup that shows the whole field the option to
   display it nicely is greyed out and cannot be switched on. Another field in the
   same document holds the address of a plain text file, and that one behaves
   exactly as it did before, so it is not the whole column."

2. "On the task queue page the duration column is off by an enormous factor. A task
   that clearly ran for about one second is listed with a duration of 1, where it
   used to read 1000. That number is meant to be in milliseconds - the little hint
   shown next to it still says so - so 1 cannot possibly be right."

3. "On the API keys page every single key now reads 'forever' in the expiry column,
   including the one key that definitely has an expiry date set on it. I cannot tell
   any more which of my keys expire and which genuinely do not."

4. "On the task queue page, a task that is still waiting and has not started yet
   shows a start time somewhere in January 1970 instead of being left blank. A task
   that has not started simply has no start time, so a 1970 date cannot be right."

5. "One of my indexes carries a small badge saying that 1 task is still in progress
   on it. Nothing is in progress on that index: the only operation it ever had went
   wrong a long time ago, and nothing has been queued on it or is running on it
   since. The badge never goes away. My other indexes, which really do have work
   queued, still show the right numbers."

6. "When I use the settings dialog to add another instance, the address box comes up
   already filled in with a plain localhost address on the default port. It used to
   be pre-filled with the address of the instance I was actually looking at, so that
   I could copy an existing setup and only change the name."

7. "After I open the task queue page, a 'Request loading...' notice pops up a couple
   of seconds later even though the page had already finished loading, and then it
   sits there for several more seconds before going away by itself. It only happens
   on pages that answer quickly. On a genuinely slow page that notice used to be a
   sensible hint; now it arrives after the work is already done."

Two more things we noticed, but we are not sure whether they are actually broken:

8. "The three instances on the dashboard are numbered 1, 3 and 7. I went looking for
   a number 0 because I half expected the numbering to start there, and there is not
   one anywhere. Is a record missing, or does the numbering deliberately not start
   at zero?"

9. "When I rest the mouse pointer on one of the relative times - the ones that say
   how long ago something happened - the text changes to a full date and time, and
   changes back when I move the pointer away. It does this on every one of them. Is
   that a deliberate convenience, or a glitch?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
