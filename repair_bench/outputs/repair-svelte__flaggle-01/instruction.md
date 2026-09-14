# Repair Task - Flaggle (Svelte)

You are working on the source code of **Flaggle**, a SvelteKit + Svelte 5
flag-guessing web game. The player is shown a flag rendered in progressively
revealed slices and must guess the country it belongs to, typing into a
guess box that offers a dropdown of matching candidates. The app ships three
modes - a relaxed classic round, a lightning mode with a streak challenge,
and a daily puzzle that is the same for everyone on a given date - plus a
statistics page with per-mode records and a settings page with theme choice,
toggles and save export/import. All progress, settings and statistics are
stored locally in the browser. The project lives in this workspace; it
builds with `npm run build` (static adapter, output in `build/`, served
from that directory at the site root). The app is fully offline - there is
no backend and all data is local.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Classic mode is completely broken for me. I typed a country I knew was
   wrong - just to test - and the game immediately declared I had won. One
   guess, instant victory, wrong answer. It should only end when I actually
   guess the right country."

2. "On the daily page the header shows a number next to the title,
   something like 'Flaggle #246', and it is different every day. That
   number looks random to me, is it supposed to be there? Feels like a
   leftover debug thing."

3. "The guess box stopped suggesting anything. I type letters of a country
   name and the dropdown under the input stays completely empty, so I
   cannot click a candidate, and moving with the arrow keys selects nothing
   either. I can never finish a game this way."

4. "My records are a mess. In lightning mode my best streak never goes up,
   even after clear winning streaks. And weirdly, when I give up on a
   classic game, my lightning streak gets wiped - what does giving up in
   one mode have to do with the other? Also the average-guesses number on
   the stats page looks inflated, like it counts games I did not win."

5. "The daily puzzle does not survive a refresh. I make a couple of
   guesses, reload the page - still the same day - and the puzzle starts
   over from scratch with my guesses gone. It should only reset when the
   date actually changes."

6. "On the statistics page the label 'Games Won' appears twice inside the
   same section. Looks like a duplicated row somebody forgot to delete."

7. "The app does not remember my settings: I pick a different theme, reload
   the page, and it is back to the default. Related or not, the save export
   seems broken too - I copied the exported string and tried to import it
   back, and nothing was restored."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
