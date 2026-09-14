# Repair Task - Armoria (Svelte)

You are working on the source code of **Armoria**, a Svelte 3 + Rollup
heraldry generator and editor: it procedurally generates coats of arms (a
shield shape, a field tincture, optional divisions, ordinaries such as
fesses or chevrons, and charges such as lions or swords), shows them in a
collection, and lets you open any of them in an editor with sections for the
shield, field, division, ordinaries, charges and inscriptions. You can
reroll/rollback whole galleries, undo/redo edits step by step, change the
UI language, and open coats from shareable deep links: `?coa=<encoded
JSON>` opens a specific coat in the editor, optionally with `&view=1` for
a read-only display mode, and `?seed=<number>` regenerates a specific seeded
coat. The project lives in this workspace; it builds with `npm run build`
(Rollup, output in `public/build/`, the whole `public/` directory is
served at the site root). The app is fully offline - there is no backend.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify
  a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "The undo history feels broken in the editor. I open one of our shared
   coat links, change the name a couple of times, hit Undo - the buttons
   upstairs clearly react, but the coat itself never reverts. The name I
   typed stays there, the shield doesn't change back, nothing. It's like
   Undo updates the history but forgets to tell the drawing."

2. "Redo is permanently greyed out for me. I make two edits, undo one of
   them - by every definition there is now something to redo - but the
   Redo entry in the bar never becomes clickable again. It used to light
   up in exactly that situation."

3. "Editing inscriptions is broken. I open the inscription section of a
   coat that has text on it and type new text into the Text field - the
   field itself shows what I type, but the letters rendered on the shield
   stay the old ones. I have to reload to see anything, and then my text
   is gone again."

4. "We embed read-only coats on our wiki via the links that end in
   `&view=1` - those are supposed to open the plain display mode, just the
   shield, no menus. Lately every one of those links drops us into the
   full editor with all the sections instead. The regular edit links
   without that parameter still behave, as far as I can tell."

5. "All the status messages at the bottom of the window - 'COA is
   loaded', 'link copied', the tips - they flash up for a split second
   and vanish before anyone can read them. I timed one with my phone,
   it's gone in well under a second. They used to stay up for several
   seconds."

6. "The figures have disappeared from every generated coat. Fields,
   divisions, stripes and borders still draw fine, but every charge -
   lions, swords, eagles, everything - is just gone, from the collection and
   from opened coats alike. It looks like the shapes fail to load."

7. "Small thing that bugs me: whenever I open a fresh shared coat link,
   the Undo button is already greyed out. I haven't even done anything
   yet and I can't undo. It should really be available from the start."

8. "Pressing Escape while I edit kicks me straight out of the editor back
   to the collection. That feels destructive - I think Escape should simply
   do nothing while a coat is being edited, so you can't lose your place
   by accident."

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they
  are verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce
  network requests or new dependencies. Font families resolve locally,
  charges load from the bundled `public/charges/` set - keep it that way.
- Do not run the project's build or tests to verify yourself during the
  session; the checker builds and verifies your tree as-is.
