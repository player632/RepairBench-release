# Repair Task - car dashboard experiment (Angular)

You are working on the source code of a small **car dashboard experiment**: an
Angular single-page app that draws a digital instrument cluster - two round
dials built up from vector graphics, a status strip, a navigation card, a
bottom panel and a map panel. Nothing is connected to a real vehicle; the cluster is driven
by a simulated driving loop:

- Hold the **up arrow** key to apply throttle. The digital speed reading, the
  speed needle and the rev counter all follow, and the gearbox moves up through
  its six ratios as the revs climb.
- Hold the **down arrow** key to brake. Release both keys and the car coasts,
  slowing on drag until it comes to rest.
- The same throttle-and-release works by **touch**: press and hold anywhere on
  the cluster, lift to let go.
- The cluster fits itself to the browser window. Around the dials it shows a
  top status strip (remaining range, network, battery, outside temperature), a
  navigation card carrying the place name of the current position, a bottom
  panel with trip, clock, odometer, paired device and now-playing fixtures, and
  a map panel with a dot for the current position.

The project lives in this workspace and is fully offline: dependencies are
already installed, `npm run build` writes a static bundle, and a separate
verifier serves that bundle and drives the page in a browser. Because there is
no network here, two things are expected in this environment and are **not**
defects: the map backdrop is a plain dark surface (no street tiles can be
fetched), and the place-name lookup for the current position is answered from
data bundled with the app.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different module
  than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "Lifting off the throttle does nothing any more. I hold the up arrow until
   the speed reads about 60, let go, and the number just sits there - it never
   comes down on its own, not even after a minute. The only way I can slow the
   car now is to press the down arrow."

2. "The little marks around the speed dial are gone. The numbers are still
   printed, but the face between them is bare - it looks like a plain circle
   with digits floating on it. It used to have a dense ring of small marks with
   longer ones every 20."

3. "The gear letter in the middle of the rev counter never changes. I
   accelerate flat out and it stays on the first ratio forever, even though the
   car keeps pulling and the rev needle is sweeping all over the dial."

4. "The numbers printed around the rev counter disagree with the small caption
   underneath them. The caption says the dial is in thousands, but the printing
   goes 10, 20, 30 all the way to 80. One of the two is wrong and I can't tell
   which."

5. "The rev counter reads low. Rolling at a steady 50 in first gear it shows
   something like half of what it should - the needle sits well below the
   halfway mark while the engine is clearly working, and the gearbox goes on
   changing at the right moments, so the car itself feels fine."

6. "The outside temperature in the top strip is printed as `-12 &deg;C` -
   literally, with the ampersand and the little word in it. It has looked like
   that since the last build."

7. "When the cluster is parked both needles sit hard over at the left stop and
   the speed reads 0, and absolutely nothing moves until I press a key. Is the
   whole thing dead on arrival, or is that normal?"

8. "The bottom panel is frozen solid. The clock has said 10:16am for a week,
   the trip distance and the odometer never move, and it is still playing the
   same track. Nothing down there ever updates - can you make it live?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself during
  the session; a separate verifier rebuilds and drives the app. Focus on
  reading the code and fixing root causes.
