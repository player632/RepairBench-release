/**
 * RepairBench observability probe (instrumentation face) for
 * repair-angular__angular-tiptap-editor-01.
 *
 * Side-effect-only module: src/main.ts imports it as its FIRST statement, so
 * window.__rb_ate__ exists before bootstrapApplication() runs and before any
 * Angular component renders.
 *
 * Read-only by construction. It holds no reference to any Angular component,
 * directive or service instance, reads no component-internal field, adds no
 * data-testid, no class name and no element to the DOM, and registers no
 * listener. Every member is a getter over live browser state, so calling one
 * can never mutate application state. The delivery DSL performs every
 * interaction itself (null-safe js_eval clicks inside checkpoint setup steps)
 * and uses this bridge only for the three things a DOM query cannot answer
 * honestly:
 *
 *   1. liveness - did the instrumentation actually land in the built bundle?
 *      P02 asserts probeVersion; without that assert a dead probe would look
 *      like 24 independent behaviour failures instead of one wiring failure.
 *   2. locale - is the run really en-US? Every selector on this face reads
 *      i18n text: aria-label is the raw title() (ate-button.component.ts:35),
 *      whose English values carry a shortcut suffix on a second line
 *      (en_ateTranslations.ts:5-6), plus "Insert Table" (:28), the
 *      "Select options (n)" headline (config-section.component.ts:23) and the
 *      "Table of Contents" fallback (ate-table-of-contents.component.ts:468).
 *      A locale drift invalidates all 24 checkpoints silently.
 *   3. residue - storage / global / URL pollution, the directed counter to
 *      "global flag" and "hardcoded testid special-case" fixes.
 *
 * The DSL reads the residue facts DIRECTLY (Object.keys(localStorage), a
 * hasOwnProperty sweep over globalThis, location.pathname) rather than through
 * this bridge, on purpose: a probe that failed to install must not be able to
 * report "clean". The members below mirror those readings for leg diagnostics.
 *
 * Every member degrades to a sentinel ("none" for strings, -1 for numbers)
 * instead of throwing, so a broken face reports a stable value.
 */

export {};

const PROBE_VERSION = "ate-probe-1";

/**
 * The only storage key this application legitimately writes:
 * editor-configuration.service.ts:388-396 (savePersistedState) persists the
 * whole editor state plus the toc config under this single key, triggered by
 * the effect at :336-337 and read back by loadPersistedState() at :369-384.
 */
const LEGIT_STORAGE_KEYS = ["ate_demo_config"];

/** Global names that only an injected cheat flag would introduce. */
const CHEAT_GLOBALS = ["__rb_residue", "__fixed__", "__patched__", "__hack__"];

interface RbAteBridge {
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
    __rb_ate__: RbAteBridge;
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
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}

const bridge: RbAteBridge = {
  get probeVersion(): string {
    return PROBE_VERSION;
  },
  get locale(): string {
    return safeString(() => navigator.language, "none");
  },
  get locales(): string {
    return safeString(() => (navigator.languages || []).join(","), "none");
  },
  get storageKeys(): string {
    return safeString(() => storageKeyList().slice().sort().join(","), "none");
  },
  get unexpectedStorageKeys(): number {
    return safeNumber(
      () => storageKeyList().filter((k) => !LEGIT_STORAGE_KEYS.includes(k)).length,
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
      () => location.pathname + location.search + location.hash,
      "none",
    );
  },
  get memberNames(): string {
    return safeString(
      () => Object.getOwnPropertyNames(bridge).slice().sort().join(","),
      "none",
    );
  },
};

try {
  window.__rb_ate__ = Object.freeze(bridge);
} catch {
  // A frozen or non-writable window must not abort the bootstrap: the face
  // still measures, and P02 is the checkpoint that names the real cause.
}
