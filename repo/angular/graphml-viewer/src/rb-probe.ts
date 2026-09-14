// rb-probe.ts - RepairBench observation bridge for
// repair-angular__graphml-viewer-01 (seed: graphml-viewer / angular.json project
// "abhi-cyto", Angular 8.2 ViewEngine, TypeScript 3.5).
//
// This file is INSTRUMENTATION ONLY. It is imported by src/main.ts and publishes
// W.__RB__, a bridge the checkpoint harness uses to (a) drive the app through
// its own public handlers, (b) read back state that the canvas renderer never
// exposes as text, and (c) freeze transient values into constants so that every
// assertion in tests/dsl.json is a pure, scalar read.
//
// Rules this file obeys:
//   * nothing here changes app behaviour. The three installed spies (file-input
//     click, anchor click, snack-bar observer) only RECORD; the file-input and
//     anchor clicks are suppressed because a headless harness cannot service a
//     native file dialog or a download, and both suppressions happen strictly
//     downstream of the code under test.
//   * every reader is wrapped so a half-rendered page yields a neutral value
//     (-1 / '' / false) instead of throwing: a behaviour failure must never
//     degrade into an unattributable runner error.
//   * TypeScript 3.5 only: no optional chaining, no nullish coalescing, no
//     Object.fromEntries, no String.matchAll, no Array.flat.
//   * no position, pixel or clock value is ever exported as an assertion target.
//     Layout geometry is only readable through the concentric layout's own
//     configuration callbacks, which return exact integers.

const W: any = window;

// ---------------------------------------------------------------- state
let appRef: any = null;
let appComp: any = null;
let vis: any = null;
let dnd: any = null;
let dndDir: any = null;
let tickNudges = 0;
const latch: any = {};
const anchorLog: any[] = [];
let pickerClicks = 0;
const snackSeen: string[] = [];
let searchEmit: any[] = [];
let searchSub: any = null;
let sampleText = '';

// ---------------------------------------------------------------- utilities
function sleep(ms: number): Promise<any> {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
function q(sel: string): any {
  try { return document.querySelector(sel); } catch (e) { return null; }
}
function qa(sel: string): any[] {
  const out: any[] = [];
  try {
    const nl: any = document.querySelectorAll(sel);
    for (let i = 0; i < nl.length; i++) { out.push(nl[i]); }
  } catch (e) { /* bad selector -> empty */ }
  return out;
}
function tid(id: string): any {
  return q('[data-testid="' + id + '"]');
}
function norm(v: any): string {
  if (v === null || v === undefined) { return ''; }
  return String(v).replace(/\s+/g, ' ').trim();
}
function num(v: any, fallback: number): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}
function remember(key: string, value: any): void { latch[key] = value; }
function recall(key: string): any { return latch[key]; }
// Zone.js does not necessarily patch FileReader.onload, so the screen swap that
// follows an upload can sit waiting for the next zone-scheduled macrotask. The
// harness therefore nudges change detection explicitly instead of guessing how
// long to sleep; every nudge is counted so the measurement log shows whether it
// was ever needed.
function nudge(): void {
  if (!appRef) { return; }
  try { appRef.tick(); tickNudges = tickNudges + 1; } catch (e) { /* recursive tick - ignore */ }
}
async function poll(get: any, ms: number): Promise<any> {
  const t0 = Date.now();
  let v: any = null;
  while (Date.now() - t0 < ms) {
    v = get();
    if (v) { return v; }
    await sleep(90);
    nudge();
  }
  return get();
}
function countTag(hay: string, needle: string): number {
  let n = 0;
  let i = 0;
  const h = String(hay);
  while (true) {
    const j = h.indexOf(needle, i);
    if (j < 0) { break; }
    n = n + 1;
    i = j + needle.length;
  }
  return n;
}
function childTagCount(parent: any, tag: string): number {
  if (!parent) { return 0; }
  let n = 0;
  const kids = parent.children;
  for (let i = 0; i < kids.length; i++) {
    if (String(kids[i].tagName).toLowerCase() === tag) { n = n + 1; }
  }
  return n;
}
function rowTexts(tableSel: string, cellIndex: number): string {
  const t = q(tableSel);
  if (!t) { return ''; }
  const tb = t.querySelector('tbody');
  if (!tb) { return ''; }
  const rows = tb.querySelectorAll('tr');
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td');
    if (cells.length > cellIndex) { out.push(norm(cells[cellIndex].textContent)); }
  }
  return out.join(',');
}
function rowCount(tableSel: string): number {
  const t = q(tableSel);
  if (!t) { return -1; }
  const tb = t.querySelector('tbody');
  if (!tb) { return -1; }
  return tb.querySelectorAll('tr').length;
}

// ---------------------------------------------------------------- spies
// A headless harness cannot answer a native file dialog, so the hidden
// <input type=file> click is recorded and swallowed. Everything upstream of it
// (the template's (click) binding on the drop box) still runs for real, which is
// exactly what the F05 checkpoint measures.
function installPickerSpy(): void {
  try {
    const proto: any = (HTMLInputElement as any).prototype;
    const orig = proto.click;
    proto.click = function () {
      const self: any = this;
      if (self && String(self.type).toLowerCase() === 'file') {
        pickerClicks = pickerClicks + 1;
        return;
      }
      return orig.apply(self, arguments as any);
    };
  } catch (e) { /* prototype sealed - the harness degrades to direct file injection */ }
}
// download_graphml / download_json / download_images / downloadSampleGraphml all
// build a transient <a>, click it and remove it. Recording the href + download
// name lets a checkpoint verify the payload, and swallowing the click keeps a
// real download (and its anchor residue) out of the page.
function installAnchorSpy(): void {
  try {
    const proto: any = (HTMLAnchorElement as any).prototype;
    const orig = proto.click;
    proto.click = function () {
      const self: any = this;
      anchorLog.push({ href: String(self.getAttribute('href') || ''), download: String(self.getAttribute('download') || '') });
      return;
    };
  } catch (e) { /* ignore */ }
}
// Snack bars live ~1000ms inside a CDK overlay, so a checkpoint that wants to
// know whether one appeared cannot poll for it reliably. Observe instead.
function installSnackSpy(): void {
  try {
    if (!document.body) { return; }
    const mo = new MutationObserver(function (muts: any) {
      for (let i = 0; i < muts.length; i++) {
        const added = muts[i].addedNodes;
        for (let j = 0; j < added.length; j++) {
          const n: any = added[j];
          if (!n || !n.querySelectorAll) { continue; }
          if (n.classList && (n.classList.contains('mat-simple-snackbar') || n.classList.contains('mat-snack-bar-container'))) {
            const t = norm(n.textContent);
            if (t && snackSeen.indexOf(t) < 0) { snackSeen.push(t); }
          }
          const bars = n.querySelectorAll('.mat-simple-snackbar, .mat-snack-bar-container');
          for (let k = 0; k < bars.length; k++) {
            const t = norm(bars[k].textContent);
            if (t && snackSeen.indexOf(t) < 0) { snackSeen.push(t); }
          }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------- registration
function setBootRef(ref: any): void { appRef = ref; }
function registerApp(c: any): void { appComp = c; }
function registerVisualiser(c: any): void { vis = c; }
function registerDnd(c: any): void { dnd = c; }
function registerDndDir(d: any): void { dndDir = d; }

// ---------------------------------------------------------------- fixtures
// Two renderings of the SAME six-node graph. rb_yed uses yEd-style numeric key
// ids (d0..d4) that only become human attribute names through the uploader's
// <data key> rewrite; rb_main declares key ids that already equal attr.name, so
// the rewrite is a no-op and the fixture is immune to it. Every checkpoint that
// is not specifically about the rewrite uses rb_main.
const FX_MAIN = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
  '  <key id="name" for="node" attr.name="name" attr.type="string"/>',
  '  <key id="gender" for="node" attr.name="gender" attr.type="string"/>',
  '  <key id="node_shape" for="node" attr.name="node_shape" attr.type="string"/>',
  '  <key id="score" for="node" attr.name="score" attr.type="int"/>',
  '  <key id="relation" for="edge" attr.name="relation" attr.type="string"/>',
  '  <graph id="rbmain" edgedefault="directed">',
  '    <node id="alpha"><data key="name">Alpha</data><data key="gender">Male</data><data key="node_shape">triangle</data><data key="score">10</data></node>',
  '    <node id="beta"><data key="name">Beta</data><data key="gender">Male</data><data key="node_shape">rectangle</data><data key="score">20</data></node>',
  '    <node id="gamma"><data key="name">Gamma</data><data key="gender">Female</data><data key="node_shape">triangle</data><data key="score">30</data></node>',
  '    <node id="delta"><data key="name">Delta</data><data key="gender">Male</data><data key="node_shape">rectangle</data><data key="score">40</data></node>',
  '    <node id="eps"><data key="name">Eps</data><data key="gender">Female</data><data key="node_shape">rectangle</data><data key="score">50</data></node>',
  '    <node id="zeta"><data key="name">Zeta</data><data key="gender">Male</data><data key="node_shape">rectangle</data><data key="score">60</data></node>',
  '    <edge id="e1" source="alpha" target="beta"><data key="relation">leads</data></edge>',
  '    <edge id="e2" source="alpha" target="gamma"><data key="relation">leads</data></edge>',
  '    <edge id="e3" source="alpha" target="delta"><data key="relation">leads</data></edge>',
  '    <edge id="e4" source="beta" target="eps"><data key="relation">mentors</data></edge>',
  '    <edge id="e5" source="gamma" target="zeta"><data key="relation">mentors</data></edge>',
  '  </graph>',
  '</graphml>'
].join('\n');

const FX_YED = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:y="http://www.yworks.com/xml/graphml">',
  '  <key id="d0" for="node" attr.name="name" attr.type="string"/>',
  '  <key id="d1" for="node" attr.name="gender" attr.type="string"/>',
  '  <key id="d2" for="node" attr.name="node_shape" attr.type="string"/>',
  '  <key id="d3" for="node" attr.name="score" attr.type="int"/>',
  '  <key id="d4" for="edge" attr.name="relation" attr.type="string"/>',
  '  <graph id="rbyed" edgedefault="directed">',
  '    <node id="alpha"><data key="d0">Alpha</data><data key="d1">Male</data><data key="d2">triangle</data><data key="d3">10</data></node>',
  '    <node id="beta"><data key="d0">Beta</data><data key="d1">Male</data><data key="d2">rectangle</data><data key="d3">20</data></node>',
  '    <node id="gamma"><data key="d0">Gamma</data><data key="d1">Female</data><data key="d2">triangle</data><data key="d3">30</data></node>',
  '    <node id="delta"><data key="d0">Delta</data><data key="d1">Male</data><data key="d2">rectangle</data><data key="d3">40</data></node>',
  '    <node id="eps"><data key="d0">Eps</data><data key="d1">Female</data><data key="d2">rectangle</data><data key="d3">50</data></node>',
  '    <node id="zeta"><data key="d0">Zeta</data><data key="d1">Male</data><data key="d2">rectangle</data><data key="d3">60</data></node>',
  '    <edge id="e1" source="alpha" target="beta"><data key="d4">leads</data></edge>',
  '    <edge id="e2" source="alpha" target="gamma"><data key="d4">leads</data></edge>',
  '    <edge id="e3" source="alpha" target="delta"><data key="d4">leads</data></edge>',
  '    <edge id="e4" source="beta" target="eps"><data key="d4">mentors</data></edge>',
  '    <edge id="e5" source="gamma" target="zeta"><data key="d4">mentors</data></edge>',
  '  </graph>',
  '</graphml>'
].join('\n');

// A second, smaller graph: four nodes in TWO disconnected components. Used only
// by the multi-file navigation checkpoint.
const FX_SECOND = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
  '  <key id="name" for="node" attr.name="name" attr.type="string"/>',
  '  <key id="group" for="node" attr.name="group" attr.type="string"/>',
  '  <key id="weight" for="node" attr.name="weight" attr.type="int"/>',
  '  <key id="relation" for="edge" attr.name="relation" attr.type="string"/>',
  '  <graph id="rbsecond" edgedefault="directed">',
  '    <node id="kona"><data key="name">Kona</data><data key="group">north</data><data key="weight">5</data></node>',
  '    <node id="lani"><data key="name">Lani</data><data key="group">north</data><data key="weight">7</data></node>',
  '    <node id="mira"><data key="name">Mira</data><data key="group">south</data><data key="weight">9</data></node>',
  '    <node id="todo"><data key="name">Todo</data><data key="group">south</data><data key="weight">11</data></node>',
  '    <edge id="eb1" source="kona" target="lani"><data key="relation">near</data></edge>',
  '    <edge id="eb2" source="mira" target="todo"><data key="relation">near</data></edge>',
  '  </graph>',
  '</graphml>'
].join('\n');

const NAME_MAIN = 'rb_main.graphml';
const NAME_YED = 'rb_yed.graphml';
const NAME_SECOND = 'rb_second.graphml';

function fixture(name: string): string {
  if (name === NAME_YED) { return FX_YED; }
  if (name === NAME_SECOND) { return FX_SECOND; }
  return FX_MAIN;
}

// ---------------------------------------------------------------- intake
// The uploader reads evt.target.files, so the harness builds a real FileList
// through DataTransfer and dispatches a genuine change event. No app code
// path is short-circuited: reFormatCytoData, sessionStorage, the FileReader
// completion counter and the DataService screen swap all run for real.
async function loadGraphs(pairs: any[]): Promise<any> {
  const res: any = { ok: false, reason: 'init', nudges: 0, files: pairs.length, elapsed: 0 };
  const t0 = Date.now();
  try {
    const input: any = await poll(function () { return tid('rb-file-input'); }, 8000);
    if (!input) { res.reason = 'file-input-never-rendered'; remember('intake', res); return res; }
    const dt = new DataTransfer();
    for (let i = 0; i < pairs.length; i++) {
      dt.items.add(new File([String(pairs[i][1])], String(pairs[i][0]), { type: 'text/xml' }));
    }
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
    let mounted: any = null;
    const t1 = Date.now();
    while (Date.now() - t1 < 9000) {
      await sleep(110);
      nudge();
      if (vis && vis.cy && !vis.cy.destroyed() && vis.cy.nodes().length > 0) { mounted = true; break; }
    }
    res.nudges = tickNudges;
    if (!mounted) {
      res.reason = appComp && appComp.show_graph_screen === true ? 'visualiser-mounted-without-graph' : 'screen-never-switched';
      remember('intake', res);
      return res;
    }
    // the importer runs an animated fcose layout; let it settle before any read
    await sleep(1100);
    nudge();
    res.ok = true;
    res.reason = 'ok';
    res.elapsed = Date.now() - t0;
  } catch (e) {
    res.reason = 'exception:' + String((e && (e as any).message) || e).slice(0, 90);
  }
  res.nudges = tickNudges;
  remember('intake', res);
  return res;
}
async function loadGraph(name: string): Promise<any> {
  return loadGraphs([[name, fixture(name)]]);
}
async function loadMain(): Promise<any> { return loadGraph(NAME_MAIN); }
async function loadYed(): Promise<any> { return loadGraph(NAME_YED); }
async function loadMainAndSecond(): Promise<any> {
  return loadGraphs([[NAME_MAIN, fixture(NAME_MAIN)], [NAME_SECOND, fixture(NAME_SECOND)]]);
}
// The landing screen's own "Download Sample GraphML" button embeds a 35-node /
// 73-edge family tree as a data: URI. Capturing it through the anchor spy gives
// a large real-world fixture without hard-coding one into the probe.
async function captureSample(): Promise<any> {
  const res: any = { clicked: 0, name: '', hrefLen: 0, nodes: -1, edges: -1, keys: -1, ok: false };
  try {
    anchorLog.length = 0;
    const el = tid('rb-sample-text');
    if (el) { el.click(); res.clicked = 1; }
    await sleep(300);
    nudge();
    const a = anchorLog.length ? anchorLog[anchorLog.length - 1] : null;
    if (a) {
      res.name = a.download;
      res.hrefLen = String(a.href).length;
      const prefix = 'data:text/plain;charset=utf-8,';
      if (String(a.href).indexOf(prefix) === 0) {
        sampleText = decodeURIComponent(String(a.href).slice(prefix.length));
        res.nodes = countTag(sampleText, '<node ');
        res.edges = countTag(sampleText, '<edge ');
        res.keys = countTag(sampleText, '<key ');
        res.ok = sampleText.length > 1000;
      }
    }
  } catch (e) { res.name = 'exception'; }
  remember('sample', res);
  return res;
}
async function loadCapturedSample(): Promise<any> {
  const s = recall('sample');
  if (!s || !sampleText) { return { ok: false, reason: 'sample-not-captured' }; }
  return loadGraphs([[String(s.name || 'rb_sample.graphml'), sampleText]]);
}
// Drag-and-drop path (DragNDropDirective.ondrop). An EMPTY drop is used by F01
// so the drop box stays mounted and its host bindings stay readable.
function dragEvent(type: string, withFile: boolean, name: string): any {
  try {
    const dt = new DataTransfer();
    if (withFile) { dt.items.add(new File([fixture(name)], name, { type: 'text/xml' })); }
    return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt } as any);
  } catch (e) {
    try { return new Event(type, { bubbles: true, cancelable: true }); } catch (e2) { return null; }
  }
}
async function doDragOver(): Promise<any> {
  const box = tid('rb-drop-box');
  if (!box) { return false; }
  const ev = dragEvent('dragover', false, '');
  if (!ev) { return false; }
  box.dispatchEvent(ev);
  await sleep(260);
  nudge();
  return true;
}
async function doDragLeave(): Promise<any> {
  const box = tid('rb-drop-box');
  if (!box) { return false; }
  const ev = dragEvent('dragleave', false, '');
  if (!ev) { return false; }
  box.dispatchEvent(ev);
  await sleep(260);
  nudge();
  return true;
}
async function doDropEmpty(): Promise<any> {
  const box = tid('rb-drop-box');
  if (!box) { return false; }
  const ev = dragEvent('drop', false, '');
  if (!ev) { return false; }
  box.dispatchEvent(ev);
  await sleep(400);
  nudge();
  return true;
}
async function doDropFile(name: string): Promise<any> {
  const box = tid('rb-drop-box');
  if (!box) { return { ok: false, reason: 'no-drop-box' }; }
  const ev = dragEvent('drop', true, name);
  if (!ev) { return { ok: false, reason: 'no-dragevent' }; }
  box.dispatchEvent(ev);
  let mounted: any = null;
  const t1 = Date.now();
  while (Date.now() - t1 < 9000) {
    await sleep(110);
    nudge();
    if (vis && vis.cy && !vis.cy.destroyed() && vis.cy.nodes().length > 0) { mounted = true; break; }
  }
  if (!mounted) { return { ok: false, reason: 'screen-never-switched' }; }
  await sleep(1100);
  nudge();
  return { ok: true, reason: 'ok' };
}
async function clickDropBox(): Promise<any> {
  const box = tid('rb-drop-box');
  if (!box) { return false; }
  box.click();
  await sleep(220);
  nudge();
  return true;
}
async function clickBrowseLabel(): Promise<any> {
  const l = tid('rb-browse-label');
  if (!l) { return false; }
  l.click();
  await sleep(220);
  nudge();
  return true;
}

// ---------------------------------------------------------------- visualiser drivers
async function clickEl(el: any, ms: number): Promise<any> {
  if (!el) { return false; }
  el.click();
  await sleep(ms === undefined ? 300 : ms);
  nudge();
  return true;
}
async function openAnalytics(): Promise<any> { return clickEl(tid('rb-analytics-open'), 700); }
async function closeAnalytics(): Promise<any> {
  // [R16 seat-3, measured 2026-09-08 00:23 CST] a synthetic HTMLElement.click() on
  // '#mySidenav .closebtn' never reaches (click)="closeNav()": this helper AND a direct
  // DOM click both left #mySidenav at width 100% / paddingLeft 20px while returning true,
  // and a trusted Playwright click on the same anchor closed it to 0px / 0px. Call the
  // component method the way closeToolBar() calls vis.closeToolBar(); keep the click as a
  // fallback for the case where no visualiser was registered.
  if (vis) {
    try { vis.closeNav(); await sleep(400); nudge(); return true; } catch (e) { /* fall through to the click */ }
  }
  return clickEl(q('#mySidenav .closebtn'), 400);
}
async function openToolBar(): Promise<any> {
  if (!vis) { return false; }
  try { vis.openToolBar(); } catch (e) { return false; }
  await sleep(400);
  nudge();
  return true;
}
async function closeToolBar(): Promise<any> {
  if (!vis) { return false; }
  try { vis.closeToolBar(); } catch (e) { return false; }
  await sleep(300);
  nudge();
  return true;
}
async function clickLayoutButton(label: string): Promise<any> {
  const btns = qa('#tool_bar button');
  for (let i = 0; i < btns.length; i++) {
    if (norm(btns[i].textContent) === label) {
      btns[i].click();
      await sleep(900);
      nudge();
      return true;
    }
  }
  return false;
}
function selectNode(id: string): number {
  if (!vis || !vis.cy) { return -1; }
  try {
    vis.cy.elements().unselect();
    vis.cy.$('#' + id).select();
    return vis.cy.$(':selected').length;
  } catch (e) { return -2; }
}
async function clickHide(): Promise<any> { return clickEl(q('#hide'), 900); }
async function clickShowAll(): Promise<any> { return clickEl(q('#showAll'), 900); }
async function clickFocus(): Promise<any> { return clickEl(q('#focus'), 700); }
async function clickNextGraph(): Promise<any> { return clickEl(q('#next_graph'), 1400); }
async function clickPreviousGraph(): Promise<any> { return clickEl(q('#previous_graph'), 1400); }
// The two "Show Edge Label" radios live in the first expansion panel
// (#mataccordion mat-radio-button index 2 = Show, 3 = Hide).
async function clickEdgeLabelRadio(index: number): Promise<any> {
  const radios = qa('#mataccordion mat-radio-button');
  if (radios.length <= index) { return false; }
  const input = radios[index].querySelector('input');
  if (!input) { return false; }
  input.click();
  await sleep(500);
  nudge();
  return true;
}
async function applyEdgeLabel(attr: string): Promise<any> {
  if (!vis) { return false; }
  try { vis.edge_label_option_click(attr); } catch (e) { return false; }
  await sleep(400);
  nudge();
  return true;
}
async function applyNodeColor(attr: string): Promise<any> {
  if (!vis) { return false; }
  try { vis.set_node_color(attr); } catch (e) { return false; }
  await sleep(600);
  nudge();
  return true;
}
async function applyNodeSize(attr: string): Promise<any> {
  if (!vis) { return false; }
  try { vis.set_node_size(attr); } catch (e) { return false; }
  await sleep(500);
  nudge();
  return true;
}
async function primeSearch(value: string): Promise<any> {
  if (!vis) { return { ok: false, count: -1 }; }
  try {
    searchEmit = [];
    if (!searchSub && vis.filteredOptions) {
      searchSub = vis.filteredOptions.subscribe(function (x: any) { searchEmit = x || []; });
    }
    vis.myControl.setValue(value);
    nudge();
    await sleep(350);
    nudge();
    return { ok: true, count: searchEmit.length };
  } catch (e) { return { ok: false, count: -1 }; }
}
async function captureGraph(): Promise<any> {
  if (!vis) { return false; }
  try { vis.capture_png(); } catch (e) { return false; }
  await sleep(500);
  nudge();
  return true;
}
async function downloadGraphml(): Promise<any> {
  if (!vis) { return false; }
  anchorLog.length = 0;
  try { vis.download_graphml(); } catch (e) { return false; }
  await sleep(400);
  nudge();
  return true;
}
async function downloadJson(): Promise<any> {
  if (!vis) { return false; }
  try { vis.download_json(); } catch (e) { return false; }
  await sleep(400);
  nudge();
  return true;
}
async function openTableDialog(flag: number): Promise<any> {
  const res: any = { called: false, opened: false, heading: '', rows: -1, err: '' };
  try {
    if (!vis) { res.err = 'no-visualiser'; remember('dialog', res); return res; }
    res.called = true;
    try { vis.openDialog(flag); } catch (e) { res.err = 'open-threw:' + String(((e as any) && (e as any).message) || e).slice(0, 90); }
    const container: any = await poll(function () { return q('.mat-dialog-container'); }, 3500);
    if (container) {
      res.opened = true;
      await sleep(600);
      nudge();
      res.heading = norm(q('.mat-dialog-title') ? q('.mat-dialog-title').textContent : '');
      const sel = flag === 1 ? '#elements' : '#connections';
      const t0 = Date.now();
      while (Date.now() - t0 < 2500) {
        if (rowCount(sel) > 0) { break; }
        await sleep(140);
        nudge();
      }
      await sleep(450);
      nudge();
      res.rows = rowCount(sel);
    }
  } catch (e) { res.err = 'exception:' + String(((e as any) && (e as any).message) || e).slice(0, 90); }
  remember('dialog', res);
  return res;
}
async function closeTableDialog(): Promise<any> {
  const btn = q('.mat-dialog-container button[mat-dialog-close]');
  if (!btn) { return false; }
  btn.click();
  await sleep(600);
  nudge();
  return true;
}

// ---------------------------------------------------------------- readers: landing
function ready(): boolean { return appComp !== null; }
function bootRefSet(): boolean { return appRef !== null; }
function tickNudgeCount(): number { return tickNudges; }
function showGraphScreen(): boolean { return !!(appComp && appComp.show_graph_screen === true); }
function dropBoxExists(): boolean { return !!tid('rb-drop-box'); }
function dropBoxText(): string { return norm(tid('rb-drop-box') ? tid('rb-drop-box').textContent : ''); }
function landingCanvasCount(): number { return qa('#particles-js canvas').length; }
function landingHeadings(): string {
  const hs = qa('#dnd h3');
  const out: string[] = [];
  for (let i = 0; i < hs.length; i++) { out.push(norm(hs[i].textContent)); }
  return out.join('|');
}
function fileInputExists(): boolean { return !!tid('rb-file-input'); }
function fileInputHidden(): boolean { const i = tid('rb-file-input'); return !!i && i.hidden === true; }
function fileInputAccept(): string { const i = tid('rb-file-input'); return i ? String(i.getAttribute('accept') || '') : ''; }
function fileInputMultiple(): boolean { const i = tid('rb-file-input'); return !!i && i.multiple === true; }
function browseLabelExists(): boolean { return !!tid('rb-browse-label'); }
function browseLabelText(): string { return norm(tid('rb-browse-label') ? tid('rb-browse-label').textContent : ''); }
function browseLabelFor(): string { const l = tid('rb-browse-label'); return l ? String(l.getAttribute('for') || '') : ''; }
function elementWithIdFileInputExists(): boolean { return !!document.getElementById('fileInput'); }
function browseLabelInsideDropBox(): boolean {
  const l = tid('rb-browse-label');
  const b = tid('rb-drop-box');
  return !!(l && b && b.contains(l));
}
function browseLabelCursor(): string {
  const l = tid('rb-browse-label');
  if (!l) { return ''; }
  try { return String(W.getComputedStyle(l).cursor || ''); } catch (e) { return ''; }
}
function pickerClickCount(): number { return pickerClicks; }
function pickerReset(): void { pickerClicks = 0; }
function dropBoxStyle(prop: string): string {
  const b = tid('rb-drop-box');
  if (!b) { return ''; }
  try { return String(b.style[prop] || ''); } catch (e) { return ''; }
}
function restBackground(): string { return dropBoxStyle('backgroundColor'); }
function restOpacity(): string { return dropBoxStyle('opacity'); }
function dragOverBackground(): string { return dropBoxStyle('backgroundColor'); }
function dropBoxHasShakeClass(): boolean { const b = tid('rb-drop-box'); return !!(b && b.classList.contains('shakeit')); }
function uploadingFlag(): boolean { return !!(dnd && dnd.uploading === true); }
function loadingOverlayExists(): boolean { return !!q('div[style*="z-index: 90"]'); }
function particlesNumberValue(): number {
  try {
    const p = (window as any).pJSDom;
    if (!p || !p.length) { return -1; }
    return num((p[0].pJS || p[0]).particles.number.value, -2);
  } catch (e) { return -3; }
}
function particlesDensityEnabled(): boolean {
  try {
    const p = (window as any).pJSDom;
    return !!(p && p.length && (p[0].pJS || p[0]).particles.number.density.enable === true);
  } catch (e) { return false; }
}
function particlesDensityArea(): number {
  try {
    const p = (window as any).pJSDom;
    if (!p || !p.length) { return -1; }
    return num((p[0].pJS || p[0]).particles.number.density.value_area, -2);
  } catch (e) { return -3; }
}
function particlesShapeType(): string {
  try {
    const p = (window as any).pJSDom;
    return p && p.length ? String((p[0].pJS || p[0]).particles.shape.type || '') : '';
  } catch (e) { return ''; }
}

// ---------------------------------------------------------------- readers: visualiser
function visReady(): boolean { return !!(vis && vis.cy && !vis.cy.destroyed()); }
function cy(): any { return vis ? vis.cy : null; }
function cyCanvasCount(): number { return qa('#cy canvas').length; }
function panzoomCount(): number { return qa('#cy .cy-panzoom').length; }
function nodeCount(): number { try { return vis.cy.nodes().length; } catch (e) { return -1; } }
function edgeCount(): number { try { return vis.cy.edges().length; } catch (e) { return -1; } }
function totalNodeCount(): number { return nodeCount(); }
function visibleNodeCount(): number { try { return vis.cy.nodes(':visible').length; } catch (e) { return -1; } }
function visibleEdgeCount(): number { try { return vis.cy.edges(':visible').length; } catch (e) { return -1; } }
function displayHiddenNodeCount(): number { try { return vis.cy.nodes(':hidden').length; } catch (e) { return -1; } }
function hiddenByClassCount(): number { try { return vis.cy.nodes('.hideN').length; } catch (e) { return -1; } }
function selectedCount(): number { try { return vis.cy.$(':selected').length; } catch (e) { return -1; } }
function nodeIdsSorted(): string {
  try {
    const ids: string[] = [];
    vis.cy.nodes().forEach(function (n: any) { ids.push(String(n.id())); });
    ids.sort();
    return ids.join(',');
  } catch (e) { return ''; }
}
function nodeData(id: string, key: string): string {
  try {
    const n = vis.cy.$('#' + id);
    if (!n || n.length === 0) { return ''; }
    const v = n[0]._private.data[key];
    return v === undefined || v === null ? '' : String(v);
  } catch (e) { return ''; }
}
function nodeDataKeyCount(): number {
  try {
    const n = vis.cy.nodes();
    if (n.length === 0) { return -1; }
    return Object.keys(n[0]._private.data).length;
  } catch (e) { return -2; }
}
function nodeDataKeysSorted(): string {
  try {
    const n = vis.cy.nodes();
    if (n.length === 0) { return ''; }
    const k = Object.keys(n[0]._private.data);
    k.sort();
    return k.join(',');
  } catch (e) { return ''; }
}
function edgeDataKeysSorted(): string {
  try {
    const e = vis.cy.edges();
    if (e.length === 0) { return ''; }
    const k = Object.keys(e[0]._private.data);
    k.sort();
    return k.join(',');
  } catch (e) { return ''; }
}
function currentLabelRaw(): string { return norm(q('#current_graph') ? q('#current_graph').textContent : ''); }
function currentLabelName(): string {
  const t = currentLabelRaw();
  const i = t.indexOf('|');
  return i < 0 ? '' : t.slice(0, i).trim();
}
function currentLabelN(): string {
  const m = currentLabelRaw().match(/N\[([^\]]*)\]/);
  return m ? String(m[1]) : '';
}
function currentLabelE(): string {
  const m = currentLabelRaw().match(/E\[([^\]]*)\]/);
  return m ? String(m[1]) : '';
}
function fileListLength(): number {
  try {
    if (!vis || !vis.files_uploaded) { return -1; }
    return vis.files_uploaded.length;
  } catch (e) { return -2; }
}
function fileListAt(i: number): string {
  try { return String(vis.files_uploaded[i]); } catch (e) { return ''; }
}
function graphIndex(): number { try { return num(vis.last_graph_index, -1); } catch (e) { return -2; } }
function layoutNameFlag(): string { try { return String(vis.last_layout_name); } catch (e) { return ''; } }
function render3dFlag(): boolean { try { return vis.render3d === true; } catch (e) { return false; } }
function showPreloaderFlag(): boolean { try { return vis.showPreloader === true; } catch (e) { return false; } }
function numericAttrCount(): number { try { return vis.numeric_node_attr.length; } catch (e) { return -1; } }
function numericAttrAt(i: number): string { try { return String(vis.numeric_node_attr[i]); } catch (e) { return ''; } }
function hasNumericAttr(n: string): boolean { try { return vis.numeric_node_attr.indexOf(n) >= 0; } catch (e) { return false; } }
function strAttrCount(): number { try { return vis.str_node_attr.length; } catch (e) { return -1; } }
function strAttrAt(i: number): string { try { return String(vis.str_node_attr[i]); } catch (e) { return ''; } }
function hasStrAttr(n: string): boolean { try { return vis.str_node_attr.indexOf(n) >= 0; } catch (e) { return false; } }
function edgeLabelListLength(): number { try { return vis.edge_label.length; } catch (e) { return -1; } }
function edgeLabelListHas(n: string): boolean { try { return vis.edge_label.indexOf(n) >= 0; } catch (e) { return false; } }
function optionAttrCount(): number { try { return Object.keys(vis.node_attr_options).length; } catch (e) { return -1; } }
function optionAttrDistinctCount(attr: string): number {
  try { return vis.node_attr_options[attr].length; } catch (e) { return -1; }
}
function searchOptionTotal(): number { try { return vis.options.length; } catch (e) { return -1; } }
function searchOptionAt(i: number): string { try { return String(vis.options[i]); } catch (e) { return ''; } }
function hasSearchOption(s: string): boolean { try { return vis.options.indexOf(s) >= 0; } catch (e) { return false; } }
function searchEmitCount(): number { return searchEmit.length; }
function searchEmitAt(i: number): string { try { return String(searchEmit[i]); } catch (e) { return ''; } }
function searchEmitHas(s: string): boolean { return searchEmit.indexOf(s) >= 0; }
function sidenavWidth(): string { const e = q('#mySidenav'); return e ? String(e.style.width || '') : ''; }
function sidenavPadding(): string { const e = q('#mySidenav'); return e ? String(e.style.paddingLeft || '') : ''; }
function scoreText(i: number): string { const s = qa('#mySidenav .score'); return s.length > i ? norm(s[i].textContent) : ''; }
function scoreMaxDeg(): string { return scoreText(0); }
function scoreMaxIndeg(): string { return scoreText(1); }
function scoreMinDeg(): string { return scoreText(2); }
function scoreMinIndeg(): string { return scoreText(3); }
function scoreBoardCount(): number { return qa('#mySidenav .score_board').length; }
function chartOptionCount(): number { try { return vis.chart_dropdown_options.length; } catch (e) { return -1; } }
function chartOptionAt(i: number): string { try { return String(vis.chart_dropdown_options[i]); } catch (e) { return ''; } }
function chartOptionList(): string {
  try { return vis.chart_dropdown_options.join(','); } catch (e) { return ''; }
}
function chartContainerExists(): boolean { return !!q('#chart1_c'); }
function chartSvgCount(): number { return qa('#chart1_c svg').length; }
function toolBarWidth(): string { const e = q('#tool_bar'); return e ? String(e.style.width || '') : ''; }
function toolBarPadding(): string { const e = q('#tool_bar'); return e ? String(e.style.padding || '') : ''; }
function toolBarOverflow(): string { const e = q('#tool_bar'); return e ? String(e.style.overflow || '') : ''; }
function layoutButtonCount(): number { return qa('#tool_bar button').length; }
function hasLayoutButton(label: string): boolean {
  const b = qa('#tool_bar button');
  for (let i = 0; i < b.length; i++) { if (norm(b[i].textContent) === label) { return true; } }
  return false;
}
function packSpanCount(): number { return qa('[data-testid="rb-pack-span"]').length; }
function threeDAccordionDisplay(): string {
  // NOTE: a CSS id selector cannot start with a digit, so this one goes through
  // getElementById rather than querySelector('#3dmataccordion').
  const e: any = document.getElementById('3dmataccordion');
  return e ? String(e.style.display || '') : '';
}
function sceneNavInfoExists(): boolean { return !!q('.scene-nav-info'); }
function radioCountInFirstPanel(): number { return qa('#mataccordion mat-radio-button').length; }
function showEdgeLabelFlag(): boolean { try { return vis.show_edge_label === true; } catch (e) { return false; } }
function expandFocusHidden(): boolean { const e = q('#expandfocus'); return !!(e && e.classList.contains('hide')); }
function contractFocusHidden(): boolean { const e = q('#contractfocus'); return !!(e && e.classList.contains('hide')); }
function focusHasPositionClass(): boolean { const e = q('#focus'); return !!(e && e.classList.contains('focus_position')); }
function focusHasInitClass(): boolean { const e = q('#focus'); return !!(e && e.classList.contains('init_position')); }
function captureBadgeText(): string { return norm(tid('rb-capture-badge') ? tid('rb-capture-badge').textContent : ''); }
function imageListLength(): number { try { return vis.list_of_images.length; } catch (e) { return -1; } }
function legendRowCount(): number {
  const t = q('#legend table');
  if (!t) { return -1; }
  const tb = t.querySelector('tbody');
  return tb ? tb.querySelectorAll('tr').length : -1;
}
function legendRowTexts(): string { return rowTexts('#legend table', 1); }
function legendRowTextAt(i: number): string {
  const t = q('#legend table');
  if (!t) { return ''; }
  const tb = t.querySelector('tbody');
  if (!tb) { return ''; }
  const rows = tb.querySelectorAll('tr');
  if (rows.length <= i) { return ''; }
  const cells = rows[i].querySelectorAll('td');
  return cells.length > 1 ? norm(cells[1].textContent) : '';
}
function legendVisible(): boolean {
  const e = q('#legend');
  if (!e) { return false; }
  try { return String(W.getComputedStyle(e).display) !== 'none'; } catch (e2) { return false; }
}
function legendSvgCount(): number { return qa('#legend svg').length; }
function colorMapSize(): number { try { return Object.keys(vis.color_map).length; } catch (e) { return -1; } }
function colorMapValue(k: string): string { try { return String(vis.color_map[k]); } catch (e) { return ''; } }
function colorMapKeysSorted(): string {
  try { const k = Object.keys(vis.color_map); k.sort(); return k.join(','); } catch (e) { return ''; }
}
function pstyleNum(id: string, prop: string, fallback: number): number {
  try {
    const e = vis.cy.$('#' + id);
    if (!e || e.length === 0) { return fallback; }
    const p = e[0].pstyle(prop);
    if (!p) { return fallback; }
    if (p.pfValue !== undefined && p.pfValue !== null) { return num(p.pfValue, fallback); }
    return num(p.value, fallback);
  } catch (e2) { return fallback; }
}
function pstyleStr(id: string, prop: string): string {
  try {
    const e = vis.cy.$('#' + id);
    if (!e || e.length === 0) { return ''; }
    const p = e[0].pstyle(prop);
    if (!p) { return ''; }
    if (p.strValue !== undefined && p.strValue !== null) { return String(p.strValue); }
    return String(p.value);
  } catch (e2) { return ''; }
}
function firstEdgePstyleNum(prop: string, fallback: number): number {
  try {
    const e = vis.cy.edges();
    if (e.length === 0) { return fallback; }
    const p = e[0].pstyle(prop);
    if (!p) { return fallback; }
    if (p.pfValue !== undefined && p.pfValue !== null) { return num(p.pfValue, fallback); }
    return num(p.value, fallback);
  } catch (e2) { return fallback; }
}
function edgeFontSize(): number { return firstEdgePstyleNum('font-size', -1); }
function edgeTextBgOpacity(): number { return firstEdgePstyleNum('text-background-opacity', -1); }
function edgeLabelText(): string { return pstyleStrEdge('label'); }
function pstyleStrEdge(prop: string): string {
  try {
    const e = vis.cy.edges();
    if (e.length === 0) { return ''; }
    const p = e[0].pstyle(prop);
    if (!p) { return ''; }
    return String(p.strValue === undefined || p.strValue === null ? p.value : p.strValue);
  } catch (e2) { return ''; }
}
function nodeWidth(id: string): number { return pstyleNum(id, 'width', -1); }
function nodeHeight(id: string): number { return pstyleNum(id, 'height', -1); }
function nodeShape(id: string): string { return pstyleStr(id, 'shape'); }
function nodeColorStr(id: string): string { return pstyleStr(id, 'background-color'); }
function sameNodeColor(a: string, b: string): boolean {
  const x = nodeColorStr(a);
  const y = nodeColorStr(b);
  return x !== '' && x === y;
}
function differentNodeColor(a: string, b: string): boolean {
  const x = nodeColorStr(a);
  const y = nodeColorStr(b);
  return x !== '' && y !== '' && x !== y;
}
function concentricValueOf(id: string): number {
  try {
    const o = vis.layoutOptions('concentric');
    const n = vis.cy.$('#' + id);
    if (!n || n.length === 0) { return -2; }
    return num(o.concentric(n[0]), -3);
  } catch (e) { return -1; }
}
function concentricLevelWidth(): number {
  try {
    const o = vis.layoutOptions('concentric');
    return num(o.levelWidth(vis.cy.nodes()), -3);
  } catch (e) { return -1; }
}
function concentricOptionName(): string {
  try { return String(vis.layoutOptions('concentric').name); } catch (e) { return ''; }
}
function degreeOf(id: string): number {
  try { const n = vis.cy.$('#' + id); return n && n.length ? num(n.degree(), -1) : -2; } catch (e) { return -3; }
}
function indegreeOf(id: string): number {
  try { const n = vis.cy.$('#' + id); return n && n.length ? num(n.indegree(), -1) : -2; } catch (e) { return -3; }
}
function maxDegreeValue(): number { try { return num(vis.cy.nodes().maxDegree(), -1); } catch (e) { return -2; } }
function maxIndegreeValue(): number { try { return num(vis.cy.nodes().maxIndegree(), -1); } catch (e) { return -2; } }
function minDegreeValue(): number { try { return num(vis.cy.nodes().minDegree(), -1); } catch (e) { return -2; } }
function minIndegreeValue(): number { try { return num(vis.cy.nodes().minIndegree(), -1); } catch (e) { return -2; } }
function componentCount(): number {
  try { return vis.cy.elements().components().length; } catch (e) { return -1; }
}
function elementsRowCount(): number { try { return vis.element_data.length; } catch (e) { return -1; } }
function elementsHeaderCount(): number { try { return vis.element_data_header.length; } catch (e) { return -1; } }
function elementsHeaderAt(i: number): string { try { return String(vis.element_data_header[i]); } catch (e) { return ''; } }
function elementsRowCell(rowIndex: number, colIndex: number): string {
  try { return String(vis.element_data[rowIndex][colIndex]); } catch (e) { return ''; }
}
function connectionsRowCount(): number { try { return vis.connection_data.length; } catch (e) { return -1; } }
function connectionsHeaderCount(): number { try { return vis.connection_data_header.length; } catch (e) { return -1; } }
function tableHeading(): string { try { return String(vis.table_heading); } catch (e) { return ''; } }
function dialogOpen(): boolean { const d = recall('dialog'); return !!(d && d.opened === true); }
function dialogHeading(): string { const d = recall('dialog'); return d ? String(d.heading || '') : ''; }
function dialogBodyRowCount(): number { const d = recall('dialog'); return d ? num(d.rows, -1) : -1; }
function dialogErr(): string { const d = recall('dialog'); return d ? String(d.err || '') : ''; }
function dialogContainerCount(): number { return qa('.mat-dialog-container').length; }
function dialogTableId(): string {
  if (q('#elements')) { return 'elements'; }
  if (q('#connections')) { return 'connections'; }
  return '';
}
function intakeOk(): boolean { const i = recall('intake'); return !!(i && i.ok === true); }
function intakeReason(): string { const i = recall('intake'); return i ? String(i.reason || '') : ''; }
function intakeNudges(): number { const i = recall('intake'); return i ? num(i.nudges, -1) : -1; }
function snackSeenCount(): number { return snackSeen.length; }
function snackSeenHas(part: string): boolean {
  for (let i = 0; i < snackSeen.length; i++) { if (snackSeen[i].indexOf(part) >= 0) { return true; } }
  return false;
}
function snackSeenAt(i: number): string { return snackSeen.length > i ? snackSeen[i] : ''; }
function anchorLogCount(): number { return anchorLog.length; }
function lastAnchorDownload(): string { return anchorLog.length ? String(anchorLog[anchorLog.length - 1].download) : ''; }
function lastAnchorHrefHead(): string {
  return anchorLog.length ? String(anchorLog[anchorLog.length - 1].href).slice(0, 30) : '';
}
function lastAnchorHrefLen(): number {
  return anchorLog.length ? String(anchorLog[anchorLog.length - 1].href).length : -1;
}
function sampleNodeTagCount(): number { const s = recall('sample'); return s ? num(s.nodes, -1) : -1; }
function sampleEdgeTagCount(): number { const s = recall('sample'); return s ? num(s.edges, -1) : -1; }
function sampleKeyTagCount(): number { const s = recall('sample'); return s ? num(s.keys, -1) : -1; }
function sampleDownloadName(): string { const s = recall('sample'); return s ? String(s.name || '') : ''; }
function sampleCaptured(): boolean { const s = recall('sample'); return !!(s && s.ok === true); }

// ---------------------------------------------------------------- readers: isolation
function localStorageKeyCount(): number { try { return W.localStorage.length; } catch (e) { return -1; } }
function sessionStorageKeyCount(): number { try { return W.sessionStorage.length; } catch (e) { return -1; } }
function sessionKeysSorted(): string {
  try {
    const k: string[] = [];
    for (let i = 0; i < W.sessionStorage.length; i++) { k.push(String(W.sessionStorage.key(i))); }
    k.sort();
    return k.join(',');
  } catch (e) { return ''; }
}
function sessionKeyAt(i: number): string {
  try { return String(W.sessionStorage.key(i)); } catch (e) { return ''; }
}
function sessionValueLength(name: string): number {
  try { const v = W.sessionStorage.getItem(name); return v === null ? -1 : String(v).length; } catch (e) { return -2; }
}
function sessionValueHasNodeTag(name: string): boolean {
  try { const v = W.sessionStorage.getItem(name); return !!v && String(v).indexOf('<node ') >= 0; } catch (e) { return false; }
}
function cookieText(): string { try { return String(document.cookie || ''); } catch (e) { return 'unreadable'; } }
function locPathname(): string { try { return String(W.location.pathname); } catch (e) { return ''; } }
function locSearch(): string { try { return String(W.location.search); } catch (e) { return 'x'; } }
function locHash(): string { try { return String(W.location.hash); } catch (e) { return 'x'; } }
function locProtocol(): string { try { return String(W.location.protocol); } catch (e) { return ''; } }
function strayGlobalsBeyondBoot(): number {
  try {
    let n = 0;
    const keys = Object.keys(window);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k.indexOf('__') !== 0) { continue; }
      if (k === '__RB__') { continue; }
      if (k.indexOf('__zone_symbol__') === 0) { continue; }
      n = n + 1;
    }
    return n;
  } catch (e) { return -1; }
}
function bodyAnchorResidue(): number {
  try { return childTagCount(document.body, 'a'); } catch (e) { return -1; }
}
function bodyChildTagNames(): string {
  try {
    const out: string[] = [];
    const kids = document.body.children;
    for (let i = 0; i < kids.length; i++) { out.push(String(kids[i].tagName).toLowerCase()); }
    out.sort();
    return out.join(',');
  } catch (e) { return ''; }
}
function externalRefTagCount(): number {
  return qa('link[href^="http"], script[src^="http"], link[href^="//"], script[src^="//"]').length;
}
function hasDataLayer(): boolean { try { return W.dataLayer !== undefined; } catch (e) { return false; } }
function hasGtag(): boolean { try { return typeof W.gtag === 'function'; } catch (e) { return false; } }
function documentTitle(): string { return norm(document.title); }
function baseHref(): string { const b = q('base'); return b ? String(b.getAttribute('href') || '') : ''; }

// ---------------------------------------------------------------- export
const RB: any = {
  version: 'graphml-viewer-01/1.0',
  setBootRef: setBootRef, registerApp: registerApp, registerVisualiser: registerVisualiser,
  registerDnd: registerDnd, registerDndDir: registerDndDir,
  ready: ready, bootRefSet: bootRefSet, visReady: visReady, showGraphScreen: showGraphScreen,
  tickNudgeCount: tickNudgeCount, remember: remember, recall: recall, nudge: nudge,
  // fixtures
  fixture: fixture, fxMain: FX_MAIN, fxYed: FX_YED, fxSecond: FX_SECOND,
  nameMain: NAME_MAIN, nameYed: NAME_YED, nameSecond: NAME_SECOND,
  // intake drivers
  loadGraph: loadGraph, loadGraphs: loadGraphs, loadMain: loadMain, loadYed: loadYed,
  loadMainAndSecond: loadMainAndSecond, captureSample: captureSample,
  loadCapturedSample: loadCapturedSample, doDragOver: doDragOver, doDragLeave: doDragLeave,
  doDropEmpty: doDropEmpty, doDropFile: doDropFile, clickDropBox: clickDropBox,
  clickBrowseLabel: clickBrowseLabel,
  // visualiser drivers
  openAnalytics: openAnalytics, closeAnalytics: closeAnalytics, openToolBar: openToolBar,
  closeToolBar: closeToolBar, clickLayoutButton: clickLayoutButton, selectNode: selectNode,
  clickHide: clickHide, clickShowAll: clickShowAll, clickFocus: clickFocus,
  clickNextGraph: clickNextGraph, clickPreviousGraph: clickPreviousGraph,
  clickEdgeLabelRadio: clickEdgeLabelRadio, applyEdgeLabel: applyEdgeLabel,
  applyNodeColor: applyNodeColor, applyNodeSize: applyNodeSize, primeSearch: primeSearch,
  captureGraph: captureGraph, downloadGraphml: downloadGraphml, downloadJson: downloadJson,
  openTableDialog: openTableDialog, closeTableDialog: closeTableDialog, pickerReset: pickerReset,
  // landing readers
  dropBoxExists: dropBoxExists, dropBoxText: dropBoxText, landingCanvasCount: landingCanvasCount,
  landingHeadings: landingHeadings, fileInputExists: fileInputExists, fileInputHidden: fileInputHidden,
  fileInputAccept: fileInputAccept, fileInputMultiple: fileInputMultiple, browseLabelExists: browseLabelExists,
  browseLabelText: browseLabelText, browseLabelFor: browseLabelFor,
  elementWithIdFileInputExists: elementWithIdFileInputExists, browseLabelInsideDropBox: browseLabelInsideDropBox,
  browseLabelCursor: browseLabelCursor, pickerClickCount: pickerClickCount, restBackground: restBackground,
  restOpacity: restOpacity, dragOverBackground: dragOverBackground, dropBoxHasShakeClass: dropBoxHasShakeClass,
  uploadingFlag: uploadingFlag, loadingOverlayExists: loadingOverlayExists,
  particlesNumberValue: particlesNumberValue, particlesDensityEnabled: particlesDensityEnabled,
  particlesDensityArea: particlesDensityArea, particlesShapeType: particlesShapeType,
  // visualiser readers
  cyCanvasCount: cyCanvasCount, panzoomCount: panzoomCount, nodeCount: nodeCount, edgeCount: edgeCount,
  totalNodeCount: totalNodeCount, visibleNodeCount: visibleNodeCount, visibleEdgeCount: visibleEdgeCount,
  displayHiddenNodeCount: displayHiddenNodeCount, hiddenByClassCount: hiddenByClassCount,
  selectedCount: selectedCount, nodeIdsSorted: nodeIdsSorted, nodeData: nodeData,
  nodeDataKeyCount: nodeDataKeyCount, nodeDataKeysSorted: nodeDataKeysSorted,
  edgeDataKeysSorted: edgeDataKeysSorted, currentLabelRaw: currentLabelRaw,
  currentLabelName: currentLabelName, currentLabelN: currentLabelN, currentLabelE: currentLabelE,
  fileListLength: fileListLength, fileListAt: fileListAt, graphIndex: graphIndex,
  layoutNameFlag: layoutNameFlag, render3dFlag: render3dFlag, showPreloaderFlag: showPreloaderFlag,
  numericAttrCount: numericAttrCount, numericAttrAt: numericAttrAt, hasNumericAttr: hasNumericAttr,
  strAttrCount: strAttrCount, strAttrAt: strAttrAt, hasStrAttr: hasStrAttr,
  edgeLabelListLength: edgeLabelListLength, edgeLabelListHas: edgeLabelListHas,
  optionAttrCount: optionAttrCount, optionAttrDistinctCount: optionAttrDistinctCount,
  searchOptionTotal: searchOptionTotal, searchOptionAt: searchOptionAt, hasSearchOption: hasSearchOption,
  searchEmitCount: searchEmitCount, searchEmitAt: searchEmitAt, searchEmitHas: searchEmitHas,
  sidenavWidth: sidenavWidth, sidenavPadding: sidenavPadding, scoreText: scoreText,
  scoreMaxDeg: scoreMaxDeg, scoreMaxIndeg: scoreMaxIndeg, scoreMinDeg: scoreMinDeg,
  scoreMinIndeg: scoreMinIndeg, scoreBoardCount: scoreBoardCount, chartOptionCount: chartOptionCount,
  chartOptionAt: chartOptionAt, chartOptionList: chartOptionList, chartContainerExists: chartContainerExists,
  chartSvgCount: chartSvgCount, toolBarWidth: toolBarWidth, toolBarPadding: toolBarPadding,
  toolBarOverflow: toolBarOverflow, layoutButtonCount: layoutButtonCount, hasLayoutButton: hasLayoutButton,
  packSpanCount: packSpanCount, threeDAccordionDisplay: threeDAccordionDisplay,
  sceneNavInfoExists: sceneNavInfoExists, radioCountInFirstPanel: radioCountInFirstPanel,
  showEdgeLabelFlag: showEdgeLabelFlag, expandFocusHidden: expandFocusHidden,
  contractFocusHidden: contractFocusHidden, focusHasPositionClass: focusHasPositionClass,
  focusHasInitClass: focusHasInitClass, captureBadgeText: captureBadgeText,
  imageListLength: imageListLength, legendRowCount: legendRowCount, legendRowTexts: legendRowTexts,
  legendRowTextAt: legendRowTextAt, legendVisible: legendVisible, legendSvgCount: legendSvgCount,
  colorMapSize: colorMapSize, colorMapValue: colorMapValue, colorMapKeysSorted: colorMapKeysSorted,
  nodeWidth: nodeWidth, nodeHeight: nodeHeight, nodeShape: nodeShape, nodeColorStr: nodeColorStr,
  sameNodeColor: sameNodeColor, differentNodeColor: differentNodeColor, edgeFontSize: edgeFontSize,
  edgeTextBgOpacity: edgeTextBgOpacity, edgeLabelText: edgeLabelText,
  concentricValueOf: concentricValueOf, concentricLevelWidth: concentricLevelWidth,
  concentricOptionName: concentricOptionName, degreeOf: degreeOf, indegreeOf: indegreeOf,
  maxDegreeValue: maxDegreeValue, maxIndegreeValue: maxIndegreeValue, minDegreeValue: minDegreeValue,
  minIndegreeValue: minIndegreeValue, componentCount: componentCount, elementsRowCount: elementsRowCount,
  elementsHeaderCount: elementsHeaderCount, elementsHeaderAt: elementsHeaderAt,
  elementsRowCell: elementsRowCell, connectionsRowCount: connectionsRowCount,
  connectionsHeaderCount: connectionsHeaderCount, tableHeading: tableHeading, dialogOpen: dialogOpen,
  dialogHeading: dialogHeading, dialogBodyRowCount: dialogBodyRowCount, dialogErr: dialogErr,
  dialogContainerCount: dialogContainerCount, dialogTableId: dialogTableId, intakeOk: intakeOk,
  intakeReason: intakeReason, intakeNudges: intakeNudges, snackSeenCount: snackSeenCount,
  snackSeenHas: snackSeenHas, snackSeenAt: snackSeenAt, anchorLogCount: anchorLogCount,
  lastAnchorDownload: lastAnchorDownload, lastAnchorHrefHead: lastAnchorHrefHead,
  lastAnchorHrefLen: lastAnchorHrefLen, sampleNodeTagCount: sampleNodeTagCount,
  sampleEdgeTagCount: sampleEdgeTagCount, sampleKeyTagCount: sampleKeyTagCount,
  sampleDownloadName: sampleDownloadName, sampleCaptured: sampleCaptured,
  // isolation readers
  localStorageKeyCount: localStorageKeyCount, sessionStorageKeyCount: sessionStorageKeyCount,
  sessionKeysSorted: sessionKeysSorted, sessionKeyAt: sessionKeyAt, sessionValueLength: sessionValueLength,
  sessionValueHasNodeTag: sessionValueHasNodeTag, cookieText: cookieText, locPathname: locPathname,
  locSearch: locSearch, locHash: locHash, locProtocol: locProtocol, strayGlobalsBeyondBoot: strayGlobalsBeyondBoot,
  bodyAnchorResidue: bodyAnchorResidue, bodyChildTagNames: bodyChildTagNames,
  externalRefTagCount: externalRefTagCount, hasDataLayer: hasDataLayer, hasGtag: hasGtag,
  documentTitle: documentTitle, baseHref: baseHref
};

installPickerSpy();
installAnchorSpy();
installSnackSpy();
W.__RB__ = RB;

export {};
