// rb-probe.ts - observation bridge for the repair-bench verifier (INSTRUMENTATION ONLY).
//
// Neutrality contract: this file only READS the app. It never writes a signal, never
// changes a render branch, never alters a rule, and it is imported for its side effect
// (installing window.__GOL__) before the app renders. Every gesture helper reproduces
// exactly one real user gesture - element.click() on a control <button>, or a bubbling
// MouseEvent('mousedown') on a cell with the button/buttons pair a real primary-button
// press carries - so a checkpoint drives the same code path a user drives.
//
// Why a bridge instead of raw locators: the board is 1600 sibling divs with no ids and
// the five controls are distinguished only by aria-label, one of which (Previous) the
// seed does not set at all. The bridge therefore selects on structure the seed itself
// guarantees - the data-rb-grid / data-rb-control / data-rb-profiler hooks added by this
// same instrumentation patch, the seed's own role="button" markers and its existing
// aria-labels - and it reads the board's truth from the app's OWN grid signal (bound by
// bindApp below) rather than from cell colours, so a checkpoint that asks "is this cell
// alive" cannot be answered by a defect that only repaints it.
//
// Two reference computations live here and both are deliberately partial:
//   1. the toroidal 8-neighbour offsets, which lib/game.ts already spells out in
//      combinePositions/newKey, so nothing is disclosed that the source does not say;
//   2. nothing else. In particular willLive is NOT reimplemented: the bridge never
//      predicts a cell's fate, it only reports statistics about the fate the app chose
//      (e.g. the largest neighbour count any surviving cell had). The expected numbers
//      live in tests/dsl.json, which is not part of the answering environment.
// getRainbowHSL is called with the same arguments App.tsx uses (hueLength = gridSize),
// which is idempotent: lib/colors.ts only rewrites its hue increment and drops its cache
// when the increment actually changes, so repeated calls leave the app's colours alone.
//
// Latch protocol (two synchronous steps, because the runner evaluates expressions and
// polls a failing assert until its budget expires - every reader here is therefore a
// pure, repeatable read with no side effect):
//   setup step 1: window.__GOL__.armFpsPositive(6000)  -> starts a 50ms poll, returns at once
//   setup step 2: wait (any duration; the poll keeps running on the page)
//   assert:       window.__GOL__.latchOk('fpsPositive') === true

import { getRainbowHSL } from "./lib/colors";

const errors: any[] = [];
const latchStore: any = Object.create(null);
const captures: any = Object.create(null);
let app: any = null;

const installErrorTrap = () => {
  window.addEventListener("error", (event: any) => {
    errors.push({ kind: "error", message: String((event && event.message) || "unknown") });
  });
  window.addEventListener("unhandledrejection", (event: any) => {
    errors.push({ kind: "unhandledrejection", message: String((event && event.reason) || "unknown") });
  });
  return true;
};

/** Called once from App.tsx by the instrumentation patch. Stores live accessors only. */
export const bindApp = (handle: any) => {
  app = handle;
  return true;
};

const q = (selector: any, root?: any) => (root || document).querySelector(selector);
const qa = (selector: any, root?: any) =>
  Array.prototype.slice.call((root || document).querySelectorAll(selector));

// --------------------------------------------------------------- board DOM
const gridEl = () => q("[data-rb-grid]");
const rowEls = () => (gridEl() ? Array.prototype.slice.call(gridEl().children) : []);
const cellEls = () => qa('[data-rb-grid] div[role="button"]');
const cellElAt = (index: any) => cellEls()[Number(index)] || null;
const controlEl = (name: any) => q('[data-rb-control="' + name + '"]');
const controlEls = () => qa("[data-rb-control]");
const profilerEl = () => q("[data-rb-profiler]");

// ------------------------------------------------------------ app-state reads
const grid = () => (app && app.grid ? app.grid() : null);
const rows = () => {
  const g = grid();
  return g ? g.length : 0;
};
const cols = () => {
  const g = grid();
  return g && g[0] ? g[0].length : 0;
};
const aliveAt = (y: number, x: number) => {
  const g = grid();
  if (!g || !g[y] || !g[y][x]) return null;
  return !!g[y][x].state();
};
/** flat alive mask in the app's own row-major order (index = y * cols + x) */
const aliveMask = () => {
  const g = grid();
  if (!g) return null;
  const out: number[] = [];
  for (let y = 0; y < g.length; y++) {
    const row = g[y];
    for (let x = 0; x < row.length; x++) out.push(row[x] && row[x].state() ? 1 : 0);
  }
  return out;
};
const population = () => {
  const m = aliveMask();
  return m ? m.reduce((a, b) => a + b, 0) : null;
};
const aliveChecksum = () => {
  const m = aliveMask();
  if (!m) return null;
  let s = 0;
  for (let i = 0; i < m.length; i++) if (m[i]) s += i;
  return s;
};

// ------------------------------------- toroidal neighbour offsets (see header)
const wrapIndex = (k: number, n: number) => (k === -1 ? n - 1 : k === n ? 0 : k);
const liveNeighbours = (mask: number[], width: number, y: number, x: number) => {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const yy = wrapIndex(y + dy, width);
      const xx = wrapIndex(x + dx, width);
      if (mask[yy * width + xx]) n++;
    }
  }
  return n;
};

// ---------------------------------------------------------------- captures
const capture = (tag: string) => {
  const m = aliveMask();
  if (!m) return false;
  captures[tag] = { mask: m, width: cols(), population: m.reduce((a, b) => a + b, 0) };
  return true;
};
const captureCell = (index: any) => {
  const i = Number(index);
  const m = aliveMask();
  if (!m || m[i] === undefined) return false;
  captures.cell = { index: i, alive: !!m[i], population: m.reduce((a, b) => a + b, 0) };
  return true;
};
const sameMask = (a: number[], b: number[]) => {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/** largest toroidal neighbour count (measured on the captured pre-step board) among
 *  INTERIOR cells the app kept alive across the step; -1 when nothing survives.
 *  Interior only: the border is where the seed's wrap arithmetic lives, and this
 *  statistic is about the survival rule, not about the topology. */
const survivorNeighbourMax = () => {
  const c = captures.preStep;
  const now = aliveMask();
  if (!c || !now || c.width !== cols()) return null;
  const w = c.width;
  let max = -1;
  for (let y = 1; y <= w - 2; y++) {
    for (let x = 1; x <= w - 2; x++) {
      const i = y * w + x;
      if (c.mask[i] && now[i]) max = Math.max(max, liveNeighbours(c.mask, w, y, x));
    }
  }
  return max;
};
const survivorsWithNeighbours = (count: any) => {
  const c = captures.preStep;
  const now = aliveMask();
  if (!c || !now || c.width !== cols()) return null;
  const w = c.width;
  const want = Number(count);
  let n = 0;
  for (let y = 1; y <= w - 2; y++) {
    for (let x = 1; x <= w - 2; x++) {
      const i = y * w + x;
      if (c.mask[i] && now[i] && liveNeighbours(c.mask, w, y, x) === want) n++;
    }
  }
  return n;
};

// ------------------------------------------------------------------- colours
const inlineBg = (el: any) => {
  if (!el) return null;
  const raw = String(el.getAttribute("style") || el.style.cssText || "");
  const m = raw.match(/background-color:\s*([^;]+)/i);
  return m ? m[1].trim() : null;
};
const computedBg = (el: any) => (el ? String(window.getComputedStyle(el).backgroundColor || "") : null);
const firstCellIndexWhere = (predicate: any) => {
  const m = aliveMask();
  if (!m) return null;
  for (let i = 0; i < m.length; i++) if (predicate(!!m[i])) return i;
  return null;
};
const deadCellEl = () => cellElAt(firstCellIndexWhere((alive: boolean) => !alive));
const aliveCellEl = () => cellElAt(firstCellIndexWhere((alive: boolean) => alive));
const distinctAliveCellColorCount = () => {
  const m = aliveMask();
  if (!m) return null;
  const els = cellEls();
  const seen: any = Object.create(null);
  let n = 0;
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue;
    const c = computedBg(els[i]);
    if (c === null) continue;
    if (!(c in seen)) {
      seen[c] = 1;
      n++;
    }
  }
  return n;
};
const hueOf = (y: number, x: number) => {
  const hsl = String(getRainbowHSL(y, x, app && app.gridSize ? app.gridSize() : rows()));
  const m = hsl.match(/hsl\(\s*(-?\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
};

// ------------------------------------------------------------------ latches
const armLatch = (name: string, predicate: any, timeoutMs: any) => {
  const budget = Number(timeoutMs) || 6000;
  const started = Date.now();
  const rec = { ok: false, tries: 0, elapsedMs: 0, detail: "armed" };
  latchStore[name] = rec;
  const timer = window.setInterval(() => {
    rec.tries++;
    rec.elapsedMs = Date.now() - started;
    let value: any = null;
    try {
      value = predicate();
    } catch (e: any) {
      rec.detail = "predicate threw: " + String((e && e.message) || e);
    }
    rec.detail = String(value);
    if (value) {
      rec.ok = true;
      window.clearInterval(timer);
      return;
    }
    if (rec.elapsedMs >= budget) {
      window.clearInterval(timer);
      rec.detail = "timeout after " + rec.elapsedMs + "ms, " + rec.tries + " tries, last value " + String(value);
    }
  }, 50);
  return true;
};

// ------------------------------------------------------------------ gestures
/** one real user click on one control <button> (the hook sits on the button itself) */
const pressControl = (name: any) => {
  const el = controlEl(name);
  if (!el) return false;
  el.click();
  return true;
};
/** one real primary-button press on one cell: App.tsx:105 gates on
 *  e.button === 0 && e.buttons === 1, so a bare .click() (buttons 0) is NOT the gesture */
const paintCellIndex = (index: any, buttons: any) => {
  const el = cellElAt(index);
  if (!el) return false;
  el.dispatchEvent(
    new MouseEvent("mousedown", {
      button: 0,
      buttons: buttons === undefined ? 1 : Number(buttons),
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  return true;
};

const api = {
  // bridge health
  bound: () => !!app,
  errorCount: () => errors.length,
  errorDetail: () => (errors.length ? errors.map((e) => e.kind + ": " + e.message).join(" | ") : "none"),

  // board geometry / population (from the app's own grid signal)
  cellCount: () => cellEls().length,
  rowCount: () => rowEls().length,
  rowCellCount: () => (rowEls()[0] ? rowEls()[0].children.length : null),
  gridSize: () => (app && app.gridSize ? app.gridSize() : null),
  gridRows: () => rows(),
  gridCols: () => cols(),
  population,
  aliveChecksum,
  isAliveIndex: (index: any) => {
    const m = aliveMask();
    return m ? !!m[Number(index)] : null;
  },
  aliveAtXY: (y: any, x: any) => aliveAt(Number(y), Number(x)),

  // transport / history state
  isPlaying: () => (app && app.isPlaying ? !!app.isPlaying() : null),
  frames: () => (app && app.frames ? app.frames() : null),
  hasHistory: () => (app && app.hasHistory ? !!app.hasHistory() : null),
  historyLength: () => (app && app.historyLength ? app.historyLength() : null),
  cursor: () => (app && app.cursor ? app.cursor() : null),

  // captures + relational readers (pure; safe under the runner's assert polling)
  capturePreStep: () => capture("preStep"),
  captureMark: () => capture("mark"),
  captureRandomize: () => capture("randomize"),
  markCell: (index: any) => captureCell(index),
  gridChangedSinceMark: () => {
    const c = captures.mark;
    const now = aliveMask();
    return c && now ? !sameMask(c.mask, now) : null;
  },
  gridChangedSinceRandomize: () => {
    const c = captures.randomize;
    const now = aliveMask();
    return c && now ? !sameMask(c.mask, now) : null;
  },
  populationDeltaSinceRandomize: () => {
    const c = captures.randomize;
    const p = population();
    return c && p !== null ? p - c.population : null;
  },
  cellFlippedSinceMark: () => {
    const c = captures.cell;
    const m = aliveMask();
    return c && m && m[c.index] !== undefined ? !!m[c.index] !== c.alive : null;
  },
  populationDeltaMagnitudeSinceCellMark: () => {
    const c = captures.cell;
    const p = population();
    return c && p !== null ? Math.abs(p - c.population) : null;
  },
  survivorNeighbourMax,
  survivorsWithNeighbours,

  // colours + cell presentation
  deadCellBgColor: () => computedBg(deadCellEl()),
  aliveCellBgColor: () => computedBg(aliveCellEl()),
  deadCellInlineColor: () => inlineBg(deadCellEl()),
  aliveCellInlineColor: () => inlineBg(aliveCellEl()),
  aliveCellColorDiffersFromDeadCellColor: () => {
    const a = computedBg(aliveCellEl());
    const d = computedBg(deadCellEl());
    return a === null || d === null ? null : a !== d;
  },
  distinctAliveCellColorCount,
  aliveColorsAreAllTheSame: () => {
    const n = distinctAliveCellColorCount();
    return n === null ? null : n === 1;
  },
  cellTransitionDuration: () => {
    const el = cellElAt(0);
    return el ? String(window.getComputedStyle(el).transitionDuration || "") : null;
  },
  cellTransitionProperty: () => {
    const el = cellElAt(0);
    return el ? String(window.getComputedStyle(el).transitionProperty || "") : null;
  },
  cellSizePx: () => {
    const el = cellElAt(0);
    return el ? String(window.getComputedStyle(el).width || "") : null;
  },
  rainbowHueAt: (y: any, x: any) => hueOf(Number(y), Number(x)),
  rainbowHueStableAt: (y: any, x: any) => {
    const a = hueOf(Number(y), Number(x));
    const b = hueOf(Number(y), Number(x));
    return a === null ? null : a === b;
  },
  rainbowHueInRangeAt: (y: any, x: any) => {
    const h = hueOf(Number(y), Number(x));
    return h === null ? null : h >= 0 && h <= 360;
  },

  // controls
  controlCount: () => controlEls().length,
  controlAriaLabel: (name: any) => {
    const el = controlEl(name);
    return el ? el.getAttribute("aria-label") : null;
  },
  controlDisabled: (name: any) => {
    const el = controlEl(name);
    return el ? !!el.disabled : null;
  },
  controlBgColor: (name: any) => computedBg(controlEl(name)),
  controlClassHas: (name: any, token: any) => {
    const el = controlEl(name);
    return el ? String(el.className || "").split(/\s+/).indexOf(String(token)) >= 0 : null;
  },
  togglePlayLabel: () => {
    const el = controlEl("toggle-play");
    return el ? el.getAttribute("aria-label") : null;
  },

  // profiler
  fpsValue: () => {
    const el = profilerEl();
    if (!el) return null;
    const m = String(el.textContent || "").match(/(-?\d+(?:\.\d+)?)\s*fps/);
    return m ? Number(m[1]) : null;
  },
  fpsText: () => {
    const el = profilerEl();
    return el ? String(el.textContent || "").replace(/\s+/g, " ").trim() : null;
  },
  profilerVisible: () => {
    const el = profilerEl();
    return el ? String(el.className || "").split(/\s+/).indexOf("opacity-0") < 0 : null;
  },

  // latches
  armFpsPositive: (timeoutMs: any) =>
    armLatch("fpsPositive", () => {
      const v = api.fpsValue();
      return v !== null && v > 0;
    }, timeoutMs),
  armFramesAdvancing: (timeoutMs: any) =>
    armLatch("framesAdvancing", () => {
      const v = api.frames();
      return v !== null && v > 0;
    }, timeoutMs),
  latchOk: (name: any) => (latchStore[name] ? !!latchStore[name].ok : null),
  latchDetail: (name: any) => (latchStore[name] ? String(latchStore[name].detail) : null),

  // gestures
  pressControl,
  paintCellIndex,

  // state isolation (§1.8.7): the seed keeps nothing across a reload
  localStorageCount: () => {
    try {
      return window.localStorage.length;
    } catch (e) {
      return -1;
    }
  },
  sessionStorageCount: () => {
    try {
      return window.sessionStorage.length;
    } catch (e) {
      return -1;
    }
  },
  locationQuery: () => String(window.location.search || ""),
  locationHash: () => String(window.location.hash || ""),
  cookieString: () => String(document.cookie || ""),
};

installErrorTrap();
(window as any).__GOL__ = api;
