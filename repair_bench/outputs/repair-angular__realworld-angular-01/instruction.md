# Repair Task - Conduit (Angular)

You are working on the source code of a **Conduit-style blogging app** built
with modern Angular (standalone components, signals, zoneless change
detection) and TypeScript. The project lives in this workspace; it builds
with `npm run build` (Angular CLI / esbuild) and the production output under
`dist/` is served as a static site. All content, accounts, favorites,
comments and tags are handled by a deterministic in-app fixture store; the
app is fully offline. A demo account exists: `wlb-user@example.com` with
password `password123`.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  file than the one where the symptom appears.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "I wasn't logged in and clicked the little heart on an article on the
   home page - I got sent to the sign-up page, fair enough. But then I
   signed in properly through the sign-in page and went back to the home
   page, and that article's favorite counter was one higher than it has any
   right to be. Like it favorited itself while I was logging in."

2. "Favoriting articles from the home page is broken. I click the heart on
   an article and instead of going up, the number goes down, and the button
   doesn't stay in the favorited state either. Unfavoriting does the
   opposite thing, it's all backwards."

3. "When I come back to the site and my old login is still saved, the top
   bar just says 'Connecting...' forever. No sign-in link appears, nothing
   ever loads, waiting doesn't help. I'm stuck on that screen."

4. "The two tabs on a profile page are swapped. On my own profile, 'My
   Posts' shows the articles I favorited, and 'Favorited Posts' shows the
   ones I wrote. Other people's profiles look swapped the same way."

5. "I wrote a comment under an article and then tried to delete it with the
   little trash icon. The comment doesn't go away, and on top of that an
   error bar appears above the comment section every time I try."

6. "On the settings page, if saving fails - I tried renaming myself to a
   name someone else already has - the error shows up, but then the whole
   form goes dead. I can't type in any field and can't try again; I have to
   reload the page to do anything."

7. "Not sure if this counts as a bug: right after the home page loads, the
   right sidebar flashes 'Loading tags...' for a split second before the
   tags show up. It looks like it didn't finish loading at first."

8. "After I publish a new article the site takes me straight to the
   article's page. I'd rather stay in the editor and keep writing - can't
   it just leave me where I was?"

Your task is to **fix the defects behind these reports** - verify each
report first, keep the intended behaviors intact.

## Constraints

- Keep your changes minimal and semantically scoped to each defect.
- Do not change any behavior that is not actually defective.
- Do not remove, rename or repurpose any `data-testid` attributes - they are
  verification probes required by the checker.
- The app must remain buildable with `npm run build`.
- The application must stay fully offline-capable; do not introduce network
  requests, and do not add new packages or libraries.
- Do not run the project's build or tests to verify yourself during the
  session; a separate verifier rebuilds and drives the app. Focus on reading
  the code and fixing root causes.

## How your work is verified

The verifier rebuilds the app, serves it in a headless browser, and drives
it through a fixed script of interactions covering the application's
behavior. Your score reflects **how many of the defective behaviors you
actually fix** (fail-to-pass) while keeping the already-working behaviors
intact (pass-to-pass). Fixing only some of the defects gives partial credit.
You cannot see the interaction script or its expectations while solving.

## Context

- Build: `npm run build` (Angular CLI, esbuild; `node_modules` is already
  installed)
- Output: `dist/angular-conduit/browser/` (static SPA with history fallback)
- Task type: `repair` (multiple independent defects)
