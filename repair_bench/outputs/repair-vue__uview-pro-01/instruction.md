# Repair Task - uView Pro's demo app, a Vue 3 + TypeScript uni-app component showcase

You are working on the source code of the **demo application that ships with uView Pro**, a
cross-platform UI component library for the Vue 3 + TypeScript uni-app ecosystem. The demo is not
a marketing page: it is a real multi-route single-page app with no backend of its own, bundled for
the web (H5) target by the uni-app toolchain on top of Vite. It has well over a hundred routes -
thirteen root pages plus eight sub-packages - reached through a `#`, so pages are addressed as
`#/pages/...`, and five of them sit in a tab bar at the bottom. Every page is wrapped by the
component library's own root plugin, which is what gives the whole app one shared shell.

Three areas of it matter for this task, and they are wired together into one small economy:

- The **home page** lists the library's components: seven groups, seventy-four entries, each with a
  name, a one-line description, a picture and a route. It has a search box that filters that list,
  and a row of buttons that switch the app's colour theme.
- The **experience map** turns using the demo into a game. It shows your level and its name, a
  progress figure for the level you are in, a growth route of six levels each with its own bar, a
  radar and a summary of which component you use most, a list of recent activity, and a set of
  missions you can be assigned, complete and then claim points for.
- The **component demo pages** (the Button one, and its siblings) wrap each component in a shared
  shell that keeps its own toolbar state - whether you liked it, how you rated it, how many times
  you poked at it - and derives from that an experience progress figure, a sentence of feedback
  about that figure, a sentence about your rating, and a little floating bubble that confirms
  points were earned. There is also an about/version page that reports the build's own metadata.

The point economy is the interesting part, because it crosses pages: doing something on a demo page
or switching the theme on the home page can complete a mission, and a mission that is complete can
be claimed on the experience map, which is what actually awards the points that move your level,
your progress and your most-used component. Your work is stored in the browser between visits.

The project lives in this workspace and is fully offline. Dependencies are supplied as an
already-installed tree; the production build is written to `dist/build/h5/` and that leaf is served as
the site root. Because the machine has no network access, a few things are degraded on purpose and
are **not** defects:

- Every picture on the pages above - the document's own icon, the group and entry pictures on the
  home page, the same shape on a favourites scene page and a decorative background on the shared
  card - is one identical local grey placeholder instead of the upstream generated raster. Each one
  still carries its own distinguishing query string, so each picture is still individually
  addressable and still maps one-to-one onto its component. Upstream these are remote files on a
  third-party image host; nothing is fetched here.
- A decorative preload animation the uni-app web runtime paints on the document body is disabled,
  because it is the one thing in the shipped styles that would otherwise reach a vendor host.
- Some pages you will NOT be asked about still carry remote picture literals in their source. They
  are left alone on purpose: no part of this task navigates there, and rewriting vendored demo
  pages would be a change you were never asked for.
- The build date reported on the about/version page is a fixed value that never changes. Upstream
  the build rewrote a tracked source file on every single run to stamp today's date into it; that
  has been removed here, because a build must not modify the source it is building. The date you
  see is therefore frozen, and that is correct - do not "restore" it.
- The app does not force a theme at start-up. A fresh page comes up in the authored default (a
  green theme) unless a previous choice of yours was saved, in which case the saved one wins.
- The library's own prebuilt plugin folder that the build configuration imports is committed to the
  project and must stay: it is a build input, not a build output.

QA collected a batch of user reports about this build. They are quoted below roughly as users wrote
them - with their own steps, noise and assumptions. Treat them as starting points, not as
diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause somewhere in the
  codebase. The root cause may sit in a different module than the one the symptom appears in, and
  may be on a different page altogether from where you notice it.
- At least one report describes behavior that is actually intended; verify a report before changing
  anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other
  things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes
  required by the checker.

The reports, in no particular order:
1. The level name on the experience map is wrong sometimes, and I think I can
   see the pattern now. I had exactly the number of points the second level
   asks for - not one less, not one more - and it still called me a beginner.
   I played a bit more, crossed that number by a single point, and it jumped
   straight to the right name. It does not do it every time, only when I land
   right on the line.

2. The progress figure on the experience map reads low the whole time. I am
   partway into the second level and it tells me I am a fifth of the way
   there, when by my maths I am about a third. The level name next to it is
   right and the number of points left to go looks right, it is only the
   percentage that is off, and it gets worse the higher I climb.

3. On the growth route down the page, the levels I have already finished show
   an empty bar, as if I never got through them at all. The one I am
   currently working on still fills in properly, and the ones below it are
   empty like they should be - so it is only the ones behind me that lost
   their colour.

4. The recent activity list on the map has stopped moving. I go and like
   something, come back, and nothing new is in there - same old entries in
   the same order. Earlier in the session it used to put the newest thing at
   the top. Now it looks frozen, however much I do.

5. Half of the home page turned English on me. The names on the component
   cards, the little one-line descriptions under them and the headings that
   group them are all English now, while everything around them - the menus,
   the buttons, the search hint - is still Chinese. It looks broken rather
   than translated. I did not change any language setting.

6. On the component demo pages, when I press like, the little bubble that
   tells me I earned points flashes for a split second and is gone before I
   can read it. It used to stay up long enough to read comfortably. The
   points themselves do seem to arrive, it is only the bubble that vanishes.

7. The search box on the home page got dumber. Typing the name of a component
   still finds it, but I used to be able to type part of where a page lives -
   a bit of its address - and find it that way too, and now that returns
   absolutely nothing, not even an empty-looking group. It is like a whole
   way of searching quietly stopped working.

8. Every picture on the home page is the same broken-looking grey box now.
   The group headings have one, each of the component cards has one, and they
   are all identical - it looks like the whole icon set failed to load. Did
   the build lose its images?

9. The developer console keeps showing resource errors when the page loads,
   and I can see references to outside sites in the code. Is this build
   phoning home behind my back, or leaking anything?
## Constraints

- Do not run the project's build, dev server or tests to verify yourself during the session; a
  separate verifier rebuilds and drives the app. Focus on reading the code and fixing root causes.
- The app is offline. Do not add a network call, a remote asset, a CDN script or a webfont: nothing
  will resolve, and the checker measures that the delivered build issues no cross-origin request.
- Fix root causes, not symptoms. A fix that special-cases one page, one probe or one value, that
  hard-codes an expected figure, or that reaches into the browser's stored state to fake a result
  will be caught: the checker verifies that the app leaves no residue behind, that its observation
  surface cannot be re-pointed, and that behaviors which are correct today stay correct.
- Do not "clean up" the frozen build date, the local placeholder pictures, the disabled decorative
  animation or the committed plugin folder. Those are declared above and each one is guarded.
