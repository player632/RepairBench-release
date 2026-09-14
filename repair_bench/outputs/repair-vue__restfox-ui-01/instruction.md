# Repair Task - Restfox (Vue)

You are working on the source code of **Restfox**, a local-first HTTP
client built with Vue 3: users organize request collections into
workspaces and folders, configure environments with variables, compose
requests with query parameters, headers, bodies and basic
authentication, send them, inspect the responses with their status
badges, attach test scripts that run after each response, and batch-run
folders with the collection runner. This workspace is the
web-standalone edition: the project builds with
`npm run build-web-standalone` (production bundle in `dist/`, served
from that directory at the site root), and every outgoing request is
routed through a same-origin proxy endpoint provided by the serving
harness, which answers deterministically. There is no other backend to
start and no external network access.

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

1. "When I press send, the response area simply stays empty. The
   request clearly goes out, but no status, no body, nothing ever
   appears in the response panel. Only if I reload the whole app and
   reopen the request does the last saved response finally show up.
   It used to appear right after sending."

2. "The severity colors on response badges look mixed up. A client
   error like a 404 shows up in the red server-error color, while an
   actual 500 from the server gets the yellowish warning color. As far
   as I remember it was the other way around."

3. "I often send the same request several times in a row to compare
   results. The response history for a request used to put the newest
   response on top, but now the oldest one sits on top and my latest
   send ends up at the bottom of the list. I keep clicking the wrong
   entry."

4. "When I type query parameters directly into the URL bar, the Query
   section below takes ages to pick them up. I finish typing, sit and
   wait, and only long afterwards do the parameters finally appear in
   the list. It should sync almost instantly."

5. "I usually keep several requests open at once. Lately, when I
   switch one request to a specific editor section - say the header
   tab - and then open another request, that new request shows the
   same section too, instead of starting on the default body view.
   It is as if the previous request's panel state carries over."

6. "The create menu in the sidebar misbehaves: I choose the entry for
   creating a new request, and the dialog that opens asks me for a
   folder name instead. I have to cancel and look for another way to
   create a plain request."

7. "Switching the active environment in the top bar does not seem to
   apply right away. The next request I send still resolves variables
   from the environment I was using before. Only after reloading the
   app does the newly selected environment take effect."

8. "The star counter in the top bar shows 0 and I am convinced it is
   broken - should it not count something? It never moves from zero,
   no matter what I do."

9. "The app never asks me to log in. I open it and I am straight
   inside my collection without entering any credentials. Is login
   broken, or is it supposed to work like that?"

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
