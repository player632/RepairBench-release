# Repair Task - threejs-editor (Vue 3 + three.js)

You are working on the source code of **threejs-editor**, a browser-based
low-code 3D scene editor built with Vue 3, Element Plus and three.js on top
of an editor kernel package, bundled by Vite. The editor is a single route
(`/#/editor`) laid out as: a top header (a scene dropdown with a per-scene
delete cross, a "新建场景" naming dialog, local and online model import,
template-JSON export, GLB export, snapshot, control panel and a save button,
with the current scene name printed next to the logo); a left library panel
(four icon categories - bundled example scenes, models, lights, effect
components - a search box, and the entry list of the active category, where
clicking an entry brings it into the scene); a centre 3D viewport with a
toolbar above it (a "子级" child-pick checkbox, the five tool buttons 选中 /
平移 / 旋转 / 缩放 / 预览, undo and redo); a right panel (the scene tree - one
row per scene object with an eye icon to hide or show it, a name you
double-click to retype, and a trash icon behind a confirm popup - then a
sky/environment material set with thumbnails, render options for pixel ratio,
logarithmic depth buffer, show grid and show axes, a stats readout for
objects / vertices / triangles, and quick links); and a bottom bar with the
预览 / 右键菜单 / 快捷键 switches, a share link and the keyboard shortcut
card. Scenes are kept in the browser's local storage, and the state held by
the 3D kernel (which tool is armed, whether the grid and axes helpers are
drawn, whether child picking and hotkeys are on) is meant to be mirrored back
into the toolbar and the panels.

The project lives in this workspace and is fully offline: install with
`npm install`, build with `npm run build` (Vite writes the bundle to `docs/`,
which is served as the site root; the app is reached at `/#/editor`). There is
no backend and no network access, so a few things are out of verification
scope by design: the bundled example scenes and the model library entries
point at paths and remote files that cannot load here, the sky/environment
material sets ship without image URLs in this build, and the export /
snapshot / share buttons trigger browser downloads or new tabs.

QA collected a batch of user reports about this build. They are quoted below
roughly as users wrote them - with their own steps, noise and assumptions.
Treat them as starting points, not as diagnoses:

- Most reports describe real, reproducible defects, each with its own root
  cause somewhere in the codebase. The root cause may sit in a different
  module than the one the symptom appears in.
- At least one report describes behavior that is actually intended; verify a
  report before changing anything because of it.
- Not every defect is necessarily mentioned in the reports. Behaviors you break while fixing other things still count against you.
- Do not remove, rename or repurpose any data-testid attributes - they are verification probes required by the checker.

The reports, in no particular order:

1. "The category icons on the left library stopped working. I click the sun
   icon to get at the lights and the label under the icon highlights like it
   should, but the list below never changes - it stays the long list of
   example scenes that greets me when the page opens. Same story for the
   components and the models icons. The oddest part: if I click a category
   and then reload the page, the list is suddenly the right one."

2. "The 缩放 tool is dead. I select an object, click the scale button in the
   toolbar above the viewport - it takes the click - but the gizmo in the 3D
   view keeps showing the move arrows. Move and rotate switch over fine, and
   选中 / 预览 behave too."

3. "Deleting only half works. In the scene tree on the right I click the trash
   icon on a row, confirm the popup, and the object does disappear from the 3D
   view - but its row stays in the tree list forever. Clicking the leftover
   row does nothing at all."

4. "Nothing I bring into the scene ever shows up in the tree on the right. The
   tree keeps exactly the one entry that was there when the page loaded, even
   though the new things are plainly in the 3D view - I imported a model from
   a local file and I can see it, I can even grab it with the gizmo, the tree
   just refuses to list it."

5. "The toolbar does not follow the keyboard. The shortcut card at the bottom
   says R / T / G arm rotate / move / scale and Tab flips between transform
   and select. When I use them the gizmo in the viewport really does change,
   but the highlighted tool button up top never moves - it stays on whatever I
   last clicked with the mouse. It is like the toolbar only listens to my
   clicks."

6. "The new scene dialog is broken. I click 新建场景, type a name, press 确认:
   I get the green success toast and the new name does turn up in the scene
   dropdown at the top left. But the scene name printed in the header next to
   the logo still shows the previous scene, and the dropdown still has the
   previous one selected - so I never actually land on the scene I just
   created."

7. "I think the default scene ships with debug leftovers. Every time I open
   the editor on a fresh browser profile there is a big grey grid and a set of
   coloured axis lines sitting in the middle of the viewport, and the scene is
   otherwise empty. Should a clean install really show that?"

8. "The stats readout at the bottom of the right panel is stuck on zeros:
   物体 0, 顶点 0, 三角面 0. The scene tree right above it clearly lists an
   entry, so the counters cannot be right - they never move off zero."

## Constraints

- Do not run the project's build, dev server or tests to verify yourself
  during the session; a separate verifier rebuilds and drives the app. Focus
  on reading the code and fixing root causes.
