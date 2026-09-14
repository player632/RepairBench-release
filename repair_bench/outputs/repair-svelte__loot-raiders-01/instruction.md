# Repair Task - Loot Raiders (Svelte)

You are working on the source code of **Loot Raiders**, a SvelteKit +
Svelte 5 arcade game about timed salvage runs: the player starts a run
against a countdown clock, supply crates land one after another on the
drop mat in front of them, and they grab goods by moving them into their
carry before time runs out. Each run carries a list of quests asking for
specific goods - turning in everything a quest asks for completes it and
earns a reward, and clearing every quest in a stage moves the run on to
the next stage. Carrying too much weight for your gear applies a penalty
to what you finally bank, gear can be split, recycled and upgraded, and a
short guided introduction walks new players through the controls on their
first run. When the clock hits zero the run ends with a report screen
that grades the take and lets the player leave a nickname on the local
ranking board. The project lives in this workspace; it builds with
`npm run build` (static adapter, output in `build/`, served from that
directory at the site root). The app is fully offline - there is no
backend and all data is local.

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

1. "After the first supply crate lands, no more ever arrive for the rest
   of the run. I sit there waiting and nothing else drops - a fresh run
   is the only way I can see another crate. It makes longer runs feel
   completely empty."

2. "Finishing a quest is supposed to reward you with bonus time on the
   mission clock - the reward is right there in the quest list. But when
   I turn in the last goods the timer never jumps; the run ends exactly
   when it would have without the bonus. Feels like the reward is never
   actually granted."

3. "The quest list for a stage has several entries, but the moment I turn
   in the goods for any single one of them, the whole stage counts as
   cleared and the run moves on - even though I never finished the other
   quests on the list."

4. "When I split a stack of goods I expect two even halves, the way the
   action has always worked. Instead only a single piece comes off and
   the original stack keeps everything else. I have to repeat it over
   and over to move things around."

5. "My carry weight limit seems stuck at the bare base value. My starting
   gear is supposed to raise how much I can haul, but the game treats me
   like I have nothing equipped - I trip the overweight penalty far
   sooner than I should."

6. "Pressing Escape in the middle of a run does nothing at all; the game
   keeps going. The little pause control on the screen still works, so I
   can pause that way, but the keyboard shortcut is dead."

7. "Not sure if this is a bug: the ranking board feels flaky to me. It
   takes a moment to come up and I keep worrying it has not loaded
   properly or that entries are missing. Maybe it is just my
   imagination."

8. "Minor thing: the pictures on the item cards on the drop mat look like
   they fail to load every now and then - I get the impression of a
   broken image for a split second before it is fine. Hard to catch."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
