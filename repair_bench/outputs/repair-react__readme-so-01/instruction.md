# readme.so — something is off in my README builder

Hi! I run a small drag-and-drop README builder (pick sections, edit their contents, preview the result, download the finished markdown file). After a recent change I can't get it back to how it was, and several things feel broken at once. Could you fix it?

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

What I'm seeing, roughly in the order I noticed it:

1. I can't reorder my sections anymore. I grab the little drag handle next to a section I already picked, pull it up or down the list, let go — and everything snaps back to exactly the same order as before.
2. The page stopped remembering my sections. When I reload the editor page, or come back to it a bit later, the list of sections I had picked comes back empty and I have to add everything again from scratch. It used to keep my list between visits.
3. Whatever I type into the editing area, the preview on the right never changes. It keeps showing the original boilerplate wording no matter what I write.
4. Each picked section has a small reset icon next to it while I'm working on it. I rewrote a section, clicked that icon, confirmed the popup — and my rewritten text is still there, untouched. It's supposed to bring back the default template text.
5. There is a Reset control at the top of the section panel that wipes the whole readme and starts over. I expected it to keep at least the title section afterwards, but the picked list comes back completely empty.
6. The search box above the sections I can still add doesn't narrow anything down. I type a name, and the list still shows every single available section instead of just the matching one.
7. The downloaded README.md comes out with its sections in reverse order — whatever is last in my picked list ends up first in the file.

A couple of things that also bug me, though I'm not sure they matter:

- The copy icon in the plain-text view of the preview looks dead when I click it. I can never tell if anything actually got copied.
- On the front page, the small GitHub icon in the dark footer looks suspicious, like it points somewhere it shouldn't.

Also, the congratulations popup that appears after downloading shows a giant emoji — no idea if that's related to anything, it just surprises me every time.

Everything else seems fine: I can add and remove sections, the popup after downloading does appear, and the front page itself loads. Please make the broken behaviors work the way a user would expect again.


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
