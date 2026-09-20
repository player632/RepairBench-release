Repair task: a side-scrolling run-and-gun arcade game

## The page you are repairing

What you have is a single-page arcade game, shipped as plain browser JavaScript.
There is no framework of your own choosing, no bundler, no transpiler, no type step
and no dependency directory anywhere in the tree. One document at the root of the
tree loads three third-party libraries that ship inside the tree, and then the
game's own nineteen script files, in the order the document declares them. The game
runs entirely out of the globals those scripts leave behind, and the tree is served
straight off the disk: the directory that is served is the source directory, nothing
is compiled first and nothing is fetched from anywhere else, so the files you read
are the files that run.

The whole game is drawn onto one fixed-size canvas, 800 by 400, sitting in a holder
in the document. A runner stands on the left third of it and the scenery - a city
skyline, a row of houses, three clouds - scrolls past him from right to left, so he
looks as though he is running right. Zombies come in from beyond the right edge and
walk towards him. He can run, jump and shoot; shooting consumes a round from a
magazine of seven, and when the magazine is empty there is a pause before it is full
again. The rounds left are shown as a small row of seven bullets along the top right
of the canvas, and each shot knocks one of them out of the row. A zombie that is hit
dies in a spray of blood; a zombie that reaches the runner ends the run. The scroll
speed and the rate at which zombies arrive both climb slowly as a run goes on, so a
run gets harder the longer it lasts.

Before a run there is a title screen: the game's logo, clouds drifting behind it, a
place to type a name using an on-screen grid of letters, a small confirm button next
to the name, and a music button in the top right corner that is dark until music is
wanted. Once a name is stored the title screen shows it on a small badge instead and
goes straight to a "press start" prompt. During a run the score sits in the top left
with the best score under it, and short praise words pop up over a zombie that was
killed quickly after the one before it. When a run ends two panels slide in: one on
the left with the score just achieved, the number of kills and the accuracy
percentage, and one on the right with the handful of rows from the worldwide
top-score list that sit either side of your own row.

The game keeps four things in the browser's own storage: the best score so far, the
player's name, whether music is wanted, and a record of the score that was submitted
at the end of a run. All four are the game's own doing and all four are meant to be
there. The worldwide top-score list itself is not stored: it is read, at the end of
every run, from a small data file that ships inside the tree.

The pages are examined at a 1280x720 window with the en-US locale, and every check
starts from a freshly loaded page in a fresh browser context, so nothing - not a
score, not a best score, not a stored name, not a music preference, not a scene the
game had reached - carries over from one check into the next.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are starting
points, not diagnoses: they are not always precise, they do not always say which of
several similar things is affected, and they do not always agree with each other.

1. The jump is backwards. I press the jump key while he is standing on the ground and
   absolutely nothing happens, he just keeps running. Then, if I press it again while
   he is already up in the air, he jumps a second time from mid-air, which he has
   never been able to do before. It is the same with the up arrow and with the jump
   button on screen, and it is like that from the very first second of every run. I
   tried three runs in a row and every single one was the same.

2. About a second or two into a run the screen just fills up. They stop arriving one
   at a time and start appearing on every single frame - I counted nine of them on
   screen at once before I had time to shoot twice, and after that it is a wall of
   them and I am dead inside five seconds. It used to be one every second-ish at the
   start and then gradually busier as the run went on. Closing the tab and starting
   again does exactly the same thing, at exactly the same point in the run.

3. The little row of rounds along the top right is out of step with what I have
   actually fired. I shoot once and the round that pops out of the row is not the
   first one, it is the second one, so the first stays lit while I am already down to
   six. And it is worse than cosmetic: when I empty the magazine the gun simply
   stops. No reload sound, no new row of rounds, nothing at all comes back, so the
   rest of the run I cannot shoot and I die. It happens on the seventh shot, every
   time, in every run.

4. The accuracy figure on the end-of-run panel is nonsense. I hit almost everything I
   fired at - maybe four or five shots out of six - and it printed three hundred and
   something percent. And on a run where I panicked and missed everything it did not
   print a number at all, it printed a word. It has always been a percentage between
   zero and a hundred before.

5. The score climbs about twice as fast as it used to. I do not mean the kills, I mean
   the number in the top left that ticks up on its own while you stay alive. I watched
   it against the clock on two runs and it is gaining roughly twice what it gained
   last month for the same amount of time alive. My best score from before now looks
   small next to a run where I did nothing much.

6. When a run ends while I am near the top of the worldwide list, the table of the
   scores around mine does not show up at all. The panel on the left with my score and
   kills and accuracy is there as usual, but the right-hand side stays empty. If I end
   a run further down the list, the table appears normally. It has only started doing
   this recently and it only ever happens when I have done well.

7. The places in that worldwide table are numbered from zero. The best score in the
   world is printed as number 0, the next one as number 1, and so on down the list. It
   used to read 1, 2, 3. The names and the numbers themselves are right, it is only
   the place in front of them that is one lower than it should be.

8. First time I opened the page there was no music and the music button in the corner
   was dark. I sat on the title screen for a while waiting for something to start and
   nothing did. Is the music broken, or is it meant to be silent until I ask for it?

9. I cannot type a name longer than six letters. I wanted to put my whole handle in
   and it just stopped taking keys after the sixth character. Also the last key on the
   grid is not a letter, it is a "<" symbol, which looks like something left over. Is
   the grid meant to be like that?

Not every defect is described in these reports. Behaviors you break while fixing
other things still count against you.

There are more things wrong with this tree than there are reports above, and two of
the reports above describe things that are not wrong at all. Fixing only what is
listed will not finish the job. Read the game's own logic through, work out what it is
supposed to do, and check the parts nobody wrote in about - the gap that is measured
between one kill and the next and what the game does with it, the way a figure is
held inside an allowed band when scenery is recycled, the way a piece of scenery that
has left one edge is placed back on the other, the way each arriving zombie is sent
off in one direction or the other, and the gate that decides how short a name may be
before the game will accept it. Each of those is measured, whether or not anybody
wrote in about it.

Two of the nine reports above are not faults - reports 8 and 9. Both are described,
with what the behaviour actually is, in the next section. Changing either of those
two behaviours in order to answer its report counts against you.

## Things that are not faults

Ten things in this tree look as though they might be wrong and are not. They are
listed here so that nobody wastes a repair on them, and so that nobody is tempted to
change one of them in order to make a symptom go away.

1. A brand new visitor gets no music and a dark music button, and nothing is written
   into the browser's storage on that first visit. That is how the game is meant to
   behave: with no stored preference yet, the preference reads as absent, music stays
   off, the button shows its dark picture and the title screen does not start the
   soundtrack by itself. It is not a broken sound file and it is not a fault. Do not
   make music start on its own, do not give the absent preference a default of "on",
   and do not write a preference the visitor has not asked for.
2. The name grid takes at most six letters and the last key on it is the delete key,
   shown as "<". Both are shipped behaviour: six is the intended cap, and that key
   removes the last letter rather than adding one. It is not a truncated grid and the
   symbol is not leftover. Do not lengthen the cap, do not remove the delete key, do
   not replace it with a letter, and do not rearrange the grid.
3. One reference in the tree used to point at a machine outside it: the worldwide
   top-score list was fetched over the network at the end of every run. It now comes
   from a small data file that the harness ships inside the tree, and the game reads
   it the same way it always did. That repointing is the harness, not a fault. Do not
   restore the outside reference, do not replace the data file with a request of your
   own, and do not treat the local file as something to improve.
4. The rows inside that local data file are fixed harness content, eight of them, each
   a name and a number. They are test data standing in for a real worldwide list. They
   are not stale, they are not a fault, and the game is not supposed to agree with
   them in any particular way. Do not rewrite them, reorder them, extend them, rename
   the entries in them, or make the game depend on one specific row.
5. A second outside reference has been repointed rather than removed: at the end of a
   run the game submits your name and score somewhere, and that submission used to go
   out over the network as a fire-and-forget message whose reply was thrown away. With
   no network at all that would have hung every game over, so the submission now goes
   into the browser's own storage instead. Every step that builds the submitted text -
   the encoding, the character substitution and the reversal - is preserved exactly as
   it was; only the place it ends up has changed. That is the harness, not a fault. Do
   not restore the outside destination, do not add any other reporting, telemetry or
   beacon, and do not simplify or "clean up" the steps that build the submitted text.
6. The script that used to carry that submission also did two other things at load
   time, and both have been taken out. It replaced the page's own console output with
   calls that do nothing, so that nothing the page printed could ever be seen; and it
   ran a self-defending loop that repeatedly dropped the page into a debugger. Neither
   was part of the game, neither is part of the examined surface, and neither is a
   fault. Their removal is the harness. Do not put either of them back, do not add any
   equivalent of your own, and do not treat a page that now prints to its console or
   now stops at a debugger statement as something to repair.
7. The harness also adds one small script of its own, whose only job is to put stable
   `data-testid` attributes on the canvas, on the document body and on the holder the
   canvas sits in. It reads no game state and writes no game state, and it runs again
   when the document finishes loading because the canvas does not exist until then.
   That script is the harness, not a fault. Do not delete it, do not give it any
   behaviour, and do not make the game depend on it.
8. The three third-party libraries that ship inside the tree are shipped as they are.
   They are not part of the examined surface and none of them is faulty. Do not edit
   them, do not replace them with newer copies, do not strip them down and do not
   remove one because you think the game no longer needs it.
9. Everything drawn on the canvas is drawn again from scratch every frame by the
   game's own loop, and the drawing itself is not faulty. Where a report says
   something moves the wrong way, or never arrives, or arrives all at once, or a
   figure reads wrong, the code that decides the direction, the timing, the position
   or the arithmetic is wrong and the drawing is fine. Do not redraw, re-order,
   re-scale or replace any artwork, colour, animation frame list, geometry constant or
   piece of wording to make a symptom go away.
10. The rules of the game are the rules of the game: seven rounds in a magazine, a
    fixed delay between two shots, a fixed pause to reload, a fixed pool of zombies
    that are recycled rather than created anew, a fixed strength for a jump, a fixed
    gravity, a scroll speed and an arrival rate that both climb as a run goes on, and
    a fixed band of heights a recycled house may sit at. None of those is a fault and
    none of them is a knob. Do not change a rule, a constant or a table in order to
    make a symptom disappear.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one.
  They carry no behaviour; they are how the page is addressed while it is being
  examined, and they must survive your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it needs is
  already inside the tree. Do not add a remote reference of any kind, do not assume
  anything can be downloaded, and do not reintroduce a library, a font, an icon set,
  a soundtrack or a score list from outside.
- Repair the behaviour a player experiences. Do not special-case the examination, do
  not add flags, hidden state or a hard-coded test-identifier branch, do not write
  anything into the browser's storage that the page does not already write, and do not
  leave anything on the global scope that was not there before.
- Do not delete shipped content, artwork, copy, panels, buttons, screens or libraries
  to make a symptom go away, and do not reorder or rebuild a region unless the report
  you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the page must
  still load and run exactly as it does now: no build step, no new dependency, no
  network access, and the same document reachable at the same address.
- While you are answering, do not run this project's own test, build or serve commands
  and do not start a browser of your own to check yourself. The grading harness
  measures the page for you, and a fix that only holds up under your own private way of
  running it is not a fix.
