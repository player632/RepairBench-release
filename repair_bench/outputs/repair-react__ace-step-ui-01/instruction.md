# repair-react__ace-step-ui-01 · ACE-Step UI repair task

## The face you get

A React 19 + Vite 6 + TypeScript single-page front end for a locally hosted ACE-Step
music-generation server. One document, one collapsible icon rail on the left, and five
in-page views reached from that rail: the create surface, your library, search, training
and the release notes. The create surface carries a free-text style box with a row of
quick-tag chips, a model picker, a "Advanced Settings" disclosure that opens a bank of
labelled sliders (tempo, length, inference steps and the rest), and the Create button that
submits a generation job. The library view has four tabs. The release-notes view lists two
announcements, each with its own dismiss control. The rail also holds an appearance toggle
and a settings button that opens a sheet with a language picker and two appearance options.
Failures surface as a transient notice near the transport.

The back end is not part of the measured face. The tree ships a server directory and a
vendored audio-editor directory, but nothing serves them here, so every call the front end
makes to it fails and the app is expected to cope. The delivered baseline is offline-clean:
it makes no off-origin request of any kind, and it signs itself in as a fixed local user so
the create surface and the settings sheet are reachable.

## How the face is served

- The bundle is built and served over plain HTTP from a static file server on the loopback
  interface. Requests the app sends to its back end answer "not found"; that is the
  designed offline condition, not a defect.
- The viewport is fixed at 1280x800 and the interface language is English.
- Do not introduce a build step of your own, do not add dependencies, and do not restore
  any external URL, CDN, remote API, webfont or icon host: the face must stay offline.

## User reports (8 items)

Eight reports came in from testers. **They are in no particular order and they do not
correspond one-to-one with the defects.**

1. **[REPORT-1]** "The style box loses everything I already typed. I write a description,
   then click one of the quick-tag chips below it, and the box ends up holding only that
   chip's word — my own text is gone. Clicking a second chip replaces the first one again
   instead of adding to it."
2. **[REPORT-2]** "The 'Advanced Settings' button on the create surface is dead. Clicking
   it does nothing at all — no slider bank ever appears, and I cannot reach the tempo,
   length or step controls. It looks permanently collapsed."
3. **[REPORT-3]** "When a generation fails, the red notice appears and then just stays
   there. It never goes away on its own; I have to reload the page to get rid of it. It
   used to disappear by itself after a couple of seconds."
4. **[REPORT-4]** "Dismissing a release note works until I reload. Both notes come back
   every single time, so dismissing them is pointless — the app has forgotten that I
   already dismissed them."
5. **[REPORT-5]** "In the library, clicking the 'Liked Songs' tab selects the wrong tab.
   The heading and the highlighted tab say 'All Songs' even though my click landed on
   'Liked Songs'. The other three tabs behave normally."
6. **[REPORT-6]** "The tempo control does not respect its own maximum. The slider is
   labelled 0 to 300, but if I type a larger number into the box and leave the field it
   keeps my out-of-range number instead of pulling it back to the largest allowed value.
   Numbers below the minimum are still pulled up correctly."
7. **[REPORT-7]** "At the bottom of the screen the player area only says 'Select a song to
   play' and shows no transport controls at all. Is the player broken?"
8. **[REPORT-8]** "The tempo slider reads 'Auto' and sits at 0 when I first open the create
   surface. Surely it should default to a real tempo value?"

## About these reports

- **Not every defect is described in these reports.** Some of the eight reports above
  describe behaviour that is correct as shipped — "fixing" those will break working
  behaviour and will be scored against you. Other real defects are not mentioned anywhere
  in this document at all: you have to read the whole delivered face yourself and find
  every place where it departs from its own intended behaviour.
- The reports are **symptoms, not diagnoses**. They say what a tester saw on screen. They
  never name a file, a line, a mechanism or a change to make.
- Scoring is **all-or-nothing**: every real defect must be repaired *and* no shipped
  behaviour may be broken, including the normal behaviour the two mistaken reports describe.
- Some defects **mask each other**. One wrong behaviour can hide a second one, so a control
  that "looks right" after a partial repair may still be wrong. Judge by the code and by
  the application's own state, not by the first thing that appears on screen.
- At least one defect is **time-dependent**: it can only be observed inside a time window,
  never in a snapshot taken the moment the page loads.
- At least one defect is about **where a value is kept between loads**, and at least one is
  about **what the address bar says after you navigate**. Neither is visible in a single
  screenshot.

## Constraints

- **Zero network at run time.** No external URL, CDN, remote API, webfont or icon host may
  be added or restored; everything the face needs must come from inside the tree.
- Keep the delivered shape: a bundled static front end served from its own build output. Do
  not turn it into something that needs a live back end, and do not delete the tree's other
  directories just because they are not exercised.
- Do not remove or rewrite the `data-rb-*` attributes or the read-only inspection handles
  already present in the delivered baseline. The scoring surface reads them; they are pure
  reads and give you no way to write application state.
- Do not try to make checkpoints pass by writing global variables, writing to browser
  storage, changing the URL, special-casing an inspection handle, or hardcoding an answer.
  Residue of exactly that kind is checked for separately and will be scored against you.

## Grading

34 checkpoints in two partitions: 12 fail-to-pass checkpoints (one exclusive detector per
real defect) and 22 pass-to-pass checkpoints (shipped-behaviour guards, including the green
guards for the two mistaken reports, the offline self-sufficiency guard, the storage/URL
residue guard and the time-window pin). reward = 1.0 only when both partitions are entirely
green; score = 100 x f2p_rate x p2p_rate.
