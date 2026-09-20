# Repair Task - charlie (vanilla TypeScript + Vite, a browser Forth REPL)

You are handed a **workspace** containing charlie: a Forth stack machine that runs entirely in
the browser. It ships as one page - a console you type Forth into, an EXECUTE button beside it,
and two live panels on the right showing the data stack and the return stack. There is no server
component in this workspace and none is expected.

The interesting thing about this codebase is that it is two layers deep. Underneath is an
interpreter with a set of primitives: the stacks, the dictionary, arithmetic, bitwise ops, the
return stack, `sleep`, and the JavaScript interop words (`js@`, `js!`, `js-call-1`, ...). On top
of it sits a **kernel written in Forth itself** - one long list of source strings that the page
feeds to the interpreter at boot. That kernel is where control flow (`if/then/else`,
`begin/until/while/repeat`), comments, `: ... ;` definitions, values, documentation (`doc>`,
`see>`, `show-words`), vocabularies (`vocab/ ... /vocab`, `with>`, and the `Name.` accessors they
create) and a small DOM vocabulary live. On top of *that* sit the optional vocabularies the REPL
can `include` at runtime - math, lists, canvas, synth, audio, swizzle, glsl, bench - which are
served as plain `.fs` files next to the bundle and fetched over same-origin XHR.

So a symptom on screen can originate three layers away from where it shows up: in a primitive, in
a Forth definition inside the kernel, in the page's own console/layout code, or in one of the
included vocabularies.

## What the graded surface is

- The **console**: an output stream where every line is tagged by kind - the echo of what you
  typed, printed results, errors (prefixed `[ERROR] `), and help text. It has a hard cap on how
  many lines it keeps.
- The **input** textarea and the **EXECUTE** button. Command+Enter also evaluates; Command+Up/Down
  walk the history; Command+K clears the output; Tab completes the word you are typing, and
  repeated Tab rotates through the candidates.
- The **data stack** and **return stack** panels, redrawn after every evaluation, also capped.
- The **page layout**: a CSS grid with the console and the stack panels side by side on top, and
  the input and the EXECUTE button side by side underneath.
- The **dictionary**: every word the kernel defined at boot, plus anything you define during the
  session, walkable with `show-words` / `count-words` and inspectable with
  `doc>` and `see>`.
- The **included vocabularies**, reached through their accessors - for example `2 10 Math. pow .`
  prints `1024`, and `Math. pi .` prints pi. Vocabulary words are *not* visible at top level; the
  accessor is what reaches them.

Everything is served from one static origin and **there is no network access at all** while this
is checked. The only traffic the page generates is its own same-origin fetch of the `.fs`
vocabularies when you `include` one.

## How the work is checked

- Your tree is installed and built offline with the project's own toolchain, then served
  statically and driven by a headless browser at **1440x900**.
- The checks **use the page the way a person does**: they put a Forth program into the input,
  evaluate it with the keyboard, click things, press Tab, wait, and then read what is on screen -
  the console's text, error and echo lines, the input's value, which element has focus, the
  rendered stack panels, computed styles, element geometry, and what is in browser storage.
- They are interaction-level, not code-level. They never import your modules, never call your
  functions, and never read your source.
- Some readings are taken **twice at different moments of the same interaction** - a value is
  frozen part-way through a delay and again after it - so "when" something appears is graded, not
  only "whether" it appears.
- A handful of **inert marker attributes** were added to elements the page already rendered, plus
  two markers set by the console's own line printers, so the checks can address them. They carry
  no styling and no behaviour. **Keep them exactly as they are** - do not rename them, move them,
  or add behaviour that keys off them.
- The page's random number generator is **pinned to a fixed seed** in this workspace so that
  graded readings reproduce run to run. That pin is part of the harness, not a defect. Do not
  remove it, and do not "restore" real randomness.

## Reading the reports

- Most reports describe **real, reproducible defects**, each with its own root cause. The root
  cause is frequently **not** in the layer where the symptom shows up: a wrong value printed by a
  Forth word can come from a primitive several layers down, and a widget that never updates can be
  the fault of something that was supposed to refresh it.
- Two symptoms are deliberately **entangled**: what one of them prints depends on whether the
  other is still broken. Repairing only one of the two will leave a check red for a *different
  reason* than before. Read both reports before you touch either.
- At least one report describes behaviour that is **actually intended**; verify a report before
  you act on it. "Changing" intended behaviour is scored as a regression.
- **Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.**
  (并非所有缺陷都有报告提及。) Some broken behaviour is described nowhere below and will only be
  found by exercising the page rather than by reading the list.
- Keep the rest of the page intact. Fixes that make one report pass by disabling a feature,
  freezing a value, short-circuiting a word, narrowing what the console renders, or widening an
  error path will be caught by the guard checks and score zero.

---

## Reports from users

**Report 1 - `sleep` does not sleep.**
"I pace a little demo with `sleep`, e.g. `800 sleep` between prints so each step appears in turn.
The pause is gone: everything after the `sleep` shows up immediately, all in the same instant I
hit return, instead of after the delay. The output still arrives and it is still correct - it is
just not paced any more, so the demo runs as one blur. Delaying inside a word I defined behaves
the same way."

**Report 2 - long hex numbers are not recognised as numbers.**
"Hexadecimal literals stopped working once they get long. `0xff .` still prints 255, but
`0x10000 .` gives me `[ERROR] Unknown word: 0x10000`. It is as if only *short* hex literals count
as numbers now and anything longer is treated as a word to look up in the dictionary. Decimal
literals, negatives, floats and strings are all still fine."

**Report 3 - hex output prints the wrong letters.**
"When I render a number in hex the letters come out wrong. `255 hex16 .` gives me `0x00gg` where
it should give `0x00ff`, and `48879 hex16 .` gives `0xcffg` instead of `0xbeef`. The digits are
all correct and the `0x` prefix and the width are correct - it is only the letters a-f, and each
of them looks like it has been moved one place along the alphabet. Anything that prints an
address, including `see>` and the memory dump, is affected the same way."

**Report 4 - the console freezes once it is full.**
"After a long session the console stops showing me anything new. I printed a 250-line countdown
in one go and the tail of it never appeared - the window is stuck showing the *oldest* lines it
had, and no further output ever reaches the screen. Reloading the page fixes it, until it fills
up again. Short runs, well under the cap, are completely normal."

**Report 5 - clicking my own input no longer brings it back.**
"I used to be able to click a line I had typed in the console and it would jump back into the
input box, so I could edit it and run it again. That does not work any more - clicking the echoed
source does nothing at all. Strangely, clicking a *result* line now does what my typed lines used
to do, which is not useful to me: it fills the input with a printed number."

**Report 6 - the EXECUTE button is dead.**
"The EXECUTE button does nothing. I type a program, click EXECUTE, and there is no output and no
error message - the console does not even echo what I typed, so it looks like the click never
arrives. Command+Enter still evaluates exactly the same programs, so the interpreter is fine; it
is only the button. Clicking it repeatedly does not help, and reloading does not help."

**Report 7 - the bottom row is mirrored.**
"The layout underneath the console is the wrong way round: the EXECUTE button is now on the left
and the text input is on the right. It used to be input on the left, button on the right, which
is also where my muscle memory goes. The two panels on the right (data stack above return stack)
and the console's position on the left are all still correct - it is only that bottom pair that
swapped."

---

## Two things users mentioned that may not be bugs

**Observation A - "the random numbers are not random".**
"Every time I load the page and print the first random draw from the math vocabulary I get
exactly the same number, to every digit. Reload, same number again. A random number generator
that produces a constant cannot be right."

**Observation B - "the built-in words have no documentation".**
"`doc> +` prints `+ ( no doc )`. Same for `swap`, `dup`, the lot. So none of the built-in words
carry any documentation at all, which makes `doc>` pretty useless for learning the language."

Both observations are worth checking before you touch anything. If one of them turns out to be
the page behaving as designed, **leave it alone** - "fixing" it is scored as a regression.

---

## Rough edges that are NOT part of this task

These are real, reproducible, and **out of scope**. They are the shipped behaviour of this
codebase and no check grades them. Do not repair them, and do not let a repair of something else
change them:

- `if`, `else`, `then`, `begin`, `until`, `while`, `repeat` are **compile-time** words. Typing
  them at the top-level prompt (for example `1 2 < if 111 else 222 then .`) throws an uncaught
  error and leaves the interpreter in a bad state. They only work inside a `: name ... ;`
  definition. Wrap them in a definition and they work fine.
- `Math with> 2 10 pow .` throws. The accessor form `2 10 Math. pow .` is the one that works.
- `doc> <a word that does not exist>` prints `Word not found` but leaves the stack unbalanced,
  which then makes the stack panel throw while rendering it.
- There is no `do ... loop` in this Forth. `do` is an unknown word; counted loops are written
  with `begin ... until` / `while ... repeat` inside a definition.

If you need a loop or a conditional while reproducing a report, define a word first.

---

## Keep the rest intact

Specifically, these territories are exercised by guard checks and must keep behaving exactly as
they do now, whether or not a report mentions them:

- the boot banner, and the fact that it arrives on the **help** channel with nothing on the
  output or echo channels at that point; the input holding focus from boot;
- the page's overall layout: console on the left, stack panels on the right, data stack above
  return stack;
- the keyboard evaluate path - put a program in the input, press Command+Enter - including the
  echo of the source and the printing of the result;
- the input clearing itself after an evaluation, focus returning to it, and the data stack
  draining back to empty once a program has consumed its operands;
- the primitives `rot`, `swap`, `over`, `dup`, `drop`, `+`, `-`, `*`, `mod` and
  `bit-and`, and defining a word with `: name ... ;` and then calling it twice;
- literal reading for every form that currently works - decimal, negative, short hex, string and
  float - and the error channel for a genuinely unknown word, which must still name the word;
- the hex formatters' contract around the digits: the `0x` prefix, the fixed width per
  formatter, the zero padding, and the byte order;
- the dictionary itself: `show-words` still listing the words with their separators, and
  `count-words` still counting the whole chain;
- the DOM vocabulary still reaching the live document - writing a style to an element that is
  already on the page, creating an element, and appending it to the console;
- the console holding **every** line in order, first to last, while it is under its cap;
- Tab completing a word that was already in the dictionary when the page booted;
- the math vocabulary's `max`, `sqrt` and `pi`, and `include` still loading a vocabulary
  over same-origin XHR;
- `doc>`'s `( no doc )` fallback for a word with no documentation, and its `Word not found`
  path for a word that does not exist;
- state hygiene: a session that did real work must leave browser storage empty, must not write a
  cookie, must not move the address bar off the site root, and must not leave stray globals
  behind.

Fix the defects at their root cause. Do not special-case a reading, do not hardcode an expected
value, do not narrow what the console renders, do not swallow an error to make a symptom go away,
and do not disable a feature.
