# Repair Task - json-editor (vanilla JS)

You are working on the source code of **json-editor**, a JSON Schema
driven form generator written in plain JavaScript (no framework): given
a JSON Schema it renders a full interactive form - text inputs,
dropdowns, tick boxes, nested objects, and arrays shown as tables or
tabbed rows - keeps the form value in sync with what the user types,
validates the value against the schema, and supports features like
watched fields, template-computed fields and enable/disable of the whole
form. The library is built with `npm run build` (webpack UMD bundle);
the build also packages the project's "advanced" demo page as the entry
point, served offline from `dist/` together with the demo's schema
fixtures. There is no backend and no network access; the demo page shows
a form for a list of persons (name, age, gender, membership, location
with an auto-computed summary line, pets in a table, cars in tabs, and
more), three buttons - Submit, Restore to Default and Disable/Enable
Form - and, under the form, a live JSON preview that always mirrors the
current form value.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different file than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors
  you break while fixing other things still count against you.

The reports, in no particular order:

1. "Typing into text fields stopped registering. I edit the city or the
   name of a person and the live JSON preview under the form never
   moves - the old value just stays there, as if my keystrokes die
   inside the field. Other controls seem to update the preview fine."

2. "The location block has a little summary line that is supposed to
   combine the city and state fields automatically. It only shows
   'null, null' all the time, even when both fields are clearly filled
   in. The two source fields themselves look fine."

3. "In the pets table the row arrows are jumpy: I click the move-down
   arrow on a row once and the row shoots down two places instead of
   one, landing below the row it should have swapped with. Move-up
   behaves normally."

4. "The gender dropdown starts on the wrong option. The form loads with
   the last entry of the list preselected instead of the first one, so
   every person I have not touched shows the wrong gender until I fix
   it by hand."

5. "The membership tick box works in reverse: when I tick it, the value
   underneath flips to off, and un-ticking it turns the value on. The
   box itself moves, the stored value is just always the opposite of
   what it should be."

6. "When I press the Disable/Enable Form button, the form is supposed
   to lock. The layout changes a bit but I can still type into the text
   fields, e.g. the name field accepts input as if nothing happened."

7. "Related to the button: after I disable the form and enable it again,
   the text fields stay locked. The form is supposed to be editable
   again but I still cannot type into them; only a reload helps."

8. "I cannot type into that auto-computed city/state summary line from
   report 2 at all. I think that is the bug - it should let me edit it
   like any other text field."

9. "The age field refuses any value above 99. I am pretty sure that
   upper limit is a bug and the field should happily accept 100 or
   more - please remove that ceiling."

Fix the defects so the form behaves the way the schema, the demo page
and the reports imply it should. Keep the library's public behavior and
API intact; the acceptance checks run against the built bundle and the
packaged demo page.

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
