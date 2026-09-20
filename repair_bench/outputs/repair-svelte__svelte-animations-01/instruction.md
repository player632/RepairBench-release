# Repair Task - svelte-animations (a SvelteKit showcase of animation components)

You are working on the source code of **Svelte Animations**, a component showcase
site built with SvelteKit 2 on Svelte 4 and Tailwind CSS. It is a catalogue
rather than an application: four families of animation components (Aceternity UI,
Magic UI, Luxe and syntaxUI) live as ordinary source inside `src/lib`, each with
its own demo page under `/magic/...`, `/luxe/...`, `/a/components/...` or
`/try/...`. A demo page normally shows the component running, then the same
example again beside its source, so most components appear twice on their own
page. A separate Learnings section holds short articles about Svelte motion
primitives at `/learnings/1`, `/learnings/2` and so on. There is no backend, no
database and no API route of any kind: every page is generated as a static
document when the site is built, and the set of article pages to generate comes
from a table of ids kept in the source.

`npm run build` is the whole build step. It runs `vite build` and nothing else -
there is no type-check and no lint in it, so a source edit that would not survive
a strict compiler still builds, and what is measured is the behaviour of the built
site. The build writes the generated site under `.svelte-kit/output`. A source
edit only becomes visible after a rebuild.

Runtime facts about how this task is verified:

- The tree is built and served over a local server with **no network access**.
  Pictures that the pristine site pulled from remote hosts are carried inside the
  tree as local placeholders of the same rendered size, one remote analytics
  script has been taken out with nothing put in its place, and a remote webfont
  import has been dropped where the stylesheet already declares a local fallback
  family. Nothing may be pointed back at a remote host and nothing is fetched at
  runtime; the offline way the page loads is part of the task, not a defect.
- The generated pages and the assets they ask for are written into **two sibling
  directories** of the build output: the pages directory holds the documents and
  no assets at all, and the stylesheets, fonts, pictures and scripts those
  documents reference sit in the asset directory next to it. If you want to look
  at the built site yourself, serve the two together (or just use `npm run dev`);
  served on its own the pages directory looks completely unstyled and nothing
  interactive in it works, and that is not a defect either.
- Links inside the site carry **no file extension and no trailing slash**
  (`/try/sidebar`, `/luxe/animated-tabs`, `/learnings/15`), while the generated
  documents are named with an extension. Deep links are answered by resolving the
  extensionless path to its document; nothing in the site expects a redirect to a
  trailing-slash form.
- Moving between pages from inside the site does **not** reload the document: the
  shared chrome - the top banner, the navigation, the component search - stays
  alive across a route change and keeps whatever state it had.
- The harness drives the built site in a real browser at a **1280x720 viewport**,
  so the desktop layout is the one that is measured and the narrow-screen layout
  is not. At that width the site's own responsive rules are what decide which
  controls are shown.
- Every check starts from a **fresh browser context**, so an opened overlay, a
  hovered element, a scrolled page or a selected tab from an earlier interaction
  never carries into the next one. Each check sees the site's own first-load
  state.
- Checks that involve pointing, clicking, waiting or scrolling read the page at a
  fixed moment after the interaction. The site's own transitions are expected to
  be well under a second; the demo gauges and the motion pieces inside the
  articles are allowed a few seconds to settle, and the checks that read them
  wait accordingly. A component that only arrives at the right value after several
  seconds can still be read too early, so the timing a component was written with
  is part of its behaviour.
- The browser's pasteboard is not part of the harness: a copy control may or may
  not actually deliver text to it, and no check depends on what lands there - only
  on the control's own visible state afterwards.
- The `data-testid` attributes present in the tree, and the values the harness
  records on the window while it measures, are verification probes. Do not
  remove, rename or repurpose them, and do not try to drive the site through
  them: they only ever report what the page itself is doing.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different part of the
  site than the place the symptom shows up, and a single reported symptom can
  have more than one root cause behind it.
- At least one report describes behaviour that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviours you break
  while fixing other things still count against you.
  并非所有缺陷都有报告提及；修别的问题时弄坏的行为同样会扣分。
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "The keyboard shortcut for the component search has stopped working. There is
   a Components box in the navigation with a little command-key badge on it, and
   clicking that box still opens the search overlay exactly as it should. Pressing
   the keys does nothing at all: I have tried Cmd+K on my Mac and Ctrl+K on a
   Linux machine and on a Windows one, and in all three cases the overlay simply
   never appears. It used to open from either set of keys, whichever machine I was
   on. Once the overlay is open by clicking, typing in it and picking a result
   both behave normally."

2. "On the sidebar demo at /try/sidebar the narrow left rail is supposed to be
   icons only, with the name of each entry sliding out when the rail is wide. On
   this build all five names are sitting in the page from the very first paint,
   whether the rail is wide or not - they are just cut off by the rail's own edge,
   so at a glance the rail still looks like a column of icons. What gave it away
   is that the names no longer slide out as one movement when the rail opens; they
   are already there and simply become visible. The five icons themselves are all
   present, in the right order, and the rest of the demo looks right."

3. "The circular progress demo at /magic/circular-progress-bar never finishes.
   The page shows two rings: one is a plain static example that always reads
   zero, and the other runs a little sequence that steps the value up in five
   stages until the circle is complete. The animated one used to sweep round to
   100 and stop there. Now its number sits where it started and the ring stays
   empty however long I leave the page open - I left it two minutes. The static
   ring is unchanged, and the page itself is otherwise fine."

4. "Every code sample on the component pages has a small copy control, and when I
   click it, it turns green to say it worked. It is supposed to go back to how it
   looked after a moment. On this build it stays green permanently: I copied one
   sample on /magic/file-tree, waited half a minute, and it is still green, so I
   have no way to tell whether a second click did anything. The control is not
   disabled and it still responds to being clicked - it is only the going-back
   part that never happens. All six samples on that page have one."

5. "On the timeline demo at /a/components/timeline there is a vertical line running
   down the page with a coloured fill inside it that is meant to grow as you
   scroll, so that by the bottom of the article the whole line is filled in. On
   this build the fill stays about one pixel tall at the top of the line no matter
   how far down I go. The line itself is the right height and still grows with the
   content, and the entries still fade in as they come into view - it is only the
   fill inside the line that never covers any of it."

6. "Some of the Learnings articles have gone missing. The early ones are fine,
   /learnings/1 still opens and shows its title. The later ones are simply not
   there: /learnings/15 answers with an error page and none of the site's own
   chrome on it, as though that document had never been produced. The section's
   own list of articles stops short of them as well - the index cards and the
   navigation beside an article both end at the same place - so it looks like
   the site stopped producing pages for the tail of the list when it was built."

7. "In the scrolling strip of review cards on the front page, every reviewer's
   picture is the same flat grey square with a dashed border and a little text in
   the middle, instead of a photograph. There are a lot of them - the strip runs
   two copies of the same set past each other - and every single one looks like
   that. Has the picture data gone missing from this build? The strip itself
   still scrolls."

8. "On the sidebar demo page I cannot find any way to open the rail on a small
   screen. At the width I am looking at it there is a narrow icon rail on the left
   and nothing else - no toggle, no hamburger, no button of any kind near it. Is
   the control for the narrow-screen version missing from this build?"

Work in the source tree, repair the root cause of each real defect, and leave the
intended behaviours alone: the Components box in the navigation and the overlay it
opens by clicking, the search results and the pages they lead to, the shared
chrome that survives a route change, the top banner's underlined phrase and the
card it opens when you point at it (the card is meant to appear - promptly), the
narrow-screen control that the site's own responsive rules hide at desktop width,
the local placeholders that stand in for remote pictures and the fact that the
site fetches nothing, the static ring on the gauge page that always reads zero,
the six code samples and their six copy controls on the file-tree page, the four
tabs and their labels with the first one selected on arrival, the timeline's own
line height and the way its entries fade in, the early Learnings articles and
their titles, the desktop rail's icons and their order, the extensionless links
the site itself writes, and the generated front page and its title. The tree must
still build with `npm run build` when you are done, must still generate the same
set of pages it generates now plus the ones report 6 asks for, and must still
need nothing from the network.
