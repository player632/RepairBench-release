# Repair Task - gomoku-ai (vanilla JavaScript five-in-a-row board with a minimax-style AI opponent)

You are working on the source code of **gomoku-ai** (万层地狱五子棋AI / "Myriad Hell
Gomoku AI"), a browser five-in-a-row game written in plain JavaScript. There is no
framework, no package manifest, no bundler, no transpiler and no build step of any
kind: the tree you are given is the tree that runs. The harness serves it over
plain HTTP from its own root directory and loads the board's top-level page; the
stylesheet and the single game script sit beside it in the same directory, so
nothing is fetched from the network at runtime.

The game reads top to bottom. A header names the app and carries a banner linking
to the project's home page, a support button and an "about the author" button.
Under it sits the board: a 15x15 grid of clickable intersections, 225 of them,
laid out as fifteen rows of fifteen, with the five traditional star points marked
on it. Black plays first. A stone placed on an intersection is drawn inside that
intersection, and the most recent stone carries a small yellow dot so you can see
where the last move landed. Either side of the board is a column of panels: the
two player cards (black on the left, red on the right, the one whose turn it is
scaled up and lit), the score pair, a rank panel with eight bands from 初学者 up to
棋神, a progress bar and a points figure inside it, a statistics block carrying the
move count, the search depth and a win-chance figure, a game-status readout that
says 未开始 / 玩家下棋中 / AI 正在思考 / 双人对战 / 游戏结束, the AI difficulty
panel, the AI model choice (正常版 and 满血版), the mode switch (AI 对战 and 双人
对战), a rules and version-history panel listing twenty-five releases, and a
control row with 重新开始, 悔棋 (limited to three per game, with the remaining
count shown), and a sound toggle.

Play is click to place. In AI mode you are black and the opponent answers on its
own after your move; in two-player mode both sides are human and no opponent move
is ever made. Five in a row - horizontally, vertically or on either diagonal -
ends the game and brings up a full-screen result dialog naming the winner, with a
"play again" and a "view the board" button on it. Winning or losing against the
opponent also awards rank points (a win is worth 100, or 300 on the 满血版 model,
and a loss is worth 50), and the project's own change log and readme both promise
that those points are kept permanently in the browser. Two further dialogs exist
off the main board: a donation/tipping agreement dialog behind the support button,
with 同意 and 不同意 buttons, and the "about the author" dialog, which can be
dismissed with its own × button or by clicking the dark backdrop around it.

Environment notes - properties of this offline harness, not defects:

- There is **no build step and no dependency install**. Do not add a package
  manifest, a bundler, a transpiler or a framework; the verifier serves the tree
  exactly as you leave it. Repair the code in place.
- There is no network access, and nothing in this game needs it. The upstream page
  used to reach off this origin at load time for an icon font from a CDN, a
  placeholder banner bitmap and three sound-effect files; those three references
  have already been taken out for you and the sound elements themselves kept,
  because they were the only things in the tree that reached off this origin and
  no behaviour of the game depended on the remote copies. That removal is harness
  furniture, not a defect, and there is nothing for you to restore. The links to
  the project's home page are still there and are meant to stay: a link is not a
  load-time request.
- The harness drives the game in a real browser at a **1440x1000 viewport**, so the
  whole board and both side columns are on screen at once and none of the
  stylesheet's narrow-screen rules apply.
- Every checkpoint starts from a freshly loaded board in a fresh browser context,
  so nothing - not a stone, not a mode choice, not the rank points, not any
  storage - carries over from one checkpoint into the next.
- The opponent's replies are produced by the game's own search over the current
  board, with no randomness and no clock inside the choice itself, so a given
  position always gets the same answer.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and a single reported symptom can have more than one
  root cause behind it.
- At least one report describes behavior that is actually intended; verify a report
  before changing anything because of it.
- **Not every defect is described in these reports.** Some of them nobody wrote in
  yet, and at least one of them is hiding behind another: a broken behavior you
  cannot currently reach, because a different defect stops you reaching it, still
  counts against you once it is reachable. So check the neighbouring behavior of
  anything you touch, and re-check the end-of-game dialog, the board layout and
  the points/rank paths after you repair them rather than assuming they were fine.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "Five in a row is five in a row, right? Except not for one of the diagonals. I
   built a line of five black stones running from the lower-left up to the
   upper-right - you know, the one that goes uphill as it goes left - and the game
   just carried on. No result dialog, no winner announced, the turn banner moved
   to red as though I had played an ordinary stone. I replayed it twice to be
   sure. A flat horizontal five and a straight vertical five both end the game
   immediately, and so does the other diagonal, the one that goes downhill. It is
   only that uphill-to-the-left diagonal that gets ignored."

2. "The yellow dot that marks the latest move is stuck. I place my first stone and
   the dot appears on it, fine. Then I place a second, a third, a fourth - and the
   dot is still sitting on the very first stone of the game, nowhere near where I
   just played. It never moves once, not even after ten moves. My opponent's
   stones behave the same way, so it is not about whose stone it is."

3. "悔棋 is broken in a confusing way. I press undo and the stone I just played
   does disappear from the board, and the move counter goes down, so the take-back
   itself works. But whose turn it is comes back wrong: the banner and the lit
   player card both name the OTHER side, so the colour that just had its move
   taken away is not the colour that gets to replay it. In two-player mode that
   means the same person effectively plays twice in a row."

4. "The opponent stopped playing altogether. In AI mode I click an intersection,
   my black stone appears, the turn banner switches to 'AI (红) 回合' - and then
   nothing. I sat there for a full minute. No red stone ever shows up, the game
   never ends, and the little status readout above the difficulty panel still says
   玩家下棋中 as though it were waiting for me again. If I switch to two-player
   mode both sides play normally, so the board and the click handling are fine. It
   is only the hand-over to the opponent that never happens."

5. "The donation agreement popup has its dismissal backwards. I click the dark
   area around the popup - the backdrop, where there is no text - expecting it to
   go away, and it stays put. Then I click on the wording of the agreement itself,
   which I would never do on purpose, and the whole popup vanishes. The 同意 and
   不同意 buttons both still work as they should; it is specifically clicking the
   popup's own body versus clicking around it that has been exchanged."

6. "The '关于作者' button is dead. I click it and absolutely nothing happens - no
   dialog, no flicker, no error, nothing. The button is there, it highlights when
   the mouse goes over it, it just does not do anything. I reloaded the page and
   tried it first thing before touching the board, in case I had got the game into
   a strange state. Same. The support button next to it opens its own popup fine,
   so it is not that popups in general are broken in this build."

7. "The stones are painted in the wrong colours. I am black - my player card on
   the left shows a black disc and says it is my turn - but the stones that appear
   on the board for my moves come out RED, and my opponent's stones come out
   BLACK. The two player cards themselves are still correct, black on the left and
   red on the right, and the winner announcement names the right side, so it is
   only the stones on the board that have had their two paints exchanged. It makes
   the game genuinely hard to read after a dozen moves."

8. "Why is there only one difficulty? The AI difficulty panel offers a single
   button, 万层地狱. The change log that ships with the project talks about 简单,
   中等 and 困难 as separate difficulties, and I can see those three buttons are
   actually in the page - they are just never shown. Did somebody break the
   difficulty selector, or is one difficulty genuinely all this build offers? I
   only ask because I assumed the missing three were a bug."

9. "Something odd happens when I switch to two-player mode: the whole AI
   difficulty panel disappears from the page, model choice and all, and the turn
   banner stops mentioning the AI and just says 红方回合. Switch back to AI mode
   and the panel is there again. Is the app losing its settings when I change
   mode, or is hiding the opponent's controls in a human-versus-human game the
   point?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the 15x15 board and its five star points, black moving first, the
three-undo limit and its counter, the restart control clearing the board and every
counter back to zero, the eight rank bands and the points figure and progress bar
inside them, the twenty-five version rows and the rules panel, the move / depth /
win-chance statistics, the score pair, the sound toggle and its two icon states,
the result dialog's two buttons, the donation agreement dialog and both of its
buttons, the win detection for the horizontal, the vertical and the downhill
diagonal, a horizontal five against the opponent still ending the game, the
opponent still answering in AI mode and still never answering in two-player mode,
the single offered difficulty, the hidden AI panel in two-player mode, and the
fact that a brand-new board starts with no stones, no points awarded and an empty
move history - none of which any report asks you to change. The tree must still
load and run exactly as it does now when you are done: no build step, no new
dependency, no network access.
