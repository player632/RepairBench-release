# Repair Task - Chess Game (vanilla JS)

You are working on the source code of **Chess Game**, a small browser chess
app written in plain JavaScript. A player lands on a start screen, chooses to
play against another human or against the computer, picks a side when playing
against the computer, and then plays on a full board: pieces are moved by
clicking a square and then clicking the destination (or by dragging), the
legal destinations of the piece you picked are meant to light up, the two
squares of the most recent move are meant to stay marked, the banner above the
board says whose turn it is, the two trays under the board collect the pieces
each side has lost, castling and pawn promotion are supposed to work, and a
finished game is supposed to end with a result panel that names the winner.
The project lives in this workspace and has no build step at all: it is a
plain static page - the entry point is the page at the root of the workspace,
the scripts and the stylesheet sit next to it and the piece artwork lives in a
subfolder. There is nothing to install, no bundler, no backend and no network
access; serving the directory statically is enough to run it.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit somewhere other than
  where the symptom shows up, and a single reported symptom can have more than
  one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Playing as black, my pawns cannot open the game. White's pawns jump two
   squares on their first move the way they are supposed to, but every black
   pawn only ever creeps one square forward, even straight out of the back
   rank. The whole opening is lopsided because of it."

2. "The board never shows me where a piece can go. I click one of my pieces
   and nothing lights up at all - no destination squares, nothing. The square
   I clicked does get its selection mark, and the move still happens when I
   click the square I want, so the game is not frozen; I just have to carry
   every legal move around in my head."

3. "Small one, but it cost me a game: my pawn made it all the way to the back
   rank and the app put a queen on that square - right artwork, right square -
   and that queen is useless. Click it and it has nowhere to go. It is drawn
   like the strongest piece on the board and behaves like it is nailed down."

4. "The game does not end. In a two-player game we reached a position where
   the king was attacked, had no square to step onto, nothing could block the
   attack and nothing could take the attacker - a finished game by any
   definition - and the app just carried on. No result panel, no winner named,
   and the banner above the board still asking the lost side to move. We had
   to settle who had won between ourselves."

5. "I cannot castle. I cleared the pieces out of the way between my king and
   the rook on the king's side, made sure nothing was attacking the squares
   the king would have to cross, and neither the king nor that rook had moved
   once all game - and clicking the king still only ever offers me the
   ordinary one-square steps. The two-square castling move is never on offer,
   for either player, on either side of the board."

6. "The trays that collect the pieces you have lost fill up on the wrong side.
   When one of my pieces gets taken it turns up in my opponent's tray, and
   when I take one of theirs it goes into mine. The count is right - one piece
   per capture, filed under the right kind of piece - it is just attributed to
   the wrong player, so nobody can tell who is ahead on material."

7. "If I choose to play against the computer and then pick the white side, the
   big start button never unlocks. I click the white card, nothing happens, it
   stays greyed out and I cannot start the game at all. Choosing the black
   side does work, so it seems to be something about that one choice."

8. "When a game finishes, the button on the result panel does not drop you
   into a fresh board where you are - it throws you all the way back to the
   very first screen and you have to pick an opponent and a side again before
   you can play. That first screen also comes up with nothing selected and the
   start button greyed out until you choose something, which felt broken to me
   the first time I saw it."

9. "Before you press start, some of the pieces sitting on the board are
   labelled oddly if you look at them in the page: the black queen and one of
   the black knights carry a king-ish marker, and the white bishop standing
   next to the white king is tagged as a knight. I nearly went hunting for
   where the pieces get assigned - and then the game started and the board
   looked completely fine, so maybe that is just how the page is written."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier serves the page statically and
  drives the app in a real browser. Focus on reading the code and fixing root
  causes.
- Keep every fix inside this workspace and preserve the existing behavior of
  everything you do not intend to change.
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.
