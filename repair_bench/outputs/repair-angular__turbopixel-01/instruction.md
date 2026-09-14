# TurboPixel - reports from the weekend photo kiosk

Hello! We run a small photo booth in a community hall and our volunteers use this app
every weekend to turn people's photos into those chunky retro pictures. After the last
update a bunch of things started behaving oddly. I collected what people sent us, more
or less in their own words, and added two notes of my own at the end. Sorry for the mess
- some of it may well be our fault: the kiosk laptop is old, the hall lighting is
terrible, and the wifi drops out whenever the microwave next door is used.

## Report 1 - Marta, kiosk volunteer

The little left arrow beside the name of the current look used to be my favourite
shortcut. When I was already on the very first look of the set and pressed it, the app
jumped round to the last one, so I could cycle backwards through the whole set in a
circle without letting go of the button. Now, when I'm on that first look, pressing it
does nothing at all - the name stays the same however many times I press. The right
arrow still goes all the way round and comes back to the start, so I know it is not me
doing something wrong.

## Report 2 - Dani, hall laptop (that one has no camera plugged in)

On the laptop without a camera, the app shows a small window telling you it could not
reach the camera, with two buttons. Since the update those two buttons do each other's
job. The one that reads "Try again" throws the whole page away and starts it over - I
lose the picture I was working on - and the one that reads "Reload" quietly retries the
camera without refreshing anything. I pressed each of them about ten times, in both
orders, to be sure I was not imagining it. It is exactly backwards from what the words
on them say.

## Report 3 - Marta again

After I close the information window (the one with the author's name, the donation
addresses and the version number in it), the live picture never comes back. The round
shutter button stays greyed out, the waiting circle keeps turning, and the only way to
get the preview running again is to refresh the whole page myself. It used to resume on
its own. Strangely it only happens with that information window: when I take a photo and
close the save window instead, the preview comes straight back, exactly as it should.

## Report 4 - Ivor, first time user

I clicked the button that shows the name of the current look, because I wanted to pick a
different one. A panel slid up from the bottom of the screen and it was completely
empty. Just a blank strip, no looks listed at all. I tried it in two different browsers
and asked a friend to try it on her machine, same thing. Clicking outside the panel does
close it, and the name down the bottom still shows the look I had before, so the app is
clearly alive - the list just is not in there.

## Report 5 - Marta

Something gets left behind every time I save a photo. I take a photo, the save window
opens, I close it, I take another photo, and so on. In the browser's page inspector I can
see an invisible leftover thing attached to the page, and there is one more of them for
every photo I have taken: five photos, five leftovers. Over a long evening the app gets
heavier and heavier and I end up refreshing it between sessions. It never used to pile
up like that.

## Report 6 - Ivor

A whole batch of the looks answer to the same name. Not a blank, and not their own: the
same one. Where the current look is shown at the bottom of the screen there is normally
a small symbol and then the name of the look, and for something like twenty of them the
name is identical whichever of those twenty I pick. It reads like a placeholder somebody
forgot to replace, and it is not the name of any look in the set - I went through the
whole list twice looking for it. The other looks, before and after that batch, are named
perfectly well, each one different, so it is not the display that is broken. My guess is
that one group of looks lost their names somewhere and fell back to a default. I could
not tell you which twenty, because they all look the same in the list, that is the
problem.

## Note A from me - please do NOT "fix" this one

Two visitors complained that the information window still tells people the app collects
anonymous statistics, and they asked us to remove the sentence because on our kiosk no
such traffic ever leaves the machine. I checked with the author's page: that sentence is
the upstream privacy wording, it is meant to be there, and it is accurate for the
published app. Please leave that text exactly as it is. If anything I would rather we
kept it honest.

## Note B from me - also please do NOT "fix" this one

People keep writing in that "the preview dies and a waiting circle appears whenever a
window is open". That is by design. While the information window or the save window is
open the camera is deliberately paused and the waiting circle is deliberately shown, and
everything resumes the moment you close the window. It looks broken if you do not know
it, but it is not broken. Please do not make the live preview keep running behind those
windows, and do not remove the waiting circle from them.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

## A bit of context, in case it helps

The kiosk is a Chromium-based browser on a small touchscreen, window size 1280x800,
nothing extra installed, no extensions. The hall wifi is switched off during events, so
the app has to keep working with the network unplugged - please do not add remote fonts,
analytics or anything else that needs to reach the internet, and do not swap in a
content delivery network for the local assets. The camera on the kiosk is a cheap
webcam; on the laptops without one the app has to keep its "no camera" path usable,
because that is what half our volunteers hit first.

One housekeeping rule: while you work on this, please do not run the project's own build
or test commands. Reason from the source. We will do the building and the checking on
our side afterwards.
