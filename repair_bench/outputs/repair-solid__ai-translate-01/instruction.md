# Repair Task - a clipboard-watching translation window

You are working on the source of a small desktop translation window. It sits on
top of the clipboard: copy a line of text in any other window and the line
appears in this one, and every translation engine you have switched on gets its
own column with that engine's own answer underneath. It is a reactive front-end
written in JSX-flavoured TypeScript and compiled from source by its own local
toolchain. There is no server, no database and no router: the window has exactly
two faces - the columns face and the settings face - and everything it knows
(which engines are on and in which order, the target language, whether answers
are cached, an optional socket address) is handed to it at start-up by the host
it runs inside and handed back through the same host when you save.

What the two faces show, in the words a user would use:

- the **columns face**: one column per enabled engine, laid out in the order the
  engines were saved in, each carrying a label that names the engine and its
  family, a box with that engine's answer, a per-column re-run affordance and a
  drag handle for re-ordering. The leading column also carries the line you
  copied, and every column starts on the app's own "waiting for text" copy.
- a **floating pair of buttons** in the top-right corner, revealed when the
  pointer reaches the top of the window: re-translate every column, and open the
  settings face.
- a **correction affordance** on each column: an edit button turns the answer box
  into an editable box and offers accept and discard, so a wrong answer can be
  corrected by hand and the correction can be kept or thrown away.
- the **settings face**: the target language (a text box with a suggestion list
  beside it), a caching switch, an optional socket-server address with its own
  Open button, a Save button, a button that opens the config folder, and the
  eight engine families - each one expandable to its own models, with a tick box
  per model and, for the families that need one, a key field.
- a **loading placeholder** that stands in for the columns until the config
  arrives from the host.

Runtime facts about how this task is verified:

- The tree is compiled from source and the compiled output is what gets served,
  over a local static server, with **no network access**. Dependencies are
  restored from a local archive rather than fetched, so the build has to keep
  working when you are done. The project's own build script type-checks the whole
  tree before it bundles, so a type error is a failed build.
- Because nothing may leave the machine, both the host this desktop window
  normally talks to (clipboard, window title, config, cache) and every engine
  endpoint are answered by a **local stand-in that ships inside the tree**. The
  stand-in is deterministic and it does not translate anything: it hands back the
  line you copied with the engine's own tag in front of it, and the one streaming
  engine's answer is assembled from three fixed frames.
- The harness drives the compiled page in a real browser at a **1280x720
  viewport**, and "copying a line" means handing that line to the stand-in the
  way the host would.
- Every checkpoint starts from a fresh browser context, so a language you typed,
  an engine you ticked, a column you corrected or an answer that got cached never
  carries into the next checkpoint.
- The clipboard is polled rather than pushed, so a copied line reaches the
  columns a moment after it is handed over; checkpoints wait for it. That is the
  shipped behaviour, not a defect.

Four known quirks of the shipped tree are **not** defects and are not asked
about:

- a copied line is passed on **whole** - the only things ever removed are a
  leading full-width space and any line breaks inside the line, so noise around
  the line stays in the text, in the request and in the cached entry;
- a line copied while this window itself is in front is **ignored** on purpose:
  the app never translates its own clipboard;
- the system half of the streaming engine's request is assembled **once**, when
  that module is first evaluated, so it keeps the language the window booted with
  even after the target language is changed; the instruction half of the same
  request does follow the new language;
- on the settings face the caching switch always **renders** ticked, the target
  language really is a text box with a suggestion list rather than a dropdown,
  and only some engine families ask for a key.

Leave all four alone.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different part of the
  window than the place the symptom shows up, and a single reported symptom can
  have more than one root cause behind it.
- At least one report describes behaviour that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviours you break
  while fixing other things still count against you.
  并非所有缺陷都有报告提及；修别的问题时弄坏的行为同样会扣分。
- Do not remove, rename or repurpose any data-testid attributes - they are
  verification probes required by the checker.

The reports, in no particular order:

1. "The translation columns come up in the wrong order. I keep my engines in the
   order I put them in, and this build shows them the other way round - the one I
   added last is first. All three of mine are still there, they are just back to
   front."

2. "The answers from the free engine come back with a weird label glued in front
   of them, and the label is the language name I picked in settings rather than
   anything the engine should be showing me. It looks like the answer text is
   being decorated somewhere. The other columns do not do it."

3. "When I copy something that spans two lines, the translation comes back wrong
   - the engines seem to be given the line break as well, and the answer is not
   the single line I expected. Single-line copies are fine, it is only the
   two-line ones."

4. "The 're-translate everything' button in the corner does nothing. I hover over
   the top of the window, the two buttons appear, I click the refresh one and none
   of the columns re-run - they keep whatever they showed. The button itself
   looks fine and clicks normally, and the other one still opens settings."

5. "I cannot switch on any of the built-in free engines. In settings I open the
   family that needs no key, tick one of its engines, press Save - and the main
   window still shows the settings page, no column ever appears. The tick box even
   springs back off by itself. The families that do ask for a key still work when
   I paste a key in."

6. "Changing the target language does nothing. I type another language into the
   box in settings - the box even keeps showing what I typed - but the answers
   still come out in the old language, and after I leave and come back the setting
   is the old one again."

7. "My hand corrections are lost. When an answer is wrong I edit the column and
   press the tick; the column shows my correction, so it looks accepted, but the
   next time the same line comes up the cache still hands back the old machine
   text - my edit never made it into the cache."

8. "Is the translation service broken? Every answer looks like my own words
   handed straight back at me with a tag in front of them, and the one streaming
   engine returns a chopped-up greeting with the line break missing out of the
   middle of it. Also, is anything actually going out to the network? I would
   rather it did not."

9. "The settings page looks broken. The caching switch is ticked every time I
   open it, whatever I saved. The target language is a plain text box with a list
   of suggestions under it instead of a proper dropdown, so I can type anything I
   like into it. And only some of the engine families ask me for a key - the
   others have no field at all. Did this page ever get finished?"

Reports 8 and 9 describe this build working as designed, not defects. Nothing may
leave the machine here, so every engine is answered by the local stand-in that
ships inside the tree: it echoes the line you copied with the engine's own tag in
front of it, and the streaming engine's answer really is assembled from three
fixed frames whose line break the app's own post-processing removes - which is
exactly what a visitor with no network should see, and report 8's own wish (that
nothing go out to the network) is already true. On the settings face, the caching
switch really does render ticked whatever is stored (flipping it still writes),
the target language really is a text box with a suggestion list rather than a
dropdown, and the families that need no key really have no key field. Wiring the
engines back to remote hosts, replacing the stand-in with a real translator,
turning the language box into a dropdown or making the caching switch render the
stored value would all break the offline contract this task is verified under.
Leave them alone.

Work in the source tree, repair the root cause of each real defect, and leave the
intended behaviour alone - the local stand-in and its deterministic answers, the
whole-line clipboard handling, the own-window guard, the frozen system half of the
streaming request, the settings face as it renders, the polling clipboard and the
build-from-source pipeline. The tree must still type-check and compile with its
own local toolchain and serve the same two faces when you are done.
