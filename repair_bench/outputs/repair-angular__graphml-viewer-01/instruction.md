# Repair Task - graphml-viewer (Angular 8)

You are working on the source code of **graphml-viewer** (the npm package is
named `abhi-cyto`), an Angular 8 + TypeScript single-page tool for looking at
GraphML files. The landing screen is a full-window panel with an animated dot
field behind it, a title, and a large drop area in the middle that reads
"Drag and drop files here / or / Browse for file / (Graphml)". Two corner links
and a "Download Sample GraphML" affordance sit at the edges of that screen.
You either drag one or more `.graphml` files onto the drop area or pick them
through the file dialog; while the file is being read a full-screen loading
overlay covers the page. Once a graph is taken in, the landing screen is
replaced by the viewer: a graph canvas drawn in the middle, a collapsible
toolbar along one edge, a slide-out side panel full of cards, a search box with
autocomplete, a colour/size/shape picker for nodes and edges, a "hide / show
all / highlight / neighbors" group, a focus group, a layout group (a default
layout, a concentric-by-degree layout, a spring-force layout and a hierarchy
layout), a legend, a table of the graph's elements and connections, and
download buttons for an image, for JSON and for GraphML. There is no router at
all: everything happens on one page and the address bar never changes. The
graph you loaded is parked in browser session storage so that the viewer can
bring it back, and the toolbar can step forward and backward through the files
you handed it.

The project builds with
`NODE_OPTIONS=--openssl-legacy-provider npx ng build --configuration production`
(output in `dist/abhi-cyto`, served from that directory at the site root). The
`NODE_OPTIONS` flag is required - without it the build dies inside the bundler's
hashing step on a modern Node runtime. `node_modules` ships with the workspace.

Environment notes - properties of this offline harness, not defects:

- There is no network access, and the two web-font stylesheets and the
  analytics tag that this project used to fetch at startup have been taken out
  of the page. Nothing in the app depends on them, but one consequence is
  visible: the small round download button in the corner of the landing screen
  used to show a cloud-and-arrow picture and now shows the literal words
  `cloud_download` instead, and any other icon-font glyph degrades the same
  way. That is the harness, not something to repair, and no report below
  refers to it.
- The animated dot field on the landing screen and the graph canvas are both
  drawn bitmaps. Nothing about their pixels, positions or animation phase is
  part of this task.
- This is a desktop layout and the harness uses a 1600x900 viewport.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "When I colour the nodes by one of their properties, a small legend box pops
   up that says which colour means which value. It is supposed to hang around
   for a few seconds so I can read it and then disappear by itself. On this
   build it just flashes - it is there and then it is gone in the same instant,
   fast enough that I can never actually read a single line of it. If I open it
   again it flashes again."

2. "The drop area accepts more than one file and the file dialog lets me select
   a handful at once, which is the whole reason I use this thing - I compare
   several graphs and step between them with the next/previous buttons. Now I
   can select three files and only the very first one is ever taken in; the
   other two quietly vanish and the step buttons have nothing to step to.
   Dropping several files together does the same. One file at a time still
   works, which is why it took me a while to notice."

3. "Graphs I save out of yEd load fine and the picture is right, but every
   per-node property comes through as a meaningless code. Where the file itself
   declares property names - the node's name, what kind of thing it is, and so
   on - the viewer shows me `d0`, `d1`, `d2`, `d3` instead, in the property
   pickers, in the side panel cards and in the element table. Graphs I get from
   other tools, where the properties are written out with their real names,
   show their names correctly, so it is not my data."

4. "I hid a couple of nodes I was not interested in, then opened the table
   that lists the graph's elements to count what was left. The hidden nodes are
   still listed in it. That table used to match what was actually on screen, so
   the row count was the number of things I could see. Now the count is the
   whole graph whether I have hidden part of it or not. Oddly, the connections
   list beside it still matches what I can see, which is what makes the element
   rows so confusing."

5. "Clicking on the big drop panel does nothing at all now. It has a pointer
   cursor and it lights up when I hover a file over it, so it is clearly meant
   to be clickable, and it used to bring up the file dialog. Now I get no
   dialog no matter where on the panel I click. Dragging a file onto it still
   works, so I have a workaround, but I cannot pick a file from a folder any
   more."

6. "In the side panel there is a 'Pack' entry that gathers the separate pieces
   of a graph together - useful when a file contains two or three unconnected
   islands. It only ever made sense after the default layout, because that is
   the one that scatters the islands, and that is when it used to appear. Now
   it is missing exactly then and shows up after every one of the other
   layouts instead, which is backwards."

7. "The drop panel has two looks: a calm one, and a lit-up one with a slight
   wobble that it wears while a file is hovering over it. If I drag a file over
   it and then the drop does not produce anything - wrong kind of file, a
   folder, an empty drop - the panel stays stuck in the lit-up look. The wobble
   and the pale hover colour never go away, so afterwards I cannot tell whether
   I am hovering a file or not. Dragging a file over and then back out again
   without dropping does put it back to normal, so it is specifically the drop
   that leaves it stuck."

8. "Not sure whether this counts as a bug: the dots drifting around behind the
   upload screen look noticeably thinner when my window is small than they do
   on my big monitor. I expected the same number of dots either way. Is that
   meant to scale with the window, or have I got a setting wrong?"

9. "Small one, and maybe I am the only person who ever noticed: the words
   'Browse for file' under the drop panel look like a link - they even have a
   pointing-hand cursor and they wobble when I hover them - but clicking
   straight on those words never opens a file dialog. I have always had to
   click somewhere else on the panel to get the dialog. Is that intentional?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the sample-file download, the loading overlay, the search
autocomplete, the node sizing and colouring pickers, the layout buttons, the
image/JSON/GraphML downloads, the focus and highlight groups and the toolbar
tour that no report mentions. The project must still build with the command
above when you are done.
