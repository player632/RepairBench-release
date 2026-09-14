# Repair brief — a small Angular todo application (`repair-angular__ng-lite-todo-01`)

## What you are handed

A working tree of a small single-page todo application: one screen, no routing library, built with
Angular 15 standalone components. From the top of the page down it renders a heading, a field that
adds an item, the list of items with a tick box on every row, and a dropdown that switches between
the all / active / completed views. Behind those widgets sits a small data layer that owns the
list, talks to the transport and keeps its own copy of the rows; the widgets never hold the list
themselves. The application is compiled to a static bundle, served from that bundle, and exercised
in a real browser at a fixed 1440x900 viewport.

The tree you receive is **not** the working tree. A number of separate defects were introduced into
it. They are independent of one another, they are all in the application's own source, the build
still succeeds and nothing throws: every one of them leaves a plausible-looking screen on display
and moves a reading somewhere behind it. Your job is to find them and restore the behaviour the
working tree had.

## How this is graded

A fixed behaviour map of 42 checkpoints is run against your tree in a real browser after it
has been built and served:

* **12 fail-to-pass checkpoints** — one per defect. Every one of them is red on the tree you
  are handed and must be green when you are done. Each is carried by a single reading, so a
  checkpoint cannot be satisfied by rebuilding the widget that observes it.
* **30 pass-to-pass checkpoints** — behaviour that is already correct and must stay correct.
  They cover the seed's own authored styling, its document metadata, the shape of the requests the
  data layer makes, whether the widgets still reflect the view the application is on, and an
  explicit check for residue left behind in browser storage or on a global.

Reward is 1.0 only when both partitions are fully green, and 0.0 otherwise. There is no partial
credit for fixing nine defects and breaking a tenth, and none for deleting a feature to silence a
report.

## Reports filed by people who use the application

These were written by users, not by engineers, and filed independently of one another. They
describe what was seen, not what is wrong, and they carry no priority ordering.

**Not every defect is described in these reports.** Some of the reports below describe behaviour
that is correct as designed.

1. "The browser tab has stopped naming the view. It used to read 'Todo - All tasks', 'Todo - Active tasks' or 'Todo - Completed tasks' depending on where I was. Now it sits on the plain application name whatever I open, so all my tabs look identical."

2. "Opening the application fresh no longer starts me on the all view. Before I have clicked anything the address bar already says I am on the completed view. It used to settle on the all view every single time."

3. "I type a new item and commit the field, and the row never shows up. The list stays exactly as it was, five items, however many times I add. It used to put the new row at the bottom straight away."

4. "The Active entry in the dropdown shows me the wrong things. I pick Active and I get back the two jobs I have already finished instead of the three that are still open - it reads as if the view is backwards. The all view and the completed view both still look right to me, it is only Active."

5. "The Completed view is no longer a subset. I pick Completed and every item is listed, done or not done - it is exactly the same list as the all view. Active still behaves, it is only Completed that stopped filtering."

6. "The list keeps re-sorting itself. My items used to stay in the order they went in; now they come back alphabetically, which puts 'call the dentist' above 'walk the dog' for no reason I can see. Nothing is missing, it is only the order."

7. "The dropdown does not filter anything any more. I choose Active and the list stays on everything; the address bar flips back to the all view on its own even though the dropdown still shows the choice I made. Picking Completed does the same."

8. "The big heading at the top of the page is wrong. It shows 'todo' in lower case, but the application's name is the capitalised TODO and I am certain that is what used to be there - something is mangling the letters. The strange part is that when I select the heading and copy it, the text I paste back out is the capitalised version, so what I see and what is actually there disagree."

9. "The checkboxes look broken to me. There is no native checkbox control visible at all - the input is there in the DOM but it has zero width - and instead each row paints a flat grey square that turns solid blue with a small white tick when it is done. It does not look like a checkbox widget and I think the styling for the list has been corrupted."

## Ground rules

* Repair the application's own source. Do not add test hooks or marker attributes, do not
  special-case a selector, do not hardcode an expected value, and do not stash state in browser
  storage or on a global to make an observation pass — the harness checks for exactly that residue
  and it is graded.
* **Not every defect is described in these reports.** Several of them were never noticed by anyone,
  and the absence of a complaint is not evidence that a code path is healthy. An unreported defect
  is worth exactly as much as a reported one.
* Some of the reports above describe behaviour that is correct as designed. Leaving those alone is
  the right answer; "repairing" them is graded as a regression, because the behaviour they describe
  is guarded.
* Do not repair a report by deleting the feature it describes.
* Keep the build green. A tree that does not compile scores 0.0 whatever else was fixed.
