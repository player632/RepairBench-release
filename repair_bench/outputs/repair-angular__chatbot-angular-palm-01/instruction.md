# Repair Task - chatbot-angular-palm (Angular 16 + Angular Material + TypeScript)

You are working on the source code of **chatbot-angular-palm**, a small
single-page chat client built with Angular 16 standalone components, Angular
Material and TypeScript. There is no router, no account and no persistence: one
screen, one conversation.

The screen is a fixed shell. Almost all of it is the transcript - a scrollable
region that holds the conversation. While the conversation is empty it shows a
centred welcome panel that reads "Welcome to PaLM ChatBot / Write a text to
start.". Pinned across the bottom is the composer: a Material text field with
the placeholder "Send a message", and next to it a round icon-only button whose
icon is the paper-plane ligature `send`.

Every message in the transcript is one row. A row is a horizontal pair: a round
50 x 50 avatar image on the left (a different picture for you and for the
assistant) and the message text beside it. Your own rows are tinted light blue,
the assistant's rows are tinted lavender, and the tint comes from the row's
per-agent styling. When you send a message the app immediately shows your row
plus a temporary placeholder row whose text is three dots, styled so that it
pulses (fades in and out) for as long as the answer is in flight; when the
answer arrives the placeholder is removed and the assistant's row takes its
place, so a settled conversation holds exactly your row and the answer.

Sending happens in two ways and only two: pressing **Enter** in the text field,
or clicking the send button. Both send whatever the field currently holds, and
both are supposed to leave the field EMPTY afterwards so the next message starts
from nothing. Typing without pressing Enter must not send anything. The
assistant answers every message with a short rhyming poem; answers may be one,
two or three lines long, and each line of an answer is displayed on its own
line.

Clicking send with an empty field is a real, supported path: your (empty) row
appears, the request is made, the backend rejects it with a "content not
provided" error and no answer row is added. The button is not disabled before or
after that, and that is intended.

The project builds with the Angular CLI (`ng build`, production configuration,
AOT plus a strict TypeScript and strict template type-check), and the verifier
serves the result from `dist/chatbot-angular-palm/` at the site root.
Dependencies are provisioned offline by the harness.

Environment notes - properties of this offline harness, not defects:

- There is **no network access**, and nothing in this project needs it. The
  assistant backend is answered locally at the HTTP layer by the harness, with
  frozen deterministic replies, so the same message always gets the same answer
  on every run and every machine. That is a property of the test environment:
  do not remove it, replace it with a real call, or route around it.
- This offline build performs **zero remote-origin requests**. The upstream
  project used to fetch webfonts from a CDN; those remote references are gone
  here, while the stylesheet declarations that name the font families are
  unchanged, so text renders with the local fallback. That is intended, not a
  defect, and re-adding a remote reference would be a regression.
- The harness drives the app in a real browser at a **1440x900 viewport**, with
  a spoofed desktop user agent. Every checkpoint starts from a **fresh browser
  context**, so nothing carries over between checks; the app itself persists
  nothing between loads - no local storage, no session storage, no cookies, no
  URL state.
- The build is a strict AOT build: every file must still type-check and every
  template binding must still be type-correct when you are done.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root cause
  somewhere in the codebase. The root cause may sit in a different file than the
  one the symptom appears in, and a single reported symptom can have more than
  one root cause behind it.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports (并非所有缺陷都有报告提及).
  Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any `data-rb-*` attributes - they are
  verification probes required by the checker. They are inert markup: they carry
  no styling and no behaviour.

The reports, in no particular order:

1. "the little three-dot bubble never goes away. I send a message, the answer arrives underneath it, and the dots stay on screen above the answer forever - after five messages I have five rows of dots stacked in the middle of the conversation. It used to disappear the moment the reply landed."

2. "multi-line answers are broken. When the bot sends something with three lines, only the first line break happens and the rest of the poem runs together on one line. Short two-line answers still look right, which is why I only noticed it on the longer ones."

3. "the input box sends my message whenever I press ANY key, not just Enter. I press Enter to send, then start typing the next message and the first letter fires off another copy of what I had just sent. Two identical bubbles in a row, and the bot answers both."

4. "after I send something the text stays in the box. It used to clear itself. Now I have to select it and delete it by hand, and if I forget and hit the send button again it posts the same sentence twice."

5. "the waiting dots used to pulse - they faded in and out the whole time the bot was thinking. Now they fade in once and then just sit there frozen, so I cannot tell whether it is still working or has hung."

6. "the welcome hint disappears while I am still typing my first message. The moment I put a single character in the box the 'Welcome / Write a text to start' panel is gone, even though I have not sent anything yet. It used to stay until the message actually went in."

7. "This might be me misunderstanding the app, but: when the page opens there is only the welcome panel - the bot never says hello first, and nothing at all happens until I send something. I half expected a greeting bubble from the assistant on load. Is that a bug, or is an empty conversation the intended start?"

8. "Following on from the send button: it has no text label, just the little paper-plane icon, and it is never greyed out. I can click it with a completely empty box and it happily 'sends' nothing, which puts an empty bubble in the conversation and gets no answer back. Shouldn't it be disabled until there is text?"

Work in the source tree, repair the root cause of each real defect, leave the
intended behaviors alone, and keep the rest of the seed's behavior intact -
including the welcome panel and its copy, the fixed shell and the scrollable
transcript, the composer and its icon-only send button, the two agent avatars,
the per-agent row tinting, the placeholder lifecycle, the poem answers and their
line breaks, none of which any single report describes in full. The project must
still build with the command above when you are done.
