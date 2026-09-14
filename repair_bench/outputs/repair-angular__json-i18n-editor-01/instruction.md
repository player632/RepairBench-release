# Translation workbench — QA pass

**What we tested:** the offline build you handed us (it runs on its own, no backend needed).

**How to get in:** open the app, sign in with the demo account — name `translator`, password
`offline-demo` — then pick the language you want to work on from the dropdown. We did most of our
pass with German, and one round with Arabic. After you sign in the text takes a moment to arrive.

Hi — we ran a full pass over the translation workbench and the items below are wrong. The numbers
are just the order we hit them in, not a priority ranking.

1. **There is no way to save.** We pressed REVIEW and no save control ever turned up — not in any
   language, not with changes on screen, not after waiting. We had to abandon the session.

2. **The green band that names a section is printed above every single line.** It is supposed to
   appear once, at the top of each block of lines, and then not again until the next block starts.
   With roughly 270 lines loaded it is just a wall of green and you cannot see where one section
   ends and the next begins.

3. **The search field for the English side has become picky about capital letters.** Typing
   `legal notice` finds the line; typing `Legal Notice` — exactly the way it is written on screen —
   finds nothing at all. It used to match either way.

4. **"Showing untranslated" gives the opposite of what it says.** It lists everything that already
   has a translation and hides the few lines that do not. For German there should be about ten
   empty ones; we get the rest of the file instead.

5. **Pressing Escape in the English search field empties the other search field.** The field we
   actually pressed Escape in keeps its text, and the one we never touched gets wiped.

6. **Arabic is laid out left-to-right now.** We opened the Arabic set and the text runs the wrong
   way across the box. It used to run right-to-left.

Two more things we are not sure about — please tell us whether they are intended instead of
quietly changing them:

7. Straight after signing in, a green "LOADING ..." message hangs in the middle of the screen for
   a moment and then the text appears. It looks like a placeholder while the file is being read,
   but we are flagging it in case it is new.

8. With the caret inside a translation box, pressing Tab does not move to the next box — the caret
   stays exactly where it was. Pressing Enter does not start a new line either. We assume both are
   deliberate (nobody wants stray line breaks inside a translation), but it felt broken while we
   were testing, so please confirm.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.
