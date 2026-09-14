# Repair task: a browser idle role-playing game

## The game you are repairing

One static page, served from the root of the tree: a browser idle role-playing game. There is no
build step, no framework and no dependency directory anywhere in the tree - the entry document
loads the game's own ECMAScript modules straight off the disk, one module per concern (character,
items, inventory, skills, combat stances, locations, quests, enemies, weather, a calendar,
crafting, trading, a translation table, and a display layer that renders all of it), and
everything a player sees is produced by those modules. Nothing is fetched at runtime and the page
runs with no network at all.

Top to bottom, the game carries:

- a boot veil with the game's own title, an author line, a version line, a status line and a single
  PLAY control. A fresh character needs no creation step: one click on PLAY is the whole cold start.
- a character panel with a name field, a level line, an experience bar, a health bar, a stamina
  bar, a mana bar, a block of stats (strength, dexterity, agility, intuition and a derived hit
  chance) and an equipment block.
- a money readout that spells out the sum the character is carrying in the game's own coin
  denominations.
- a location panel with a place name, a description, the actions available there and the types of
  thing that can be found there.
- a combat panel with eight enemy slots and an enemies-remaining count.
- an inventory panel with its own sorting controls, and a separate storage ledger that the player
  moves stacks into and out of.
- a skills-and-stances panel: a list of skills grouped by category, and a roster of combat stances
  in which every unlocked stance is one row carrying a favourite control, a select control, the
  stance name and a tooltip. Stances marked as favourites are collected into a quick-select bar of
  their own.
- a journal panel with a quest list and a hide-completed toggle, plus a reputation block, a
  bestiary, a bookshelf and a data block.
- a message log with its own filter controls.
- a weather and calendar readout carrying the in-game date, the hour and minute, the season, the
  weekday name and whether it is day or night.
- an options panel of a dozen-odd switches (text outlines in item tooltips and on bars, a
  temperature scale, a scientific-notation threshold slider, log filters, rain and snow and star
  animations, a background-colour switch, a bedtime behaviour, a dialogue text size, an
  automatically-skip-the-loading-screen switch, a hide-max-level-skills switch and a couple of
  cosmetic ones) and a set of save controls: save, load, import, another-save-slot, a hard reset,
  and an export-to-file control that carries a periodic reward.
- a footer credit with two outbound links.

The page is examined at a phone-sized window, 390 by 844. The game loop is driven by a timer that
advances the in-game clock by one in-game minute per tick, so anything derived from that clock
keeps moving while it is being read.

## What players reported

Nine reports came in. They are quoted as their authors wrote them. They are starting points, not
diagnoses: they are not always precise, they do not always say which of several similar things is
affected, and they do not always agree with each other.

1. Shop prices came out wrong. Anything expensive - the four and five digit stuff - is a whole
   thousand cheaper than the ladder the tooltip promises, and I am fairly sure that tier is meant
   to round a price up to the next thousand, not down to the one below. Cheap items still look
   right, and so do the mid-range ones.

2. Big sums of money lost their top denomination. I was carrying well over a hundred thousand and
   the readout spelled the whole thing out in the two smaller denominations, with no top-tier coin
   in it at all, as though that tier only kicks in at a million. Smaller sums still spell
   themselves correctly.

3. The inventory reorders itself the wrong way round. Equipment used to sit underneath the food
   and the oddments, and now the moment a sort control is touched the wearable row floats to the
   top of the list. Nothing is missing and nothing is duplicated, it is simply in the wrong order.

4. Putting things into storage takes more than I asked for. I ask to store two of something from a
   stack of five and the entire stack goes across: the character is left holding nothing of it and
   storage ends up with more units than I ever moved. It behaves as if the game picks the larger of
   the two numbers instead of the smaller.

5. The clock looks broken. The date and the time sit there and then crawl along so slowly I cannot
   tell whether it is running at all or frozen. A friend says his does exactly the same and his
   game is fine, so maybe that is just how it is - but it reads like something stopped.

6. The reward on the export control is lit from the very first second. I start a brand new
   character and the export control is already marked as though the waiting period had come and
   gone, while the tooltip right next to it still says the reward is hours away. Both of those
   cannot be true at once.

7. The return-to-last-bed-upon-defeat switch does the opposite of what it says. I untick it and the
   character still walks back to the bed; I tick it and it does not. The tick box itself always
   looks like it did what I clicked, which is why it took me so long to notice that the behaviour
   behind it was inverted.

8. Text became unreadable in a couple of places. The outlines that are supposed to keep light text
   readable against a light background seem to be picking the wrong colour: dark text gets a dark
   outline and pale text gets a pale one, so the words sink into whatever is behind them. It is
   worst in the item tooltips, which is the outline option I have switched on.

9. Stances are missing from the list. The game is supposed to have a whole set of fighting stances
   and the roster only ever shows a single row, so I assume the rest were lost. The quick-select
   bar underneath it stays empty too, however long I play.

## Not every defect is described in these reports

并非所有缺陷都有报告提及 - not every defect in this game is mentioned by any report at all, and,
just as importantly, not everything above is a fault. You are expected to read the game and work
out what is actually wrong rather than work down the list: repairing only the reported items will
not finish this task, and "repairing" something that was never broken will cost you. Two of the
nine reports above describe behaviour the game ships with on purpose. Both are checked, and both
will punish a repair that tries to fix them.

## What is NOT a fault - leave these exactly as they ship

Every line below is the game's own intended behaviour, or an honest consequence of running it with
no network. None of them is a defect, none of them is a repair target, and each of them is
checked:

1. Report 5 is not a fault. The clock is a game clock: one tick of the loop advances it by one
   in-game minute, so it moves slowly and its exact reading depends on the moment you look at it.
   Nothing is frozen. Its shape - date, hour and minute, season, weekday name, day or night - and
   the calendar tables behind it are all as shipped, and no repair on this task is expected to
   change any of that.

2. Report 9 is not a fault either. The stance roster only ever lists the stances a character has
   unlocked, and a fresh character has exactly one of the seven unlocked. One row is the correct
   rendering, not six rows gone missing. The quick-select bar is empty at boot because nothing has
   been marked as a favourite yet, which is also correct.

3. The remote icon font and the remote favicon the upstream page used to pull are not available
   offline and were dropped when this face was prepared: the icon-shaped controls keep their box
   and stay clickable, but there is no glyph artwork behind them, and text falls back to the local
   font stack the page already declares. Neither is a reported fault, no glyph or font file is
   expected to reappear, and nothing here reads a letterform.

4. Two outbound links in the footer credit - a code-hosting profile and a tip-jar page - and the
   vocabulary identifier inside the page's structured-data block all point off-origin. They are
   links and metadata, not requests: nothing fetches them, the examination never clicks them, and
   the task runs with no network at all. Leave them exactly as they are.

5. The committed minified bundle and its sidecar map that the upstream page used to load were
   removed, and the entry document now loads the game's own modules directly. That removal is the
   offline face of this task, not a defect. Do not recreate a bundle, do not add a build step, do
   not add a package manifest and do not reintroduce a bundler.

6. A fresh character starts with a fixed sum of money, two stacks in the inventory - one of five
   and one of one - and nothing at all in storage. Those are the shipped starting numbers and they
   are the ledger every money and item reading is taken from. They are not a defect.

7. The switches in the options panel each ship in a particular state, most of them on and a couple
   of them off, and the scientific-notation slider ships at its own threshold with its readout
   already written into the document rather than computed at boot. Those shipped states are
   correct and are checked; do not tidy the defaults.

8. The message log, the journal and the skill list all hide and show whole groups of rows through
   their own toggles - hide completed, hide max level skills, the log filters. A group being
   hidden is the toggle doing its job, not rows going missing.

9. One of the game's own helpers converts between the two temperature scales and is only reached
   when the player switches the temperature option on; that option ships off. The helper is live
   code rather than dead code, and the option's shipped state is not a defect.

10. Combat stances carry short machine identifiers and longer display names that do not match each
    other - the starting stance is displayed under a two-word name, and the heavy one under a
    completely different phrase. That gap is the shipped translation table, not a naming fault.

11. The boot veil hides itself with an inline style write when PLAY is clicked, and the control it
    reveals goes through a fade class of its own. Both are the shipped boot sequence.

12. Nothing on this page persists between visits unless the game itself persists it, and the game
    persists only through its own save controls. An empty storage ledger and empty browser storage
    at boot are both correct.

13. A handful of the game's own display helpers are reached only from a code path a player has to
    switch on, or only from a save file that already carries a stored setting. Being unreachable on
    a plain cold start is how the game ships; it does not make those helpers dead code and it is
    not a defect.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry no
  behaviour; they are how the page is addressed while it is being examined, and they must survive
  your repair exactly where they are.
- The game runs with no network at all and must keep doing so. Everything it needs is already
  inside the tree. Do not add a remote reference, do not assume anything can be downloaded, and do
  not reintroduce a font, an icon set, a bundle or a library from outside.
- There is no build step and there must not be one. Repair the modules the page actually loads. Do
  not add a manifest, a dependency directory, a bundler or a compiled artifact, and do not expect
  anything to be compiled for you before it is examined.
- Repair the behaviour a player experiences. Do not special-case the examination, do not add flags
  or hidden state, do not write anything into the browser's storage that the game does not already
  write, and do not leave anything on the page's global scope that was not there before.
- Do not delete shipped content, panels, controls, copy, stances, items or artwork to make a
  symptom go away, and do not reorder or rebuild a region unless the report you are answering is
  about that region's order.
- Keep every change inside this game's own files. Nothing outside the page may change.
