/**
 * RepairBench observability probe (instrumentation face) for
 * repair-angular__angular-tailwind-01.
 *
 * Side-effect-only module: src/main.ts imports it as its FIRST
 * statement, so window.__rb_atw__ exists before bootstrapApplication()
 * runs and before any Angular component renders.
 *
 * Read-only by construction. It holds no reference to any Angular component,
 * directive or service instance, reads no component-internal field, adds no
 * data-testid, no class name and no element to the DOM, and registers no
 * listener. Every member is a getter over live browser state, so calling one
 * can never mutate application state. The delivery DSL performs every
 * interaction itself (js_eval clicks / input+change dispatch inside checkpoint
 * setup steps) and reads the application through its OWN DOM, storage and URL
 * channels; this bridge is used only for the three things a DOM query cannot
 * answer honestly:
 *
 *   1. liveness - did the instrumentation actually land in the built bundle?
 *      tests/run.sh greps the served bundle for the probeVersion literal
 *      ("atw-probe-1"); without that guard a dead probe would look like
 *      24 independent behaviour failures instead of one wiring failure.
 *   2. locale - is the run really en-US? Several selectors on this face read
 *      shipped English text (the table page headline, the pagination summary,
 *      the auth page copy). A locale drift invalidates them silently.
 *   3. residue - storage / global / URL pollution, the directed counter to
 *      "global flag" and "hardcoded special-case" fixes.
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

const PROBE_VERSION = "atw-probe-1";

/**
 * The only storage key this application legitimately writes:
 * theme.service.ts:41 (setLocalStorage) persists the whole Theme object under
 * "theme"; it is read back by loadTheme() at :19 in the constructor, so a
 * fresh browser context is what makes the D01 initial-signal reading honest.
 */
const LEGIT_STORAGE_KEYS = ["theme"];

/** Global names that only an injected cheat flag would introduce. */
const CHEAT_GLOBALS = ["__rb_residue", "__fixed__", "__patched__", "__hack__"];

const MEMBER_NAMES = [
  "probeVersion",
  "locale",
  "locales",
  "storageKeys",
  "unexpectedStorageKeys",
  "residueGlobals",
  "pathAndSearch",
  "memberNames",
];

interface RbProbeBridge {
  readonly probeVersion: string;
  readonly locale: string;
  readonly locales: string;
  readonly storageKeys: string;
  readonly unexpectedStorageKeys: number;
  readonly residueGlobals: number;
  readonly pathAndSearch: string;
  readonly memberNames: string;
}

declare global {
  interface Window {
    __rb_atw__: RbProbeBridge;
  }
}

function safeString(read: () => string, sentinel: string): string {
  try {
    const value = read();
    return typeof value === "string" ? value : sentinel;
  } catch {
    return sentinel;
  }
}

function safeNumber(read: () => number, sentinel: number): number {
  try {
    const value = read();
    return typeof value === "number" && Number.isFinite(value) ? value : sentinel;
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
    return safeString(() => window.navigator.language, "none");
  },
  get locales(): string {
    return safeString(() => Array.from(window.navigator.languages || []).join(","), "none");
  },
  get storageKeys(): string {
    return safeString(() => storageKeyList().join(","), "none");
  },
  get unexpectedStorageKeys(): number {
    return safeNumber(() => storageKeyList().filter((k) => LEGIT_STORAGE_KEYS.indexOf(k) < 0).length, -1);
  },
  get residueGlobals(): number {
    return safeNumber(() => CHEAT_GLOBALS.filter((k) => Object.prototype.hasOwnProperty.call(globalThis, k)).length, -1);
  },
  get pathAndSearch(): string {
    return safeString(() => window.location.pathname + window.location.search, "none");
  },
  get memberNames(): string {
    return safeString(() => MEMBER_NAMES.join(","), "none");
  },
};

try {
  Object.defineProperty(window, "__rb_atw__", {
    value: bridge,
    configurable: false,
    enumerable: false,
    writable: false,
  });
} catch {
  /* already installed - the first import wins */
}
