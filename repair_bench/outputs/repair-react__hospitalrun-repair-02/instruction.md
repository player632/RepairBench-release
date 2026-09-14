# Repair Task - HospitalRun (React/TypeScript)

You are working on the source code of **HospitalRun**, a browser-based hospital
management frontend built with React, TypeScript, Redux and react-router, on
top of an in-browser (memory-backed) PouchDB data layer. The project lives in
this workspace; it builds with `npm run build` and the static `build/` output
is served for manual checking.

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

1. "When I open a patient's record and click the edit action, the edit form
   comes up completely blank - the name fields are empty even though the
   patient obviously has a name, it is shown right on the record page. I end
   up retyping everything, and saving from that state gets me nowhere."

2. "Every time I try to save changes on the patient edit form I get a red
   error alert at the top of the form. It does not matter what I change or
   how small the change is - the alert shows up on every save."

3. "I add a note to a lab request on the lab page and press the update
   button - the note appears right away, that part looks fine. But later,
   when I go back to the list of labs and open the same lab again, the note
   is gone. I have to retype it every single time."

4. "The patient search feels broken. I start typing a name in the search
   box and the list collapses while I am still typing - I only ever see the
   exact match. Half the time I cannot even confirm who is in the list
   before the filtering kicks in."

5. "I fill in the form for scheduling a new appointment for a patient and
   press the save button - and nothing happens. No error, no message, the
   page just stays where it is. The appointment never shows up anywhere."

6. "On the incident reports list, each row has an action to view the report.
   Clicking it does nothing at all - I stay on the list page and the only
   way I found to open a report is to guess its URL."

7. "Small thing maybe, but the main page shows 'Dashboard' as its title. I
   think that is wrong - it should say something friendlier, like 'Home' or
   the name of the hospital. Please change it."

8. "After I register a new patient, the patient list shows exactly that one
   patient. What happened to all the other patients? The list looks wiped
   every time I start working. This must be a data bug - patients should
   not disappear."