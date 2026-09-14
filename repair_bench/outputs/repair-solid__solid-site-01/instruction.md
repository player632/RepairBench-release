# Repair Task - solid-site (SolidJS + TypeScript)

You are working on the source code of **solid-site**, the SolidJS 1.9 +
TypeScript + vite + Tailwind application that powers the SolidJS.com platform:
a multi-route public site with a top navigation bar (seven primary items, two
of which open a hover sub-panel), a language menu offering twenty locales, a
light/dark theme toggle, a footer, a newsletter signup form, a package
ecosystem route, a blog route, a media route, a playground route, a store route
and a contributors route, plus its own not-found route.

The route this task measures is **Resources**: a search field, three type
filter buttons that each print the dataset's own published count for that type
(125 articles, 109 videos, 11 podcasts), and the list itself - 245 entries
shipped in the tree. Each entry shows a type icon, a title that links out in a
new tab, an optional description, an author line, and - for every entry that
carries both an author link and a published date - a publication line printing
the date followed by a relative-time span. Exactly one entry wears an
"official" shield. A call-to-action line above the list explains how to get a
project listed, and the list has its own "no resources found" empty state,
which at rest is never shown. Typing in the search field filters the list
fuzzy-match style across several of each entry's fields; clicking a type button
toggles that type as a filter and remembers where the reader was; switching
locale re-renders the whole page in that language, moves the document's own
language and layout direction with it, and the theme toggle switches the site
between light and dark and remembers the choice.

The project builds with vite (output in `dist/`, which is what the verifier
serves from the site root):

```
./node_modules/.bin/vite build
```

Dependencies are provisioned offline by the harness. The verifier builds with
the project's own local bundler binary and does not run the repository's
formatting or type-checking steps, so a repair is not required to satisfy them.

Environment notes - properties of this offline harness, not defects:

- There is no network access. Every outbound surface this page has - the
  contributor avatar images, the store route's hosted data endpoint, the
  newsletter signup post and one legacy shortcut that used to hand the whole
  page to an external host - is repointed at a same-origin inert stand-in, and
  a request fence installed before the app renders records any cross-origin
  attempt. At rest the fence's own ledger reports zero blocked attempts. None
  of this is a defect and none of it should be undone.
- The harness drives the app in a real browser at a **1280x900 viewport**, and
  every checkpoint starts from a fresh browser context, so nothing carries over
  between them.
- The app persists exactly one first-party settings cookie (the locale and the
  theme choice). Local storage and session storage stay empty and the address
  bar carries no hidden state at rest. That is intended.
- The resource dataset is local and fixed, so every count in this task is
  reproducible: 245 entries, 125 + 109 + 11 by type, 244 of them dated, and 243
  printing a relative-time span (the structural intersection of "has an author
  link" and "has a published date"). The relative-time WORDING depends on
  today's date and is never asserted anywhere; the number of entries printing
  one is a property of the dataset, not of the calendar.
- The harness spoofs a desktop user-agent string. This project never branches
  on the user agent, so that has no effect on anything you see here.
- The build prints advisory lines on stderr - a notice that a JSON import in
  the bundler config should use a newer keyword, three font references that
  resolve at runtime instead of at build time, a chunk-size warning, and a
  browser-compatibility notice about a node builtin imported deep inside a
  transitive dependency. They are warnings, the build still succeeds, and they
  are not defects.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different module
  than the one the symptom appears in, and a single reported symptom can have
  more than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break
  while fixing other things still count against you.
- Do not remove, rename or repurpose any of the `data-rb-*` attributes - they
  are verification probes required by the checker.

The reports, in no particular order:

1. "The resources list is upside down. It used to run newest first - the recent
   SolidStart and framework articles at the top - and now the oldest entries
   sit at the top and anything recent is buried at the very bottom. I have to
   scroll through two hundred items to find something from this year."

2. "The type buttons are inverted. I click **Video** to watch videos and I get
   a list with no videos in it at all: articles and podcasts, 136 of them,
   which is exactly everything that is NOT a video. Clicking **Article** does
   the same thing the other way round. The counts printed on the buttons are
   still right, and the button still looks selected."

3. "Filtering throws me around the page. I scroll a long way down the resources
   list, click a type button, and instead of landing at the top of the new,
   much shorter list the page jumps to some position further down that I did
   not ask for. Switching the filter off again lands me somewhere else again.
   The filter itself works - it is only where the page ends up that is wrong."

4. "The whole site is mirrored. I read it in English and the layout is
   right-to-left: the nav hugs the right edge, the resource entries are
   right-aligned, the chevrons point the wrong way. The text is still English
   and the translations are all still correct, it is only the direction
   everything is laid out in. It started before I touched the language menu at
   all."

5. "The theme button's tooltip is backwards. When the site is already dark it
   says 'Dark mode', and when it is light it says 'Light mode' - it describes
   the mode I am IN instead of the mode I would switch TO. The button still
   switches correctly and the colours are right, it is only the label."

6. "The language menu cannot tell me which language I am reading. I open it and
   nineteen of the twenty entries look selected - highlighted with the solid
   blue background - while the one I am actually reading, English, looks like
   an ordinary unselected row. Picking a language still works."

7. "This may be me misunderstanding the site, but the language menu does not
   open when I click the language button. I click it and nothing happens at
   all. It only opens when the pointer goes over it, or when I tab to it and
   press enter. Is the click handler missing?"

8. "Following on from the search field: when I type in it the list does not
   filter as I type. There is a pause of about a quarter of a second after I
   stop before the list changes. Should it not be instant?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the seven primary navigation items and their hover sub-panels, the
twenty locale entries and what switching one does to the page, the theme
toggle's own persistence, the type buttons' published counts, the entry links'
target and rel attributes, the single official badge, the call-to-action line,
the empty state, the other routes' own titles and the not-found route, none of
which any single report describes in full. The project must still build with
the command above when you are done.
