# Repair task: a browser platformer that ships with its own level editor

## The page you are repairing

What you have is a small browser game written in plain JavaScript against the
HTML5 canvas: a side-scrolling platformer in the classic coin-and-turtle mould,
wrapped around a level editor. A visitor can play the level that ships with the
page, or build a level of their own, save it in the browser's own storage, and
play that back later from a list of created levels.

There is no framework, no bundler, no transpiler, no type step and no runtime
dependency of any kind. The document loads a set of plain script files in the
order it declares them; the artwork is a handful of local sprite sheets, the
sound effects are a handful of local audio files and the fonts ship inside the
tree. The directory that is served is the source directory, so the files you
read are the files that run, and nothing is compiled first.

The page has three faces, all of them reached from the same document:

- a start screen carrying three controls - one opens the editor, one starts the
  built-in level, one opens the list of levels the visitor has saved;
- the game itself, drawn onto a single canvas: a scrolling level of ground,
  pipes, coin blocks, power-up blocks, a flagpole at the end, patrolling
  enemies, and a small read-out strip for lives, coins, score and level number;
- the editor, where a grid of cells is painted from a palette of twelve tiles
  (ground, coin block, power-up block, spent block, flag, flagpole, four pipe
  pieces, enemy, empty cell) at one of three grid widths, scrolled with a pair
  of arrows, and then saved or cleared.

The character is driven by the arrow keys, jumps on space or the up arrow,
sprints while shift is held and shoots while ctrl is held. He grows when he
picks up a mushroom, and a hit while grown costs him the growth instead of the
life, with a brief invulnerable window afterwards. Stomping an enemy from above
kills it; walking into one at ground level does not.

The page is examined at a 1280x720 window with the en-US locale, and every check
starts from a freshly loaded page in a fresh browser context, so nothing - not a
saved level, not a score, not a sound that has already been asked for - carries
over from one check into the next.

## What visitors reported

Eight reports came in. They are quoted as their authors wrote them. They are
starting points, not diagnoses: they are not always precise, they do not always
say which of several similar things is affected, and they do not always agree
with each other.

1. The life counter is wrong from the very first second. I start the built-in
   level with a full set of lives and the strip across the top already reads one
   fewer than I ought to have. It goes down by one every time I die, which is
   right, but it is always one short - and the coin count and the score sitting
   next to it are both correct. So it is only the lives figure, and only the
   figure I am shown.

2. Jumping is silent. Every other effect plays: the coin, the power-up, the
   stomp on an enemy, the death jingle, the shot. But when the character jumps
   there is no sound at all - any level, any height of jump, tapping the key or
   holding it. I know my machine is not muted, because I made him take a coin
   afterwards and that made a noise.

3. The mushroom out of a power-up block does nothing. I hit the block from
   underneath, the mushroom comes out, and then it just hangs there in mid-air
   beside the block. It never slides along the ground the way those things are
   supposed to, and I cannot collect it either: walking into it, jumping up into
   it, standing where it hangs - the character stays small and the score never
   moves. The block itself behaves normally, it goes dead after one hit.

4. Levels I save in the editor cannot be played. Saving works, and the level
   turns up in the created-levels list under the right name, but clicking it
   never starts a game. The start screen goes away, the play area stays empty,
   and the browser console prints an error at exactly that moment. The built-in
   level still starts normally from the start screen, and the editor still opens
   normally, so it is only the saved ones.

5. The middle button on the start screen starts the game but does not put the
   menu away. I can see the level running behind it - the character is standing
   there on the ground, the read-out strip is up, the game is plainly alive -
   but the three controls of the start screen are still sitting on top of everything
   and they stay there for the whole game. Opening the editor puts the menu
   away, and so does opening the created-levels list, so it is only the
   start-the-game path.

6. Once the character walks past the middle of the screen, the world slides the
   wrong way. At the beginning of a level the picture is steady, as it should
   be, and he moves across it normally. But the moment he gets past the centre,
   instead of the scenery sliding left to keep him in view, everything lurches
   the other way: the ground and the pipes drift off in the direction he came
   from and he runs clean out of the picture. The further he goes the worse it
   gets. Levels never scroll up and down and still do not.

7. When I let go of the arrow key the character does not stop dead. He keeps
   sliding for a fraction of a second and settles gradually, and the same thing
   happens while he is in the air. Is that a fault? It reads to me like the key
   is not really being released, or like there is input lag. If it is meant to
   be like that then fine, but I would have expected an immediate stop.

8. A coin block only pays out once. I jump at a coin block and get my coin; I
   jump at the very same block again and nothing comes out - no coin, no sound,
   and the block has visibly turned into a plain used block. Shouldn't a coin
   block keep giving coins? Half a payout feels like half a feature.

## Not every defect is described in these reports

Some of the faults on this page are not mentioned by any report at all, and -
just as importantly - not everything above is a fault. You are expected to read
the code and work out what is actually wrong rather than to work down the list:
repairing only the reported items will not finish this task, and "repairing"
something that was never broken will cost you.

Two things follow from that, and they are worth stating plainly:

- The reports point at symptoms, not at causes. A symptom can be produced
  somewhere other than where it shows up, two similar-looking symptoms can have
  different causes, and one cause can show up as more than one symptom. Report 3
  and report 4 read like two unrelated complaints about two different screens;
  neither of them says what is broken, and one of them is not even the whole of
  its own story. Verify before you change anything.
- A fault that only shows up on one way in is still a fault. The editor, the
  built-in level and the saved levels are three different doors into the same
  game, and a behaviour that works through one door and fails through another is
  worth reading rather than worth ignoring.

## What is NOT a fault - leave these exactly as they ship

Every line below is either the page's own intended behaviour or an honest
consequence of running it in this harness. None of them is a defect, none of
them is something a report asks you to fix, and each of them is checked:

1. Report 7 is the movement model, not a bug. Momentum that decays over a few
   frames - on the ground and in the air - is how this page has always felt, and
   the checks measure it. Do not add an instant stop, do not zero the horizontal
   velocity when a key comes up, and do not add a dead zone or an input buffer
   to answer that report.

2. Report 8 is the block rule, not a bug. A coin block is consumed by being
   hit: it pays out once and then becomes a spent block, and the spent block is
   inert for the rest of the level. Do not make coin blocks reusable, do not
   give them a charge count, and do not add a respawn timer.

3. The built-in level is data, not behaviour. Its layout - where the pipes
   stand, where the enemies start, which row the blocks hang on, where the pit
   is, where the flagpole is - is the shipped level. Do not re-lay it out,
   empty it, flatten it, move an enemy, remove a hazard or shorten it in order
   to make a symptom go away or to make the page easier to drive.

4. The page makes no network request of any kind and must keep making none.
   Everything it needs is already inside the tree. Do not add a remote
   reference, do not assume anything can be downloaded, and do not reintroduce a
   library, a font, an icon set or an audio file from outside.

5. Only the editor's save path writes to browser storage, and it writes only
   what a saved level needs. Every other face of the page keeps nothing across a
   reload - no storage, no cookies, nothing in the address bar - and that is by
   design. Do not add persistence anywhere else, and do not add a settings or
   preferences layer.

6. Sound is fired and forgotten: each effect is rewound to its start and played.
   Do not build a sound queue, a mixer, a mute toggle, a volume control or a
   preloading cache, and do not treat a browser that refuses to start audio
   before a visitor gesture as something to work around.

7. The editor's three grid widths, its twelve-tile palette, its drag-to-paint
   selection and its arrow-driven scrolling are all intended and all exercised.
   Do not collapse the widths into one, drop a tile from the palette, or replace
   drag painting with a single-click model.

8. The growth ladder - small, grown, shooting - and the brief invulnerability
   after taking a hit are intended. Do not remove the ladder, make the character
   permanently grown, or extend invulnerability into a shield.

9. Nothing about the sprite sheets, the artwork, the tile size, the canvas
   dimensions or the palette may be redrawn, resized, re-ordered or replaced in
   order to make a symptom go away. Where a report says a picture is wrong, the
   picture is being produced by code that is wrong; the artwork itself is fine.

## Ground rules

- The tree carries a small amount of verification instrumentation that the
  grading harness reads the page through. It adds no rule, no constant and no
  branch to the game. Do not remove it, rename it, edit it, wrap it, or make
  your repair depend on it, and do not let any behaviour in the page key off its
  presence. It must survive your repair exactly where it is.
- Repair the behaviour a visitor experiences. Do not special-case the
  examination, do not add flags, hidden state or a hard-coded test-identifier
  branch, do not write anything into the browser's storage that the page does
  not already write, and do not leave anything on the global scope that was not
  there before.
- Do not delete shipped content, screens, controls, tiles, artwork, levels or
  copy to make a symptom go away, and do not reorder or rebuild a region unless
  the report you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the page
  must still load and run exactly as it does now: no build step, no new
  dependency, no network access, and the same three faces reachable from the
  same document.
- While you are answering, do not run this project's own test, build or serve
  commands and do not start a browser of your own to check yourself. The grading
  harness measures the page for you, and a fix that only holds up under your own
  private way of running it is not a fix.
