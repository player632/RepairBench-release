# My browser macOS desktop is acting up

I've been working on this macOS-style desktop that runs in the browser — dock at the bottom, menu strip along the top, windows you can open and move around, a few little apps. After the last round of changes a bunch of things feel broken. Can you go through it and fix what's wrong?

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

What I've noticed:

1. When I maximize a window with the green circle, it grows but stops well short of the bottom edge of the screen — there's a huge empty gap underneath, like it only covers the top two thirds.
2. The red circle on a window is supposed to close it, but clicking it does nothing at all. I have to quit apps some other way.
3. Settings don't survive a refresh. I switch on the little camera-cutout notch in the top bar, reload the page, and it's gone again.
4. The menus along the top keep popping open just from me moving the mouse over them — I haven't clicked anything. It's really twitchy.
5. There's a little control panel that opens from the switch near the top-right corner. In it, the notch control never actually turns the notch on, no matter how many times I click it.
6. In the wallpaper picker app, choosing a different wallpaper does nothing — the desktop background stays the same and the app still shows the old wallpaper's name as the selected one.
7. In the calendar app, the back arrow jumps to the *next* month instead of the previous one.

A couple of other things people mentioned, though I'm not sure they're real bugs:

8. The yellow circle on windows doesn't seem to do anything either — a friend told me that's just how this build works, but it feels odd.
9. In the Finder menu up top, the "Show All" entry is greyed out. Maybe it was supposed to be enabled at some point?

And pure noise, feel free to ignore:

10. My friend says the startup chime doesn't sound exactly like a real Mac. It's a browser, so I doubt there's anything to do there.

Please fix the real problems so the desktop behaves the way it should.


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
