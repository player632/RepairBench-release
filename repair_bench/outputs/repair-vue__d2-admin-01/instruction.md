# Repair Task - d2-admin (Vue)

You are working on the source code of **d2-admin**, a Vue 2 admin
template built with vue-cli: hash-based vue-router routing, a vuex
store tree (theme, menu, size, locale, gray mode, multi-tab pages,
front-end log), element-ui components, a header with search hotkey,
theme picker, size switcher, locale picker and a user dropdown, a
collapsible sidebar, and a large set of demo pages under `/demo`.
The project in this workspace builds with
`NODE_OPTIONS=--openssl-legacy-provider npm run build` (a webpack
production bundle, output in `dist/`, served from that directory at
the site root). There is no backend to start and no network access.

QA collected a batch of user reports about this build. They are quoted
below roughly as users wrote them - with their own steps, noise and
assumptions. Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own
  root cause somewhere in the codebase. The root cause may sit in a
  different module than the one the symptom appears in.
- At least one report describes behavior that is actually intended;
  verify a report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors
  you break while fixing other things still count against you.

The reports, in no particular order:

1. "The theme button in the header is dead. I click the diamond icon
   expecting the theme picker window, and nothing opens at all. I
   cannot switch away from the default theme."

2. "The browser tab title always lags one page behind. When I go from
   the home page to the front-end log page, the tab keeps showing the
   home page title instead of the log page title. It only updates to
   the right name after my next navigation."

3. "Collapsing the sidebar works the first time, but then the toggle
   button goes dead. I click it again and the sidebar stays collapsed
   - it never comes back."

4. "On the gray mode demo page (the 灰度模式 entry under the demo menu), clicking
   the 切换灰度模式 button does nothing. The header label stays
   COLORFUL and the page never turns gray. The 打开/关闭 buttons next
   to it behave the same way as far as I can tell."

5. "Logging out from the user menu in the top right corner lands me on
   the login screen, but the address bar keeps a strange leftover like
   ?redirect=/log, as if the app first tried to send me to the log
   page. It should just go to the clean login page."

6. "On the count-up demo page (组件 > 数字动画), the last card - the
   one whose value updates one second after the first animation ends -
   counts from 0 to 50 and then animates all the way back down to 0
   instead of updating to 100."

7. "On the page-argument demo (参数传递), I fill in the send form and
   press 跳转到接收页面, and nothing happens. I stay on the send form,
   the address bar does not change, and the receiver page never shows
   the data I sent."

8. "The login screen footer says 2018 D2 Projects 开源组织出品. That
   year looks stale - shouldn't it be refreshed to the current year?
   It reads like leftover text someone forgot to update."
