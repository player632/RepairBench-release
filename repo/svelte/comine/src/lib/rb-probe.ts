/**
 * INSTRUMENTATION (repair-bench, environment/instrumentation.patch) - the measurement bridge.
 *
 * WHY THIS EXISTS. The graded observables of this task are the seed's own pure helpers and its
 * own boot outcome. Nothing in the shipped bundle exposes them to a page context, so this file
 * publishes `window.__COM__`: a flat table of READERS that call the seed's real modules and hand
 * back scalars. It re-implements nothing - every reading below is produced by importing the
 * application's own `src/lib/**` code and calling it, which is what keeps a candidate fix (or a
 * remaining defect) visible in the numbers.
 *
 * CONTRACTS THIS FILE HOLDS
 *  - every reader returns a SCALAR (string | number | boolean | null); `undefined` is converted to
 *    `null` at the boundary, because an `undefined` result cannot be compared by the runner.
 *  - no reader mutates application state, writes storage, navigates, or performs I/O. The only
 *    stateful readers are the two explicitly-named scenarios (`lru*`, `debounce*`), which allocate
 *    their OWN throwaway objects and never touch an application store.
 *  - error/unhandledrejection/console.error are trapped from the moment rb-stub.ts is installed -
 *    the earliest client-side module - so a boot failure is a number, not a silent blank page.
 */
import { get } from 'svelte/store';
import { defaultSettings, settings, settingsReady } from '$lib/stores/settings';
import { remoteDefaults } from '$lib/composables/remoteSync';
import { getLocale } from '$lib/i18n';
import { formatDuration, formatSize, formatSpeed, formatTime, parseTimeString } from '$lib/utils/format';
import { safeDuration, safeDurationSeconds } from '$lib/utils/duration';
import { isDirectFileUrl, isLikelyChannel, isLikelyPlaylist, isYouTubeMix } from '$lib/utils/urlUtils';
import { calculateMatchScore } from '$lib/utils/search';
import { matchesShortcut } from '$lib/utils/keyboard';
import { adjustBrightnessHex, hexToRgba, hslToHex } from '$lib/utils/color';
import { LRUCache } from '$lib/utils/LRUCache';
import { debounce } from '$lib/utils/debounce';
import { rbConsoleErrors, rbIpcLog, rbPageErrors, rbPageRejections, rbStubInstalled } from '$lib/rb-stub';

type Scalar = string | number | boolean | null;

const nul = <T>(value: T | undefined | null): Scalar => (value === undefined ? null : (value as Scalar));

// ---------------------------------------------------------------- error surface
// The traps live in rb-stub.ts and are installed from src/hooks.client.ts, the earliest client-side
// module SvelteKit evaluates. They cannot live here: this module imports the application's own stores,
// whose import-time side effects (src/lib/stores/logs.ts:123-125 calls initLogging() the moment the log
// store is created) are hoisted ahead of every statement in this file, so a trap installed from here is
// always installed after part of the boot it is meant to watch. These are LIVE VIEWS of that module's
// arrays, not copies, so a failure recorded after this module loaded is still counted by the next read.
const errorCount = (): number => rbPageErrors().length;
const errorDetail = (index: number): Scalar => nul(rbPageErrors()[index]);
const rejectionCount = (): number => rbPageRejections().length;
const rejectionDetail = (index: number): Scalar => nul(rbPageRejections()[index]);
const consoleErrorCount = (): number => rbConsoleErrors().length;
const consoleErrorDetail = (index: number): Scalar => nul(rbConsoleErrors()[index]);

// ---------------------------------------------------------------- boot surface
const splashPresent = (): boolean => document.getElementById('splash-screen') !== null;
const appRootPresent = (): boolean => document.querySelector('.app') !== null;
const sidebarNavPresent = (): boolean => document.querySelector('.sidebar-nav') !== null;
const bottomBarPresent = (): boolean => document.querySelector('.bottom-bar') !== null;
const readyFlag = (): boolean => get(settingsReady) === true;
const sizeUnit = (): Scalar => nul(get(settings).sizeUnit);
const defaultSizeUnit = (): Scalar => nul(defaultSettings.sizeUnit);
const backgroundType = (): Scalar => nul(get(settings).backgroundType);
const accentColor = (): Scalar => nul(get(settings).accentColor);
const extensionLocalPort = (): number => Number(get(settings).extensionLocalPort);
const remoteDefaultsKeyCount = (): number => Object.keys(get(remoteDefaults)).length;
const localeCode = (): Scalar => nul(getLocale());
const documentLang = (): Scalar => nul(document.documentElement.getAttribute('lang'));
const titleText = (): Scalar => nul(document.title);
const anchorCount = (): number => document.querySelectorAll('a').length;
const buttonCount = (): number => document.querySelectorAll('button').length;
const inputCount = (): number => document.querySelectorAll('input').length;
const videoElementCount = (): number => document.querySelectorAll('video').length;
const imgElementCount = (): number => document.querySelectorAll('img').length;
const textOf = (selector: string): Scalar => {
  const el = document.querySelector(selector);
  return el === null ? null : (el.textContent || '').trim();
};
const countOf = (selector: string): number => document.querySelectorAll(selector).length;

// ---------------------------------------------------------------- zero-egress surface
function resourceEntries(): PerformanceResourceTiming[] {
  return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
}
const resourceEntryCount = (): number => resourceEntries().length;
const externalRequestCount = (): number =>
  resourceEntries().filter((entry) => {
    try {
      return new URL(entry.name).origin !== window.location.origin;
    } catch {
      return true;
    }
  }).length;
const requestCountFor = (fragment: string): number =>
  resourceEntries().filter((entry) => entry.name.includes(fragment)).length;
const externalRequestNames = (): Scalar => {
  const names = resourceEntries()
    .filter((entry) => {
      try {
        return new URL(entry.name).origin !== window.location.origin;
      } catch {
        return true;
      }
    })
    .map((entry) => entry.name);
  return names.length === 0 ? null : names.join('|');
};

// ---------------------------------------------------------------- storage / URL residue
const localStorageCount = (): number => window.localStorage.length;
const localStorageKeys = (): Scalar => {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key !== null) keys.push(key);
  }
  return keys.length === 0 ? null : keys.sort().join('|');
};
const localStorageHas = (key: string): boolean => window.localStorage.getItem(key) !== null;
const localStorageValue = (key: string): Scalar => nul(window.localStorage.getItem(key));
const sessionStorageCount = (): number => window.sessionStorage.length;
const sessionStorageKeys = (): Scalar => {
  const keys: string[] = [];
  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i);
    if (key !== null) keys.push(key);
  }
  return keys.length === 0 ? null : keys.sort().join('|');
};
const locationSearch = (): Scalar => nul(window.location.search);
const locationHash = (): Scalar => nul(window.location.hash);
const locationPathname = (): Scalar => nul(window.location.pathname);
const cookieString = (): Scalar => nul(document.cookie);

// ---------------------------------------------------------------- native-bridge surface
const ipcCallCount = (): number => rbIpcLog().length;
const ipcDistinctCommandCount = (): number => new Set(rbIpcLog()).size;
const ipcCallCountFor = (cmd: string): number => rbIpcLog().filter((entry) => entry === cmd).length;
const ipcLogJoined = (): Scalar => {
  const log = rbIpcLog();
  return log.length === 0 ? null : log.join('|');
};
const stubInstalled = (): boolean => rbStubInstalled();

// ---------------------------------------------------------------- pure helpers (seed's own code)
const mixProbe = (urlStr: string): boolean => isYouTubeMix(urlStr);
const playlistProbe = (urlStr: string): boolean => isLikelyPlaylist(urlStr);
const playlistIgnoreMixesProbe = (urlStr: string): boolean => isLikelyPlaylist(urlStr, { ignoreMixes: true });
const channelProbe = (urlStr: string): boolean => isLikelyChannel(urlStr);
const directFileFilename = (urlStr: string): Scalar => nul(isDirectFileUrl(urlStr).filename);
const directFileIsFile = (urlStr: string): boolean => isDirectFileUrl(urlStr).isFile;
const sizeProbe = (bytes: number): Scalar => nul(formatSize(bytes));
const speedProbe = (bytesPerSecond: number): Scalar => nul(formatSpeed(bytesPerSecond));
const durationProbe = (seconds: number): Scalar => nul(formatDuration(seconds));
const durationNullProbe = (): Scalar => nul(formatDuration(null));
const durationWithZeroFallback = (seconds: number, zeroFallback: string): Scalar =>
  nul(formatDuration(seconds, { zeroFallback }));
const timeProbe = (seconds: number): Scalar => nul(formatTime(seconds));
const timeForceHoursProbe = (seconds: number): Scalar => nul(formatTime(seconds, { forceHours: true }));
const parseTimeProbe = (input: string): Scalar => nul(parseTimeString(input));
const safeSecondsProbe = (value: number): Scalar => nul(safeDurationSeconds(value));
const safeDurationProbe = (value: number, fallback: number): number => safeDuration(value, fallback);
const matchScoreProbe = (text: string, query: string): number => calculateMatchScore(text, query);
const hslHexProbe = (h: number, s: number, l: number): Scalar => nul(hslToHex(h, s, l));
const brightnessProbe = (hex: string, percent: number): Scalar => nul(adjustBrightnessHex(hex, percent));
const hexToRgbaProbe = (hex: string, alpha: number): Scalar => nul(hexToRgba(hex, alpha));

interface ShortcutShape {
  key: string;
  mod?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}
interface KeyState {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}
function makeKeyEvent(key: string, state: KeyState): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: state.ctrl === true,
    metaKey: state.meta === true,
    shiftKey: state.shift === true,
    altKey: state.alt === true,
    bubbles: true,
    cancelable: true,
  });
}
const shortcutMatch = (key: string, state: KeyState, shortcut: ShortcutShape): boolean =>
  matchesShortcut(makeKeyEvent(key, state), shortcut);

// ---------------------------------------------------------------- scenario 1: LRU eviction
let lruCache: LRUCache<string, number> | null = null;
let lruMutations = 0;
const lruBegin = (maxSize: number): boolean => {
  lruCache = new LRUCache<string, number>(maxSize);
  lruMutations = 0;
  lruCache.setMutationCallback(() => {
    lruMutations += 1;
  });
  return true;
};
const lruSet = (key: string, value: number): number => {
  if (lruCache === null) lruBegin(3);
  lruCache!.set(key, value);
  return lruCache!.size;
};
const lruGet = (key: string): Scalar => (lruCache === null ? null : nul(lruCache.get(key)));
const lruHas = (key: string): boolean => lruCache !== null && lruCache.has(key);
const lruSize = (): number => (lruCache === null ? -1 : lruCache.size);
const lruKeys = (): Scalar => {
  if (lruCache === null) return null;
  const keys: string[] = [];
  for (const entry of lruCache.entries()) keys.push(String(entry[0]));
  return keys.length === 0 ? null : keys.join('|');
};
const lruMutationCount = (): number => lruMutations;

// ---------------------------------------------------------------- scenario 2: debounce timing
let debounceFires = 0;
function makeCounter(waitMs: number) {
  return debounce(() => {
    debounceFires += 1;
  }, waitMs);
}
type DebouncedCounter = ReturnType<typeof makeCounter>;
let debounced: DebouncedCounter | null = null;
const debounceBegin = (waitMs: number): boolean => {
  debounceFires = 0;
  debounced = makeCounter(waitMs);
  return true;
};
const debounceBurst = (times: number): number => {
  if (debounced === null) debounceBegin(250);
  for (let i = 0; i < times; i += 1) debounced!();
  return debounceFires;
};
const debounceCount = (): number => debounceFires;
const debounceCancel = (): number => {
  if (debounced === null) return -1;
  debounced.cancel();
  return debounceFires;
};
const debounceFlush = (): number => {
  if (debounced === null) return -1;
  debounced.flush();
  return debounceFires;
};

// ---------------------------------------------------------------- latches (async boot facts)
interface Latch {
  ok: boolean;
  detail: string;
  polls: number;
}
const latches: Record<string, Latch> = {};
const predicates: Record<string, () => boolean> = {
  settingsReadyTrue: () => get(settingsReady) === true,
  splashGone: () => document.getElementById('splash-screen') === null,
  appMounted: () => document.querySelector('.app') !== null,
  bridgeAnswered: () => rbIpcLog().length > 0,
  remoteDefaultsApplied: () => Object.keys(get(remoteDefaults)).length > 0,
};
const latchNames = (): Scalar => {
  const names = Object.keys(latches);
  return names.length === 0 ? null : names.sort().join('|');
};
async function armLatch(name: string, timeoutMs: number): Promise<boolean> {
  const predicate = predicates[name];
  if (typeof predicate !== 'function') {
    latches[name] = { ok: false, detail: 'unknown predicate', polls: 0 };
    return false;
  }
  const deadline = Date.now() + timeoutMs;
  let polls = 0;
  for (;;) {
    polls += 1;
    let ok = false;
    try {
      ok = predicate() === true;
    } catch (error) {
      latches[name] = { ok: false, detail: error instanceof Error ? error.message : String(error), polls };
      return false;
    }
    if (ok) {
      latches[name] = { ok: true, detail: 'satisfied', polls };
      return true;
    }
    if (Date.now() >= deadline) {
      latches[name] = { ok: false, detail: 'timeout', polls };
      return false;
    }
    await new Promise((resolve) => {
      window.setTimeout(resolve, 50);
    });
  }
}
const latchOk = (name: string): Scalar => (latches[name] ? latches[name].ok : null);
const latchDetail = (name: string): Scalar => (latches[name] ? nul(latches[name].detail) : null);
const latchPolls = (name: string): Scalar => (latches[name] ? latches[name].polls : null);

const bridge = {
  errorCount,
  errorDetail,
  rejectionCount,
  rejectionDetail,
  consoleErrorCount,
  consoleErrorDetail,
  splashPresent,
  appRootPresent,
  sidebarNavPresent,
  bottomBarPresent,
  readyFlag,
  sizeUnit,
  defaultSizeUnit,
  backgroundType,
  accentColor,
  extensionLocalPort,
  remoteDefaultsKeyCount,
  localeCode,
  documentLang,
  titleText,
  anchorCount,
  buttonCount,
  inputCount,
  videoElementCount,
  imgElementCount,
  textOf,
  countOf,
  resourceEntryCount,
  externalRequestCount,
  requestCountFor,
  externalRequestNames,
  localStorageCount,
  localStorageKeys,
  localStorageHas,
  localStorageValue,
  sessionStorageCount,
  sessionStorageKeys,
  locationSearch,
  locationHash,
  locationPathname,
  cookieString,
  ipcCallCount,
  ipcDistinctCommandCount,
  ipcCallCountFor,
  ipcLogJoined,
  stubInstalled,
  mixProbe,
  playlistProbe,
  playlistIgnoreMixesProbe,
  channelProbe,
  directFileFilename,
  directFileIsFile,
  sizeProbe,
  speedProbe,
  durationProbe,
  durationNullProbe,
  durationWithZeroFallback,
  timeProbe,
  timeForceHoursProbe,
  parseTimeProbe,
  safeSecondsProbe,
  safeDurationProbe,
  matchScoreProbe,
  hslHexProbe,
  brightnessProbe,
  hexToRgbaProbe,
  shortcutMatch,
  lruBegin,
  lruSet,
  lruGet,
  lruHas,
  lruSize,
  lruKeys,
  lruMutationCount,
  debounceBegin,
  debounceBurst,
  debounceCount,
  debounceCancel,
  debounceFlush,
  latchNames,
  armLatch,
  latchOk,
  latchDetail,
  latchPolls,
};

let probeInstalled = false;

/** Publishes `window.__COM__`. Idempotent and a no-op outside a browser context. */
export function installRbProbe(): boolean {
  if (probeInstalled) return true;
  if (typeof window === 'undefined') return false;
  probeInstalled = true;
  (window as unknown as Record<string, unknown>).__COM__ = bridge;
  return true;
}

/** True once installRbProbe() has published the bridge for this document. */
export function rbProbeInstalled(): boolean {
  return probeInstalled;
}
