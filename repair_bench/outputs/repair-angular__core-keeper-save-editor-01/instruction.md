# Repair Task - core-keeper-save-editor (Angular 15)

You are working on the source code of **core-keeper-save-editor**, an
Angular 15 + TypeScript + Tailwind single-page tool for editing Core Keeper
character save files. Everything lives on one page behind a top menu with
seven entries - Items, Skills, Character, About, Help, plus Import and
Export - and each entry shows its own panel; there is no router and the
address bar never changes. The Items panel carries a searchable catalogue of
every item in the game on the left (a text box, a category dropdown and a
large grid of tiles), and on the right a ten-box toolbar row, a backpack grid
whose length depends on the bag the character is wearing, a row of eight
worn-equipment boxes, and an item panel underneath that shows the stats of
whatever box you last clicked. Catalogue tiles can be dragged into the boxes
and items can be dragged between boxes. The Skills panel shows twelve skill
tiles, a small level editor with minus/plus buttons and a number box, and a
talent tree of eight talents that unlock in rows. The Character panel edits
the name, a hardcore box, a save-slot number, an "Enable Souls" box with three
souls under it, and a reset button. Import reads a `<index>.json` save file
picked from a file dialog, Export writes the current character back out as a
download named after the save-slot number. The character being edited is also
kept in browser storage so that it is still there after a refresh.

The project builds with `npx ng build --configuration production` (output in
`dist/core-keeper-save-editor`, served from that directory at the site root).
The build prints a bundle-size *warning*; that warning is normal for this
project and the build still succeeds. `node_modules` ships with the workspace.

Environment notes - properties of this offline harness, not defects:

- There is no network access. Nothing in this project needs it: the whole item,
  condition, skill and talent catalogue is data compiled into the bundle, and
  Import/Export work entirely through the file dialog and a download.
- The first time the page is opened in a fresh browser profile a one-off
  "this is an independent fan-project" notice covers the screen until you
  press its button. That notice is intended, it appears exactly once per
  profile, and no report below refers to it.
- This is a desktop layout and the harness uses a 1600x900 viewport.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "My character had eaten an amber larva, so the save file the game wrote has
   that odd endless number in it instead of a normal one. Importing that file
   works, the editor is happy with it. But when I export again and open the
   downloaded file in a text editor, that value is no longer the plain word the
   game writes - it has come out as some quoted token with percent signs round
   it. The game then refuses to load the character. Exporting a normal save
   that never had the endless number in it is fine."

2. "In the item panel for the Iron Helm, the third line reads '+48% damage'.
   In game that bonus is '+4.8% damage'. The other two lines in the same panel
   ('+15 max health', '+10 armor') are correct, it is only the percentage one
   that comes out ten times too big. I see the same kind of wrongness in the
   little pop-up you get when you hover an item in the catalogue on the left."

3. "When I wear two pieces of a set - Iron Helm and Iron Breastplate - the
   panel under the item lists those two pieces TWICE and the third piece I am
   still missing, the Iron Pants, is not listed at all. It used to list all
   three with the one I do not own greyed out. To make it worse, both of the
   entries it does show are greyed now, as if I were wearing none of them, and
   the set bonus line above them stays unlit."

4. "The last box in the worn-equipment row is gone. There used to be eight:
   helm, necklace, chest, legs, two rings, off-hand and the bag. Now the row
   stops after the off-hand, so I cannot see my bag or click it at all. The
   backpack grid still grows when I import a character that has a bag equipped,
   so the bag is definitely in the save - it is only the box that is missing."

5. "If I click an item in the toolbar to select it, then go to the Character
   page and start typing in the name box, the item I had selected disappears.
   Pressing backspace to fix a typo throws the item away instead of deleting a
   letter, and the item panel under the boxes closes as well. It only happens
   when an item is selected first. Deleting an item on purpose with the Delete
   key still works when I am not typing anywhere."

6. "On the Character page: if I untick 'Enable Souls' and then tick it again,
   the three soul boxes come back already ticked exactly as they were before,
   and an export still says I have collected them. I expected switching souls
   off to clear them, so that switching it back on starts from nothing."

7. "Dragging an item from one toolbar box onto another box that already holds
   something used to swap the two. Now the item I drag simply gets copied:
   both boxes end up holding the thing I dragged and whatever was in the box I
   dropped onto is gone. Same inside the backpack grid. Dragging an item out of
   the catalogue on the left into an empty box still behaves normally."

8. "Maybe this is normal and I am just paranoid: when I have an item selected
   and its panel open underneath, and I then click an EMPTY box in the
   backpack, the panel closes and the empty box gets the selection outline. I
   expected the panel to keep showing the item I had selected. Is that how it
   is meant to work?"

9. "Every screenshot I have seen of this editor has a 'debug' entry at the end
   of the top menu, after Help. Mine only shows Items, Skills, Character,
   About, Help, Import, Export. Is a page missing from my copy, or is it
   hidden somewhere I have to switch on?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the catalogue, the tooltips, the skills and talents, the export
warning about stranded items, and the About and Help panels that no report
mentions. The project must still build with the command above when you are
done.
