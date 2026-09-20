// rb-probe.ts - RepairBench observation bridge for
//
//
//
// INSTRUMENTATION ONLY. Imported once by src/main.ts. It publishes window.__RB__,
// the bridge tests/dsl.json uses to (a) drive the app through its own public
// handlers, (b) read back geometry the library only exposes as inline
// percentages, and (c) freeze transient values into stamps so that every
// assertion is a pure scalar relation between frozen operands (never a live
// monotone value, which a polling runner would redden spuriously).
//
// HARD RULES this file obeys:
//   R-1  it touches NO library file. All 12 defects live under
//        projects/ngx-widget-grid/src/lib and not one byte of that subtree is
//        read, imported, patched or monkey-patched from here.
//   R-2  it adds NO data-testid anywhere. Cards are located by DOM order plus
//        their own text label (hostLabels), geometry by getBoundingClientRect
//        and by the inline percentages the library itself writes.
//   R-3  every reader returns a scalar (number, string, boolean) or a flat
//        object of scalars. No reader hands out a DOM node, a library model
//        object or a function, so no checkpoint can reach into the model.
//   R-4  prose comments are LINE comments only. A block comment body must never
//        contain a star-slash pair, because JS block comments do not nest and
//        the comment would terminate early.
//   R-5  the synthetic drag aim is the measured one: target cell top-left plus
//        25 percent of the live cell pitch, on both axes. Not the cell centre
//        (it sits exactly on the getAnchor half-cell comparison boundary) and
//        not inset 0 (it trips the determineFinalPos no-op guard).

// Module scope: the empty export list makes this file an ES module, so none of
// the helpers below leak into the global scope of the app compilation.
export {};

const W = window as any;
const D = document;

// ---------------------------------------------------------------- boot state
let appRef: any = null;
let bootDone = false;
let tickDone = false;
let tickTries = 0;

// Strict-emptiness baseline. Zone.js (loaded by src/polyfills.ts, i.e. before
// this module evaluates) installs its own dunder-prefixed properties on window.
// Snapshotting the dunder key set HERE and reporting only what appears LATER
// keeps the state-isolation guard strict without any name-based allowlist: a
// framework symbol that already existed is not app state, and anything the app
// creates after boot shows up immediately.
const dunderBaseline: { [k: string]: boolean } = {};
(function snapshotDunder() {
  try {
    const names = Object.getOwnPropertyNames(W);
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      if (n.indexOf('__') === 0) { dunderBaseline[n] = true; }
    }
  } catch (e) { /* unreadable window - leave the baseline empty */ }
})();

// Network and database call counters. The seed performs ZERO of these, so the
// guard is a strict emptiness judgement rather than a whitelist. The wrappers
// only count; they delegate to the original and never alter a result.
const netCount = { fetch: 0, xhrOpen: 0, ws: 0, es: 0, beacon: 0, idbNames: {} };
(function installCounters() {
  try {
    if (typeof W.fetch === 'function') {
      const orig = W.fetch;
      W.fetch = function () { netCount.fetch++; return orig.apply(this, arguments as any); };
    }
  } catch (e) { /* no fetch */ }
  try {
    const xp = (W.XMLHttpRequest as any) && (W.XMLHttpRequest as any).prototype;
    if (xp && typeof xp.open === 'function') {
      const origOpen = xp.open;
      xp.open = function () { netCount.xhrOpen++; return origOpen.apply(this, arguments as any); };
    }
  } catch (e) { /* no XHR */ }
  try {
    if (typeof W.WebSocket === 'function') {
      const OrigWS = W.WebSocket;
      const Wrapped: any = function () { netCount.ws++; return new OrigWS(arguments[0], arguments[1]); };
      Wrapped.prototype = OrigWS.prototype;
      W.WebSocket = Wrapped;
    }
  } catch (e) { /* no WebSocket */ }
  try {
    if (typeof W.EventSource === 'function') {
      const OrigES = W.EventSource;
      const WrappedES: any = function () { netCount.es++; return new OrigES(arguments[0], arguments[1]); };
      WrappedES.prototype = OrigES.prototype;
      W.EventSource = WrappedES;
    }
  } catch (e) { /* no EventSource */ }
  try {
    const np = W.navigator;
    if (np && typeof np.sendBeacon === 'function') {
      const origBeacon = np.sendBeacon.bind(np);
      np.sendBeacon = function () { netCount.beacon++; return origBeacon.apply(null, arguments as any); };
    }
  } catch (e) { /* no sendBeacon */ }
  try {
    const idb = W.indexedDB;
    if (idb && typeof idb.open === 'function') {
      const origOpen = idb.open.bind(idb);
      idb.open = function (name: any) {
        try { netCount.idbNames[String(name)] = true; } catch (e) { /* unstringifiable name */ }
        return origOpen.apply(null, arguments as any);
      };
    }
  } catch (e) { /* no indexedDB */ }
})();

// ---------------------------------------------------------------- tiny utils
function sleep(ms: number): Promise<any> {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
function q(sel: string): any {
  try { return D.querySelector(sel); } catch (e) { return null; }
}
function qa(sel: string): any[] {
  try { return Array.prototype.slice.call(D.querySelectorAll(sel)); } catch (e) { return []; }
}
function norm(v: any): string {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
}
function num(v: any, fb: number): number {
  const n = Number(v);
  return isFinite(n) ? n : fb;
}
function css(el: any, prop: string): string {
  if (!el) { return ''; }
  try { return String(W.getComputedStyle(el)[prop] || ''); } catch (e) { return ''; }
}
function rectOf(el: any): any {
  if (!el) { return null; }
  try { return el.getBoundingClientRect(); } catch (e) { return null; }
}

// ---------------------------------------------------------------- DOM handles
// Both example components declare the SAME selector (measured:
// basic-example.component.ts:5 and fixed-dimension-example.component.ts:5 both
// read selector: 'app-basic-example') and their templates are byte-identical,
// so the twin can only be told apart by computed CSS on .dashboard-container.
function gridEl(): any { return q('ngx-widget-grid'); }
function hosts(): any[] { return qa('ngx-widget-grid ngx-widget'); }
function previewEls(): any[] { return qa('ngx-widget-grid .wg-preview-highlight'); }
function previewEl(): any { const a = previewEls(); return a.length ? a[0] : null; }
function gridLines(kind: string): any[] { return qa('ngx-widget-grid .wg-preview-item.' + kind); }
function dashContainer(): any { return q('.dashboard-container'); }
function formButtons(): any[] { return qa('.dashboard-container .form > button'); }
function btnGroups(): any[] { return qa('.dashboard-container .form .btn-group'); }

function labelNode(host: any): any {
  const mw = host ? host.querySelector('.my-widgets') : null;
  if (!mw) { return null; }
  const divs = mw.querySelectorAll('div');
  return divs && divs.length ? divs[divs.length - 1] : mw;
}
function labelOf(host: any): string {
  const n = labelNode(host);
  return n ? norm(n.textContent) : '';
}
function hostByLabel(label: string): any {
  const hs = hosts();
  for (let i = 0; i < hs.length; i++) { if (labelOf(hs[i]) === label) { return hs[i]; } }
  return null;
}

// Rows/Cols are printed as `Rows: <b>{{rows}}</b>` / `Cols: <b>{{cols}}</b>`
// (basic-example.component.html:31 and :42). Walk the .form child nodes and
// attribute each <b> to the label text that precedes it, so the reading cannot
// be fooled by node order or by an extra <b> appearing elsewhere.
function labelledNumber(want: string): number {
  const form = q('.dashboard-container .form');
  if (!form) { return -1; }
  let pending = '';
  const kids = form.childNodes;
  for (let i = 0; i < kids.length; i++) {
    const n = kids[i];
    if (n.nodeType === 3) {
      const t = norm(n.nodeValue);
      if (t) { pending = t; }
    } else if (n.nodeType === 1) {
      const tag = String((n as any).tagName || '').toUpperCase();
      if (tag === 'B') {
        if (pending.indexOf(want) === 0) { return num(norm((n as any).textContent), -1); }
      } else if (tag !== 'BUTTON') {
        pending = '';
      }
    }
  }
  return -1;
}

// ---------------------------------------------------------------- stamps
// R5 discipline: every judged quantity is frozen here inside setup, and every
// assertion compares stamps only. A stamp is written once per key per
// checkpoint; re-writing the same key is allowed because each checkpoint runs
// in its own fresh browser context, so the latch starts empty.
const latch: { [k: string]: any } = {};
function stamp(key: string, value: any): any { latch[String(key)] = value; return value; }
function stamped(key: string): any { return latch[String(key)]; }

// ---------------------------------------------------------------- boot
function setBootRef(ref: any): void {
  appRef = ref;
  bootDone = true;
  try { ref.tick(); tickDone = true; } catch (e) { tickDone = false; }
  // A second tick on the next macrotask catches the *ngFor projection that the
  // first synchronous tick can precede. This is the whole point of not using
  // window.load as the readiness rule.
  setTimeout(function () {
    tickTries++;
    try { if (appRef) { appRef.tick(); } tickDone = true; } catch (e) { /* tick already running */ }
  }, 0);
}
function nudge(): void {
  if (!appRef) { return; }
  try { appRef.tick(); } catch (e) { /* recursive tick - ignore */ }
}

// ---------------------------------------------------------------- readers
function routeFace(): string {
  if (q('app-about')) { return 'about'; }
  const c = dashContainer();
  if (!c) { return 'none'; }
  const ov = css(c, 'overflow');
  const oy = css(c, 'overflowY');
  if (ov === 'auto' || ov === 'scroll' || oy === 'auto' || oy === 'scroll') { return 'fixedDimension'; }
  if (q('ngx-widget-grid')) { return 'basic'; }
  return 'none';
}
function ready(): boolean {
  if (!bootDone || !tickDone) { return false; }
  const root = q('app-root');
  if (!root || !root.children || root.children.length === 0) { return false; }
  const face = routeFace();
  if (face === 'basic' || face === 'fixedDimension') {
    if (!gridEl()) { return false; }
    if (hostCount() < 1) { return false; }
    if (!(gridContentPx('width') > 0) || !(gridContentPx('height') > 0)) { return false; }
  }
  return true;
}
function hostCount(): number { return hosts().length; }
function panelCount(): number { return qa('ngx-widget-grid ngx-widget .my-widgets').length; }
function styledHosts(): number {
  const props = ['top', 'left', 'width', 'height'];
  const hs = hosts();
  let n = 0;
  for (let i = 0; i < hs.length; i++) {
    const st = hs[i].style;
    let has = false;
    for (let k = 0; k < props.length; k++) { if (st && st.getPropertyValue(props[k])) { has = true; break; } }
    if (has) { n++; }
  }
  return n;
}
function hostLabels(): string {
  const hs = hosts();
  const out: string[] = [];
  for (let i = 0; i < hs.length; i++) { out.push(labelOf(hs[i])); }
  return out.join('|');
}
function inlinePct(label: string, prop: string): string {
  const h = hostByLabel(String(label));
  if (!h || !h.style) { return ''; }
  return String(h.style.getPropertyValue(String(prop)) || '');
}
function boxPx(label: string, side: string): number {
  const r = rectOf(hostByLabel(String(label)));
  return r ? num(r[String(side)], -1) : -1;
}
function gridContentPx(side: string): number {
  const r = rectOf(gridEl());
  return r ? num(r[String(side)], -1) : -1;
}
function domRows(): number { return labelledNumber('Rows:'); }
function domCols(): number { return labelledNumber('Cols:'); }
function cellPx(axis: string): number {
  const rows = domRows(), cols = domCols();
  if (String(axis) === 'x') { return cols > 0 ? gridContentPx('width') / cols : -1; }
  return rows > 0 ? gridContentPx('height') / rows : -1;
}
function previewCount(): number { return previewEls().length; }
function previewBoxPx(side: string): number {
  const r = rectOf(previewEl());
  return r ? num(r[String(side)], -1) : -1;
}
function previewBoxPct(side: string): string {
  const p = previewEl();
  if (!p || !p.style) { return ''; }
  return String(p.style.getPropertyValue(String(side)) || '');
}
function previewAreaPct(): number {
  const p = previewEl();
  if (!p || !p.style) { return -1; }
  const w = parseFloat(String(p.style.getPropertyValue('width') || ''));
  const h = parseFloat(String(p.style.getPropertyValue('height') || ''));
  if (!isFinite(w) || !isFinite(h)) { return -1; }
  return w * h;
}
function centreOf(r: any): any {
  if (!r) { return null; }
  return { x: (num(r.left, 0) + num(r.right, 0)) / 2, y: (num(r.top, 0) + num(r.bottom, 0)) / 2 };
}
function inside(c: any, r: any): boolean {
  if (!c || !r) { return false; }
  return c.x >= num(r.left, 0) && c.x <= num(r.right, 0) && c.y >= num(r.top, 0) && c.y <= num(r.bottom, 0);
}
function hostCentresInsidePreview(): number {
  const pr = rectOf(previewEl());
  if (!pr) { return 0; }
  const hs = hosts();
  let n = 0;
  for (let i = 0; i < hs.length; i++) { if (inside(centreOf(rectOf(hs[i])), pr)) { n++; } }
  return n;
}
function centresInsideGrid(): number {
  const gr = rectOf(gridEl());
  if (!gr) { return 0; }
  const hs = hosts();
  let n = 0;
  for (let i = 0; i < hs.length; i++) { if (inside(centreOf(rectOf(hs[i])), gr)) { n++; } }
  return n;
}
function gridLineRowCount(): number { return gridLines('wg-preview-row').length; }
function gridLineColCount(): number { return gridLines('wg-preview-column').length; }
function gridLineTops(axis: string): string {
  const kind = String(axis) === 'x' ? 'wg-preview-column' : 'wg-preview-row';
  const prop = String(axis) === 'x' ? 'left' : 'top';
  const els = gridLines(kind);
  const out: string[] = [];
  for (let i = 0; i < els.length; i++) { out.push(String(els[i].style ? els[i].style.getPropertyValue(prop) || '' : '')); }
  return out.join('|');
}
function movingClassHosts(): number {
  const hs = hosts();
  let n = 0;
  for (let i = 0; i < hs.length; i++) {
    try { if (hs[i].classList && hs[i].classList.contains('wg-moving')) { n++; } } catch (e) { /* no classList */ }
  }
  return n;
}
function opacityOfContent(label: string): number {
  const h = hostByLabel(String(label));
  const el = h ? h.querySelector('.wg-widget-content') : null;
  return el ? num(css(el, 'opacity'), -1) : -1;
}
function resizeLayerOpacity(label: string): number {
  const h = hostByLabel(String(label));
  const el = h ? h.querySelector('.wg-widget-edit-resize') : null;
  return el ? num(css(el, 'opacity'), -1) : -1;
}
function pairwiseOverlapCount(): number {
  const rs: any[] = [];
  const hs = hosts();
  for (let i = 0; i < hs.length; i++) { const r = rectOf(hs[i]); if (r) { rs.push(r); } }
  let n = 0;
  for (let a = 0; a < rs.length; a++) {
    for (let b = a + 1; b < rs.length; b++) {
      const ix = Math.min(num(rs[a].right, 0), num(rs[b].right, 0)) - Math.max(num(rs[a].left, 0), num(rs[b].left, 0));
      const iy = Math.min(num(rs[a].bottom, 0), num(rs[b].bottom, 0)) - Math.max(num(rs[a].top, 0), num(rs[b].top, 0));
      // STRICTLY positive area: a zero-area edge touch is not an overlap.
      if (ix > 0 && iy > 0) { n++; }
    }
  }
  return n;
}

function editButton(): any { const b = formButtons(); return b.length ? b[0] : null; }
function widgetPlusButton(): any { const b = formButtons(); return b.length > 1 ? b[1] : null; }
function editButtonLabel(): string { return norm(editButton() ? editButton().textContent : ''); }
function isEditable(): boolean { return editButtonLabel() === 'Done'; }
function widgetPlusVisible(): boolean {
  const b = widgetPlusButton();
  if (!b) { return false; }
  if (b.hidden) { return false; }
  return css(b, 'display') !== 'none' && css(b, 'visibility') !== 'hidden';
}
function moveLayerCount(): number { return qa('ngx-widget-grid .wg-widget-edit-move').length; }
function resizeLayerCount(): number { return qa('ngx-widget-grid .wg-widget-edit-resize').length; }
function resizeHandleCount(): number { return qa('ngx-widget-grid .wg-resize').length; }
function checkboxById(id: string): any { return q('.dashboard-container #' + id); }
function gridCheckboxChecked(): boolean {
  const c = checkboxById('grid');
  return c ? !!c.checked : false;
}
function containerOverflow(): string { return css(dashContainer(), 'overflow'); }
function containerDisplay(): string { return css(dashContainer(), 'display'); }
function hash(): string { try { return String(W.location.hash); } catch (e) { return ''; } }
function search(): string { try { return String(W.location.search); } catch (e) { return ''; } }
function baseURI(): string { try { return String(D.baseURI); } catch (e) { return ''; } }

// True only if EVERY script src on the page resolves under the base-href prefix
// the build was produced with. This is the property the symlink stage must
// establish, because the static server has no prefix option of its own.
function scriptSrcsUnderPrefix(): boolean {
  const prefix = '/ngx-widget-grid/';
  const els = qa('script[src]');
  if (!els.length) { return false; }
  for (let i = 0; i < els.length; i++) {
    const src = String(els[i].getAttribute('src') || '');
    const abs = String(els[i].src || '');
    if (src.indexOf(prefix) < 0 && abs.indexOf(prefix) < 0) { return false; }
  }
  return true;
}
function storageCounts(): any {
  let ls = -1, ss = -1;
  try { ls = W.localStorage.length; } catch (e) { ls = -1; }
  try { ss = W.sessionStorage.length; } catch (e) { ss = -1; }
  let ck = 0;
  try { ck = String(D.cookie || '').length; } catch (e) { ck = -1; }
  let idb = 0;
  try { idb = Object.keys(netCount.idbNames).length; } catch (e) { idb = -1; }
  return {
    localStorage: ls,
    sessionStorage: ss,
    cookieChars: ck,
    indexedDbNames: idb,
    fetchLikeCalls: netCount.fetch + netCount.xhrOpen + netCount.ws + netCount.es + netCount.beacon
  };
}
function dunderGlobals(): any {
  const out: any = {};
  try {
    const names = Object.getOwnPropertyNames(W);
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      if (n.indexOf('__') === 0 && !dunderBaseline[n]) { out[n] = typeof (W as any)[n]; }
    }
  } catch (e) { /* unreadable window */ }
  return out;
}
function testidsInsideGrid(): number {
  const g = gridEl();
  if (!g) { return 0; }
  try { return g.querySelectorAll('[data-testid]').length; } catch (e) { return -1; }
}
// Re-derives the projection invariant from the LIVE Rows/Cols labels rather than
// from any constant: every inline percentage a host carries must be an integer
// multiple of 100/rows (top, height) or 100/cols (left, width).
// LANE-BURN FIX LBC-2 (seat 13, G1-baseline red forensics, lane 2026-09-19T14:26:56Z@9490):
// the test is done in the VALUE domain against each value's OWN CSS serialisation quantum
// (10^-decimals, read off the serialised string; capped at 1e-2 pp, floored at 1e-9) instead of a
// RELATIVE 1e-6 test on v/step. Blink serialises <percentage> to 6 significant digits, so the
// quantum is PER VALUE and not one constant -- MEASURED on this seed: "16.6667%"/"28.5714%" carry
// 4 decimals (1e-4), "133.333%"/"166.667%" carry 3 (1e-3), "12.5%"/"37.5%" carry 1, and
// "0%"/"25%"/"50%"/"100%"/"200%" carry 0. A fixed absolute 1e-4 pp tolerance was FALSIFIED by this
// bench on these very strings ("133.333" differs from the nearest multiple of 100/6 by 3.333e-4 >
// 1e-4, so 4 accept-side injected-boot snapshots read q=1..2 instead of 0); that falsifying run is
// preserved as BENCH_quantisation_v1_abs1e4.json. Why the fix at all: at 6x6 (step
// 16.666666666666668) 33.3333/step = 1.999998, so the old relative test fined the platform's own
// rounding -- MEASURED q0 = 3 in clean AND in the injected state, i.e. PHARD-1(a) was unsatisfiable
// in all three states and the lane reported "red: F03,PHARD-1" with G-install/G-build ok.
// Discrimination is kept: the 1e-2 pp cap is 0.08% of the tightest measured pitch (100/8 = 12.5
// pp), and MEASURED the injected final state carries 66.6667% while the live labels say cols=8
// (step 12.5), nearest multiple 62.5, deviation 4.1667 pp = 41667x that value's own 1e-4 quantum =
// 417x the cap. Two-sided bench (node, over the measured strings):
//
function quantisationViolations(): number {
  const rows = domRows(), cols = domCols();
  if (!(rows > 0) || !(cols > 0)) { return -1; }
  const stepY = 100 / rows, stepX = 100 / cols;
  const pairs = [['top', stepY], ['height', stepY], ['left', stepX], ['width', stepX]];
  const hs = hosts();
  let bad = 0;
  for (let i = 0; i < hs.length; i++) {
    const st = hs[i].style;
    if (!st) { bad++; continue; }
    let violates = false;
    for (let k = 0; k < pairs.length; k++) {
      const raw = String(st.getPropertyValue(pairs[k][0] as string) || '');
      if (!raw || raw.indexOf('%') < 0) { violates = true; break; }
      const v = parseFloat(raw);
      if (!isFinite(v)) { violates = true; break; }
      const step = pairs[k][1] as number;
      const nearest = Math.round(v / step) * step;
      const frac = raw.split('.')[1] || '';
      const decimals = frac.replace(/[^0-9]/g, '').length;
      const quantum = Math.max(Math.min(Math.pow(10, -decimals), 1e-2), 1e-9);
      if (Math.abs(v - nearest) > quantum) { violates = true; break; }   // PER-VALUE CSS serialisation quantum (10^-decimals, cap 1e-2 pp) -- LBC-2
    }
    if (violates) { bad++; }
  }
  return bad;
}
function inlineUnitCensus(): any {
  const props = ['top', 'left', 'width', 'height'];
  const hs = hosts();
  let all = 0, pct = 0, px = 0;
  for (let i = 0; i < hs.length; i++) {
    const st = hs[i].style;
    if (!st) { continue; }
    let any = false, allPct = true, anyPx = false;
    for (let k = 0; k < props.length; k++) {
      const raw = String(st.getPropertyValue(props[k]) || '');
      if (!raw) { allPct = false; continue; }
      any = true;
      if (raw.indexOf('%') < 0) { allPct = false; }
      if (raw.indexOf('px') >= 0) { anyPx = true; }
    }
    if (!any) { continue; }
    all++;
    if (allPct) { pct++; }
    if (anyPx) { px++; }
  }
  return { all: all, pct: pct, px: px, mixed: all - pct - px };
}

// ---------------------------------------------------------------- actions
function clickEl(el: any): boolean {
  if (!el) { return false; }
  try { el.click(); nudge(); return true; } catch (e) { return false; }
}
function clickEditIfNotEditable(): boolean {
  if (isEditable()) { return true; }
  return clickEl(editButton());
}
function clickDoneIfEditable(): boolean {
  if (!isEditable()) { return true; }
  return clickEl(editButton());
}
function clickWidgetPlus(): boolean { return clickEl(widgetPlusButton()); }
function mouseOn(el: any, type: string, bubbles: boolean): boolean {
  if (!el) { return false; }
  try {
    const ev = new MouseEvent(type, { bubbles: bubbles, cancelable: true, view: W });
    el.dispatchEvent(ev);
    nudge();
    return true;
  } catch (e) { return false; }
}
function hoverWidgetPlus(): boolean { return mouseOn(widgetPlusButton(), 'mouseover', true); }
function leaveWidgetPlus(): boolean { return mouseOn(widgetPlusButton(), 'mouseleave', false); }
function hoverHost(label: string): boolean { return mouseOn(hostByLabel(String(label)), 'mouseover', true); }
function unhoverHost(label: string): boolean { return mouseOn(hostByLabel(String(label)), 'mouseout', true); }
function toggleGridCheckbox(): boolean { return clickEl(checkboxById('grid')); }
function setSwapCheckbox(on: boolean): boolean {
  const c = checkboxById('swapper');
  if (!c) { return false; }
  if (!!c.checked === !!on) { return true; }
  return clickEl(c);
}
// Rows and Cols each own a .btn-group whose first button is minus and second is
// plus (basic-example.component.html:32-41 and :43-52).
function groupButton(groupIndex: number, plus: boolean): any {
  const gs = btnGroups();
  if (gs.length <= groupIndex) { return null; }
  const btns = Array.prototype.slice.call(gs[groupIndex].querySelectorAll('button'));
  if (!btns.length) { return null; }
  return plus ? btns[btns.length - 1] : btns[0];
}
function clickRowsPlus(n: number): number {
  const el = groupButton(0, true);
  let done = 0;
  const times = Math.max(0, Math.floor(num(n, 0)));
  for (let i = 0; i < times; i++) { if (clickEl(el)) { done++; } }
  return done;
}
function clickColsPlus(n: number): number {
  const el = groupButton(1, true);
  let done = 0;
  const times = Math.max(0, Math.floor(num(n, 0)));
  for (let i = 0; i < times; i++) { if (clickEl(el)) { done++; } }
  return done;
}
function gotoHash(h: string): string {
  try { W.location.hash = String(h); } catch (e) { /* unassignable location */ }
  return hash();
}

// ---------------------------------------------------------------- synthetic drag
// MANDATED aim inset, measured not assumed: getAnchor (widgetMover.directive.ts
// :173-174) pushes the aim one whole cell forward whenever the in-cell remainder
// exceeds half a cell, so the aim must stay in the FIRST HALF of the target
// cell. 0.25 is the midpoint of the measured safe window; 0.5 sits exactly on
// the comparison boundary and 0 trips the determineFinalPos no-op guard at
// :179-181. A constructed PointerEvent has no grab point at all - offsetX and
// offsetY are not members of PointerEventInit, so `event.offsetX || layerX` at
// :58-59 is undefined and `(undefined + offsetTop) || 0` at :63-65 collapses
// moverOffset to zero - which is exactly why the host top-left lands AT the aim.
const AIM_INSET = 0.25;
const DRAG_STEP_MS = 60;
const lastAim: { [k: string]: any } = {};

// Mirrors NgxWidgetGridComponent.getGridRectangle() (grid.component.ts:136-149)
// so the aim is expressed in the SAME page-space the directive subtracts.
function gridPageOrigin(): any {
  const r = rectOf(gridEl());
  if (!r) { return null; }
  const de = D.documentElement;
  return {
    top: num(r.top, 0) + num(W.pageYOffset, 0) - num(de ? de.clientTop : 0, 0),
    left: num(r.left, 0) + num(W.pageXOffset, 0) - num(de ? de.clientLeft : 0, 0),
    width: num(r.width, 0),
    height: num(r.height, 0)
  };
}
function pointerEvent(type: string, x: number, y: number): any {
  const init: any = {
    bubbles: true, cancelable: true, view: W,
    clientX: x, clientY: y, screenX: x, screenY: y,
    button: 0, buttons: type === 'pointerup' || type === 'mouseup' ? 0 : 1,
    pointerId: 1, pointerType: 'mouse', isPrimary: true, width: 1, height: 1
  };
  try {
    if (typeof W.PointerEvent === 'function') { return new W.PointerEvent(type, init); }
  } catch (e) { /* fall through to MouseEvent */ }
  return new MouseEvent(type, init);
}
// Only PointerEvent is dispatched. Registration at widgetMover.directive.ts
// :75-81 is exclusive: where PointerEvent exists the mousemove/mouseup branch
// at :79-80 is never taken, so a synthetic mouse event would be ignored.
async function dragToCell(label: string, row: number, col: number, opts?: any): Promise<number> {
  const key = String(label);
  const host = hostByLabel(key);
  if (!host) { return -1; }
  const layer = host.querySelector('.wg-widget-edit-move');
  if (!layer) { return -2; }
  const o = gridPageOrigin();
  if (!o || !(o.width > 0) || !(o.height > 0)) { return -3; }
  const rows = domRows(), cols = domCols();
  if (!(rows > 0) || !(cols > 0)) { return -4; }
  const r = num(row, 0), c = num(col, 0);
  if (!(r >= 1) || !(c >= 1) || r > rows || c > cols) { return -5; }
  const cellX = o.width / cols, cellY = o.height / rows;
  if (!(cellX > 0) || !(cellY > 0)) { return -6; }
  const tx = o.left + (c - 1) * cellX + AIM_INSET * cellX;
  const ty = o.top + (r - 1) * cellY + AIM_INSET * cellY;
  lastAim[key] = { x: tx, y: ty };
  const lr = rectOf(layer);
  const dx = lr ? num(lr.left, 0) + num(lr.width, 0) / 2 : tx;
  const dy = lr ? num(lr.top, 0) + num(lr.height, 0) / 2 : ty;
  const hold = !!(opts && opts.hold);
  try { layer.dispatchEvent(pointerEvent('pointerdown', dx, dy)); } catch (e) { return -7; }
  nudge();
  await sleep(DRAG_STEP_MS);
  W.dispatchEvent(pointerEvent('pointermove', tx, ty));
  nudge();
  await sleep(DRAG_STEP_MS);
  if (!hold) {
    W.dispatchEvent(pointerEvent('pointerup', tx, ty));
    nudge();
    await sleep(DRAG_STEP_MS);
  }
  return 1;
}
function releaseDrag(label: string): number {
  const key = String(label);
  const a = lastAim[key];
  let x = 0, y = 0;
  if (a) { x = num(a.x, 0); y = num(a.y, 0); }
  else {
    const r = rectOf(hostByLabel(key));
    if (!r) { return -1; }
    x = (num(r.left, 0) + num(r.right, 0)) / 2;
    y = (num(r.top, 0) + num(r.bottom, 0)) / 2;
  }
  try { W.dispatchEvent(pointerEvent('pointerup', x, y)); } catch (e) { return -2; }
  nudge();
  return 1;
}

// ---------------------------------------------------------------- the bridge
const RB: any = {
  // lifecycle
  setBootRef: setBootRef, ready: ready, nudge: nudge,
  // stamps (R5: freeze in setup, compare stamps in the assertion)
  stamp: stamp, stamped: stamped,
  // structure and labels
  hostCount: hostCount, panelCount: panelCount, hostLabels: hostLabels,
  styledHosts: styledHosts, moveLayerCount: moveLayerCount,
  resizeLayerCount: resizeLayerCount, resizeHandleCount: resizeHandleCount,
  // geometry
  inlinePct: inlinePct, boxPx: boxPx, gridContentPx: gridContentPx,
  domRows: domRows, domCols: domCols, cellPx: cellPx,
  previewCount: previewCount, previewBoxPx: previewBoxPx, previewBoxPct: previewBoxPct,
  previewAreaPct: previewAreaPct, hostCentresInsidePreview: hostCentresInsidePreview,
  centresInsideGrid: centresInsideGrid, gridLineRowCount: gridLineRowCount,
  gridLineColCount: gridLineColCount, gridLineTops: gridLineTops,
  pairwiseOverlapCount: pairwiseOverlapCount,
  // visual state
  movingClassHosts: movingClassHosts, opacityOfContent: opacityOfContent,
  resizeLayerOpacity: resizeLayerOpacity,
  // app controls
  isEditable: isEditable, editButtonLabel: editButtonLabel,
  widgetPlusVisible: widgetPlusVisible, gridCheckboxChecked: gridCheckboxChecked,
  containerOverflow: containerOverflow, containerDisplay: containerDisplay,
  // routing and document
  routeFace: routeFace, hash: hash, search: search, baseURI: baseURI,
  scriptSrcsUnderPrefix: scriptSrcsUnderPrefix,
  // state isolation (strict emptiness, no allowlist)
  storageCounts: storageCounts, dunderGlobals: dunderGlobals,
  // anti-cheat canaries
  testidsInsideGrid: testidsInsideGrid, quantisationViolations: quantisationViolations,
  inlineUnitCensus: inlineUnitCensus,
  // actions
  clickEditIfNotEditable: clickEditIfNotEditable, clickDoneIfEditable: clickDoneIfEditable,
  clickWidgetPlus: clickWidgetPlus, hoverWidgetPlus: hoverWidgetPlus,
  leaveWidgetPlus: leaveWidgetPlus, hoverHost: hoverHost, unhoverHost: unhoverHost,
  toggleGridCheckbox: toggleGridCheckbox, setSwapCheckbox: setSwapCheckbox,
  clickRowsPlus: clickRowsPlus, clickColsPlus: clickColsPlus,
  dragToCell: dragToCell, releaseDrag: releaseDrag, gotoHash: gotoHash,
  // provenance, so a reviewer can tell which aim rule the face actually used
  aimRule: { inset: AIM_INSET, space: 'page (mirrors getGridRectangle)', eventType: 'PointerEvent only', stepMs: DRAG_STEP_MS }
};
W.__RB__ = RB;
