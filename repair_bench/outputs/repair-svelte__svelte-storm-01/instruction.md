# Repair task: svelte-storm

We use SvelteStorm (the Svelte IDE workbench in this repo, run here as a
statically served renderer build) for internal tooling demos. After a recent
merge, our team started filing a pile of complaints about the workbench. Some
of these reports may overlap, and some may be red herrings — triage them
yourself. Fix the product so every genuine problem below stops happening,
without regressing anything that already works.

Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

## What our team reported

1. **I can't open a second file.** "With one file already open in the editor
   pane, I open another file from the project — and nothing happens. The tab
   strip keeps showing only the first file, no matter which other file I try.
   I have to close everything to look at anything else."

2. **The manual search lands on the wrong page.** "I open the documentation
   panel, type a topic like `each`, and hit search. The manual frame jumps to
   some generic introductory section that has nothing to do with what I typed.
   It does this for every term I try."

3. **The performance button opens the wrong panel.** "I click the button for
   the performance dashboard and instead of the metrics panel I get a second
   code pane, like the one from the split-view button. The metrics never show
   up."

4. **Picking an earlier snapshot doesn't switch the details.** "After I've
   captured state a couple of times, I click the first capture's button on the
   shelf to look back at it. The shelf highlights it, but the little detail
   card below keeps showing the newest capture's values, not the one I
   clicked."

5. **Snapshot detail cards won't close.** "When I click a capture's component
   name, its state details expand fine — but clicking it again does nothing.
   Once a card is open it stays open forever and clutters the panel."

6. **Creating a new file gets stuck.** "I use the add-file action in the
   directory menu, type the new file's name, press Enter… and the input just
   stays there. Nothing is created, the box never goes away, and I can't
   finish the action."

7. **The terminal greeting is misspelled.** "Tiny thing, but the welcome line
   the console prints at startup spells the product name wrong — there's a
   letter missing. It looks unprofessional in demos."

## Also flagged, but we're not sure these are bugs

- A teammate panicked because **the snapshot shelf on the right is completely
  empty right after launch**: "All my captures are gone!" Nobody had captured
  anything yet in that session, though.
- Another teammate complains that **the documentation search field is always
  blank when the panel opens**: "It should remember what I searched for last
  time!"

Please verify for yourself which of these are real defects and which are the
product working as intended, and act accordingly.

## Ground rules

- The workbench must keep running fully offline as served here; do not
  introduce any external network dependency.
- The terminal pane must keep printing its greeting line and echoing incoming
  output exactly as before.
- Opening, switching and closing file tabs must keep working for every file,
  including after other tabs are closed.
- The documentation panel, the split view, and the metrics dashboard must each
  open and close with their buttons as they always did, and show the correct
  content for whatever the user asked for.
- Captured state must keep appearing on the shelf, each capture exactly once,
  and every entry must stay selectable with its own detail card.
- The directory menu's create-file flow must stay keyboard-driven and finish
  with the usual confirmation key.
- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
