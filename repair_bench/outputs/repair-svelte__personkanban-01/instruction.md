Subject: A few things feel off in my personal kanban app

Hi, I have been using this kanban board app (the one with the vi-like key bindings) in the browser for a while. It is mostly great, but some behaviors started to feel wrong. I am listing them below - a couple may be my own misunderstanding, so tell me if that is the case.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

1. In text fields, when I am selecting text (that mode where h/l extends the selection) and I press Escape to get back to the regular command mode, the field drops back into typing mode instead. I have to press Escape twice to get out of the field for good.

2. When I attach a new timestamped remark to a card, it lands at the BOTTOM of the remark list. I want the newest one on top, the way it always looked.

3. I cannot move a board to another position anymore. I press the move key, then a direction key, and nothing happens - the tab order never changes.

4. In the system settings dialog, the date format pattern looks wrong - it is not the slash-separated pattern the app used to show by default on a fresh profile.

5. When I click the little add control in a column header, the new card sometimes lands in a DIFFERENT column - specifically the column I had selected just before clicking.

And two things I am not sure are bugs at all:

6. When no column is focused, pressing the add key creates a whole new board, even if the current board is completely empty. I half-expected it to create the first column instead. Is that intended behavior?

7. When I edit the description of a board, the leading and trailing spaces I type are stripped when I save. I suspect that is deliberate - please confirm.

For context, everything else seems fine: the app boots into a single default board, creating columns and cards from the on-screen buttons works, the command palette opens, and the quick entry bar opens. My profile data looks intact.


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
