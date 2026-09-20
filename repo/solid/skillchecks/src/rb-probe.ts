// [repair-bench instrumentation] Read-only observation bridge published on window.__SKC__.
// Minimal intrusion: it adds NO game logic and changes NO code path. Two browser-environment
// stubs live here because the seed is a FiveM NUI frame that has no CEF host and no audio
// device when served as a static page (ruling G3(2): native bridge is stubbed on the
// instrumentation side only, src/utils/fetchNui.ts and src/utils/misc.ts stay byte-identical):
//   1. window.fetch to https://nui-frame-app/** is recorded and answered with {"ok":true},
//      mirroring client/main.js:4 cb("ok").
//   2. HTMLAudioElement.prototype.play records {src,kind,volume} and resolves immediately
//      (headless has no audio sink; lib/audio/play.ts and the per-game isFinshed() are untouched).
// Every readout is a frozen scalar taken at call time, so a checkpoint measures inside its
// setup and asserts on a stable value rather than on a monotonic clock.
import { useConfig } from "./lib/store";
import { resetEntropy, entropySeed } from "./lib/entropy";

type NuiCall = { event: string; url: string; body: unknown; at: number };
const nuiCalls: NuiCall[] = [];
const errors: string[] = [];
const startedAt = Date.now();

// ---- stub 1: the NUI transport (the app's only outbound request) ----
const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
(window as any).fetch = async (input: any, init?: any) => {
  const url = typeof input === "string" ? input : (input && input.url) || "";
  if (/^https:\/\/nui-frame-app\//.test(url)) {
    let body: unknown = null;
    try { body = init && init.body ? JSON.parse(String(init.body)) : null; } catch { body = String(init && init.body); }
    nuiCalls.push({ event: url.replace(/^https:\/\/nui-frame-app\//, ""), url, body, at: Date.now() - startedAt });
    return new Response(JSON.stringify("ok"), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (nativeFetch) return nativeFetch(input, init);
  throw new Error("rb-probe: unexpected outbound fetch " + url);
};

// ---- stub 2: audio sink, recording the two parameters the app sets on every cue ----
type AudioCue = { src: string; kind: string; volume: number; at: number };
const audioLog: AudioCue[] = [];
const AUDIO_KINDS: [RegExp, string][] = [
  [/finish1/i, "finish1"],
  [/finish/i, "finish"],
  [/string/i, "string"],
  [/success/i, "success"],
  [/clock/i, "clock"],
];
const kindOf = (u: string) => { for (const [re, k] of AUDIO_KINDS) if (re.test(u)) return k; return "other"; };
try {
  (HTMLAudioElement.prototype as any).play = function (this: HTMLAudioElement) {
    const src = String(this.currentSrc || this.src || "");
    audioLog.push({ src, kind: kindOf(src), volume: this.volume, at: Date.now() - startedAt });
    return Promise.resolve();
  };
} catch { /* ignore */ }

window.addEventListener("error", (e) => { errors.push(String((e && e.message) || "error")); });
window.addEventListener("unhandledrejection", (e: any) => { errors.push("rejection:" + String((e && e.reason && e.reason.message) || e.reason)); });

// ---- the 8 client/main.js SendNUIMessage payloads, verbatim ----
const PAYLOADS: Record<string, any> = {
  alphabet: { active: "alphabet", show: true, name: "Alphabet", description: "This is the alphabet", gameTimeoutDuration: 10000, numKeys: 20 },
  direction: { active: "direction", show: true, name: "direction", description: "This is the direction", gameTimeoutDuration: 30000, requiredCorrectChoices: 2, minGridSize: 3, maxGridSize: 7 },
  flip: { active: "flip", show: true, name: "flip", description: "This is the flip", gameTimeoutDuration: 30000, gridSize: 5 },
  lockpicking: { active: "lockpicking", show: true, name: "lockpicking", description: "This is the lockpicking", gameTimeoutDuration: 30000, numLocks: 12, numLevels: 3 },
  same: { active: "same", show: true, name: "same", description: "This is the same", gameTimeoutDuration: 30000, gridSizeX: 11, gridSizeY: 8 },
  untangle: { active: "untangle", show: true, name: "untangle", description: "This is the untangle", gameTimeoutDuration: 30000, numPoints: 6 },
  words: { active: "words", show: true, name: "words", description: "This is the words", gameTimeoutDuration: 30000, requiredCorrectChoices: 5 },
  flood: { active: "flood", show: true, name: "flood", description: "This is the flood", gameTimeoutDuration: 30000, moveCountLeniency: 5, gridSize: 5 },
};

const q = (s: string) => Array.from(document.querySelectorAll(s));
const one = (s: string) => document.querySelector(s) as HTMLElement | null;
const txt = (s: string) => { const el = one(s); return el ? (el.textContent || "").trim() : null; };
const attr = (s: string, a: string) => { const el = one(s); return el ? el.getAttribute(a) : null; };
const clickEl = (s: string) => { const el = one(s); if (!el) return 0; el.dispatchEvent(new MouseEvent("click", { bubbles: true })); return 1; };
const mouseDownEl = (s: string) => { const el = one(s); if (!el) return 0; el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); return 1; };

// ---- canvas pixel census: exact-colour counters over the two <canvas> games.
// Both games redraw on a fixed timer (untangle setInterval 10ms, lockpicking
// requestAnimationFrame) from state that the seeded PRNG made reproducible, so an
// exact-colour count is a frozen scalar, not a frame-timing reading.
const canvasOf = (id: string) => document.getElementById(id) as HTMLCanvasElement | null;
const census = (id: string, match: (r: number, g: number, b: number, a: number) => boolean) => {
  const c = canvasOf(id);
  if (!c) return -1;
  let ctx: CanvasRenderingContext2D | null = null;
  try { ctx = c.getContext("2d"); } catch { return -2; }
  if (!ctx) return -2;
  let d: Uint8ClampedArray;
  try { d = ctx.getImageData(0, 0, c.width, c.height).data; } catch { return -3; }
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (match(d[i], d[i + 1], d[i + 2], d[i + 3])) n++;
  return n;
};
const exact = (id: string, R: number, G: number, B: number) => census(id, (r, g, b, a) => a !== 0 && r === R && g === G && b === B);

let flipSnap: string | null = null;

const bridge = {
  seed: entropySeed,
  version: "skc-probe/2",
  resetEntropy,
  // ---- NUI inbound: mirrors SendNUIMessage -> useNuiEvent window "message" listener ----
  settings(data: any) { window.postMessage({ action: "skillchecks:settings", data }, "*"); return true; },
  preset(name: string, over?: any) {
    const p = PAYLOADS[name];
    if (!p) throw new Error("rb-probe: unknown preset " + name);
    return bridge.settings(Object.assign({}, p, over || {}));
  },
  payloadNames: () => Object.keys(PAYLOADS),
  payload: (name: string) => (PAYLOADS[name] ? JSON.parse(JSON.stringify(PAYLOADS[name])) : null),
  // ---- NUI outbound ----
  nuiCalls: () => nuiCalls.slice(),
  nuiCallCount: () => nuiCalls.length,
  nuiEvents: () => nuiCalls.map((c) => c.event),
  nuiEventAt: (i: number) => (nuiCalls[i] ? nuiCalls[i].event : null),
  nuiResults: () => nuiCalls.map((c) => (c.body && (c.body as any).result)),
  lastNuiResult: () => (nuiCalls.length ? (nuiCalls[nuiCalls.length - 1].body as any).result : null),
  nuiCallbackField: () => (nuiCalls.length ? ((nuiCalls[nuiCalls.length - 1].body as any) || {}).callback ?? null : null),
  nuiBodyKeys: () => (nuiCalls.length ? Object.keys((nuiCalls[nuiCalls.length - 1].body as any) || {}).sort().join(",") : null),
  clearNuiCalls: () => { nuiCalls.length = 0; return 0; },
  // ---- audio cues ----
  audioLog: () => audioLog.slice(),
  audioCount: () => audioLog.length,
  audioVolumeAt: (i: number) => (audioLog[i] ? audioLog[i].volume : null),
  audioKindAt: (i: number) => (audioLog[i] ? audioLog[i].kind : null),
  audioLastVolume: () => (audioLog.length ? audioLog[audioLog.length - 1].volume : null),
  audioLastKind: () => (audioLog.length ? audioLog[audioLog.length - 1].kind : null),
  audioKinds: () => audioLog.map((c) => c.kind).join(","),
  clearAudio: () => { audioLog.length = 0; return 0; },
  // ---- health ----
  errors: () => errors.slice(),
  errorCount: () => errors.length,
  // ---- store (live, reactive-safe snapshot) ----
  store() {
    const c: any = useConfig();
    return { show: c.show, active: c.active, gameFinished: c.gameFinished, gameWon: c.gameWon, introShown: c.introShown, gameTimeout: c.gameTimeout, gameId: c.gameId, numKeys: c.numKeys, numLocks: c.numLocks, numLevels: c.numLevels, numPoints: c.numPoints, gridSize: c.gridSize, gridSizeX: c.gridSizeX, gridSizeY: c.gridSizeY, minGridSize: c.minGridSize, maxGridSize: c.maxGridSize, moveCountLeniency: c.moveCountLeniency, requiredCorrectChoices: c.requiredCorrectChoices, gameTimeoutDuration: c.gameTimeoutDuration, gameFinishedEndpoint: c.gameFinishedEndpoint, name: c.name, description: c.description };
  },
  storeShow: () => (useConfig() as any).show,
  storeActive: () => (useConfig() as any).active,
  storeGameFinished: () => (useConfig() as any).gameFinished,
  storeGameWon: () => (useConfig() as any).gameWon,
  storeKey: (k: string) => { const v = (useConfig() as any)[k]; return v === undefined ? "UNDEFINED" : (typeof v === "object" ? JSON.stringify(v) : v); },
  storeIsUndefined: (k: string) => ((useConfig() as any)[k] === undefined ? 1 : 0),
  // ---- app shell (main.tsx) ----
  appMounted: () => (one('[data-testid="rb-app"]') ? 1 : 0),
  rootChildCount: () => { const r = document.getElementById("root"); return r ? r.children.length : -1; },
  headerName: () => txt('[data-testid="rb-header-name"]'),
  headerDescription: () => txt('[data-testid="rb-header-desc"]'),
  noGameText: () => txt('[data-testid="rb-no-game"]'),
  barWidthRaw: () => { const el = one('[data-testid="rb-timeout-bar"]'); return el ? el.style.width : null; },
  barWidth: () => { const w = bridge.barWidthRaw(); return w === null ? -1 : Math.round(parseFloat(w) * 100) / 100; },
  // frozen scalar: 1 when the timeout bar has moved BELOW its 100% start (the clean
  // direction), 0 when it is at or above it. Measured at call time, never a clock value.
  barBelowStart: () => (bridge.barWidth() < 100 ? 1 : 0),
  barAboveStart: () => (bridge.barWidth() > 100 ? 1 : 0),
  // ---- zero-runtime-network probes ----
  externalRefTagCount: () => {
    const origin = location.origin;
    let n = 0;
    for (const el of q("link[href],script[src],img[src],iframe[src],source[src]")) {
      const u = el.getAttribute("href") || el.getAttribute("src") || "";
      if (!u || u.startsWith("data:") || u.startsWith("#")) continue;
      try { if (!new URL(u, location.href).origin.startsWith(origin) && !u.startsWith("/")) n++; } catch { n++; }
    }
    return n;
  },
  externalCssImportCount: () => {
    let n = 0;
    for (const ss of Array.from(document.styleSheets)) {
      let rules: any = null;
      try { rules = (ss as any).cssRules; } catch { n++; continue; }
      if (!rules) continue;
      for (const r of Array.from(rules)) if ((r as any).type === 3 || /@import/i.test(String((r as any).cssText || ""))) n++;
    }
    return n;
  },
  hasGtag: () => (typeof (window as any).gtag === "function" ? 1 : 0),
  hasDataLayer: () => (Array.isArray((window as any).dataLayer) ? 1 : 0),
  // ---- same ----
  sameCells: () => q('[data-testid="rb-same-cell"]').map((el) => ({ id: Number(el.getAttribute("data-rb-id")), color: el.getAttribute("data-rb-color") })),
  sameCellCount: () => q('[data-testid="rb-same-cell"]').length,
  sameNullCount: () => q('[data-testid="rb-same-cell"][data-rb-color=""]').length,
  sameColoredCount: () => q('[data-testid="rb-same-cell"]:not([data-rb-color=""])').length,
  sameCellColor: (id: number) => attr('[data-testid="rb-same-cell"][data-rb-id="' + id + '"]', "data-rb-color"),
  sameCellEmpty: (id: number) => (bridge.sameCellColor(id) === "" ? 1 : 0),
  sameMask: () => q('[data-testid="rb-same-cell"]').map((el) => {
    const c = el.getAttribute("data-rb-color");
    return c === "" ? "?" : c === "#df3232" ? "R" : c === "#4a9334" ? "G" : c === "#139dab" ? "B" : "X";
  }).join(""),
  sameGroupSizeHistogram: () => { const h: Record<string, number> = {}; for (const c of bridge.sameCells()) h[String(c.color)] = (h[String(c.color)] || 0) + 1; return h; },
  sameGridColumns: () => { const el = one('[data-testid="rb-same-grid"]') as HTMLElement | null; return el ? el.style.gridTemplateColumns : null; },
  sameClick(id: number) { return mouseDownEl('[data-testid="rb-same-cell"][data-rb-id="' + id + '"]'); },
  // ---- flip ----
  flipCellCount: () => q('[data-testid="rb-flip-cell"]').length,
  flipClickedCount: () => q('[data-testid="rb-flip-cell"][data-rb-clicked="true"]').length,
  flipClicked: (id: number) => (attr('[data-testid="rb-flip-cell"][data-rb-id="' + id + '"]', "data-rb-clicked") === "true" ? 1 : 0),
  flipMask: () => q('[data-testid="rb-flip-cell"]').map((el) => (el.getAttribute("data-rb-clicked") === "true" ? "1" : "0")).join(""),
  flipGridColumns: () => { const el = one('[data-testid="rb-flip-grid"]') as HTMLElement | null; return el ? el.style.gridTemplateColumns : null; },
  flipSnapshot: () => { flipSnap = bridge.flipMask(); return flipSnap.length; },
  flipClickXor: () => {
    const now = bridge.flipMask();
    if (flipSnap === null || now.length !== flipSnap.length) return null;
    let s = "";
    for (let i = 0; i < now.length; i++) s += (now[i] === flipSnap[i] ? "0" : "1");
    return s;
  },
  flipClick(id: number) { return mouseDownEl('[data-testid="rb-flip-cell"][data-rb-id="' + id + '"]'); },
  // ---- flood ----
  floodCellCount: () => q('[data-testid="rb-flood-cell"]').length,
  floodCellColor: (id: number) => attr('[data-testid="rb-flood-cell"][data-rb-id="' + id + '"]', "data-rb-color"),
  floodFilledCount: (color: string) => q('[data-testid="rb-flood-cell"][data-rb-color="' + color + '"]').length,
  floodMask: () => q('[data-testid="rb-flood-cell"]').map((el) => String(el.getAttribute("data-rb-color") || "?").charAt(0)).join(""),
  floodCounter: () => txt('[data-testid="rb-flood-count"]'),
  floodMoveCount: () => { const v = txt('[data-testid="rb-flood-count"]'); if (v === null) return -1; const n = Number(String(v).split("/")[0]); return Number.isFinite(n) ? n : -1; },
  floodTotalCells: () => { const v = txt('[data-testid="rb-flood-count"]'); if (v === null) return -1; const n = Number(String(v).split("/")[1]); return Number.isFinite(n) ? n : -1; },
  floodGridColumns: () => { const el = one('[data-testid="rb-flood-grid"]') as HTMLElement | null; return el ? el.style.gridTemplateColumns : null; },
  floodClick(id: number) { return mouseDownEl('[data-testid="rb-flood-cell"][data-rb-id="' + id + '"]'); },
  // ---- alphabet ----
  alphabetCellCount: () => q('[data-testid="rb-alpha-cell"]').length,
  alphabetLetters: () => q('[data-testid="rb-alpha-cell"]').map((el) => (el.textContent || "").trim()),
  alphabetLetterString: () => q('[data-testid="rb-alpha-cell"]').map((el) => (el.textContent || "").trim()).join(""),
  alphabetFailedCount: () => q('[data-testid="rb-alpha-cell"][data-rb-failed="true"]').length,
  alphabetPressedCount: () => q('[data-testid="rb-alpha-cell"][data-rb-pressed="true"]').length,
  alphabetCellBorder: (i: number) => { const el = q('[data-testid="rb-alpha-cell"]')[i] as HTMLElement | undefined; return el ? el.style.border : null; },
  alphabetCellColor: (i: number) => { const el = q('[data-testid="rb-alpha-cell"]')[i] as HTMLElement | undefined; return el ? el.style.color : null; },
  alphabetTitle: () => txt('[data-testid="rb-alpha-title"]'),
  alphabetLetterAt: (i: number) => { const el = q('[data-testid="rb-alpha-cell"]')[i]; return el ? (el.textContent || "").trim() : null; },
  pressKey(key: string) { document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })); return 1; },
  // ---- words ----
  wordsText: () => txt('[data-testid="rb-word"]'),
  wordsCounter: () => txt('[data-testid="rb-word-count"]'),
  wordsChoice: () => { const v = txt('[data-testid="rb-word-count"]'); if (v === null) return -1; const n = Number(String(v).split("/")[0]); return Number.isFinite(n) ? n : -1; },
  wordsRequired: () => { const v = txt('[data-testid="rb-word-count"]'); if (v === null) return -1; const n = Number(String(v).split("/")[1]); return Number.isFinite(n) ? n : -1; },
  wordsClickNew: () => clickEl('[data-testid="rb-word-new"]'),
  wordsClickSeen: () => clickEl('[data-testid="rb-word-seen"]'),
  // ---- direction ----
  dirCellCount: () => q('[data-testid="rb-dir-cell"]').length,
  dirMask: () => q('[data-testid="rb-dir-cell"]').map((el) => String(el.getAttribute("data-rb-dir") || "?")).join(""),
  dirEmptyCount: () => q('[data-testid="rb-dir-cell"][data-rb-dir="E"]').length,
  dirLeftCount: () => q('[data-testid="rb-dir-cell"][data-rb-dir="L"]').length,
  dirRightCount: () => q('[data-testid="rb-dir-cell"][data-rb-dir="R"]').length,
  dirCenterDir: () => { const m = bridge.dirMask(); return m.length ? (m[Math.floor(m.length / 2)] || null) : null; },
  dirGridColumns: () => { const el = one('[data-testid="rb-dir-grid"]') as HTMLElement | null; return el ? el.style.gridTemplateColumns : null; },
  dirTransform: () => { const el = one('[data-testid="rb-dir-grid"]') as HTMLElement | null; return el ? el.style.transform : null; },
  dirPanelText: () => txt('[data-testid="rb-dir-panel"]'),
  dirCounter: () => { const el = one('[data-testid="rb-dir-panel"]'); if (!el) return null; const m = String(el.textContent || "").match(/(\d+)\s*\/\s*(\d+)\s*$/); return m ? m[0].replace(/\s+/g, " ") : null; },
  dirGlyphs: () => q('[data-testid="rb-dir-glyph"]').map((el) => (el.textContent || "").trim()),
  dirClickLeft: () => clickEl('[data-testid="rb-dir-left"]'),
  dirClickRight: () => clickEl('[data-testid="rb-dir-right"]'),
  dirClickCorrect: () => { const d = bridge.dirCenterDir(); if (d === "L") return bridge.dirClickLeft(); if (d === "R") return bridge.dirClickRight(); return 0; },
  // ---- lockpicking (canvas, reached by its stable id) ----
  lockCanvasPresent: () => (canvasOf("lockpicking") ? 1 : 0),
  lockCanvasWidth: () => { const c = canvasOf("lockpicking"); return c ? c.width : -1; },
  lockCanvasHeight: () => { const c = canvasOf("lockpicking"); return c ? c.height : -1; },
  lockNonBlank: () => census("lockpicking", (r, g, b, a) => a !== 0),
  lockYellow: () => exact("lockpicking", 255, 255, 0),
  lockWhite: () => exact("lockpicking", 255, 255, 255),
  lockGray: () => exact("lockpicking", 128, 128, 128),
  lockOrbAmber: () => exact("lockpicking", 255, 193, 7),
  lockOrbBlue: () => exact("lockpicking", 30, 136, 229),
  lockOrbPink: () => exact("lockpicking", 216, 27, 96),
  lockOrbTotal: () => bridge.lockOrbAmber() + bridge.lockOrbBlue() + bridge.lockOrbPink(),
  // ---- untangle (canvas, reached by its stable id) ----
  untangleCanvasPresent: () => (canvasOf("game") ? 1 : 0),
  untangleCanvasWidth: () => { const c = canvasOf("game"); return c ? c.width : -1; },
  untangleCanvasHeight: () => { const c = canvasOf("game"); return c ? c.height : -1; },
  untangleNonBlank: () => census("game", (r, g, b, a) => a !== 0),
  untangleRed: () => exact("game", 255, 34, 0),
  untangleGreen: () => exact("game", 0, 255, 0),
  untangleCircleEdge: () => exact("game", 0, 170, 0),
  // ---- state isolation (S1.8.7) ----
  storageKeys: () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }),
  storageCount: () => Object.keys(localStorage).length + Object.keys(sessionStorage).length,
  locationHash: () => location.hash,
  locationSearch: () => location.search,
  pathname: () => location.pathname,
  globalsLeaked: () => Object.keys(window).filter((k) => k.startsWith("__") && k !== "__SKC__"),
};
(window as any).__SKC__ = bridge;
export default bridge;
