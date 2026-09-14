# Repair task: svelte-video-editor

We run the Svelte video-timeline editor demo (the `/simple` page and the
`/advanced` page of this repo's built site) for internal review. After a
recent update our editors started filing a pile of complaints. Some of these
reports may be overlapping, some may be red herrings — triage them yourself.
Fix the product so all genuine problems below stop happening, without
regressing anything that already works.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

## What our editors reported

1. **Playback jumps back to the start.** "If I park the playback cursor a few
   seconds into the timeline and press play, it always starts over from the
   beginning instead of continuing where I was."

2. **Redo feels broken.** "After I undo something, redo brings it back — but
   if I press redo a second time, the change disappears again. It's like redo
   fights itself."

3. **Split does nothing.** "I put the playback cursor in the middle of a clip and hit
   the split shortcut (or the scissors button) and nothing happens. The clip
   stays in one piece."

4. **The out-point key behaves like the in-point key.** "I set my in point
   with `I`, move the playback cursor forward, press `O` for the out point — and the
   highlighted range jumps forward instead of ending where my playback cursor is. It
   looks like `O` is moving the in point."

5. **Renaming a track doesn't stick.** "Double-click a track name, type the
   new name, press Enter — and the old name comes right back."

6. **Jump-to-next-marker lands on the wrong marker.** "With two markers on the
   ruler, I stand between them and use 'next marker' — the playback cursor goes to
   the marker *behind* me (the one at the very start), not the one ahead."

7. **Clicking the ruler seeks too far.** "When I click somewhere on the
   timecode ruler to position the playback cursor, it lands noticeably to the right
   of where I clicked — roughly a couple of seconds off."

## Also flagged, but we're not sure these are bugs

- Someone panicked that the **frame-rate and aspect-ratio controls are greyed
  out** once a project has clips on the timeline. "I can't change my project
  to 60 fps anymore!"
- Another editor swears **undo should restore the in/out range**: "I set my
  in point, pressed undo by accident, and the range was still there. Undo
  isn't doing its job!"

Please verify for yourself which of these are real defects and which are the
product working as intended, and act accordingly.

## Ground rules

- The demo pages must keep working offline; do not introduce any external
  network dependency.
- Don't break the keyboard shortcuts that currently work (space, arrow keys,
  `S`, `M`, `I`/`O`, modifier combos, etc.).
- Existing projects saved by the demos (simple and advanced) must keep their
  behavior; edits should still persist across reloads where they did before.
- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
