Repair task: a browser quiz engine

## The page you are repairing

What you have is a quiz engine shipped as plain browser JavaScript. There is no framework, no bundler, no transpiler, no type step and no dependency directory anywhere in the tree. One document at the root of the tree loads the engine's own script and a small configuration script, then runs a few inline snippets of its own: one builds a drop-down listing the available question banks, one starts the engine and tidies up after it, one switches the page between two visual modes, and one fetches a little information about the project's repository. The tree is served straight off the disk: the directory that is served is the source directory, nothing is compiled first and nothing is fetched from anywhere else, so the files you read are the files that run.

The question banks are plain JSON files that live inside the tree, in a folder of their own, and the page reads them over the same origin. Each entry carries a question, a list of possible answers, and a single letter saying which of those answers is the right one. The engine turns an entry into a card: the question text at the top, an optional picture, an optional block of source code, one radio button per answer with its own label, and one extra radio button meaning "no answer" which starts out selected. A hidden marker on each card records which position holds the right answer, so that grading can find it again afterwards.

Around the cards the page carries its furniture: a heading, a line spelling out how many points a right answer, a wrong answer and a blank answer are each worth, a drop-down for choosing a question bank, a button that reloads the current bank, three switches (shuffle the questions, shuffle the answers, run a countdown), a slider for how many questions to ask, a countdown read-out, a container the cards are built into, a button that sends the paper in for grading, and a results region that stays hidden until grading has actually happened. Grading walks every card, works out whether the visitor picked the right position, the wrong one, or nothing at all, colours the relevant labels, adds or subtracts points, and writes a summary of correct, wrong, blank and total.

There is also a countdown that starts when a bank is loaded and ticks once a second, printing how much time is left in minutes and seconds, and calling the grading routine when it runs out. Everything the page needs is already inside the tree.

The page is examined at a 1280x720 window with the en-US locale, and every check starts from a freshly loaded page in a fresh browser context, so nothing - not a score, not a rendered card, not a switch position, not a countdown - carries over from one check into the next.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are starting points, not diagnoses: they are not always precise, they do not always say which of several similar things is affected, and they do not always agree with each other.

1. The countdown looks broken. When the seconds drop below ten I get something like 24:50 followed by 24:40 and then a reading with the digits on the wrong side, as if the zero padding moved. It never used to do that.

2. Grading is upside down. I answered a question correctly, the label went green like it should, and my total went DOWN by the points that question was worth. A paper where I got things right finishes with a negative score.

3. When the page opens, the quiz drop-down is not on the first quiz. It sits on the second one and I have to change it back every single time before I start. It used to open on the first.

4. The Send button does not send. I fill in a paper, press it, and instead of a score the questions just get replaced by a fresh set. No result line, no popup, nothing. Reloading and trying again does the same.

5. Guessing is free now. I got half the paper wrong on purpose and my score was exactly the same as if I had left those questions blank - wrong answers cost nothing. The rules line at the top of the page agrees with it, which is somehow worse.

6. The answer buttons have stopped behaving like answer buttons. On a single question I can tick two or three of them at once and they all stay ticked - picking a new one does not untick the one I had before. When I hand the paper in the result is nonsense as well, as though it cannot tell which question an answer belonged to.

7. The switches along the top are answering to the wrong words. I click on the text 'Shuffle Questions' - on the words, not on the little box - and it is the box beside 'Shuffle Answers' that ticks over. Clicking the box itself does the right thing, so I have started avoiding the words entirely, but that is not how it used to be.

8. The whole page looks unstyled - no card borders, no coloured buttons, no icons anywhere, and the little round picture next to the title is a grey square. It also prints a star count of 0 next to the link in the header. Did the stylesheet break?

9. Every single question starts with 'No answer' already ticked, so if I forget a question it is counted as skipped instead of wrong. That looks like a leftover default somebody forgot to remove - shouldn't a fresh paper start with nothing selected at all?

## Not every defect is described in these reports

Not every defect is necessarily mentioned in the reports above, and some of the reports above describe things that are not wrong at all. There are more things wrong with this tree than there are reports, so fixing only what is listed will not finish the job.

Read the engine's own logic through, work out what it is supposed to do, and check the parts nobody wrote in about: the arithmetic behind every figure on screen, how a letter in the data becomes a position on the page, which control belongs to which group, which handler a control actually calls, what the countdown prints on each tick, and anything that only shows up after a timer or a same-origin request has actually finished.

Behaviors you break while fixing other things still count against you, including in regions no report mentions. Equally, do not change something that was never broken: a report that describes correct behaviour is a trap, and editing correct code to match it costs you the checks that were guarding it.

## Things that are not faults

1. The page looks unstyled: no card borders, no coloured buttons, no icons, and the small round picture beside the heading is a plain grey square. The header also prints a star count of zero. All of that is the harness. The document used to pull a component-library stylesheet, an icon-font stylesheet, a remote profile picture and a remote repository-information endpoint from machines outside the tree; with no network at all those requests would hang the render, so the four of them now point at small inert files that the harness ships inside the tree. The page is graded entirely on its text, its attributes, its counts and its booleans - never on its layout - so the absent styling changes nothing that is being examined. Do not restore the outside references, do not delete the inert files, do not give them any behaviour, and do not treat the missing colours, icons, picture or star count as a fault or restyle the document to compensate.
2. Every question starts with its "no answer" radio already selected. That is the engine's own design, not a leftover default: grading decides whether a question was skipped by looking at exactly that radio, and the summary prints a separate line for skipped questions. Do not remove the default selection, do not remove the "no answer" radio, and do not merge the skipped case into the wrong case.
3. The engine prints one Italian sentence when the countdown runs out, and the source carries Italian comments in places. That is the shipped copy. Do not translate it, do not remove it, and do not treat the mix of languages as a fault.
4. The question banks are data files that ship inside the tree, and the page reads them over the same origin. They are not part of the examined surface and none of them is faulty. Do not edit a question, an answer list or the letter that marks the right answer, do not add a bank of your own, do not delete one, and do not move them to another folder or fetch them from anywhere else.
5. The configuration script at the top of the tree holds the tunables the engine reads: how long the countdown is, what a right answer is worth, what a wrong answer costs, what a blank answer is worth, how many questions to ask by default, which visual switches are offered, and which folder the banks live in. Those values are the shipped defaults. Where a report says a figure on screen is wrong, the code that produces the figure is what needs to hold - do not retune a default to make a symptom disappear.
6. The rules of the exam are the rules of the exam: one bank at a time, a fixed number of questions, four or five possible answers each, one right answer, a countdown that grades the paper when it expires, and a summary of correct, wrong, blank and total. None of those is a fault and none of them is a knob.
7. The two visual modes the page offers are its own: one uses the component library's look, the other strips the classes off and draws plain bordered boxes. With no network the library's look is not available, so the two modes currently render almost the same. That is a consequence of the harness and not a fault. Do not remove the switch, do not rewrite either mode, and do not bring the library back from outside.
8. The colours grading paints onto the labels - green for a right answer, red for a wrong one, pale yellow to show what the right one was when the visitor got it wrong or left it blank - are the shipped feedback. Do not recolour them, do not remove the highlighting, and do not replace it with text of your own.
9. The page keeps nothing in the browser's storage and puts nothing in the address bar. That is how it ships and how it must stay. Do not add storage of any kind, do not add a preferences or configuration layer, and do not add anything to the URL.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry no behaviour; they are how the page is addressed while it is being examined, and they must survive your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it needs is already inside the tree. Do not add a remote reference of any kind, do not assume anything can be downloaded, and do not reintroduce a library, a font, an icon set, a stylesheet, an image or an endpoint from outside.
- Repair the behaviour a visitor experiences. Do not special-case the examination, do not add flags, hidden state or a hard-coded branch keyed on a test identifier, do not write anything into the browser's storage, and do not leave anything on the global scope that was not there before.
- Do not delete shipped content, copy, cards, buttons, switches, sliders or data files to make a symptom go away, and do not reorder or rebuild a region unless the report you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the page must still load and run exactly as it does now: no build step, no new dependency, no network access, and the same document reachable at the same address.
- While you are answering, do not run this project's own test, build or serve commands and do not start a browser of your own to check yourself. The grading harness measures the page for you, and a fix that only holds up under your own private way of running it is not a fix.
