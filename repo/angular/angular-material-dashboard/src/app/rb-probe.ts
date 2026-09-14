/**
 * rb-probe.ts - RepairBench read-only observation bridge for angular-material-dashboard.
 *
 * Published on `window.__AMD__`. Every reading is taken from the LIVE DOM (text nodes,
 * attributes, class lists), from getComputedStyle, from the resource-timing buffer or from
 * a passive latch installed at import time: the bridge never reads an Angular component
 * field, never reaches into a Highcharts chart object and never mutates application state
 * on its own. The only writes it performs are the ones a user could perform
 * (element.click() on a toolbar button, on a sidebar anchor, on a paginator select and on
 * one of its options), and every driver reports what it did as a string so a checkpoint can
 * PROVE the interaction happened instead of trusting a sleep.
 *
 * Two deliberate consequences of the offline adaptation (the two fonts.googleapis.com links
 * are removed by environment/adaptation.patch): <mat-icon> renders its LIGATURE TEXT
 * ('menu', 'trending_up', 'exit_to_app') instead of a glyph, and Highcharts readings are
 * taken from SVG class names and text nodes. Nothing here reads a colour, a pixel, a font
 * metric or a screenshot, so no checkpoint depends on a webfont being present.
 *
 * Nothing here throws: every getter is wrapped, and an unavailable reading degrades to the
 * sentinel '-' (or -1 for a count) rather than to an exception, so a checkpoint can only
 * fail on a measured value and never on a bridge crash.
 *
 * TypeScript 3.4 / ES2018 discipline (Angular 8, @angular-devkit/build-angular ~0.800):
 * no optional chaining, no nullish coalescing, no binding-less catch, no ES2019+ library
 * member. tsconfig.app.json sets "types": [], so only the DOM lib is available.
 */
type AnyEl = Element;

const AMD_VERSION = '1.0-r24amd';
const NA = '-';
const REMOTE = /^(https?:)?\/\//;

/* ------------------------------------------------------------------ *
 * passive latches, installed at import time (before bootstrapModule)
 * ------------------------------------------------------------------ */

const pageErrors: string[] = [];
const rejections: string[] = [];
const consoleErrors: string[] = [];

function brief(v: unknown): string {
  try {
    if (typeof v === 'string') return v.slice(0, 240);
    if (v && typeof v === 'object') {
      const anyV = v as { message?: unknown; reason?: unknown };
      if (typeof anyV.message === 'string') return anyV.message.slice(0, 240);
      if (anyV.reason) return brief(anyV.reason);
      return JSON.stringify(v).slice(0, 240);
    }
    return String(v).slice(0, 240);
  } catch (e) {
    return 'unserializable';
  }
}

try {
  window.addEventListener('error', (ev: any) => {
    try { pageErrors.push(brief(ev && ev.error ? ev.error : (ev ? ev.message : 'error'))); } catch (e) { pageErrors.push('latch-failure'); }
  });
} catch (e) { /* the latch must never break the app */ }

try {
  window.addEventListener('unhandledrejection', (ev: any) => {
    try { rejections.push(brief(ev && ev.reason !== undefined ? ev.reason : 'rejection')); } catch (e) { rejections.push('latch-failure'); }
  });
} catch (e) { /* ditto */ }

try {
  const origError = console.error.bind(console) as (...data: unknown[]) => void;
  console.error = (...data: unknown[]): void => {
    try {
      consoleErrors.push(data.map((d) => brief(d)).join(' ').slice(0, 300));
    } catch (e) { /* ditto */ }
    origError(...data);
  };
} catch (e) { /* ditto */ }

/* ------------------------------------------------------------------ *
 * DOM primitives
 * ------------------------------------------------------------------ */

function q(sel: string, root?: ParentNode | null): AnyEl[] {
  try {
    const r: ParentNode = root === undefined || root === null ? document : root;
    return Array.from(r.querySelectorAll(sel));
  } catch (e) {
    return [];
  }
}

function one(sel: string, root?: ParentNode | null): AnyEl | null {
  const list = q(sel, root);
  return list.length ? list[0] : null;
}

function norm(s: string | null): string {
  try {
    return String(s === null || s === undefined ? '' : s).replace(/\s+/g, ' ').trim();
  } catch (e) {
    return '';
  }
}

function txt(el: AnyEl | null): string {
  if (!el) return NA;
  try {
    const t = norm(el.textContent);
    return t === '' ? NA : t;
  } catch (e) {
    return NA;
  }
}

function txts(list: AnyEl[]): string {
  try {
    if (!list.length) return NA;
    return list.map((el) => norm(el.textContent)).join('|');
  } catch (e) {
    return NA;
  }
}

function cls(el: AnyEl | null): string {
  if (!el) return '';
  try {
    const c = el.getAttribute('class');
    return c === null ? '' : String(c);
  } catch (e) {
    return '';
  }
}

function hasClass(el: AnyEl | null, name: string): boolean {
  if (!el) return false;
  try {
    return cls(el).split(/\s+/).indexOf(name) >= 0;
  } catch (e) {
    return false;
  }
}

function attr(el: AnyEl | null, name: string): string {
  if (!el) return NA;
  try {
    const v = el.getAttribute(name);
    return v === null ? NA : String(v);
  } catch (e) {
    return NA;
  }
}

function cs(el: AnyEl | null, prop: string): string {
  if (!el) return NA;
  try {
    const v = getComputedStyle(el as HTMLElement)[prop as any];
    return v === undefined || v === null || v === '' ? NA : String(v);
  } catch (e) {
    return NA;
  }
}

function count(sel: string, root?: ParentNode | null): number {
  try {
    return q(sel, root).length;
  } catch (e) {
    return -1;
  }
}

function yesno(b: boolean): string {
  return b ? 'yes' : 'no';
}

/** textContent of an element with every <mat-icon> descendant removed (a read-only clone). */
function labelWithoutIcons(el: AnyEl | null): string {
  if (!el) return NA;
  try {
    const clone = el.cloneNode(true) as AnyEl;
    const icons = q('mat-icon', clone as unknown as ParentNode);
    for (const ic of icons) {
      try { if (ic.parentNode) ic.parentNode.removeChild(ic); } catch (e) { /* keep going */ }
    }
    const t = norm(clone.textContent);
    return t === '' ? NA : t;
  } catch (e) {
    return NA;
  }
}

/**
 * textContent of an SVG <text> with Highcharts' text-outline duplicate removed (a read-only clone).
 * Highcharts 7.2.0 turns plotOptions.series.dataLabels.style.textOutline -- which defaults to
 * '1px contrast' -- into a paint hack in SVGElement.applyTextOutline(): it takes EVERY <tspan> of the
 * label, clones it, tags the clone class="highcharts-text-outline" plus the stroke attributes, and
 * inserts each clone BEFORE the first real child of the <text>. SVGRenderer.buildText() emits one
 * FLAT <tspan> per markup span and deliberately never nests them ("Nested tags aren't supported, and
 * cause crash in Safari (#1596)"), so the seed's format '<b>{point.name}</b>: {point.percentage:.1f} %'
 * (pie.component.ts:35-38 enables dataLabels and sets a format but NO style override, so the default
 * outline applies) yields two real tspans -- "Chrome" and ": 61.4 %" -- and therefore two clones ahead
 * of them. A naive textContent then reads "Chrome" + ": 61.4 %" + "Chrome" + ": 61.4 %", i.e.
 * "Chrome: 61.4 %Chrome: 61.4 %", which is exactly what P17 measured on the clean face. The clone is a
 * paint artefact and not label content, so it is dropped from a deep clone before the text is taken;
 * the live chart DOM is never touched. Same read-only-clone idiom as labelWithoutIcons() above.
 */
function labelTextNoOutline(el: AnyEl | null): string {
  if (!el) return NA;
  try {
    const clone = el.cloneNode(true) as AnyEl;
    const ghosts = q('.highcharts-text-outline', clone as unknown as ParentNode);
    for (const g of ghosts) {
      try { if (g.parentNode) g.parentNode.removeChild(g); } catch (e) { /* keep going */ }
    }
    const t = norm(clone.textContent);
    return t === '' ? NA : t;
  } catch (e) {
    return NA;
  }
}

/* ------------------------------------------------------------------ *
 * Highcharts chart locating - by SEED TEMPLATE TAG, never by content,
 * so no defect can move a chart out of the bridge's reach
 * ------------------------------------------------------------------ */

function chartHost(sel: string): AnyEl | null {
  return one(sel + ' highcharts-chart');
}

function chartSvg(sel: string): AnyEl | null {
  const host = chartHost(sel);
  if (!host) return null;
  return one('.highcharts-container svg', host as unknown as ParentNode) || one('svg', host as unknown as ParentNode);
}

function cardChartSvgs(): AnyEl[] {
  const hosts = q('app-widget-card highcharts-chart');
  const out: AnyEl[] = [];
  for (const h of hosts) {
    const svg = one('.highcharts-container svg', h as unknown as ParentNode) || one('svg', h as unknown as ParentNode);
    if (svg) out.push(svg);
  }
  return out;
}

function svgTexts(svg: AnyEl | null, sel: string): string[] {
  if (!svg) return [];
  return q(sel, svg as unknown as ParentNode).map((el) => norm(el.textContent));
}

/**
 * The series-group class list is built at runtime by Highcharts 7 plotGroup():
 *   "highcharts-" + name + " highcharts-series-" + index + " highcharts-" + type + "-series ..."
 * so the TYPE token is read back out of every group class list inside one chart.
 */
function seriesTypeSignature(svg: AnyEl | null): string {
  try {
    if (!svg) return NA;
    const found: string[] = [];
    const groups = q('g', svg as unknown as ParentNode);
    for (const g of groups) {
      const toks = cls(g).split(/\s+/);
      for (const t of toks) {
        const m = /^highcharts-([a-z]+)-series$/.exec(t);
        if (m && found.indexOf(m[1]) < 0) found.push(m[1]);
      }
    }
    if (!found.length) return NA;
    found.sort();
    return found.join('|');
  } catch (e) {
    return NA;
  }
}

/** First text node inside the chart's data-label groups whose text starts with `prefix`. */
function dataLabelTextStarting(svg: AnyEl | null, prefix: string): string {
  try {
    if (!svg) return NA;
    let pool = q('.highcharts-data-labels text', svg as unknown as ParentNode);
    if (!pool.length) {
      pool = q('text', svg as unknown as ParentNode).filter((el) => {
        const c = cls(el) + ' ' + cls(el.parentNode as AnyEl);
        return !/highcharts-(tooltip|legend|title|subtitle|credits|axis)/.test(c);
      });
    }
    for (const el of pool) {
      const t = labelTextNoOutline(el);
      if (t.indexOf(prefix) === 0) return t;
    }
    return NA;
  } catch (e) {
    return NA;
  }
}

/* ------------------------------------------------------------------ *
 * shell: toolbar, drawer, sidebar, footer, routed outlet
 * ------------------------------------------------------------------ */

function toolbarSpanText(): string {
  return txt(one('mat-toolbar mat-toolbar-row > span'));
}

function toolbarIconLigatures(): string {
  return txts(q('mat-toolbar mat-icon'));
}

function headerButtonByIcon(ligature: string): AnyEl | null {
  const buttons = q('mat-toolbar button');
  for (const b of buttons) {
    const ic = one('mat-icon', b as unknown as ParentNode);
    if (ic && norm(ic.textContent) === ligature) return b;
  }
  return null;
}

function drawerEl(): AnyEl | null {
  return one('mat-drawer');
}

function drawerModeClass(): string {
  const d = drawerEl();
  if (!d) return NA;
  const c = cls(d);
  if (/\bmat-drawer-side\b/.test(c)) return 'side';
  if (/\bmat-drawer-over\b/.test(c)) return 'over';
  if (/\bmat-drawer-push\b/.test(c)) return 'push';
  return NA;
}

function drawerOpened(): string {
  return yesno(hasClass(drawerEl(), 'mat-drawer-opened'));
}

/**
 * Container-side witness of \`sideBarOpen\`, read through the channel Material 8.2.3 actually
 * maintains in the drawer mode this seed declares.
 * The obvious candidate, mat-drawer-container-has-open on <mat-drawer-container>, is NOT available
 * here. In @angular/material/bundles/material-sidenav.umd.js the ONLY caller of
 * MatDrawerContainer._setContainerClass() -- the only place that string is ever added to a classList
 * -- sits inside \`if (drawer.mode !== 'side') { drawer.openedChange...subscribe(...) }\`, and the
 * container's own host map binds just 'class': 'mat-drawer-container' plus
 * '[class.mat-drawer-container-explicit-backdrop]': '_backdropOverride'. The rule
 * .mat-drawer-container[fullscreen].mat-drawer-container-has-open{overflow:hidden} does ship inside
 * the component styles, which is where that class name comes from, but default.component.html:4
 * declares mode="side", so on NO face of this task can the class ever be present.
 * What the container does maintain in side mode is the content margin:
 * MatDrawerContainer.ngAfterContentInit() calls updateContentMargins() whenever a drawer is open
 * (\`!this._drawers.length || this._isDrawerOpen(this._start) || this._isDrawerOpen(this._end)\`, and
 * _isDrawerOpen(d) is \`d != null && d.opened\`); updateContentMargins() adds drawer._width -- the
 * drawer host's own offsetWidth -- to \`left\` only for \`this._left.opened && this._left.mode == 'side'\`;
 * and MatDrawerContent republishes the result through its host binding
 * '[style.margin-left.px]': '_container._contentMargins.left'. Closed => left is null => Angular drops
 * the inline property entirely, so el.style.marginLeft reads ''.
 * An inline margin-left equal to the drawer's live offsetWidth is therefore a second, independently
 * maintained witness of the same field: the margin is computed by the CONTAINER from drawer.opened, not
 * by the drawer's own [class.mat-drawer-opened] host binding, so a repair that only forces the drawer
 * class cannot produce it. default.component.scss:8 pins \`mat-drawer { width: 350px }\`, but the
 * reading compares against the LIVE offsetWidth rather than a number transcribed from a stylesheet, so
 * it cannot go stale against the built DOM.
 * Returns 'yes', or a self-describing 'no:<what was actually there>' so a red leg names its own cause.
 */
function contentMarginEqualsDrawerWidth(): string {
  const content = one('mat-drawer-content');
  const drawer = drawerEl();
  if (!content || !drawer) return NA;
  try {
    const raw = norm((content as HTMLElement).style.marginLeft);
    const m = /^(\d+(?:\.\d+)?)px$/.exec(raw);
    if (!m) return 'no:' + (raw === '' ? 'absent' : raw);
    const w = (drawer as HTMLElement).offsetWidth;
    return Math.abs(parseFloat(m[1]) - w) < 0.5 ? 'yes' : 'no:' + raw + '!=' + w + 'px';
  } catch (e) {
    return NA;
  }
}

function sidebarLinks(): AnyEl[] {
  return q('app-sidebar a[mat-list-item]');
}

function sidebarLinkLabels(): string {
  return txts(sidebarLinks().map((a) => a));
}

function sidebarLinkLabelsNoIcons(): string {
  const out: string[] = [];
  for (const a of sidebarLinks()) out.push(labelWithoutIcons(a));
  try {
    return out.length ? out.join('|') : NA;
  } catch (e) {
    return NA;
  }
}

/** routerLink hrefs with any hash-routing '#' stripped, so the reading is strategy-neutral. */
function sidebarLinkRoutes(): string {
  const out: string[] = [];
  for (const a of sidebarLinks()) {
    let h = attr(a, 'href');
    if (h === NA) { out.push(NA); continue; }
    if (h.charAt(0) === '#') h = h.slice(1);
    out.push(h);
  }
  try {
    return out.length ? out.join('|') : NA;
  } catch (e) {
    return NA;
  }
}

function sidebarSubheaders(): string {
  return txts(q('app-sidebar h2[matSubheader]'));
}

function sidebarProfileTexts(): string {
  const h2 = one('app-sidebar .profile-card .header h2');
  const h4 = one('app-sidebar .profile-card .header h4');
  try {
    return txt(h2) + '|' + txt(h4);
  } catch (e) {
    return NA;
  }
}

function sidebarAvatarSrc(): string {
  return attr(one('app-sidebar .profile-card img'), 'src');
}

function sidebarAvatarAlt(): string {
  return attr(one('app-sidebar .profile-card img'), 'alt');
}

function sidebarAvatarIsRemote(): string {
  const s = sidebarAvatarSrc();
  return yesno(s !== NA && REMOTE.test(s));
}

function footerText(): string {
  return txt(one('footer'));
}

function dividerTagCount(): number {
  return count('mat-divider');
}

/** tag name of the first element child of the routed outlet = which route component is mounted. */
function routedComponentTag(): string {
  const content = one('mat-drawer-content');
  if (!content) return NA;
  try {
    const kids = Array.from(content.children);
    for (const k of kids) {
      const t = norm(k.tagName).toLowerCase();
      if (t.indexOf('app-') === 0) return t;
    }
    return kids.length ? norm(kids[0].tagName).toLowerCase() : NA;
  } catch (e) {
    return NA;
  }
}

function postsText(): string {
  return txt(one('app-posts'));
}

function dashboardPresent(): string {
  return yesno(!!one('app-dashboard'));
}

/* ------------------------------------------------------------------ *
 * self-sufficiency / offline hygiene
 * ------------------------------------------------------------------ */

const REF_SEL = 'script[src], link[href], img[src], iframe[src], source[src], video[src], audio[src], embed[src], object[data]';

function externalRefTagCount(): number {
  try {
    let n = 0;
    for (const el of q(REF_SEL)) {
      const v = attr(el, 'src');
      const h = attr(el, 'href');
      const d = attr(el, 'data');
      for (const cand of [v, h, d]) {
        if (cand !== NA && REMOTE.test(cand)) { n++; break; }
      }
    }
    return n;
  } catch (e) {
    return -1;
  }
}

function externalRefDetail(): string {
  try {
    const hits: string[] = [];
    for (const el of q(REF_SEL)) {
      for (const name of ['src', 'href', 'data']) {
        const cand = attr(el, name);
        if (cand !== NA && REMOTE.test(cand)) hits.push(norm(el.tagName).toLowerCase() + '[' + name + ']=' + cand);
      }
    }
    return hits.length ? hits.join(' , ').slice(0, 400) : 'none';
  } catch (e) {
    return NA;
  }
}

function foreignResourceCount(): number {
  try {
    const entries: any[] = performance.getEntriesByType('resource') as any[];
    let n = 0;
    for (const e of entries) {
      try { if (String(e.name).indexOf(location.origin) !== 0) n++; } catch (e2) { n++; }
    }
    return n;
  } catch (e) {
    return -1;
  }
}

function resourceEntryCount(): number {
  try {
    return (performance.getEntriesByType('resource') as any[]).length;
  } catch (e) {
    return -1;
  }
}

function hasGtag(): string {
  try {
    return yesno(typeof (window as any).gtag !== 'undefined');
  } catch (e) {
    return NA;
  }
}

function hasDataLayer(): string {
  try {
    return yesno(typeof (window as any).dataLayer !== 'undefined');
  } catch (e) {
    return NA;
  }
}

/* ------------------------------------------------------------------ *
 * state isolation (anti-hack residue census)
 * ------------------------------------------------------------------ */

function localStorageCount(): number {
  try { return window.localStorage.length; } catch (e) { return -1; }
}

function sessionStorageCount(): number {
  try { return window.sessionStorage.length; } catch (e) { return -1; }
}

function locationPathname(): string {
  try { return location.pathname; } catch (e) { return NA; }
}

function locationSearch(): string {
  try { return location.search === '' ? '(empty)' : location.search; } catch (e) { return NA; }
}

function locationHash(): string {
  try { return location.hash === '' ? '(empty)' : location.hash; } catch (e) { return NA; }
}

/** own window globals of the __name__ shape, zone.js internals excluded. */
function probeGlobals(): string {
  try {
    const keys = Object.keys(window).filter((k) => /^__[A-Za-z0-9]+__$/.test(k) && k.indexOf('__zone_symbol__') !== 0);
    keys.sort();
    return keys.length ? keys.join('|') : NA;
  } catch (e) {
    return NA;
  }
}

function pageErrorCount(): number {
  try { return pageErrors.length; } catch (e) { return -1; }
}

function pageErrorSample(): string {
  try { return pageErrors.length ? pageErrors[0] : NA; } catch (e) { return NA; }
}

function rejectionCount(): number {
  try { return rejections.length; } catch (e) { return -1; }
}

function consoleErrorCount(): number {
  try { return consoleErrors.length; } catch (e) { return -1; }
}

/* ------------------------------------------------------------------ *
 * the periodic-elements table + paginator
 * ------------------------------------------------------------------ */

function tableEl(): AnyEl | null {
  return one('app-dashboard table[mat-table]') || one('table.mat-table');
}

function tableHeaderTexts(): string {
  const t = tableEl();
  if (!t) return NA;
  return txts(q('tr.mat-header-row th.mat-header-cell', t as unknown as ParentNode));
}

function tableHeaderCellCount(): number {
  const t = tableEl();
  if (!t) return -1;
  return count('tr.mat-header-row th.mat-header-cell', t as unknown as ParentNode);
}

function tableRowCount(): number {
  const t = tableEl();
  if (!t) return -1;
  return count('tr.mat-row', t as unknown as ParentNode);
}

function tableCellText(column: string, rowIndex: number): string {
  const t = tableEl();
  if (!t) return NA;
  try {
    const rows = q('tr.mat-row', t as unknown as ParentNode);
    if (rows.length <= rowIndex) return NA;
    const cell = one('td.mat-column-' + column, rows[rowIndex] as unknown as ParentNode);
    return txt(cell);
  } catch (e) {
    return NA;
  }
}

function tableRowCellTexts(rowIndex: number): string {
  try {
    return ['position', 'name', 'weight', 'symbol'].map((c) => tableCellText(c, rowIndex)).join('|');
  } catch (e) {
    return NA;
  }
}

function paginatorPresent(): string {
  return yesno(!!one('app-dashboard mat-paginator'));
}

function paginatorPageSizeLabel(): string {
  return txt(one('app-dashboard .mat-paginator-page-size-label'));
}

function paginatorPageSizeValue(): string {
  const el = one('app-dashboard .mat-paginator .mat-select-value-text');
  const v = txt(el);
  if (v !== NA) return v;
  return txt(one('app-dashboard .mat-paginator .mat-select-trigger'));
}

function paginatorOptionCount(): number {
  return count('app-dashboard .mat-paginator mat-option');
}

/** digits only, so the reading is immune to the intl range separator. */
function paginatorRangeDigits(): string {
  const t = txt(one('app-dashboard .mat-paginator-range-label'));
  if (t === NA) return NA;
  try {
    const digits = t.match(/[0-9]+/g);
    return digits && digits.length ? digits.join('|') : NA;
  } catch (e) {
    return NA;
  }
}

function paginatorNextDisabled(): string {
  const b = one('app-dashboard .mat-paginator-navigation-next');
  if (!b) return NA;
  return yesno((b as HTMLButtonElement).disabled === true);
}

/* ------------------------------------------------------------------ *
 * stat cards
 * ------------------------------------------------------------------ */

function cardLabels(): string {
  return txts(q('app-widget-card .text h4'));
}

function cardTotals(): string {
  return txts(q('app-widget-card .text .total'));
}

function cardPercentages(): string {
  return txts(q('app-widget-card .text .description'));
}

function cardTargetSuffixes(): string {
  const spans = q('app-widget-card .text > span');
  const out: string[] = [];
  for (const s of spans) {
    const t = norm(s.textContent);
    if (t === 'of target') out.push(t);
  }
  try {
    return out.length ? out.join('|') : NA;
  } catch (e) {
    return NA;
  }
}

function cardIconLigatures(): string {
  return txts(q('app-widget-card mat-icon'));
}

/** the theme-palette token the color mixin wrote onto the card icon host. */
function cardIconPaletteClass(): string {
  const icons = q('app-widget-card mat-icon');
  if (!icons.length) return NA;
  try {
    const found: string[] = [];
    for (const ic of icons) {
      const toks = cls(ic).split(/\s+/);
      for (const t of toks) {
        const m = /^mat-(primary|accent|warn)$/.exec(t);
        if (m && found.indexOf(m[1]) < 0) found.push(m[1]);
      }
    }
    return found.length ? found.sort().join('|') : NA;
  } catch (e) {
    return NA;
  }
}

function cardIconNoColorClass(): string {
  const icons = q('app-widget-card mat-icon');
  let n = 0;
  for (const ic of icons) if (hasClass(ic, 'mat-icon-no-color')) n++;
  return String(n);
}

function cardChartCount(): number {
  return count('app-widget-card highcharts-chart');
}

function cardSparklineContainerCount(): number {
  return count('app-widget-card .highcharts-container');
}

function cardSparklineHostHeight(): string {
  return cs(one('app-widget-card highcharts-chart'), 'height');
}

function cardExportButtonCount(): number {
  const svgs = cardChartSvgs();
  let n = 0;
  for (const s of svgs) n += count('.highcharts-contextbutton', s as unknown as ParentNode);
  return svgs.length ? n : -1;
}

function cardCreditsCount(): number {
  const svgs = cardChartSvgs();
  let n = 0;
  for (const s of svgs) n += count('.highcharts-credits', s as unknown as ParentNode);
  return svgs.length ? n : -1;
}

/* ------------------------------------------------------------------ *
 * the big area chart and the pie chart
 * ------------------------------------------------------------------ */

function bigChartPresent(): string {
  return yesno(!!chartSvg('app-widget-area'));
}

function bigChartLegendTexts(): string {
  const svg = chartSvg('app-widget-area');
  try {
    const t = svgTexts(svg, '.highcharts-legend-item text');
    return t.length ? t.join('|') : NA;
  } catch (e) {
    return NA;
  }
}

function bigChartLegendCount(): number {
  const svg = chartSvg('app-widget-area');
  if (!svg) return -1;
  return count('.highcharts-legend-item', svg as unknown as ParentNode);
}

function bigChartSeriesTypeSignature(): string {
  return seriesTypeSignature(chartSvg('app-widget-area'));
}

function bigChartAreaFillCount(): number {
  const svg = chartSvg('app-widget-area');
  if (!svg) return -1;
  return count('.highcharts-area', svg as unknown as ParentNode);
}

function bigChartAreaFillPresent(): string {
  const n = bigChartAreaFillCount();
  return n < 0 ? NA : yesno(n > 0);
}

function bigChartSeriesGroupCount(): number {
  const svg = chartSvg('app-widget-area');
  if (!svg) return -1;
  return count('.highcharts-series-group > g', svg as unknown as ParentNode);
}

function bigChartTitleText(): string {
  return txt(one('.highcharts-title', chartSvg('app-widget-area') as unknown as ParentNode));
}

function bigChartSubtitleText(): string {
  return txt(one('.highcharts-subtitle', chartSvg('app-widget-area') as unknown as ParentNode));
}

function bigChartCreditsCount(): number {
  const svg = chartSvg('app-widget-area');
  if (!svg) return -1;
  return count('.highcharts-credits', svg as unknown as ParentNode);
}

function bigChartExportButtonCount(): number {
  const svg = chartSvg('app-widget-area');
  if (!svg) return -1;
  return count('.highcharts-contextbutton', svg as unknown as ParentNode);
}

function bigChartHostHeight(): string {
  return cs(chartHost('app-widget-area'), 'height');
}

function pieChartPresent(): string {
  return yesno(!!chartSvg('app-widget-pie'));
}

function pieChartTitleText(): string {
  return txt(one('.highcharts-title', chartSvg('app-widget-pie') as unknown as ParentNode));
}

function pieChartSliceCount(): number {
  const svg = chartSvg('app-widget-pie');
  if (!svg) return -1;
  return count('.highcharts-pie-series .highcharts-point', svg as unknown as ParentNode);
}

function pieChartSelectedSliceCount(): number {
  const svg = chartSvg('app-widget-pie');
  if (!svg) return -1;
  return count('.highcharts-pie-series .highcharts-point-select', svg as unknown as ParentNode);
}

function pieChartCreditsCount(): number {
  const svg = chartSvg('app-widget-pie');
  if (!svg) return -1;
  return count('.highcharts-credits', svg as unknown as ParentNode);
}

function pieChartExportButtonCount(): number {
  const svg = chartSvg('app-widget-pie');
  if (!svg) return -1;
  return count('.highcharts-contextbutton', svg as unknown as ParentNode);
}

function pieChartLegendCount(): number {
  const svg = chartSvg('app-widget-pie');
  if (!svg) return -1;
  return count('.highcharts-legend-item', svg as unknown as ParentNode);
}

function pieDataLabelText(prefix: string): string {
  return dataLabelTextStarting(chartSvg('app-widget-pie'), prefix);
}

function chartHostCount(): number {
  return count('highcharts-chart');
}

function chartContainerCount(): number {
  return count('.highcharts-container');
}

/* ------------------------------------------------------------------ *
 * drivers - ONLY writes a user could perform, each reporting what it did
 * ------------------------------------------------------------------ */

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => { setTimeout(resolve, ms); });
}

function clickEl(el: AnyEl | null): string {
  if (!el) return 'not-found';
  try {
    (el as HTMLElement).click();
    return 'clicked';
  } catch (e) {
    return 'click-threw';
  }
}

function clickHeaderMenuButton(): string {
  return clickEl(headerButtonByIcon('menu'));
}

function clickPersonButton(): string {
  return clickEl(headerButtonByIcon('person_outline'));
}

function clickSidebarLink(label: string): string {
  const links = sidebarLinks();
  for (const a of links) {
    const t = labelWithoutIcons(a);
    if (t === label) return label + ':' + clickEl(a);
  }
  return label + ':not-found';
}

function menuPanelCount(): number {
  return count('.mat-menu-panel');
}

function menuPanelText(): string {
  return txt(one('.mat-menu-panel'));
}

function menuPanelHasSignOut(): string {
  const t = menuPanelText();
  return yesno(t !== NA && t.indexOf('Sign out') >= 0);
}

function overlayContainerPresent(): string {
  return yesno(!!one('.cdk-overlay-container'));
}

/**
 * The drawer-toggle channel, measured direction-agnostically: read the opened class,
 * click the toolbar menu button exactly as a user would, settle, read it again and report
 * whether the state FLIPPED. A checkpoint asserts 'flipped', never 'open', so the reading
 * stays valid whichever side of the two-state toggle the face starts on.
 */
async function drawerToggleReport(): Promise<string> {
  try {
    const before = drawerOpened();
    const act = clickHeaderMenuButton();
    await sleep(600);
    const after = drawerOpened();
    return (before !== after ? 'flipped' : 'unchanged') + ':' + before + '>' + after + ':' + act;
  } catch (e) {
    return 'driver-threw';
  }
}

/**
 * Opens the paginator page-size select and picks one of its options, as a user would.
 * Material 8 puts `(click)="toggle()"` on the INNER `.mat-select-trigger` div, not on the
 * `mat-select` host, and a click dispatched on a host does not reach a child listener - so the
 * trigger div is the element that has to be clicked (host kept only as a fallback).
 */
async function pickPageSize(want: string): Promise<string> {
  try {
    const trigger = one('app-dashboard .mat-paginator .mat-select-trigger') || one('app-dashboard .mat-paginator .mat-select');
    if (!trigger) return 'trigger-not-found';
    (trigger as HTMLElement).click();
    await sleep(700);
    const opts = q('.cdk-overlay-container .mat-option');
    let seen: string[] = [];
    for (const o of opts) {
      const t = norm(o.textContent);
      seen.push(t);
      if (t === want) {
        (o as HTMLElement).click();
        await sleep(900);
        return 'picked:' + want + ':options=' + seen.join(',');
      }
    }
    return 'option-not-found:' + want + ':options=' + seen.join(',');
  } catch (e) {
    return 'driver-threw';
  }
}

/** route + mounted component after an in-app navigation, as one combined scalar. */
function routeLocationAfterPosts(): string {
  try {
    return location.pathname + location.hash;
  } catch (e) {
    return NA;
  }
}

/* ------------------------------------------------------------------ *
 * publication
 * ------------------------------------------------------------------ */

const api = {
  version: (): string => AMD_VERSION,
  probePresent: (): string => 'yes',
  documentTitle: (): string => { try { return document.title === '' ? NA : document.title; } catch (e) { return NA; } },
  appRootChildCount: (): number => count('app-root > *'),
  toolbarSpanText,
  toolbarIconLigatures,
  headerMenuButtonPresent: (): string => yesno(!!headerButtonByIcon('menu')),
  personButtonPresent: (): string => yesno(!!headerButtonByIcon('person_outline')),
  headerIconButtonCount: (): number => count('mat-toolbar button[mat-icon-button]'),
  drawerExists: (): string => yesno(!!drawerEl()),
  drawerModeClass,
  drawerOpened,
  contentMarginEqualsDrawerWidth,
  drawerContentPresent: (): string => yesno(!!one('mat-drawer-content')),
  sidebarLinkCount: (): number => sidebarLinks().length,
  sidebarLinkLabelsNoIcons,
  sidebarLinkRoutes,
  sidebarSubheaders,
  sidebarProfileTexts,
  sidebarAvatarSrc,
  sidebarAvatarAlt,
  sidebarAvatarIsRemote,
  footerText,
  dividerTagCount,
  routedComponentTag,
  dashboardPresent,
  postsText,
  externalRefTagCount,
  externalRefDetail,
  foreignResourceCount,
  resourceEntryCount,
  hasGtag,
  hasDataLayer,
  localStorageCount,
  sessionStorageCount,
  locationPathname,
  locationSearch,
  locationHash,
  probeGlobals,
  pageErrorCount,
  pageErrorSample,
  rejectionCount,
  consoleErrorCount,
  tablePresent: (): string => yesno(!!tableEl()),
  tableHeaderTexts,
  tableHeaderCellCount,
  tableRowCount,
  tableRowCellTexts,
  tableCellText,
  paginatorPresent,
  paginatorPageSizeLabel,
  paginatorPageSizeValue,
  paginatorOptionCount,
  paginatorRangeDigits,
  paginatorNextDisabled,
  cardLabels,
  cardTotals,
  cardPercentages,
  cardTargetSuffixes,
  cardIconLigatures,
  cardIconPaletteClass,
  cardIconNoColorClass,
  cardChartCount,
  cardSparklineContainerCount,
  cardSparklineHostHeight,
  cardExportButtonCount,
  cardCreditsCount,
  chartHostCount,
  chartContainerCount,
  bigChartPresent,
  bigChartLegendTexts,
  bigChartLegendCount,
  bigChartSeriesTypeSignature,
  bigChartAreaFillCount,
  bigChartAreaFillPresent,
  bigChartSeriesGroupCount,
  bigChartTitleText,
  bigChartSubtitleText,
  bigChartCreditsCount,
  bigChartExportButtonCount,
  bigChartHostHeight,
  pieChartPresent,
  pieChartTitleText,
  pieChartSliceCount,
  pieChartSelectedSliceCount,
  pieChartCreditsCount,
  pieChartExportButtonCount,
  pieChartLegendCount,
  pieDataLabelText,
  clickHeaderMenuButton,
  clickPersonButton,
  clickSidebarLink,
  pickPageSize,
  drawerToggleReport,
  menuPanelCount,
  menuPanelText,
  menuPanelHasSignOut,
  overlayContainerPresent,
  routeLocationAfterPosts,
};

try {
  (window as any).__AMD__ = api;
} catch (e) { /* publication must never break bootstrap */ }
