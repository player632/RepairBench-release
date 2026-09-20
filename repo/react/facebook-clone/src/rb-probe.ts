/**
 * RepairBench observability probe (instrumentation face) for
 * repair-react__facebook-clone-01.
 *
 * Side-effect-only module: src/main.tsx imports it as its FIRST statement, so
 * window.__rb_fbc__ exists before createRoot().render() runs and before any
 * React component mounts.
 *
 * Read-only by construction. It holds no reference to any React component,
 * hook, context or store, reads no component-internal field, adds no
 * data-testid, no class name and no element to the DOM, and registers no
 * listener. Every member is a getter over live browser state, so calling one
 * can never mutate application state. The delivery DSL performs every
 * interaction itself (js_eval clicks / native-setter input events / synthetic
 * wheel + keydown dispatch inside checkpoint setup steps) and reads the
 * application through its OWN DOM, computed-style and URL channels; this bridge
 * is used only for the four things a DOM query cannot answer honestly:
 *
 *   1. liveness - did the instrumentation actually land in the built bundle?
 *      tests/run.sh greps the served bundle for the probeVersion literal
 *      ("fbc-probe-1"); without that guard a dead probe would look like
 *      24 independent behaviour failures instead of one wiring failure.
 *   2. locale - is the run really en-US? Several selectors on this face read
 *      shipped English copy ("See more", "View all N replies", "Following") and
 *      moment.js renders its relative timestamps in the page locale, so a
 *      locale drift invalidates them silently.
 *   3. residue - storage / global / URL pollution, the directed counter to
 *      "global flag" and "hardcoded special-case" fixes. This seed writes NO
 *      storage key of its own (rg -n 'localStorage|sessionStorage|document.cookie'
 *      src/ returns 0 hits at generation time), so LEGIT_STORAGE_KEYS is empty
 *      and ANY key present at assertion time is residue.
 *   4. media - the reel page drives a real <video>; readyState / networkState /
 *      videoWidth are the only honest way to tell "the clip decoded" from "the
 *      clip errored", which decides whether a paused-reading is evidence or an
 *      environment fault.
 *
 * The DSL reads the residue facts DIRECTLY (Object.keys(localStorage),
 * location.pathname) rather than through this bridge, on purpose: a probe that
 * failed to install must not be able to report "clean". The members below
 * mirror those readings for leg diagnostics.
 *
 * Every member degrades to a sentinel ("none" for strings, -1 for numbers)
 * instead of throwing, so a broken face reports a stable value.
 */

export {};

const PROBE_VERSION = 'fbc-probe-1';

/**
 * Storage keys this application legitimately writes: none. The seed has no
 * persistence layer at all - rg -n 'localStorage|sessionStorage|document.cookie'
 * over src/ returns 0 hits, and every piece of UI state is a useState hook that
 * dies with its component. An empty allow-list is therefore the honest one, and
 * it makes unexpectedStorageKeys a pure residue detector.
 */
const LEGIT_STORAGE_KEYS: string[] = [];

/** Global names that only an injected cheat flag would introduce. */
const CHEAT_GLOBALS = ['__rb_residue', '__fixed__', '__patched__', '__hack__'];

const MEMBER_NAMES = [
  'probeVersion',
  'locale',
  'locales',
  'storageKeys',
  'unexpectedStorageKeys',
  'residueGlobals',
  'pathAndSearch',
  'reactMounted',
  'videoState',
  'memberNames',
];

interface RbProbeBridge {
  readonly probeVersion: string;
  readonly locale: string;
  readonly locales: string;
  readonly storageKeys: string;
  readonly unexpectedStorageKeys: number;
  readonly residueGlobals: number;
  readonly pathAndSearch: string;
  readonly reactMounted: number;
  readonly videoState: string;
  readonly memberNames: string;
}

declare global {
  interface Window {
    __rb_fbc__: RbProbeBridge;
  }
}

function safeString(read: () => string, sentinel: string): string {
  try {
    const value = read();
    return typeof value === 'string' ? value : sentinel;
  } catch {
    return sentinel;
  }
}

function safeNumber(read: () => number, sentinel: number): number {
  try {
    const value = read();
    return typeof value === 'number' && Number.isFinite(value) ? value : sentinel;
  } catch {
    return sentinel;
  }
}

function storageKeyList(): string[] {
  try {
    const out: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key !== null) out.push(key);
    }
    return out.sort();
  } catch {
    return [];
  }
}

const bridge: RbProbeBridge = {
  get probeVersion(): string {
    return PROBE_VERSION;
  },
  get locale(): string {
    return safeString(() => window.navigator.language, 'none');
  },
  get locales(): string {
    return safeString(
      () => Array.from(window.navigator.languages || []).join(','),
      'none',
    );
  },
  get storageKeys(): string {
    return safeString(() => storageKeyList().join(','), 'none');
  },
  get unexpectedStorageKeys(): number {
    return safeNumber(
      () => storageKeyList().filter((k) => LEGIT_STORAGE_KEYS.indexOf(k) < 0).length,
      -1,
    );
  },
  get residueGlobals(): number {
    return safeNumber(
      () =>
        CHEAT_GLOBALS.filter((k) =>
          Object.prototype.hasOwnProperty.call(globalThis, k),
        ).length,
      -1,
    );
  },
  get pathAndSearch(): string {
    return safeString(
      () => window.location.pathname + window.location.search,
      'none',
    );
  },
  get reactMounted(): number {
    return safeNumber(() => {
      const root = document.getElementById('root');
      return root ? root.children.length : -1;
    }, -1);
  },
  get videoState(): string {
    return safeString(() => {
      const v = document.querySelector('video');
      if (!v) return 'no-video';
      return [
        'paused=' + String(v.paused),
        'muted=' + String(v.muted),
        'ready=' + String(v.readyState),
        'net=' + String(v.networkState),
        'dur=' + String(Number.isFinite(v.duration) ? Math.round(v.duration * 1000) / 1000 : -1),
        'wh=' + v.videoWidth + 'x' + v.videoHeight,
        'err=' + (v.error ? String(v.error.code) : 'none'),
      ].join('|');
    }, 'none');
  },
  get memberNames(): string {
    return safeString(() => MEMBER_NAMES.join(','), 'none');
  },
};

try {
  Object.defineProperty(window, '__rb_fbc__', {
    value: bridge,
    configurable: false,
    enumerable: false,
    writable: false,
  });
} catch {
  /* already installed - the first import wins */
}
