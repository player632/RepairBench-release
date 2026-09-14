# Repair task: a browser arena shooter

## The app you are repairing

One static web app: a small side-view arena shooter in the spirit of a 2D jetpack deathmatch.
There is no build step, no framework, no package manifest and no dependency directory anywhere in
the tree - the browser loads the entry document at the source root, and that document pulls the
app's own classic scripts (`js/*.js`), its two stylesheets (`css/`), its artwork (`images/`) and
its three sound files (`audio/`) straight off the disk with relative paths. Nothing is fetched
from outside the tree at runtime, and the task runs with no network at all.

Top to bottom, the app carries:

- one very wide game canvas (4000 px of world) shown through a 1360 px window, with a view that
  pans to follow the player.
- a player character who walks left and right, drops down, flies with a jet pack, aims with the
  mouse cursor and fires on a click.
- a fixed tile world: an upper band of open sky, a grass band, a sand floor, two thin marker
  columns and two stone pillars. The player begins on top of the first pillar.
- up to six enemy units, arriving one every three seconds, each flying, chasing and shooting on
  its own account.
- a small overlay panel carrying a heading, a score field, a kills field, a respawn countdown
  field and a retry control. While the player is alive the panel is transparent and its fields
  are empty.
- a short splash while the artwork loads. The match then starts by itself: there is no menu, no
  start button and nothing to click through.

The app is examined at a desktop window, 1280 by 800. The player, the view, the enemies and the
shots are all animated, so anything that depends on movement, on a held key or on the match having
been running for a while takes a moment to show itself.

## What users reported

Nine reports came in. They are quoted as their authors wrote them. They are starting points, not
diagnoses: they are not always precise, they do not always say which of several similar things is
affected, and they do not always agree with each other.

1. The view has stopped following me properly. When I walk right I drift off the edge of the
   screen and the world does not scroll with me, and when I walk left the world slides the wrong
   way instead of staying where it is.

2. My character never turns to face left any more. I put the cursor well to the left of him and he
   keeps staring to the right, so his gun is drawn on the wrong side of him.

3. The jet pack is dead. I hold the up key and he just stands there - the fuel gauge stays full
   and he never lifts off the ground.

4. The down key and the right key are swapped: pressing down makes him walk right, and pressing
   right makes him drop.

5. My shots fly backwards. I aim at an enemy standing to my right and the shot travels off to the
   left instead.

6. The gun artwork is mixed up between the two sides - my own character is holding the enemy gun,
   and the enemies are holding my character's gun.

7. The enemies have gone invisible. Shots still come at me out of nowhere, so they are plainly
   still there and still firing, but nothing at all is drawn where they are, and they never move
   and never chase me.

8. The player starts the match standing on a block of stone floating in mid-air, well above the
   ground. That has to be a broken starting position.

9. The score and kills panel never shows any numbers, and the whole panel is invisible - the
   scoreboard looks completely dead from the first second.

## Not every defect is described in these reports

并非所有缺陷都有报告提及。Some of the faults in this app are not mentioned by any report at all,
and - just as importantly - not everything above is a fault. You are expected to read the app and
work out what is actually wrong rather than working down the list: repairing only the reported
items will not finish this task, and "repairing" something that was never broken will cost you.
Two of the nine reports above describe behaviour that is exactly as shipped.

## What is NOT a fault - leave these exactly as they ship

Every line below is the app's own intended behaviour. None of them is a defect, none of them is
offered above as something to fix, and each of them is examined:

1. The player really does begin on top of a stone pillar in mid-air and really does drop a short
   distance onto it. The world ships two identical pillars and the starting position is on the
   first of them. That is the shipped map, not a misplaced spawn.

2. The score, kills and respawn fields really are empty while the player is alive, and the panel
   really is transparent. They are only filled in once the player is down, and the retry control
   only appears at game over.

3. The player ships with three lives, 600 health and 600 fuel, and the fuel gauge refills slowly
   whenever the pack is not burning.

4. The world is a fixed tile map - twenty rows of one hundred and twenty-five tiles, an open sky
   band, a grass band, a sand floor, two thin marker columns and two stone pillars. None of it is
   random and none of it moves during a match.

5. The view only pans when the player is more than 600 px away from the left edge of the view.
   Standing still leaves it exactly where it is, and in that case nothing at all is written to the
   canvas position.

6. Enemies arrive one at a time every three seconds, up to a cap of six, and each one takes
   between two and five hits to bring down.

7. The match starts by itself once the artwork has finished loading. There is no menu, no start
   button and no overlay to dismiss.

8. A shot is drawn as a short streak leaving the muzzle, travelling 20 px per frame, yellow for
   the player and red for an enemy.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry
  no behaviour; they are how the app is addressed while it is being examined, and they must
  survive your repair exactly where they are.
- The examination reads the app through a set of read-only handles that are already installed on
  the page. Do not remove, reimplement, satisfy or special-case them, and do not add anything of
  your own to the app's global scope.
- The app runs with no network at all and must keep doing so. Everything it needs, artwork and
  sound included, is already inside the tree. Do not add a remote reference and do not assume
  anything can be downloaded.
- Repair the behaviour a player experiences. Do not special-case the examination, do not add flags
  or hidden state, do not write anything into the browser's storage that the app does not already
  write, and do not leave anything on the global scope that was not there before.
- Do not delete shipped content, artwork, sound, terrain or enemies to make a symptom go away,
  and do not rebuild or reorder a region unless the report you are answering is about that
  region's order.
- Keep every change inside this app's own files. Nothing outside the app may change.
