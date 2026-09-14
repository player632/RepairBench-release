# Repair Task - esp32-webStudio-IDE (a vanilla-JavaScript browser workbench for ESP32 sketches)

You are working on the source code of **esp32-webStudio-IDE**, a small browser
workbench for writing, checking and organising Arduino-style sketches for the
ESP32 family of microcontrollers. It is plain JavaScript: there is no framework,
no package manifest, no bundler, no transpile step and no build of any kind. The
tree you are handed is the tree that runs. The harness serves it over plain HTTP
from its own root directory and loads the workbench's single top-level page; that
page pulls in exactly one stylesheet and exactly one script, both of which sit
beside it in the same directory, and it asks the network for nothing else at all.

## What the workbench looks like

The page has four regions.

A **header** carries two dropdowns. The first chooses the board: an ESP32 WROOM
development kit with twenty-six usable pins, an ESP32-S3 with thirty-six, an
ESP32-C3 development kit with fifteen, and an ESP32-C3 Super Mini with thirteen,
presented in three labelled groups. The second lists the project templates that
belong to whichever board is currently chosen; its first entry is a placeholder
that carries no template, and the entries below it differ from board to board.
The WROOM board is the one selected when you arrive, and its template list is
already populated.

A **left panel** draws the current board's pinout as a grid of clickable pin
tiles, each tile showing the pin's name and its role, with the board's name as a
heading above the grid. Below the grid sits a configuration form for whichever
pin was last chosen: a mode dropdown whose options depend on that pin's
capabilities, a variable-name field and a description field. Changing any of the
three records the choice for that pin in the session's in-memory pin store.

A **right panel** holds the code editor, a plain multi-line text field, and the
buttons that act on it: validate the sketch, generate a sketch from the pins you
configured, save it to a file, clear it, open the upload dialog and open a
reference dialog of common device commands. Generating composes a heading naming
the current board, one declaration per configured pin, the matching setup
statements for each pin's mode, and a fixed loop skeleton.

A **bottom panel** shows one of two panes at a time - an output pane and a
terminal pane - chosen by a pair of toggle buttons, with a heading that names the
pane currently showing and a Clear button beside it. The output pane is the one
showing when you arrive. The terminal pane has its own scrollback area, a
one-line command field with a prompt glyph beside it, a Send button and a
Disconnect button.

Two dialogs sit on top of the page. The **upload dialog** has a File pane and a
URL pane with a button above each, a dark backdrop behind the box, and its own
dismiss button in the box's header. The **reference dialog** lists common device
commands; each row carries the command it stands for and, when pressed, hands
that command to the terminal's command field, closes itself and brings the
terminal pane forward.

## What has been reported

Eight reports came in from people using the workbench. Six describe things that
are genuinely wrong. **The other two describe behaviour that is correct as
designed** - they are recorded here because they were reported, not because
anything needs changing, and "fixing" them would be a regression.

Not every defect in this tree is mentioned in these reports. Some of what is
broken was never reported by anybody, and a report that names one visible symptom
may be sitting on top of a second, separate fault that hides behind it. You are
expected to find those yourself.

**Report 1.** "I configured a pin on one board - gave it a variable name and a
mode - and then switched the board dropdown to a different board and pressed
generate. The sketch it produced still declared the variable I had named on the
board I left, as if my old pin choices had followed me across. The pinout grid
had correctly rebuilt itself for the new board, and the pin form had correctly
gone back to its prompt, so it was only the generated sketch that carried the
stale choices over."

**Report 2.** "I moved the bottom panel across to the terminal pane and then
pressed the Clear button, expecting the terminal's scrollback to be wiped.
Instead the terminal text stayed exactly as it was and the output pane - the one
I had navigated away from - was the one that went empty."

**Report 3.** "Choosing a pin is unreliable depending on where exactly I land the
click. If I press on the tile's own padding it behaves, but if I press on the pin
name printed inside the tile, the chosen marking ends up on that text rather than
on the tile, so the grid no longer shows one clearly selected tile. The
configuration form underneath still comes up for the right pin either way, which
is what makes this so confusing."

**Report 4.** "The terminal's command field does not respond to the keyboard at
all. I type a command and press Enter and nothing happens - no echo into the
scrollback, nothing. I have to reach for the Send button every single time. It is
as though the field never hears a key press."

**Report 5.** "The upload dialog's own dismiss button, the little cross in the
dialog header, does not dismiss the dialog. Pressing it leaves the dialog exactly
where it was. Clicking out on the dark backdrop behind the box does close it, so
there is a way out, but the button that is supposed to do the job does not."

**Report 6.** "Both bottom panes are on screen at once. I can see the output pane
and the terminal pane together, stacked, and the terminal one is plainly visible
even though its toggle button is not the selected one and I never asked for it.
It looks like the rule that is supposed to keep the unselected pane out of view
has stopped applying."

**Report 7 - reported, but this is correct behaviour.** "The terminal scrollback
opens by telling me it is inactive and that I should connect first, and when I
send a command without connecting it prints a warning that nothing is connected
and tells me to connect first. Is the terminal broken?" It is not. This
workbench is a bench-side editor and checker; in the harness it runs with no
device attached and nothing to attach to, so the terminal has no connection and
says so honestly. The command you typed is still echoed into the scrollback, the
command field is still emptied by the attempt, and the warning names the real
reason nothing went out. That is the intended behaviour and it must keep working
exactly like this.

**Report 8 - reported, but this is correct behaviour.** "Every time I press
generate I get the same skeleton back - the same board heading, the same serial
initialisation, the same loop with the same delay in it - no matter which pins I
configured. Is the generator stuck?" It is not. The skeleton is fixed by design:
the heading names the current board, the loop body is a constant, and what varies
with your configuration is the block of pin declarations and the matching setup
statements for each pin's mode. Configure a pin with a variable name and a mode
and generate again, and your declaration and its setup statement appear inside
that fixed skeleton. That contrast between the constant part and the configured
part is the intended behaviour.

## What you have to do

Find and repair the faults behind the six genuine reports, and find the faults
nobody reported. Repair the causes, not the symptoms: the workbench must behave
correctly for real use, not merely produce the right text under the specific
sequences of clicks described above. Do not add a build step, do not add a
dependency, do not fetch anything from the network, and do not leave anything
behind in browser storage, in the page address, or on the global object - the
workbench keeps its state in memory for the lifetime of the page and that is how
it must stay. Leave the two behaviours in reports 7 and 8 alone.
