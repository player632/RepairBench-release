# Repair request - browser-side media tool

You are handed a checkout of this repository in a broken state. A set of regressions was
introduced into the browser half of the product. Your job is to find them, repair them at the
root cause, and leave everything else in the tree alone.

## What users reported

1. In the output-format list, the two entries that can only be produced by the processor now
   carry the same filled green "ready" marker as the accelerated ones. It used to be a plain
   hollow marker, so you could see at a glance that those two would be slow. The list now
   promises acceleration that this machine does not have.
2. The build stamp on screen no longer agrees with the release stamp. It looks like a
   four-segment number that lost or mixed up a segment, so one and the same build shows up
   under two different numbers depending on where you look.
3. On the screen where you pick output quality, the estimated file sizes used to be listed
   from the smallest to the largest. They now come out largest first, which makes the
   recommended preset look like the most expensive one.
4. The badge for the AV1 encoder used to be green like every other supported encoder. It is
   now blue, so people believe support for it was dropped.
5. When the light appearance is selected the whole page looks like a photographic negative:
   text and panels come out near-black on near-white inverted, and the app is unreadable until
   you switch back to the dark appearance.
6. The past-jobs screen keeps telling users that tracking is turned off and that they should go
   to the preferences screen to turn it on. Nobody turned it off. Until recently the same screen
   simply said that it could not reach the service and showed nothing else.

Two further reports arrived from the same group of users:

7. The output-format menu only ever offers processor-based encoders on this machine; not one
   accelerated entry shows up.
8. The preferences screen sometimes greets you with a banner saying your saved preferences
   could not be loaded and that defaults are being used instead.

Not every defect is described in these reports. Some of the reports above may also describe
behaviour that is correct for this machine or for this way of running the product. Treat every
report as a clue and never as a verdict: confirm it against the running product before you
change anything, and expect to find damage that nobody reported.

## Rules

- Verify your work by running `bash tests/run.sh` from the repository root. That script is the
  only judge. Do not edit it, do not delete it, and do not add tests of your own.
- Only the browser half of the product is in scope. The repository also contains a separate
  service half written in another language: do not run it, edit it, or depend on it, and do not
  start any server or background process of your own.
- Do not add dependencies, and do not add test hooks, data attributes, identifiers, globals or
  branches whose only purpose is to make an observation pass.
- A small read-only observation layer is already wired into the app so the judge can read what
  a user would see. Keep it in place and unmodified; it must never change product behaviour.
- Repair root causes in product code. Suppressing a symptom, hard-coding an expected reading,
  special-casing the observation, or narrowing what is observed all count as cheating.
- Leave unrelated files, formatting, dependencies and history untouched.
