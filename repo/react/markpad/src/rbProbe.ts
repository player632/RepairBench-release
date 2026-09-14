// RepairBench instrumentation: a strictly READ-ONLY probe published once as
// `window.__rb` (see src/main.tsx).
//
// Contract:
//   * published exactly once, right after the first render is scheduled;
//   * every member is a pure read of the DOM / storage / location / performance
//     timeline that the application itself already produced - the probe never
//     writes application state, never dispatches an event, never touches
//     storage, never mutates the DOM and never changes what is rendered;
//   * every member is FAIL-CLOSED. A reading that cannot be taken returns a
//     sentinel that the verifier's loose comparison can never mistake for a
//     real one: counts return -999999, strings return "__NOPROBE__", and
//     booleans return the STRING "__NOPROBE__" (so a probe failure can never
//     read as true, false, 0, 1 or "");
//   * the two error counters are passive listeners: they observe, and they do
//     not capture, cancel, swallow or re-dispatch anything;
//   * the members whose ABSENCE is itself the intended reading say so in a
//     comment and return "" / 0 / false instead of a sentinel. They are the
//     exception, and each one is paired with a checkpoint that asserts the
//     opposite value in another state, so neither can go vacuous.
//
// It exists so the verifier can read scalars off the app's own render path
// (accessible names, ARIA state, the app's own class names) instead of
// scraping framework internals.

const NUM_FAIL = -999999;
const STR_FAIL = "__NOPROBE__";

const TOOLBAR = '[role="toolbar"][aria-label="Workspace controls"]';
const RECENTS_NAV = 'nav[aria-label="Recent files"]';
const RECENT_NAME = '[data-testid="recents-name"]';
const RECENT_BADGE = '[data-testid="recents-badge"]';
const MENU = 'div[role="menu"]';
const MENU_ITEM = 'div[role="menu"] button[role="menuitem"]';
const FIND_BAR = 'div[role="search"][aria-label="Find in document"]';
const FIND_STATUS = 'div[role="search"][aria-label="Find in document"] span[role="status"]';
const PREVIEW = ".markpad-preview";
const EDITOR_PANE = 'section[aria-label="Editor"]';
const PREVIEW_PANE = 'section[aria-label="Preview"]';
const LANGUAGE_SELECT = 'select[aria-label="Document language"]';
const DATA_TOOLBAR = '[role="toolbar"][aria-label$=" actions"]';
const FORMAT_TOOLBAR = '[role="toolbar"][aria-label="Text formatting"]';
const VIEW_GROUP = '[data-testid="view-mode-group"]';
const WS_PANEL = 'section[aria-label="Search files"]';
const WS_LIVE = 'section[aria-label="Search files"] div.sr-only[aria-live="polite"]';
const WS_SUMMARY = 'section[aria-label="Search files"] div.sticky';
const WS_INPUT = "#workspace-search-input";
const WS_SCOPE_FOLDER = '[data-testid="ws-scope-folder"]';
const WS_RESULT = '[data-testid="ws-result"]';
const WS_LINE = '[data-testid="ws-line"]';
const ERROR_BANNER = '[data-testid="error-banner"]';
const PREVIEW_BLOCKS = "h1,h2,h3,h4,h5,h6,p,ul,ol,pre,blockquote";
const VIEW_UNAVAILABLE_TITLE =
  "View modes are unavailable for JSON and YAML documents";

// The application's own localStorage namespace (src/lib/preferences.ts:8-12).
// Anything outside it is residue the verifier wants to hear about.
const PREF_PREFIX = "markpad.";

// Globals that are legitimately present once the app is running in a plain
// browser: the probe itself, the offline host stub installed by
// environment/adaptation.patch, and the runner's own paste detector
// (evaluation/dsl_runner.mjs sets window.__wlbPasteFired for Ctrl+V).
const GLOBAL_ALLOW = [
  "__rb",
  "__TAURI_INTERNALS__",
  "__TAURI_EVENT_PLUGIN_INTERNALS__",
  "__wlbPasteFired",
];

function q(sel: string): Element | null {
  try {
    return document.querySelector(sel);
  } catch {
    return null;
  }
}

function qa(sel: string): Element[] {
  try {
    return Array.from(document.querySelectorAll(sel));
  } catch {
    return [];
  }
}

function norm(v: unknown): string {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim();
}

function elText(el: Element | null): string {
  if (el == null) return STR_FAIL;
  const h = el as HTMLElement;
  return norm(h.innerText || el.textContent || "");
}

function elAttr(el: Element | null, name: string): string {
  if (el == null) return STR_FAIL;
  const v = el.getAttribute(name);
  return v == null ? STR_FAIL : norm(v);
}

function joinTexts(list: Element[]): string {
  return list
    .map((el) => norm((el as HTMLElement).innerText || el.textContent || ""))
    .join("|");
}

function num(v: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : NUM_FAIL;
}

function count(sel: string): number {
  return num(qa(sel).length);
}

// A menu item renders `<span>label</span><span>count</span>`, so its text is
// "Close others 2". The count belongs to the bulk-close bookkeeping, not to the
// label, and reading it would make a guard checkpoint depend on idsToClose() -
// the very function two of the defects live in. Strip it.
function menuLabel(el: Element): string {
  const raw = norm((el as HTMLElement).innerText || el.textContent || "");
  return norm(raw.replace(/\d+$/, ""));
}

function emptyRoot(): HTMLElement | null {
  for (const h of qa("h2")) {
    if (/no file open/i.test(h.textContent || "")) {
      const p = h.parentElement;
      if (p) return p;
    }
  }
  return null;
}

function findStatusText(): string {
  const el = q(FIND_STATUS);
  return el == null ? STR_FAIL : norm(el.textContent || "");
}

// SearchBar.tsx:38-43 is the only place this text is composed:
//   ""            -> "Type to search"   (no query typed yet - NOT a real zero)
//   total === 0   -> "No results"
//   current === 0 -> "<total> results"
//   otherwise     -> "<current> of <total>"
// "Type to search" deliberately parses to null so it can never masquerade as a
// measured zero.
function findStatusParts(): { current: number; total: number } | null {
  const s = findStatusText();
  const both = /^(\d+) of (\d+)$/.exec(s);
  if (both) {
    return { current: parseInt(both[1], 10), total: parseInt(both[2], 10) };
  }
  const many = /^(\d+) results$/.exec(s);
  if (many) return { current: 0, total: parseInt(many[1], 10) };
  if (s === "No results") return { current: 0, total: 0 };
  return null;
}

function pressedOf(sel: string): boolean | string {
  try {
    const el = q(sel);
    if (el == null) return STR_FAIL;
    return el.getAttribute("aria-pressed") === "true";
  } catch {
    return STR_FAIL;
  }
}

function underscoreGlobals(): string[] {
  try {
    return Object.getOwnPropertyNames(window).filter(
      (k) => k.indexOf("__") === 0,
    );
  } catch {
    return [];
  }
}

function localKeys(): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k != null) out.push(k);
    }
  } catch {
    return [];
  }
  return out;
}

let uncaughtCount = 0;
let rejectionCount = 0;
let lastErrorMessage = "";
let globalsAtPublish: string[] = [];
let published = false;

const probe = {
  version: 1,

  boot: {
    // True once React has mounted the real chrome: #root has children, the
    // workspace toolbar and the recents sidebar are both in the DOM, and the
    // body carries text. Every checkpoint polls this before it interacts.
    ready: (): boolean | string => {
      try {
        const root = document.getElementById("root");
        if (root == null || root.children.length === 0) return false;
        if (q(TOOLBAR) == null) return false;
        if (q(RECENTS_NAV) == null) return false;
        return norm(document.body.textContent || "").length > 0;
      } catch {
        return STR_FAIL;
      }
    },
    rootKids: (): number => {
      try {
        const root = document.getElementById("root");
        return root == null ? NUM_FAIL : num(root.children.length);
      } catch {
        return NUM_FAIL;
      }
    },
  },

  net: {
    // Cross-origin references, counted two ways at once: the resource-timing
    // buffer (what the browser actually fetched) and the DOM's own url-bearing
    // attributes (what the markup asks for). Only http/https can count, so
    // data:, blob: and fragment urls are never mistaken for an external host,
    // and the SVG xmlns string http://www.w3.org/2000/svg is an attribute the
    // selector list does not look at.
    externalResources: (): number => {
      try {
        const origin = location.origin;
        const foreign = (raw: string): boolean => {
          if (!raw) return false;
          let u: URL;
          try {
            u = new URL(raw, location.href);
          } catch {
            return false;
          }
          if (u.protocol !== "http:" && u.protocol !== "https:") return false;
          return u.origin !== origin;
        };
        let n = 0;
        for (const e of performance.getEntriesByType("resource")) {
          if (foreign(String(e.name))) n += 1;
        }
        const refs = qa(
          "img[src],script[src],link[href],source[src],iframe[src],video[src],audio[src],use[href],image[href]",
        );
        for (const el of refs) {
          const raw = el.getAttribute("src") || el.getAttribute("href") || "";
          if (foreign(raw)) n += 1;
        }
        return num(n);
      } catch {
        return NUM_FAIL;
      }
    },
    resourceEntries: (): number => {
      try {
        return num(performance.getEntriesByType("resource").length);
      } catch {
        return NUM_FAIL;
      }
    },
  },

  globals: {
    // Own `__`-prefixed window globals that appeared AFTER the probe was
    // published. The baseline-relative form is the asserted one: it cannot
    // false-red on whatever the host browser happens to own, and it still
    // catches a "fix" that parks a flag on window (including the harness's own
    // latch global, which is why no latch checkpoint also asserts this).
    unexpected: (): number => {
      try {
        const now = underscoreGlobals();
        let n = 0;
        for (const k of now) {
          if (GLOBAL_ALLOW.indexOf(k) >= 0) continue;
          if (globalsAtPublish.indexOf(k) >= 0) continue;
          n += 1;
        }
        return num(n);
      } catch {
        return NUM_FAIL;
      }
    },
    // Absolute form, kept as a diagnostic sidecar reading (not asserted): the
    // same count against the fixed allowlist only.
    unexpectedAbsolute: (): number => {
      try {
        const now = underscoreGlobals();
        let n = 0;
        for (const k of now) if (GLOBAL_ALLOW.indexOf(k) < 0) n += 1;
        return num(n);
      } catch {
        return NUM_FAIL;
      }
    },
    atPublish: (): number => num(globalsAtPublish.length),
    rbIsFrozen: (): boolean | string => {
      try {
        const w = window as unknown as Record<string, unknown>;
        return Object.isFrozen(w.__rb) === true;
      } catch {
        return STR_FAIL;
      }
    },
  },

  errors: {
    uncaught: (): number => num(uncaughtCount),
    rejections: (): number => num(rejectionCount),
    lastMessage: (): string => (lastErrorMessage === "" ? "" : lastErrorMessage),
  },

  storage: {
    localKeysExtra: (): number => {
      try {
        let n = 0;
        for (const k of localKeys()) if (k.indexOf(PREF_PREFIX) !== 0) n += 1;
        return num(n);
      } catch {
        return NUM_FAIL;
      }
    },
    localKeys: (): string => {
      try {
        return localKeys().sort().join("|");
      } catch {
        return STR_FAIL;
      }
    },
    prefRaw: (key: string): string => {
      try {
        const v = localStorage.getItem(String(key));
        // "" is the legitimate reading for an unset preference.
        return v == null ? "" : norm(v);
      } catch {
        return STR_FAIL;
      }
    },
    themeRaw: (): string => {
      try {
        const v = localStorage.getItem(PREF_PREFIX + "theme");
        return v == null ? "" : norm(v);
      } catch {
        return STR_FAIL;
      }
    },
    sessionLen: (): number => {
      try {
        return num(sessionStorage.length);
      } catch {
        return NUM_FAIL;
      }
    },
    cookies: (): string => {
      try {
        // "" is the legitimate reading for a cookie-free origin.
        return norm(document.cookie);
      } catch {
        return STR_FAIL;
      }
    },
    urlTail: (): string => {
      try {
        // "" is the legitimate reading: markpad is a single-route desktop shell
        // and a plain boot must not park state in the URL.
        return norm(location.search + location.hash);
      } catch {
        return STR_FAIL;
      }
    },
  },

  toolbar: {
    buttons: (): number => count(TOOLBAR + " button"),
    labels: (): string => {
      try {
        return joinTexts(qa(TOOLBAR + " button"));
      } catch {
        return STR_FAIL;
      }
    },
    autoSaveChecked: (): boolean | string => {
      try {
        const el = q(TOOLBAR + ' input[type="checkbox"]') as HTMLInputElement | null;
        if (el == null) return STR_FAIL;
        return el.checked === true;
      } catch {
        return STR_FAIL;
      }
    },
  },

  empty: {
    present: (): boolean | string => {
      try {
        return emptyRoot() != null;
      } catch {
        return STR_FAIL;
      }
    },
    h2: (): string => {
      try {
        for (const h of qa("h2")) {
          if (/no file open/i.test(h.textContent || "")) return norm(h.textContent);
        }
        return STR_FAIL;
      } catch {
        return STR_FAIL;
      }
    },
    kbdCount: (): number => {
      try {
        const r = emptyRoot();
        return r == null ? NUM_FAIL : num(r.querySelectorAll("kbd").length);
      } catch {
        return NUM_FAIL;
      }
    },
    kbds: (): string => {
      try {
        const r = emptyRoot();
        return r == null ? STR_FAIL : joinTexts(Array.from(r.querySelectorAll("kbd")));
      } catch {
        return STR_FAIL;
      }
    },
    modKey: (): string => {
      try {
        const r = emptyRoot();
        if (r == null) return STR_FAIL;
        const k = r.querySelector("kbd");
        if (k == null) return STR_FAIL;
        const t = norm(k.textContent);
        const i = t.indexOf("+");
        return i > 0 ? t.slice(0, i) : STR_FAIL;
      } catch {
        return STR_FAIL;
      }
    },
    panes: (): number => {
      try {
        return num(qa(EDITOR_PANE).length + qa(PREVIEW_PANE).length);
      } catch {
        return NUM_FAIL;
      }
    },
  },

  doc: {
    lines: (): number => count(".cm-line"),
    len: (): number => {
      try {
        const c = q(".cm-content");
        return c == null ? NUM_FAIL : num(norm(c.textContent || "").length);
      } catch {
        return NUM_FAIL;
      }
    },
    text: (): string => {
      try {
        return joinTexts(qa(".cm-line"));
      } catch {
        return STR_FAIL;
      }
    },
    editors: (): number => count(".cm-editor"),
  },

  recents: {
    rows: (): number => count(RECENTS_NAV + ' li[role="listitem"]'),
    name: (i: number): string => {
      try {
        const els = qa(RECENT_NAME);
        const el = els[Number(i)];
        return el == null ? STR_FAIL : norm(el.textContent || "");
      } catch {
        return STR_FAIL;
      }
    },
    names: (): string => {
      try {
        return joinTexts(qa(RECENT_NAME));
      } catch {
        return STR_FAIL;
      }
    },
    namesSorted: (): string => {
      try {
        return qa(RECENT_NAME)
          .map((el) => norm(el.textContent || ""))
          .sort()
          .join("|");
      } catch {
        return STR_FAIL;
      }
    },
    distinctNames: (): number => {
      try {
        const seen: string[] = [];
        for (const el of qa(RECENT_NAME)) {
          const t = norm(el.textContent || "");
          if (seen.indexOf(t) < 0) seen.push(t);
        }
        return num(seen.length);
      } catch {
        return NUM_FAIL;
      }
    },
    ariaCurrent: (): number => count(RECENTS_NAV + ' button[aria-current="true"]'),
    // "" is the legitimate reading: RecentsPanel.tsx:166-170 renders the count
    // badge only when the list is non-empty, so its absence IS the empty-list
    // fact. P04 asserts "2" on the same getter, which keeps it from going
    // vacuous.
    badgeText: (): string => {
      try {
        const el = q(RECENT_BADGE);
        return el == null ? "" : norm(el.textContent || "");
      } catch {
        return STR_FAIL;
      }
    },
    emptyText: (): string => {
      try {
        const el = q(RECENTS_NAV + " p");
        return el == null ? STR_FAIL : norm(el.textContent || "");
      } catch {
        return STR_FAIL;
      }
    },
    menus: (): number => count(MENU),
    menuCount: (): number => count(MENU_ITEM),
    menuLabels: (): string => {
      try {
        return qa(MENU_ITEM).map(menuLabel).join("|");
      } catch {
        return STR_FAIL;
      }
    },
    menuDisabled: (): number => count(MENU_ITEM + "[disabled]"),
  },

  find: {
    open: (): boolean | string => {
      try {
        return q(FIND_BAR) != null;
      } catch {
        return STR_FAIL;
      }
    },
    status: (): string => findStatusText(),
    total: (): number => {
      try {
        const p = findStatusParts();
        return p == null ? NUM_FAIL : num(p.total);
      } catch {
        return NUM_FAIL;
      }
    },
    current: (): number => {
      try {
        const p = findStatusParts();
        return p == null ? NUM_FAIL : num(p.current);
      } catch {
        return NUM_FAIL;
      }
    },
    highlights: (): number => count(".cm-searchMatch"),
    selectedHighlights: (): number => count(".cm-searchMatch-selected"),
    inputValue: (): string => {
      try {
        const el = q('[data-testid="find-input"]') as HTMLInputElement | null;
        return el == null ? STR_FAIL : norm(el.value);
      } catch {
        return STR_FAIL;
      }
    },
  },

  preview: {
    panes: (): number => count(PREVIEW),
    paragraphs: (): number => count(PREVIEW + " p"),
    brInFirstParagraph: (): number => {
      try {
        const p = q(PREVIEW + " p");
        return p == null ? NUM_FAIL : num(p.querySelectorAll("br").length);
      } catch {
        return NUM_FAIL;
      }
    },
    firstSourceLine: (): string =>
      elAttr(q(PREVIEW + " [data-source-line]"), "data-source-line"),
    stampedBlocks: (): number => count(PREVIEW + " [data-source-line]"),
    unstampedBlocks: (): number => {
      try {
        let n = 0;
        // PREVIEW_BLOCKS is a comma list, so `PREVIEW + " " + PREVIEW_BLOCKS`
        // would scope only its FIRST selector: ".markpad-preview h1,h2,p,..."
        // counts every h2/p/ul/pre in the whole DOCUMENT, and the app shell
        // renders <p> of its own (App.tsx:185 EmptyState, ConfirmDialog.tsx:55,
        // WorkspaceSearchPanel.tsx:323-348). Scope each block selector on its
        // own so the reading is really "preview blocks with no source stamp".
        for (const block of PREVIEW_BLOCKS.split(",")) {
          for (const el of qa(PREVIEW + " " + block)) {
            if (!el.hasAttribute("data-source-line")) n += 1;
          }
        }
        return num(n);
      } catch {
        return NUM_FAIL;
      }
    },
    headings: (): number => count(PREVIEW + " h1"),
    lists: (): number => count(PREVIEW + " ul"),
    pres: (): number => count(PREVIEW + " pre"),
    svgs: (): number => count(PREVIEW + " svg"),
    diagramPlaceholders: (): number => count(".markpad-diagram"),
    diagramSvgs: (): number => count(".markpad-diagram-view svg"),
    head: (): string => {
      try {
        const el = q(PREVIEW);
        return el == null ? STR_FAIL : norm(el.textContent || "").slice(0, 120);
      } catch {
        return STR_FAIL;
      }
    },
  },

  lang: {
    value: (): string => {
      try {
        const el = q(LANGUAGE_SELECT) as HTMLSelectElement | null;
        return el == null ? STR_FAIL : norm(el.value);
      } catch {
        return STR_FAIL;
      }
    },
    previewPanes: (): number => count(PREVIEW_PANE),
    editorPanes: (): number => count(EDITOR_PANE),
    dataToolbars: (): number => count(DATA_TOOLBAR),
    dataToolbarLabel: (): string => elAttr(q(DATA_TOOLBAR), "aria-label"),
    formatToolbars: (): number => count(FORMAT_TOOLBAR),
  },

  view: {
    groupButtons: (): number => count(VIEW_GROUP + " button"),
    labels: (): string => {
      try {
        return joinTexts(qa(VIEW_GROUP + " button"));
      } catch {
        return STR_FAIL;
      }
    },
    pressedCount: (): number => count(VIEW_GROUP + ' button[aria-pressed="true"]'),
    // "" is the legitimate reading for "no segment is pressed", which is exactly
    // what a data document must show; F12/P19 assert the pressed count on the
    // same state, so the empty string cannot carry a green on its own.
    pressedLabel: (): string => {
      try {
        const el = q(VIEW_GROUP + ' button[aria-pressed="true"]');
        return el == null ? "" : norm(el.textContent || "");
      } catch {
        return STR_FAIL;
      }
    },
    pressedIsDisabled: (): boolean | string => {
      try {
        const el = q(VIEW_GROUP + ' button[aria-pressed="true"]') as HTMLButtonElement | null;
        if (el == null) return false;
        return el.disabled === true;
      } catch {
        return STR_FAIL;
      }
    },
    disabledCount: (): number => count(VIEW_GROUP + " button[disabled]"),
    unavailableTitles: (): number =>
      count(VIEW_GROUP + ' button[title="' + VIEW_UNAVAILABLE_TITLE + '"]'),
  },

  ws: {
    open: (): boolean | string => {
      try {
        return q(WS_PANEL) != null;
      } catch {
        return STR_FAIL;
      }
    },
    // "" is the legitimate reading before a search has run (the live region is
    // always mounted and empty until then); F10 polls it until it is non-empty.
    statusText: (): string => {
      try {
        const el = q(WS_LIVE);
        return el == null ? STR_FAIL : norm(el.textContent || "");
      } catch {
        return STR_FAIL;
      }
    },
    summary: (): string => {
      try {
        const el = q(WS_SUMMARY);
        return el == null ? STR_FAIL : norm(el.textContent || "");
      } catch {
        return STR_FAIL;
      }
    },
    rows: (): number => count(WS_RESULT),
    lineBadges: (): string => {
      try {
        return joinTexts(qa(WS_LINE));
      } catch {
        return STR_FAIL;
      }
    },
    firstLineBadge: (): string => elText(q(WS_LINE)),
    firstRowTitle: (): string => elAttr(q(WS_RESULT), "title"),
    folderPressed: (): boolean | string => pressedOf(WS_SCOPE_FOLDER),
    inputDisabled: (): boolean | string => {
      try {
        const el = q(WS_INPUT) as HTMLInputElement | null;
        if (el == null) return STR_FAIL;
        return el.disabled === true;
      } catch {
        return STR_FAIL;
      }
    },
    inputValue: (): string => {
      try {
        const el = q(WS_INPUT) as HTMLInputElement | null;
        return el == null ? STR_FAIL : norm(el.value);
      } catch {
        return STR_FAIL;
      }
    },
    pickScopeText: (): boolean | string => {
      try {
        for (const el of qa(WS_PANEL + " p")) {
          if (norm(el.textContent || "") === "Pick a search scope") return true;
        }
        return false;
      } catch {
        return STR_FAIL;
      }
    },
    noResultsText: (): boolean | string => {
      try {
        for (const el of qa(WS_PANEL + " p")) {
          if (norm(el.textContent || "") === "No results found") return true;
        }
        return false;
      } catch {
        return STR_FAIL;
      }
    },
    errorText: (): string => {
      try {
        for (const el of qa(WS_PANEL + " div")) {
          const t = norm(el.textContent || "");
          if (t.length > 0 && t.length < 200 && el.children.length === 0) {
            if (/could not|failed|permission/i.test(t)) return t;
          }
        }
        return "";
      } catch {
        return STR_FAIL;
      }
    },
  },

  theme: {
    name: (): string => {
      try {
        const v = document.documentElement.dataset.theme;
        return v == null ? STR_FAIL : norm(v);
      } catch {
        return STR_FAIL;
      }
    },
  },

  banner: {
    present: (): boolean | string => {
      try {
        return q(ERROR_BANNER) != null;
      } catch {
        return STR_FAIL;
      }
    },
    text: (): string => elText(q(ERROR_BANNER)),
    // The offline host stub must never surface in user-visible copy: every
    // caller of the Tauri commands has its own documented fallback
    // (src/lib/fileOpen.ts:87-108 friendlyMessage), so a banner that quotes the
    // stub, the IPC layer or a raw JS value is a leak.
    leaksHostError: (): boolean | string => {
      try {
        const el = q(ERROR_BANNER);
        if (el == null) return STR_FAIL;
        const t = norm(el.textContent || "").toLowerCase();
        return /tauri|rb-offline-stub|invoke|ipc|transformcallback|undefined|\[object object\]|null is not/.test(
          t,
        );
      } catch {
        return STR_FAIL;
      }
    },
  },
};

export type RbProbe = typeof probe;

export function publishRbProbe(): void {
  try {
    if (published) return;
    published = true;
    globalsAtPublish = underscoreGlobals();
    window.addEventListener("error", (ev: ErrorEvent) => {
      uncaughtCount += 1;
      const m = ev && ev.message ? String(ev.message) : "";
      if (m.length > 0 && lastErrorMessage.length < 200) {
        lastErrorMessage = m.slice(0, 200);
      }
    });
    window.addEventListener("unhandledrejection", () => {
      rejectionCount += 1;
    });
    const w = window as unknown as Record<string, unknown>;
    // Freeze every namespace as well as the root, so nothing can add a member
    // to the probe after the fact (a "fix" that teaches the probe a new reading
    // would be indistinguishable from the app behaving).
    const root = probe as unknown as Record<string, unknown>;
    for (const k of Object.keys(root)) {
      const v = root[k];
      if (v != null && typeof v === "object") Object.freeze(v);
    }
    w.__rb = Object.freeze(probe);
  } catch {
    // Instrumentation must never be the reason the app fails to boot.
  }
}
