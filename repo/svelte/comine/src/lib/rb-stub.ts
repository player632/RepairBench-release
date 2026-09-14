/**
 * INSTRUMENTATION (repair-bench, environment/instrumentation.patch) - browser-side
 * answers for the seed's native (Tauri) bridge, plus a deterministic pin for the two
 * platform entropy sources the bundle reaches for.
 *
 * WHY THIS EXISTS. comine is a Tauri 2 desktop app: every backend capability is an
 * `invoke()` over `window.__TAURI_INTERNALS__`, which does not exist in a plain browser
 * context. Without answers here, `getCurrentWindow()` in src/routes/+layout.svelte:294
 * throws synchronously inside onMount, so initSettings / queue.init / the dependency
 * check / the update check / the remote-defaults sync never run at all and the window
 * stays behind its splash screen. The seed ships no browser harness of its own.
 *
 * WHAT IT DOES *NOT* DO. No application code path is rewritten, short-circuited or
 * special-cased: the seed's own `invoke` call sites run unchanged and simply receive
 * canned answers, which is exactly what the upstream `@tauri-apps/api/mocks` module is
 * published for ("This function can be used when testing tauri frontend applications or
 * when running the frontend in a Node.js context during static site generation").
 * Every answer below is a CONSTANT - no clock, no randomness, no I/O - so the boot
 * sequence is byte-identical from run to run.
 *
 * The fixtures model an idle, fully provisioned desktop session: all seven optional
 * components reported installed (so deps.autoInstallBundle() finds nothing missing and
 * raises no progress toast), an empty job queue and an empty history (so no thumbnail,
 * no media-colour extraction and no external image request is ever queued), no pending
 * update, no broadcasts, plenty of disk (so the low-disk warning stays down) and an
 * empty settings store (so `Store.get` answers "does not exist" and initSettings keeps
 * the seed's own `defaultSettings` verbatim, which is what makes every settings-derived
 * reading reproducible).
 */
import { mockConvertFileSrc, mockIPC, mockWindows } from '@tauri-apps/api/mocks';

const ipcLog: string[] = [];
let installed = false;

/**
 * Error / unhandledrejection / console.error traps.
 *
 * WHY THEY LIVE IN THIS FILE AND NOT IN rb-probe.ts - a MEASURED correction (leg COM4, 2026-09-08).
 * rb-probe.ts imports the application's own stores and helpers, and ES module imports are hoisted, so every
 * app module it reaches is evaluated BEFORE a single statement in the importing module runs. Installing the
 * bridge from src/routes/+layout.ts therefore let application import-time side effects reach
 * `window.__TAURI_INTERNALS__` while it was still undefined - src/lib/stores/logs.ts:123-125 calls
 * initLogging() as soon as the log store is created, and initLogging() immediately awaits
 * invoke('get_log_file_path'). The first four-state leg measured the consequence on ALL FOUR faces: one
 * unhandled rejection ("Cannot read properties of undefined (reading 'transformCallback')"), one caught
 * warning ("Failed to initialize file logging: TypeError: Cannot read properties of undefined (reading
 * 'invoke')"), and P01/P20 permanently red on `rejectionCount() === 0`.
 *
 * This file imports nothing from $lib - only @tauri-apps/api/mocks - so it can be installed from
 * src/hooks.client.ts, the earliest client-side module SvelteKit evaluates, which puts the bridge answers in
 * place before any application module runs. The traps move with it deliberately: a trap that is installed
 * after the boot it is supposed to watch reports a clean boot it never observed, and a zero below must mean
 * "nothing failed", never "nothing was listening yet".
 */
const pageErrors: string[] = [];
const pageRejections: string[] = [];
const consoleErrors: string[] = [];
let trapsInstalled = false;

function installTraps(): void {
  if (trapsInstalled) return;
  trapsInstalled = true;
  window.addEventListener('error', (event: ErrorEvent) => {
    pageErrors.push(String((event && (event.message || (event.error && event.error.message))) || 'error'));
  });
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason: unknown = event && event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    pageRejections.push(message || 'rejection');
  });
  const realError = console.error.bind(console);
  console.error = (...args: unknown[]): void => {
    consoleErrors.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '));
    realError(...args);
  };
}

/**
 * Live views of the trap arrays for rb-probe.ts. Deliberately NOT copies: a failure that lands after the
 * probe module loaded still has to be counted by the next read.
 */
export function rbPageErrors(): string[] {
  return pageErrors;
}

export function rbPageRejections(): string[] {
  return pageRejections;
}

export function rbConsoleErrors(): string[] {
  return consoleErrors;
}

/** src/lib/bindings/DependencyStatus.ts, one fixed shape for all seven components. */
function dependencyStatus(version: string, path: string): unknown {
  return {
    installed: true,
    version,
    path,
    updateAvailable: null,
    diskSize: 42000000,
  };
}

/** src/lib/bindings/DiskSpaceInfo.ts - half a terabyte free, far above the warning floor. */
const DISK_SPACE = {
  availableBytes: 536870912000,
  totalBytes: 1073741824000,
  availableGb: 500,
  totalGb: 1000,
  usedPercent: 50,
};

/** src/lib/bindings/UpdateCheckResult.ts - nothing pending, so no update notification. */
const UPDATE_CHECK = {
  available: false,
  version: null,
  body: null,
  date: null,
  download_url: null,
  is_prerelease: false,
};

/** src/lib/bindings/HistoryStats.ts over an empty history. */
const HISTORY_STATS = {
  totalDownloads: 0,
  totalSize: 0,
  totalDuration: 0,
  formatCounts: {},
  favouritesCount: 0,
};

const DEPENDENCY_VERSIONS: Record<string, [string, string]> = {
  check_ytdlp: ['2026.03.15', '/usr/local/bin/yt-dlp'],
  check_ffmpeg: ['7.1.1', '/usr/local/bin/ffmpeg'],
  check_aria2: ['1.37.0', '/usr/local/bin/aria2c'],
  check_deno: ['2.2.3', '/usr/local/bin/deno'],
  check_quickjs: ['0.9.1', '/usr/local/bin/quickjs'],
  check_lux: ['0.24.1', '/usr/local/bin/lux'],
  check_gallery_dl: ['1.28.2', '/usr/local/bin/gallery-dl'],
};

/**
 * One deterministic answer per command the seed can issue during boot and during the
 * measured interactions. Anything unlisted resolves to null, which every call site in
 * the seed already handles (they are all wrapped in try/catch or optional-chained).
 */
function answer(cmd: string): unknown {
  if (cmd in DEPENDENCY_VERSIONS) {
    const entry = DEPENDENCY_VERSIONS[cmd];
    return dependencyStatus(entry[0], entry[1]);
  }
  switch (cmd) {
    // @tauri-apps/plugin-store: `load` hands back a resource id, `get` a [value, exists]
    // tuple. exists=false makes Store.get resolve to undefined, so initSettings falls
    // back to defaultSettings for every key instead of merging a stored profile.
    case 'plugin:store|load':
      return 1;
    case 'plugin:store|get_store':
      return null;
    case 'plugin:store|get':
      return [null, false];
    case 'plugin:store|has':
      return false;
    case 'plugin:store|keys':
    case 'plugin:store|values':
    case 'plugin:store|entries':
      return [];
    case 'plugin:store|length':
      return 0;
    case 'plugin:store|set':
    case 'plugin:store|save':
    case 'plugin:store|clear':
    case 'plugin:store|reset':
    case 'plugin:store|reload':
      return null;
    case 'plugin:store|delete':
      return false;

    case 'plugin:log|log':
      return null;
    case 'plugin:notification|is_permission_granted':
      return false;
    case 'plugin:notification|request_permission':
      return 'denied';
    case 'plugin:clipboard-manager|read_text':
      return null;

    // queue / history / system state: an idle session with nothing in flight
    case 'get_jobs':
    case 'get_history':
    case 'fetch_broadcasts':
    case 'read_session_logs':
      return [];
    case 'get_history_stats':
      return HISTORY_STATS;
    case 'get_disk_space':
      return DISK_SPACE;
    case 'check_for_update':
      return UPDATE_CHECK;
    case 'server_is_running':
      return true;

    // thumbnail colour extraction: no item is ever enqueued during measurement, so these
    // are reachable only if a candidate fix drives them by hand. Fixed tuple, fixed answer.
    case 'get_cached_thumbnail_color':
      return null;
    case 'extract_thumbnail_color':
    case 'extract_local_thumbnail_color':
      return [14, 165, 233];

    default:
      return null;
  }
}

/**
 * Deterministic pins for the bundle's two platform entropy sources. Neither feeds any
 * measured observable (they only name skeleton-shimmer widths, clip-range element ids and
 * queue/history/conversion/notification ids), so pinning them cannot mask or manufacture a
 * symptom - it removes run-to-run noise from the page the measurements are read off.
 * `crypto.getRandomValues` is deliberately left ALONE: @tauri-apps/api/mocks uses it to
 * allocate IPC callback ids and rewriting it would break the bridge this file installs.
 */
function pinEntropy(): void {
  let state = 0x9e3779b9;
  const nextRandom = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Math.random = nextRandom;

  const w = window as unknown as { crypto?: Crypto };
  const real = w.crypto;
  if (real && typeof real.randomUUID === 'function') {
    let counter = 0;
    const hex = (value: number, width: number): string => value.toString(16).padStart(width, '0');
    Object.defineProperty(real, 'randomUUID', {
      configurable: true,
      writable: true,
      value: (): string => {
        counter += 1;
        return (
          '00000000-0000-4000-8000-' + hex(counter, 12)
        );
      },
    });
  }
}

/**
 * Installs the bridge answers. Idempotent, and a no-op outside a browser context so the
 * SvelteKit build (which evaluates route modules in Node during `svelte-kit sync`) is
 * unaffected. Returns true when the stub is live.
 */
export function installRbStub(): boolean {
  if (installed) return true;
  if (typeof window === 'undefined') return false;
  installed = true;
  // Traps first: everything below, and every application module that loads afterwards, is then observed.
  installTraps();
  pinEntropy();
  mockWindows('main');
  mockConvertFileSrc('windows');
  mockIPC(
    (cmd: string) => {
      ipcLog.push(cmd);
      return answer(cmd);
    },
    { shouldMockEvents: true }
  );
  return true;
}

/** Command names the seed has invoked through the bridge since the stub went live. */
export function rbIpcLog(): string[] {
  return ipcLog.slice();
}

/** True once installRbStub() has answered the bridge for this document. */
export function rbStubInstalled(): boolean {
  return installed;
}
