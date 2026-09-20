Repair task: a one-button tapping arcade game

## The page you are repairing

What you have is a small browser game shipped as plain JavaScript and one stylesheet. There is no framework, no bundler, no transpiler, no type step and no dependency directory anywhere in the tree. A landing document at the root of the tree links through to the game itself, which is one further document that loads a single script of its own and a single stylesheet. The tree is served straight off the disk: the directory that is served is the source directory, nothing is compiled first and nothing is fetched from anywhere else, so the files you read are the files that run.

The game is played with one button. A level gives you a fixed number of seconds and a target number of hits; circles appear inside the play area, some of them good and some of them bad, and you tap the good ones before they fade. Every good hit scores, and when the hit counter reaches the level's target the level is cleared, a bonus is awarded for the time left over, and the next level is built with a little less time and a few more hits to land. Run the clock down or tap a bad circle and the run ends instead. Before each level there is a short count, and the whole thing is carried by a set of screens that occupy the same space and swap by being shown or hidden: a splash screen, a main menu, an about screen, a best-scores screen, a how-to-play screen, the pre-level count, the play area, a pause menu, a run-ended screen and a level-cleared screen.

Around the play area the document carries the furniture of the game: a score read-out, a level label, a hit counter with its target, a bar that drains as the level clock runs, a pause control, and the screens listed above with their own headings, figures and buttons. There is also a small maintenance panel, folded away until its own button is pressed, that holds one switch per screen plus a row of labelled rows for jumping straight to any screen; it is part of the shipped page.

The screens the game shows before a real run starts already carry printed figures. Those are the document's own placeholders: when a run actually reaches a screen, the game overwrites what is printed there with the real numbers. They are meant to be there.

The pages are examined at a 1280x720 window with the en-US locale, and every check starts from a freshly loaded page in a fresh browser context, so nothing - not a score, not a level table, not a shown or hidden screen, not a selected switch - carries over from one check into the next.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are starting points, not diagnoses: they are not always precise, they do not always say which of several similar things is affected, and they do not always agree with each other.

1. Score never climbs. I hit three blue circles in a row on the first level and the score read-out stayed at the value of a single hit instead of adding them up.

2. Every level needs one tap more than the counter says. It reaches 5/5 and nothing happens; I have to hit another circle before the level-clear screen shows up.

3. The colours are the wrong way round at the start of a game. I get a whole cluster of the red ones I must not touch and only one blue one to tap.

4. The three-two-one countdown before each level is gone. It flashes for a moment and the level just starts, so I never get the beat to get ready.

5. The pause menu buttons do each other's job. Hitting Continue throws me back to the main menu and wipes the run, and hitting Restart is what actually carries on playing.

6. The pause button has disappeared from the top of the play screen, so once a level starts there is no way to pause it any more.

7. The circles pop in and then instantly shrink away to nothing, so there is never anything on screen to tap. It happens on every level from the first one.

8. Before I start a game the play screen already has numbers on it - a score of 2894, a level label saying Level 7, and a tap counter reading 16/20. That looks like leftover test data somebody forgot to delete. Shouldn't that screen be blank until a run actually starts?

9. The game-over screen says my score was 746 and the paused screen says 521, and the level-clear screen is already titled Level 2 with a score of 521 and a New High Score of 86 - all before I have played a single level. Also the pause screen heading reads GAME PAUSED in capitals while everything else is title case. Are these stale fixtures?

## Not every defect is described in these reports

Not every defect is necessarily mentioned in the reports above, and some of the reports above describe things that are not wrong at all. There are more things wrong with this tree than there are reports, so fixing only what is listed will not finish the job.

Read the page's own logic through, work out what it is supposed to do, and check the parts nobody wrote in about: the arithmetic behind every figure on screen, the boundary of each condition that decides whether something has been achieved, the order in which values are handed from one function to the next, the wiring between a control and the handler that answers it, the rule that keeps a set of choices mutually exclusive, which row of text activates which switch, and anything that only shows up after a timer or an animation has actually run.

Behaviors you break while fixing other things still count against you, including in regions no report mentions. Equally, do not change something that was never broken: a report that describes correct behaviour is a trap, and editing correct code to match it costs you the checks that were guarding it.

## Things that are not faults

1. The play area already shows figures before a run has started: a score of 2894, a level label reading Level 7, and a hit counter reading 16 against a target of 20. Those are the document's own placeholder figures. The play area is hidden until a run starts, and when one does the game overwrites all of them itself. They are not leftover test data and they are not a fault. Do not blank them, do not renumber them, and do not remove or restructure the read-outs that carry them.
2. The pause screen, the run-ended screen and the level-cleared screen are the same story: they carry printed figures from the start (746 on one, 521 and a heading naming Level 2 plus 86 as a bonus on the others), and the pause screen's heading is set in capital letters while the copy around it is not. All of that is factory content, overwritten with real values when a run actually reaches those screens. Do not clear the figures, do not restyle the heading, and do not add hiding logic of your own.
3. Three references in the tree used to point at machines outside it: two remote font requests and a remote statistics loader. They now point at two small inert files that the harness ships inside the tree - one script and one stylesheet - and neither file does anything except define the two empty hooks the document's own inline snippet expects. That is the harness, not a fault, and it is why the pages render in fallback typefaces and why no statistics are collected. Do not restore the outside references, do not delete the two inert files, do not give them behaviour, and do not treat the fallback typefaces as a rendering bug.
4. The documents also carry plain links out to the authors' own pages, to the repository, to social profiles, to a map and to an encyclopedia entry. They are credits and they are supposed to be there. Nothing is fetched from them unless a visitor clicks, and no check clicks them. Do not remove them and do not turn them into anything else.
5. The sounds the game plays are files that ship inside the tree, and the players that hold them are created when the page loads. The audio is not faulty. Do not delete a player, do not silence one to make a symptom go away, and do not add a sound that is not already there.
6. The rules of the game are the rules of the game: a fixed table of levels with its own times and hit targets, a fixed value per good hit, a bonus for time left over, a fixed count of bad circles per level, and a fixed short count before each level. None of those is a fault and none of them is a knob. Do not change a rule, a level figure or a duration in order to make a symptom disappear.
7. The maintenance panel is a shipped part of the page, not scaffolding somebody forgot to delete. Its button folds and unfolds it, its switches and labelled rows are wired to the screens, and the switches are meant to behave as one mutually exclusive group. Do not remove the panel, do not strip its rows, and do not turn it into something else - but equally, do not treat its presence as a symptom.
8. The screens swap by being shown and hidden in the same space; that is the page's own design and it is not a fault. Where a report says a screen is in the wrong place, or overlaps, or has lost its position, the layout rule that keeps the screens stacked is what needs to hold - do not delete a screen, reorder the document, or replace the layout with a different scheme to make a symptom go away.
9. The animations the page runs - a circle appearing, a circle bursting, a background beating, a screen fading - are its own and are not faulty. Where a report says something appears and then vanishes, the rule that decides what an animation ends at is wrong and the artwork is fine. Do not redraw, re-colour, rescale or replace any artwork, animation asset or label.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry no behaviour; they are how the page is addressed while it is being examined, and they must survive your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it needs is already inside the tree. Do not add a remote reference of any kind, do not assume anything can be downloaded, and do not reintroduce a library, a font, an icon set or a statistics beacon from outside.
- Repair the behaviour a player experiences. Do not special-case the examination, do not add flags, hidden state or a hard-coded branch keyed on a test identifier, do not write anything into the browser's storage (the page writes nothing there today and must keep writing nothing), and do not leave anything on the global scope that was not there before.
- Do not delete shipped content, artwork, copy, screens, buttons or panels to make a symptom go away, and do not reorder or rebuild a region unless the report you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the page must still load and run exactly as it does now: no build step, no new dependency, no network access, and the same documents reachable at the same addresses.
- While you are answering, do not run this project's own test, build or serve commands and do not start a browser of your own to check yourself. The grading harness measures the page for you, and a fix that only holds up under your own private way of running it is not a fix.
