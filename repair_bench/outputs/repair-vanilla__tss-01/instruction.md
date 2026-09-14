# Repair task: a tactical sailing trainer that runs entirely in the browser

## The page you are repairing

One static page: a tactical sailing trainer that draws a race on screen and lets a visitor sail it
one turn at a time. There is no build step, no framework and no dependency directory anywhere in
the tree - the browser loads the entry document (about 900 lines), the page's own eight scripts
(about 3,200 lines) and one stylesheet of 314 lines straight off the disk, together with a vendored
widget library and its stylesheet that already ship inside the tree. Nothing is fetched at runtime:
there is no server side, no API and no data file, and every figure a visitor sees is produced by
those files. The only state that outlives a document lifetime is what the page writes into the
browser's own local storage.

Top to bottom, the page carries:

- a drawing area that scales itself to the window and holds the course (a start line, the marks and
  the lane lines), a wind arrow, one boat per sailor, and one trail polyline per sailor drawn from
  the points that sailor has already sailed.
- a start phase: for each sailor a choice of start position (left, middle or right), a name box and
  a row of controls, plus a control to add another sailor and the control that starts the race.
- a race phase: for each sailor a row of turn controls (sail forward, tack, sail to the mark) with
  three radios that fix the order those turns are applied in, a turn counter, and a Back control
  that undoes the last turn one turn at a time.
- a course chooser that lists the wind courses the page ships with, grouped under their own
  headings, with a course editor behind it: course width, course height, start line size, a name, a
  list of wind values in degrees, a live preview of the course, an average wind figure and a counter
  beside it. Saving from the editor adds a course of your own to the chooser; a separate edit path
  rewrites the course you are already on.
- a drawer that lists the shipped collections of courses, each collection with a control that adds
  its courses to the chooser.
- four display preferences - boats, trails, lane lines and equal length lines - each a tick box,
  each applied the moment it is changed and each remembered between visits.
- a results table for a series of races, with a setting for how many races to exclude from each
  sailor's total, and printing, import and export beside it.
- a help window, a window listing what changed in recent versions, an install prompt, a zoom check
  and a full screen / projector mode, plus a keyboard shortcut for adding a sailor.
- two languages: the page follows the browser's own language list and ships an English and a
  Russian set of labels.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are starting points, not
diagnoses: they are not always precise, they do not always say which of several similar things is
affected, and they do not always agree with each other.

1. The trail behind my boat has stopped growing. I make a turn, the boat sails on, the turn counter
   goes up - but the line that shows the water I have already sailed stays exactly as it was and
   never catches up for the rest of the race. It used to fill in a moment or so after every turn.

2. Tacking only works once. The first press of the tack control brings the boat over to the other
   side, and every press after that leaves her where she is: she never comes back, so instead of a
   beat up the course I sail one identical leg after another. My opponent's boat, which I never
   touch, still tacks both ways.

3. The turn controls on screen are the wrong pair. With my boat on starboard tack the starboard
   controls have disappeared and only the port ones are left showing - it used to be the other way
   round, and now the little arrow icon beside the sailor points the wrong way for the side she is
   actually on. It is like that for every sailor in the fleet, and it is already wrong before the
   race starts.

4. I can add a sailor in the middle of a race. Pressing the A key while we are already sailing drops
   a third boat into the water with its own row of controls and its own place in the start order.
   That key should only do anything on the start screen, before the race has begun.

5. The first time I open the page in a browser that has never seen it, it is sailing some course I
   never chose, with gusts I do not recognise, instead of the course I usually sail. Coming to the
   page on a new machine means picking my course all over again.

6. The average wind figure in the course editor has gone mad. I type three ordinary values - 5, 10,
   15 - on the standard sized course and it prints something over a hundred instead of a figure near
   ten. Typing two more values leaves it just as nonsense, and the number it prints moves when I
   resize the course.

7. The names I type for the sailors never reach the race. I type a real name into each box, the
   boxes keep it, the rows in the control panel show it - but the results and the finishing order
   still call them Player 1 and Player 2, whatever I typed.

8. The little counter beside the wind box in the course editor, the one that reads like "3 / 37",
   jumps about on its own. I typed two more wind values and made the course taller and it went
   straight to "5 / 65". I am sure it is losing part of what I typed.

9. When I build a new course in the editor and save it, the course turns up in the chooser but the
   page keeps sailing the one I was on before. I have to go and pick my new course by hand every
   time; it used to switch over to it as soon as I saved.

## Not every defect is described in these reports

Some of the faults on this page are not mentioned by any report at all, and - just as importantly -
not everything above is a fault. You are expected to read the page and work out what is actually
wrong rather than to work down the list: repairing only the reported items will not finish this
task, and "repairing" something that was never broken will cost you.

## What is NOT a fault - leave these exactly as they ship

Every line below is the page's own intended behaviour. None of them is a defect, none of them is
mentioned in the reports as something to fix, and each of them is checked:

1. When the page loads, each sailor's turn order radios are already set with "tack" ticked and
   "forward" not ticked. That is the shipped default for every sailor, not a leftover from a
   previous visit, and it must stay that way.

2. As soon as the page loads it creates two entries of its own in the browser's local storage, even
   before the visitor has chosen anything. Both belong to the page, and nothing else is ever written
   there: no third entry, no session storage, nothing on the address bar.

3. The average wind figure the editor prints is an average taken over the whole course grid, not the
   plain mean of the numbers in the box. It therefore does not usually equal that mean: three values
   of 5, 10 and 15 on a course 40 by 30 print a figure just under ten. With an empty wind field it
   prints 0.0. Leave that arithmetic alone.

4. In the results table a race that has been excluded is still shown, in brackets - "(4)" rather
   than "4" - and it is left out of that sailor's total. The brackets are the shipped way of marking
   an excluded race.

5. With the exclusion setting switched off, nothing is dropped from anybody's total: the marker for
   "which race was discarded" reads -1 for every sailor, and sailors with equal totals share the
   same rank instead of being ordered between themselves.

6. The course editor opens for a course that has not been saved yet with the placeholder name
   "User Defined 1", an empty wind field of three zeros, and the three size fields already filled in
   at 40, 30 and 15. Those are the shipped defaults for a new course.

7. The chooser ships with eight courses under a single heading. A course the visitor saves themselves
   goes under a second heading of its own, which only exists once there is such a course; editing a
   course of your own rewrites it in place and adds no heading and no entry.

8. The drawer of shipped collections lists three collections of five courses each. Opening the drawer
   does not change the chooser, and opening it twice in a row does not list the collections twice.

9. A sailor whose name box is left empty keeps the placeholder name the page ships with, and the
   race still starts. Leaving a name empty is not an error and does not block the start control.

10. The Back control undoes one turn at a time. After it, the fleet is back to the geometry it had
    before that turn: the same positions, the same headings, the same sides and the same trails.

11. The trail of each sailor is a polyline of the points that sailor has actually sailed, drawn in
    that sailor's own colour inside a layer of its own, and the layer has its own opacity. A trail
    is not a course outline and it is not shared between sailors.

12. The A key adds a sailor while the page is still on the start screen, up to the limit the page
    allows, and the new sailor arrives with its own boat, its own trail layer, its own row of
    controls and its own place in the start order. That is the legitimate path for adding a sailor.

13. The wind arrow, the lane lines and the mark layer all rotate with the wind of the step being
    sailed, and the whole drawing scales to the window it is in: the drawn area is a fixed multiple
    of the course dimensions in degrees, so a course 40 by 30 is drawn 800 by 600.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry no
  behaviour; they are how the page is addressed while it is being examined, and they must survive
  your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it needs is already inside
  the tree. Do not add a remote reference, do not assume anything can be downloaded, and do not
  reintroduce a font, an icon set or a library from outside.
- Repair the behaviour a visitor experiences. Do not special-case the examination, do not add flags
  or hidden state, do not write anything into the browser's storage that the page does not already
  write, and do not leave anything on the page's global scope that was not there before.
- Do not delete shipped content, controls, courses, collections, copy or artwork to make a symptom go
  away, and do not reorder or rebuild a list unless the report you are answering is about that
  list's order.
- Keep every change inside this page's own files. Nothing outside the page may change, and there is
  no build step to run: what you edit is what the browser loads.
