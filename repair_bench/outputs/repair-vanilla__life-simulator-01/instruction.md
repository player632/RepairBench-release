# Repair Task - life-simulator (vanilla JavaScript)

You are working on the source code of a small browser **life simulator** written in
plain JavaScript, in the family of BitLife and the old Instant Life: you play one
character from birth to death, one year at a time. There is no framework, no package
manifest, no lockfile, no bundler and no build step of any kind: the tree you are
given is the tree that runs. The harness serves it over plain HTTP from its own root
directory and loads the game's single top-level page, which pulls in two local
stylesheets, twelve classic scripts in a fixed order and a folder of local pictures.
Everything the game needs is already inside the tree, so nothing at all is fetched
from the network at runtime.

The page opens on a "Create your character" screen with two buttons: **Random**,
which deals you a whole character you did not choose, and **Custom**, which opens a
small form for a name, a family name, a starting age and a starting amount of money.
After that the whole game is one screen: the money you have along the top, your five
qualities (Health, Happiness, Smartness, Appearance, Fitness) drawn as five filled
bars, your life story written out as one line per year, a heading above that story
which names the stage of life you are in (Childhood, Teenage years, Adulthood,
Elderhood), and a cluster of buttons along the bottom - **Relationships**,
**Profile**, **Career**, **Age** and **Activities**. Most of those buttons open a
side panel with a heading and a list of things you can do; choosing one of them
either does it straight away or opens a dialog in the middle of the screen with a
heading and a few things to pick from. **Age** is the heartbeat of the game: one
press lives through a whole year, and everything a year brings - school, work,
money, practice, health, the chance of dying - happens inside that one press.

The rules the game is meant to follow:

- One press of **Age** advances exactly one year, and by the time that press is
  over the screen is showing the year you have just finished: the money along the
  top, the story line for that year, the qualities, the stage-of-life heading and
  any list you had open are all up to date with it. Nothing on the screen is left
  one year behind, and nothing needs a second press or an unrelated click to catch
  up.
- The money along the top is the money you have now. The line under it and the way
  it is coloured describe how the year you just lived changed that money, and both
  of them follow that year - never the year before it.
- You start school at 6, you start high school in the year you turn 12, and
  university is open to you from 17. Each of those steps writes its own line into
  your story, and the line says what actually happened to you.
- Everybody over 18 has a driving licence from the very first frame of their life
  and nobody 18 or under has one. That is settled once, from the age the character
  created with, and it is settled after that age is known - so a character made at
  25 arrives already holding a licence, and one made at 12 arrives without
  one, and neither of them has to wait a year for it.
- A skill goes up a level when the experience you have earned in it reaches what
  that level asks for. Experience earned past that mark is not thrown away: it
  carries into the next level, and what the next level asks for is worked out from
  the level you are moving on to, not from the level you just left. Practising the
  same thing year after year therefore has to keep taking you further, and the
  second time round has to leave you ahead of where the first time left you.
- Your skills are listed when you have something to show for them. Any level at all
  in a skill puts it in the list, and so does having earned experience in it while
  still at level 0 - a beginner who has practised once is supposed to see the skill
  they are practising. A skill you have never touched is not listed, and when there
  is nothing to list the page says so in words.
- Every job you take is your own job. The record of it carries the year you started
  it, and when you leave, that record - with the year you really started - is what
  goes into your work history. Taking the same job again later is a fresh record
  with a fresh starting year; two stints in the same job must never end up sharing
  one and the same record.
- What you buy is yours one item at a time. Each thing you own keeps its own place
  in the list of what you own, that list is rebuilt whenever it changes, and the
  thing you click is the thing you get. Selling one of two items leaves the other
  one there and still clickable; selling the last one leaves an empty list.
- Some things you may only do a limited number of times in a year: three friendly
  outings with somebody you know, and the count starts again with the next year. The
  limit is per year and per acquaintance, and it is not something the year press itself
  may skip.
- The switches you pay for - reading, the gym, music lessons and the rest - show
  which way they are set: the knob sits on the right when the thing is on and on
  the left when it is off, it moves in the same press that turns the thing on, and
  turning one on books the yearly cost it advertises against your money.
- A dialog is hidden until something opens one, and until then the page behind it
  is fully visible and fully usable. Nothing at all covers the screen while the
  game is just sitting there, and closing a dialog leaves the screen uncovered
  again.
- The shop sells what it lists at the prices it lists. One of those prices really
  is five dollars, and a price that looks silly next to its neighbours is not
  automatically a mistake.
- The property market shows what is on offer ordered from the dearest down to the
  cheapest, so the first thing in that list is the most expensive one there is.
  That ordering is intended and is not a bug.
- When you die the game says so, writes your obituary, and offers you a new life;
  the story you had stays readable up to the year you died.

Environment notes - properties of this offline harness, not defects:

- There is **no build step and no dependency install**. Do not add a package
  manifest, a bundler, a transpiler or a framework, and do not split the game into
  modules; the verifier serves the tree exactly as you leave it. Repair the code in
  place.
- There is **no network access, and nothing in this tree needs it**. Every picture
  and both stylesheets are local files. The icon set the page asks for comes from a
  local stand-in that keeps the space the icons would occupy but carries no
  pictures of its own, so **a button that is meant to show a small picture may look
  empty**: that is the harness, it is the same on every run, and it is not
  something to repair.
- The harness drives the game in a real browser at a **1440x900 viewport**.
- Every checkpoint starts from a freshly loaded page in a **fresh browser context**,
  so nothing at all - not a character, not a year, not a purchase, not any stored
  value - carries over from one checkpoint into the next.
- The game never reads a clock, never waits on a timer of its own, and never asks
  the browser to remember anything between loads. To make a whole life measurable,
  the random draws the game makes now come from a fixed, reproducible sequence that
  starts from the same value on every load instead of a fresh one each time, so the
  same presses produce the same life run after run. That is a property of the
  harness and not a defect. It is also **not** a licence to hard-code an answer:
  the sequence still produces different lives, different events and different
  outcomes, and the checkpoints play more than one life.
- Do not add flags, tallies or back-channels of your own for the harness to read,
  and do not write game state into browser storage or into the address bar to make
  a reading come out right. There are checkpoints looking for exactly that residue,
  and finding it fails the run whether or not the game looks repaired.
- Do not run your own build, dev server or tests to self-verify in this session;
  the verifier re-serves the tree and drives the real interface. Spend the effort on
  reading the code and on finding root causes.

How to read the reports below:

- Each report is what one user saw and wrote down, not a diagnosis. The cause is
  somewhere in the codebase, it may sit in a different place from where the symptom
  shows up, and one cause can show up as more than one complaint.
- **At least two of the reports describe behavior that is actually intended.**
  Verify a report before changing anything because of it: a "fix" to normal
  behavior is itself a regression, and it is checked for.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Several reports point at a layer that turns out to be perfectly healthy, and a
  few of these are one-word or one-token mistakes. Read the whole of a small
  function, or the whole of a rule, before you decide which line is wrong; at least
  one of them is nothing more than a question of which of two things happens first.
- Several of the defects have consequences that nobody wrote down. A repair that
  only makes the quoted sentence stop being true, without restoring the whole
  behavior around it, will not pass.

## The reports, in no particular order:

1. "From the very first frame there is a grey translucent panel covering the whole page, as if a dialog were open, but there is nothing in it and no way to dismiss it."

2. "Right after I press Age the money in the navbar is wrong - it still shows last year's balance - and it only becomes correct once I touch something else that refreshes the navbar."

3. "I asked for a student loan, the career picker came up with the seven degrees and the Study button, and clicking Study does nothing at all - I stay uneducated forever."

4. "On the property page the first thing in the list is always the big mansion at 2.000.000 $, and the cheap houses are down at the bottom. Everywhere else in the game a list keeps the order the things were written down in, so this one looks like it is being sorted by mistake - shouldn't the cheapest house come first? It reads like a bug to me, but I did not want to touch it in case the sorting is doing something else I cannot see."

5. "The reading switch in Free time moves the wrong way: I turn it on and the knob stays on the left, so I cannot tell whether I am paying for books."

6. "After I sell one of two instruments, clicking the one that is left in the inventory does nothing - no window, no error, the game just sits there."

7. "I can spend time with my parents as often as I like. There used to be a limit of three friendly actions a year and now the counter just keeps going up."

8. "In the shop where you buy instruments, one of the rows reads Flute (5 $). Five dollars, on the same page as a piano that costs sixteen thousand. That has to be a price with three zeroes missing - can you put it right? Everything else on that page looks sane, which is why I am fairly sure it is this one row that is wrong."

9. "The header above my life log says Childhood forever. I am 20, I can see the adult options unlock, but that word never changes."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the game intact - including the two
ways of creating a character and the age and money a created character arrives with, the
one-year-per-press rhythm and everything a year is supposed to bring, the school
steps at 6, 12 and 17 and the lines they write into your story, the licence rule
for everybody over 18, the way a skill levels up and carries its leftover
experience, the rule for what gets listed on the skills page and the wording when
nothing is, the work history of every job you have held and the year each one
started, the things you own staying clickable after you sell something else, the
three friendly outings a year and the count restarting, the paid switches showing
which way they are set and booking their cost, dialogs staying hidden until
something opens them, the prices the shop lists, the dearest-first ordering of the
property market, the money along the top and the line under it, the five qualities
and their bars, the stage-of-life heading, the story growing one line per year, and
the death screen with its obituary and its offer of a new life - none of which any
report asks you to change. The tree must still load and run exactly as it does now
when you are done: no build step, no new dependency, no module system, no network
access.
