# MDFlux front end: repair brief

## What this is

MDFlux is a local-first desktop app that turns documents (PDF, Word, PowerPoint, Excel, EPUB,
scans, audio) into clean, AI-ready Markdown. What you are asked to repair is its **front end
only**: a SvelteKit single-page app living in the `app/` subdirectory of this repository, built
with Vite and normally shipped inside a desktop shell.

Everything else in the repository is out of scope. Do not build it, start it, change it, or make
the front end depend on it answering: the Rust shell under `app/src-tauri`, the Python sidecar
inside it, the packaging helpers under `tools/`, the release fixtures under `tests/`, the
developer scripts under `scripts/`, the documentation, and the standalone marketing page at the
repository root. The graded surface is the front end's own TypeScript and Svelte sources.

The app expects to run inside the desktop shell. For this task it is built and served as a static
site and opened in an ordinary browser, so the desktop bridge is not there and the app settles
into its designed "cannot reach the desktop runtime" state. That is expected, it is watched, and
it is not what you are being asked to fix.

## How to work

- Build with the app's own build script from `app/`. Nothing else needs to run.
- The app is client-rendered: the built output is a static shell plus the client bundle, served as
  plain files.
- Keep your changes inside the front end's own sources. Do not add test attributes, do not
  restructure markup to make something easier to select, and do not delete, widen or weaken
  neighbouring behaviour to make a complaint go away. Several of the oddities below are correct as
  they stand and are being watched.
- Every report was written by a person using the app, not by a developer reading the code. Some of
  them describe the same root cause, some describe nothing at all, and the wording points at the
  symptom rather than at the place to change.

## Reports from users

1. "I dropped in a folder of notes and one of them is a hidden file whose name starts with a dot.
   It used to be listed as having no file type at all. Now the app invents a type for it out of the
   rest of the name and offers to read it like a document it understands."

2. "In the output-name settings I use a template that carries the source's file-type token, the one
   written in curly braces. The preview filename now spells that token out instead of substituting
   it, so every saved file would come out with the placeholder baked into its name. The other two
   tokens - the one for the base name and the one for the date - both still work."

3. "When I switch cleanup on for a Word document, all three of the PDF-oriented cleanups come up
   ticked: the marker-stripping one, the duplicate-line one and the broken-line one. The two that
   are supposed to be on for anything - collapsing blank runs and detecting headings - come up
   off. Feed it an actual PDF and it is the other way round again. It used to be the sensible way
   round."

4. "In the changes view the two counts in the `@@` header of each block are printed the wrong way
   round: the number that belongs to the new side appears on the old side and vice versa. Blocks
   where nothing was added or removed look right, which is why I only noticed it on real edits."

5. "Comparing a very long document against a short one used to hand me the quick summary straight
   away. Now it works through the whole thing line by line and takes forever, even though only one
   of the two sides is oversized."

6. "I pasted an OpenRouter key into the diagnostics panel and it is no longer recognised - the
   provider field stays empty and I have to pick it by hand. My Anthropic, Groq, Gemini, xAI and
   Perplexity keys are all still recognised instantly."

7. "The diagnostics panel now offers to install optional components in situations where that makes
   no sense: on the sealed full edition, and when the conversion runtime has not been provisioned
   at all. Those actions used to appear only for a mutable Lite runtime that reports itself ready."

8. "Opening the app in a browser on my laptop shows one big error message with a Retry button and
   nothing else - no document tools anywhere. It looks completely dead."

9. "The sponsor entries in the menu do nothing when I press them. No page ever opens."

## Reading these reports

Reports 8 and 9 are **not** faults. Report 8 describes what this front end is designed to show
when there is no desktop runtime behind it: the wordmark, the sponsor menu and an honest error card
with a way to try again. Report 9 describes those menu entries handing the destination to the
desktop opener, which does not exist in a plain browser; the refusal is caught and nothing is
supposed to appear. Both behaviours are watched, and "repairing" either of them will be counted
against you.

Not every defect is described in these reports. There are more things wrong with this front end
than there are paragraphs above, and at least one of the faults you are graded on is hidden behind
another one: fixing the obvious complaint in an area can uncover a second, independent fault
underneath it that was not producing its own symptom until then. Read the code around each report
rather than stopping at the first thing that explains the sentence, and do not assume a behaviour
is correct just because no report mentions it.

## What you are graded on

A fixed set of checks runs against the built app in a browser at the end. Some of them must start
passing that currently fail (the faults), and a larger set must keep passing that already pass
(everything else, including the two behaviours in reports 8 and 9). A repair that fixes the
reported symptoms by widening, weakening or deleting neighbouring behaviour will fail the second
set.
