# Word Master — a batch of player bug reports

This is a browser version of a five-letter guessing game: you have six attempts to
find a secret word, and after each attempt every box you filled is marked as a letter
in the right place, a letter that belongs somewhere else in the word, or a letter that
is not in the word at all. The same three verdicts are echoed on the on-screen alphabet
underneath, so you can see what you have already ruled out. Alongside the game there is
a panel of settings (an appearance switch and a choice of how strictly your guesses are
policed), an explainer panel that opens on a first visit, and a summary panel that comes
up when a run ends. It is built from the sources in this repository and served as a
static bundle from the site root — there is no server side, no database, no accounts and
no routing, so the whole game lives in the one page you first load. The finished bundle
is produced by the repository's own build script (`react-scripts build`). The secret word
is picked from a word list that ships inside the bundle, and your progress is kept in
the browser's own storage, so a refresh normally carries on where you left off.

Below are reports that came in from people playing the game. They are written the way
players write them, so some of them are imprecise, some mention things that turn out to
be perfectly normal, and some of what is broken was never reported at all. Nothing here
points at a file, a function or a cause — that part is your job.

---

## Report 1 — the erase button does not erase

> I typed three letters, changed my mind and tapped the erase control at the right-hand
> end of the on-screen alphabet. The little cursor that shows where my next letter will
> land did step back one place, which looked right, but the last letter I typed is still
> sitting in its box. So now the row shows three letters while the cursor says I have
> only typed two, and whatever I tap next lands on top of the third letter instead of
> after it. It does this every time, on every row.

## Report 2 — the erase key on my actual keyboard is dead

> Tapping the letters on screen works. But I mostly play with my real keyboard, and the
> erase key there has stopped doing anything at all — no letter disappears, the cursor
> does not move, nothing. Letters and the submit key on my real keyboard still work
> fine, and the on-screen erase control still works, so it is specifically that one key
> that the game no longer seems to hear.

## Report 3 — the run ends one attempt early

> You are supposed to get six attempts. I am being thrown out after five. I had five
> rows filled in, none of them the right word, and the game declared itself over and put
> up the end-of-run summary while the sixth row was still completely empty and usable.
> It feels like it is counting my attempts wrong and giving up one early.

## Report 4 — the red rejection outline never goes away

> When I submit something it will not accept — a half-typed row, or a word it does not
> recognise — the boxes I have typed turn red-outlined to tell me it was refused. That
> part is fine. The problem is that the outline then stays there. I carry on typing to
> fix the row and the red outline is still on the boxes even though I have not submitted
> anything since, so I cannot tell whether what is on screen now is still being refused
> or not. Clicking the on-screen erase control does clear it, so it is not stuck
> forever, but simply typing more does not.

## Report 5 — the appearance switch in the settings panel is on the wrong side

> I play with the dark appearance on. When I open the settings panel the switch that
> controls it is drawn as though it were off — the knob is over on the left and it looks
> exactly the way it does on a light-appearance page. The page behind it really is dark,
> so the appearance itself is right; it is only the switch that is lying to me. If I
> click it, the page does change, so the control still controls something.

## Report 6 — refreshing throws my run away

> I had a row partway typed and I refreshed the page — accidentally once, on purpose the
> next time to check. Both times I came back to a completely empty game: no letters, no
> marked rows, cursor back at the top left, as if I had never started. It used to come
> back to exactly what I had. Everything still works fine while I stay on the page, it
> is only coming back that has lost its memory.

## Report 7 — the little picture in the settings panel never shows up

> At the bottom of the settings panel there is a spot where a small colourful picture is
> supposed to be, next to the sentence about supporting the project. On my machine that
> spot is just empty, or shows a broken-image placeholder, and it has never once
> appeared. Is the picture missing from the project?

## Report 8 — the on-screen alphabet vanishes when a run finishes

> The moment a run ends — won or lost — the whole on-screen alphabet under the boxes
> disappears from view. I would have expected it to stay so I could look back at which
> letters I had ruled out. Is that meant to happen?

---

## What you are being asked to do

Find and fix what is actually broken in the sources in this repository, so that the game
behaves the way a six-attempt five-letter guessing game should: typing fills the row you
are on and only that row, erasing removes the letter you just typed and steps back,
both the on-screen controls and a real keyboard reach the same handlers, a submitted row
is marked in every one of its five boxes, the marked verdicts on the on-screen alphabet
keep improving as you learn more about the word, all six attempts are actually
available, a refusal is shown while it is true and cleared as soon as it is no longer
true, the strictness levels each police guesses the way their own description says, the
end-of-run summary shows the right content for a win and for a defeat and colours its
figures by the bands it claims, the settings panel draws the state it is really in, and
a refresh carries the run on rather than starting over.

**Not every defect is described in these reports.** Some of what is broken was never
reported at all, and two of the reports above describe behaviour that is exactly as
shipped and needs no change — changing those would be a regression, not a fix. Read the
code for what it actually does rather than trusting the reports to be complete or to be
right about cause.

Keep the game buildable with the repository's own build script, and keep it working with
no network access at all: the delivered page must not reach out to any external host for
a stylesheet, a font, a script, a picture or data. Do not remove, rename or repurpose
any data-testid attributes - they are verification probes required by the checker. The
extra `data-*` attributes that sit alongside them are read-only observation surfaces for
the same checker: leave them in place and keep them telling the truth about what the
component renders.
