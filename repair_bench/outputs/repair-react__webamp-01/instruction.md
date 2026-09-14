# Repair Task - Webamp (React)

You are working on the source code of **Webamp**, a browser re-creation of the
Winamp 2 player built with React and Redux. The demo boots a skinned player
consisting of a main window (transport buttons, a time readout, a scrolling
title marquee, volume and balance sliders), an equalizer window (preamp, ten
band sliders and preset buttons), a playlist window (track list with
selection, add/remove/selection/misc menus, sorting and a running-time
readout) plus a set of desktop icons used to reopen the player or switch
between bundled skins. The project is a pnpm monorepo; the shipped artifact
is the demo app. Building the demo requires building two workspace helper
packages first:
`pnpm --filter ani-cursor --filter winamp-eqf run build && pnpm --filter webamp-demo build`
which emits the static output under `packages/webamp-demo/dist`. All skins,
audio and other media are bundled with the app; it runs fully offline with
no backend.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "The volume slider feels broken. I grab it to turn the volume down and it
   snaps back to where it was the moment I let go - nothing changes.
   Clicking a different spot on the bar does the same: the volume just never
   moves."

2. "I cannot pause with the keyboard anymore. When a song is playing I press
   the pause key and the player simply keeps playing. The other transport
   keys still seem to do their thing, but pause does nothing - I have to
   stop the track and start it over."

3. "The little menus at the bottom of the playlist window (Add, Remove,
   Selection and the rest) refuse to go away. I open one, change my mind,
   click somewhere else on the player - and the menu just stays open. The
   only way to dismiss it is to click the very same menu button again."

4. "There is a keyboard shortcut that reverses the playlist order top to
   bottom. It used to work; now pressing it does nothing at all - the track
   list stays exactly as it was."

5. "I cannot adjust the equalizer bands by hand anymore. Whenever I click
   somewhere on a band slider it jumps straight back to the middle position.
   The preset buttons next to the preamp still seem to work, but setting a
   band manually is broken."

6. "When I double-click a song in the playlist I can hear it start, but the
   player never seems to register what is playing. The scrolling title stays
   on the app's default text instead of the song name, and no row in the
   list is ever marked as the current track. It is like the player loses
   track of which song is supposed to be current."

7. "The time readout never counts up while a song plays. I start a track,
   let it run, and the elapsed time just sits at zero the whole time."

8. "Cosmetic one: the desktop icon for the skin museum is labeled
   'Winamp Skin Musuem'. That has got to be a typo - somebody should fix
   the spelling."

9. "Every time I load the player the volume sits at 78%. Not full, not half
   - seventy-eight. I never set it there. Shouldn't it start at a sensible
   default like 100 or 50?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
