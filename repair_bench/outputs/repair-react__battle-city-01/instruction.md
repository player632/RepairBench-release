# Battle City — a batch of player bug reports

This is a browser remake of the old tank game. It is built from the sources in this
repository and served as a static bundle: the build command is the one in
`package.json`, and the finished bundle is served from the site root, so the game
always opens on the title menu. Everything is drawn as vector graphics in one page;
there is no server side and no database. Custom stages you create in the built-in
editor are meant to be kept in the browser's own storage between visits — the help
panel on the stage list says so.

Below are reports that came in from people playing the game. They are written the
way players write them, so some of them are imprecise, some mention things that turn
out to be perfectly normal, and some of what is broken was never reported at all.
Nothing here points at a file, a function or a cause — that part is your job.

---

## Report 1 — the main menu cursor

> On the main menu, tapping the down key skips an entry. The cursor jumps from
> "1 player" straight past "2 players" and lands on "stage list". Going up behaves
> normally. It does this every single time, and with a keyboard it makes the menu
> really awkward — I have to overshoot and then come back up.

## Report 2 — the stage select screen

> On the "choose stage" screen I move backwards and forwards with A and D and it
> mostly works. But when I'm on stage 2, pressing A does nothing at all. I can never
> get back to the very first stage that way; I have to walk forward through the whole
> list to come round to it. Every other stage steps back fine.

## Report 3 — the stage list tabs

> The stage list has two tabs, "default" and "custom". My custom tab is completely
> empty, but the right-hand arrow is still clickable and the page counter behaves as
> if there were page after page of things to look at. On the default tab the arrows
> grey out correctly at both ends, so it's only the custom one that acts strange.

## Report 4 — the stage editor

> I tried building my own stage. Whatever I paint lands somewhere other than where I
> clicked. I put water in a cell over on the left-hand side and it turned up on the
> top edge instead, and the eagle I placed near the bottom middle came out near the
> right-hand edge. It's as if the whole map gets flipped diagonally under the brush.
> Typing the stage name works, and the save button does save something — it's just
> never the map I drew.

## Report 5 — firing downwards

> When my tank is pointing down and I fire, the shot appears practically on top of my
> own tank instead of coming out of the front of it. Pointing up, left or right, the
> shot comes out of the barrel exactly where you'd expect. It's only ever the downward
> one that looks wrong, and it makes fighting downwards feel unfair.

## Report 6 — the shield at the start

> The shield I get when I appear at the start of a stage barely flashes. It used to
> cover me for a couple of seconds while I got my bearings; now it's gone before I've
> even steered out of the base, and I get shot almost immediately. It happens on every
> stage, including when I lose a life and come back.

## Report 7 — the missing side panel

> During a stage, the panel on the right that shows my lives, my score and the little
> icons for the enemies still to come never shows up at all. The game plays fine
> underneath it, but I have no idea how many lives I've got left or how many more
> tanks are coming, so I never know whether to push for the exit or hang back.

## Report 8 — a worrying message on the stage list

> At the bottom of the stage list there's a grey line that reads "This page is a
> little janky. Keep patient." Is that an error message? It sits there the whole time
> and it makes me think the list is half broken and I should stop using it.

## Report 9 — the clock in the side panel

> The panel on the right of the title screen shows a version number and a "compile
> time" with a date and a clock reading that never moves, even if I leave the tab open
> for hours. Is the clock stuck? Shouldn't it be updating?

---

## Noise, for completeness

- Pausing with ESC works, the sound effects play, and the little github ribbon in the
  corner is supposed to be there.
- Two-player mode uses the arrow keys and `/` for the second player. Nobody reported
  anything about it either way.
- The enemy tanks drive around, shoot, and get replaced by the next one in the queue
  as you destroy them. That part feels like it works, though one tester said the waves
  of enemies "all looked the same somehow" and could not say what they meant.

## Ground rules

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

Please keep the game building and runnable exactly as it is now: same build command,
same bundle layout, same routes, same keyboard controls. Fix the behaviour, do not
remove the features that misbehave, and do not paper over a symptom by hiding the
thing that shows it.
