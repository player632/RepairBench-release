# Repair Task - quizify (Angular + TypeScript)

You are working on the source code of **quizify**, a quiz web app built with
Angular 15 and Angular Material. The project
lives in this workspace; it builds with `npm run build` and the result is
served as a static site under the `/quizify/` base path. In this deployment
the app is fully client-side and completely offline: all quizzes, users and
accounts come from a local, browser-side data store that is seeded with the
same demo content on every fresh start (a handful of categories, three
quizzes, and the `demo` account). There is no real backend and no network
access; keep it that way.

Quick orientation with the app itself: the home page promotes one quiz and
lists the categories with their quiz counts. Taking a quiz shows one
question at a time with a running timer; when the last answer is picked the
app moves to a results screen with the score. Visitors can register and log
in, see their own quizzes on the profile page (take / edit / remove / share
them), and create new quizzes with a category picker. Quiz links can point
at a quiz directly in the URL, either as `.../#/quiz/<id>` or in the
`.../#/quiz?id=<id>` form that our internal documentation still recommends.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you
  break while fixing other things still count against you.

The reports, in no particular order:

1. "Something broke the results screen. Whenever I answer the last question
   of any quiz, instead of showing my score the app just throws me back to
   the home page. I never get to see how I did."

2. "This goes back to when the results screen still showed up: my score
   never matched what I had clicked. I definitely answered the very first
   question, but the app acted as if I had skipped it, and every answer
   after that seemed to belong to the wrong question."

3. "A friend and I compared notes after the same quiz: she had two out of
   three right, but the site displayed '1 / 3' for her. It honestly looks
   like the results screen counts the questions you got wrong instead of the
   ones you got right."

4. "A colleague sent me a quiz link in the `?id=` form that our internal
   docs still recommend, and it always opens the 'Quiz not found' screen.
   The normal links you click on the home page work fine - it's only this
   link form that is broken."

5. "I can't delete my own quizzes anymore. On my profile page I click the
   remove button, the confirmation box appears, I press Yes - and the quiz
   is still in the list afterwards."

6. "When I make a new quiz and pick a category from the suggestion list,
   the quiz never shows up on that category's page later. If I leave the
   prefilled default category alone, everything lands where it should."

7. "The share link that appears after creating a quiz seems broken: people
   who open it land somewhere outside the app instead of on the quiz. The
   address it shows just doesn't look like our app's usual links."

8. "On the home page the little pictures on the category tiles look like
   plain line drawings to me. I remember this app having colorful images
   there - has something been lost?"

9. "After I logged out and logged back in, I panicked for a moment that my
   own quizzes might be gone - the profile page took a moment to load. Can
   you double-check that nothing gets lost when you log out and back in?"


## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
