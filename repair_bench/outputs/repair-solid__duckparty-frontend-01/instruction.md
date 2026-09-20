# Repair Task - DuckParty frontend (SolidJS + TypeScript + Vite, a browser duck-party builder)

You are handed a **workspace** containing the DuckParty web client: a single-page app where a
visitor designs a rubber duck (skin plus accessories), names it, and drops it into a shared
"yard" that everyone can pan, zoom and browse. It is a pure client build - there is no server
component in this workspace, and none is expected.

## What the graded surface is

- A **landing page**: a big white circle with a duck, a welcome panel offering "Create new
  duck", "My ducks" and "Duckboard", and a small GitHub star badge in the top-right corner.
- An **appearance selector**: two tabs (Skin / Accessories) with a live preview of the duck,
  and a "Finish styling" button that only appears once a skin *and* at least one accessory
  have been picked.
- A **naming form**: a duck-name field, a creator-name field (shown only to visitors who are
  not signed in), a "Change Style" button and the "Jump into the party" submit button, with
  per-field validation messages.
- The **yard** at `/party`: every duck scattered on a patterned background, draggable and
  wheel-zoomable, with a toolbar (hamburger menu, sound toggle, recenter, fullscreen).
  Clicking a duck opens an info card with its name, creator, birthday, likes, dislikes and
  rank.
- A **Duckboard** at `/leaderboard` (the ranked table), a **creator page** at
  `/creator/<id>/ducks`, and a **set-email page** at `/set-email`.

Everything is served from one static origin. The app's backend calls are answered inside the
page by a small offline data desk that ships with the workspace: six seeded ducks, a handful of
seeded owners, and a fixed GitHub star count. **There is no network access at all** while this
is checked - any request that tries to leave the origin is blocked and counted.

## How the work is checked

- Your tree is installed and built offline with the project's own toolchain, then served
  statically and driven by a headless browser at **1440x900**.
- The checks read the **live app**: DOM text and attributes, the yard's rendered transform,
  which accessories are marked as selected, whether buttons are enabled, what the address bar
  says, what is in browser storage, and what the offline desk was asked for. Several readings
  are taken **after** a gesture and a settle window, and some are taken again after a reload.
- The checks are interaction-level, not code-level: they click, type, drag, scroll, wheel and
  press keys, then read what the user would see. They never import your modules and never call
  your functions.
- A handful of **inert marker attributes** were added to elements the app already rendered, so
  the checks can find them. They carry no styling and no behaviour. **Keep them exactly as they
  are** - do not rename them, move them, or add behaviour that keys off them.

## Reading the reports

- Most reports describe **real, reproducible defects**, each with its own root cause. The root
  cause is frequently **not** in the file or the layer where the symptom shows up: a wrong
  number on screen can come from a helper two modules away, and a widget that never updates can
  be the parent's fault rather than its own.
- At least one report describes behaviour that is **actually intended**; verify a report before
  you act on it. "Changing" intended behaviour is scored as a regression.
- **Not every defect is necessarily mentioned in the reports** (并非所有缺陷都有报告提及). Some
  broken behaviour is not described anywhere below and will only be found by exercising the app
  rather than by reading the list.
- Keep the rest of the app intact. Fixes that make one report pass by disabling a feature,
  freezing a value, short-circuiting a component or narrowing what renders will be caught by
  the guard checks and score zero.

---

## Reports from users

**Report 1 - the naming form nags at the wrong time and about the wrong field.**
"When I open the naming form it is already shouting at me. I have not typed a single character
yet and both fields are showing an error message. Then it gets worse: I type a two-letter duck
name, click out of the field, and the message that appears is about the *creator* name being
required - the duck-name field goes quiet. It is exactly backwards. Before I touch anything it
complains, and once I have actually made a mistake in a field it stops complaining about that
field."

**Report 2 - a duck can end up wearing two hats.**
"In the accessories tab I put the pirate hat on my duck, then I clicked the chef hat expecting
it to swap. It did not swap - the duck is now wearing both, and the preview shows two hats
stacked on its head. Hats are supposed to be one-at-a-time. Oddly enough, mixing a hat with the
sunglasses still works fine, so it is not that selection is broken across the board; it is
specifically the same-kind replacements that pile up."

**Report 3 - finishing a duck leaves me where I started.**
"I go through the whole flow - pick a skin, pick an accessory, finish styling, type a name and
a creator name, hit 'Jump into the party'. The button does its loading thing, and then... I am
still on the landing page with the big white circle. I expected to land in the yard with the
other ducks. If I click 'Duckboard' and come back, or reload, I am still on the landing page.
It feels like the last step just does not happen."

**Report 4 - every duck's birthday is in the future.**
"I clicked a duck in the yard to open its card. The birthday line says 'in 3 days'. Every duck
I open says some date *ahead* of today - 'in 3 days', 'in 5 hours', that kind of thing. These
are ducks that were created days ago; the card should be telling me how long ago that was, not
counting down to something that has not happened."

**Report 5 - the recenter button only half works.**
"In the yard I panned off to the side and zoomed in, then hit the recenter button in the
toolbar. The zoom resets - the ducks go back to normal size - but the view stays exactly where
I had dragged it. I am looking at an empty corner of the yard at 1:1 zoom. Hitting it again
does nothing more. I have to reload to get the ducks back in view."

**Report 6 - signed-in users never get asked for an email.**
"I signed in and went into the yard. I have not set an email on my account, and the app is
supposed to pop the 'set your email' prompt over the yard so I can claim my ducks. It never
appears. The menu correctly shows 'My ducks', so it clearly knows who I am - it just does not
ask. People who created ducks as a guest and then signed in have no way to claim them."

**Report 7 - the white fade at the top of the accessories list is backwards.**
"On the accessories tab there is a white fade across the top of the scrollable list. When I
have not scrolled at all, the fade is sitting there covering the first row of accessories, as
if there were content hidden above it. As soon as I scroll down - which is exactly when content
*is* hidden above - the fade disappears. It should be the other way round: no fade at the top
of the list, fade once I have scrolled into it."

---

## Two things users mentioned that may not be bugs

**Observation A - "the star count looks made up".**
"The badge in the corner says the project has 1,234 stars. That is not the number this repo
has, and it never changes. It looks like somebody hardcoded a number into the UI."

**Observation B - "the yard shuffles itself".**
"Every time I load the yard the ducks are standing somewhere different. Same ducks, same count,
completely different arrangement. It looks like the layout is broken or being randomised by
mistake."

Both observations are worth checking before you touch anything. If one of them turns out to be
the app behaving as designed, **leave it alone** - "fixing" it is scored as a regression.

---

## Keep the rest intact

Specifically, these territories are exercised by guard checks and must keep behaving exactly as
they do now, whether or not a report mentions them:

- the landing page and its three entry points, and the address bar staying where a direct load
  put it;
- the offline self-containment of the whole app: nothing may reach outside the origin, no
  unmapped backend path may be hit, and a plain visit must leave browser storage empty and no
  stray globals behind;
- the star badge and where its number comes from;
- the yard's population and its rest state before any gesture, plus the toolbar buttons and the
  sound toggle's starting state;
- the Duckerboard's rows, ranking and creator column;
- the creator page's heading and cards;
- the appearance selector's full catalogue on both tabs and the fact that its list really
  scrolls;
- accessories from **different** kinds still stacking together, and the preview reflecting them;
- the naming form's submit gate: disabled while empty, enabled once both names are valid;
- the duck info card opening on a click, carrying the right duck, and closing again on Escape;
- the hamburger menu opening and listing the entries an anonymous visitor is entitled to;
- the standalone set-email page and its form.

Fix the defects at their root cause. Do not special-case a reading, do not hardcode an expected
value, do not narrow what the app renders, and do not disable a feature to make a symptom go
away.
