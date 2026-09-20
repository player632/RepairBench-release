Repair task: a browser card table for Doppelkopf

## The page you are repairing

What you have is a single-page web application that plays the German card game
Doppelkopf against three computer players. It is written in TypeScript on top of a
component framework, and the tree you are given is source: it has to be built with
the project's own build script before there is anything to look at, and what you
then serve is the built output directory, not the source directory. The build step
also type-checks the source, so a change that breaks the type contract fails the
build instead of quietly shipping.

The application has two screens. The first is a landing page: the name of the game,
a short teaser, a box to type your name into (the name you type is remembered in the
browser and offered back to you on your next visit), a button that takes you to the
table, and a second button for the rules, which points at a page outside this tree.
The second screen is the table itself, and it is where nearly everything you are
asked about happens.

At the table, four seats are arranged around a square: you at the bottom, the two
computer players to your left and right, and the fourth across the top. Each seat
shows its player's name, the cards it holds, and the trick stack it has won so far,
drawn as a small pile of card backs with a count. Your own cards are drawn face up
along the bottom edge; the other three seats show face-down backs until they play.
Cards that are not yours to play right now are drawn dimmed, and the seat whose turn
it is is marked. In the middle of the table lies the current trick, up to four cards,
and a control lets you look back at the trick that was just completed. A scorecard
can be opened over the table; it lists the points each side has taken and the extras
that were scored, and there is a running total for the two sides.

The game itself is played by the standard Doppelkopf rules, and the table enforces
them for you:

- The pack is the 48-card double pack - every rank from the nine up, twice over, in
  the four suits - and each player is dealt twelve cards.
- Most of the pack is trump. Every queen, every jack, both diamond aces, both diamond
  tens, both diamond kings and both diamond queens are trumps, and so is everything
else in diamonds; the remaining clubs, spades and hearts are plain suits. The trumps
have their own fixed order of rank, and among the jacks and queens that order runs
clubs highest, then spades, then hearts, then diamonds - clubs over spades is the
detail people argue about at the table, and the table is supposed to settle it.
- Within a plain suit, cards rank ace, ten, king, and then the small cards, and the
  nine is lowest. The ten is worth ten points and outranks the king for taking tricks.
- One trick is four cards, one from each seat in turn, going counter-clockwise... the
  winner of a trick leads the next one, and the turn order moves round the table seat
  by seat.
- Whoever plays the first card of a trick sets its suit. If that card is a plain
  (non-trump) card, every other player who still holds that suit must play it; only a
  player who is out of that suit may play a trump or anything else. If the first card
  is a trump, everyone must play a trump while they still have one. Cards you are not
  allowed to play are drawn dimmed and cannot be chosen.
- A trick is won by the highest trump in it, or, if it holds no trump, by the highest
  card of the suit that was led. Card points are what a trick is worth: aces eleven,
  tens ten, kings four, queens three, jacks two, nines nothing. There are 240 card
  points in a round.
- The two sides are called Re and Kontra. Which player is on which side is normally
  settled by who holds the two diamond queens, and until that is settled the table
  keeps track of what each player can already work out about the sides from the cards
  they have played - which is how the computer players decide whether to help you or
  to attack you.
- Once a side has taken enough points it wins the round: 121 points or more wins it
  outright, and there are higher thresholds for winning "against" the other side's
  announcements. A tie at 120 to 120 is not a win for Re; the round goes to Kontra.
  The winning side scores a base game value, and the round's score is that value
  multiplied by the extras the table found.
- Extras the table looks for include a Doppelkopf - a trick that is worth 40 card
  points or more, which scores one extra point - and catching the fox: if a player
  takes the other side's diamond ace in a trick, that side loses a point and the
  catching side gains one. A player who is left with a single plain ace in a suit,
  with no other card of that suit to protect it, is treated as holding a "blank ace",
  and the computer players use that when they decide what to lead.
- Before a round starts, players may reserve a solo, and a player who wins a round
  may announce a higher target. Both of those flows are part of the model.

Short messages appear over the table when something has to be told to the player -
whose turn it is, that a move was not allowed, what a trick was worth, that a round
ended. They stay up long enough to be read and then go away on their own, and more
than one can be waiting at a time; they are shown in the order they were raised.

## What visitors reported

Eight reports came in. They are quoted as their authors wrote them. They are starting
points, not diagnoses: they are not always precise, they do not always say which of
several similar things is affected, and they do not always agree with each other.
**Not every defect is described in these reports**, and some of what is described here
is not a defect at all. There are twelve defects in this tree. They are all behaviour
defects - nothing here is a typo in a comment, a formatting complaint or a matter of
taste - and they are spread over the rules of the game, the way the table draws a
card, the way the computer players reason, and the way messages are timed.

1. Last night's round still annoys me. I led the jack of spades and the player after
   me took it with the jack of clubs. Between the two black jacks the jack of clubs is
   supposed to be the higher one. It is the wrong way round at this table.

2. The rule about following suit is broken. Somebody led a club - a plain club, not a
   trump - and I still had clubs in my hand, but the table would only let me play
   trumps: every club of mine was drawn dimmed and could not be chosen. When a plain
   card is led you have to follow that suit if you can.

3. We took a trick with four tens in it, exactly forty points, and by the rules that
   is a Doppelkopf and should score us an extra point. Nothing was announced and the
   final score was a point short. Tricks of forty-one and forty-two points were
   announced as they should be, so it is only the exact-forty trick that is missed.

4. Not once all evening did anybody score for catching the fox. The diamond ace was
   taken by the other side several times, and the scorecard simply never grew the
   "caught the fox" line.

5. The turn keeps jumping. My left-hand and right-hand neighbours almost never got to
   lead all evening; it went round and round with the same two seats playing, as if
   somebody were being skipped.

6. The colours on the card faces are the wrong way round. Hearts and diamonds are
   printed in black and clubs and spades in red. It looks wrong and in the evening you
   misread your hand.

7. The messages over the table vanish in a flash. The one that says it is not your
   turn, for instance, is gone before you have read it, so you cannot see whose turn
   it actually was.

8. Two things about the table have been like this since the first evening and I do not
   know whether they are supposed to be. The names it gives the three computer players
   are always the same two to start with, in the same order: the first is always Peter
   and the second always Wolfgang, and only the third and fourth name ever vary - so
   the names do not look shuffled at all. And once you are at the table you are never
   asked whether you want to reserve a solo: no such dialogue ever appears, there is
   no "all healthy" message, and the round seems to sit in the state where it is
   waiting for reservations even though you can carry on playing normally. If either of
   those is how the game is meant to behave, leave it alone.

## Things that are not faults

Several things about this tree are the harness that examines your work, or are simply
how the game was built, and none of them is a fault. They are listed here so that you
do not spend your repair on them, and so that you do not undo them:

1. The entry document used to load a small off-site statistics script, whose only job
   was to count visits. With no network at all that request could only fail, and
   nothing in the tree ever read its reply, so the script element has been removed -
   together with the short note that sat directly above it and spelled out the same
   off-site address in plain text. A note cannot issue a request, but the examination
   reads the tree for any off-site address at all and stops rather than guess, so both
   went and neither was replaced by anything. The rest of the document is untouched.
   That removal is the harness, not a fault. Do not put the outside reference back -
   not as a script, not as a note, not in any other shape - and do not add any other
   off-site reference.
2. The application used to hand its uncaught errors to an off-site error-reporting
   service, in production builds only. That call and the import behind it have been
   removed for the same reason, and nothing else about the start-up sequence changed.
   That removal is the harness, not a fault. Do not add error reporting of your own.
3. The interface used to pick its language from the browser's own language setting and
   fall back to English. It is now pinned to English, so that what you read on the
   screen is the same on every machine and every run. That is the harness, not a
   fault. Do not make the language depend on the browser again, and do not re-translate
   or re-word any of the strings the game ships with.
4. The game used to draw its cards and choose the computer players' moves with the
   browser's own unpredictable random source. It now uses a fixed, reproducible
   generator that this tree carries, so that the same deal comes out on every run and
   every state of the tree - without that, nothing at this table could be examined
   twice. The shape of the generator's output is unchanged and every call site is
   unchanged. That is the harness, not a fault. Do not replace it with an unpredictable
   source again, do not change the seed, and do not add or remove a call site.
5. The harness also adds one small read-only file of its own, imported once at start-up,
   whose only job is to publish the game's existing model objects under a single
   namespaced key, plus one line in the table screen that publishes the game object the
   screen already owns. It renders nothing, writes no game state, adds no listener,
   wraps no method and changes no value. Those two additions are the harness, not a
   fault. Do not delete them, do not rename what they publish, and do not make anything
   in the game behave differently because they exist.
6. The tree ships its own unit tests and its own end-to-end specs. They are part of the
   upstream project; they are not the surface your work is judged on, and the
   examination never runs them. Read them if they help you understand the rules, but do
   not delete them, do not skip them, and do not weaken an expectation in them to make
   a run go green.

## Ground rules

- Fix the tree, do not wrap it. Twelve defects are in there; every one of them is a
  place where the application's own behaviour differs from the rules of the game or
  from what the interface promises. Nothing is gained by special-casing a value you
  saw in a report, by hard-coding an answer for one situation, or by adding a flag that
  the examination happens to read: the examination drives the real game through its own
  code, in a fresh browser session each time, and reads what the game actually did.
- Keep the rules. Where this brief states a rule of Doppelkopf - the order of the
  trumps, who has to follow suit, what a trick is worth, what scores an extra, when a
  round is won - that rule is the contract. A repair that changes a rule to make a
  report go away is a new defect.
- Do not touch the six things listed above, and do not undo the offline work. The tree
  has to build and run with no network at all.
- Build before you believe it. What is served is the built output, so a change you made
  in the source only counts once the project's own build has run and produced it.
- Not every defect has a report, and not every report is a defect. Reports 1 to 7
  describe things that are genuinely wrong; report 8 describes two things that are
  working as designed. Work out which is which from the code, not from the tone of the
  report.
