# Repair Task - jspaint (Vanilla JS + jQuery)

You are working on the source code of **jspaint**, a browser-based clone of MS
Paint written in vanilla JavaScript with jQuery and the os-gui windowing
library. The project lives in this workspace; it is a purely static app - open
`index.html` (or serve the folder) and it runs, no bundler or build step is
involved. The canvas itself is a plain `<canvas>`; most of what surrounds it
(toolbox, color box, menus, dialogs, status bar) is DOM you can inspect.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "The status bar at the bottom is acting weird. When I hover over one of
   the tools in the toolbox and then move the mouse away onto the drawing
   area, the normal hint text comes back for a split second - but then the
   tool description pops back in and stays there, even though I am long gone
   from the toolbox. It is always the description of whatever tool I hovered
   last."

2. "After I switch between tools a few times, the options panel under the
   toolbox goes dead. For example: I pick the brush, switch to the pencil,
   switch back to the brush, and now clicking the brush shape/size choices
   does nothing anymore - the selection just does not move. Reloading the
   page makes it work again, until I switch tools a few times again."

3. "Redo is broken. I draw something, press Ctrl+Z to undo it - that part
   works, the drawing goes away. But then Ctrl+Y / Redo does absolutely
   nothing, the drawing never comes back. Undo itself seems fine, it is only
   Redo that is dead."

4. "When I have a selection active (for example after Select All) and I
   click on the empty gray workspace around the canvas, the selection is not
   dismissed. In the original Paint, clicking the empty area drops the
   selection. Here it just stays, and I have to press Escape or use a menu to
   get rid of it."

5. "Every time I switch the color scheme under Extras > Themes (for example to
   Classic Dark and back), the color palette doubles itself - suddenly there
   are two copies of every swatch in the color box. Switching the scheme
   again doubles it again. It keeps growing."

6. "Double-clicking a color swatch in the palette should open the Edit
   Colors window, like it does in Paint. Here, double-clicking a swatch does
   nothing at all - the window never shows up. Single-clicking to pick a
   color still works."

7. "One more thing: whenever I press Redo while there is nothing to redo,
   the app pops up some dialog about branches of a history tree. It looks
   like an error message. Please make it stop showing up - Redo with nothing
   to redo should just do nothing silently."

8. "I think the app is losing my work. Every time I open it, I get a
   completely blank white canvas instead of the picture I was working on.
   That is data loss - the app should really remember my previous drawing."
