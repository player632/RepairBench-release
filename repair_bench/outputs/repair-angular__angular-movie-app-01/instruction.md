# Repair Task - angular-movie-app (Angular 18 + TypeScript, a TMDB browser)

You are working on the source code of **angular-movie-app**, a multi-page movie
and TV browser built with Angular 18 (NgModule style, not standalone), the
Angular router and TypeScript. It is a read-only browsing app: there is no
account, no form submission and no persistence. Every byte of content comes from
a movie-database API through one data service, and every screen is a rendering
of whatever that service returned.

The shell is fixed on every route: a navigation bar carrying four icon controls
(home, movies, TV shows, and a search toggle), the routed page below it, and a
footer. While a request is in flight a full-screen spinner covers the page and
the routed area is still empty; when the data lands the spinner goes away and
the page fills in. The routes are the home page, a movies index, a TV index, a
movie detail page, a TV detail page, a person detail page, two category pages, a
genre page, a search page that reads its query out of the URL, and a catch-all
that redirects back to the home page. Deep links are real: navigating straight
to a detail page must render that page.

The home page opens with a rotating banner of trending titles. The banner shows
ONE title at a time and advances by itself every five seconds, cycling round
through the set for as long as the page is open. Below it sit two horizontal
carousels of cards - popular movies and popular TV shows - each with a previous
and a next control that can be disabled at the ends.

A banner and a detail page share the same shape: a full-width backdrop image,
the title, a star bar whose FILLED WIDTH is a percentage derived from the
title's average score (the API scores on a 0-10 scale, the bar is a percentage),
a reviews count, a release date or first-air date, a season count on TV titles,
a shortened overview that ends in an ellipsis once it passes a length ceiling,
and a Watch Trailer button that is only there when the title actually has a
trailer. Clicking that button opens a modal holding an embedded player.

A detail page adds a facts list beside the poster. On a movie the rows are
Released, Runtime, Budget, Revenue, Genre, Status and Language; on a TV title
they are First Aired, Last Aired, Genre, Episodes, Status and language. A row is
only rendered when the value behind it exists, so a sparse title legitimately
shows fewer rows than a rich one. Under the facts list is a strip of tabs -
Overview, Videos and Photos on a movie, with Episodes added on a TV title - and
under that a Cast carousel and a More Like This carousel. The Videos tab is a
grid of video cards, each with a thumbnail, a name and a type; clicking a card
opens the same modal the trailer button does.

A person page shows a bio block with its own short facts list, then two tabs:
Known For, which is a listing of that person's titles ordered newest first, and
Photos.

Search works from the navigation bar. The toggle opens a text box; the site
navigates to the search page AS YOU TYPE, carrying what is in the box as a URL
query, and the search page renders either result cards or a "no results found"
line. A close button appears in the box once there is text in it. Clicking
anywhere outside the navigation bar closes the box, clears it and returns to the
home page.

Several of the readings above are produced by small formatting helpers in the
source - a runtime shown as "1h 58min", thousands separators in money and review
counts, the shortened overview, language codes rendered as names and enumerated
with commas, and the newest-first ordering of a person's Known For list. They are
ordinary pure functions and ordinary template bindings, and they are used in more
than one place.

The project builds with the Angular CLI (`ng build`, which is exactly what
`yarn run build` runs; the production configuration is the default, so it is an
AOT build with a strict TypeScript config and strict template type-checking),
and the verifier serves the result from `dist/angular-movie-app-v2/browser/` at
the site root. Dependencies are provisioned offline by the harness.

Environment notes - properties of this offline harness, not defects:

- There is **no network access**, and nothing in this project needs it any more.
  Every API call is answered locally at the HTTP layer by the harness from a
  frozen fixture universe (six movies, four TV titles, three people, plus their
  videos, images, credits, seasons, recommendations, genres and search results),
  with a constant artificial latency, so the same screen shows the same numbers
  on every run and on every machine. That is a property of the test environment:
  do not remove it, replace it with a real call, or route around it.
- This offline build performs **zero remote-origin requests**. The upstream
  project fetched every still from a remote image host, embedded trailers from a
  remote video host, loaded a third-party analytics tag in the document head, and
  linked out to several social and attribution sites. All of those are answered
  from the same origin here: stills and thumbnails are local placeholder images,
  the trailer player is a local inert stub page that keeps the original query
  string, the analytics tag is gone, and outbound links point at a local stub
  that carries the original destination in its query. That is intended, not a
  defect, and re-adding a remote reference would be a regression.
- The harness drives the app in a real browser at a **1440x900 viewport**, with a
  spoofed desktop user agent and a fixed locale and time zone. Every checkpoint
  starts from a **fresh browser context**, so nothing carries over between
  checks, and the app itself persists nothing - no local storage, no session
  storage, no cookies, no URL state of its own beyond the routes and the search
  query.
- The browser console on a detail page shows one Angular type error about reading
  a property of something undefined, during the moment before that page's data
  arrives. That is the seed's own doing - one template binding reads its input
  without a safe-navigation operator - it happens on the pristine tree too, no
  check reads the page console, and it is not one of the defects. Leave it alone.
- The build is a strict AOT build: every file must still type-check and every
  template binding must still be type-correct when you are done. The build also
  prints budget warnings and some stylesheet selector warnings on a healthy tree
  and still succeeds, so a warning is not by itself a problem.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and in a different layer than the one you can see -
  a template binding and the component method it calls are two halves of one
  contract.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Behaviors you break while fixing other things still count against you, and
  several of the readings above are shared by more than one screen, so a fix in a
  shared helper is visible everywhere that helper is used.
- Do not remove, rename or repurpose any `data-rb-*` attributes - they are
  verification probes required by the checker. They are inert markup: they carry
  no styling and no behaviour.

The reports, in no particular order:

1. "the running times are nonsense on the movie pages. Northern Signal is 118 minutes long and the facts box under the banner says "1h 118min" - it used to say "1h 58min". Every film over an hour does it, so the hours are still right, it is the minutes that are just the whole length again."

2. "the money rows have commas everywhere. Budget on Northern Signal reads "4,2,0,0,0,000" where it should read "42,000,000", and Revenue does the same. Oddly the reviews count next to the stars still looks fine ("1,284 Reviews"), which is why it took me a while to see that it is only the big numbers that broke."

3. "the big rotating banner on the home page only rotates once. It switches from the first film to the second about five seconds after the page loads and then it never moves again, however long I leave it sitting there. It used to keep cycling round through all of them."

4. "the search box stopped searching while I type. I open it, type "nor", and nothing happens at all - I stay on whatever page I was on and no results turn up. It only jumps to the results page if I hit Enter afterwards. It used to go across as I was typing."

5. "when I click away from the search box it does not close any more. If there is still text in it and I click somewhere else on the page, the box just stays there with my old search in it and the site stays on the results page. It used to shut and drop me back on the home page."

6. "the people pages are mixed up. The "Known For" tab is completely blank - no list of their films at all - and the list has turned up on the "Photos" tab instead, stacked on top of the pictures. So one tab shows nothing and the other shows both."

7. "one of the films looks like it failed to load. Harbour Lights has no Watch Trailer button at all, its Videos tab is empty - not even a placeholder - and the Budget and Revenue lines are simply missing from the facts box, where every other film has them. Is that page broken, or is that just how that one is?"

8. "small thing but it looks like a leftover typo: on the TV pages the "Last Aired" date has a dollar sign stuck in front of it - "$Jun 1, 2026". The "First Aired" date right above it has no dollar sign. Is that meant to be there?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the shell and its spinner, the routes and the deep links, the rotating
banner and its five-second cadence, the carousels and their end-of-list controls,
the banner and detail layout, the facts lists and their conditional rows, the tab
strips and their panels, the video grid and its modal, the person page's two
tabs, the search box and its type-to-navigate contract, the footer, and every
formatting helper's output on the values that were already correct - none of
which any single report describes in full. The project must still build with the
command above when you are done.
