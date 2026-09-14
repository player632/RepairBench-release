# Figmaboy — my design tool keeps embarrassing me in front of the team

Hey! I run Figmaboy (the local-first interface design app) purely in the browser on my
laptop, and lately it has been misbehaving in a bunch of different ways. I'm dumping
everything my colleagues and I noticed below, roughly in the order people complained.
Some of it might be related, some of it might not — I honestly can't tell anymore.
Please get it all working again.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

1. The scariest one: the little status label in the top-left corner of the editor is
   basically stuck on "Unsaved". I draw a few rectangles, wait a while, go grab a
   coffee — still "Unsaved". It never flips to "Saved locally" on its own anymore.
   Last week I closed a browser tab without going back through the projects screen
   first and an entire afternoon of work was just gone. Please make the editor save my
   edits by itself again.

2. The layers list on the left side of the editor seems to be upside down. When I put
   a rectangle on the canvas and then draw an ellipse over it, I expect the ellipse
   (the thing that is visually on top) to be at the top of the layers list, but it
   shows up at the bottom instead. New layers keep appearing at the wrong end.

3. On the projects/home screen the "Sort" dropdown is dead. I switch it from
   "Last updated" to "Name" and the list of designs doesn't reorder at all. It used
   to sort alphabetically when I picked Name.

4. The Assets panel (the icon library in the left sidebar) loads forever and then
   shows "No icons found", even when the search box is completely empty. There used
   to be a whole grid of icons I could drop onto the canvas. Searching for something
   specific doesn't help either — always empty.

5. Layer stacking shortcuts are half broken. With a shape selected, pressing
   Ctrl/Cmd + ] ("bring forward" one step) does literally nothing — the shape stays
   exactly where it was in the stack. Oddly, "bring to front" (just ]) and the
   backward versions still seem to work. It's specifically the one-step-forward
   action that is dead.

6. In the Prototype tab of the right-hand properties panel I can't wire up interactions properly anymore.
   I had a frame on the page, drew a second frame a bit later, selected a layer and
   opened the "On click" target dropdown — the second frame simply isn't in the
   list. Only frames that were already there when I opened the file show up. I have
   to close and reopen the whole file every time I add a frame.

7. Presentation mode ("Present", the play button) is broken for clickable
   prototypes. I have two screens, the second one is marked as the flow starting
   point, and on that screen there is a layer with a click interaction that should
   jump to the first screen. When I present, clicking that layer does nothing at
   all — no navigation, no reaction. Because of that I also can't really test the
   Back button in the preview header; the whole back-and-forth flow feels unusable.

Two more things people mentioned, I'm not sure these are even bugs, but have a look:

8. Every time I open a design, the right sidebar lands on the "Codex" tab instead of
   the Design panel. My colleague says that is just how the app starts and I
   should click the Design tab myself, but it feels wrong — shouldn't the design
   tools open by default?

9. The zoom readout in the bottom bar jumps in weird steps: 100% → 125% → 156% →
   195%. A designer I know says multiplicative zoom steps are normal in tools like
   this, but it looks like a rounding bug to me. Is that actually behaving as
   intended?

Ground rules while you work on this:

- Do not run the project's build, dev server, or test commands to check your
  changes; the changes are verified by an external pipeline after you finish. Read
  code and reason statically.
- Keep the app fully offline — it must not start fetching anything from the network.
- Fix the root causes. Don't special-case the exact documents or IDs mentioned here;
  the app has to work for any design file I open.
