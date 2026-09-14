# repair-vue__arco-design-pro-vue-01

Subject: Our Arco-based admin console misbehaves after the last merge

Hi, we maintain an internal Vue 3 admin console (Arco Design based: top bar,
left side menu, a dashboard home page, and the usual list/form/visualization
pages). After the last merge several things feel off. I am listing what users
complained about - a couple of the reports at the end may not even be real
bugs, so please tell me if those are working as intended.

1. The pages I visit are shown as tags in a strip under the top bar, and
   right-clicking a tag opens a small menu. When I use the entry that closes
   the tags to the LEFT of the one I right-clicked, the strip updates, but the
   main area stays on the page I was looking at - even though that page was
   one of the ones just closed. I expected to land on the tag I had
   right-clicked.

2. On the sign-in screen I leave the "remember password" box ticked. It seems
   to work while I am signed in, but as soon as I sign out and come back to
   the sign-in screen, the account and password fields are empty again.

3. That same right-click menu on the page tags also has an entry for closing
   the tags to the RIGHT. This one feels doubly broken: sometimes the main
   area jumps to a page I did not ask for, and other times tags I wanted to
   keep simply vanish from the strip.

4. In the list page with the search form and the big table, the leftmost
   column shows a running serial number. On the first page it counts 1-20 as
   expected, but when I switch to the second page it starts over at 1 instead
   of continuing.

5. On the dashboard home page there is a "popular content" ranking table (with
   the text/image/video toggle above it). When the page first loads, the table
   is completely empty; only after I click one of the toggle options does
   anything appear.

6. Clicking the notification bell in the top bar no longer opens the
   notification panel. Instead, the language chooser sometimes pops down, and
   the messages never show up.

Two more reports I am not sure are bugs at all:

7. The notification bell in the top bar always carries a small red dot, even
   right after I have read everything in the panel it opens. Should that dot
   ever go away?

8. In the page-tag strip, the very first tag (the home/dashboard one) has no
   little close icon, while every other tag has one. Is that deliberate?

For context, the basics still work: signing in with the demo account is fine,
the side menu navigates, the charts on the analysis pages render, and signing
out returns to the sign-in screen.

Not every defect is necessarily mentioned in the reports. Behaviors you break
while fixing other things still count against you.

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
- The app must work fully offline when you are done: do not reintroduce any
  remote asset, font or endpoint.
