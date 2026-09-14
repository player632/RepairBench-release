# Repair Task - io-808 (React)

You are working on the source code of **io-808**, a browser recreation of the
classic TR-808 drum machine: a step sequencer with twelve instrument rows and
sixteen steps per pattern, two parts per pattern with A/B variations, a mode
knob (pattern clear, pattern write for each part, manual play), transport
controls, tempo and level knobs, and save/load of patterns as JSON files.
Everything the user composes is kept locally in the browser between visits.
The project lives in this workspace; it builds with `npm run build`
(webpack production bundle plus a static tutorial page, output in `out/`,
served from that directory at the site root). The app is fully offline -
there is no backend and all data is local.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "I spent ages programming a pattern, reloaded the page to check
   something, and everything was gone - the steps I wrote, the tempo I had
   set, all back to factory defaults. It is supposed to remember my work
   between visits."

2. "When I pick the second part writing mode and program steps, they never
   show up in the second part. I switch the mode knob to the second part,
   start the machine, tap steps in - and somehow the first part is what got
   written."

3. "I exported one of my patterns with the save button earlier and now I
   try to bring it back with the load button. Either it tells me the file
   is invalid (it was exported by this very app!), or it pretends to load
   and nothing changes at all."

4. "The save button in the top bar is greyed out all the time while the
   machine is stopped, so I can never export my pattern when I am not
   playing."

5. "The little variation lights above the A/B switch are wrong: I flip the
   basic variation switch fully to B, nothing is playing, and the lights
   still show the A side."

6. "The pattern seems shorter than it should be. The first part only runs
   fourteen steps before looping, and when I look closely at the step grid
   the last four columns do not feel like real steps anymore."

7. "There is a little icon in the header that links out to some GitHub
   page. Is that supposed to be there in an offline tool? Should it not be
   removed?"

8. "At the bottom of the page there is a Tutorial link that always opens
   in a new tab. I think it should open in the same tab, this keeps
   confusing me."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
