export const VARIANT_FORM_VERSION = '3.0.10'

//export const MOCK_CASE_URL = 'https://www.fastmock.site/mock/2de212e0dc4b8e0885fea44ab9f2e1d0/vform/'
export const MOCK_CASE_URL = '/rb-inert/vcase/'  // rb-adapt: was a cross-origin ksyuncs CDN prefix (form-designer/index.vue:228 axios.get); evaluation runs with allow_internet=false, so the request could only hang or fail by timeout. Same-origin inert path: identical control flow, no egress, deterministic.

//export const ACE_BASE_PATH = 'public/lib/ace/src-min-noconflict'
export const ACE_BASE_PATH = '/rb-inert/ace-mini'  // rb-adapt: ace.config.set('basePath', ...) in code-editor/index.vue:47 makes every editor fetch its dynamic worker/mode chunks from this base. Offline that is 8 cross-origin hangs per dialog; the ace modes this seed uses (javascript/json/css) are STATICALLY imported at code-editor/index.vue:15-17, so text still renders and edits still round-trip. Same-origin inert path: no egress, same rendered behaviour.

export const BEAUTIFIER_PATH= '/rb-inert/js-beautify/beautifier.min.js'  // rb-adapt: loadRemoteScript(BEAUTIFIER_PATH) in utils/beautifierLoader.js:72 appends a cross-origin <script>. Offline the callback never fires, so the 生成SFC dialog is dead either way - this only moves the doomed request from a cross-origin hang to a same-origin 404. No checkpoint exercises 生成SFC (see meta.json adaptation ledger).
