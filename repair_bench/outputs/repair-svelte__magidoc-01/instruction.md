# repair-svelte__magidoc-01 — repair brief

## The application

A documentation-site generator. It reads a GraphQL schema plus a handful of authored markdown
content pages and prerenders a whole documentation website out of them: one page per query, per
mutation, per subscription and per type, an introduction section built from the authored content,
a sidebar that lists the entire documented surface, a previous/next footer that walks it in order,
and a search box in the header that finds fields, arguments, enum values, descriptions and content
pages and shows each hit with the matched words marked and a little of the surrounding text.

Every query page also carries a live example of its own query: a three-tab widget with the query
document itself, the variables that document expects, and the response a server would return for
it. The example is generated from the schema at build time, and a small control bar above it lets
the reader raise or lower how many levels of nesting the example descends through, switch nullable fields to
never-null, and copy either document out.

It is front-end only once built: no server, no database, no accounts, and the served site makes no
network requests at all.

## What you are being asked to do

The tree you are handed installs, builds and serves, and every page renders. But a set of behaviours
are wrong. Find them, repair them in the application source, and leave everything else working. The
production build must still succeed and must still prerender the same set of pages, the documented
surface must still be the same surface, and the repairs must be real: a change that makes one
observed symptom disappear by disabling or hard-wiring the feature behind it, or that special-cases
the exact situation a check looks at, is not a repair and will be caught by the sentinels described
at the end of this brief.

## Reports from users

Eight reports follow. **6 describe things that are genuinely broken. 2 describe behaviour that is
intentional and must be left exactly as it is** — they are included because a well-meaning repair
that "fixes" them makes the site worse, and because telling the two apart is part of the task.

1. I was reading the example on one of the query pages and pressed the button that expands nested
   objects one level deeper, then clicked a different query in the sidebar. The address bar and the
   page heading both moved to the new query, but the example widget still showed the query I had
   been looking at, still at the deeper level I had set. Reloading the page in the browser shows the
   right example for the page I am on, so it is only wrong when I arrive by clicking a sidebar link.

2. The depth control goes lower than it should. On any query page I can press the "deeper" direction
   down to 1, and the example collapses to almost nothing. It is documented as stopping at 2, and
   pressing the other direction still works normally.

3. On a query page, the third tab of the example widget — the one that is supposed to show the
   response — shows exactly the same JSON as the second tab. Byte for byte the same document. The
   query tab above them is fine.

4. On a type page, a field that takes arguments has a small button under it that expands the
   argument list. Expanding works. Clicking the same button again does not collapse it back; the
   list stays open and the button keeps the label it shows while open, and there is no other way to close it
   short of reloading.

5. Search results come back in the wrong order. I searched for a word that appears in a handful of
   places and the least relevant hit was at the top while the exact match I wanted was at the
   bottom. The same hits come back as before, just reversed, and it happens for every word I try
   that has more than one hit.

6. The browser tab title of the welcome page reads "Welcome - Welcome". It used to name the section
   the page lives in first and the page itself second, the way every other page on the site does.
   The page content itself looks correct.

7. *(Intentional — do not change.)* The example widget on a query page shows three copies of the
   same control bar and three copies of the same depth readout, one in each tab, and the values in
   the example documents look like obviously fake data: the same delay number everywhere, the same
   identifier string for every id, the same placeholder name for every person. Neither is a bug.
   Each tab renders its own copy of the widget, which is why the bar appears three times and why
   all three readouts always agree; and the example generator deliberately fills every scalar with
   one fixed sample value per scalar kind so that a generated documentation site is byte-for-byte
   reproducible from one build to the next. Please do not "deduplicate" the widget and do not
   replace the sample values with more realistic ones.

8. *(Intentional — do not change.)* Moving to another page resets the depth control to its default
   of 3 rather than remembering the depth I had set. That is the intended behaviour: the depth is a
   property of the example generated for the page being read, so a new page starts from its own
   documented default. Do not add persistence for it — no storage, no query string, no global.

## Not every defect is described in these reports

Not every defect is described in these reports. Some of the broken behaviour in this tree has no
user report at all, and some reports overlap: two different underlying faults can produce what looks
like one symptom, and one fault can hide another so completely that repairing the hidden one on its
own changes nothing observable. Treat the reports as leads, not as a checklist, and read the running
site rather than the report list when you decide whether something is fixed.

## Ground rules

- Repair the application source. Do not edit, delete, add or skip any verification artefact, and do
  not weaken a check to make it pass.
- Keep the build working. The production build must still succeed and must still prerender the same
  set of documents into the same output directory.
- Do not add network access. The built site is verified offline; any new external request will hang
  the page load and every check with it.
- Do not special-case a check. Sentinels pin the behaviour that must not change — the page titles and
  paths of directly loaded pages, the presence and parseability of all three example tabs, the field
  set of a type page as distinct from its field order, the number of sidebar entries and their
  labels, the previous/next footer, the argument list opening on the first click, the matched words
  being marked inside a search hit, the site logo being served locally and really decoded, the
  example probes, and the absence of any storage, cookie or global residue — and they are scored
  alongside the repairs.
- Leaving intentional behaviour alone is a correct answer. Reports 7 and 8 are traps in the ordinary
  sense: "fixing" them turns green sentinels red.

## How the repair is verified

A headless browser drives the served site through a fixed script of interactions and reads what the
site itself reports, both before and after your repair. Checks are split in two:

- **Repair checks** are red on the tree you are handed and must turn green. Each one is the exclusive
  detector of a single underlying fault, with one deliberate exception that is registered as a
  conditional pair: two faults share one repair check because the first hides the second, so that
  check only turns green when both are repaired.
- **Sentinel checks** are green on the tree you are handed and must stay green. They cover the
  behaviour that is correct today, including the two intentional behaviours reported above, so a
  repair that breaks something else does not score.

The score is all-or-nothing across the two groups: every repair check green and every sentinel check
still green.
