Repair task: a browser weather dashboard

## The page you are repairing

What you have is a weather dashboard shipped as plain browser JavaScript. There is no framework, no bundler, no transpiler, no type step and no dependency directory anywhere in the tree. One document at the root of the tree loads seven scripts of its own, each as a module, and after them a third-party slider library that ships inside the tree together with a short configuration script for it. The tree is served straight off the disk: the directory that is served is the source directory, nothing is compiled first and nothing is fetched from anywhere else, so the files you read are the files that run.

Every style, font, icon and picture the page uses is already inside the tree, including one stylesheet that a stylesheet tool would normally generate for you - that one is generated and committed, and no build step in this pipeline produces it. The manifest and the lock file that sit next to the document belong to that tool's development workflow; the running page never reads them.

The page has two screens. On a first visit, when no city has been chosen yet, it shows a choice screen: one button that takes the city from the visitor's own network address, and one button meaning that suggestion is wrong, which opens the way to either pick a city from a preset list or type a name in yourself. Once a city has been set the page remembers it, so a later visit goes straight to the dashboard.

The dashboard carries a heading with the city name and a clock that ticks once a second; a main panel with the big current temperature, a short description of the conditions, a picture, and a row of smaller readings beside it; a strip of seven hour cards, each with its own picture, hour and condition, which a visitor can swipe along and can click to pull that hour up into the main panel; a menu that switches the whole page between a dark look, a light look and following the device's own setting; a button that opens a small form for changing the first city or adding a second one; and a second panel that stays empty and out of the way until a second city has actually been added.

The page reads three small data files that live inside the tree, over the same origin: one for the local time of the chosen city, one for the forecast, and one for the network-address lookup. They stand in for the three upstream services the page used to call, and that substitution is part of the harness and is already done. Everything a visitor sees is then produced by the page's own logic out of those files - which picture belongs to which hour, how a temperature is turned into a whole number, how an hour is printed, which slice of the forecast the strip is given, what a click on a card means, which blocks of the choice screen appear and when. So when a figure or a picture on screen is wrong, the logic that produced it is what needs to hold; the data files are not the thing to adjust.

## What visitors reported

Nine reports came in. They are quoted as their authors wrote them. They are starting points, not diagnoses: they are not always precise, they do not always say which of several similar things is affected, and they do not always agree with each other.

1. The big temperature number on the main panel is always one degree higher than it should be. I checked it against the same reading somewhere else and the raw value is twenty-one point something, but the page prints twenty-two. Every other number on that panel looks fine, it is only the big one.

2. The last card in the hourly strip never fills in. The six before it show the right weather and the right hour, but the seventh one just keeps showing whatever the page shipped with - the same placeholder picture and the same placeholder hour - no matter which city I pick or how long I wait.

3. Clicking an hour card shows the wrong hour up top. If I tap the card that says four o'clock, the main panel changes to the seven o'clock weather instead - the highlight stays on the card I tapped, so it is not that I mis-clicked. And when I tap the very last card the main panel does not change at all, it just sits there.

4. Every hour in the hourly strip now says half past. It is a three-hourly forecast so the cards used to read on the hour - thirteen oh-zero, sixteen oh-zero and so on - and now they all read half past, which is not a time this forecast ever reports.

5. In the little menu that picks how the page looks, when I choose Dark the tick lands on the 'use device settings' row instead of the Dark row. The page does go dark, so the look itself is applied - it is just the menu that marks the wrong row, and it makes it look like my choice was not remembered.

6. Light mode does not work any more. I open that same menu, choose Light, the row gets ticked and the menu closes, but the page stays dark. Choosing Dark works, and 'use device settings' also ends up dark. It stays dark after a reload too.

7. On the first-run screen I tap 'wrong' to pick my own city. The drop-down of preset cities appears and the Continue button appears, but the 'enter custom city' box never shows up at all - no label, no text field, nothing. So the only way to set my city is to pick one from the preset list.

8. Your markup is invalid: the same id is used on two different elements in six places - the panel that holds wind, humidity and the two temperatures has one set of ids, and the second-city panel below it has another set with exactly the same ids. There are also two elements with the same id as the page wrapper and two loading overlays. A validator flags all of it. Please make the ids unique.

9. This thing writes to the browser storage all over the place - my city, which look I picked, a whole copy of the forecast, and another copy of the seven hours it is showing. That is a privacy problem and it also means the page behaves differently on a reload. Please remove the storage entirely and keep everything in memory.

## Not every defect is described in these reports

Not every defect is necessarily mentioned in the reports above, and some of the reports above describe things that are not wrong at all. There are more things wrong with this tree than there are reports, so fixing only what is listed will not finish the job.

Read the page's own logic through, work out what each part of it is supposed to do, and check the parts nobody wrote in about: which of the two pictures an hour belongs to, how a name a visitor typed is judged acceptable or not, which of two fields a lookup result gets written out of, how many letters a name needs before a button stops being greyed out, what is written into one field when a rival field takes over, and anything that only shows up after a short delay or after a same-origin read has actually finished.

Behaviors you break while fixing other things still count against you, including in regions no report mentions. Equally, do not change something that was never broken: a report that describes correct behaviour is a trap, and editing correct code to match it costs you the checks that were guarding it.

## Things that are not faults

1. The three data files inside the tree are the harness's stand-ins for three upstream services. The substitution is already done and is not a fault. Those files are data, not part of the examined surface, and none of them is faulty: do not adjust a number in one, do not add a file of your own, do not delete one, do not move them, and do not restore a call to any service outside the tree.
2. The tree still carries a few credential strings left over from when the page called those services. Nothing reaches the network now, so they are inert. They are not a fault, not something to rotate and not something to clean up: leave them exactly where they are.
3. There is no build and nothing to install. The stylesheet a tool would generate is already generated and sitting in the tree, and the manifest and lock file belong to that tool's development workflow. Do not add a build step, do not run one, do not regenerate a stylesheet, and do not add a dependency.
4. The strip of hour cards is laid out and swiped by a third-party library that ships inside the tree, plus a short configuration script for it. Neither is faulty. The page builds the cards and fills them in; the library only moves them around. Do not edit the library, do not replace it, do not rebuild the strip by hand and do not bring in another one.
5. With no city chosen yet the page shows the choice screen instead of the dashboard, and once a city has been set it remembers that and goes straight to the dashboard on a later visit. That is how it ships. Do not remove the choice screen, do not bypass it, and do not pick a city on the visitor's behalf.
6. On the choice screen the blocks a visitor unlocks come into view one after another after short delays rather than all at once, and the button that carries on stays greyed out and disabled until the name in the field is acceptable. That staging is shipped behaviour, not a fault. Do not remove the staging, do not make every block visible from the start, and do not leave a control permanently enabled or permanently disabled.
7. The page can carry a second city beside the first. Until a visitor adds one, that panel is empty and out of the way and the button that adds one is what shows in its place. That is by design. Do not remove the feature, do not fill the panel in by default and do not show both at the same time.
8. The page offers three visual settings: a dark look, a light look, and following the device. Following the device means the page can legitimately come up either way depending on the machine it runs on, and whichever setting a visitor chose survives a reload. None of that is a fault. Do not cut the three settings down to two, do not hard-code one look and do not remove the menu.
9. Every condition has a daytime picture and a night-time picture and both ship inside the tree; which of the two belongs to a given hour is worked out by the page. The pictures themselves are not faulty. Do not replace one, do not add any, do not fetch any from outside, and do not collapse the two sets into one.
10. The clock prints hours, minutes and seconds and ticks once a second, and the forecast the page is given is three-hourly, so the hours it reports are three hours apart. Neither is a fault. Do not change the tick, do not change the spacing of the forecast, and do not rewrite or translate shipped copy.
11. The page keeps what it needs to remember between visits in the browser's own storage, and it reads that back when it starts. That is how it ships. Do not move that state somewhere else, do not invent a preferences layer of your own, and do not put anything in the address bar.

## Ground rules

- Do not remove, rename or repurpose any `data-testid` attribute, and do not add one. They carry no behaviour; they are how the page is addressed while it is being examined, and they must survive your repair exactly where they are.
- The page runs with no network at all and must keep doing so. Everything it needs is already inside the tree. Do not add a remote reference of any kind, do not assume anything can be downloaded, and do not reintroduce a library, a font, an icon set, a stylesheet, a picture or an endpoint from outside.
- Repair the behaviour a visitor experiences. Do not special-case the examination, do not add flags, hidden state or a hard-coded branch keyed on a test identifier, and do not leave anything on the global scope that was not there before.
- Do not delete shipped content, copy, cards, panels, buttons, menus or data files to make a symptom go away, and do not reorder or rebuild a region unless the report you are answering is about that region's order.
- Keep every change inside this tree's own files. When you are done the page must still load and run exactly as it does now: no build step, no new dependency, no network access, and the same document reachable at the same address.
- While you are answering, do not run this project's own test, build or serve commands and do not start a browser of your own to check yourself. The grading harness measures the page for you, and a fix that only holds up under your own private way of running it is not a fix.
