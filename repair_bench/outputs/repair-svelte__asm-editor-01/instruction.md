# repair-svelte__asm-editor-01 — repair brief

## The application

A browser IDE for hand-written assembly. It supports five instruction sets — M68K, MIPS, RISC-V, X86
and Z80 — and runs entirely in the page: no server, no database, no account. A landing page lists the
projects the browser holds and offers an import button; a second page creates a project out of a name,
a description and an instruction set; a third page holds the appearance presets. Opening a project
mounts the editor: a source pane with line numbers, a row of execution controls (assemble, stop, run,
undo, step), a register table, a memory inspector that can show a page of memory as hex, as decimal or
as characters, a console pane for the program's own output, a timing line, a diagnostics button, and
floating panels for the settings, the keyboard shortcuts, the documentation and the call stack. A
project can be exported to a file, imported back from a file, and shared as a link that carries the
whole project in its query string. It is front-end only, and after the offline adaptation described
below the page makes no network request at all.

## What you are being asked to do

The tree you are handed installs, builds and serves, and every screen renders. But a set of behaviours
are wrong. Find them, repair them in the application source, and leave everything else working. The
build must still succeed, the editor must still assemble and run the same five instruction sets, and
the repairs must be real: a change that makes one observed symptom disappear by disabling the feature
behind it, or that special-cases the exact situation a check looks at, is not a repair and will be
caught by the sentinels described at the end of this brief.

## Reports from users

Nine reports follow. **7 describe things that are genuinely broken. 2 describe
behaviour that is intentional upstream and must be left exactly as it is** — they are included because a
well-meaning repair that "fixes" them makes the application worse, and because telling the two apart is
part of the task.

1. The memory inspector has gone tall and narrow. A page of memory used to be laid out as sixteen rows
   of sixteen bytes: the offset header ran 00 through 0F and the addresses down the left stepped by
   sixteen (10010000, 10010010, and so on down to 100100F0). Now the same page is thirty-two rows of
   eight bytes, the header stops at 07 and the addresses step by eight. The page still publishes all 256
   bytes and the bytes themselves are right — only the shape of the grid is wrong.

2. Register values have slid to the left edge of their field. After a run, $V0 reads a000 0000 where it
   should read 0000 000a, and the program counter reads 40002400 instead of 00400024. A register whose
   value already fills its field — $SP = 7fff effc — is unchanged, the table still holds the same 35
   rows, and every value is still split into the same two groups; only the digits inside a field that is
   wider than the value have moved.

3. An editor setting I chose does not survive a reload. I switched on "Use decimal as default for
   registers", reloaded the page, opened the settings panel again, and the switch was off. The other
   seven entries look exactly as they did before, because they were already at their factory values — so
   the panel looks almost right and only the entry I actually changed has been forgotten. It happens on
   every reload.

4. A shared link opens as somebody else's empty project. A colleague sent me a link to a project that has
   test cases. When I open it the tab is called Untitled, the source pane holds a six-line starter
   program for a different instruction set instead of my colleague's twelve lines, the register table has
   17 rows instead of 37, and the test-case table shows four rows instead of five. A link to a project
   with no test cases opens correctly, and the landing page itself is fine.

5. Text drawn on a coloured background has lost its contrast. Labels that sit on a dark accent now render
   in near-black — the text colour the app publishes for the accent flipped from #dbdbdb to #181818 — and
   labels on a light accent get the colour meant for a dark one. The accents themselves are unchanged:
   the palette the app publishes is exactly what it was and so is the page background. Only the text layer
   that goes with each colour is inverted.

6. A brand-new Z80 project cannot assemble its own starter code. I create a project, pick Z80, and the
   editor answers with syntax error ("0x8000") against the program it generated for me a second earlier,
   with the diagnostics button lit. The source pane shows the five lines it always shows, the project
   title is right, and a MIPS project created the same way assembles without complaint.

7. The character view of memory has inverted. My program stores the string RB-PROBE-OK. When I switch the
   memory inspector from hex to characters, the eleven bytes the program wrote are the ones that now
   render as dots, and the untouched memory around them no longer does: on the same page the dot count
   went from 245 to 11. The hex view of that page is unchanged and still correct, and the toggle between
   the two still flips its own label.

8. *(Intentional — do not change.)* I never wrote to $AT anywhere in my program, but after running it $AT
   holds 1001 0000 - the emulator is clobbering a register it should leave alone.

9. *(Intentional — do not change.)* The memory inspector shows 256 cells for a program that only stored
   an 11-byte string, and most of them render as a single "0" instead of "00" - the grid is padding wrong
   and showing memory that does not exist.

## Not every defect is described in these reports

5 of the faults in this tree carry no user report at all, and some reports overlap: two
different underlying faults can produce what looks like one symptom, and one fault can hide another so
completely that repairing the hidden one on its own changes nothing observable. Treat the reports as
leads, not as a checklist, and read the running application rather than the report list when you decide
whether something is fixed.

## Ground rules

- Repair the application source. Do not edit, delete, add or skip any verification artefact, and do not
  weaken a check to make it pass.
- Keep the build working. The production build must still succeed and still produce a servable static
  tree.
- Do not add network access. The app is verified offline; any new external request will hang the page
  load and every check with it.
- Do not persist anything the application does not already persist. Every check runs in a fresh browser
  context, and a set of state-isolation sentinels re-reads what the page stored — local storage, session
  storage, cookies and the address bar — after the interaction a check performs. A repair that stashes an
  edit, caches a computed answer, or smuggles a value through the URL turns those sentinels red even when
  the behaviour it was aiming at is fixed.
- Do not special-case a check. Sentinels pin the behaviour that must not change — the total byte count a
  page of memory publishes and the order it publishes it in, a register value that already fills its
  field, the eight entries and labels of the settings panel, the name and the twelve source lines of a
  shared project that carries no test cases, the code half of an imported file and an import with no
  metadata at all, the console pane a run prints into and the absence of a timing line after a build
  alone, the palette the app publishes for two different instruction sets, the five lines of the Z80
  starter template and the machine a created Z80 project mounts, the four appearance presets listed
  before anything is picked, the hex view the character toggle leaves behind, and the two intentional
  behaviours reported above — and they are scored alongside the repairs.
- Leaving intentional behaviour alone is a correct answer. Reports 8 and 9 are traps in the ordinary
  sense: "fixing" them turns a green sentinel red.

## How the repair is verified

A headless browser drives the served application through a fixed script of interactions and reads what
the application itself reports, both before and after your repair. Checks are split in two:

- **Repair checks** are red on the tree you are handed and must turn green. Each one is the exclusive
  detector of a single underlying fault, with one deliberate exception that is registered as a
  conditional pair: two faults share one repair check because the first hides the second, so that check
  only turns green when both are repaired.
- **Sentinel checks** are green on the tree you are handed and must stay green. They cover the behaviour
  that is correct today, including the two intentional behaviours reported above, so a repair that breaks
  something else does not score.

The verdict is all-or-nothing across the two groups: every repair check green and every sentinel check
still green.
