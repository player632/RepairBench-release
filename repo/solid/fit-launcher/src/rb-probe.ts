/* =============================================================================
 * RB INSTRUMENTATION — read-only observation bridge + gesture atoms
 * -----------------------------------------------------------------------------
 * TWO OBJECTS, ONE RULE EACH
 *   window.__rb      READ-ONLY. Every member is a getter-style function that
 *                    reads either the DOM the app already rendered (through the
 *                    data-rb-* / data-testid attributes environment/
 *                    instrumentation.patch adds) or the offline desk's own
 *                    counters. Nothing writes a signal, nothing patches a
 *                    store, nothing re-implements an app derivation, nothing
 *                    swallows an exception and nothing schedules a timer of its
 *                    own — so the bridge cannot introduce a new timing and
 *                    cannot change what it measures.
 *   window.__rbHost  GESTURE ATOMS ONLY. Every member is something a user or
 *                    the Rust host does: click an element the DSL cannot
 *                    address uniquely, type into the search field, or push a
 *                    named download event over the app's own Tauri event bus.
 *                    These are the ONLY side-effecting members in this file and
 *                    they are referenced from tests/dsl.json `setup` steps
 *                    exclusively, never from an assert.
 *
 * SCALAR OUTPUT ONLY. evaluation/dsl_runner.mjs compares js_eval with a loose
 * `==`, so an object or an array expectation could never pass; composite
 * readings are therefore pre-joined into delimited strings here
 * ("job-alpha,job-beta").
 *
 * WHY A BRIDGE AND NOT JUST data-testid
 *   Three of the twelve defects are precisely "the value is right but the
 *   render never re-runs" (src/stores/download.ts's silent raw mutation,
 *   src/api/manager/api.ts's stuck flush latch, src/pages/Library-01/
 *   CollectionList's expand gesture re-filling the row list from props).
 *   Reading those through the DOM
 *   attribute the app itself repainted is the honest measurement, and the
 *   bridge is what turns "the attribute on the row whose data-rb-job-id is
 *   job-alpha" into one scalar.
 *
 * WHY GESTURE ATOMS AT ALL
 *   1. `data-rb-option="Strategy"` is one of eight siblings sharing a single
 *      data-testid; the DSL's locator grammar addresses a testid, not an
 *      attribute value, so picking a genre by text needs one in-page lookup.
 *   2. The same Slider component is rendered twice on the front page (Newly
 *      Added and Recently Updated), so its controls are not uniquely
 *      addressable either; the atoms take the enclosing section's testid.
 *   3. The search debounce defect is a race inside a 150 ms window. Three
 *      separate runner round-trips cannot be guaranteed to land inside it under
 *      host starvation, and if they do not, the CLEAN face would also fire all
 *      three queries and the checkpoint would stop discriminating. One
 *      synchronous task dispatching the three `input` events makes the
 *      clean/mutated difference a property of the app's own clearTimeout and
 *      nothing else.
 *   4. The host pushes are what the Rust side would emit. They go through
 *      @tauri-apps/api/event#emit, which mockIPC({shouldMockEvents:true})
 *      routes into the listeners src/api/manager/api.ts:74 registered — the
 *      app's real event path, not a direct store write.
 * ========================================================================== */
import { emit } from "@tauri-apps/api/event";
import { rbOfflineStats } from "./rb-offline";
import { RB_JOB_PUSHES } from "./rb-fixtures";

const rbErrors: string[] = [];
let rbBootPhase = "module";
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => { rbErrors.push("error: " + String((e && e.message) || e)); });
  window.addEventListener("unhandledrejection", (e: any) => { rbErrors.push("unhandledrejection: " + String((e && e.reason) || e)); });
}

const txt = (el: Element | null): string => (el ? String(el.textContent || "").replace(/\s+/g, " ").trim() : "");
const attr = (el: Element | null, name: string): string => (el ? String(el.getAttribute(name) || "") : "");
const sel = (s: string): Element | null => (typeof document === "undefined" ? null : document.querySelector(s));
const selAll = (s: string): Element[] => (typeof document === "undefined" ? [] : Array.prototype.slice.call(document.querySelectorAll(s)));
const num = (v: unknown, fallback: number): number => (typeof v === "number" && isFinite(v) ? v : fallback);
const tid = (t: string, root?: Element | null): Element | null => (root || (typeof document === "undefined" ? null : document))
  ? ((root || document) as Element | Document).querySelector('[data-testid="' + t + '"]') : null;
const tidAll = (t: string, root?: Element | null): Element[] =>
  Array.prototype.slice.call(((root || (typeof document === "undefined" ? null : document)) as Element | Document | null)
    ? ((root || document) as Element | Document).querySelectorAll('[data-testid="' + t + '"]') : []);

/* ------------------------------------------------------------- read-only API */
const api = {
  version: "fit-launcher-rb-probe/1",
  /* Readiness gate the DSL polls on instead of sleeping blindly: "app" only
   * once src/index.jsx:14's render() has put the top bar into #root. A pure DOM
   * read - no timer of its own, no cached flag that could go stale. */
  bootPhase(): string {
    if (typeof document === "undefined") return "no-document";
    const root = document.getElementById("root");
    if (!root) return "no-root";
    if (root.childElementCount === 0) return "empty";
    return selAll("[data-rb-nav]").length >= 5 ? "app" : "partial";
  },
  probePhase(): string { return rbBootPhase; },

  /* ---------------------------------------------------------- bridge health */
  errorCount(): number { return rbErrors.length; },
  errorText(): string { return rbErrors.slice(0, 5).join(" || "); },
  themeAttr(): string { return attr(typeof document === "undefined" ? null : document.documentElement, "data-theme"); },

  /* ------------------------------------------------------------- top bar */
  gamehubRootPresent(): boolean { return !!tid("rb-gamehub-root"); },
  navCount(): number { return selAll("[data-rb-nav]").length; },
  navLabels(): string { return selAll("[data-rb-nav] span").map(txt).join(","); },
  navIds(): string { return selAll("[data-rb-nav]").map((el) => attr(el, "data-rb-nav")).join(","); },

  /* ---------------------------------------------------- hero (PopularGames) */
  heroPresent(): boolean { return !!tid("rb-hero"); },
  heroTitle(): string { return attr(tid("rb-hero"), "data-rb-hero-title"); },
  heroDisplayTitle(): string { return txt(tid("rb-hero-display-title")); },
  heroRepack(): string { return attr(tid("rb-hero"), "data-rb-hero-repack"); },
  heroDetail(id: string): string { return attr(tid(id), "data-rb-value"); },
  heroDotCount(): number { return tidAll("rb-hero-dot").length; },
  heroActiveDotIndex(): number {
    const els = tidAll("rb-hero-dot");
    for (let i = 0; i < els.length; i += 1) if (attr(els[i], "data-rb-hero-dot-active") === "1") return i;
    return -1;
  },

  /* ------------------------------------------------------- the two rails */
  sliderCardCount(scope: string): number { return tidAll("rb-slider-card", tid(scope)).length; },
  sliderCardSrc(scope: string, i: number): string { return attr(tidAll("rb-slider-card", tid(scope))[i], "data-rb-card-src"); },
  sliderCardTitle(scope: string, i: number): string { return attr(tidAll("rb-slider-card", tid(scope))[i], "data-rb-card-title"); },
  sliderCardSrcs(scope: string): string { return tidAll("rb-slider-card", tid(scope)).map((el) => attr(el, "data-rb-card-src")).join(","); },
  sliderIndex(scope: string): number {
    const v = attr(tid("rb-slider", tid(scope)), "data-rb-slider-index");
    return v === "" ? -1 : Number(v);
  },
  sliderDotCount(scope: string): number { return tidAll("rb-slider-dot", tid(scope)).length; },
  sectionHeaderText(scope: string): string { return txt(tid(scope) ? tid(scope)!.querySelector("p") : null); },

  /* --------------------------------------------------------- filter bar */
  filterHeaderText(): string { return txt(tid("rb-filterbar") ? tid("rb-filterbar")!.querySelector("[data-rb-filter-title]") : null); },
  filterBadgePresent(): boolean { return !!tid("rb-filterbar-count"); },
  filterBadgeText(): string { return txt(tid("rb-filterbar-count")); },
  filterClearPresent(): boolean { return !!tid("rb-filterbar-clear"); },
  filterPanelPresent(): boolean { return !!tid("rb-filterbar-panel"); },
  filterSectionLabels(): string { return selAll("[data-rb-section-label]").map(txt).join(","); },
  pagerPresent(): boolean { return !!tid("rb-filterbar-pager"); },
  pagerText(): string { return attr(tid("rb-filterbar-pager"), "data-rb-pager-text"); },
  pagerPrevDisabled(): boolean { const el = tid("rb-pager-prev") as HTMLButtonElement | null; return !!el && el.disabled === true; },
  pagerNextDisabled(): boolean { const el = tid("rb-pager-next") as HTMLButtonElement | null; return !!el && el.disabled === true; },

  /* ------------------------------------------------- genre multi-select */
  msddPanelPresent(): boolean { return !!tid("rb-msdd-panel"); },
  msddOptionCount(): number { return tidAll("rb-msdd-option").length; },
  msddOptionTexts(): string { return tidAll("rb-msdd-option").map((el) => attr(el, "data-rb-option")).join(","); },
  msddFirstOption(): string { return attr(tidAll("rb-msdd-option")[0], "data-rb-option"); },
  msddEmptyPresent(): boolean { return !!tid("rb-msdd-empty"); },

  /* ------------------------------------------------------- discovery page */
  discoveryShowing(): string { return txt(tid("rb-discovery-showing")); },
  discoveryRowCount(): number { return tidAll("rb-discovery-row").length; },
  discoveryRowTitle(i: number): string { return attr(tidAll("rb-discovery-row")[i], "data-rb-row-title"); },
  discoveryRowTitles(): string { return tidAll("rb-discovery-row").map((el) => attr(el, "data-rb-row-title")).join(","); },
  discoveryRowRepack(i: number): string { return attr(tidAll("rb-discovery-row")[i], "data-rb-row-repack"); },
  discoveryEmptyPresent(): boolean { return !!tid("rb-discovery-empty"); },

  /* ----------------------------------------------------- downloads page */
  downloadsRootPresent(): boolean { return !!tid("rb-downloads-root"); },
  downloadRowCount(): number { return tidAll("rb-download-item").length; },
  downloadRowIds(): string { return tidAll("rb-download-item").map((el) => attr(el, "data-rb-job-id")).join(","); },
  jobRow(id: string): Element | null { return sel('[data-testid="rb-download-item"][data-rb-job-id="' + id + '"]'); },
  jobStateText(id: string): string { return txt(tid("rb-job-status-text", api.jobRow(id))); },
  jobStateAttr(id: string): string { return attr(api.jobRow(id), "data-rb-job-state"); },
  jobSource(id: string): string { return attr(api.jobRow(id), "data-rb-job-source"); },
  jobBadge(id: string): string { return txt(tid("rb-job-badge", api.jobRow(id))); },
  jobSize(id: string): string { return txt(tid("rb-job-size", api.jobRow(id))); },
  jobPercent(id: string): string { return txt(tid("rb-job-percent", api.jobRow(id))); },
  jobSpeedDown(id: string): string { return txt(tid("rb-job-speed-down", api.jobRow(id))); },
  jobSpeedUp(id: string): string { return txt(tid("rb-job-speed-up", api.jobRow(id))); },
  jobPresent(id: string): boolean { return !!api.jobRow(id); },
  globalSpeedDown(): string { return txt(tid("rb-speed-down")); },
  globalSpeedUp(): string { return txt(tid("rb-speed-up")); },
  globalActive(): string { return txt(tid("rb-active-transfers")); },
  countTorrent(): string { return txt(tid("rb-count-torrent")); },
  countDdl(): string { return txt(tid("rb-count-ddl")); },
  downloadsEmptyPresent(): boolean { return !!tid("rb-downloads-empty"); },

  /* -------------------------------------------------------- library page */
  libraryRootPresent(): boolean { return !!tid("rb-library-root"); },
  libraryCollectionCount(): string { return txt(tid("rb-library-collection-count")); },
  libraryCollectionNames(): string { return selAll("[data-rb-collection-name]").map((el) => attr(el, "data-rb-collection-name")).join(","); },
  collectionRow(name: string): Element | null { return sel('[data-testid="rb-collection"][data-rb-collection-name="' + name + '"]'); },
  collectionExpanded(name: string): boolean { return tidAll("rb-collection-game", api.collectionRow(name)).length > 0; },
  collectionGameCount(name: string): number { return tidAll("rb-collection-game", api.collectionRow(name)).length; },
  collectionGameTitles(name: string): string { return tidAll("rb-collection-game", api.collectionRow(name)).map((el) => attr(el, "data-rb-game-title")).join(","); },
  collectionHeaderText(name: string): string { return txt(tid("rb-collection-count", api.collectionRow(name))); },

  /* ------------------------------------------------------- search field */
  searchValue(): string { const el = tid("rb-searchbar") as HTMLInputElement | null; return el ? String(el.value) : ""; },
  searchTermAttr(): string { return attr(tid("rb-search-root"), "data-rb-search-term"); },
  searchResultCount(): number { return tidAll("rb-search-result").length; },
  searchResultTitles(): string { return tidAll("rb-search-result").map((el) => attr(el, "data-rb-result-title")).join(","); },
  searchFirstResultTitle(): string { return attr(tidAll("rb-search-result")[0], "data-rb-result-title"); },
  searchResultsPresent(): boolean { return !!tid("rb-search-results"); },
  searchClearPresent(): boolean { return !!tid("rb-search-clear"); },
  searchErrorPresent(): boolean { return !!tid("rb-search-error"); },

  /**/
  /* cross-origin references still present in the served document. The seed
   * shipped two (index.html:8-9); environment/adaptation.patch removes both,
   * so this reads 0 on every graded face and is the in-page proof of it. */
  cdnJsdelivrRefs(): number {
    return selAll('script[src*="cdn.jsdelivr.net"], link[href*="cdn.jsdelivr.net"]').length;
  },
  blockedRequests(): number { return num(rbOfflineStats().blocked, -1); },
  blockedUrls(): string { return String(rbOfflineStats().blockedUrls || ""); },
  offlineAnswers(): number { return num(rbOfflineStats().answers, -1); },
  offlineFetchHosts(): string { return String(rbOfflineStats().fetchHosts || ""); },
  ipcInvokes(): number { return num(rbOfflineStats().invokes, -1); },
  ipcUnknownCmds(): string { return String(rbOfflineStats().unknownCmds || ""); },
  swalPresent(): boolean { return typeof window !== "undefined" && typeof (window as any).Swal === "object"; },
  /*
   * own src/services/routeObserver.ts:8 writes localStorage["latestGlobalHref"]
   * on every navigation and src/pages/Downloads-01/Downloads-Item.tsx:39 writes
   * localStorage["job-<id>"], so a total would count the APP's intended storage
   * as residue. Only bridge-owned keys and bridge-owned globals are counted. */
  storageResidueCount(): number {
    if (typeof window === "undefined") return -1;
    let n = 0;
    const countStore = (st: Storage) => {
      try {
        for (let i = 0; i < st.length; i += 1) {
          const k = st.key(i) || "";
          if (/^(__rb|rb[-_])/.test(k)) n += 1;
        }
      } catch { /* a context with storage disabled has no residue to count */ }
    };
    countStore(window.localStorage);
    countStore(window.sessionStorage);
    return n;
  },
  globalResidueCount(): number {
    if (typeof window === "undefined") return -1;
    return Object.getOwnPropertyNames(window).filter((k) => /^__rb(Host)?$/.test(k)).length;
  },
  locationText(): string {
    return typeof window === "undefined" ? "" : window.location.pathname + window.location.search + window.location.hash;
  },
  appStorageKeys(): string {
    if (typeof window === "undefined") return "";
    const out: string[] = [];
    try { for (let i = 0; i < window.localStorage.length; i += 1) out.push(window.localStorage.key(i) || ""); } catch { /* ditto */ }
    return out.sort().join(",");
  },
};

/* ------------------------------------------------------------ gesture atoms */
const clickEl = (el: Element | null): string => {
  if (!el) return "no-element";
  (el as HTMLElement).click();
  return "clicked";
};

const host = {
  version: "fit-launcher-rb-host/1",

  /* The Rust host's download event, by fixture name. Routed through the app's
   * own @tauri-apps/api/event#emit -> mockIPC handleEmit -> the listener at
   * src/api/manager/api.ts:74. 🔴 Always "download::job_updated": the sibling
   * "download::job_completed" (api.ts:110) bypasses the flush queue entirely,
   * so using it here would hide the very latch under test. */
  pushJob(name: string): string {
    const payload = (RB_JOB_PUSHES as Record<string, unknown>)[name];
    if (payload === undefined) return "unknown-push:" + name;
    void emit("download::job_updated", payload);
    return "pushed:" + name;
  },
  pushKeys(): string { return Object.keys(RB_JOB_PUSHES).join(","); },

  /* Pick a genre by its own text (eight siblings share one data-testid). */
  pickGenre(option: string): string {
    return clickEl(sel('[data-testid="rb-msdd-option"][data-rb-option="' + option + '"]'));
  },
  genreOptions(): string { return tidAll("rb-msdd-option").map((el) => attr(el, "data-rb-option")).join(","); },

  /* Rail controls, scoped to the section that owns the Slider instance. */
  sliderNext(scope: string): string { return clickEl(tid("rb-slider-next", tid(scope))); },
  sliderPrev(scope: string): string { return clickEl(tid("rb-slider-prev", tid(scope))); },

  /* Library collection: expand/collapse and local removal. */
  toggleCollection(name: string): string { return clickEl(tid("rb-collection-header", api.collectionRow(name))); },
  removeCollectionGame(name: string, i: number): string { return clickEl(tidAll("rb-collection-game-remove", api.collectionRow(name))[i]); },

  /* Type a word into the search field as N single-character `input` events
   * inside ONE synchronous task, so all N debounce timers are armed before any
   * of them can fire. See the header note (3). */
  typeSearch(word: string): string {
    const el = tid("rb-searchbar") as HTMLInputElement | null;
    if (!el) return "no-searchbar";
    el.focus();
    for (let i = 1; i <= word.length; i += 1) {
      el.value = word.slice(0, i);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return "typed:" + word + ":" + String(word.length);
  },

  /* Park the pointer on the hero so its own 10 s auto-cycle
   * (Popular-Games.tsx:17-23) cannot advance `selected` under a starved host
   * while a checkpoint is still polling. `mouseenter` is NOT in Solid's
   * DelegatedEvents set, so Solid attaches a native listener and a plain
   * non-bubbling MouseEvent is what the app expects. */
  pauseHeroCycle(): string {
    const el = tid("rb-hero-root");
    if (!el) return "no-hero";
    el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
    return "hero-cycle-paused";
  },
  resumeHeroCycle(): string {
    const el = tid("rb-hero-root");
    if (!el) return "no-hero";
    el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    return "hero-cycle-resumed";
  },

  /* Flip the search field back to empty through the app's own clear control. */
  clearSearch(): string { return clickEl(tid("rb-search-clear")); },
};

if (typeof window !== "undefined") {
  (window as any).__rb = api;
  (window as any).__rbHost = host;
  rbBootPhase = "probe-installed";
}

export type RbProbe = typeof api;
export type RbHost = typeof host;
