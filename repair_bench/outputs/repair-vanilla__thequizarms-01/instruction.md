Repair task: a small multi-page browser quiz

## The page you are repairing

What you have is a small pub-quiz site shipped as plain browser JavaScript. There is no framework, no bundler, no transpiler, no type step and no dependency directory anywhere in the tree. Five documents sit at the root of it: a front page, the page the round is actually played on, a page that lists the results visitors have saved, and two pages that only exist to be shown when something goes wrong. Three of those documents each load one script of their own, and the tree is served straight off the disk: the directory that is served is the source directory, nothing is compiled first and nothing is fetched from anywhere else, so the files you read are the files that run.

A round works like this. The visitor picks one of three levels of difficulty on the playing page, and that choice decides which bank of questions the page asks for. The tree ships no question data of its own: the page used to ask a remote trivia service for a batch of fifteen questions at a time, and it now reads one of three banks that live inside the tree, over the same origin. Every entry in a bank carries a question, four possible answers, and which of those four is the right one. The page mixes the four answers, writes them into four buttons, works out which button ended up holding the right answer and marks that button with an attribute of its own so that grading can find it again afterwards, and numbers the question it is on.

Answering is one click. The click locks the four buttons so nothing else can be chosen, paints feedback on the button that was pressed and on the frame around the whole round - one colour when the visitor was right, another when they were not, and when they were not it also reveals which button held the right answer - adds to the running score when they were right, and brings out the button that moves on to the next question. Moving on wipes the feedback off the button that was just pressed, clears the marking from the previous question and renders the next one. Once the batch of questions is used up the round ends: the playing area goes away, a final tally is shown, and the visitor may type a team name and save the result. Saving writes the name and the score into the browser's own storage and then goes to the listing page, which reads that storage back and prints one line per saved result, best first, keeping only the top few.

The rest is furniture. The front page carries a heading that leads back to itself, a group of three navigation controls, and a panel explaining how to play which one button opens and another closes. The playing page carries a read-out of which question number the visitor is on and a read-out of the running score, both of which the script keeps up to date as the round goes on.

The page is examined in a 1280x720 window with the en-US locale, and every check starts from a freshly loaded page in a fresh browser context, so nothing - not a score, not a rendered question, not a saved result, not an open panel - carries over from one check into the next.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are starting points, not diagnoses: they are not always precise, they do not always say which of several similar things is affected, and they do not always agree with each other.

1. The way the four answers get mixed up feels broken. Over a dozen rounds I keep seeing the same few orderings come up instead of a proper mix, and the last of the four very rarely stays where it started. It never used to look like that.

2. The scoring has gone tiny. I answer a question correctly, the button lights up green like it should, and the score at the top goes up by one instead of ten. A perfect round finishes in the teens instead of a hundred and fifty.

3. A round ends one question early. I count them as I go and I only ever get fourteen, then it jumps straight to the final tally without asking the last one. It used to run to fifteen - I am sure of it, because a perfect round used to be worth more than a perfect round is worth now.

4. The button that moves you on to the next question is sitting there waiting before I have chosen anything. If I press it straight away the whole page stops responding - no more questions come up, the score stops, nothing works. I have to reload and start the round again from scratch.

5. The question numbering is out by one at the start. The very first question of a round is labelled as number 0, and then as soon as I move on it jumps to number 2 - I never see a number 1 anywhere. It used to start at one like you would expect.

6. The how-to-play panel will not close. I open it from the front page, read it, press the button that is supposed to dismiss it and it stays exactly where it was. Pressing that button again does not help either. The only way I can get rid of it is to reload the whole page.

7. The front page buttons are wired to the wrong places. I press the one that starts a game and I land on the high scores board instead. If I want to actually play I have to type the address in by hand, which is a bit much for a pub quiz.

8. The quiz never seems to talk to the network any more, and every round asks exactly the same questions in the same three banks. I watched the network panel through a whole round and there was not one request to the trivia service. Has the API integration been ripped out?

9. The high scores board is empty every single time. I finished a round, typed our team name in, pressed save, got sent to the board - and there is nothing on it. Not one entry, ever. Is the saving broken?

## Not every defect is described in these reports

Not every defect is necessarily mentioned in the reports above, and some of the reports above describe things that are not wrong at all. There are more things wrong with this tree than there are reports, so fixing only what is listed will not finish the job.

Read the site's own logic through, work out what each part is supposed to do, and check the parts nobody wrote in about: how the four answers get mixed, how a piece of encoded punctuation in the data becomes a character on the page and then gets compared with what a button says, how much a right answer is worth, what gets wiped clean when the round moves on, which question the round stops at, which control each button actually drives, what the page shows before anybody has done anything, and how a saved result is turned into a line of text.

Behaviors you break while fixing other things still count against you, including in regions no report mentions. Equally, do not change something that was never broken: a report that describes correct behaviour is a trap, and editing correct code to match it costs you the checks that were guarding it.

## Things that are not faults

1. Nothing in this tree talks to the network, and the questions never change. Both are the harness. The three documents used to load one remote helper library, the round used to fetch its questions from a remote trivia service at three different addresses, and the stylesheet used to open with an import of a remote web font. With no network at all those requests would hang the page, so all seven of them now point at files the harness ships inside the tree - one inert stand-in for the library, three local question banks, and one inert stylesheet in place of the font import. The two places where the page used to call that library were rewritten, in the same change, into the plain document calls that mean exactly the same thing, which is why the stand-in can be and deliberately is empty of behaviour. The wording of the three banks is meaningless placeholder text and carries no information. Do not restore a remote reference of any kind, do not delete the stand-in, the banks or the inert stylesheet, do not give the stand-in any behaviour, and do not treat the empty network panel, the fixed set of questions or the placeholder wording as a fault.
2. The listing page is always empty during the examination, and that is not a defect either. Saving a result works, and printing the saved results works; but every check begins in a fresh browser context with empty storage, so a result saved by one check can never be seen by another, and there is no such thing as 'just saved' inside a check. Do not delete the saving step, do not make the listing page print anything when nothing was saved, do not write anything into storage at load time, and do not add a persistence layer of your own to make the listing look populated.
3. The two documents that exist only to be shown when something goes wrong, the handwritten testing notes and the folders of screenshots that came with the tree are all shipped content, and nothing in the examination touches them. Do not delete them, do not rewrite them, and do not restructure the tree around them.
4. The rules of the round are the rules of the round: one bank at a time, a fixed number of questions per round, four possible answers to each, exactly one of them right, a running score that goes up when the visitor is right, and a listing that keeps only the best few results. None of those is a fault and none of them is a knob. Where a report says a figure on screen is wrong, the code that produces the figure is what needs to hold - do not retune a rule to make a symptom disappear.
5. The feedback the page paints - one colour on the button that was pressed when the visitor was right, another when they were not, the frame around the whole round changing to match, and the right answer being revealed when the visitor got it wrong - is shipped behaviour. Do not recolour it, do not remove it, and do not replace it with text of your own.
6. The page writes nothing into the browser's storage until the visitor actually saves a result, and puts nothing into the address bar. That is how it ships and how it must stay. Do not add storage of any kind at load time, do not add a preferences or configuration layer, and do not add anything to the address bar.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry no behaviour; they are how the page is addressed while it is being examined, and they must survive your repair exactly where they are.
- The site runs with no network at all and must keep doing so. Everything it needs is already inside the tree. Do not add a remote reference of any kind, do not assume anything can be downloaded, and do not reintroduce a library, a font, an icon set, a stylesheet, a picture or an endpoint from outside.
- Repair the behaviour a visitor experiences. Do not special-case the examination, do not add flags, hidden state or a hard-coded branch keyed on a test identifier, do not write anything into the browser's storage at load time, and do not leave anything on the global scope that was not there before.
- Do not delete shipped content, copy, controls, panels, documents or data files to make a symptom go away, and do not reorder or rebuild a region unless the report you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the site must still load and run exactly as it does now: no build step, no new dependency, no network access, and the same documents reachable at the same addresses.
- While you are answering, do not run this project's own test, build or serve commands and do not start a browser of your own to check yourself. The grading harness measures the page for you, and a fix that only holds up under your own private way of running it is not a fix.
