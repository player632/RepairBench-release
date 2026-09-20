Repair task: a canvas card table

## The page you are repairing

What you have is a single-page card game, shipped as plain browser JavaScript.
There is no framework of your own choosing, no bundler, no transpiler, no type step
and no dependency directory anywhere in the tree. One document at the root of the
tree loads a single third-party canvas library that ships inside the tree, and then
the game's own five script files, in the order the document declares them. The game
runs entirely out of the globals those scripts leave behind, and the tree is served
straight off the disk: the directory that is served is the source directory, nothing
is compiled first and nothing is fetched from anywhere else, so the files you read
are the files that run.

The whole table is drawn onto one fixed-size canvas, 1100 by 650, sitting in the
document. The dealer's cards lie across the upper middle of it and the player's
cards across the lower middle, each new card sliding out from the middle and landing
next to the one before it. To the right stands the player's rack of chips, in five
stacks by denomination; clicking the top chip of a stack sends it to the table.
Along the lower left is a row of word buttons - Hit, Stand, Go, All in, Insurance,
Double, Give up and New game - and near the lower right a running figure for the
wallet, with the player's name underneath it. A one-word announcement about the
state of the hand sits near the upper right, and short orange warnings appear there
for a moment when a button is pressed at a time it cannot be used.

Before the first hand there is a title screen: the name of the game across the
middle, a box to type a name into with an on-screen caret, and an OK beside the box.
Once a name has been stored the title screen is skipped on later visits and the
table is dealt straight away.

A round goes like this. The player builds a wager by clicking chips out of the rack;
each denomination is worth a fixed amount and the wager is the sum of the chips that
have gone to the table. Pressing Go deals four cards in turn - one to the player, one
to the player, one to the dealer face up, one to the dealer face down - with a short
fixed pause between each of them. The player then takes another card with Hit, or
stops with Stand, or doubles the wager and takes exactly one more card with Double,
or buys Insurance while the dealer's up card is an ace, or gives the hand up for
half the wager back. When the player stands, the dealer turns the face-down card up
and draws until the dealer's total reaches seventeen, then stands. The hand is then
settled: a natural two-card twenty-one pays three times the wager, an ordinary win
pays twice the wager, a tie is announced as a tie, and a bust or a better dealer
total loses the wager. There is a fixed pause of about two seconds between the
announcement and the money actually moving, and a hand settles once.

The shoe holds six packs shuffled together, so three hundred and twelve cards, and a
card that has been dealt leaves the shoe. The starting wallet is one thousand. Chip
denominations are five hundred, one hundred, twenty-five, five and one, and between
rounds the rack is rebuilt from whatever the wallet holds, largest denomination
first. When the wallet reaches zero the table ends and offers a replay; New game
wipes the stored name, wallet and rack and starts over.

The game keeps three things in the browser's own storage: the player's name, the
wallet, and the rack of chips. All three are the game's own doing and all three are
meant to be there.

The page is examined at a 1280x720 window with the en-US locale, and every check
starts from a freshly loaded page in a fresh browser context, so nothing - not a
name, not a wallet, not a rack, not a hand in progress, not a shoe - carries over
from one check into the next.

## What visitors reported

Eight reports came in. They are quoted as their authors wrote them. They are
starting points, not diagnoses: they are not always precise, they do not always say
which of several similar things is affected, and they do not always agree with each
other. Not every defect is described in these reports, and some of what is described
here is not a defect at all.

1. Every picture card is worth eleven now. I get a king and a seven and the table
   plays on as though I were holding eighteen, and a queen and a six busts me
   outright. It used to be ten for a jack, a queen or a king. Numbered cards are
   still worth their number, and it is the same in the dealer's hand as in mine,
   from the very first hand of a fresh profile.

2. The dealer will not stand on seventeen. He has a plain seventeen - a ten and a
   seven, no ace anywhere in it - and instead of standing he takes another card, and
   keeps taking them until he is past seventeen. He used to stop dead on seventeen.
   I watched four hands in a row and every time he drew again.

3. Betting pays me. I click a chip out of the rack to build my wager and my money
   goes UP by the value of that chip instead of down, so the more I bet the richer I
   get, while the rack still empties exactly as it should. The wallet figure in the
   corner and the chips leaving the rack flatly disagree. It happens on the first
   chip of the first hand and on every chip after it.

4. A natural pays worse than an ordinary win. When I make twenty-one with my first
   two cards I am paid less than when I win with three or four, which is back to
   front - the natural is supposed to be the better hand and the better payout. Both
   kinds still announce a win, and the money only lands a couple of seconds later,
   so you have to wait and watch the wallet to see it happen.

5. The shoe never gets used up. It is supposed to be six packs dealt from, and a
   card that has been dealt is supposed to be gone, but the pile never thins: I have
   been dealt the very same card twice inside one hand, and after a hundred hands
   the table is still dealing from a full shoe. Nothing ever runs out and nothing
   ever gets reshuffled.

6. The name box does not take what I type. On the title screen I click into the box,
   type my name, and nothing at all appears in it - no letters, no caret moving -
   and when I press OK the table still greets me by the fallback name. It is like
   that in every browser I tried and it is like that from a completely fresh
   profile, so it is not something I left stored from before.

7. The aces are wrong. I hold an ace and a seven, which is either eight or
   eighteen, and the table only ever counts it as eighteen, so I can never take a
   card on the soft eight and I bust where I should not. Every card game in the
   world lets an ace be one or eleven and this one does not.

8. When we tie I do not get my stake back. The table announces the tie, waits its
   usual couple of seconds, sweeps the chips off the table, and then my wallet is
   what it was before the hand minus the wager. A tie is supposed to hand the money
   back. It does that on every tie, small wager or large.

## Things that are not faults

Several things about this tree are the harness, or are simply how the game was
built, and none of them is a fault. They are listed here so that you do not spend
your repair on them, and so that you do not undo them:

1. The document used to load one small off-site widget script, whose only job was to
   decorate a star link beside the canvas. With no network at all that request could
   only fail, and nothing in the tree ever read its reply, so the script element has
   been removed and the document is otherwise untouched. The star link itself is
   still in the document as plain content. That removal is the harness, not a fault.
   Do not put the outside reference back, do not add any other off-site reference,
   and do not delete the star link or give it a destination of your own.
2. The stylesheet carries one commented-out off-site background picture. A comment
   issues no request, so it has been left exactly as it was. That is not a fault and
   it is not something to clean up. Do not uncomment it, do not replace it with a
   picture of your own, and do not delete the lines.
3. The harness also adds one assignment of its own, next to the game's own boot
   call, whose only job is to publish the table's five existing internal objects
   under a single namespaced key so that the examination can read them. It reads no
   property, writes no property, calls no method, adds no listener, wraps nothing
   and changes no value. That assignment is the harness, not a fault. Do not delete
   it, do not rename it, do not give it any behaviour, do not add a second one, and
   do not make the game depend on it.
4. The third-party canvas library that ships inside the tree is shipped as it is. It
   is not part of the examined surface and it is not faulty. Do not edit it, do not
   replace it with a newer copy, do not strip it down, and do not remove it because
   you think the game no longer needs part of it. The same goes for the artwork, the
   card pictures, the chip pictures and the sounds that ship inside the tree: none
   of them is faulty and none of them is a knob.
5. Everything drawn on the canvas is drawn again from scratch every frame by the
   game's own loop, and the drawing itself is not faulty. Where a report says a
   figure reads wrong, or a card shows the wrong side, or a control sits somewhere it
   should not, or nothing at all happens, the code that decides the arithmetic, the
   default, the path or the coordinate is wrong and the drawing is fine. Do not
   redraw, re-order, re-scale, reposition by hand or replace any artwork, colour,
   geometry constant, animation duration or piece of wording in order to make a
   symptom go away.
6. The rules of the table are the rules of the table, and none of them is a fault or
   a knob: six packs in a shoe, a dealer who draws to seventeen and then stands, a
   natural paying three times the wager and an ordinary win paying twice, a fixed
   pause of about two seconds before a settled hand pays out, fixed short pauses
   between the four cards of a deal, a starting wallet of one thousand, five chip
   denominations of five hundred, one hundred, twenty-five, five and one, a rack
   rebuilt largest denomination first between rounds, insurance costing half the
   wager and paying twice, giving up refunding half the wager, and a doubled hand
   taking exactly one more card. Do not change a rule, a denomination, a delay or a
   table in order to make a symptom disappear.
7. An ace counts as eleven here and never as one. There is no soft hand and no
   downgrade, and there never was: a hand holding an ace is simply eleven higher,
   which is why an ace and a seven reads as eighteen and why an ace with two picture
   cards busts. That is how the game was built. It is not a fault, it is not a
   defect to repair, and it is not a knob - do not add a soft-ace rule, do not make
   an ace worth one anywhere, and do not change how any other rank is counted in
   order to compensate for it.
8. A tied hand does not return the wager. The end-of-round bookkeeping clears the
   wager before the refund line runs, so the refund adds nothing and the wallet
   comes out of a tie unchanged apart from what the chips already cost. That is the
   shipped behaviour, it is reproducible on every tie, and it is not a fault. Do not
   add a stake refund, do not reorder the end-of-round bookkeeping, and do not
   change what a tie announces.
9. A hand that the player busts is lost at once, before the dealer plays anything,
   and the dealer's face-down card stays face down until the player stands. Neither
   is a fault and neither is something to make more forgiving.

## Ground rules

- The page runs with no network at all and must keep doing so. Everything it needs
  is already inside the tree. Do not add a remote reference of any kind, do not
  assume anything can be downloaded, and do not reintroduce a library, a font, an
  icon set, a widget, a soundtrack or a picture from outside.
- Repair the behaviour a player experiences. Do not special-case the examination, do
  not add flags, hidden state or a hard-coded branch that only fires while the page
  is being examined, do not write anything into the browser's own storage that the
  page does not already write, and do not leave anything on the global scope that
  was not there before - in particular do not publish any new object of your own
  alongside the one the harness already publishes.
- Do not delete shipped content, artwork, copy, buttons, screens or library code to
  make a symptom go away, and do not reorder or rebuild a region unless the report
  you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the page must
  still load and run exactly as it does now: no build step, no new dependency, no
  network access, and the same document reachable at the same address.
- While you are answering, do not run this project's own test, build or serve
  commands and do not start a browser of your own to check yourself. The grading
  harness measures the page for you, and a fix that only holds up under your own
  private way of running it is not a fix.
