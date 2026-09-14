# Repair Task - markdown-nice (React)

You are working on the source code of **markdown-nice**, a WeChat-oriented
Markdown typesetting editor built with React 16, mobx 5 and webpack 4:
users write Markdown in a source editor on the left and watch a styled
live preview on the right, switch between bundled layout themes (and edit
their CSS), apply formatting patterns such as bold, italic, inline code
and links from menus or hotkeys, see line and word counts in the bottom
bar, toggle the preview between phone and desktop width, paste rich text
and let the app offer to convert it into Markdown, and finally copy the
finished article with all styles inlined for pasting into WeChat, Zhihu
or Juejin. The project lives in this workspace and is fully offline:
install with `npm install`, build with
`NODE_OPTIONS=--openssl-legacy-provider npm run build` (webpack 4, output
in `build/`, served from that directory as the site root). There is no
backend and no network access: features that upload pictures to remote
image hosting need the network and are not part of verification, and the
remote pictures referenced by the bundled starter article cannot load in
this environment.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "My document keeps disappearing. I write for a while, reload the page
   by accident, and everything is back to the bundled starter article -
   the app is supposed to keep my text locally between visits."

2. "The bold entry in the format menu is broken: I select a word, click
   it, and the word gets a strikethrough instead of becoming bold."

3. "Switching themes only half works. The preview styling does change,
   but the theme name in the bottom bar keeps showing the previous
   theme, and the checkmark in the theme menu does not move - after a
   reload the choice even jumps back."

4. "While writing, the preview suddenly stops following my typing. I type
   in the editor and the right side stays frozen; only reloading makes
   it show what I wrote."

5. "The phone/desktop toggle for the preview is stuck. I am on the wide
   desktop preview, click the toggle in the right sidebar to get the
   narrow phone width, and nothing happens."

6. "Code themes come out wrong. I turned on the Mac-style window look
   for code blocks, but when I pick a theme I get the plain variant
   instead of the Mac one - and the other way round when the Mac style
   is off."

7. "When I paste text copied from a web page, the app offers to convert
   the pasted rich text into Markdown. I click the offer and nothing
   gets converted - the text stays exactly as it was pasted."

8. "I clicked the copy button in the right sidebar and got no reaction
   at all. I don't think copying works in this build."

9. "All the pictures in the starter article show as broken images in the
   preview. Something must be corrupting them."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
