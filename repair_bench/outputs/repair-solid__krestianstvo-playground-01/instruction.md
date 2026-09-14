# Repair Task - Krestianstvo | Playground (Solid JS + vite)

You are working on the source code of the **Krestianstvo | Playground**, a
collection of small collaborative "worlds" built on the Krestianstvo SDK 4 with
Solid JS and bundled by vite. Each world is a page: it creates a session, joins
it to a reflector server so that several visitors can share one virtual clock,
and then renders whatever that world does - a counter, a ticking panel, a 3D
scene, a document, a portal to another world.

The landing page is a documentation page. It introduces the SDK, lists the
worlds with a link and a sentence for each, and carries five embedded video
panels in a row. From there you can reach the demos: a **counter** page with a
name field, a number, a minus button and a plus button, and a green Start
button that turns into a red Stop button while it is running; a **simple** world
that shows one panel with a Tick line, a Count line and a Color line, repainting
and stepping forever on its own; a couple of **demo worlds** that render an info
panel naming the world, its session ID, the reflector address it joined, its
virtual time and its connected clients; and a **settings** page with a reflector
address field, an Update button beside it, and a DEV mode switch underneath.

Underneath all of that, the same handful of small helpers do the everyday work:
parsing a colour written as a hex string into its three channels, formatting
those channels back out as a colour string with a transparency the caller
supplies, drawing a random colour from a sixteen-symbol alphabet, choosing one
of six geometry names for a 3D costume, and building the shared class strings
that every button in the app wears - a green one, a red one, a small one and a
grey one. The settings page keeps its two values in the browser's own local
storage and reads them back on the next visit.

The project builds with the package manager's own build script and the verifier
serves the resulting static output from the site root, with the usual
single-page fallback for deep links. Dependencies are provisioned offline by the
harness, and the app makes no network request of any kind at runtime.

Environment notes - properties of this offline harness, not defects:

- There is no network access, and no reflector server is running. A world that
  could not reach a reflector would simply never do anything: its virtual clock
  only advances on a message, and an action only runs when it comes back as a
  message. So the harness answers the connection in the page itself, with a
  same-origin loopback that never opens a real socket. The application's own
  code path is preserved verbatim - the client still asks for a connection,
  still sends messages and still receives them - and the only change is who
  answers. That is a property of the test environment, not something to undo.
- The five video panels on the landing page used to point at a video host on the
  public internet. A hosted video cannot be shipped inside an offline tree, so
  each panel now points at an inert same-origin document instead: the panel
  count, every attribute and the identity of each individual panel are kept, and
  the panels simply show nothing. Blank panels on the landing page are the
  harness, not a defect.
- Where a graded reading depends on a random draw, the harness supplies the draw
  itself as a fixed test input through the reading surface, so the value you get
  is stable rather than a coin flip. The application's own sources of randomness
  are untouched, and nothing you are asked about depends on a real coin flip.
- The harness drives the app in a real browser at a **1440x900 viewport**, and
  every checkpoint starts from a fresh browser context, so state left over from
  an earlier interaction never carries into the next one. The app itself
  persists exactly one entry in local storage - its own two settings - and
  nothing else: no cookies, no session data, no URL state.
- The harness publishes a read-only measurement surface on the window, and it
  traps page errors, unhandled rejections and console errors from the moment it
  installs, so a boot failure shows up as a number rather than as a silently
  blank page.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different module than
  the one the symptom appears in, and a single reported symptom can have more
  than one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is described in these reports. Behaviors you break while
  fixing other things still count against you.
- Do not remove, rename or repurpose anything the harness added - the loopback
  that answers the connection, the inert panel documents, or the reading surface
  published on the window. They are verification probes required by the checker.

The reports, in no particular order:

1. "The green buttons have gone ugly. On the counter page the Start button used
   to be a pale green button with a pale green outline that matched it - now the
   outline is a much darker green, so it looks like the button is wearing a
   heavy border. The background colour, the rounding and the padding are all
   still exactly what they were, it is only the outline that is wrong. The red
   Stop button and the small green buttons look fine, which is the odd part."

2. "On the counter page the minus button is green now. It used to be the same
   plain grey as the plus button - they are the two halves of one little stepper
   and they always matched. Now the minus one is a green button and the plus one
   is still grey, so the row looks lopsided. Clicking either one still changes
   the number by one, so it is only how they look."

3. "The counter page lost its Start button. Where the green Start button used to
   be there is now just the words `Not Found` sitting on the page. Everything
   else about the counter is fine - the name field, the number, the minus and
   plus buttons all still work. I cannot start it ticking any more."

4. "The settings page does not save. I type a new reflector address into the
   field, press Update, and the address I typed never takes effect - go back to
   the page later and it is the old one again. And something stranger happens at
   the same time: the DEV mode switch below ends up switched on, although I
   never touched it. It was off before I pressed Update."

5. "On the demo worlds the info panel has lost the name of the world. The
   `World:` line used to say which world I was in - a short readable name. Now
   it shows the same long machine-looking string as the `ID:` line right below
   it, so the two lines are identical. The rest of the panel is fine: the
   reflector address, the virtual time and the client list are all still there."

6. "In the simple world the Count line runs away from the Tick line. They used
   to climb together, one for one, and stayed level with each other however long
   I left it. Now after a few seconds Count is about double Tick and the gap
   keeps widening. The panel is still ticking and still repainting, so the world
   has not stopped - the two numbers just do not agree any more."

7. "This might be me misreading the app, but: in the simple world the colour of
   the panel keeps changing by itself, and the numbers keep going up, even when
   I do nothing at all and there is nobody else connected. Is it supposed to be
   alive like that on its own, or has something started driving it?"

8. "The five video panels across the top of the front page are blank. Each one
   is an empty box where a video should be, and nothing plays. The rest of the
   front page - the text, the links, the list of worlds - renders normally."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the landing page and its world list, the counter demo and its name
field, the simple world's self-renewing panel, the demo worlds' info panel and
share link, the settings store and how it persists, and the shared colour,
geometry and button-styling helpers, none of which any single report describes
in full. The project must still build with the command above when you are done.
