# Repair Task - skillchecks (SolidJS + TypeScript, a game-client overlay that runs eight minigame rounds)

You are working on the source code of **skillchecks**, an overlay resource for a
multiplayer game client. It is not a website and it has no pages of its own: the
game client opens it, tells it which round to run, and the overlay draws one
panel in the middle of the screen until the round is over. The panel is a fixed
shell - a small controller picture, the name of the round in glowing green
letters, a one-line description beside it, the round itself underneath, and a
thin orange bar running the full width along the bottom - and everything the
player sees is that shell with one of eight rounds mounted inside it.

The eight rounds are:

- **Letters.** A row of tiles, each showing one lower-case letter drawn from a
  pool of seven. The player types the letters in order: the tile they hit turns
  green and stays lit, and one wrong key marks the current tile red, announces
  `Failed!` and ends the round. Clearing the last tile announces `Success!` and
  ends the round a second later. How many tiles the row holds is something the
  game client chooses when it opens the round.
- **Words.** A word is shown, with a counter above it reading `0/5` and two
  buttons underneath, `Seen` and `New`. The player answers `New` for a word they
  have not seen before and `Seen` for one they have; a correct answer advances
  the counter by one and deals another word, an answer that contradicts the
  history ends the round as a failure, and reaching the target the game client
  asked for ends it as a win. The target is the denominator of that counter.
- **Tiles.** A five-by-five board of squares, dealt with some of them already
  face-up. Pressing a square turns it over and turns over the four squares
  sharing an edge with it - above, below, left and right - so one press moves
  five squares in a plus shape. Clearing the board wins the round.
- **Sharks.** A grid of pictures: some face left, some face right, some are
  empty water. The grid is dealt at the smallest size the game client allows and
  grows after every correct answer, up to the largest size it allows. The player
  answers with the two buttons under the grid (or the arrow keys) and must match
  the direction the centre picture faces; a correct answer advances the tally
  beside the buttons, a wrong one ends the round. The dealing rules guarantee
  that no row and no column of the grid is entirely empty water, and that the
  centre cell always has something to aim at.
- **Colours.** An eleven-by-eight field of squares in three colours - red, green
  and blue - dealt from the same palette on every board. Pressing a square clears
  it and every square of the same colour connected to it edge-to-edge; a press
  that would clear nothing is a failure. Clearing the field wins the round.
- **Flood.** A five-by-five field of squares in six colours with a counter under
  it reading `0/N`. Pressing a colour floods the board from the top-left corner
  out through every touching square of that colour, and the counter counts the
  presses. `N` is the number of presses the board actually needs, plus a fixed
  amount of slack the game client grants; running out of presses loses the round.
- **Locks.** A canvas showing three concentric rings of coloured beads - amber,
  blue and pink - with a thick coloured arc on each ring and grey spokes from the
  hub. The player rotates the rings with the arrow keys or the mouse wheel and
  presses space to test whether the beads on the selected ring line up with the
  arc above them; a ring that matches locks green. The number of positions a ring
  can take, and the number of rings, are both things the game client chooses.
- **Untangle.** A canvas of green nodes joined by green lines, with the lines
  that cross each other drawn in red. The player drags nodes until nothing
  crosses any more, and the round reports progress as the share of lines that are
  no longer red.

Two of the rounds - letters and sharks - keep their own private copy of the
little sound player the others share, and the words round keeps a third. All
three copies behave the same way: a short quiet cue for each ordinary step, and
a finish cue exactly twice as loud when the round ends. The loudness is the only
thing that tells the two cues apart besides the sample itself, and it is part of
the contract, not a stylistic choice.

When a round ends - won, lost or timed out - the overlay reports the outcome to
the game client and withdraws: the whole panel disappears, because the client is
expected to close the overlay anyway and a panel left on screen would sit over
the player's game. Opening a round again brings the panel back with the new
round's own title, description and knobs. The orange bar at the bottom is the
round's own clock: it starts full when the panel opens and drains steadily over
the duration the game client asked for, and when it reaches zero the round is
reported as a failure and the bar rewinds to full.

The project builds with pnpm through vite (`pnpm run build`, which is exactly
`vite build`) and its output folder is `nui/dist`, which is what the verifier
serves at the root of a static origin. There is no type-check and no lint step in
that command, so the build can be green on a tree that still has type errors; the
graded signal is the running overlay, not the compiler. Dependencies are
provisioned offline by the harness.

Environment notes - properties of this offline harness, not defects:

- There is **no network access**, and nothing in this project needs it. Every
  picture, sound and stylesheet the overlay uses is bundled into the build from
  the tree itself, the built document performs **zero remote-origin requests**,
  and the only outbound request the application ever makes is the report it sends
  to the game client when a round ends - which the harness answers locally, on
  the same loopback the page was served from, so a round that reports is a round
  whose report was actually delivered. The seed's own page used to carry three
  remote references (a stylesheet, an icon font and a tag manager); they are gone,
  replaced by the bundled equivalents, and no reading in this task depends on
  anything off this machine.
- **No icon font is shipped.** The two answer buttons under the sharks grid carry
  their arrows as ligature text - an icon font would turn those words into
  glyphs, and without the font the words themselves are what renders. That is
  true on every build of this tree and it is not something to repair.
- **Boards are reproducible.** The harness pins the platform's random stream to a
  fixed seed at bootstrap, so the same round deals the same board, the same
  letters and the same words on every run and on every machine. Nothing in the
  game logic was changed to achieve this - the draws, the thresholds, the grid
  shapes and the palettes are all exactly as the seed shipped them - and the pin
  is a property of the harness. Do not remove it, and do not add randomness of
  your own to make a reading move.
- The harness ships a small **read-only observation bridge** inside the
  application. It is loaded at bootstrap and publishes getters for things the
  page has already rendered - element censuses, the colours and states the
  markup carries, text, the pixels of the two canvases, the sounds the app asked
  to play and the reports it sent - so the checker can read the live overlay
  instead of guessing at it. Where the seed's own markup gave it nothing stable
  to hold onto it adds inert marker attributes of its own; they carry no styling,
  change no behaviour and are not part of any round. The bridge also answers the
  inbound message the game client would send, and performs nothing a player could
  not do: a key press, a mouse-down on a square, a click on a button. **Do not
  remove, rename, repurpose or extend it, and do not delete the statement that
  loads it** - it is required by the checker. Equally, do not add markup,
  styling or state to the page in order to make a reading come out right: the
  bridge reads the real overlay, so a hardcoded value shows up exactly where it
  was hardcoded.
- The panel's title and description come from the game client's message and are
  read once when the panel is built, which is why opening a new round shows the
  new round's own title. That is the seed's behaviour and it is the same on every
  build.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions. Treat
them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and in a different layer than the one you can see:
  the message the game client sends, the store that holds it, the round that
  reads that store and the report that goes back out are halves of one contract,
  and the shared sound player and the rounds that keep their own copy of it are
  halves of another.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Behaviors you break while fixing other things still count against you, and all
  eight rounds share the same shell, the same store, the same inbound message
  handling and the same outbound report, so a change made for one round is
  visible in the others.
- Keep the read-only observation bridge described above exactly as it is.

The reports, in no particular order:

1. "I failed the letters round on purpose - hit a key that was not on the board - and the game still paid me out for a WIN. The panel closed like it always does but the client counted the round as passed. It goes the other way too: a round I actually finished came back as a failure. Whatever I do, the answer it sends is the opposite of what happened."

2. "The tick sound you get for each correct letter is now exactly as loud as the fanfare that plays when you finish the whole board. I play with the sound on and I cannot tell whether I have won or just pressed another key without taking my eyes off the game. It used to be a quiet tick and a proper fanfare."

3. "In the words round the score jumps two at a time. I answer New on a word I have never seen and the counter already reads 2/5, and the round is over after three answers instead of five. It is paying me for answers I did not give."

4. "On the tile board, pressing a square no longer turns over the square on its left. It turns over the one up and to the left instead, on the diagonal, so the plus shape comes out with a corner missing and a corner added. I cannot clear the board the way the game teaches you to and I am sure the board is not meant to move like that."

5. "The colour field comes up with a scatter of completely blank squares - no red, no green, no blue, just empty cells where a square should be. They cannot be pressed into a group and they never clear, so the field is impossible to finish. It is a different scatter every time I open the round but there are always around a dozen of them."

6. "The flood board tells me I have far fewer presses than it needs. The counter says 0/3 for a board that plainly takes eight floods, so the round is declared lost while I still have obvious moves to make. The slack the game is supposed to give you has turned into a penalty."

7. "As soon as the panel opens, the orange bar along the bottom starts emptying by itself even though I have not touched anything. It looks like it is leaking time or running some animation it should not be running. It keeps going down the whole time the panel is up."

8. "The two answer buttons under the sharks grid have stopped being arrows - they literally say `keyboard_arrow_left` and `keyboard_arrow_right` in words now, like somebody forgot to load the pictures. Everything else on that round looks right."

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the shell and its header, the clock along the bottom and the failure
report it makes when it runs out, the withdrawal of the panel when a round is
reported and its return when a new round is opened, every knob the game client
sends and the round that reads it, the dealing rules of all eight rounds and the
win and loss conditions built on them, the two sound cues and the loudness that
separates them, the report that goes back to the client and the verdict it
carries, and every reading that was already correct - none of which any single
report describes in full. The project must still build with the command above
when you are done.
