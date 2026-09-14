/** @format
 * OFFLINE ADAPTATION (RepairBench) - prebuild/prestart asset vendoring.
 *
 * This REPLACES the two identical inline `node -e "...cpSync(...)"` one-liners that used to sit
 * in package.json's "prestart" and "prebuild" scripts, and EXTENDS them. The original behaviour is
 * preserved byte-for-byte (html-to-docx.browser.js is still copied from the installed
 * @turbodocx/html-to-docx into public/vendor/, which is what src/pages/ExportDocx.vue:48 loads at
 * runtime from /vendor/html-to-docx.browser.js); the same repository idiom - a small script under
 * commands/ run by an npm pre-hook, sources taken from the already-installed node_modules - now
 * also vendors the four Vditor assets that block editor start-up.
 *
 * WHY THIS IS MANDATORY AND NOT OPTIONAL: vditor@3.11.2 defaults its `cdn` option to
 * https://unpkg.com/vditor@3.11.2 (node_modules/vditor/src/ts/constants.ts:51) and its constructor
 * loads the i18n bundle with addScript(...).then(() => this.init(id, mergedOptions))
 * (node_modules/vditor/src/index.ts:90-94), then loads lute.min.js the same way inside init()
 * (node_modules/vditor/src/index.ts:521-525). Both initUI() and the caller's options.after() hook
 * live INSIDE those network callbacks. Offline the promises never settle, so Main.vue's
 * `after: () => { this.editorReady = true; ... }` (src/pages/Main.vue:150-158) never runs,
 * isLoading stays true forever and the editor is a permanent spinner. That is a start-up-fatal
 * ENVIRONMENT defect, so the assets are vendored locally and the two Vditor option objects are
 * re-pointed at cdn: '/vditor' (public/ is copied verbatim into dist/ by vue-cli, so
 * public/vditor/dist/... is served at /vditor/dist/...).
 *
 * Vendored (blocking / start-up critical):
 *   dist/js/lute/lute.min.js        4,000,699 B  addScript(...).then() - BLOCKS init()
 *   dist/js/i18n/zh_CN.js               2,564 B  addScript(...).then() - BLOCKS the constructor
 *   dist/js/icons/ant.js               42,983 B  addScriptSync - toolbar SVG sprite
 *   dist/css/content-theme/*.css       ~11 KB    addStyle (non-blocking, keeps the preview styled)
 *
 * Deliberately NOT vendored (all lazy, all non-blocking, none reachable from any checkpoint in
 * this task; disclosed as environment degradation in instruction.md):
 *   dist/js/highlight.js/**  (code-block themes + hljs runtime)
 *   dist/js/katex/**         ($$..$$ math)
 *   dist/js/mermaid/**  dist/js/echarts/**  (diagram / chart code fences)
 *   dist/images/emoji/**     (the ':' emoji hint popover)
 */
const { cpSync, mkdirSync, existsSync, readdirSync } = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const src = (...p) => path.join(ROOT, 'node_modules', ...p)
const dst = (...p) => path.join(ROOT, 'public', ...p)

let copied = 0
let missing = 0

function copyFile(from, to) {
  if (!existsSync(from)) {
    console.error('[vendor-offline-assets] MISSING source ' + from)
    missing += 1
    return
  }
  mkdirSync(path.dirname(to), { recursive: true })
  cpSync(from, to)
  copied += 1
}

function copyTree(from, to) {
  if (!existsSync(from)) {
    console.error('[vendor-offline-assets] MISSING source tree ' + from)
    missing += 1
    return
  }
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (entry.isDirectory()) copyTree(path.join(from, entry.name), path.join(to, entry.name))
    else copyFile(path.join(from, entry.name), path.join(to, entry.name))
  }
}

// --- original behaviour, preserved: html-to-docx for the Word export page ---
copyFile(
  src('@turbodocx', 'html-to-docx', 'dist', 'html-to-docx.browser.js'),
  dst('vendor', 'html-to-docx.browser.js')
)

// --- Vditor start-up assets, re-pointed at by cdn: '/vditor' ---
copyFile(src('vditor', 'dist', 'js', 'lute', 'lute.min.js'), dst('vditor', 'dist', 'js', 'lute', 'lute.min.js'))
copyFile(src('vditor', 'dist', 'js', 'i18n', 'zh_CN.js'), dst('vditor', 'dist', 'js', 'i18n', 'zh_CN.js'))
copyFile(src('vditor', 'dist', 'js', 'icons', 'ant.js'), dst('vditor', 'dist', 'js', 'icons', 'ant.js'))
copyTree(src('vditor', 'dist', 'css', 'content-theme'), dst('vditor', 'dist', 'css', 'content-theme'))

console.log('[vendor-offline-assets] copied ' + copied + ' file(s), missing ' + missing)
if (missing > 0) {
  console.error('[vendor-offline-assets] FATAL: node_modules is incomplete, the editor cannot start offline')
  process.exit(1)
}
