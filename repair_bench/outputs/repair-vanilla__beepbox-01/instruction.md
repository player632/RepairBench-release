# Repair Task - beepbox (vanilla TypeScript)

You are working on the source code of **beepbox**, an offline chiptune
composition editor written in TypeScript against a hand-rolled DOM
building DSL (no framework). The editor opens with a small demo song
already loaded - eight bars, four channels (three pitched, one noise) -
and offers a tempo control, per-channel mute buttons, an FM operator
panel for the first channel's instrument, scale and key dropdowns, a
track view where bars are assigned patterns, a pattern editor for
drawing notes, and transport controls for playing and pausing. The
project in this workspace builds with `npm run build` into a
self-contained `website/beepbox_offline.html`, which is served at the
site root. There is no backend to start and no network access.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors
  you break while fixing other things still count against you.

The reports, in no particular order:

1. "The tempo control feels broken. I type a new number into the tempo
   box and the song does pick up the new speed, but the little tempo
   slider next to it never moves - it just stays frozen at whatever
   position it had before, even though the number I typed is clearly in
   effect."

2. "The mute buttons don't do anything. I click the mute button under
   any channel and nothing happens at all - the channel keeps playing
   and the button doesn't even look pressed. I've tried every channel,
   same result."

3. "The FM operator panel is editing the wrong thing. My first channel
   uses an FM instrument with four operators. When I drag the volume
   slider for operator 1, 2 or 3, operator 1's volume never changes -
   instead the change always lands on the fourth operator. Only the
   fourth slider seems to control what it says it controls."

4. "I can't switch patterns from the track view anymore. There's that
   transparent dropdown that sits over the bar grid - I use it to point
   a bar at a different pattern. Now, the moment I pick another pattern
   in it, nothing changes in the grid, and the browser console spits
   out an error. It used to work."

5. "The play button never turns into a pause button. I press play, the
   song audibly starts, but the transport still shows the play icon the
   whole time - I have no way to pause from the button and it looks
   like nothing is playing."

6. "The scale dropdown picks the wrong scale. I choose a scale from the
   list and the editor applies the one right below it instead. If I
   want the fifth option I have to select the fourth. It's shifted by
   one for every entry."

7. "Every time I click an empty spot in the pattern editor, a note
   appears right there. I just wanted to park the cursor or look around
   - I didn't ask to draw anything. Can you make plain clicks stop
   creating notes?"

The editor must remain fully offline; do not introduce any network
access. Do not break song loading, editing or playback while fixing the
reported problems.

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
