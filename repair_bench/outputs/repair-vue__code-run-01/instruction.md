# Repair Task - code-run (Vue 3)

You are working on the source code of **code-run**, a purely front-end
online code runner built with Vue 3, Vuex 4, element-plus and monaco-editor
on a vue-cli/webpack 4 toolchain: users write HTML, CSS and JavaScript in
three side-by-side code editors, press 运行 to compile and run them in a
live preview frame, read the program output in the console panel below
(including a command line that evaluates expressions inside the running
preview), pick a preprocessor per editor, attach static resources, switch
workspace layout, code theme, page theme and font size in 设置, start from
one of the bundled 模板, export the project as a zip, and hand out a share
link that carries the whole project in the address bar. The project lives
in this workspace and is fully offline: dependencies are already installed,
build with `NODE_OPTIONS=--openssl-legacy-provider npm run build` (webpack 4
needs the legacy OpenSSL provider on modern Node), the bundle is written to
`docs/`, and that directory is served as the site root under the `/code-run/`
path prefix. There is no backend and no network access, so two things are
expected in this environment and are **not** defects: saving to / browsing
GitHub gists and the 登录 flow need the network and are out of verification
scope, and some bundled templates pull their runtime libraries from a public
CDN when they are run - those requests cannot succeed here, which does not
stop the template from being applied, edited or exported.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.

The reports, in no particular order:

1. "Every run looks like it is still going. The spinner in the console header
   never stops and the status line stays on 运行中... forever, even though my
   log lines do show up and the preview on the right has clearly refreshed.
   I never get the success line with the run time any more."

2. "The console colours look inconsistent to me. A normal output line, a
   warning line and an error line each come out in their own colour, and my
   warning shows up in a third style that nothing else uses. Shouldn't they
   all look the same?"

3. "The 更多 button at the top right is dead. I click it and nothing drops
   down, ever. The 工具 button right next to it still opens its menu fine, so
   it is not my browser."

4. "The address bar stopped following my work. I open one of those shared
   links, edit for a while, then copy the address bar to keep my progress -
   the copy still opens the old state I started from. And on a brand new
   project the address bar never picks anything up at all, so there is
   nothing worth copying."

5. "The code editors lost the little code thumbnail strip on the right edge
   that I am used to from other editors. Now it is just the code and the
   scrollbar. Can you get it back?"

6. "Templates only half work. I open 模板, click one, the dialog closes, but
   the preview keeps showing whatever I had before. Only when I press 运行
   myself does the template finally appear."

7. "生成分享链接 hands out a link that opens an empty project for whoever I
   send it to. My own page looks fine, but the link in that dialog obviously
   does not carry my code any more."

8. "The 自动运行 switch under 设置 → 其他设置 does nothing useful. I turn it
   on, keep typing in the JS pane, and it never runs by itself - I still have
   to hit 运行 every time. And after my next run there is a floating debug
   console inside the preview that I never asked for, and it stays there."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
