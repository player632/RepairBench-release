# Repair Task - slot-game (a zero-build canvas slot machine)

You are working on the source code of a small browser slot machine. It is plain
JavaScript with no framework, no bundler and no build step of any kind: the page
served from the root of the tree loads its modules directly, and the machine is
painted onto a single canvas. There is nothing to install and nothing to
compile - you edit the sources and reload the page.

What that one page shows, in the words a player would use:

- a **canvas** with three spinning columns of symbols, two rows of them visible
  at a time. There are five symbol pictures: a cherry, a seven, and three bars
  of increasing strength (single, double, triple).
- a **win meter** above the canvas, showing what the last spin paid.
- a **credit meter** and a **stake meter** on the left of the control bar.
  Credit starts at 64 and the stake at 1; the stake can be raised to 15.
- three buttons in the middle of the control bar: lower the stake, **SPIN**,
  raise the stake. Every spin costs the current stake. A winning row pays its
  table value multiplied by the stake.
- an **autoplay switch** on the right, which keeps spinning until it is switched
  off again, and a **Pay Table** button that opens a panel listing what every
  combination pays on each of five lines.
- a floating **configuration panel** with sliders, docked near the top right of
  the window. It is part of the shipped product, and the project's own readme
  presents it as the headline feature: it is how the wallet, the column
  geometry, the spin animation length and its easing, the symbols the columns
  stop on, the block dimensions and colours, and the three audio volumes are
  adjusted, and it has a button that puts every one of those back to its
  default.

Rules of the game, exactly as the payout panel states them:

- three identical symbols on a visible row pay that symbol's value for the line
  that row sits on;
- a row made only of cherries and sevens, but not three of a kind, pays the
  mixed combination's value;
- a row made only of bars, of any strengths, pays the any-bar value;
- the top visible row is line 1 and the bottom visible row is line 2, and the
  panel lists both for every combination.

Runtime facts about how this task is verified:

- The tree is served as it stands, over a local static server, with **no network
  access**. Everything the page needs - the animation engine, the configuration
  panel library, the stylesheet and script bundle, and the little table builder
  that renders the payout panel - is carried inside the tree already. Nothing
  may be pointed back at a remote host, and no dependency directory needs to be
  created.
- The harness drives the page in a real browser at a **1280x720 viewport**.
- Every checkpoint starts from a fresh browser context, so a spin, a raised
  stake or an opened panel from an earlier interaction never carries into the
  next one.
- By default the symbols each column stops on are drawn from a random generator,
  so the exact pictures on screen differ from load to load. That is the seed's
  own behaviour, not a defect, and nothing you are asked to repair depends on a
  particular random outcome: where a check needs a known arrangement, it uses
  the configuration panel's own fixed-symbol mode to pin the columns first,
  which is a supported feature of the product.
- The audio (a looping background track, a spin effect and a win jingle) is part
  of the seed. It is allowed to fail silently in a headless browser, and no
  check depends on hearing anything.
- Two known quirks of the shipped tree are **not** defects and are not asked
  about: a couple of short audio clips sit in a folder that nothing in the tree
  references, and the colour helper that turns a hex string into components
  declares a default number base that its only caller always overrides
  explicitly. Leave both alone.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different part of the
  machine than the place the symptom shows up, and a single reported symptom can
  have more than one root cause behind it.
- At least one report describes behaviour that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviours you break
  while fixing other things still count against you.
  并非所有缺陷都有报告提及；修别的问题时弄坏的行为同样会扣分。
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "SPIN eats my credit and never pays anything back. I wait for the columns to
   settle on three identical symbols - I can make that happen on purpose from
   the configuration panel, so I know exactly what is on screen - and the win
   meter stays at $0 while my credit just drops by the stake. It is not a
   display glitch either: the credit never comes back. Stranger still, the spins
   that win *nothing* are the ones that behave like a win - I get the winning
   jingle and the machine sits there busy for a couple of seconds before it
   takes the next spin. It is exactly backwards."

2. "Only the top row is ever judged. I pin the three columns so the BOTTOM row
   shows three identical symbols and the top row shows a mix that combines
   nothing, spin, and the machine pays nothing at all - as if the bottom row was
   never looked at. Pin the same three-of-a-kind on the top row and it is judged
   fine. Whatever combination I put down there, the second visible row never
   seems to be part of the judgement."

3. "The mixed combination is being paid as three of a kind. Two sevens and a
   cherry on a row should be the cherry-or-seven combination - that is what the
   payout panel says it is worth, 75 on the top line. Instead the machine treats
   the row as if all three symbols matched and pays me the seven's value. It
   only takes one matching symbol next to two others for it to call the whole
   row a match."

4. "The cherry row of the payout panel is wrong. Every other row lists its five
   line values from smallest to largest as you read left to right - the seven row
   goes 150, 300, 600, 1200, 2400 - but the cherry row starts 2000 and then
   drops to 1000 before climbing again. Either the two first values were typed
   the wrong way round, or the panel is drawing them in the wrong order; either
   way it contradicts the rest of the table and it is what the machine pays
   from."

5. "I cannot spend my last credit. With the stake at 1 and my credit down to
   exactly 1, SPIN does nothing at all - no spin, no sound, no deduction, the
   button just refuses. One more credit than the stake and it spins happily. So
   the machine will let me play when I have more than I need but not when I have
   exactly enough, which is wrong: a spin I can just afford is a spin I should
   be allowed to take."

6. "The win is not held up long enough to read. The machine is supposed to keep
   the winning symbols lit and block the next spin for at least a couple of
   seconds after a win, whatever the spin animation is set to - that is the whole
   point of the delay. If I turn the spin animation right down in the
   configuration panel and then win, the hold shrinks with the animation instead
   of staying at its two-second floor, so the win is wiped off the meter before
   I have read it."

7. "Is that slider panel floating over the game leftover debugging code? It sits
   on top of the page with folders for the wallet, the rows and columns, the
   animation, the block sizes and the volumes, plus a Reset button. It looks
   like something a developer left in by accident and forgot to take out before
   shipping. Should it not be removed, or at least hidden behind a flag?"

8. "The Pay Table panel does not match the game. It lists five lines of payout
   for every combination - Line 01 all the way to Line 05 - but the machine only
   ever shows two rows of symbols, so at most two lines can happen. Three of
   those five columns are dead weight and confusing; the panel should be cut
   down to the lines the game actually has."

Work in the source tree, repair the root cause of each real defect, and leave
the intended behaviours alone - the configuration panel and everything it
drives, the payout panel and the full five-line reference table it renders, the
autoplay switch, the stake ceiling, the audio, the canvas rendering, the random
mode the machine starts in, and the offline, build-free way the page loads.
The tree must still need no install step and no build step when you are done.
