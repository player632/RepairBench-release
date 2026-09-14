# SvelteMark — my markdown editor is falling apart in at least seven places

Hi! I use SvelteMark (the local-first markdown editor) entirely in my browser — I never
install anything and I never want it phoning home anywhere. Lately it has been
misbehaving in a bunch of different ways, and my teammates keep reporting new ones.
Some of it might be related, some might not; I honestly can't tell anymore.
Please get it all working again.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

1. The saving status feels dead. When I type something, the little "unsaved" dot in
   the top bar never shows up, and I have a bad feeling nothing is actually being
   kept: more than once I closed the laptop, came back, reopened the app, and my
   latest edits were just gone. It used to save by itself while I typed.

2. I like the distraction-free mode, but "Auto-hide UI" in the ⋮ menu does nothing
   anymore. I switch it on and the button bar and the file panel stay exactly where
   they were. The checkmark appears in the menu, nothing hides.

3. The Ctrl+B shortcut stopped working. I select some text, press Ctrl+B, and
   nothing happens — no bold markers, nothing in the rendered output. Weirdly, the Bold
   button in the button bar still works fine. It's only the keyboard shortcut that is
   dead.

4. When I flip the app into View Only mode (the eye/pencil button in the top bar),
   the editor pane refuses to disappear. I still see the markdown source next to
   the rendered output, taking up half the window. View Only should show me just the
   rendered result.

5. Something is wrong with how new files get their names. The very first new
   file I create already comes out as "New File 1", even though nothing called
   "New File" exists yet - the plain name is just skipped. When I create several
   files in a row the numbering keeps climbing from there. It used to add a
   number only when the name was actually taken.

6. Clicking a folder in the file explorer does nothing anymore. It used to collapse
   (and re-open) the folder, now the click is simply ignored and the folder stays
   open all the time.

7. The output pane freezes while I write. I type new paragraphs or whole new
   sections and the rendered output just sits there showing the old content.
   Oddly, when I switch to another file and back, the rendered output catches up — but it
   never updates while I'm actually typing.

Two more things people mentioned; I'm not even sure these are bugs, but have a look:

8. Whenever I switch to View Only, the little green checkmark next to the file name
   disappears from the top bar. That feels wrong to me — shouldn't the save status
   stay visible in every mode?

9. On my laptop the logo image at the top of the Welcome note doesn't show up. A
   blank spot where the picture should be. Is that image broken for everyone, or is
   it just my machine?

Ground rules while you work on this:

- Do not run the project's build, dev server, or test commands to check your
  changes; the changes are verified by an external pipeline after you finish. Read
  code and reason statically.
- Keep the app fully offline — it must not start fetching anything from the network.
- Fix the root causes. Don't special-case the exact documents or names mentioned
  here; the app has to work for any notes I write.
