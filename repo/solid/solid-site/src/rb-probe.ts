// rb-probe.ts - observation bridge for the repair-bench verifier (INSTRUMENTATION ONLY).
//
// Neutrality contract: this file only READS the app. It never writes a signal, never changes a
// render branch, never mutates a store, and it is imported for its side effect (installing
// window.__SS__) before the app renders. Every gesture helper reproduces exactly one real user
// gesture - element.click() on a type-filter button / theme button / language option, a native
// "input" event on the search field for typing, and mouseenter/mouseleave on a nav item for the
// hover menu - so a checkpoint drives the same code path a user drives.
//
// Why a bridge instead of raw locators: the resource list is 245 sibling <li> elements with no
// ids, the type-filter control is rendered TWICE (a desktop panel and a dismissible sheet that
// share one handler), and the language picker is rendered twice for the same reason. The bridge
// therefore selects on structure this same instrumentation patch adds (data-rb-list /
// data-rb-item / data-rb-type / data-rb-panel / data-rb-search / data-rb-theme / data-rb-lang /
// data-rb-langopt / data-rb-navlink / data-rb-subnav / data-rb-empty / data-rb-timeago /
// data-rb-official / data-rb-published), and it reads the list's truth from the app's OWN store
// and signals (bound by bindResources / bindNav / bindApp below) rather than from repainted
// markup, so a checkpoint that asks "what is the first entry" cannot be answered by a defect
// that only relabels it.
//
// Reference computations living here, and why each is only partial:
//   1. monotonicity of the rendered order. The bridge reports whether the app's own list is
//      non-increasing (or non-decreasing) in the publication stamp the app itself carries. It
//      never decides which order is correct and never recomputes a ranking: the expected
//      direction and every expected value live in tests/dsl.json, which is not part of the
//      answering environment.
//   2. nothing else. In particular the bridge never reimplements a search: it never scores a
//      keyword, never fuzzy-matches, never filters by type. It reads the memo and the store the
//      page already maintains.
//
// Latch protocol (R22-2): a checkpoint that has to observe "a value had NOT moved yet at time T"
// cannot be a single read, because the runner polls a failing assert until its budget expires and
// would therefore accept the first converged sample. Such a checkpoint arms a DEFERRED one-shot
// evaluation in setup (window.__SS_L[K] = {done:false,...} -> setTimeout -> {done:true, value}),
// asserts done === true first, and only then reads the frozen scalar. Every other reader below is
// a pure, repeatable read with no side effect, so polling is safe.

const errors: any[] = [];
let res: any = null;
let nav: any = null;
let app: any = null;

const installErrorTrap = () => {
  window.addEventListener("error", (event: any) => {
    errors.push({ kind: "error", message: String((event && event.message) || "unknown"), stack: String((event && event.error && event.error.stack) || "").split("\n").slice(0, 4).join(" @ ") });
  });
  window.addEventListener("unhandledrejection", (event: any) => {
    errors.push({ kind: "unhandledrejection", message: String((event && event.reason) || "unknown") });
  });
  return true;
};
installErrorTrap();

/** Called once from the ecosystem page by the instrumentation patch. Stores live accessors only. */
export const bindResources = (handle: any) => { res = handle; return true; };
/** Called once from the site navigation by the instrumentation patch. Stores live accessors only. */
export const bindNav = (handle: any) => { nav = handle; return true; };
/** Called once from the application context provider by the instrumentation patch. */
export const bindApp = (handle: any) => { app = handle; return true; };

const q = (sel: any, root?: any) => (root || document).querySelector(sel);
const qa = (sel: any, root?: any) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
const txt = (el: any) => (el ? String(el.textContent || "").replace(/\s+/g, " ").trim() : null);
const join = (xs: any[]) => xs.join("|");
const sorted = (xs: any[]) => xs.slice().sort();

/** the app's own final list (store getter), never the repainted markup */
const list = (): any[] => {
  try { const l = res && res.filtered ? res.filtered.list : null; return Array.isArray(l) ? l : []; } catch (e) { return []; }
};
const items = (): any[] => qa("[data-rb-item]", q("[data-rb-list]") ? q("[data-rb-list]").parentElement : null);
const domItems = (): any[] => {
  const ul = q("[data-rb-list]");
  return ul ? qa(":scope > li[data-rb-item]", ul) : [];
};
const panel = (which: string) => q(`[data-rb-panel="${which}"]`);
const typeButtons = (which: string) => qa(`[data-rb-type]`, panel(which) || null);
const typeButton = (which: string, type: string) =>
  typeButtons(which).filter((b: any) => b.getAttribute("data-rb-type") === type)[0] || null;

// ---------------------------------------------------------------- errors
const errorCount = () => errors.length;
const errorFirst = () => (errors.length ? errors[0].kind + ": " + errors[0].message : null);

// ---------------------------------------------------------------- list truth (store-driven)
const listLen = () => list().length;
const domListLen = () => domItems().length;
const titleAt = (i: number) => { const x = list()[i]; return x ? String(x.title || "") : null; };
const typeAt = (i: number) => { const x = list()[i]; return x ? String(x.type || "") : null; };
const pubAt = (i: number) => { const x = list()[i]; return x && typeof x.published_at === "number" ? x.published_at : null; };
const firstTitle = () => titleAt(0);
const lastTitle = () => { const l = list(); return l.length ? String(l[l.length - 1].title || "") : null; };
const firstThreeTitles = () => join(list().slice(0, 3).map((x) => String(x.title || "")));
const stamps = () => list().map((x) => (typeof x.published_at === "number" ? x.published_at : 0));
/** does the app's own list run non-increasing in its own publication stamps? */
const orderDescending = () => { const s = stamps(); for (let i = 1; i < s.length; i++) if (s[i] > s[i - 1]) return false; return s.length > 1; };
/** does it run non-decreasing? (the mirror reading, kept so a checkpoint can name the direction) */
const orderAscending = () => { const s = stamps(); for (let i = 1; i < s.length; i++) if (s[i] < s[i - 1]) return false; return s.length > 1; };
const allType = (t: string) => { const l = list(); return l.length > 0 && l.every((x) => String(x.type || "") === t); };
const distinctTypes = () => join(sorted(Array.from(new Set(list().map((x) => String(x.type || ""))))));
const officialCount = () => qa("[data-rb-official]").length;
const timeAgoCount = () => qa("[data-rb-timeago]").length;
const timeAgoOnFirst = () => { const it = domItems()[0]; return it ? !!q("[data-rb-timeago]", it) : false; };
const publishedOnFirst = () => { const it = domItems()[0]; return it ? txt(q("[data-rb-published]", it)) : null; };
const firstItemLinkAttrs = () => {
  const it = domItems()[0]; const a = it ? q("a[data-rb-itemlink]", it) : null;
  return a ? join([a.getAttribute("target"), a.getAttribute("rel")]) : null;
};
const emptyNotice = () => { const e = q("[data-rb-empty]"); return e ? txt(e) : null; };
const listRendered = () => !!q("[data-rb-list]");

// ---------------------------------------------------------------- filters / counts (store-driven)
const countsJson = () => {
  try {
    const c = (res && res.filtered ? res.filtered.counts : null) || {};
    return JSON.stringify(Object.keys(c).sort().reduce((m: any, k: string) => ((m[k] = c[k]), m), {}));
  } catch (e) { return "ERR"; }
};
const countFor = (t: string) => { try { const c = res.filtered.counts; return c && c[t] ? c[t] : 0; } catch (e) { return -1; } };
const enabledTypes = () => { try { return join(sorted((res.filtered.enabledTypes || []).map((x: any) => String(x)))); } catch (e) { return "ERR"; } };
const enabledCount = () => { try { return (res.filtered.enabledTypes || []).length; } catch (e) { return -1; } };
const typeSelected = (t: string) => { try { return (res.filtered.enabledTypes || []).indexOf(t as any) !== -1; } catch (e) { return false; } };
const typeButtonDisabled = (t: string) => { const b = typeButton("desktop", t); return b ? b.disabled === true : null; };
const typeButtonMarked = (t: string) => { const b = typeButton("desktop", t); return b ? /bg-gray-100/.test(b.className) : null; };
const typeLabels = () => join(typeButtons("desktop").map((b: any) => txt(q("[data-rb-typelabel]", b))));
const typeButtonCount = () => typeButtons("desktop").length;

// ---------------------------------------------------------------- search field / url
const keyword = () => { try { return String(res.keyword() || ""); } catch (e) { return "ERR"; } };
const searchValue = (which: string) => { const i = q(`[data-rb-search="${which}"]`) as any; return i ? String(i.value) : null; };
const searchPlaceholder = (which: string) => { const i = q(`[data-rb-search="${which}"]`) as any; return i ? String(i.placeholder || "") : null; };
const urlPath = () => window.location.pathname;
const urlSearch = () => window.location.search;
const urlParam = (k: string) => new URLSearchParams(window.location.search).get(k);
const ctaText = () => txt(q("[data-rb-cta]"));

// ---------------------------------------------------------------- theme / locale / direction
const isDark = () => { try { return app.state.isDark === true; } catch (e) { return false; } };
const htmlDarkClass = () => document.documentElement.classList.contains("dark");
/** the theme control is rendered twice (a collapsed tablet copy and the desktop copy): pick the laid-out one */
const themeButton = () => qa("[data-rb-theme]").filter((b: any) => !!(b.offsetWidth || b.offsetHeight || b.getClientRects().length))[0] || null;
const themeTitle = () => { const b = themeButton() as any; return b ? String(b.getAttribute("title") || "") : null; };
const themePresent = () => !!themeButton();
const themeEnabled = () => { const b = themeButton() as any; return b ? b.disabled !== true : null; };
const themeSrOnly = () => { const b = themeButton(); return b ? txt(q("[data-rb-themelabel]", b)) : null; };
const locale = () => { try { return String(app.state.locale || ""); } catch (e) { return "ERR"; } };
const htmlLang = () => String(document.documentElement.lang || "");
const dir = () => { try { return String(app.state.dir || ""); } catch (e) { return "ERR"; } };
const domDir = () => { const d = q("[data-rb-appdir]"); return d ? String(d.getAttribute("dir") || "") : null; };
const docTitle = () => String(document.title || "");
const settingsCookie = () => {
  const m = document.cookie.split("; ").filter((c) => c.indexOf("storage-cl-0=") === 0);
  return m.length ? decodeURIComponent(m[0].slice("storage-cl-0=".length)) : null;
};

// ---------------------------------------------------------------- navigation
const navLabels = () => join(qa("[data-rb-navlink]").map((a: any) => txt(a)));
const navCount = () => qa("[data-rb-navlink]").length;
const langMenuOpen = () => { try { return nav.showLangs() === true; } catch (e) { return false; } };
const langOptions = () => qa('[data-rb-langopt]');
const langOptionCount = () => langOptions().length;
const langOptionLabels = () => join(langOptions().map((b: any) => txt(b)));
const langMarked = () => join(langOptions().filter((b: any) => /bg-solid-medium/.test(b.className)).map((b: any) => txt(b)));
const langMarkedCount = () => langOptions().filter((b: any) => /bg-solid-medium/.test(b.className)).length;
const langMarkedCodes = () => join(sorted(langOptions().filter((b: any) => /bg-solid-medium/.test(b.className)).map((b: any) => String(b.getAttribute("data-rb-langcode") || ""))));
const langButton = () => qa("[data-rb-lang]").filter((b: any) => !!(b.offsetWidth || b.offsetHeight || b.getClientRects().length))[0] || null;
const langButtonPresent = () => !!langButton();
const subnavOpen = () => { try { return !!nav.subnav(); } catch (e) { return false; } };
const subnavTitles = () => join(qa("[data-rb-subnavitem]").map((a: any) => txt(a)));
const scrollY = () => Math.round(window.scrollY || 0);
const footerPresent = () => !!q("[data-rb-footer]");
const newsletterPresent = () => !!q("[data-rb-newsletter]");

// ---------------------------------------------------------------- residue channels
const residueCount = () => {
  let n = 0;
  try { n += window.localStorage.length; } catch (e) {}
  try { n += window.sessionStorage.length; } catch (e) {}
  return n;
};
const residueChannels = () => {
  const c: string[] = [];
  try { if (window.localStorage.length) c.push("local"); } catch (e) {}
  try { if (window.sessionStorage.length) c.push("session"); } catch (e) {}
  return join(c);
};

// ---------------------------------------------------------------- latches (R22-2)
const L: any = ((window as any).__SS_L = (window as any).__SS_L || {});
/** arms a deferred one-shot sample of the list length / keyword / url taken `ms` from now */
const armListLatch = (k: string, ms: number) => {
  L[k] = { done: false, armed_at: Date.now(), delay_ms: ms, listLen: null, keyword: null, urlSearch: null, domListLen: null };
  window.setTimeout(() => {
    const rec = L[k];
    if (!rec || rec.done) return;
    rec.listLen = listLen(); rec.domListLen = domListLen(); rec.keyword = keyword(); rec.urlSearch = urlSearch();
    rec.fired_at = Date.now(); rec.elapsed_ms = rec.fired_at - rec.armed_at; rec.done = true;
  }, ms);
  return true;
};
const latchDone = (k: string) => (L[k] ? L[k].done === true : false);
const latchListLen = (k: string) => (L[k] && L[k].done ? L[k].listLen : null);
const latchDomListLen = (k: string) => (L[k] && L[k].done ? L[k].domListLen : null);
const latchKeyword = (k: string) => (L[k] && L[k].done ? L[k].keyword : null);
const latchUrlSearch = (k: string) => (L[k] && L[k].done ? L[k].urlSearch : null);
const latchElapsed = (k: string) => (L[k] && L[k].done ? L[k].elapsed_ms : null);
/** arms a deferred one-shot sample of the hover menu, for a "did NOT close yet" reading */
const armSubnavLatch = (k: string, ms: number) => {
  L[k] = { done: false, armed_at: Date.now(), delay_ms: ms, open: null };
  window.setTimeout(() => { const rec = L[k]; if (!rec || rec.done) return; rec.open = subnavOpen(); rec.done = true; }, ms);
  return true;
};
const latchSubnavOpen = (k: string) => (L[k] && L[k].done ? L[k].open === true : null);

// ---------------------------------------------------------------- ready()
/** the page is ready when the route has settled AND the list the store drives is on screen */
const ready = () => {
  try {
    if (res) return listRendered() || !!q("[data-rb-empty]");
    return !!q("[data-rb-navlink]");
  } catch (e) { return false; }
};

// ---------------------------------------------------------------- gestures (one real gesture each)
const clickType = (t: string) => { const b = typeButton("desktop", t); if (!b) return false; b.click(); return true; };
const typeSearch = (v: string) => {
  const i = q('[data-rb-search="desktop"]') as any;
  if (!i) return false;
  i.focus();
  i.value = v;
  i.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
};
const commitSearch = (v: string) => {
  const i = q('[data-rb-search="desktop"]') as any;
  if (!i) return false;
  i.focus(); i.value = v;
  i.dispatchEvent(new Event("input", { bubbles: true }));
  i.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
};
const clearSearch = () => typeSearch("");
const clickTheme = () => { const b = themeButton() as any; if (!b) return false; b.click(); return true; };
/** The language menu is a `solid-dismiss` <Dismiss menuButton={[langBtnTablet, langBtnDesktop]}>.
 *  solid-dismiss attaches only "mousedown" and "focus" on mount
 *  (node_modules/solid-dismiss/dist/source/local/menuButton.js:263-264) and adds the "click"
 *  listener from INSIDE those two handlers (same file :88 onMouseDownMenuButton, :178
 *  onFocusMenuButton), so a bare element.click() can never toggle showLangs.
  *
 *  langMenuOpen false / langOptionCount 0 on BOTH the clean and the mutation face; gestureB =
 *  mousedown(bubbles) then click -> langMenuOpen true / langOptionCount 20 synchronously on both.
 *  This is the shape a real user produces (mousedown always precedes click), so the bridge
 *  reproduces the user rather than working around the component. */
const openLangMenu = () => {
  const b = langButton() as any;
  if (!b) return false;
  b.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
  b.click();
  return true;
};
const pickLang = (code: string) => {
  const b = langOptions().filter((x: any) => String(x.getAttribute("data-rb-langcode") || "") === code)[0] as any;
  if (!b) return false;
  b.click(); return true;
};
const hoverNav = (label: string) => {
  const a = qa("[data-rb-navlink]").filter((x: any) => txt(x) === label)[0] as any;
  if (!a) return false;
  a.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
  return true;
};
const unhoverNav = (label: string) => {
  const a = qa("[data-rb-navlink]").filter((x: any) => txt(x) === label)[0] as any;
  if (!a) return false;
  a.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
  return true;
};
const scrollToY = (y: number) => { window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }); return Math.round(window.scrollY || 0); };

const api = {
  version: "rb-probe/solid-site/1.0",
  bound: () => join([res ? "resources" : "-", nav ? "nav" : "-", app ? "app" : "-"].filter((x) => x !== "-")),
  errorCount, errorFirst,
  listLen, domListLen, titleAt, typeAt, pubAt, firstTitle, lastTitle, firstThreeTitles,
  orderDescending, orderAscending, allType, distinctTypes, officialCount, timeAgoCount, timeAgoOnFirst,
  publishedOnFirst, firstItemLinkAttrs, emptyNotice, listRendered,
  countsJson, countFor, enabledTypes, enabledCount, typeSelected, typeButtonDisabled, typeButtonMarked,
  typeLabels, typeButtonCount,
  keyword, searchValue, searchPlaceholder, urlPath, urlSearch, urlParam, ctaText,
  isDark, htmlDarkClass, themeTitle, themePresent, themeEnabled, themeSrOnly, locale, htmlLang, dir, domDir,
  docTitle, settingsCookie,
  navLabels, navCount, langMenuOpen, langOptionCount, langOptionLabels, langMarked, langMarkedCount,
  langMarkedCodes, langButtonPresent, subnavOpen, subnavTitles, scrollY, footerPresent, newsletterPresent,
  residueCount, residueChannels,
  armListLatch, armSubnavLatch, latchDone, latchListLen, latchDomListLen, latchKeyword, latchUrlSearch,
  latchElapsed, latchSubnavOpen,
  ready,
  clickType, typeSearch, commitSearch, clearSearch, clickTheme, openLangMenu, pickLang, hoverNav, unhoverNav, scrollToY,
};
(window as any).__SS__ = api;
export default api;
