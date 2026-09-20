# Repair Task - Focus (SolidJS + TypeScript, a local-first task manager built with Vite)

You are handed a **workspace** containing *Focus*, a small local-first task manager written in
**SolidJS + TypeScript** and built with **Vite**. It is a single-page app: a marketing landing page,
an onboarding step that creates your first task, and then the workspace itself. Tasks and lists are
persisted in the browser's own **IndexedDB** through the app's model layer, and the app also ships an
optional cloud side - signing in to a Solid POD, syncing, migrating and reading legacy documents -
which is **out of scope here and never reachable in this workspace** (see the scope ruling below).
Strings come from the app's own language files, colours from a small theme helper that writes CSS
custom properties onto the document element, and the whole thing is styled with Tailwind utility
classes. There is a service worker in the build output; it is generated, not authored.

The workspace page is the product in miniature. A **sidebar** lists your lists - the built-in *Inbox*
plus any list you create - and can be shown or hidden. A **content header** carries the current list's
title and the button that opens **search**. The **content body** holds the pending tasks of the current
list, the new-task input, a *Show completed* toggle that reveals the completed section, and the
keyboard shortcuts the app documents. Clicking a task opens its **detail panel**, where you can rename
it, mark it important (the star), give it a **due date**, read when it was created, and delete it.
Every task row shows its name, its checkbox, a star when it is important, and - when it has one - a
relative due-date label such as *Today*, *Tomorrow* or *Yesterday*, painted in a warning colour once
the date is in the past.

The interesting thing about this codebase is that it is **several small layers deep, and the layers
address each other by name**. A row on screen is rendered by a list-item component that reads model
getters; those getters are computed in the model classes; the models are held in service singletons
that react to model events; and a handful of tiny pure helpers in `src/utils/` - date arithmetic,
search filtering, display labels, theme variables, keyboard shortcuts - are called from components all
over the page. So a symptom on screen routinely originates a layer away from where it shows up: a wrong
word in a task row can be a sign flip in a date helper, a search box that ignores you can be a single
comparison operator, and a colour that never appears can be one object key in a palette lookup.

## What the graded surface is

- The **task list of the current list**: which tasks render, in what order, with what row furniture -
  checkbox state, name, star, and the relative due-date label with its past-due styling.
- The **new-task input**: typing a name and pressing Enter creates exactly one task; the input is also
  the target of a documented keyboard shortcut.
- **Completing and un-completing a task**, the *Show completed* toggle, and the way a completed task is
  rendered inside the completed section.
- **Deleting a task** from its detail panel, and what remains of the list afterwards.
- The **task detail panel**: opening it by clicking a task, the name control mirroring the task, the
  important/star control, the due-date control, the created-at readout, closing it with Escape.
- **Search**: opening it, what an empty query lists, and how a query narrows the indexed tasks and
  lists - including queries that match in the middle of a name and queries that match nothing.
- The **sidebar**: showing and hiding it, the label of the built-in *Inbox*, the label of a list you
  created, and the label of a list you **renamed**; the same label also appears in the content header.
- **Keyboard navigation**: which task becomes selected when an arrow key is pressed with nothing
  selected yet, and how selection moves afterwards; mouse selection is a separate path.
- The **theme variables** the app writes onto the document element for the current workspace colour,
  and the surfaces that resolve through them.
- A small **hidden feature** in the detail panel that a user who knows about it can trigger by
  tapping a readout several times in a row.
- **Offline posture**: the graded flow makes **no cross-origin request at all**, and shows no offline
  error anywhere.
- **Browser state**: after a full round trip through the controls, the only things left behind are the
  tasks, lists and preferences the app's own handlers already write.

Everything is served from one origin and **there is no network access at all** while this is checked.

## How the work is checked

- Your tree already carries its dependencies - they are restored offline before you start, because
  this lane has no registry - and it is built with the project's own Vite build,
  **`./node_modules/.bin/vite build`**, which is literally what the `build` script in `package.json`
  runs. The resulting **`dist/`** directory is served statically and driven by a headless browser at
  **1280x720**, locale `en-US`, timezone `UTC`.
- **Do not run `pnpm install` or `pnpm run build` in this workspace.** The pnpm here is a newer major
  than the one this project was written against: before running any script it re-verifies the
  dependency tree, decides a restored `node_modules` is out of date, re-runs an install that fails
  with `ERR_PNPM_IGNORED_BUILDS`, and on the way prepends an `allowBuilds:` block of placeholders to
  `pnpm-workspace.yaml` - a tracked file that no fault asks you to touch. The Vite binary above needs
  no package manager, and it is what the checks build with.
- The checks are **behavioural**: a browser really opens the landing page, really clicks through
  onboarding, really types task names, really presses the shortcut keys, and then reads the DOM, the
  computed styles and the app's own persisted state. Nothing is checked by reading your source text.
- There are **27 checks**. Twelve of them are the faults you have to fix; the other fifteen are
  **guards** that pin behaviour the rest of the page depends on. Your score is the product of the two
  groups: a fix that breaks a guard costs you the whole task, exactly as if the fault were still there.
- Every check runs in a **fresh browser context**, so it starts from an empty profile and goes through
  the app's own onboarding flow before it can look at anything. No check inherits state from another,
  and no check can be satisfied by leaving something behind for the next one.
- The landing page plays an entrance animation and is **not clickable for roughly five seconds** on a
  first and second visit; from the third visit onwards it skips straight through. The checks wait for
  it. This is shipped behaviour, not a fault, and it is not something to "optimise".
- Because the app is local-first, the checks never sign in, never sync and never touch a POD.

## Reading the reports

- Most reports describe **real, reproducible defects**, each with its own root cause. The root cause is
  frequently **not in the layer where the symptom shows up**: components, models, services and the small
  pure helpers in `src/utils/` all address each other by name, so a symptom in a task row is very often
  caused in a helper two layers down, and the layer a reporter blames is not a reliable guide.
- **A report is a witness account, not a diagnosis.** A user tells you where they saw the damage, which
  is not the same place as where it was done. Read the reports for *what* happened and work out *where*
  it happened yourself.
- **At least one fault is hiding behind another.** Something that appears to do nothing may be doing
  nothing because a step it depends on never runs. Repairing what you can see can expose a second fault
  that was unreachable before it, and a check can stay red afterwards for a *different reason* than it
  was red before. That is the expected shape of a correct repair here, not a sign that you failed - but
  it does mean you should keep going past the first thing you fix.
- Two of the things users mention below describe behaviour that is **actually intended**; verify a
  report before you act on it. "Changing" intended behaviour is scored as a regression.
- **Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other
  things still count against you.** (并非所有缺陷都有报告提及。) Some broken behaviour is described
  nowhere below and will only be found by exercising the app - the completed section's styling, the
  keyboard shortcuts and which key really triggers them, arrow-key navigation from a cold start, the
  star control, the due-date label, the palette variables behind the workspace colour, what an empty
  new-task draft does when you press Enter, list renaming, and the detail panel's hidden tap feature -
  rather than by reading the list of reports.
- Keep the rest of the app intact. A fix that makes one report pass by hardcoding a value, deleting an
  element, renaming something the rest of the app addresses by name, swallowing an error, narrowing what
  a list is allowed to render, special-casing the exact string a check happens to type, or inventing a
  new place to stash state will be caught by the guard checks and score zero.

---

## Reports from users

**Report 1 - a task I set for tomorrow is being treated as overdue.**
"I gave a task a due date of tomorrow, and the row now says *Yesterday* and the label is painted in the
red warning colour, exactly the way it looks for a task whose date went by last week. The date I picked
is still the right date in the panel - it reads tomorrow when I open the task - so it is only the row's
summary that is wrong. Tasks with a due date of today look right, and tasks with no due date at all look
right, which is why I am sure the date itself was saved properly."

**Report 2 - search ignores whatever I type.**
"I open search and the list of tasks and lists is there, as it should be. Then I type something - a word
from the middle of a task name, a single letter, complete nonsense - and the list never changes. It is
always the same full list, in the same order, no matter what is in the box. The box itself takes the
text fine and shows what I typed; it just does not do anything with it. Clearing the box also gives the
same full list, so I cannot even tell whether it is filtering at all."

**Report 3 - deleting one task takes the rest of the list with it.**
"I had a handful of tasks in a list, deleted one of them from its detail panel, and the remaining tasks
vanished from the list at the same moment. Not greyed out, not collapsed - gone. The one I deleted is
indeed gone, which is what I asked for, but so is everything else that was pending in that list.
Reloading the page brings the other tasks back, so they are still stored; it is the list on screen that
falls apart right after a delete."

**Report 4 - renaming a list does not rename it in the sidebar.**
"I created a list, gave it a name, and later renamed it. The rename goes through - I can see it took
effect where I made the change - but the sidebar entry keeps showing the **old** name, and so does the
title at the top of the list's own page. Creating a list with the right name in the first place works,
and the built-in *Inbox* entry is fine. It is only after a rename that the sidebar and the header seem
to be reading something stale."

**Report 5 - the star does nothing.**
"I open a task and click the star to mark it important, and nothing happens. The control does not stay
lit, the task does not get a star in the list, and clicking it again does not help either - it just
keeps not working. Renaming the task in the same panel works fine and the panel keeps showing the right
name, so the panel itself is alive; it is only marking a task important that never takes."

---

## Two things users mentioned that may not be bugs

**Observation A - "the app has started phoning home".**
"Since the last update I keep seeing it reach for the network - the browser shows it trying to contact
some outside address, and once or twice I thought I saw an offline error appear. A local task list
should not need the internet at all, and I would like that turned off."

**Observation B - "Escape no longer closes the task panel".**
"I used to be able to press Escape to close the task detail panel. Now I press it and the panel stays
open, so I have to click away instead. I am fairly sure the shortcut was unbound."

Both of these are **normal for this workspace and must not be changed**.

- Observation A describes something that is not happening. The graded flow - landing page, onboarding,
  the workspace, its panels, search, the sidebar and list editing - makes **zero cross-origin
  requests**: every script, stylesheet, font and image it loads comes from the same origin that serves
  it, and no offline error is ever shown. The only code in the app that talks to an outside server is
  the Solid POD path (sign in, sync, migrate, read a legacy document), and none of it runs without a
  logged-in POD, so it never runs here. There is a guard check that fails if you add a network call,
  and another that fails if an offline error appears. Do not "fix" this by stubbing, blocking or
  deleting anything: there is nothing to block.
- Observation B describes a shortcut that still works. Selecting a task with the mouse and pressing
  Escape closes the detail panel; the only case where Escape is deliberately swallowed is while a modal
  dialog is open, which is shipped behaviour. There is a guard check for the Escape round trip, so
  rebinding it, "fixing" it or removing the modal suppression will cost you the task.

---

## Rough edges that are NOT part of this task

- **The five-second landing animation.** The landing page animates in and stays `pointer-events: none`
  until it has finished, so nothing on it is clickable for roughly five seconds on a first or second
  visit; from the third visit on it skips the animation. This is shipped behaviour with a visit counter
  behind it. Leave it alone.
- **The theme cleanup helper is already wrong upstream.** The code that *clears* theme variables walks
  one collection's keys and removes variable names that were never set, so some custom properties
  survive a clear. That is a pre-existing bug in the seed, it is not one of the faults, no check asks
  about it, and "fixing" it will change behaviour the guards may be pinning. Leave it alone.
- **The cloud side is unreachable offline.** Sign-in, sync, migration and legacy-document reading all
  require a Solid POD session. Nothing in the graded surface reaches them, and no check will. Do not
  delete that code and do not try to make it work offline.
- **The seed's own end-to-end suite is not in this workspace.** The Cypress specs and the one Vitest
  spec the seed shipped needed a dockerised community Solid server and a live POD, so they cannot run
  in this lane and they described most of the behaviour that is now being graded; they were removed
  from the workspace on purpose. `vitest` itself is still a dev dependency, because the Vite config
  imports its `defineConfig` - removing it breaks the build. There is no test command to run
  here and you are not expected to write tests.
- **One keyboard-shortcut helper was corrected in the workspace before it reached you.**
  The helper that registers keyboard shortcuts, in `src/utils/composables.ts`, is overloaded: a
  caller may pass either `(shortcut, listener)` or `(shortcut, options, listener?)`. As the upstream
  seed shipped it, the two-argument form built a fresh options object and never put the callback
  into it, so some of the shortcuts the app registers were silently dead. The workspace you get
  restores the overload that the file's own type signature already declares, and nothing else about
  it is different. The correction was already applied while this workspace was being prepared, it is
  identical in every arm of this task, and it is **not** one of the faults: no fault lives on that
  line and no report describes it. Leave it alone - reverting it breaks behaviour the checks read,
  and nothing here asks you to go further than the restored overload.
- **Deep-linking into the workspace with an empty profile** shows the app's own "Are you lost?" page.
  That is the seed's 404 route doing its job, not a fault.
- **Locale-dependent date rendering.** Some dates in the app are formatted with the host locale, so
  their exact text depends on the machine. Checks never read a formatted date; they read the app's own
  named labels (*Today*, *Tomorrow*, *Yesterday*) or a styling fact. Do not replace a formatted date
  with a hardcoded string to make something look stable.
- **Per-item accessibility ids are random.** Each task row generates an id from a UUID, so nothing can
  be addressed by it. Rows are addressed positionally or by their text.
- **A debug console can be enabled from the app's settings.** It is a lazily loaded chunk that only
  arrives when the user turns that setting on. It never loads during a graded run.

---

## Keep the rest intact

Fix the faults where they actually are, in the layer that causes them. Do not special-case the strings
a check happens to type, do not delete or rename elements, classes, hooks, model getters, service
methods or language keys that the rest of the app addresses by name, do not swallow errors, do not
narrow what a list renders, do not move state somewhere new, and do not add a network call. The guards
exist to make those shortcuts score zero, and they are checked on the same run as the faults.
