# Repair brief - a zero-build browser player for Cave Story tracker tunes

**What you are handed.** A small static page with no framework, no bundler, no dependency directory
and no build step of any kind: the entry document at the source root loads exactly two classic
scripts and every reference in it is relative. The page plays Cave Story `.org` tracker tunes through
the Web Audio API, draws a piano-roll view of the current tune on a drawing surface that refills the
window, and offers a dropdown of the 97 tune files that ship inside the tree. One binary sample
table ships beside the two scripts and is read once at start-up. The tree is served exactly as it
stands and must keep working with the network switched off.

**Not every fault is described in these reports.** The page is broken in twelve places; only seven of
them are written up below. The rest are only findable by reading the code, and they are graded too.

## What the reporter noticed

1. The loudness response is wrong. A note written at a modest volume now comes out almost as loud as
   a note written at full volume, the whole tune sits too high, and the quiet parts have lost their
   dynamic range. Nothing is clipped or distorted - it is simply louder than it used to be.
2. Right after pressing play the first step of the tune is swallowed. The playback position is one
   step behind where it should be from the very first advance onwards, and it stays one step behind
   for the rest of the tune.
3. When a tune reaches its end it does not go back to the marked loop point. It restarts from the
   very top of the file, so the intro plays again every time round.
4. Melody notes are cut dead the instant they start. You get silence where a held note should be, and
   the roll never shows a note as still sounding.
5. The mouse wheel will not move the roll view down. Turning it the way that used to scroll towards
   the later part of the tune does nothing at all when the view is already at the top.
6. The tune dropdown is in raw file order instead of alphabetical order, so the entries are in a
   jumble and a given tune is no longer where it used to be.
7. Picking any tune from the dropdown loads nothing: the request for the chosen file fails and the
   player stays empty.

## Two reports that are NOT faults - do not "fix" these

8. "There is no pause control, only play and stop." That is how the page has always been. The control
   bar carries exactly two buttons and a third one has never existed; stopping is the only way to end
   playback. Adding a pause control, or renaming either button, is a regression.
9. "Nothing is remembered between visits - after a reload the dropdown is back on its first entry and
   the view is back at the top." That is intended. The page deliberately keeps no stored state of any
   kind, in the browser own storage or anywhere else, and it must stay that way. Restoring a previous
   selection or a previous view offset by persisting anything is a regression.

## Normal behaviour worth knowing (also graded)

- The drawing surface refills the window on load and on resize. It is landscape, never square, and
  its backing store matches the space it is given.
- The roll view starts at the top, and one wheel direction moves it towards the later part of the tune.
- The dropdown holds exactly 97 entries, all distinct, and the first one is selected on load.
- The page never reaches outside itself: no external script, style, image or frame reference, and no
  request leaves the machine it is served from.
- Playback is driven by the page own scheduling. The sample rate and the number of samples per step
  are properties of the player, not of the machine clock, and no audio device is required for the
  grader to observe the transport.
- A note that has run its full length is released; a note that has not is still sounding.

## Harness probes - sanctioned, do not touch

The page carries a set of read-only inspection probes added by the harness: labelled hooks on a few
of its own elements and one frozen accessor object hung off the window, non-enumerable and
non-writable, whose every member is a read-only function. The grader reads through them. They are not
part of the fault. Leave them exactly as delivered: no fix may depend on them, special-case them,
rename them, remove them or write to them, and no fix may add state that survives a reload.

## Ground rules

- Zero build, zero dependency install: the served tree is the source tree, and the entry document at
  the source root is the delivered artefact.
- No network access at run time, and nothing may be vendored in from outside the tree.
- Fix the causes in the page own code. Do not special-case a probe, a reading, a tune or a value.
