# Repair Task - eletypes (React)

You are working on the source code of **eletypes**, a typing-test web app
built with React 18 + Vite + MUI: a timed typing test (15/30/60/90 seconds
or untimed) over random English or Chinese word lists with normal/hard
difficulty and optional number/symbol add-ons, live WPM and accuracy
readouts, a results screen with a per-second chart when the timer runs
out, redo/restart controls, a local score history with badges and ranks,
word cards for memorization practice, and a 3D keyboard lab. The project
lives in this workspace; it builds with `npm run build`
(the Vite production bundle is emitted to `build/`, which is served as the
site root). The app is fully offline in this deployment - score history,
badges and settings live in the browser's local storage; the online
leaderboard has no configured backend here.

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

1. "When a test finishes it is supposed to be saved into my local score
   history automatically, but nothing shows up anymore. I finish a 60
   second run, open the history, and the run is simply not there. It
   worked before."

2. "I dug into my saved history entries and the numbers look corrupted.
   Accuracy is stored as a tiny fraction - something like 0.96 where it
   should say 95.something. The entries from before the regression look
   right, the new shape does not."

3. "The 'effective WPM' in saved entries does not line up with the run
   anymore. For a 100 wpm run at ~95% accuracy I expect an effective
   value a bit below the raw wpm, but what gets recorded is off."

4. "History used to be kept per mode - language, difficulty, duration and
   the add-ons - so my 60-second records and my 15-second records were
   separate lists. Now the duration seems to fall out of the split and
   runs of different lengths land in the same bucket."

5. "The accuracy on the results screen is wrong. I type a short test and
   only miss a couple of characters, and the finish screen shows an
   accuracy way lower than it should be - almost like my misses are being
   counted as my score."

6. "The countdown runs too fast. On a 60 second test the timer visibly
   loses about two seconds per second, so the test ends in half the time.
   My browser clock is fine."

7. "Typing does not register while a test is running. I press keys and
   the input stays empty, nothing is highlighted, no word completes. The
   keyboard itself is ok - other sites work."

8. "Word completion is inverted. When I type a word exactly right and
   press space it gets counted as wrong and the test does not move on to
   the next word. When I type garbage it seems to be accepted. It makes
   the whole test unusable."

9. "Hard mode got strangely easy: every word it deals out is tiny, four
   letters at most. Hard is supposed to draw from the longer word bank,
   not shorten it."

10. "My best WPM does not update anymore. I finished runs clearly faster
    than my stored best and the best/rank value just stays where it was."

11. "The leaderboard says 'Leaderboard unavailable.' every time I open it
    - is the leaderboard broken in this build?"

12. "There is a promotional line scrolling in the header about creators
    submitting links. It looks like an ad that snuck in - is that
    supposed to be there?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
