# Repair Task - Idle Space (Angular 7 + Clarity incremental game)

You are working on the source code of **Idle Space**, a browser incremental /
idle game written in TypeScript on Angular 7 with the Clarity design system.
The player runs a small space economy: metal, crystal, energy, alloy and
Habitable Space are produced by drones, technicians and foundries, every
production building has a storage cap and an operativity percentage, and the
whole economy is recomputed several times a second from a graph of producer and
consumer edges. Around that model sit a research queue, a shipyard, an enemy and
battle layer, a prestige layer, a set of dark-matter time warps that advance the
simulation by a fixed amount per unit spent, automators, an options screen and a
save system that compresses the game and writes it into the browser's local
storage. Numbers are arbitrary-precision decimals, so quantities are objects
with comparison and arithmetic methods rather than plain JavaScript numbers.

Unlike a plain static page, this project **does have a real build step**: it is
an Angular workspace, the dependencies are already installed in the tree, and
the production build writes a static bundle that is then served. The routing is
hash-based, so every screen is reachable from the served index page by changing
the fragment after the `#`, and a full page reload always comes back to the same
place. There is no backend and no database; the only persistence in the whole
application is the browser's local storage.

There is **no network access in this environment**, and that is expected - it is
not a defect and you should not try to fix it. Three consequences are worth
knowing up front, because they are environment changes rather than bugs:

- The game's cloud-save path - logging in through the Kongregate portal,
  submitting high scores and stats, and the PlayFab account flow behind it - is
  not available here. Those features are unreachable in this environment by
  design; nothing you are asked to repair lives on that path, and a report that
  seems to point at cloud saves is pointing at the environment, not at the code.
- The page's analytics tag has been removed. Nothing in the interface depends on
  it and no behaviour changes because of it.
- One small third-party DOM helper library that the page used to fetch from a
  public CDN is now served from a local copy inside the project, because the
  page's own scroll-locking helper calls into it on several screens. It is
  byte-for-byte the same library, just local.

The interesting state is the live game object the application builds at start-up
and keeps in memory: the resource model with its quantities, rates, caps and
operativity values, the research queue, the options record, the dark-matter warp
actions, and the flags that gate which navigation entries and material tabs are
rendered. Almost everything a report describes is visible both in that model and
in the rendered page, and the two are supposed to agree.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different module, a
  different layer (model vs. formatting pipe vs. options store vs. component) or
  a different code path than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- One reported symptom can hide behind another: until the hiding defect is
  repaired, the hidden one may be impossible to reproduce at all.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "Every storage cap doubled on me. Before I have built a single mine, the
   Mining Drone page says `/20` - it used to say `/10`. The Crystal Drone, the
   Technician and the Foundry Drone all did the same thing at the same time, and
   they all hold twice what they should. Energy and the missile storage look
   normal, so it is not everything."

2. "My crystal income does not match the guide. With one Crystal Drone running,
   the material strip along the top says `0.75/s` for crystal. Every write-up I
   have read says one drone yields 0.7 per second. Metal reads `1.00/s` and
   energy reads `4.00/s`, and both of those are right, so it is only crystal
   that is off."

3. "I cannot get into the Laboratory. The game says five Mining Drones and five
   Crystal Drones unlock it. I am sitting on exactly five of each - I bought the
   fifth one on both sides and nothing happened at all, no Laboratory entry in
   the top bar, no new material tab. If I then buy a *sixth* Mining Drone the
   Laboratory appears instantly. So the requirement is clearly met, it just does
   not fire when it should."

4. "Zeros are printed with a minus sign all over the interface now. The little
   `(0)` counters next to the buy buttons read `(-0)`, and anywhere a rate or a
   price is exactly zero I get `-0` or `-0.00`. Genuinely negative numbers still
   look completely fine, which is what confuses me - I went looking for broken
   negative handling and found none."

5. "The dark theme keeps coming back. I switch to the light theme in Options,
   save the game, reload the tab, and the whole interface is dark again. It is
   only the theme: my number format, the header style and the autosave
   notification all come back exactly as I set them. Every reload does it."

6. "Something is wrong with the operativity sliders after a reload. I dragged
   the Mining Drone down to 40%, saved, came back, and the resource page now
   reads `Operativity: 0.4 %` and the drone produces almost nothing - about a
   hundredth of what it made before. The resources I never touched are still at
   100%, and if I drag the slider again in the same session it behaves, so it is
   specifically what comes back out of a save."

7. "The 'hide refund actions' option is backwards. With it switched OFF the
   Refund buttons disappear from the Energy page, and when I switch it ON they
   come back. It is supposed to be the other way round. It also looks like the
   buttons are really gone rather than just hidden - the Energy page lists one
   action instead of two."

8. "Pausing the game does not actually pause anything. I click the pause button
   in the top bar, the icon changes to a play triangle, but the screen keeps
   updating - the material strip still shows my rates, the sidebar still
   redraws, everything is still clickable. Only the icon changed. Is the pause
   button purely cosmetic?"

9. "Half the top navigation is missing on a brand new save. I only see Home,
   Info, Options and the pause button - no Laboratory, no Shipyard, no Battle,
   no Worlds, no Automators, no Dark Matter, no Prestige. The material list only
   has three tabs and there is no naval capacity chip either. Did this build
   ship with those screens stripped out?"

Reproducing notes, offered without diagnosis: the simulation ticks several times
a second, so a quantity that production is actively moving is a poor thing to
compare against - prefer reading a discrete piece of state immediately after a
deliberate, repeatable action, and the pause button in the top bar is a
legitimate way to hold the economy still while you look at it. Saving is
asynchronous: the game is compressed in the background before it reaches local
storage, so a save is not instant, and the autosave only fires every few
minutes - a freshly loaded page with no interaction has no save at all. Because
the routing is hash-based you can jump straight to any screen, and some screens
only initialise their own state the first time you visit them, so the order you
visit screens in can matter. The congratulations dialog that pops up when a new
area unlocks has an acknowledgement button and can be dismissed.
