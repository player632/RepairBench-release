# Repair Task - Not My Cows (vanilla, zero-build)

You are working on the source code of **Not My Cows**, a small arcade
defence game written as a single hand-rolled HTML page with one inline
script and one canvas: meteors fall out of the sky onto your paddock and
you drive a farmer left and right, swing the turret he carries, and shoot
the rocks apart before they land on your herd. The run starts from a title
screen (press Enter), the score goes up for every rock you shatter, the
herd is counted in the top-left of the play field, and the run ends when
the last cow is gone. The top bar also carries a Mute Music button and two
external links. The project lives in this workspace and is fully offline:
there is no dependency install and no build step - the page in the source
root *is* the served face, and every picture, sound and font it uses is a
local file in the tree. There is no backend and no network access, so
anything that would open an external site cannot work here, and browser
autoplay policy means the audio elements may stay silent even when the
game asks them to play; the music reports below are about the mute state
the page keeps, not about whether you can hear the tune.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the page. The root cause may sit in a different
  part of the code than the one the symptom appears in - a control that
  feels broken can be broken by the routine that consumes it, and a rule
  that looks like drawing code can be the one that decides whether the
  run is over.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is described in these reports. Behaviors you break
  while fixing other things still count against you, and some of what is
  wrong with this build is only visible if you go looking for it.

The reports, in no particular order:

1. "I can only get one shot off. I tap fire twice in quick succession and
   the second shot never comes out - the turret stays dead for ages before
   it will fire again. It used to be a short pause between shots."

2. "The aiming is mirrored. I hold the right arrow to swing the turret to
   the right and it swings to the left instead, and holding the left arrow
   swings it right. Driving the farmer with A and D is fine, it is only the
   turret that goes the wrong way."

3. "The farmer will not stop walking. I tap D to step him to the right,
   let go of the key, and he just keeps sliding right on his own until he
   reaches the edge of the field. Same thing with A to the left."

4. "My cows die for no reason, and survive when they should not. A rock
   that lands square on a cow does nothing to it, but the pieces of a rock
   I already shot down still kill cows. The herd thins out at the wrong
   moments."

5. "The music is gone for good. I clicked Mute Music once, and now
   clicking it again does nothing at all - the music never comes back, no
   matter how many times I click."

6. "When I lose the herd the game throws me straight back in. I never get
   the title screen again: the moment the last cow goes, a brand new run
   starts by itself and I have no time to see how I did."

7. "I only get four cows in the paddock. It used to be five - the little
   cow counter in the top-left shows four icons at the start of every run
   now, so my best possible score is lower too."

8. "The Mute Music button never changes its wording. After I click it the
   button still says Mute Music, so I can never tell whether the music is
   on or off. That has to be a broken mute indicator."

9. "Before I press Enter the title screen looks frozen. The cows shown
   down there never wander around and nothing falls from the sky, so I
   think the game never finishes loading."

10. "The Follow and Code links in the top bar do nothing when I click
    them. Nothing opens, so they must be dead."
