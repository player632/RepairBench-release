# Repair task: a multi-page quiz site for people learning to program

## The site you are repairing

What you have is a small quiz site written in plain JavaScript against the
document object model, with no framework, no bundler, no transpiler, no type
step and no runtime dependency of any kind. It is not one page: it is a
handful of separate documents at the root of the tree, each of which loads
exactly one script with an ordinary script tag and styles itself from a
stylesheet in the tree. The directory that is served is the source directory,
so the files you read are the files that run and nothing is compiled first.

A visitor walks through it like this:

- a home page with a welcome panel, an author credit and two buttons, one of
  which starts a quiz and one of which opens the leaderboard;
- a category page listing the seven subjects the site ships question banks
  for - general, HTML, CSS, JavaScript, PHP, Python and Java - where picking
  one starts a quiz on it;
- the play page: a header strip carrying the question number out of ten, a
  progress bar and the running score, then the question itself and four
  labelled answer choices underneath it. Picking a choice flashes that choice
  green or red for about a second and then moves on to the next question. A
  quiz is always ten questions, a correct answer is always worth ten points,
  and the questions are drawn at random out of the bank for the category
  without repeating one;
- a congratulations page showing the final score, with a name field, a Save
  button, and links to the review page, to another quiz, back to the category
  page and home;
- a review page that shows the ten questions you just answered as a deck of
  cards, one card visible at a time, with a forward and a backward arrow, a
  row of ten numbered buttons that jump straight to a card, and a line under
  the card naming the question you are on. A card shows the question, what
  you picked, and what the right answer was;
- a leaderboard page listing every score that has been saved, best first,
  with the name and the subject next to each one, and a button home.

The pages hand their state to each other through the browser's own storage:
the category you picked, the record of what you answered, the score you
finished with, and the saved leaderboard rows. There is no server-side state
and no account.

The site is examined at a 1280x720 window with the en-US locale, and every
check starts from a freshly loaded document in a fresh browser context, so
nothing - not a score, not an answer record, not a saved name, not a
leaderboard row - carries over from one check into the next.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are
starting points, not diagnoses: they are not always precise, they do not
always say which of several similar things is affected, and they do not always
agree with each other.

1. The score at the top of the play page never gets past ten. I answered four
   questions correctly in a row and the read-out still said 10 the whole way
   through - it went to 10 on my first correct answer and then stopped
   moving, however many more I got right. Getting one wrong does not change
   it, which I accept, but getting one right definitely should. The question
   number next to it and the progress bar both keep going normally.

2. The review page shows me the same question ten times. When a quiz is over
   I open the review and all ten cards carry the question text of the last
   thing I answered. It is not that the page has lost my answers - the
   "Selected" and "Answer" lines underneath differ from card to card, so it
   clearly still knows what I picked on each one - but the question itself is
   the same sentence on every card.

3. The congratulations page does not show my score. I finish ten questions,
   the page moves on to the congratulations screen, and where the big number
   should be it says the word null. Not zero, not a blank: that literal word.
   Playing again does the same thing every time. The review page still opens
   and still has ten cards, and the leaderboard still works, so the quiz
   itself did finish and something did get recorded.

4. On the review page the numbered buttons light up and then stay lit. There
   is a row of ten of them under the card and the one for the card you are on
   is highlighted, which is right - but the one you just left stays
   highlighted as well. Click forward through the deck and after ten clicks
   all ten are lit, so the highlight stops telling you anything.

5. The leaderboard page is completely blank on a browser that has never saved
   a score. Not "no scores yet" - the page has a line for that and it never
   appears. You get the heading, the button home, and an empty area where the
   list should be. As soon as I save one score the page starts working and
   shows the list properly, and it keeps working after that.

6. Pressing Save on the congratulations page does not take me home. I type a
   name, I press Save, and I end up back on the congratulations page again
   with the same score on it. The save itself is not the problem: the row
   really is there when I open the leaderboard, with my name and my subject
   and the right number. It is only that I am left sitting where I was
   instead of being sent home.

7. The leaderboard order is wrong once anybody scores a hundred. My friend
   got 100 and I got 90, and the list puts me first. Two-digit scores against
   each other look fine; it is the three-digit one that sinks, as though the
   list were being ordered by something other than the size of the score.

8. The Save button is greyed out and will not let me save. When I reach the
   congratulations screen the button is disabled and nothing happens if I
   click it. It only wakes up once I have typed something into the name
   field, and if I clear that field out again it goes back to sleep. Is that
   a fault? It feels like it ought to let me save straight away.

9. The green and red marking vanishes. When I pick an answer the choice
   flashes green - or red if I got it wrong - for about a second, and then
   the colour is gone and the next question is on the screen. Should it not
   stay marked, so I can look back and see what I got right? It is as if the
   marking is being thrown away a moment after it is drawn.

## Not every defect is described in these reports

Some of the faults on this site are not mentioned by any report at all, and -
just as importantly - not everything above is a fault. You are expected to
read the code and work out what is actually wrong rather than to work down
the list: repairing only the reported items will not finish this task, and
"repairing" something that was never broken will cost you.

Two things follow from that, and they are worth stating plainly:

- The reports point at symptoms, not at causes. A symptom can be produced
  somewhere other than where it shows up, two similar-looking symptoms can
  have different causes, and one cause can show up as more than one symptom.
  Reports 2 and 4 are both about the review page and they are not the same
  fault; neither of them is the whole of that page's story either, and there
  is more than one way for a card deck to be wrong. Report 6 goes out of its
  way to say the save worked - the fault it is describing is only about where
  you end up afterwards. Verify before you change anything.
- A fault that only shows up at an edge is still a fault. The review deck has
  a first card, a last card and a pair of arrows that are meant to carry you
  round between them; the leaderboard has a first-time visitor with nothing
  saved and a returning one with a full list; a quiz has a first question and
  a tenth. Behaviour that is right in the middle of a range and wrong at the
  ends of it is worth reading rather than worth ignoring.

## What is NOT a fault - leave these exactly as they ship

Every line below is either the site's own intended behaviour or an honest
consequence of running it in this harness. None of them is a defect, none of
them is something a report asks you to fix, and each of them is checked:

1. Report 8 is the save guard, not a bug. The congratulations page requires a
   name before it will save one, so the button is disabled until the name
   field has something in it and is disabled again when the field is emptied.
   That is the shipped contract and it is measured. Do not enable the button
   unconditionally, do not invent a placeholder name, and do not save a row
   with an empty name.

2. Report 9 is the answer flash, not a bug. A picked choice is marked for
   about a second and then the mark is taken off again before the next
   question is drawn. Do not make the mark permanent, do not lengthen the
   window into a review of its own, and do not keep a visible history of
   marks on the play page.

3. A quiz is ten questions and a correct answer is worth ten points. Those
   are the shipped rules and the checks measure them. Do not change the
   length of a quiz, the value of a correct answer, or the way the score is
   accumulated, and do not add a difficulty setting, a timer, a streak bonus
   or a partial-credit rule.

4. Which questions come up, and in what order, is drawn at random from the
   bank for the category that was picked, and a question is never asked twice
   in one quiz. That randomness is intended. Do not pin it to a fixed seed,
   do not make the draw deterministic, do not re-order the draw, and do not
   change which questions a quiz is allowed to contain in order to make a
   symptom easier to reproduce.

5. The seven question banks are data, not behaviour. Their wording, their
   four choices, which choice is the right one, and the order they are stored
   in are all shipped content. Do not correct a question, re-word one,
   de-duplicate them, trim them, add to them, re-order them, or add or remove
   a subject.

6. The site makes no off-machine request and must keep making none. Every
   question bank, stylesheet, image and sound is already inside the tree, and
   the play page reads its bank from the tree it is served from. The footer
   of each document carries an author-credit link that points at an address
   outside the tree; that is shipped content, no page ever fetches it, and no
   check follows it. Do not remove those links, do not re-point them, and do
   not add a remote reference, a font, an icon set, a library or an audio
   file from outside.

7. The multi-page shape is intended. Six documents, each loading its own one
   script, handing state to the next through the browser's own storage - that
   is the design, not an accident. Do not merge the pages into one document,
   do not add a router or a client-side view layer, and do not add a build
   step, a dependency or a network call to make the hand-off easier.

8. The tree also carries a seventh document that nothing links to any more,
   and two scripts that no live document runs. They are shipped leftovers
   with no behaviour on any page a visitor can reach. Do not delete them, do
   not wire them back up, and do not finish or rewrite them; equally, do not
   treat anything you find in them as a description of how the live pages
   ought to behave.

9. The two answer sounds are fired and forgotten: the right one is played
   when a choice is marked. Do not build a sound queue, a mixer, a mute
   toggle, a volume control or a preloading cache, and do not treat a browser
   that refuses to start audio before a visitor gesture as something to work
   around.

10. Opening the review page with nothing recorded yet is a degenerate case:
    there are no cards to show, and the page says so. Its behaviour in that
    state is the same before and after your repair and is checked as it
    stands. Do not add a card to it, do not hide the row of numbered buttons
    to make it tidy, and do not make that state depend on anything you add.

11. Nothing about the stylesheets, the images, the sounds, the wording of the
    documents or the layout of any page may be redrawn, resized, re-ordered
    or replaced in order to make a symptom go away. Where a report says
    something on screen is wrong, it is being produced by code that is wrong;
    the shipped markup, artwork and copy are fine.

## Ground rules

- The tree carries a small amount of verification instrumentation that the
  grading harness reads the pages through. It adds no rule, no constant and
  no branch to the quiz. Do not remove it, rename it, edit it, wrap it, or
  make your repair depend on it, and do not let any behaviour in the pages
  key off its presence. It must survive your repair exactly where it is, in
  every document that carries it.
- Repair the behaviour a visitor experiences. Do not special-case the
  examination, do not add flags, hidden state or a hard-coded
  test-identifier branch, do not write anything into the browser's storage
  that the site does not already write, and do not leave anything on the
  global scope that was not there before.
- Do not delete shipped content, pages, buttons, links, question banks,
  artwork or copy to make a symptom go away, and do not reorder or rebuild a
  region unless the report you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the site
  must still load and run exactly as it does now: no build step, no new
  dependency, no network access, and the same six pages reachable from the
  same home page.
- While you are answering, do not run this project's own test, build or serve
  commands and do not start a browser of your own to check yourself. The
  grading harness measures the pages for you, and a fix that only holds up
  under your own private way of running it is not a fix.
