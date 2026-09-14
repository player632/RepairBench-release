Hey — I need some help with my Word Peaks site. It's that alphabet-climbing guessing game where every square tells you if your letter sits higher or lower than the hidden word's letter. A few things started misbehaving recently, and I can't pin down why:

1. The erase key has a weird blind spot: when a row has exactly one letter in it, pressing erase does nothing at all — the letter stays, the cursor doesn't move. Type a second letter first and erase suddenly works the way it always did.
2. In the settings screen I switched the on-screen letter pad to QWERTY (muscle memory...), and the choice is clearly saved, but the pad under the grid keeps showing the plain A-to-Z arrangement.
3. After my first guess, the dimmed "impossible" letters on the pad look wrong — suddenly almost every key is marked impossible, like the range logic is overreacting.
4. The little range reminder that used to appear inside the next empty square (something like "b ... z") simply never shows up anymore after a guess.
5. When I flip one of the switches in settings, I can tell the preference itself is stored (reloading the page proves it), but the knob on screen never moves or lights up.
6. Finishing a round used to bring up the results strip with the share / next-word controls almost right away — now I stare at the letter pad for ages before anything appears.
7. Links to specific rounds don't load the word they were shared with. I open a link a friend sent, type along, and the feedback clearly belongs to some other hidden word.

Two more things I noticed, though I might be imagining them: the little landscape scene beside the grid sometimes looks like it doesn't refresh when a brand-new round starts, and the "+ new word" button in the header once or twice felt like it did nothing (a confirmation message did pop up, so who knows).

Everything else seems fine — no errors in the console that I can see, and the how-to screen, the mode buttons, and the records screen all open like they always did. Can you track these down and get the game behaving again?

One more thing before you start: not every defect is necessarily mentioned in the reports above. Behaviors you break while fixing other things still count against you.

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
