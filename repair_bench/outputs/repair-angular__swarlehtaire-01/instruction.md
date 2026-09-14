# Solitaire collection — several things broke after the last merge

I look after a small solitaire collection app: eight patience games live on one page, and you switch between them with the row of game buttons along the top. After we merged the latest batch of changes, players started reporting problems. I've written down everything that reached me — please judge for yourself which are real defects, because a couple honestly sound like people misreading the rules.

1. In the classic game, the take-back control behaves backwards. Fresh deal, not a single move played yet, and the button is already lit and clickable. The moment I make one move, it goes dark and stays dark no matter how many moves I play. Obviously it should be the other way around.

2. There's a variant of the classic game where every card is dealt face-up from the start, the open-hand one. In that variant, after I draw from the stock a couple of times, the fan of drawn cards shows fewer cards than it should. The normal three-card mode fans correctly, so it's specifically the open-hand variant that looks wrong.

3. Also in the classic game: when a pile is completely emptied and I tap the empty slot, the freshly drawn card used to move into it. Now nothing happens — the empty slot just ignores the tap. I have to drag cards manually instead.

4. In the big two-deck spider-style game, dragging a card from one pile onto another no longer works at all. I drag, I drop, the card snaps back to where it came from. Every single drag fails, in every pile.

5. In that same spider game, the control that deals the next round of ten cards shows a count of zero right from the start and is greyed out — even though the shoe obviously still holds fifty cards. I can't deal any further rounds at all.

6. In the game with the four spare parking slots on top, I can no longer park a card into an empty slot by dragging it off the end of a column. The card just snaps back. Moving cards between the columns themselves still seems fine.

7. Across every game, the black suit marks look wrong: the clubs are printed with the spade mark, and the spades with the club mark. The red suits look correct.

And two reports I'm forwarding only for completeness — I suspect both are "working as intended", but please make sure nothing is actually broken underneath:

- One player swears that in the mode where you draw one card at a time, "only a single card shows up after drawing — the app is losing my cards". As far as I know that mode simply shows one card, that's the whole point of it. Just confirm the drawn card is really there and nothing is being dropped.
- Another player says the king counter in the pure-luck clock-style game "starts at zero, so it must be uninitialized or broken". Zero is the correct starting value before any king surfaces — but please verify the counter genuinely starts clean and the game still steps forward normally.

Everything else feels fine: fresh deals, the move counters, switching between the eight games, the layout. Please don't break any of that while fixing the above.

One more thing before you start: not every defect is necessarily mentioned in the reports above. Behaviors you break while fixing other things still count against you.

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
