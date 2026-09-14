# BULL RUSH — player reports from the current build

You are looking at a browser build of BULL RUSH, a three-lane endless runner in
which every charge is supposed to be replayed and verified rather than simply
trusted. This build runs entirely offline, with no service in front of it, so
anything that would normally be fetched degrades quietly to whatever the page can
do on its own. That offline degradation is deliberate and is not part of what
needs fixing.

What follows are reports from players and from a couple of internal sessions. They
are in no particular order, some of them are vague, and some of them contradict
each other. Read them as complaints, not as a specification, and form your own
picture of what is actually wrong.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

## The reports

1. "The opening of every charge is empty. I mean completely empty — nothing to
   dodge, nothing to collect, just a long free runway. It used to throw you
   straight into traffic from the first second. Now the course only starts being
   a game after a while, and the things that are supposed to be able to end a run
   outright never show up early any more."

2. "If I hold left, or mash it, the bull slides clean past the left-hand lane. It
   ends up outside the barrier running on nothing and the view just follows it out
   there. Right is fine, and a single tap left is fine. It only goes wrong when I
   keep pushing left."

3. "RUN IT BACK is a lie. I die, I hit it, and I do not get a fresh charge — it
   picks the run I just died on back up, and the death summary keeps coming back
   on top of whatever I was doing. Restarting from the leaderboard screen does the
   same thing."

4. "The Finality Board is sorted backwards. My longest charge of the session is
   sitting at the bottom and the shortest one is at the top like it is first
   place. Run it twice and the order is simply rising instead of falling."

5. "Squad links stopped sticking. Somebody sends me a link with their squad code
   on it, I open it, and the code is never remembered — no squad tab appears, the
   board never grows one, and opening the same link a second time does not help."

6. "The opening crawl hangs. First line, then the second line, and then it just
   sits there. It never finishes on its own and never gets me to the menu — I have
   to click to escape it. It used to walk through all four lines and drop me at
   the menu by itself."

7. "The health readout has too many slots. I count four pips across the top of the
   screen but only three of them are ever lit. The fourth one is dark from the
   very first second of a charge and never changes no matter what hits me."

8. "There is no music whatsoever. The radio chip is sitting there in the corner,
   it cycles through all five moods and it remembers the one I picked even after I
   reload, but not one of them ever makes a sound. Is audio just dead in this
   build?"

9. "The leaderboard looks half-finished. The header says LOCAL, there is no ALL
   TIME / DAILY / WEEKLY strip, and it never shows anybody else's runs — only
   mine, and only after I have charged. On an offline build with nothing behind
   it, is that simply what we get now?"

## Constraints

- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.
- The build is served with no network access at all. Anything that used to talk to
  a service has to keep degrading quietly instead of throwing or hanging.
- Keep a published course reproducible: charging the same published course again
  has to produce the same run, and a recorded run has to mean what it says it
  means when it is checked later.
- Fix the behaviour, not the reporting. A readout that has been made to agree with
  a broken rule is not a repair.
