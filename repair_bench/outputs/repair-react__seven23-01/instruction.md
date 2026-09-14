# Repair Task - seven23 (React)

You are working on the source code of **seven23**, a fully manual
budgeting application built with React 19, Redux 5 and Material UI:
users keep a local account in their currency of choice, record income
and expense transactions by hand against self-made categories, browse
them month by month, watch per-category statistics and balance trends on
a dashboard, repeat transactions on a day/week/month/year schedule,
search through everything they ever booked, and convert amounts between
currencies using the exchange rates they recorded themselves. Optional
cloud sync exists in the product but is not part of this workspace: the
app here runs completely offline against local storage only. The project
lives in this workspace; it builds with `npm run build` (webpack
production bundle, output in `build/`, served from that directory at the
site root). There is no backend to start and no network access.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "The dashboard is supposed to show what came in and went out this
   month. It loads some numbers at first, but when I book a new
   transaction afterwards the month card never updates - I have to
   reload the whole page to see the new total. It makes the dashboard
   feel like a stale screenshot."

2. "On the transactions page I use the arrows to move between months.
   The list below does change, but the month title at the top keeps
   showing the month I came from. I end up on a different month than
   the one the header claims, and clicking again changes nothing."

3. "When I delete a transaction the row simply stays in the list. The
   app behaves as if nothing happened and I can still see the entry,
   even though I confirmed the delete. Only reloading makes it go
   away."

4. "I keep double-checking my balance because I am convinced the month
   total is wrong: I have a transaction marked as pending and I think
   its amount is being counted in the month balance anyway. The number
   looks off by exactly that pending amount to me."

5. "Editing a transaction is broken for me: the moment the edit form
   opens, the amount field is empty. The name and the date are there,
   but the amount is just blank, so I have to retype it from memory
   every single time."

6. "Every transaction I add seems to forget its category right after I
   save it. I pick the category in the form, I submit, and the entry
   shows up without one - my per-category statistics are full of holes
   because of it."

7. "Deleting things gives me no feedback at all. I click delete and
   there is no message, no confirmation, nothing on screen telling me
   the app even registered the action. It feels completely dead."

8. "The search field is painful: I type a name and nothing happens for
   ages, I sit there waiting, and only long after I have stopped typing
   do results finally crawl in. It used to feel instant."

9. "I set up a transaction to repeat weekly, three occurrences. The app
   saves it and shows me the schedule, but in the end only a single
   entry exists in my ledger instead of the three I asked for."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
