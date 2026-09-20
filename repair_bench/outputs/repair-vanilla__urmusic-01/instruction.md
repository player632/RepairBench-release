Repair task: a browser music visualiser that paints one full-window picture from a track


What you have is a single-page music visualiser, shipped as plain browser
JavaScript. There is no framework, no bundler, no transpiler, no type step
and no dependency directory anywhere in the tree. One document at the root
of the tree loads 2 of the page's own script files, 1 third-party library
that ships inside the tree and 2 small stand-in files the harness put there,
in the order the document declares them, and it links two stylesheets. The
page runs entirely out of the globals those scripts leave behind, and the
tree is served straight off the disk: the directory that is served is the
source directory, nothing is compiled first and nothing is fetched from
anywhere else, so the files you read are the files that run.

The whole picture is painted onto one canvas that fills the window, underneath the
page's furniture. You give the page a track - either by dragging an audio file onto
it or by pasting a track address into the little menu that opens from the icon in
the top right corner - and what gets painted is drawn from the sound: the loudness
of the low and the high end, the shape of the spectrum, the shape of the wave, or a
picture or a line of text that rides along with them.

Nothing is fetched from anywhere while the page is being examined, and the tree
carries no audio of its own, so there is no track you can actually start playing.
The page still runs regardless. It boots, it paints, it reacts to its own controls,
and it paints from silence: with no track in, every reading from the sound is zero
and the picture is whatever the settings it loaded with make of that. A panel in
the middle of the screen tells you to drag a song in, and that is exactly the state
the page is in when it is examined.

The settings live in a panel down one side. At the top of it is a preset menu: a
box for a name, an open control, a save control, and the list of presets. Below
that the page's own controls are arranged in four groups - a short list of settings
for the picture as a whole, a row of tabs with one tab per layer plus a control to
add another, the settings belonging to the layer whose tab is selected, and a group
of advanced settings at the bottom.

The picture itself is built out of layers. Every layer has a type - one of four:
a spectrum layer, a layer that draws the wave itself, a layer that draws a picture,
or a layer that draws text - and each type has its own set of controls, so the list
you see for a layer depends on what kind of layer it is. A layer can be moved,
copied, renamed and removed from the tab row, and the whole set of layers belongs
to a preset.

Almost every control takes either a plain number or a short expression in the
page's own little expression language. That language has a fixed vocabulary - some
arithmetic, a couple of constants, a handful of live readings taken from the sound,
and the title of the track - and a value written in it is worked out again whenever
the picture is next painted, which is how a preset can make a layer drift, jitter or
breathe along with the music.

Seven presets ship with the page. When the page opens it picks one of the
seven at random, so the picture you get, the number of layers, and the
contents of the settings lists are not the same on every load. That is
shipped behaviour and it is listed below among the things that are not
faults. Where a check needs to know what the page is showing, it first asks
the page for one particular preset by name and waits for the panel to
settle.

Along the bottom of the screen there is a bar carrying the name of the app and the
version, a link to the project's own wiki, a button that offers to record a video,
and a slot where a donation widget would go. Sitting above that bar is the player:
a progress slider with a small dot on it, the elapsed time and the total time either
side of it, two icons that between them show whether it is playing or paused, and a
volume slider with a dot of its own and an icon beside it. One key on the keyboard
hides the whole interface so the picture can be watched full screen, and the same
key brings it back; the panels fade out and in rather than snapping.

The loudness the page starts at is kept in the browser's own storage and read back
the next time the page opens; with nothing stored, the level the tree ships with is
the one in force, and that is the level the volume slider shows.

The page is examined at a 1280x720 window with the en-US locale, and every check
starts from a freshly loaded page in a fresh browser context, so nothing - not a
preset, not a layer, not a stored volume, not a half-finished transition - carries
over from one check into the next.

## What visitors reported

9 reports came in. They are quoted as their authors wrote them. They are
starting points, not diagnoses: they are not always precise, they do not always
say which of several similar things is affected, and they do not always agree
with each other.

1. The picture is on top of everything now. The visualiser paints straight over
  the menus - I open the settings and the panel is there, but the shapes are
  drawn over it, and the same thing happens to the bar along the bottom. It is
  like that from the moment the page loads, with any track and any preset I
  try. It used to sit behind all the interface so the menus were always
  readable and clickable. The drawing itself still looks right, it is only in
  front of things it should be behind.

2. The key that hides the interface has stopped doing anything. I press F1 to
  get the menus out of the way and watch the picture full screen, and nothing
  happens at all - everything stays exactly where it was, fully solid, and it
  still takes my clicks. I press it again and again and it is the same. It
  used to fade the panels away and then bring them back on the next press. I
  have reloaded the page and tried it straight after loading, and the key
  simply has no effect now.

3. When I open the settings panel it comes up as a thin little strip. It used
  to fill most of the height of the window so I could see the whole list of
  controls at once; now it is a narrow band, maybe a tenth of the screen, and
  everything is crammed into it - I have to scroll inside that band to reach
  anything at all. The width looks normal, and it still opens and closes the
  same way, it is only how tall it is. I get the same thin band whatever
  window size I use.

4. There is a row of extra things across the top of the page that I have never
  seen before. It looks like a choose-file button and a little empty media
  player sitting above the picture, and they are there from the moment the
  page loads. Clicking them does nothing useful and they were definitely not
  there the last time I used this page. Is that some kind of toolbar somebody
  left switched on? It does not go away whatever I do.

5. The picture has collapsed over to one side. Instead of spreading out across
  the screen the way it always did, everything is drawn as a thin vertical
  line jammed up against the left edge, and it never moves out from there. It
  is like that from the very first frame, with the settings it loads with and
  with every preset I tried, and with any track. The colours, the thickness
  and the way it reacts to the music all still look right - it is only the
  shape, which does not stretch sideways any more.

6. The volume slider is almost empty when the page loads. The little dot sits
  right over at the left, about a tenth of the way along, but the actual
  loudness is the normal level it always was - so the slider and the sound
  disagree. If I grab the dot and drag it, it follows my mouse perfectly from
  then on and everything behaves; it is only where it starts out that is
  wrong. It is the same on every reload, and the progress bar next to it looks
  fine.

7. The name it gives the track before I have loaded anything has changed. It
  always used to read "Silence" there, which I liked - nothing is playing, so
  it called the silence by its name. Now it reads "Untitled" from the very
  first moment the page is open, on every reload, before I have touched
  anything at all. Once I actually put a track in, the real title comes up
  correctly and everything after that is fine, so it is only the name it
  starts out with. I noticed it because a friend of mine pointed at the screen
  and asked why it said that.

8. There is a warning box across the top of the page telling me to go and use a
  different browser, with a heading and a paragraph about drag and drop, and a
  little cross in the corner of it. I am quite happy with the browser I use
  and I did not ask for it. It is there every single time I load the page.
  Should that be there? It reads like nagging the developers forgot to take
  out.

9. One of the buttons along the bottom says it will record a video and then
  says in brackets that there is no support, and it is greyed out. I clicked
  it several times and nothing happens at all - no recording, no file, no
  message, not even an error. Either it ought to work or it ought not to be
  sitting there. Is this something half finished that got shipped by mistake?

## Not every defect is described in these reports

Not every defect is necessarily mentioned in the reports. Behaviors you break while
fixing other things still count against you.

There are more things wrong with this tree than there are reports above, and some of
the reports above describe things that are not wrong at all. Fixing only what is
listed will not finish the job. Read the page's own logic through, work out what it
is supposed to do, and check the parts nobody wrote in about - what becomes of a
number that is meant to be kept inside a range, and in particular whether a number
that is already inside that range comes back out of it unchanged; whether every word
in the expression vocabulary really delivers what its name promises, including the
one that stands for a ratio everybody knows; what the list of a layer's controls
does when you change what kind of layer that layer is, and whether the list follows
the type or stays behind with the type you left; what the player says about itself
before anything has ever been played, and whether the two icons agree with it; and
what a track does when it runs all the way to its end. Each of those is measured,
whether or not anybody reported it.

2 of the 9 reports above are not faults. Each is described, with what the
behaviour actually is, in the next section. Changing any of those 2
behaviours to answer its report counts against you.

## Things that are not faults

11 things in this tree look as though they might be wrong and are not. They
are listed here so that nobody wastes a repair on them, and so that nobody
is tempted to change one in order to make a symptom go away.

1. There is a box across the top of the page telling you that the app works
   better in one particular browser, with a heading, a paragraph about dragging
   songs in, and a little cross in the corner of it. That is shipped content:
   the heading, the wording and the cross are all the page's own, the cross
   hides the box with a handler of its own, and nothing outside the tree is
   fetched while the box is on screen. It is not an injected advertisement, it
   is not debug output, and it is not a fault. Do not remove it, do not blank
   it, do not rewrite its wording, and do not stop the cross from working.
2. One of the buttons along the bottom offers to record a video and then says
   in brackets that there is no support for it, and it is greyed out. Clicking
   it does nothing at all. That is shipped too: the call that would start a
   recording is commented out in the page's own source, and the download link
   beside it has no target until the page gives it one. Neither is
   half-finished work you are being asked to complete and neither is a fault.
   Do not wire the button up, do not enable it, do not remove it, do not change
   its wording, and do not give the download link a target.
3. Two references in the tree used to point at machines outside it: the script
   of the streaming service the page can take a track address from, and the
   script of the donation widget whose slot sits at the right-hand end of the
   bottom bar. They now point at 2 small inert files that the harness ships
   inside the tree, and both files do nothing at all beyond existing so that
   the page's own start-up does not fall over. That is why the donation slot
   stays empty and why pasting a track address cannot fetch anything. All of it
   is the harness, not a fault. Do not restore the outside references, do not
   delete the 2 inert files, do not give them any behaviour, and do not treat
   the empty slot as something to fill.
4. 4 files that the tree used to carry have been retired by the harness: 3 of
   them were compressed release copies of the page's own scripts and
   stylesheets, and 1 was a stylesheet the entry document had already stopped
   linking. The entry document now loads the page's own uncompressed sources
   directly - which is what a comment in the entry document itself recommends
   to anybody who wants to hack on it - so the code that runs is the code you
   read. The compressed copies were the same code, so nothing about the page's
   behaviour changed; they are gone because leaving a second, unmutated
   duplicate of everything in the tree would have handed you the answers. That
   retirement is part of the harness. Do not restore any of those files, do not
   re-bundle or re-compress the sources, and do not concatenate them.
5. Two third-party libraries ship inside the tree as they are: the small
   library that draws the spinner shown while a file is being read in, and the
   stylesheet of the icon font that supplies every little glyph on the page.
   Neither is part of the examined surface and neither is faulty. Do not edit
   them, do not replace them with newer copies, do not strip them down, and do
   not remove them because you think the page no longer needs them.
6. The player's appearance does not come from a file. One of the page's own
   scripts writes a block of styles into the document when it builds the
   player, and that block is where the two icons get their orientation, where
   the sliders get their dimensions and where the time labels get their layout.
   There is also a stylesheet in the tree that the entry document does not link
   at all and has not linked since before you were handed it. Both of those are
   shipped facts. Do not link the unlinked stylesheet, do not move the injected
   styles into a file, do not restate them anywhere else, and do not treat
   either arrangement as a fault.
7. When the page opens it picks one of its seven shipped presets at random, so
   the picture, the number of layers and the contents of the settings lists
   differ from one load to the next. That is shipped behaviour. Do not pin the
   choice, do not make it deterministic, do not remove or reorder presets, do
   not change what any preset contains, and do not treat a picture that differs
   between two loads as a symptom.
8. Everything painted on the canvas is painted from scratch by the page's own
   drawing cycle, and the painting itself is not faulty. Where a report says
   something goes the wrong way, or lands in the wrong place, or comes out at
   the wrong size, or never arrives at all, the code that decides the
   direction, the position, the size or the timing is wrong and the painting is
   fine. Do not redraw, re-order, re-scale or replace any colour, thickness,
   geometry constant, layer count, label or preset in order to make a symptom
   go away.
9. The loudness the page starts at is written into the browser's own storage
   and read back when the page next opens, and the page falls back to its own
   shipped level when nothing is stored. Both the keeping and the fallback are
   its own doing and both are meant to be there. Do not add any other storage
   of any kind, do not add a preferences or configuration layer, do not put
   anything in the address bar, and do not clear, rewrite or relocate what the
   page already reads.
10. The rules of the visualiser are the rules of the visualiser: four kinds of
   layer with the set of controls that belongs to each, a fixed expression
   vocabulary in which each word is fed its value by position, seven presets
   and what each of them contains, the level and the colours the page starts
   with, the two ends of the frequency range the advanced settings offer, and
   the one key that hides the interface. None of those is a fault and none of
   them is a knob. Do not change a rule in order to make a symptom disappear.
11. There is no track in the tree and nothing is fetched from anywhere, so the
   page cannot be made to play anything while it is being examined. That
   absence is a property of the tree you were handed; it is not something your
   repair caused and it is not one of the things to repair. Do not add an audio
   file, do not synthesise a track in code so that the picture has something to
   move to, do not add a remote reference of any kind, and do not treat a
   picture painted from silence as a symptom.
## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one.
  They carry no behaviour; they are how the page is addressed while it is being
  examined, and they must survive your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it needs is
  already inside the tree. Do not add a remote reference of any kind, do not assume
  anything can be downloaded, and do not reintroduce a library, a font, an icon set,
  a streaming service, a donation widget or an analytics beacon from outside.
- Repair the behaviour a visitor experiences. Do not special-case the examination, do
  not add flags, hidden state or a hard-coded test-identifier branch, do not write
  anything into the browser's storage that the page does not already write, and do not
  leave anything on the global scope that was not there before.
- Do not delete shipped content, artwork, wording, panels, buttons or libraries to make a
  symptom go away, and do not reorder or rebuild a region unless the report you are
  answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the page must
  still load and run exactly as it does now: no build step, no new dependency, no
  network access, and the same document reachable at the same address.
- While you are answering, do not run this project's own test, build or serve commands
  and do not start a browser of your own to check yourself. The grading harness
  measures the page for you, and a fix that only holds up under your own private way of
  running it is not a fix.
