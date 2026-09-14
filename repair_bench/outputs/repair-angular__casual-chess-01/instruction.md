# Repair task: casual-chess

We host this Ionic chess web app (play against the engine, tactics trainer,
and a free analysis board) for our club members. After a recent update a pile
of complaints came in from members and moderators. Some of these reports may
overlap, some may be red herrings — triage them yourself. Fix the product so
all genuine problems below stop happening, without regressing anything that
already works.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

## What our members reported

1. **Cutting a move doesn't really take it back.**
   "On the analysis board I make a move, then cut it from the list of recorded
   moves to try something else. The list looks right, but when I play a
   different move the piece from the move I cut is still standing on the
   board — as if the cut never happened to the game itself."

2. **Move numbers in the analysis list are wrong.** "Right after I play
   White's very first move, the list of recorded moves doesn't number it as move one — the
   numbering of the whole sequence looks off from the start."

3. **The turn banner shows the wrong color.** "When I open a fresh starting
   position, the bar at the top announces that it is Black's turn, even though
   it is clearly White to move. It looks flipped."

4. **Pawn promotion never asks what I want.** "When I push a pawn to the last
   rank it silently turns into a queen every time. I never get to pick a
   knight, rook or bishop — the choice dialog simply never shows up."

5. **End-of-game banners are mixed up.** "I had a position where the enemy
   king had no legal moves but was not in check — a stalemate — and the banner
   talked about insufficient material instead. The messages seem swapped."

6. **The analysis board sometimes shows up blank.** "Every now and then I
   open the analysis board and the board area is completely empty — no
   squares, no pieces. If I resize the browser window the board suddenly
   appears, as if it needed a nudge."

## Also flagged, but we're not sure these are bugs

- A Spanish-speaking moderator insists the **checkmate banner is not
  translated**: "When a game ends in checkmate the banner shows the English
  word 'Checkmate', while all the other end-of-game messages follow my
  language. That must be a missing translation."
- A member swears the **clipboard FEN is wrong**: "Right after my opponent's
  pawn advances two squares I copy the position, and the pasted text ends with
  an extra little field I didn't expect. I think the app copies a stale or
  broken position."

Please verify for yourself which of these are real defects and which are the
product working as intended, and act accordingly.

## Ground rules

- The app must keep working fully offline; do not introduce any external
  network dependency.
- Don't break the flows that currently work: playing moves against the board,
  the recorded-moves panel, cutting moves, good/bad move annotations, the preferences dialog
  (themes, pieces, boards, sounds), the clipboard exports, and navigating to
  a position via its FEN link.
- The analysis board must come up at full size on its own when the page
  loads — members should never have to resize their window to see the board.
- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
