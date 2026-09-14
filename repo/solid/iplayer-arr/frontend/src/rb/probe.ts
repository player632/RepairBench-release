// RepairBench read-only instrumentation probe.
// Publishes observable application state for the verifier. Every reader is read-only and
// fail-closed: on error it returns an inert sentinel instead of throwing.
type Stub = {
  version?: number;
  seeded_key?: string;
  key_slot?: string;
  delete_fail_ids?: string[];
  state?: any;
  requests?: any[];
  snapshot?: () => any;
  emit?: (type: string, payload: unknown) => number;
};

const doc = (): Document => window.document;

function norm(s: string | null | undefined): string {
  return String(s === null || s === undefined ? "" : s).replace(/\s+/g, " ").trim();
}

/** innerText when available (so CSS text-transform is honoured), textContent otherwise. */
function txt(el: Element | null | undefined): string {
  if (!el) return "";
  const ht = el as HTMLElement;
  return norm(typeof ht.innerText === "string" ? ht.innerText : el.textContent);
}

function q(sel: string, root?: ParentNode | null): Element | null {
  try {
    return (root || doc()).querySelector(sel);
  } catch (e) {
    return null;
  }
}

function qa(sel: string, root?: ParentNode | null): Element[] {
  try {
    return Array.prototype.slice.call((root || doc()).querySelectorAll(sel));
  } catch (e) {
    return [];
  }
}

function attrOf(el: Element | null | undefined, name: string): string | null {
  return el ? el.getAttribute(name) : null;
}

function bool(el: Element | null | undefined, prop: "disabled" | "checked"): boolean {
  return !!el && !!(el as HTMLButtonElement)[prop];
}

function valOf(el: Element | null | undefined): string {
  return el ? String((el as HTMLInputElement).value ?? "") : "";
}

/** The Card root (ui/Card.tsx CardRoot = div.rounded-lg) that contains `el`. */
function cardOf(el: Element | null | undefined): Element | null {
  let p = el ? el.parentElement : null;
  while (p) {
    const c = String(p.getAttribute("class") || "");
    if (c.split(/\s+/).indexOf("rounded-lg") >= 0) return p;
    p = p.parentElement;
  }
  return null;
}

/**
 * Card root by its <h2> header text (ui/Card.tsx Header renders a title prop as an
 * uppercase <h2>; the header div is the h2's parent and the card root is one above).
 * Comparison is case-insensitive because the header carries text-transform: uppercase.
 */
function cardByTitle(label: string): Element | null {
  const want = norm(label).toLowerCase();
  const hs = qa("h2");
  for (let i = 0; i < hs.length; i++) {
    if (txt(hs[i]).toLowerCase() === want) {
      const header = hs[i].parentElement;
      return header ? header.parentElement : null;
    }
  }
  return null;
}

/** Every <h2> card-header text on the page, in DOM order. */
function cardTitles(): string[] {
  return qa("h2").map(txt);
}

/** Rows inside a card: the seed gives every list row the border-border-subtle token. */
function rowsOf(card: Element | null): Element[] {
  return card ? qa('[class~="border-border-subtle"]', card).filter((r) => r.tagName === "DIV") : [];
}

function tableRows(card: Element | null): Element[] {
  return card ? qa("tbody tr", card) : [];
}

/**
 * The meta line of one Active-Downloads row. Dashboard.tsx renders exactly three
 * children per row: the header line (div.mb-2: title + badge + Cancel button), the
 * <Progress> wrapper (div.flex: the bar plus its own percentage label span) and the
 * meta line (div.mt-2: speed? / downloaded size / duration? / error?). Reading the
 * row's tabular spans without scoping to div.mt-2 also picks up the Progress label,
 * which is a sibling of the row's size cell rather than one of the meta cells.
 */
function activeMetaLine(row: Element | null | undefined): Element | null {
  if (!row) return null;
  return q('div[class~="mt-2"]', row) || (row.lastElementChild as Element | null);
}

/**
 * The meta line's tabular spans, in DOM order. Membership is NOT positionally
 * stable: the speed span only exists once an SSE progress emit has been seen
 * (Dashboard.tsx speedMap) and the duration span only when duration > 0, so the
 * readers below pick a cell by the SHAPE of the string the seed already rendered -
 * never by index. The shapes are mutually exclusive over anything this seed can
 * print, and recognising a shape is not recomputing a value: nothing here formats
 * bytes, durations or speeds, it only tells the rendered cells apart.
 *   size      "<int>.<1dp> B|KB|MB|GB|TB"  (Dashboard.tsx formatBytes)
 *   duration  "<h>h <m>m" or "<m>m"        (Dashboard.tsx formatDuration)
 *   speed     "<int>.<1dp>%/s"             (Dashboard.tsx calcSpeed - matches neither)
 */
function activeMetaSpans(i: number): string[] {
  return qa('span[class~="tabular"]', activeMetaLine(rowsOf(cardByTitle("Active Downloads"))[i])).map(txt);
}
const SIZE_SHAPE = /^\d+\.\d (B|KB|MB|GB|TB)$/;
const DURATION_SHAPE = /^\d+h \d+m$|^\d+m$/;
function firstShaped(spans: string[], re: RegExp): string {
  for (let i = 0; i < spans.length; i++) if (re.test(spans[i])) return spans[i];
  return "";
}

function cell(row: Element | null | undefined, label: string): string {
  return txt(row ? q('td[data-label="' + label + '"]', row) : null);
}

function badgeIn(el: Element | null): string {
  return txt(el ? q('span[class~="rounded-full"]', el) : null);
}

/** The health strip is the parent of the Pause/Resume button (pages/Dashboard.tsx). */
function healthStrip(): Element | null {
  const bs = qa("button");
  for (let i = 0; i < bs.length; i++) {
    const t = txt(bs[i]);
    if (t === "Pause Downloads" || t === "Resume Downloads") return bs[i].parentElement;
  }
  return null;
}

function pills(): Element[] {
  const strip = healthStrip();
  return strip ? qa(":scope > span", strip) : [];
}

/** Label-span / value-span row pairs (pages/System.tsx Row, pages/Config.tsx CopyRow). */
function rowValue(label: string): string {
  const want = norm(label).toLowerCase();
  const rows = qa('div[class~="border-border-subtle"]');
  for (let i = 0; i < rows.length; i++) {
    const kids = rows[i].children;
    if (kids.length < 2) continue;
    if (txt(kids[0]).toLowerCase() === want) return txt(kids[kids.length - 1]);
  }
  return "";
}

function buttonByLabel(label: string): Element | null {
  const want = norm(label).toLowerCase();
  const bs = qa("button");
  for (let i = 0; i < bs.length; i++) if (txt(bs[i]).toLowerCase() === want) return bs[i];
  return null;
}

function logPanel(): Element | null {
  return q('[role="log"]');
}

function logLines(): Element[] {
  const p = logPanel();
  return p ? qa(':scope > div[class~="whitespace-pre-wrap"]', p) : [];
}

function toastViewport(): Element | null {
  return q('div[aria-live="polite"][class~="fixed"]');
}

function toasts(): Element[] {
  const v = toastViewport();
  return v ? qa(":scope > button", v) : [];
}

function stub(): Stub | null {
  const w = window as unknown as { __RB_STUB__?: Stub };
  return w.__RB_STUB__ || null;
}

function stubLen(part: string): number {
  const s = stub();
  const v = s && s.state ? s.state[part] : null;
  return Array.isArray(v) ? v.length : -1;
}

/**
 * Result cards on /search, in render order, one entry per card.
 * pages/Search.tsx gives every result TWO controls whose aria-label starts with
 * "Download " (the quality Select's trigger `Download quality for <title>` and the
 * `Download <title>` button), so anchoring on that prefix yields two hits per card.
 * Walking up to the owning card and de-duplicating keeps the facade's indices equal
 * to the result's own position (0..5) instead of silently doubling them.
 */
function resultCards(): Element[] {
  const seen: Element[] = [];
  const hits = qa('button[aria-label^="Download "]');
  for (let i = 0; i < hits.length; i++) {
    const c = cardOf(hits[i]);
    if (c && seen.indexOf(c) < 0) seen.push(c);
  }
  return seen;
}

const RB = {
  // ---- meta / facade self-description -------------------------------------
  version: 1,
  kind: "read-only-dom-facade",
  stubVersion: (): number => (stub() && typeof stub()!.version === "number" ? (stub() as Stub).version as number : -1),
  stubSeededKey: (): string => String((stub() && stub()!.seeded_key) || ""),
  stubKeySlot: (): string => String((stub() && stub()!.key_slot) || ""),
  storedKey: (): string => {
    try {
      return String(window.localStorage.getItem("iplayer-arr.api-key") || "");
    } catch (e) {
      return "";
    }
  },
  storedKeys: (): string[] => {
    try {
      return Object.keys(window.localStorage).sort();
    } catch (e) {
      return [];
    }
  },
  // backend-side truth (the offline stub's own in-memory state)
  stubCounts: (): Record<string, number> => ({
    active: stubLen("active"),
    queue: stubLen("queue"),
    history: stubLen("history"),
    overrides: stubLen("overrides"),
    directory: stubLen("directory"),
    logs: stubLen("logs"),
  }),
  stubOverrideNames: (): string[] => {
    const s = stub();
    const list = s && s.state && Array.isArray(s.state.overrides) ? s.state.overrides : [];
    return list.map((o: any) => String(o && o.show_name));
  },
  stubRequestCount: (method: string, pathPrefix: string): number => {
    const s = stub();
    const j = s && Array.isArray(s.requests) ? s.requests : [];
    const m = String(method || "").toUpperCase();
    return j.filter((r: any) => (!m || String(r.method).toUpperCase() === m) && String(r.path).indexOf(pathPrefix) === 0).length;
  },
  stubRequests: (method: string, pathPrefix: string): string[] => {
    const s = stub();
    const j = s && Array.isArray(s.requests) ? s.requests : [];
    const m = String(method || "").toUpperCase();
    return j
      .filter((r: any) => (!m || String(r.method).toUpperCase() === m) && String(r.path).indexOf(pathPrefix) === 0)
      .map((r: any) => String(r.method) + " " + String(r.path) + String(r.search || ""));
  },
  stubLastAuth: (): string => {
    const s = stub();
    const j = s && Array.isArray(s.requests) ? s.requests : [];
    return j.length ? String(j[j.length - 1].auth || "") : "";
  },
  stubLiveEventSources: (): number => (stub() && typeof stub()!.live_es === "function" ? (stub() as any).live_es() : -1),

  // ---- generic escapes hatches (pure reads) --------------------------------
  count: (sel: string): number => qa(sel).length,
  exists: (sel: string): boolean => !!q(sel),
  text: (sel: string): string => txt(q(sel)),
  texts: (sel: string): string[] => qa(sel).map(txt),
  attr: (sel: string, name: string): string | null => attrOf(q(sel), name),
  attrs: (sel: string, name: string): (string | null)[] => qa(sel).map((e) => attrOf(e, name)),
  disabled: (sel: string): boolean => bool(q(sel), "disabled"),
  checked: (sel: string): boolean => bool(q(sel), "checked"),
  value: (sel: string): string => valOf(q(sel)),
  bodyText: (): string => txt(doc().body),
  bodyHas: (s: string): boolean => txt(doc().body).indexOf(norm(s)) >= 0,
  bodyLen: (): number => txt(doc().body).length,

  // ---- shell / navigation --------------------------------------------------
  route: (): string => window.location.pathname,
  docTitle: (): string => doc().title,
  h1: (): string => txt(q("h1")),
  skipLink: (): string => txt(q(".skip-link")),
  mainId: (): string => attrOf(q("main"), "id") || "",
  mainTabindex: (): string => attrOf(q("main"), "tabindex") || "",
  activeElementId: (): string => (doc().activeElement ? attrOf(doc().activeElement, "id") || doc().activeElement.tagName : ""),
  navLabels: (): string[] => qa("nav a").map(txt),
  navCount: (): number => qa("nav a").length,
  navCurrent: (): string[] => qa('nav a[aria-current="page"]').map(txt),
  navCurrentCount: (): number => qa('nav a[aria-current="page"]').length,
  brand: (): string => txt(q("nav")),
  cardTitles: cardTitles,
  headings: (): string[] => qa("h1, h2, h3").map(txt),

  // ---- dashboard: health strip --------------------------------------------
  pillCount: (): number => pills().length,
  pills: (): string[] => pills().map(txt),
  pill: (i: number): string => txt(pills()[i]),
  pauseButton: (): string => {
    const b = buttonByLabel("Pause Downloads") || buttonByLabel("Resume Downloads");
    return txt(b);
  },

  // ---- dashboard: active + queue cards ------------------------------------
  activeCardTitles: (): string[] => cardTitles().filter((t) => /^(ACTIVE DOWNLOADS|QUEUE \(\d+\)|HISTORY)$/i.test(t)),
  activeRowCount: (): number => rowsOf(cardByTitle("Active Downloads")).length,
  activeRows: (): string[] => rowsOf(cardByTitle("Active Downloads")).map(txt),
  activeRow: (i: number): string => txt(rowsOf(cardByTitle("Active Downloads"))[i]),
  activeTitle: (i: number): string => txt(q('span[class~="truncate"]', rowsOf(cardByTitle("Active Downloads"))[i])),
  activeBadge: (i: number): string => badgeIn(rowsOf(cardByTitle("Active Downloads"))[i]),
  activeBadges: (): string[] => rowsOf(cardByTitle("Active Downloads")).map(badgeIn),
  activeMeta: (i: number): string[] => activeMetaSpans(i),
  activeMetaLineSpanCount: (i: number): number => qa("span", activeMetaLine(rowsOf(cardByTitle("Active Downloads"))[i])).length,
  activeSize: (i: number): string => firstShaped(activeMetaSpans(i), SIZE_SHAPE),
  activeDuration: (i: number): string => firstShaped(activeMetaSpans(i), DURATION_SHAPE),
  activeError: (i: number): string => txt(q('span[class~="text-danger"]', activeMetaLine(rowsOf(cardByTitle("Active Downloads"))[i]))),
  activeProgressAria: (i: number): string => attrOf(q('[role="progressbar"]', rowsOf(cardByTitle("Active Downloads"))[i]), "aria-valuenow") || "",
  activeProgressLabel: (i: number): string => {
    const bar = q('[role="progressbar"]', rowsOf(cardByTitle("Active Downloads"))[i]);
    const wrap = bar ? bar.parentElement : null;
    return txt(wrap ? wrap.lastElementChild : null);
  },
  activeProgressWidth: (i: number): string => {
    const bar = q('[role="progressbar"]', rowsOf(cardByTitle("Active Downloads"))[i]);
    const fill = bar ? bar.firstElementChild : null;
    return fill ? String((fill as HTMLElement).style.width || "") : "";
  },
  activeProgressAriaLabel: (i: number): string => attrOf(q('[role="progressbar"]', rowsOf(cardByTitle("Active Downloads"))[i]), "aria-label") || "",
  activeCancelLabels: (): string[] => qa('[aria-label^="Cancel "]', cardByTitle("Active Downloads")).map((e) => attrOf(e, "aria-label") || ""),
  queueCardTitle: (): string => {
    const ts = cardTitles();
    for (let i = 0; i < ts.length; i++) if (/^QUEUE \(\d+\)$/i.test(ts[i])) return ts[i];
    return "";
  },
  queueCardPresent: (): boolean => {
    const ts = cardTitles();
    for (let i = 0; i < ts.length; i++) if (/^QUEUE \(\d+\)$/i.test(ts[i])) return true;
    return false;
  },
  queueRowCount: (): number => {
    const ts = cardTitles();
    for (let i = 0; i < ts.length; i++) if (/^QUEUE \(\d+\)$/i.test(ts[i])) return rowsOf(cardByTitle(ts[i])).length;
    return 0;
  },
  queueRow: (i: number): string => {
    const ts = cardTitles();
    for (let k = 0; k < ts.length; k++) if (/^QUEUE \(\d+\)$/i.test(ts[k])) return txt(rowsOf(cardByTitle(ts[k]))[i]);
    return "";
  },
  queueTitles: (): string[] => {
    const ts = cardTitles();
    for (let k = 0; k < ts.length; k++) if (/^QUEUE \(\d+\)$/i.test(ts[k])) return rowsOf(cardByTitle(ts[k])).map((r) => txt(q('span[class~="truncate"]', r)));
    return [];
  },
  queueBadges: (): string[] => {
    const ts = cardTitles();
    for (let k = 0; k < ts.length; k++) if (/^QUEUE \(\d+\)$/i.test(ts[k])) return rowsOf(cardByTitle(ts[k])).map(badgeIn);
    return [];
  },

  // ---- dashboard: history card --------------------------------------------
  historyHeaders: (): string[] => qa("thead th", cardByTitle("History")).map(txt),
  historyRowCount: (): number => tableRows(cardByTitle("History")).length,
  historyTitles: (): string[] => tableRows(cardByTitle("History")).map((r) => cell(r, "Title")),
  historyTitle: (i: number): string => cell(tableRows(cardByTitle("History"))[i], "Title"),
  historyQuality: (i: number): string => cell(tableRows(cardByTitle("History"))[i], "Quality"),
  historySize: (i: number): string => cell(tableRows(cardByTitle("History"))[i], "Size"),
  historySizes: (): string[] => tableRows(cardByTitle("History")).map((r) => cell(r, "Size")),
  historyStatus: (i: number): string => cell(tableRows(cardByTitle("History"))[i], "Status"),
  historyStatuses: (): string[] => tableRows(cardByTitle("History")).map((r) => cell(r, "Status")),
  historyCompleted: (i: number): string => cell(tableRows(cardByTitle("History"))[i], "Completed"),
  historyDeleteLabels: (): string[] => qa('[aria-label^="Delete "]', cardByTitle("History")).map((e) => attrOf(e, "aria-label") || ""),
  historyRowByText: (title: string): number => {
    const rows = tableRows(cardByTitle("History"));
    for (let i = 0; i < rows.length; i++) if (cell(rows[i], "Title") === norm(title)) return i;
    return -1;
  },
  importedRowCount: (): number => tableRows(cardByTitle("History")).filter((r) => cell(r, "Status") === "IMPORTED").length,
  importedRowTitles: (): string[] => tableRows(cardByTitle("History")).filter((r) => cell(r, "Status") === "IMPORTED").map((r) => cell(r, "Title")),
  statsLine: (): string => txt(q('span[class~="ml-auto"]', cardByTitle("History"))),
  statsNumbers: (): string[] => qa('span[class~="ml-auto"] span[class~="tabular"]', cardByTitle("History")).map(txt),
  statsCompleted: (): string => {
    const n = qa('span[class~="ml-auto"] span[class~="tabular"]', cardByTitle("History")).map(txt);
    return n.length ? n[0] : "";
  },
  statsFailed: (): string => {
    const n = qa('span[class~="ml-auto"] span[class~="tabular"]', cardByTitle("History")).map(txt);
    return n.length > 1 ? n[1] : "";
  },
  statsTotal: (): string => {
    const n = qa('span[class~="ml-auto"] span[class~="tabular"]', cardByTitle("History")).map(txt);
    return n.length > 2 ? n[2] : "";
  },
  paginationPresent: (): boolean => !!buttonByLabel("Prev") && !!buttonByLabel("Next"),
  pageText: (): string => {
    const card = cardByTitle("History");
    const spans = card ? qa("span", card) : [];
    for (let i = 0; i < spans.length; i++) {
      const t = txt(spans[i]);
      if (/^Page \d+ of \d+$/.test(t)) return t;
    }
    return "";
  },
  showingText: (): string => {
    const card = cardByTitle("History");
    const spans = card ? qa("span", card) : [];
    for (let i = 0; i < spans.length; i++) {
      const t = txt(spans[i]);
      if (/^Showing \d+ of \d+$/.test(t)) return t;
    }
    return "";
  },
  prevDisabled: (): boolean => bool(buttonByLabel("Prev"), "disabled"),
  nextDisabled: (): boolean => bool(buttonByLabel("Next"), "disabled"),
  ariaSortValues: (): string[] => qa("th[aria-sort]").map((e) => attrOf(e, "aria-sort")),
  ariaSortOf: (header: string): string => {
    const ths = qa("th[aria-sort]");
    const want = norm(header).toUpperCase();
    for (let i = 0; i < ths.length; i++) if (txt(ths[i]).toUpperCase() === want) return attrOf(ths[i], "aria-sort") || "";
    return "";
  },
  sortableHeaderCount: (): number => qa('th[role="button"]').length,

  // ---- /downloads ----------------------------------------------------------
  folderHeading: (): string => {
    const els = qa("div, span");
    for (let i = 0; i < els.length; i++) {
      const t = txt(els[i]);
      if (/^Folders \(\d+\)$/.test(t)) return t;
    }
    return "";
  },
  dlRowCount: (): number => qa("table tbody tr").length,
  dlNames: (): string[] => qa("table tbody tr").map((r) => cell(r, "Folder")),
  dlCell: (i: number, label: string): string => cell(qa("table tbody tr")[i], label),
  dlCells: (label: string): string[] => qa("table tbody tr").map((r) => cell(r, label)),
  dlOwnerBadges: (): string[] => qa("table tbody tr").map((r) => badgeIn(q('td[data-label="Owner"]', r))),
  dlDeleteDisabled: (name: string): boolean => bool(q('[aria-label="Delete ' + name + '"]'), "disabled"),
  dlDeleteTitle: (name: string): string => attrOf(q('[aria-label="Delete ' + name + '"]'), "title") || "",
  dlEmptyText: (): string => (txt(doc().body).indexOf("Downloads directory is empty") >= 0 ? "Downloads directory is empty" : ""),

  // ---- /search -------------------------------------------------------------
  resultCount: (): number => resultCards().length,
  resultTitles: (): string[] => resultCards().map((c) => txt(q('div[class~="text-base"]', c))),
  resultTitle: (i: number): string => txt(q('div[class~="text-base"]', resultCards()[i])),
  resultBadges: (i: number): string[] => qa('span[class~="rounded-full"]', resultCards()[i]).map(txt),
  resultTier: (i: number): string => {
    const bs = qa('span[class~="rounded-full"]', resultCards()[i]).map(txt);
    return bs.length ? bs[0] : "";
  },
  resultChannel: (i: number): string => {
    const bs = qa('span[class~="rounded-full"]', resultCards()[i]).map(txt);
    return bs.length > 1 ? bs[1] : "";
  },
  resultTiers: (): string[] => resultCards().map((c) => {
    const bs = qa('span[class~="rounded-full"]', c).map(txt);
    return bs.length ? bs[0] : "";
  }),
  resultDownloadLabels: (): string[] => qa('button[aria-label^="Download "]').map((e) => attrOf(e, "aria-label") || ""),
  searchInputValue: (): string => valOf(q('input[aria-label="Search BBC iPlayer"]')),
  searchEmptyShown: (): boolean => txt(doc().body).indexOf("No results found") >= 0,
  searchingShown: (): boolean => txt(doc().body).indexOf("Searching...") >= 0,

  // ---- /logs ---------------------------------------------------------------
  logPanelPresent: (): boolean => !!logPanel(),
  logPanelAria: (): string[] => [attrOf(logPanel(), "role") || "", attrOf(logPanel(), "aria-live") || "", attrOf(logPanel(), "aria-label") || ""],
  logRowCount: (): number => logLines().length,
  logLines: (): string[] => logLines().map(txt),
  logLine: (i: number): string => txt(logLines()[i]),
  logLevels: (): string[] => logLines().map((l) => txt(q('span[class~="uppercase"]', l))),
  logEmptyShown: (): boolean => txt(logPanel()).indexOf("No log entries to display.") >= 0,
  logSearchValue: (): string => valOf(q('input[aria-label="Search log messages"]')),
  logPausePressed: (): string => attrOf(q('button[aria-pressed]'), "aria-pressed") || "",
  jumpShown: (): boolean => txt(doc().body).indexOf("Jump to bottom") >= 0,

  // ---- /config -------------------------------------------------------------
  apiKeyCode: (): string => txt(q('code[aria-label="API key"]')),
  apiKeyButtons: (): string[] => {
    const c = q('code[aria-label="API key"]');
    const wrap = c ? c.parentElement : null;
    return wrap ? qa(":scope > button", wrap).map(txt) : [];
  },
  copyRowValue: (label: string): string => rowValue(label),
  copyRowValues: (): string[] => qa("code").map(txt),
  copyButtonLabels: (): string[] => qa('[aria-label^="Copy "]').map((e) => attrOf(e, "aria-label") || ""),
  workersOptionCount: (): number => qa("#cfg-workers option").length,
  workersOptions: (): string[] => qa("#cfg-workers option").map((o) => String((o as HTMLOptionElement).value)),
  workersValue: (): string => valOf(q("#cfg-workers")),
  dirDisabled: (): boolean => bool(q("#cfg-dir"), "disabled"),
  dirAriaDisabled: (): string => attrOf(q("#cfg-dir"), "aria-disabled") || "",
  dirValue: (): string => valOf(q("#cfg-dir")),
  cleanupChecked: (): boolean => bool(q("#cfg-cleanup"), "checked"),
  qualityTrigger: (): string => txt(q('[aria-label="Maximum quality offered to Sonarr"]')),

  // ---- /overrides ----------------------------------------------------------
  overrideRowCount: (): number => qa("table tbody tr").length,
  overrideDataRowCount: (): number => qa("table tbody tr").filter((r) => !q('input[aria-label="Show name"]', r)).length,
  overrideNames: (): string[] => qa("table tbody tr").map((r) => cell(r, "Show name")).filter((t) => t !== ""),
  overrideCell: (i: number, label: string): string => cell(qa("table tbody tr")[i], label),
  overrideRow: (i: number): string => txt(qa("table tbody tr")[i]),
  overrideNameInputPresent: (): boolean => !!q('input[aria-label="Show name"]'),
  overrideNameInputValue: (): string => valOf(q('input[aria-label="Show name"]')),
  overrideNameInputDisabled: (): boolean => bool(q('input[aria-label="Show name"]'), "disabled"),
  overrideError: (): string => txt(q('p[class~="text-danger"]')),
  overrideAddDisabled: (): boolean => bool(buttonByLabel("Add override"), "disabled"),

  // ---- /system -------------------------------------------------------------
  sysRow: (label: string): string => rowValue(label),
  sysRows: (): string[] => qa('div[class~="border-border-subtle"]').map((r) => (r.children.length >= 2 ? txt(r.children[0]) + "=" + txt(r.children[r.children.length - 1]) : txt(r))),
  sysIndexerUrl: (): string => rowValue("Indexer URL"),
  sysIndexerPath: (): string => {
    const v = norm(rowValue("Indexer URL"));
    if (!v) return "";
    try {
      return new URL(v).pathname;
    } catch (e) {
      return v;
    }
  },
  sysIndexerOrigin: (): string => {
    const v = norm(rowValue("Indexer URL"));
    if (!v) return "";
    try {
      return new URL(v).origin;
    } catch (e) {
      return v;
    }
  },
  sysUptime: (): string => rowValue("Uptime"),
  sysProgressAria: (): string => attrOf(q('[role="progressbar"]'), "aria-valuenow") || "",
  sysProgressLabel: (): string => {
    const bar = q('[role="progressbar"]');
    const wrap = bar ? bar.parentElement : null;
    return txt(wrap ? wrap.lastElementChild : null);
  },
  sysUsedText: (): string => {
    const ps = qa("p");
    for (let i = 0; i < ps.length; i++) {
      const t = txt(ps[i]);
      if (/% used$/.test(t)) return t;
    }
    return "";
  },

  // ---- toasts / dialogs / wizard ------------------------------------------
  toastCount: (): number => toasts().length,
  toastTexts: (): string[] => toasts().map(txt),
  toastRoles: (): string[] => toasts().map((t) => attrOf(t, "role") || ""),
  toastViewportAria: (): string => attrOf(toastViewport(), "aria-live") || "",
  dialogPresent: (): boolean => !!q('[role="dialog"]'),
  dialogText: (): string => txt(q('[role="dialog"]')),
  dialogButtons: (): string[] => qa('[role="dialog"] button').map(txt),
  wizardPresent: (): boolean => !!q('[role="dialog"][aria-label="Setup wizard"]'),
  wizardSteps: (): number => qa(".wizard-step").length,
  wizardStepClasses: (): string[] => qa(".wizard-step").map((e) => norm(e.getAttribute("class"))),
  errorCardShown: (): boolean => txt(doc().body).indexOf("Something went wrong") >= 0,

  // ---- 404 -----------------------------------------------------------------
  notFoundHeading: (): string => txt(q("h1")),
  returnLinkPresent: (): boolean => txt(doc().body).indexOf("Return to dashboard") >= 0,
};

export type RbFacade = typeof RB;

/** Installs window.__RB__ once. Idempotent; no side effects beyond the assignment. */
export function installRbProbe(): boolean {
  const w = window as unknown as { __RB__?: RbFacade; __rbProbeInstalled?: boolean };
  if (w.__rbProbeInstalled) return false;
  w.__RB__ = RB;
  w.__rbProbeInstalled = true;
  return true;
}

export default RB;
