# Repair Task - GitTok (SvelteKit 2 + Svelte 5 + TypeScript, a vertical-scroll discovery feed for GitHub repositories)

You are working on the source code of **GitTok**, a small SvelteKit application that presents GitHub
repositories in a TikTok-style vertical scroll. It is a Svelte 5 project - runes, `$props()`,
`{@render children()}`, `$:` reactive statements and `{#each}`/`{#if}` blocks rather than a store-heavy
legacy idiom - styled entirely with Tailwind utility classes, bundled by Vite, and exported as a fully
static site: every route is prerendered at build time and the client takes over afterwards.

There are five routes. The **landing page** is an animated hero: a glass card with the product name, a
byline that links to the author, a rotating community quote that changes every five seconds, three
feature one-liners, and a call to action that takes the visitor into the feed; behind the card, twenty
soft coloured blobs drift on randomised animation delays. The **feed** is the product itself: a
full-height scroll container with snap behaviour, a fixed pair of round icon buttons in the top-right
corner that lead to the about page and to the topic setup page, a card per repository, and two
full-screen state banners - one while more repositories are being fetched, one when the end of the
feed has genuinely been reached. The **setup page** is where a visitor picks interests: a text field
that suggests matching topics as you type (capped at a handful of suggestions), an "Add" button that
accepts a topic of your own, a grid of predefined topic categories that expand into subcategories and
then into individual selectable topics, a list of the topics you have chosen so far where each chip can
be removed again, and a floating button bar whose label and whose "Skip for now" button both depend on
whether anything is selected. Selections are remembered between visits. The **about page** is static
prose with two lists and a column of outbound links. There is also a **developer-only database page**
that is reachable by URL and is deliberately not linked from anywhere in the product.

The whole application is wrapped by one shared shell, one global stylesheet that sets the dark theme
for the document body, and one document template that carries the page metadata, the icon and manifest
advertisements, and the wrapper element the routed content is mounted into. Because the site is
exported as a static bundle, the document template and the app manifest are part of the shipped
product surface: what they advertise is what an installed or shared copy of the product will do.

The **feed route depends on the GitHub API at runtime**. On a machine with no network access that
dependency simply does not resolve, the feed renders its chrome with no cards in it, and both of its
state banners stay hidden. That is the normal, expected behaviour of this face and it is not one of the
problems you are asked to repair.

## What is wrong

Twelve things are wrong with this build. They are not typos and they are not compile errors: the
application builds and runs, every route renders, and each problem is a piece of product behaviour that
has come out wrong. They sit at different depths - some are a single value in a single place, some are
a behaviour that only shows up once you combine a data table, a template loop and the rendered document,
and at least one pair interferes with each other, so that repairing one of them changes what you can
see of the other. Fix the cause, not the reading.

Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及). Some of what you
will find has no report at all, and you are still expected to find and repair it. Conversely, at least
one thing a reader might be tempted to call a bug is **intended behaviour** and is described as such
below - verify before you change anything, because "fixing" a behaviour that was already correct costs
you.

The reports below are written by users, in user language. They describe what somebody saw, not what
somebody diagnosed. Two warnings apply to all of them:

- **Verify before changing.** At least one statement in this task describes behaviour that is already
  correct and must be left alone. Read the code before you edit it.
- **Look for the root cause across layers.** A symptom that shows up in the rendered document may be
  caused somewhere else entirely - in a data table, in a shared module, in a store, or in the document
  shell - and two symptoms that look unrelated may share one cause. Repairing the place where the
  symptom is visible, rather than the place where it is produced, will leave the product wrong.

There is also a **read-only measurement layer** installed in this working copy. It observes the
application the way a user would - by reading the document, its computed styles and its own storage -
and it can perform the clicks and keystrokes a user would perform. It is not part of the product, it
changes nothing, and it must be left exactly as it is: do not edit it, do not remove it, do not add
hooks, markers, identifiers or attributes for it, and do not make any code behave differently because
it is being observed.

## Reports

1. "The landing page used to feel alive - there were these soft glowing blobs drifting around behind
   the card, lots of them, all over the screen. Now there are only a handful, maybe six, clustered in
   the middle, and the rest of the background is just flat dark. The card itself looks the same."

2. "I cannot un-pick a topic. On the setup page I tap a topic to select it and it appears in my
   selected list with a little cross on it, fine - but then I tap the same topic again, or I tap the
   cross, and nothing happens. It stays selected forever. The only way to get rid of it is to clear my
   browser storage, which I only found out by accident."

3. "The whole site has lost its look. The dark purple-to-black gradient behind everything is gone, the
   body is a plain flat colour, and text that used to be a soft light grey now comes out near-black on
   some pages. It looks like the theme was never applied at all. It affects every page, not just one."

4. "The feed tells me I have reached the end before it has shown me anything. I open it and there is
   just the big 'You've reached the end!' message on an empty screen - no cards, no loading message,
   straight to the end. It used to only say that once you had actually scrolled through everything."

5. "The developer database page has gone narrow. It used to be a comfortable wide column in the middle
   of the screen, now it is squeezed into less than half that width, still centred but much thinner, so
   the rows wrap awkwardly. Nothing else about that page changed."

6. "When I add my own topic on the setup page it does not behave like the built-in ones. I typed a
   topic with a capital letter in it and it was stored with the capital letter, so it sits in my
   selected list looking different from every other topic, and it never matches anything - the search
   suggestions do not recognise it and it is not the same topic as the lowercase one. Custom topics
   used to be folded down to lowercase like everything else."

## Intended behaviour you must NOT change

- The document metadata advertises a social-preview image at a path that this project does not ship.
  Nothing in the product ever requests it, no page displays it, and it is not part of any symptom. It
  is a pre-existing wart in the metadata block. Leave it exactly as it is.
- The feed's scroll container carries one leftover class token that a previous author pasted in from a
  browser inspector. It does nothing and it is harmless. Leave it exactly as it is.
- The developer-only database page is reachable by URL and is linked from nowhere. That is deliberate.
  Do not add navigation to it and do not delete it.
- Outbound links to third-party sites, the canonical link, and the topic chips' own capitalised
  *appearance* (which is a styling choice applied on top of the stored value) are all intended.

## What a correct repair looks like

Every one of the twelve problems is repaired at its cause; the twelve behaviours read correctly again;
nothing else about the product changes; the read-only measurement layer is untouched; the intended
behaviours listed above are still exactly as they were; and the application still builds and still
exports the same set of routes.
