# Repair Task - domestic-cat (vanilla JavaScript)

You are working on the source code of a small German information site about the
domestic cat, "Die Hauskatze". It is a school project turned into a static site:
7 hand-written pages, a folder of local pictures, and one ten-question quiz that
six of those pages carry. There is no framework, no package manifest, no lockfile,
no bundler and no build step of any kind: the tree you are given is the tree that
runs. The harness serves it over plain HTTP from its own root directory and loads
the start page, which links three local stylesheets plus one local icon stylesheet
and then, after the body of the document, pulls in four classic scripts in a fixed
order, with the two faces this task adds placed ahead of all four of them.
Everything the site needs is already inside the tree, so nothing at all is fetched
from the network at runtime - and it has to stay that way.

The start page has a logo, a row of navigation links to the other pages, a short
note about where the site came from, a cat photograph, a button labelled
**Zufällige Katze**, and the quiz. 6 of the 7 pages (the start page, a profile page, a
fun-facts page and three breed pages) carry the same navigation row and the same
quiz; the sources page (**Quellen**) carries the navigation but no quiz at all.

The quiz is three panels in one place. First a rules panel with five numbered rules
and two buttons, **Abbrechen** and **Weiter**. Then the quiz panel: a title, a
countdown that reads **Zeit:** followed by a seconds figure, a thin progress line
underneath the panel's own heading, the question line, four answer options, and a
footer that reads "N von 10 Fragen" next to a **Weiter** button. Then the
result panel: an icon slot, the sentence "Du hast das Quiz beendet!", a score line
and a verdict, plus
**Erneut spielen** and **Schließen**.

The rules the site is meant to follow:

- The question bank holds exactly 10 questions. Every question carries its own display
  number in the data itself, and for these 10 questions those numbers are 1 through
  10 in order. The number shown in front of a question is that question's own number,
  and it has to agree with the "N von 10 Fragen" counter in the footer: when the
  second question is on screen, both of them say 2, and when the last one is on
  screen, both of them say 10.
- The question line shows the reader the question, with its number in front of it.
  Nothing belonging to the page's own markup - no bracket, no tag name, no fragment
  of source - may ever become visible to the reader anywhere in the quiz.
- Each question gives you 10 seconds. The seconds figure counts down from 10, and
  from 9 downwards it is written as a two-digit figure with a leading zero (09, 08,
  and so on down to 00). When the time really is up, the label says so, the correct
  answer is marked and the whole row of options is locked.
- Once you have answered, all four options are locked and stay locked: an answer
  cannot be withdrawn, not even the last of the four, and the **Weiter** button in
  the footer appears so you can move on.
- The thin progress line under the quiz heading moves steadily to the right while a
  question is on screen, and starts over from the left for the next question.
- After the last question the result panel shows how many points you scored out of
  10, and a verdict in five tiers: the top tier for 8 or more points, then 5 or
  more, then 3 or more, then exactly 1, then 0. A perfect run of 10 correct
  answers earns the top tier and nothing less.
- On a narrow screen the navigation row collapses to a three-bar entry: one tap
  opens the menu, a second tap closes it again, and after that a third tap opens it
  once more. Opening and closing alternate forever; neither state ever sticks.
- Scrolling down any page reveals a "back to top" button, and being at the very top
  of the page hides it again. Pressing it returns the page to the top.
- The **Zufällige Katze** button replaces the cat photograph with one of the 36
  photographs in the site's own folder of random cat pictures, which are numbered 1
  through 36. Every single press has to land on a picture that really is there,
  and the set of pictures the button can reach is exactly that numbered folder.
- Clicking the logo swaps it to its second version and tilts it; clicking the logo
  again swaps it back and straightens it. That is a small deliberate easter egg, and
  both halves of it are intended.
- The sources page has no quiz: no quiz entry in its navigation row and no quiz
  panel in its body. That page is a plain list of sources, and that is how it is
  supposed to stay.

How to read the reports below:

- Each report is what one user saw and wrote down, not a diagnosis. The cause is
  somewhere in the codebase, it may sit in a different place from where the symptom
  shows up, and one cause can show up as more than one complaint.
- **At least two of the reports describe behavior that is actually intended.**
  Verify a report before changing anything because of it: a "fix" to normal
  behavior is itself a regression, and it is checked for.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.
- Several reports point at a layer that turns out to be perfectly healthy, and a
  few of these are one-word or one-token mistakes. Read the whole of a small
  function, or the whole of a rule, before you decide which line is wrong; at least
  one of them is nothing more than a question of which of two readings of the same
  value is the one that is actually live.
- Several of the defects have consequences that nobody wrote down, and a couple of
  them only become visible after real time has passed or after the whole quiz has
  been played through to its end. A repair that only makes the quoted sentence stop
  being true, without restoring the whole behavior around it, will not pass.

## The reports, in no particular order:

1. In the quiz, the line where the first question should be is not the question - it is a piece of source. I can see angle brackets and a short tag name in there, and the question text only after them. The four answer buttons underneath look perfectly normal and the rest of the quiz behaves, so it is that one line.

2. The thin bar at the top of the quiz panel - the one that is supposed to creep from left to right while you think about a question - never moves. Not on the first question, not on the last, not on a second run. Everything else in the panel is there (the title, the seconds figure, the question, the four options), so it is only that bar that never fills.

3. When I click the logo at the top of the page it tilts a little and turns into a different picture; clicking it a second time puts it back the way it was. That looks like a rendering glitch to me - a logo should not change when you click it.

4. The seconds figure in the quiz never goes down. It sits on the value it started with for as long as I wait, and then after a while the quiz announces that the time is up anyway and marks the answer for me. The figure and the real countdown behave as if they had nothing to do with each other.

5. On my phone the three-bar menu opens when I tap it, but a second tap does not close it again - the list just stays open and I have to reload the page to get rid of it. At desktop width I cannot see the three bars at all, so I cannot tell whether it behaves the same there.

6. The "Zufällige Katze" button never gives me the picture I would expect. It looks as if the whole stack of cat photographs had been shifted by one place, and once in a while no picture appears at all - just a broken image where the cat should be.

7. On the Quellen page the quiz is missing completely: there is no quiz entry in the navigation there and no quiz panel anywhere on the page, while every other page has both. Did the quiz break on that page, or was it taken off it?

8. I played the quiz through and answered all ten questions correctly; the score line at the end agrees, it says I have all of them. But the verdict sentence next to it is not the best one - it reads like the verdict for a middling run. All ten correct should be the top verdict.

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the site intact - including the
logo's two-sided swap and tilt, the sources page staying a plain list with no quiz
on it, the navigation row and its links on every page, the rules panel with its five
numbered rules and its two buttons, the ten questions and their four options each,
the marking of the right and the wrong answer, the footer counter and its
denominator, the seconds countdown and its "time is up" ending, the progress line's
steady walk, the five verdict tiers and the score they are read against, the
"back to top" button appearing on the way down and hiding at the top, the random
cat picture always coming out of that numbered folder, the result panel's two
buttons and what they do, and the other five pages carrying the same quiz the start
page carries - none of which any report asks you to change. The tree must still load
and run exactly as it does now when you are done: no build step, no new dependency,
no module system, no network access.
