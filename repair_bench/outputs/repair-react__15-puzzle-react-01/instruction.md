# 15 Puzzle — a batch of player bug reports

This is a browser version of the classic four-by-four sliding puzzle: fifteen numbered
squares on a board with one empty space, and you slide a square into the space next to
it until every square sits in its home position. It is built from the sources in this
repository and served as a static bundle from the site root — there is no server side,
no database, no accounts and no routing, so the whole game lives in the one page you
first load. The finished bundle is produced by the repository's own build script
(`react-scripts build`), and the page keeps everything in memory: it stores nothing in
the browser's own storage and it never changes the address bar.

Two things about the page you are looking at are deliberate and are not part of any
report. Opening the page always deals you the same starting layout, and the New game
control deals the next layout in that same fixed sequence, so a fresh puzzle is never
the one you just had. And the board always shows the same fifteen numbers plus the one
empty space.

Below are reports that came in from people playing the game. They are written the way
players write them, so some of them are imprecise, some mention things that turn out to
be perfectly normal, and some of what is broken was never reported at all. Nothing here
points at a file, a function or a cause — that part is your job.

---

## Report 1 — the whole board is shifted sideways

> Every square looks pushed one place to the right of where it belongs. The squares
> that should be flush against the left edge of the frame are sitting one cell in, and
> the ones in the right-hand column hang over the edge of the board entirely — I can
> see them out on the page background past the frame. Up and down looks correct, it is
> only sideways. It does this on a fresh page and it does not get better as I play.

## Report 2 — it congratulates me almost immediately

> I got maybe four squares into their home spots and the congratulations popup came up
> and the clock stopped, as though I had finished. The puzzle was nowhere near solved —
> most of the board was still scrambled. It seems to treat a handful of squares being
> in place as a completed game.

## Report 3 — once I pause I cannot get back in

> Pausing works fine. The problem is what happens next: the very control I have to use
> to carry on is greyed out and will not take a click, so the game just sits there
> paused forever. My only way out is to reset or to start a new puzzle, and either of
> those throws the game away. This never used to happen — pausing and carrying on was
> the whole point of having the control.

## Report 4 — there is a square where the gap should be

> The board is supposed to be fifteen numbered squares and one empty space, and the
> empty space is what lets anything move. On my screen all sixteen cells are painted,
> including the one that should be blank — there is a sixteenth square sitting there
> with a number on it, the same style as all the others. I cannot see where the gap is,
> so I cannot tell which squares are allowed to slide.

## Report 5 — reset puts back the wrong puzzle

> I press New game and get a fresh layout, which is right. Then I make a mess of it and
> press reset, expecting to get the layout I am currently playing back the way it was
> when I started it. Instead I get the layout I was playing *before* I pressed New
> game — the older one. So reset takes me backwards to a puzzle I already left.

## Report 6 — the wording on that control is backwards

> While I am actually playing, the control reads "Continue". After I pause, the same
> control reads "Pause". That is the opposite of what it should say at both moments:
> when the game is running it should be offering to pause, and when the game is paused
> it should be offering to carry on. The little picture next to the wording does change
> correctly, which is what makes the words so confusing.

## Report 7 — the squares drift instead of snapping

> When a square moves it does not just appear in the new spot, it takes a noticeable
> moment to slide across, and the colour change is gradual too. On a fast machine it
> reads as laggy and I keep overshooting my clicks. Was that left in by mistake? Can it
> be made instant?

## Report 8 — the page background is obviously tiled

> Behind the board the page has a small picture repeated over and over in a grid, and
> you can see where one copy ends and the next begins. Should it not be one smooth
> image stretched across the page instead of a patchwork?

---

## What you are being asked to do

Find and fix what is actually broken in the sources in this repository, so that the
game behaves the way a four-by-four sliding puzzle should: squares sit in the cells
they belong to, only a square next to the empty space moves, the empty space stays
empty, the run/pause/resume controls all work and say what they do, the clock behaves
across a pause, the game ends only when the puzzle is genuinely complete, New game and
reset both do what they say, and the home-square highlighting matches the real state of
the board.

**Not every defect is described in these reports.** Some of what is broken was never
reported at all, and two of the reports above describe behaviour that is exactly as
shipped and needs no change — changing those would be a regression, not a fix. Read the
code for what it actually does rather than trusting the reports to be complete or to be
right about cause.

Keep the game buildable with the repository's own build script, and keep it working
with no network access at all: the delivered page must not reach out to any external
host for a stylesheet, a font, a script or data. Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker. The
extra `data-*` attributes that sit alongside them are read-only observation surfaces
for the same checker: leave them in place and keep them telling the truth about what
the component renders.
