Subject: A few things feel broken in our admin dashboard

Hi, we run this Vue-based admin dashboard internally (the one with the tab strip under the top
bar and the vi-style global search). After the last update some behaviors feel off. Listing them
below - a couple may be my own misunderstanding, so tell me if that is the case.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

1. When I right-click one of the open page tabs and choose the option that closes the tabs to
   its left, sometimes the tab I actually right-clicked disappears as well. I lost my place twice
   this week because of it.

2. There is a refresh button in the top bar. Lately, clicking it makes the whole main area go
   blank and it never comes back - I have to reload the browser to see the page again.

3. The tab strip also has a "close the other tabs" entry in that same right-click menu. For me
   it simply does nothing anymore: I click it and every tab stays exactly where it was.

4. In the user list page (the one with the page numbers at the bottom), I jumped to the last
   page and then changed how many rows are shown per page. I expected to land back on the first
   page, but the grid kept showing rows from somewhere in the middle of the dataset.

5. With the theme left on the "follow the system" default, clicking the theme switch button in
   the top bar does nothing at all - the page stays exactly as light as before.

And two things I am not sure are bugs at all:

6. Right after I clear my browser data, a small hint bubble appears next to the settings button
   in the top bar, telling me where the theme and menu options live. It goes away once I open
   the settings panel. Is that intended onboarding behavior?

7. The account menu in the top-right corner (avatar, with the sign-out entry) opens when I move
   the mouse over the avatar, not when I click it. I half-expected a click. Is hover the
   intended behavior?

For context, everything else seems fine: signing in with the demo account works, the charts on
the home page render, and the slider verification on the sign-in screen behaves normally.


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
