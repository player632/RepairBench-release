# Repair Task - a browser idle game about mining a joke coin (React)

You are working on the source code of a **browser idle / incremental game**
built with React 17, TypeScript and Vite. The player mines a joke
cryptocurrency, watches its price walk on a chart, buys miners and
property, splits capacity between mining and research, hires staff, posts
to a social feed, and eventually flies crewed missions to the moon. A
fixed-interval loop drives everything: each pass through it advances the
clock, adds freshly mined coins, updates the recorded peak figures, and
every so often re-rolls the market price. Progress is written into the
browser's own local storage so a run survives a reload, and a level ladder
unlocks further panels as the player's holdings grow.

The project lives in this workspace and is fully offline. There is no
backend and no network access: the visitor-analytics beacon that the
upstream build phones home with has been made inert, and a small local
fixture stands in for everything else that used to come from outside. That
fixture is part of the environment and not part of the task - it is not a
defect, and it must not be modified, stubbed out or worked around. What it
does, so that the numbers you see are not mysterious: it starts every run
from the same fixed mid-game save (the same holdings, the same staff, the
same two properties, the same single recorded mission), it replaces the
coin-toss behind the market and the missions with one fixed reproducible
sequence for a given page address, it holds the clock still, and it exposes
a small read-out strip carrying the internal figures the interface itself
does not print. The app is built into a static bundle and has no
client-side routes of its own, so everything is reachable from the one
page.

Because every run starts from that same save, the reports below were
collected across several sessions on this build and are not all
reproducible from that save at the same moment: some describe what a
player saw early in a run, some what they saw only after a mission.

QA collected a batch of player reports about this build. They are quoted
below roughly as players wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Since the last update my saved game loads and then simply does not
   run. The price chart sits flat, my holdings never change, and the
   little counter that shows how long the game has been going stays on the
   same number forever. It is not dead, though: if I open the settings
   dialog, press pause and then press it again, everything starts moving
   normally. It just refuses to start on its own after a load."

2. "My 'most coins ever held' figure has stopped being a record. It used
   to remember the highest amount I had ever reached; now it just follows
   my current balance around, so the moment I spend or sell anything the
   supposed record drops with it - and it never climbs back up to the old
   high afterwards either."

3. "Moon launches are exactly backwards. I ground out the research, got
   the printed odds right up, launched - and the rocket broke up and I
   lost the whole crew. Then a friend who had done no research at all
   launched with the odds sitting at zero and landed first try. The better
   prepared you are, the more certain you are to explode."

4. "When I slide the mining/research split towards research, my mining
   speed goes UP instead of down. With the slider pushed all the way onto
   research my hash rate is about twice what it is with the slider at
   none, and the research speed rises as well. That slider is supposed to
   be a trade-off between the two, so one of the two sides is wrong."

5. "Early in a run the cheapest miner button stayed greyed out when it
   should not have. It was priced at fifty dollars and I had a little over
   a hundred in the wallet. The other two miner buttons behaved normally.
   Oddly, once I had a couple of hundred it lit up, and it then charged me
   exactly the fifty the button had been printing - so the price shown on
   the button and the rule that greys it out do not agree with each other."

6. "I paid the five thousand for the server warehouse and my property
   list came up with a mining pool instead. The server speed bonus never
   turned up anywhere, and the buy button for the warehouse is still
   sitting there as though I had never bought anything."

7. "Hiring the social media manager is priced at one million coins, and
   the button stays greyed out until you actually hold that many coins,
   which took me forever. When I finally hired them, the coin balance did
   not move at all - my dollar balance went to a huge negative number
   instead. The hire itself went through and they show up on my staff
   list, so it is only the wallet it charged that is wrong."

Two more things players noticed, but we are not sure whether they are
actually broken:

8. "The three miner buttons each carry a little hint reading '+5 hash
   rate', '+25 hash rate' and '+70 hash rate'. When I actually buy them my
   hash rate goes up by 10, 50 and 140. Is the hint text simply out of
   date, or are the amounts the game uses the wrong ones?"

9. "On the record card shown after a successful moon landing, the
   'Casualties' line and the 'Failures' line always print exactly the same
   number, on every landing I have ever had. Crew losses and failed
   missions are not the same thing to me, so one of those two lines must
   be reading the wrong figure - or is that card meant to show the same
   number twice?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app.
  Focus on reading the code and fixing root causes.
