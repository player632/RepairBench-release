# Repair task: a browser poker table

## What this application is

This is a single-page Texas Hold'em table that runs entirely in the browser. The player names the seats they want to use - any seat left unnamed is filled in with a computer opponent - presses start, and then plays a full hand against the table: the blinds are posted, each player receives two private cards, the shared cards are dealt street by street between betting rounds, and the pot is settled at the end of the hand. A solo player sees their own cards face up on the table. There is also a private-view option for a human sitting at another device, reached through a code or a link, which stays dormant during solo play. The page is entirely static and offline: no build step, no server side, no network access at runtime.

The delivered copy of this application is broken in several distinct places. Your job is to repair it so that it behaves as described below, without breaking anything that already works.

## How the application is meant to behave

1. A seat with a name typed into it is a human player, and a seat whose name box is left empty becomes a computer player when the hand starts - that is exactly what the notice above the table tells the player to do. A hand needs at least two players; a seat that was closed on the setup screen takes no part in it.
2. Closing a seat on the setup screen puts that seat out of the table: it is taken away and stays away, and it never brings back a seat that is already away.
3. When a hand starts, exactly one seat carries the dealer marker, and the small-blind marker and the big-blind marker each land on exactly one seat - two different seats at a full table.
4. The pot in the middle is everything that has been posted and wagered in the current hand. As soon as both blinds are in, it reads the small blind plus the big blind, and it grows as the hand goes on.
5. Before the flop the shared card area in the middle is empty. Shared cards appear there only as each street is dealt - never earlier.
6. At a table with exactly one human, that human's own two cards are shown face up on the table, because the instructions panel promises that a solo player can see their own cards; at a table with more than one human they stay face down.
7. Exactly one seat is lit as the seat to act. The seat whose turn it is is lit and no other seat is.
8. A seat's displayed stack plus the amount it has wagered this round always adds back up to the stack it started the hand with. Posting a blind or making a bet moves chips from one of those two readings to the other; it never destroys any.
9. No seat is marked as the winner of a hand before that hand has actually been decided, and when it has been decided the seat that won is the seat that gets marked.
10. The main action button always names the action that pressing it will actually submit: with nothing to match it reads as a check, at exactly the amount to match it reads as a call, above that it reads as a raise, and at the very top of the range it reads as an all-in - and pressing it there commits the whole stack, exactly as the button says.
11. Bet amounts are handled in whole chip units. Each of the two step buttons moves the amount by one chip unit per press, the slider itself steps in that same unit (so a keyboard arrow or a click on the slider track moves it by that unit too), and the amount on show is always a whole multiple of it.
12. The minus button takes the amount down and the plus button takes it up, one step at a time.
13. Matching exactly the amount that is outstanding is a legal call and is never marked as an illegal raise. Only an amount that genuinely falls outside the allowed raise range is marked that way.
14. Once the hand is under way the setup-only controls go away - the start button, the instructions button, and the per-seat rotate and close icons - and the betting controls appear only while it is a human's turn to act.
15. The page is and stays completely self-contained: nothing is fetched from the network at runtime, and it leaves no trace in browser storage or in the address bar.

## How to read the reports below

The reports are written by players of the table, in their own words, from what they could see on screen. They are the only description of the trouble you get, and they are deliberately imperfect:

- **Not every defect is described in these reports.** Several of the broken behaviours are not mentioned anywhere, and you are expected to find them by reading the code against the intended behaviour listed above and by playing a hand yourself.
- **At least two of the reports describe behavior that is actually intended.** Those are not defects. Changing the behaviour they complain about will be counted against you, because the intended behaviour is verified by the grading run just as strictly as the broken behaviour is.
- A report describes a symptom, never a cause, and it may point at the wrong control: what a player sees misbehaving is not necessarily the place where the mistake sits.
- Reports never name source files, functions or variables, and neither does this brief. Locate the responsible code yourself.

## Reports

**Report 1.** When I drag the bet slider all the way to the top and press the main action button, my player only matches the current bet instead of putting everything in. My chips do not all go into the middle and my seat never shows the all-in state, even though the amount I asked for was my whole stack.

**Report 2.** With the bet slider at its maximum the main action button reads like an ordinary raise. I can no longer tell from the button whether this move will commit my entire stack or just top up the current bet, and those two are supposed to look different to me.

**Report 3.** The most ordinary thing I can do - matching exactly the amount that is already outstanding - is flagged as though it were an illegal raise. The amount readout keeps its not-allowed styling on that plainest of calls, so I keep thinking my own call is not permitted.

**Report 4.** The minus button beside the bet amount moves in the wrong direction. I press it to take my bet down and the amount goes up by one step every time. The plus button is fine; it is only the minus that runs backwards.

**Report 5.** I am the only human at the table, and the instructions say that in that case my own two cards are shown to me face up on the table. Instead my seat shows two card backs for the whole hand, so I can never see what I am actually holding.

**Report 6.** The highlight that says whose turn it is has gone backwards. The player who is supposed to act is the only seat that is not lit, and every other seat at the table is lit up instead. I cannot tell who the action is on.

**Report 7.** Before I press the start button the middle of the table reads a pot of zero and the shared card area is completely empty, and it is still empty right after the hand begins. It looks as if the table never initialised. Please put something sensible there so the page does not look broken before the first cards are dealt.

**Report 8.** I typed a name into my own seat and left the other five name boxes empty, and the moment I started the hand all five of them turned into computer players. That looks like the table is hijacking seats nobody claimed - an empty seat should stay empty instead of being filled in behind my back.


## What you must leave alone

Repair only what is broken. Keep every other behaviour as it is: the table layout and the six seats themselves, the chip-stack artwork and how many chips it draws, the seat rotation control; the wording of the notice above the table, of the instructions panel, of the version panel and of the statistics and log panels, and the way those panels open and close; the sound toggle and its default state, the blind schedule and how the blinds go up over a session, the hand-ranking logic, and everything the computer players decide to do; the private-card and remote-table entry points staying dormant during solo play, and the saved-game panel staying closed when there is no saved game to resume; the fact that the page never touches the network, never registers anything that intercepts requests, and never writes to browser storage. The grading run checks a broad set of these untouched behaviours as invariants, so a repair that improves one symptom while disturbing any of them scores zero.

There is no build step and no dependency installation: the tree you are given is the tree that is served. Do not add a bundler, a framework, a package manifest, a remote font or any other new runtime dependency, and do not add debugging hooks of your own to the page.
