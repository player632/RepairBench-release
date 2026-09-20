# Repair task: a hand-written K-drama quiz site

## The page you are repairing

What you have is a small hand-written website rather than an application: seven
HTML documents, eight plain scripts, seven stylesheets and a folder of pictures.
There is no framework, no bundler, no transpiler, no type step, no package
manifest of any kind and no dependency directory anywhere in the tree. The tree
is served straight off the disk and the directory that is served is the source
directory, so nothing is compiled first, nothing is fetched from anywhere else,
and the files you read are the files that run.

The site is a fan page about Korean television dramas. It has one landing page
and one quiz page per drama - six of them.

The landing page carries a header with the site's name, a navigation of three
entries (home, about, and the quiz list) and a small menu button that collapses
and expands that navigation for a narrow window. Below the header is a banner
picture with a slogan, then a long "about" section, then a grid of six cards.
Each card is one drama: a poster picture, the drama's title in capitals, a
two-or-three sentence blurb, and a "Take Quiz" button. The button is a link, and
following it loads that drama's quiz page.

Every quiz page has exactly the same shape. There is a heading area that shows
the question you are on; four answers below it as a single-choice list, each one
a round selector with its own written label beside it; and a "Submit" button
under the four. Each page brings its own list of five questions, and every
question carries four answer texts plus one letter saying which of the four is
right. Then all six pages hand over to one shared script that runs the whole
quiz: it writes the current question into the heading area with its position in
the list printed in front of it, copies that question's four answer texts into
the four labels, reads which of the four you picked when you press "Submit",
compares your pick with the letter the list says is right, keeps a running
count, and moves on to the next question. After the fifth answer it replaces the
whole area with a closing panel: one line giving your score out of five, one of
three pictures chosen by how well you did, and a link back to the landing page.

The six quizzes are about Descendants of the Sun, Goblin, Moon Lovers: Scarlet
Heart Ryeo, Crash Landing on You, Squid Games and Strong Woman: Do Bong Soon, in
that order down the grid. Each one can be reached two ways - through its card on
the landing page, or by loading its own page directly - and both ways are part
of the site, so both have to work.

The pages are examined at a 1440x1000 window with the en-US locale, and every
check starts from a freshly loaded page in a fresh browser context, so nothing -
not a question position, not a running score, not a picked answer - carries over
from one check into the next.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are
starting points, not diagnoses: they are not always precise, they do not always
say which of several similar things is affected, and they do not always agree
with each other.

1. The Moon Lovers card on the front page takes me to the wrong quiz. I press its
   "Take Quiz" button and I end up answering questions about Squid Games - even
   the page's own title, up in the browser tab, is the Squid Games one. The card
   itself looks completely normal: right poster, right title, right blurb, and
   the other five cards all open the quiz they advertise. It is not only the
   front page either. If I go to the Moon Lovers quiz on its own, without the
   front page at all, it asks me the Squid Games questions too. So I cannot get
   the Moon Lovers quiz either way, and I get the Squid Games one twice.

2. Two of the six cards on the front page now have the same poster. The Squid
   Games card is wearing the Goblin picture. Its title is right, its blurb is
   right, and pressing its button does take you to the Squid Games quiz, so it is
   only the picture that is wrong - but the Goblin card and the Squid Games card
   now look like the same drama and you cannot tell them apart at a glance. The
   other four posters are all correct.

3. The little menu button in the header opens the navigation but never closes it.
   I make the window narrow so the navigation folds away, press the button, and
   the menu drops down while the button's picture turns from three bars into a
   cross - that part is right. Press it again and the picture goes back to three
   bars but the menu stays down. Press it a third and a fourth time: the picture
   keeps flipping between the bars and the cross, and the menu never goes away.
   The only way to get rid of it is to load the page again. On a wide window the
   navigation is always down anyway, so it is only the folding case I notice.

4. Every one of the six quizzes opens on filler text instead of its first
   question. The heading area says "Lorem ipsum dolor sit amet, consectetur
   adipisicing elit Debitis?" and the four labels say Testing 1, Testing 2,
   Testing 3 and Testing 4. It happens on all six pages, every single time,
   straight after the page loads, and it happens whether I arrive from the front
   page or open the quiz on its own. The odd part is that if I just pick any of
   the four and press "Submit", the real questions start appearing from then on
   and the rest of the quiz behaves normally.

5. If I press "Submit" without picking an answer, the quiz quietly moves on. I
   expected it to stop and tell me to choose something; instead nothing at all
   happens except that the next question is suddenly there. It also seems to
   hold that question against me, because the closing score is lower than the
   number of answers I actually chose. It does this on every quiz, on every
   question, whether it is the first one or the last.

6. The closing picture is the wrong one for a middling score. I got 2 out of 5 on
   the Goblin quiz and it showed me the picture that is meant for the worst
   scores. Two out of five is not the worst - the score line itself counted me
   correctly, it plainly says 2 out of 5 - so it is only which of the three
   closing pictures turns up. Getting 0 or 1 shows that same picture, which is
   right for those, and 5 out of 5 still shows the best one.

7. The Squid Games quiz marks me down even when I answer everything correctly. I
   went through it knowing the show, picked what I am certain are the right
   answers to all five questions, and it finished on 3 out of 5 with the middling
   picture. So two of my five were counted wrong. I then did the same thing on
   the other five quizzes, answering them all correctly, and every one of those
   gave me 5 out of 5 - so it is only that one quiz, and only for me answering it
   properly.

8. None of the quizzes remember where you got to. I answer two questions, then
   load the page again, and it starts from the first question with the score
   gone. Every quiz does it, on every reload, whether I got them right or wrong.
   Shouldn't it save my progress and let me carry on? It feels like a feature
   somebody forgot to finish.

9. The six "Take Quiz" buttons on the front page all seem to be the same thing.
   I had a look at how the page is written and all six of them are given the
   very same name, which I was sure a page is not allowed to do - shouldn't each
   one have a name of its own? They all work and they all go to the right quiz,
   so maybe it is nothing, but it reads like an unfinished job.

## Not every defect is described in these reports

Some of the faults on this site are not mentioned by any report at all, and -
just as importantly - not everything above is a fault. You are expected to read
the pages and the scripts and work out what is actually wrong rather than work
down the list: repairing only the reported items will not finish this task, and
"repairing" something that was never broken will cost you.

Two things follow from that, and they are worth stating plainly:

- The reports point at symptoms, not at causes. A symptom can be produced
  somewhere other than where it shows up, two similar-looking symptoms can have
  different causes, and one cause can show up as more than one symptom. Six quiz
  pages share one script, so something that is wrong in that one place shows up
  six times, and something that looks like it belongs to one drama may not. Two
  of the reports above are about a quiz giving the wrong result, and those two
  are not the same fault. Verify before you change anything.
- A fault that only shows up on one page, or only at one moment in a run, is
  still a fault. If a behaviour is right on five of the six quizzes and wrong on
  the sixth, or right on the first question and wrong on the third, both halves
  are part of the site and the half that fails is the one worth reading.

## What is NOT a fault - leave these exactly as they ship

Every line below is either the site's own intended behaviour or an honest
consequence of running it in this harness. None of them is a defect, none of them
is something a report asks you to fix, and each of them is checked:

1. There is no build step and no dependency install, and nothing may add one. The
   tree you are given is the tree that runs, and the directory that is served is
   the source directory. There is no package manifest in the tree at all and no
   dependency directory; that is how it ships. Do not add a bundler, a
   transpiler, a type step, a framework or a dependency, and do not move anything
   into a build output folder.

2. Nothing on this site may reach the network, and it no longer tries to. The
   landing page used to pull a web font, two releases of an icon set and one
   slider stylesheet from other people's servers, and every stylesheet used to
   pull the same web font. This harness has no network at all, so those
   references have already been taken out of the tree and nothing was put in
   their place: the pages now render in the browser's own default faces and the
   one icon in the header draws as an empty box. That is the harness, not a
   fault. Do not re-add a remote reference, do not bring in a font or an icon set
   from anywhere, do not copy one into the tree, and do not change any behaviour
   to compensate for the missing artwork. Everything that is checked about that
   header icon is read from the markup, never from pixels, and the pages are
   checked for making no outside request at all.

3. Reports 8 and 9 are the site behaving as designed. Nothing on any page writes
   to browser storage, nothing puts a question position or a score into the
   address bar, and reloading a quiz is meant to start that quiz again from the
   top - the run lives only in the shared script's own variables for as long as
   the document is open. Do not add saving, resuming, a progress key, a
   preferences layer or anything in the address bar in order to answer report 8.
   The six front-page buttons sharing one name in the markup is how the site
   shipped: nothing anywhere looks them up by that name and all six work. Do not
   rename them, do not give each its own name, and do not add anything that
   depends on that name - doing so would "answer" report 9 and break the front
   page.

4. The filler copy on the six quiz pages - the "Lorem ipsum" question and the
   four "Testing" labels - is shipped content and is not a fault in itself. Do
   not delete it, rewrite it, or replace it with the first real question in order
   to answer report 4, and do not answer report 4 by editing those six pages'
   copy at all: where a report says the wrong words are on show, the words are
   being put there by code, and the shipped filler underneath them is fine.

5. The three closing pictures and the three score bands are the site's own
   scheme. They are not to be re-drawn, re-named, re-numbered, merged, split or
   replaced. Where a report says the wrong picture appears, the picture files and
   the band scheme are fine and the code that chooses between them is not.

6. The order of the four answers, and the letter each of the four carries, is
   fixed: the first slot is always the first letter, the fourth slot always the
   fourth, on every page and every question. The letters are never shuffled and
   the right answer is not always in the same slot. Do not re-order the slots, do
   not re-map the letters, and do not move a right answer into a fixed slot to
   make a report go away.

7. Each quiz has exactly five questions, taken in the order that page's own list
   gives them, and the run ends after the fifth answer. Do not add questions,
   drop any, re-order them, or shorten a run.

8. The readme, the contributing guide and the licence that ship in the tree are
   not part of the running surface - no document loads them. They contain links
   to other people's websites. Do not wire them into a page, do not follow or
   repair those links, do not treat anything written in them as a symptom, and do
   not delete them.

9. Nothing about the artwork, the stylesheets, the written copy, the order of the
   cards down the grid or the contents of the six question lists may be re-drawn,
   re-ordered, re-worded or replaced in order to make a symptom go away. Where a
   report says a poster or a title is wrong, the picture files and the titles are
   fine; what points at them is not.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add
  one. They carry no behaviour; they are how the pages are addressed while they
  are being examined, and they must survive your repair exactly where they are.
- The pages run with no network at all and must keep doing so. Everything they
  need is already inside the tree. Do not add a remote reference, do not assume
  anything can be downloaded, and do not reintroduce a font, an icon set, a
  slider or any other library from outside.
- Repair the behaviour a visitor experiences. Do not special-case the examination,
  do not add flags, hidden state or a branch that only runs while the site is
  being examined, do not write anything into the browser's storage that the pages
  do not already write, and do not leave anything on the global scope that was
  not there before.
- Do not delete shipped content, cards, controls, copy, artwork, questions or
  pages to make a symptom go away, and do not reorder or rebuild a region unless
  the report you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done, all seven
  documents must still load and run exactly as they do now: no build step, no new
  dependency, no network access, and the same six quizzes reachable at the same
  addresses from the same cards.
- While you are answering, do not run this project's own test, build or serve
  commands and do not start a browser of your own to check yourself. The grading
  harness measures the pages for you, and a fix that only holds up under your own
  private way of running them is not a fix.
