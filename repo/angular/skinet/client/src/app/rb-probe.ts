/* tslint:disable */
/**
 * RepairBench read-only observation bridge for repair-angular__skinet-01
 * (seed skinet: ElahehFarokhi/skinet@master, Angular 18.2.11 standalone + signals ecommerce SPA,
 *  application root client/, build outdir API/wwwroot at the TREE ROOT).
 *
  *
 *  - It reads ONLY what the seed already renders: element censuses, attributes, class lists,
 *    text content, computed styles, the document location, storage key counts, resource timing
 *    and a passive console / page-error latch. It reads NO Angular component field, NO service
 *    signal, NO injector and NO network payload.
 *  - Its drivers perform ONLY writes a user could perform: element.click() on an anchor, a button
 *    or a component host the seed itself binds a handler to, and window.history.back(), which is
 *    the browser Back button. Every driver returns a string receipt so a checkpoint can prove the
 *    interaction happened instead of trusting a sleep.
 *  - Every getter is wrapped: an unavailable reading degrades to the sentinel '-' (or -1 for a
 *    count / a non-pixel length) instead of throwing, so a checkpoint can only ever fail on a
 *    measured value and never on a bridge crash. The bridge object is published BEFORE
 *    bootstrapApplication runs, so even a face that fails to bootstrap yields sentinels (all red)
 *    rather than a runner error.
 *  - It adds NO markup hook and NO data-testid, edits NO template, moves NO element and creates NO
 *    route. client/src/main.ts gains exactly one line, `import './app/rb-probe';`.
 *  - Numeric style readings are rounded to 2 decimals INSIDE the bridge and returned as numbers,
 *    so no checkpoint depends on a browser's length serialisation.
 */

const W = window as any;
const SENT = '-';
const SENTN = -1;

function q(sel: string): Element | null {
  try { return document.querySelector(sel); } catch (e) { return null; }
}
function qa(sel: string): Element[] {
  try { return Array.prototype.slice.call(document.querySelectorAll(sel)) as Element[]; } catch (e) { return []; }
}
function kids(sel: string): Element[] {
  const host = q(sel);
  if (!host) { return []; }
  return Array.prototype.slice.call(host.children) as Element[];
}
function txt(el: Element | null): string {
  if (!el) { return SENT; }
  const t = String(el.textContent || '').replace(/\s+/g, ' ').trim();
  return t === '' ? SENT : t;
}
function joined(sel: string): string {
  const list = qa(sel).map((el) => txt(el));
  if (!list.length) { return SENT; }
  return list.some((s) => s === SENT) && list.every((s) => s === SENT) ? SENT : list.join('|');
}
function sortedJoined(sel: string): string {
  const list = qa(sel).map((el) => txt(el)).filter((s) => s !== SENT).sort();
  return list.length ? list.join('|') : SENT;
}
function attr(el: Element | null, name: string): string {
  if (!el) { return SENT; }
  const v = el.getAttribute(name);
  return v === null ? SENT : v;
}
function cs(el: Element | null, prop: string): string {
  if (!el) { return SENT; }
  try {
    const v = window.getComputedStyle(el as HTMLElement).getPropertyValue(prop);
    return v === '' || v === null ? SENT : String(v).trim();
  } catch (e) { return SENT; }
}
function px(el: Element | null, prop: string): number {
  const v = cs(el, prop);
  if (v === SENT) { return SENTN; }
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : SENTN;
}
function has(el: Element | null, cls: string): number {
  if (!el) { return SENTN; }
  try { return el.classList.contains(cls) ? 1 : 0; } catch (e) { return SENTN; }
}
function outletHost(): Element | null {
  const list = qa('app-root > div > *');
  for (const el of list) { if (el.tagName.toLowerCase() !== 'router-outlet') { return el; } }
  return null;
}
function clickFirst(sel: string): string {
  const el = q(sel);
  if (!el) { return 'missed:' + sel; }
  try { (el as HTMLElement).click(); return 'clicked:' + sel; } catch (e) { return 'threw:' + sel; }
}
function clickByText(sel: string, label: string): string {
  const list = qa(sel);
  for (const el of list) {
    if (txt(el) === label) {
      try { (el as HTMLElement).click(); return 'clicked:' + sel + ':' + label; } catch (e) { return 'threw:' + label; }
    }
  }
  return 'missed:' + sel + ':' + label;
}

let consoleErrorCount = 0;
let consoleWarnCount = 0;
let pageErrorCount = 0;
const consoleErrorTexts: string[] = [];
try {
  const origError = console.error.bind(console);
  console.error = function (...args: any[]) {
    consoleErrorCount++;
    if (consoleErrorTexts.length < 12) { consoleErrorTexts.push(String(args[0]).slice(0, 160)); }
    return origError(...args);
  };
  const origWarn = console.warn.bind(console);
  console.warn = function (...args: any[]) { consoleWarnCount++; return origWarn(...args); };
  window.addEventListener('error', () => { pageErrorCount++; });
  window.addEventListener('unhandledrejection', () => { pageErrorCount++; });
} catch (e) { /* passive latch is best-effort by design */ }

// ---- passive two-phase sampler (§1.8.6) ----
// Records whether two carriers were EVER present during this page's life, not only whether they are
// present when an assert happens to read them. It is scheduled inside Zone.root when zone.js is loaded
// so its ticks neither trigger Angular change detection nor perturb the application's own scheduling;
// it only reads the DOM, it writes nothing, and it stops itself after ~48 s.
let sampleCount = 0;
let progressBarEverSeen = 0;
let emptyStateEverSeen = 0;
let emptyStateFirstIcon = SENT;
let samplerStopped = 0;
function sampleOnce(): void {
  sampleCount++;
  try {
    if (progressBarEverSeen === 0 && qa('app-header mat-progress-bar').length > 0) { progressBarEverSeen = 1; }
    const es = q('app-empty-state');
    if (es) {
      emptyStateEverSeen = 1;
      if (emptyStateFirstIcon === SENT) {
        const t = txt(es.querySelector('mat-icon'));
        if (t !== SENT) { emptyStateFirstIcon = t; }
      }
    }
  } catch (e) { sampleCount = sampleCount; }
}
function startSampler(): void {
  try {
    const timer = window.setInterval(() => {
      sampleOnce();
      if (sampleCount >= 400) { samplerStopped = 1; window.clearInterval(timer); }
    }, 120);
  } catch (e) { samplerStopped = -1; }
}
try {
  const Z = (window as any).Zone;
  if (Z && Z.root && typeof Z.root.run === 'function') { Z.root.run(startSampler); } else { startSampler(); }
} catch (e) { startSampler(); }

// ---- external-surface census: ONE predicate, TWO faces (O1 origin-resolving + O6 attribution
// companion + non-zero denominator). House form: blockhead instrumentation.patch:166-230 and its
// export comment "zero-network census, origin-blind variants kept on the record" (blockhead:647);
// narrow ref-tag selector per graphml-viewer instrumentation.patch:1510; nine-pair resource
// selector per angular-material-dashboard instrumentation.patch:481.
// 🔴 "External" here means OFF-MACHINE, not merely cross-origin. The graded contract of this
// package is "0 off-machine requests", and the seed legitimately calls a SAME-MACHINE .NET API at
// https://localhost:5001 which this harness never runs and which environment/adaptation.patch
// deliberately does not remove. Measured on the pre-fix clean face
//
// sha256-16 d6af3f05b404a9a7): resourceEntryCount()=21, of which exactly 2 were off-machine
// (https://js.stripe.com/v3 and its https://js.stripe.com/v3/m-outer-*.html iframe document) and
// 1 was same-machine-but-cross-origin (https://localhost:5001/api/account/user-info). A pure
// origin test would read 3 there and would be red on EVERY face including the oracle, so expected 0
// would only have been reachable by bending the expectation to the measurement (0 house precedents
// for that; blockhead is the counter-example - it published 25/26/26 as unasserted readers and
// still asserted 0). The loopback exemption is what makes expected 0 a real, falsifiable claim.
const RB_REF_SEL = 'link[href^="http"], script[src^="http"], link[href^="//"], script[src^="//"]';
const RB_RES_SEL = 'link[href], script[src], img[src], iframe[src], source[src], video[src], audio[src], embed[src], object[data]';
function rbIsLoopbackHost(h: string): boolean {
  const s = String(h || '').toLowerCase().replace(/^\[|\]$/g, '');
  return s === 'localhost' || s === '127.0.0.1' || s === '::1' || s === '0.0.0.0';
}
function rbOffMachine(raw: string): boolean {
  const u = String(raw === SENT ? '' : (raw || ''));
  // relative, #anchor, data: and blob: are inline payloads, not requests that leave the machine;
  // they are excluded BY CONSTRUCTION here rather than by an extra branch.
  if (!/^(https?:)?\/\//i.test(u)) { return false; }
  try {
    const p = new URL(u, window.location.href);
    if (rbIsLoopbackHost(p.hostname)) { return false; }
    return p.origin !== window.location.origin;
  } catch (e) { return true; }   // absolute-looking but unparseable => fail CLOSED
}
function rbUrlOf(el: Element | null): string {
  // 🔴 deliberately does NOT use this probe's attr(): attr() returns the SENT sentinel '-' for a
  // missing attribute, and '-' is truthy, so `attr(el,'href') || attr(el,'src')` short-circuits on
  // '-' and never reads src - every <script src="https://..."> would then be invisible. Read the
  // raw attributes instead; '' means absent.
  if (!el) { return ''; }
  const names = ['href', 'src', 'data'];
  for (let i = 0; i < names.length; i++) {
    let v: string | null = null;
    try { v = el.getAttribute(names[i]); } catch (e) { v = null; }
    if (v !== null && v !== '') { return v; }
  }
  return '';
}
function rbExternalRefTagCount(): number {
  return qa(RB_REF_SEL).filter((el) => rbOffMachine(rbUrlOf(el))).length;
}
function rbExternalResourceTagCount(): number {
  return qa(RB_RES_SEL).filter((el) => rbOffMachine(rbUrlOf(el))).length;
}
function rbExternalRefTags(): string {
  // O6 attribution companion: '' when there is nothing to name (blockhead externalRefTags and
  // hlviewer foreignResourceEntryNames convention), so a red is self-explaining instead of
  // "expected 0, actual 2".
  const hits: string[] = [];
  const seen: Element[] = [];
  const all = qa(RB_REF_SEL).concat(qa(RB_RES_SEL));
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (seen.indexOf(el) !== -1) { continue; }   // one element can match both selectors; name it once
    seen.push(el);
    const u = rbUrlOf(el);
    if (rbOffMachine(u)) { hits.push(el.tagName.toLowerCase() + ':' + u.slice(0, 120)); }
  }
  return hits.sort().join('|');
}
function rbOffMachineEntries(): PerformanceResourceTiming[] {
  try {
    const es = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return es.filter((e) => rbOffMachine(String(e.name)));
  } catch (e) { return []; }
}
function rbOffMachineResourceEntryCount(): number {
  try {
    return performance.getEntriesByType('resource').filter((e) => rbOffMachine(String(e.name))).length;
  } catch (e) { return SENTN; }
}
function rbOffMachineResourceEntryNames(): string {
  const n = rbOffMachineEntries().map((e) => String(e.name).slice(0, 140));
  const uniq: string[] = [];
  for (let i = 0; i < n.length; i++) { if (uniq.indexOf(n[i]) === -1) { uniq.push(n[i]); } }
  return uniq.length ? uniq.sort().join('|') : '';
}
function rbCrossOriginResourceEntryCount(): number {
  // PUBLISHED, NOT ASSERTED - the pure-origin reading kept on the record so the loopback exemption
  // above stays auditable. Derived from the same measured timeline: it reads 3 on the pre-fix clean
  // face (2 x js.stripe.com + 1 x localhost:5001) where rbOffMachineResourceEntryCount() reads 2.
  try {
    return performance.getEntriesByType('resource').filter((e) => {
      try { return new URL(String(e.name), window.location.href).origin !== window.location.origin; }
      catch (err) { return false; }
    }).length;
  } catch (e) { return SENTN; }
}
function rbRemoteStyleSheetCount(): number {
  let n = 0;
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const h = (document.styleSheets[i] as any).href;
      if (h && rbOffMachine(String(h))) { n++; }
    }
  } catch (e) { return SENTN; }
  return n;
}
function rbHttpPrefixedAttrCount(): number {
  // PUBLISHED, NOT ASSERTED. This reader was previously published as externalOriginCount() and was
  // asserted 0 in P02 - a name that claimed an origin test the reader never performed. It is an
  // ORIGIN-BLIND text census of [href^="http"] + [src^="http"], so it also counted the two
  // js.stripe.com elements the runtime created and read 2 on the clean AND the oracle face
  // (identical => face-insensitive => design defect). Renamed to say what it measures, and kept on
  // the record unasserted per the house rule.
  return qa('[href^="http"]').length + qa('[src^="http"]').length;
}
function rbAbsoluteUrlRefTagCount(): number { return qa(RB_REF_SEL).length; }
const api = {
  probeBridgePresent: (): number => 1,
  samplerSampleCount: (): number => sampleCount,
  samplerRanAtLeast20: (): number => (sampleCount >= 20 ? 1 : 0),
  samplerStopped: (): number => samplerStopped,
  progressBarEverSeen: (): number => progressBarEverSeen,
  emptyStateEverSeen: (): number => emptyStateEverSeen,
  emptyStateFirstIconText: (): string => emptyStateFirstIcon,
  sampleNow: (): string => { sampleOnce(); return 'sampled:' + sampleCount + ':pb' + progressBarEverSeen + ':es' + emptyStateEverSeen; },
  bridgeName: (): string => 'skinet-read-only-observation-bridge',

  // ---- document / boot shell ----
  documentTitle: (): string => { try { return document.title || SENT; } catch (e) { return SENT; } },
  htmlHasCustomTheme: (): number => has(document.documentElement, 'custom-theme'),
  splashCount: (): number => qa('#initial-splash').length,
  headerCount: (): number => qa('app-header > header').length,
  routerOutletCount: (): number => qa('app-root router-outlet').length,
  locationPath: (): string => { try { return window.location.pathname || SENT; } catch (e) { return SENT; } },
  locationSearch: (): string => { try { return window.location.search === '' ? SENT : window.location.search; } catch (e) { return SENT; } },

  // ---- offline / adaptation census ----
  externalRefTagCount: (): number => rbExternalRefTagCount(),
  externalResourceTagCount: (): number => rbExternalResourceTagCount(),
  externalRefTags: (): string => rbExternalRefTags(),
  offMachineResourceEntryCount: (): number => rbOffMachineResourceEntryCount(),
  offMachineResourceEntryNames: (): string => rbOffMachineResourceEntryNames(),
  remoteStyleSheetCount: (): number => rbRemoteStyleSheetCount(),
  httpPrefixedAttrCount: (): number => rbHttpPrefixedAttrCount(),
  absoluteUrlRefTagCount: (): number => rbAbsoluteUrlRefTagCount(),
  crossOriginResourceEntryCount: (): number => rbCrossOriginResourceEntryCount(),
  stylesheetLinkCount: (): number => qa('link[rel="stylesheet"]').length,
  faviconLinkHref: (): string => attr(q('link[rel="icon"]'), 'href'),
  dataTestIdCount: (): number => qa('[data-testid]').length,
  resourceEntryCount: (): number => { try { return performance.getEntriesByType('resource').length; } catch (e) { return SENTN; } },
  consoleErrorCount: (): number => consoleErrorCount,
  consoleWarnCount: (): number => consoleWarnCount,
  pageErrorCount: (): number => pageErrorCount,
  consoleErrorFirst: (): string => (consoleErrorTexts.length ? consoleErrorTexts[0] : SENT),

  // ---- state isolation (§1.8.7) ----
  localStorageCount: (): number => { try { return window.localStorage.length; } catch (e) { return SENTN; } },
  sessionStorageCount: (): number => { try { return window.sessionStorage.length; } catch (e) { return SENTN; } },
  strayGlobalCount: (): number => {
    const names = ['__RB__', '__RB_PROBE__', '__RB_HINT__', '__RB_RESIDUE__', '__FIX__', '__REPAIR__', '__SK_HINT__'];
    let n = 0;
    for (const k of names) { try { if (Object.prototype.hasOwnProperty.call(window, k)) { n++; } } catch (e) { n = n; } }
    return n;
  },

  // ---- header ----
  navAnchorCount: (): number => qa('app-header nav a').length,
  navAnchorTexts: (): string => joined('app-header nav a'),
  navAnchorHrefs: (): string => {
    const list = qa('app-header nav a').map((el) => attr(el, 'href'));
    return list.length ? list.join('|') : SENT;
  },
  navHrefSpine: (): string => {
    const list = qa('app-header nav a').map((el) => attr(el, 'href')).slice(0, 3);
    return list.length === 3 ? list.join('|') : SENT;
  },
  activeNavCount: (): number => qa('app-header nav a.active').length,
  activeNavTexts: (): string => joined('app-header nav a.active'),
  headerLogoSrc: (): string => attr(q('app-header header img'), 'src'),
  headerLogoLoaded: (): number => {
    const el = q('app-header header img') as HTMLImageElement | null;
    if (!el) { return SENTN; }
    try { return el.naturalWidth > 0 ? 1 : 0; } catch (e) { return SENTN; }
  },
  headerPosition: (): string => cs(q('app-header > header'), 'position'),
  headerZIndex: (): number => px(q('app-header > header'), 'z-index'),
  cartAnchorHref: (): string => attr(q('app-header a.custom-badge'), 'href'),
  cartIconText: (): string => txt(q('app-header a.custom-badge mat-icon')),
  cartIconFontSizePx: (): number => px(q('app-header a.custom-badge mat-icon'), 'font-size'),
  cartIconWidthPx: (): number => px(q('app-header a.custom-badge mat-icon'), 'width'),
  authButtonTexts: (): string => joined('app-header header button[mat-stroked-button]'),
  authButtonCount: (): number => qa('app-header header button[mat-stroked-button]').length,
  progressBarCount: (): number => qa('app-header mat-progress-bar').length,
  progressBarMode: (): string => attr(q('app-header mat-progress-bar'), 'mode'),

  // ---- routed outlet wrapper (app.component.html) ----
  outletWrapperClassList: (): string => {
    const el = q('app-root > div');
    return el ? String(el.className).replace(/\s+/g, ' ').trim() : SENT;
  },
  outletWrapperClassTokenCount: (): number => {
    const el = q('app-root > div');
    return el ? el.classList.length : SENTN;
  },
  outletWrapperHasContainerClass: (): number => has(q('app-root > div'), 'container'),
  outletWrapperHasClearance: (): number => {
    const v = cs(q('app-root > div'), 'margin-top');
    if (v === SENT) { return SENTN; }
    const n = parseFloat(v);
    return Number.isFinite(n) && n > 0 ? 1 : 0;
  },
  outletHostTagName: (): string => {
    const el = outletHost();
    return el ? el.tagName.toLowerCase() : SENT;
  },
  outletH1Text: (): string => {
    const host = outletHost();
    if (!host) { return SENT; }
    return txt(host.querySelector('h1'));
  },
  outletH1Count: (): number => {
    const host = outletHost();
    return host ? host.querySelectorAll('h1').length : SENTN;
  },

  // ---- home ----
  homeH1Text: (): string => txt(q('app-home h1')),
  homeH1FontWeight: (): number => px(q('app-home h1'), 'font-weight'),
  homeHeroImgSrc: (): string => attr(q('app-home img'), 'src'),
  homeHeroImgLoaded: (): number => {
    const el = q('app-home img') as HTMLImageElement | null;
    if (!el) { return SENTN; }
    try { return el.naturalWidth > 0 ? 1 : 0; } catch (e) { return SENTN; }
  },
  homeHeroObjectFit: (): string => cs(q('app-home img'), 'object-fit'),
  homeCtaText: (): string => txt(q('app-home button')),
  homeButtonCount: (): number => qa('app-home button').length,

  // ---- shared empty state (shop / cart carriers) ----
  emptyStateHostCount: (): number => qa('app-empty-state').length,
  emptyStateMessage: (): string => txt(q('app-empty-state p')),
  emptyStateIconText: (): string => txt(q('app-empty-state mat-icon')),
  emptyStateActionText: (): string => txt(q('app-empty-state button')),

  // ---- not found ----
  notFoundH1Text: (): string => txt(q('app-not-found h1')),
  notFoundParagraphText: (): string => txt(q('app-not-found p')),
  notFoundButtonText: (): string => txt(q('app-not-found button')),
  notFoundIconText: (): string => txt(q('app-not-found mat-icon')),
  notFoundButtonHref: (): string => attr(q('app-not-found button'), 'href'),

  // ---- server error ----
  serverErrorH1Text: (): string => txt(q('app-server-error h1')),
  serverErrorRootClassList: (): string => {
    const el = q('app-server-error > div');
    return el ? String(el.className).replace(/\s+/g, ' ').trim() : SENT;
  },
  serverErrorRootHasContainerClass: (): number => has(q('app-server-error > div'), 'container'),
  serverErrorRootHasMt5Class: (): number => has(q('app-server-error > div'), 'mt-5'),
  serverErrorRootMaxWidthPx: (): number => px(q('app-server-error > div'), 'max-width'),
  matCardCount: (): number => qa('app-server-error mat-card').length,
  olItemCount: (): number => qa('app-server-error ol li').length,
  serverErrorDetailCount: (): number => qa('app-server-error h5').length,

  // ---- test error ----
  testErrorButtonCount: (): number => qa('app-test-error button').length,
  testErrorButtonLabels: (): string => joined('app-test-error button'),
  testErrorButtonLabelSetSorted: (): string => sortedJoined('app-test-error button'),
  validationErrorItemCount: (): number => qa('app-test-error ul li').length,
  snackbarCount: (): number => qa('mat-snack-bar-container, .mat-mdc-snack-bar-container').length,

  // ---- account (lazy feature, reachable with no backend) ----
  loginH1Text: (): string => txt(q('app-login h1')),
  loginH1HasTextPrimaryClass: (): number => has(q('app-login h1'), 'text-primary'),
  loginHeadingColorRgb: (): string => cs(q('app-login h1.text-primary'), 'color'),
  registerH1Text: (): string => txt(q('app-register h1')),
  registerH1HasTextPrimaryClass: (): number => has(q('app-register h1'), 'text-primary'),
  registerHeadingColorRgb: (): string => cs(q('app-register h1.text-primary'), 'color'),

  // ---- user-level drivers (click / back only, each returns a receipt) ----
  clickNavByText: (label: string): string => clickByText('app-header nav a', String(label)),
  clickHeaderLogo: (): string => clickFirst('app-header header img'),
  clickCartAnchor: (): string => clickFirst('app-header a.custom-badge'),
  clickHomeCta: (): string => clickFirst('app-home button'),
  clickNotFoundButton: (): string => clickFirst('app-not-found button'),
  clickEmptyStateAction: (): string => clickFirst('app-empty-state button'),
  clickTestErrorButtonByLabel: (label: string): string => clickByText('app-test-error button', String(label)),
  clickLoginButton: (): string => clickFirst('app-header header button[mat-stroked-button]'),
  historyBack: (): string => { try { window.history.back(); return 'clicked:history-back'; } catch (e) { return 'threw:history-back'; } }
};

W.__SK__ = api;
