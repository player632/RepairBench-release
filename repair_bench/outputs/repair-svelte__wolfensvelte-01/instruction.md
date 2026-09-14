# My browser Wolfenstein-style shooter is falling apart

I've been working on this retro Wolfenstein-style shooter that runs entirely in the browser — CSS-drawn corridors, a status bar with the face of the guy you're playing as, doors, pickups, the works. After the last round of changes a bunch of things feel broken. Can you go through it and fix what's wrong?

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

What I've noticed:

1. Movement feels sluggish. Walking and turning both take roughly twice as long to cover the same ground as in the old footage I have — like the whole game is running through mud.
2. When I fire the pistol, the ammo counter *gains* a round instead of spending one. I start with 8, shoot once, and it reads 9.
3. The face on the status bar is supposed to look healthy when I'm at full health, but it already looks beaten up right from the start.
4. The start button on the title screen drops me into the *second* mission instead of the first one.
5. The door right in front of the starting room won't open. I walk up to it, press the use key, and nothing happens — I'm stuck in the room.
6. When I walk, the whole corridor view drifts the wrong way — instead of the scenery sliding past as I move forward, it feels like the level is being dragged along with me, backwards.
7. Whenever I take a hit, the entire view flashes for a split second, as if the whole scene is being torn down and rebuilt. It's really jarring.

A couple of other things people mentioned, though I'm not sure they're real bugs:

8. There's a stray letter floating in the starting room, right in the middle of the floor. Looks like leftover debug junk. My friend says I should just remove it, but I don't want to touch anything I don't have to.
9. The knife doesn't consume any ammo when I swing it — is that supposed to be like that? It feels odd, but maybe blades just don't use rounds.

And pure noise, feel free to ignore:

10. Music and sound only start after you click through the "allow audio" notice — apparently that's just how browsers do audio these days.
11. The face on the status bar occasionally shifts between a few slightly different frames even when nothing happens. Someone said that's an intentional idle animation.

Please fix the real problems so the game behaves the way it should.


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
