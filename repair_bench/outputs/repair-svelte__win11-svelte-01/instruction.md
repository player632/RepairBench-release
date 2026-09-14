# The browser-based OS shell I maintain is falling apart

I look after a web demo that recreates a familiar modern-OS workspace entirely in the browser: wallpaper, a bottom bar with pinned apps, a start menu, a quick-settings panel, a widgets panel, a calendar flyout, and a set of built-in mini apps (notepad, calculator, a browser, an app store, settings, and friends). It is fully static and everything runs locally. After the last round of changes several things are clearly broken. Can you go through it and fix what's really wrong?

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

What I've noticed:

1. Clicking a pinned app icon on the bottom bar no longer launches the app. Nothing happens — no window ever appears.
2. Dragging the brightness slider in the quick-settings panel down doesn't darken the screen the way it should. The amount of dimming looks unrelated to where the slider is.
3. The close button (the X) on window title bars doesn't close anything. I click it and the app just stays open.
4. The volume slider in the quick-settings panel doesn't update the volume at all — dragging it to the very bottom never flips the bar's speaker icon into the muted variant.
5. The widgets panel no longer loads any news articles. The whole feed area stays empty.
6. Back when the feed still loaded, I also noticed the article timestamps were off: older posts showed absurdly large second counts instead of things like "3 years ago". I expect that will still be broken once the feed comes back.
7. The panel buttons on the bar — search, start, widgets, quick settings — never open their panels anymore. Clicking them does nothing.

A couple of other things people mentioned, though I'm not sure they're real bugs:

8. The built-in calculator looks purely decorative — pressing any key keeps the readout at 0. Shouldn't it actually do math? If that's just how this build ships, leave it as it is.
9. The two small badges at the far right end of the bottom bar look like they should open the project's web pages, but clicking them does nothing. Could you make them actually open their pages?

And pure noise, feel free to ignore:

10. The clock at the right end of the bar shows only hours and minutes, never seconds — that's probably just the intended design.
11. The battery indicator always reads 100% — it's a static demo, so that's fine.

Please fix the real problems so the shell behaves the way it should.


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
