# repair-svelte__compress-lol-01 — repair brief

## The application

A private, in-browser video compressor. You pick a video file from your own machine, pick how big the
result is allowed to be (four budgets are offered — 8 MB, 25 MB, 50 MB and 100 MB, and 25 MB is the
one already selected when you arrive), and press Compress. The whole encode then runs inside the page
itself, in a worker, in memory; when it finishes, a results panel reports how big the output turned
out to be, how much smaller it got than what you fed in, and offers a download. Nothing is ever
uploaded: there is no server, no account, no queue, and the built face issues no request to any other
host (the footer carries one plain hyperlink, which is never fetched).

Around that main flow the page carries a header with the product name and its tagline; a language
chooser that shows a small flag picture beside the current language; an appearance chooser with four
palettes, one light and three dark; a card with the chosen file's own numbers (how long it runs, its
pixel dimensions, how many bytes it is); an "advanced" section that unfolds to reveal an audio-only
mode, a mute switch, a keep-the-original-frame-rate switch and a trim pair (drop this many seconds off
the front, this many off the end); a progress bar with a status line while an encode runs; a warning
strip when the file you picked is already smaller than the budget you chose; a "how it works" card;
and a footer. The page is translated, and the language chooser drives that translation.

## What you are being asked to do

The tree you are handed installs, builds and serves, and the page renders. But a set of behaviours are
wrong. Find them, repair them in the application source, and leave everything else working. The
production build must still succeed and must still emit the same static face into the same output
directory, the page must still be the same page, and the repairs must be real: a change that makes one
observed symptom disappear by disabling or hard-wiring the feature behind it, or that special-cases
the exact situation a check looks at, is not a repair and will be caught by the sentinels described at
the end of this brief.

## Reports from users

Nine reports follow. **7 describe things that are genuinely broken. 2 describe behaviour that is
intentional and must be left exactly as it is** — they are included because a well-meaning repair that
"fixes" them makes the product worse, and because telling the two apart is part of the task.

1. I tried to compress a holiday clip of a few tens of megabytes — nothing enormous, well under a
   gigabyte — and the page turned it down with its "that file is too big" message. I had to cut the
   clip down to a couple of megabytes before it would even start. It used to accept anything up to a
   few gigabytes.

2. On a brand-new profile, with nothing saved yet, the page comes up looking wrong: the colours are not
   the light default the product is known for, and if you inspect the root of the document it is
   carrying a palette name that is not one of the four the chooser offers. Picking a palette by hand
   afterwards works normally.

3. Two of the three dark palettes switch the page over to dark contrast as they should. The third one —
   the darkest of the three — leaves the page in light contrast, so its text and its backgrounds fight
   each other.

4. My palette choice never survives a reload. I pick one, the page looks right, I reload and it is back
   to how it started, as though I had never chosen anything. Other things I set on this page do come
   back after a reload — the budget I usually pick, for instance — so it is not the browser forgetting
   everything about the site.

5. The small flag picture beside the language chooser is the wrong country's. It is wrong in a very
   regular way: what appears is always the flag of some neighbour, never the language that is actually
   selected. The language name itself is right, and switching language still translates the whole page.

6. Several controls look subtly mis-drawn — a button here, a card heading there — as though two
   conflicting spacing instructions had been applied to the same element at once and the weaker one
   had won. It is as if the little helper that combines styling instructions stopped settling
   conflicts between them and now just hands back everything it was given, duplicates and
   contradictions included.

7. The browser tab shows no picture at all, just the browser's own blank-page mark. It used to show the
   product's little mark. The head of the document is asking for a plain icon file that this build does
   not actually ship, instead of the picture that travels with the application.

8. There is a notice under the Compress button telling me that my family of browser handles this kind
   of work less well than others. It appears every single time I open the page. Is that a leftover that
   should have been switched off?

9. The "advanced" section only ever shows its heading row. The controls inside it are invisible until I
   press that heading, and then they slide open. I assumed the section was broken and its contents had
   been lost somewhere.

Reports 8 and 9 are the two intentional behaviours: the notice is a deliberate compatibility hint that
is meant to appear for that browser family, and the advanced section is meant to start collapsed and
animate open on request. Repairing either one turns green sentinels red.

## Not every defect is described in these reports

Not every defect is described in these reports. Some of the broken behaviour in this tree has no user
report at all — several of the numbers this page computes (how it budgets bits between picture and
sound, how it decides the output pixel dimensions, how it prints a byte count for you, how it compares
the file you picked against the budget you chose) are quietly wrong in ways no user has written in
about yet, because you only see them in the results. Some reports also overlap: two different
underlying faults can produce what looks like one symptom, and one fault can hide another so
completely that repairing the hidden one on its own changes nothing observable. Treat the reports as
leads, not as a checklist, and read the running page rather than the report list when you decide
whether something is fixed.

## Ground rules

- Repair the application source. Do not edit, delete, add or skip any verification artefact, and do not
  weaken a check to make it pass.
- Keep the build working. The production build must still succeed and must still emit the same static
  face into the same output directory.
- Do not add network access. The built face is verified offline; any new request to another host will
  hang the page load and every check with it.
- Do not special-case a check. Sentinels pin the behaviour that must not change — the product name and
  tagline, the four budgets and their descriptions and which one is selected on arrival, the byte
  budget that is remembered between visits, the file-information card's labels, the results panel's
  empty state, the progress bar and status line, the compatibility notice and its wording, the advanced
  section's open and closed geometry, the audio-only and mute and trim switches and the seconds they
  default to, the language chooser's item list and the translation it drives, the appearance chooser's
  four palettes and its own picture, the "how it works" card, the footer's two lines, the fact that the
  page really does initialise its encoder and stays inside one origin, the arithmetic of the helper
  functions on inputs no report mentions, and the absence of any storage, address-bar or global residue
  between checks — and they are scored alongside the repairs.
- Leaving intentional behaviour alone is a correct answer. Reports 8 and 9 are traps in the ordinary
  sense: "fixing" them turns green sentinels red.

## How the repair is verified

A headless browser drives the served page through a fixed script of interactions — loading it, waiting
for the encoder to come up, feeding it a synthetic video file, opening the two choosers, picking items
in them, unfolding the advanced section — and reads what the page itself reports, both before and after
your repair. Checks are split in two:

- **Repair checks** are red on the tree you are handed and must turn green. Each one is the exclusive
  detector of a single underlying fault, with one deliberate exception that is registered as a
  conditional pair: two faults share the outcome of one repair check because the first hides the second,
  so that check only turns green when both are repaired.
- **Sentinel checks** are green on the tree you are handed and must stay green. They cover the
  behaviour that is correct today, including the two intentional behaviours reported above, so a repair
  that breaks something else does not score.

The score is all-or-nothing across the two groups: every repair check green and every sentinel check
still green.
