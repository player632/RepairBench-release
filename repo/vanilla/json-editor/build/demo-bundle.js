/*
 * demo-bundle.mjs - bundle the advanced demo into dist/ so the built library
 * can be served (and verified) fully offline from the dist/ directory.
 * Rewrites the CDN script reference to the locally built bundle and copies
 * the demo's $ref schema fixtures next to the page.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const dist = path.join(root, 'dist')
fs.mkdirSync(dist, { recursive: true })

let html = fs.readFileSync(path.join(root, 'docs', 'advanced.html'), 'utf8')
const cdn = '<script src="https://cdn.jsdelivr.net/npm/@json-editor/json-editor@latest/dist/jsoneditor.min.js"></script>'
if (!html.includes(cdn)) throw new Error('demo-bundle: CDN script tag not found in docs/advanced.html')
html = html.replace(cdn, '<script src="jsoneditor.js"></script>')
fs.writeFileSync(path.join(dist, 'index.html'), html)

for (const f of ['basic_person.json', 'person.json']) {
  fs.copyFileSync(path.join(root, 'docs', f), path.join(dist, f))
}
console.log('demo-bundle: dist/index.html + schema fixtures ready')
