// RepairBench environment adaptation: the OFFLINE, DETERMINISTIC stand-in for this seed's
// Rust/Tauri backend, installed before any application module can reach for it.
//
// The seed builds with `npm run build`, which leaves VITE_BACKEND unset, so src/lib/api.ts
// compiles `isWeb === false` and routes all 62 of its backend calls through
// `invoke()` from @tauri-apps/api/core -> `window.__TAURI_INTERNALS__.invoke(cmd, args, options)`
// (core.js:201-203, measured out of the pinned @tauri-apps/api@2.10.1 in the nm archive).
// Tauri plugin calls take the same road with a `plugin:<name>|<cmd>` command string
// (plugin-fs dist-js/index.js, plugin-dialog dist-js/index.js:85-188, both measured).
// In a plain browser that global is absent and every call rejects, so nothing loads.
//
// This module installs exactly the surface those three packages read:
//   window.__TAURI_INTERNALS__.{invoke, transformCallback, unregisterCallback, runCallback,
//                               callbacks, metadata, convertFileSrc}
//   window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener
// plus a same-shape fetch/XHR interceptor for the eleven runtime hosts measured in RECON §3.1.
//
// Discipline (RepairBench):
//   * it is installed at module scope, and src/main.tsx imports this file FIRST, so the stub is
//     in place before @/lib/api's lazy `await import('@tauri-apps/api/core')` can resolve;
//   * it answers, it never asserts: unknown commands resolve to null and are recorded, so a gap
//     shows up as a measurement instead of a crash;
//   * it writes NO application state and changes NO seed logic - every seed code path still runs
//     for real, it just talks to this stub instead of to Rust;
//   * no timestamps, no randomness: the record is ordinal only, so two runs are byte-identical;
//   * `window.__rbBackend` is the only global it adds, and src/rbProbe.ts (instrumentation)
//     re-publishes it read-only under `window.__rb` for the verifier.

import {
  RB_ALL_TAGS,
  RB_BATTERY_PAIRS,
  RB_BLANK_PNG_B64,
  RB_EMPTY_MAP_STYLE,
  RB_EQUIPMENT_NAMES,
  RB_FLIGHTS,
  RB_MAP_HOSTS,
  RB_NET_FIXTURES,
  RB_OVERVIEW,
  RB_PROFILES,
  RB_SETTINGS,
} from './rbFixtures';

/** One recorded IPC call. Ordinal only - no clock, no randomness. */
export interface RbIpcCall {
  seq: number;
  cmd: string;
  argKeys: string;
}

/** One file the application asked the (virtual) filesystem to write. */
export interface RbWrite {
  seq: number;
  path: string;
  bytes: number;
  text: string;
}

/** One intercepted cross-origin request. */
export interface RbNetCall {
  seq: number;
  host: string;
  url: string;
  via: string;
}

export interface RbBackendRecord {
  installed: boolean;
  ipc: RbIpcCall[];
  unknownCommands: string[];
  writes: RbWrite[];
  net: RbNetCall[];
  /** Count of requests that were allowed through to the real network (must stay 0). */
  passthrough: number;
  vfs: Record<string, string>;
  settings: Record<string, string>;
  reset: () => void;
}

const record: RbBackendRecord = {
  installed: false,
  ipc: [],
  unknownCommands: [],
  writes: [],
  net: [],
  passthrough: 0,
  vfs: {},
  settings: { ...RB_SETTINGS },
  reset() {
    record.ipc.length = 0;
    record.unknownCommands.length = 0;
    record.writes.length = 0;
    record.net.length = 0;
    record.passthrough = 0;
    record.vfs = {};
    record.settings = { ...RB_SETTINGS };
  },
};

/** Published for the verifier; the object itself is never re-created after install. */
export const rbBackendRecord: RbBackendRecord = record;

declare global {
  interface Window {
    __rbBackend?: RbBackendRecord;
    __TAURI_INTERNALS__?: {
      invoke: (cmd: string, args?: unknown, options?: unknown) => Promise<unknown>;
      transformCallback: (cb?: (payload: unknown) => void, once?: boolean) => number;
      unregisterCallback: (id: number) => void;
      runCallback: (id: number, payload: unknown) => void;
      callbacks: Record<number, (payload: unknown) => void>;
      metadata: { currentWindow: { label: string }; currentWebview: { label: string } };
      convertFileSrc: (filePath: string, protocol?: string) => string;
    };
    // NB: __TAURI_EVENT_PLUGIN_INTERNALS__ is intentionally NOT redeclared here -
    // @tauri-apps/api/event.d.ts:3 already declares it on Window as a REQUIRED member with
    // exactly { unregisterListener(event, eventId): void }, and a second, optional declaration
    // is a hard TS2687/TS2717 error under the seed's own `tsc` (build script = `tsc && vite build`).
  }
}

// ---------------------------------------------------------------------------
// virtual filesystem (plugin:fs)
// ---------------------------------------------------------------------------

const bytesToText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) return new TextDecoder().decode(value);
  if (Array.isArray(value)) return new TextDecoder().decode(Uint8Array.from(value as number[]));
  if (value instanceof ArrayBuffer) return new TextDecoder().decode(new Uint8Array(value));
  return '';
};

const textToBytes = (text: string): number[] => Array.from(new TextEncoder().encode(text));

/** plugin-fs passes the path in `options.headers.path`, URI-encoded (index.js:687-693). */
const headerPath = (options: unknown): string | null => {
  const headers = (options as { headers?: Record<string, string> } | undefined)?.headers;
  if (!headers || typeof headers.path !== 'string') return null;
  try {
    return decodeURIComponent(headers.path);
  } catch {
    return headers.path;
  }
};

const argPath = (args: unknown): string | null => {
  const p = (args as { path?: unknown } | undefined)?.path;
  return typeof p === 'string' ? p : null;
};

const pngBytes = (): number[] => {
  const bin = atob(RB_BLANK_PNG_B64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return Array.from(out);
};

// ---------------------------------------------------------------------------
// command dispatch
// ---------------------------------------------------------------------------

/** Deep-copy on the way out so an application mutation can never reach the fixture. */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function dispatch(cmd: string, args: unknown, options: unknown): unknown {
  switch (cmd) {
    // --- flight database -------------------------------------------------
    case 'get_flights':
      return clone(RB_FLIGHTS);
    case 'get_overview_stats':
      return clone(RB_OVERVIEW);
    case 'get_flight_data': {
      const id = Number((args as { flightId?: unknown })?.flightId);
      const flight = RB_FLIGHTS.find((f) => f.id === id) ?? RB_FLIGHTS[0];
      return clone({ flight, telemetry: { time: [], height: [], vpsHeight: [], speed: [], battery: [], batteryVoltage: [], batteryTemp: [], satellites: [], rcSignal: [], pitch: [], roll: [], yaw: [] }, track: [], messages: [] });
    }
    case 'get_battery_full_capacity_history':
      return [];
    case 'get_allowed_log_extensions':
      return ['txt', 'csv'];
    case 'compute_file_hash':
      return 'rbhash0000';
    case 'get_all_tags':
      return clone(RB_ALL_TAGS);
    case 'get_enabled_tag_types':
      return [];
    case 'get_smart_tags_enabled':
      return true;
    case 'set_smart_tags_enabled':
      return true;
    case 'get_battery_pairs':
      return clone(RB_BATTERY_PAIRS);
    case 'get_equipment_names':
      return clone(RB_EQUIPMENT_NAMES);
    case 'set_equipment_name':
      return true;

    // --- mutating database calls the verifier never triggers, answered so a
    //     stray click cannot reject and surface as an application crash -----
    case 'delete_flight':
    case 'delete_all_flights':
    case 'update_flight_name':
    case 'update_flight_notes':
    case 'update_flight_color':
    case 'add_flight_tag':
    case 'remove_flight_tag':
    case 'deduplicate_flights':
    case 'import_log':
    case 'import_log_bytes':
    case 'create_manual_flight':
    case 'regenerate_all_smart_tags':
    case 'remove_all_auto_tags':
    case 'regenerate_flight_smart_tags':
    case 'set_enabled_tag_types':
    case 'add_to_sync_blacklist':
    case 'remove_from_sync_blacklist':
    case 'clear_sync_blacklist':
    case 'log_sync_event':
      return true;

    // --- settings / profiles / session ------------------------------------
    case 'get_setting_value': {
      const key = String((args as { key?: unknown })?.key ?? '');
      return Object.prototype.hasOwnProperty.call(record.settings, key) ? record.settings[key] : null;
    }
    case 'set_setting_value': {
      const a = args as { key?: unknown; value?: unknown };
      record.settings[String(a?.key ?? '')] = String(a?.value ?? '');
      return true;
    }
    case 'list_profiles':
      return clone(RB_PROFILES);
    case 'get_active_profile':
      return 'default';
    case 'is_app_locked':
      return false;
    case 'switch_profile':
      return { success: true };
    case 'unlock_profile':
    case 'set_profile_password':
    case 'remove_profile_password':
    case 'delete_profile':
      return true;
    case 'get_auto_logout':
    case 'set_auto_logout':
      return false;
    case 'has_api_key':
      return false;
    case 'get_api_key_type':
      return 'none';
    case 'set_api_key':
    case 'remove_api_key':
      return true;
    case 'get_supporter_status':
      return false;
    case 'verify_supporter_code':
      return false;
    case 'remove_supporter_badge':
      return true;
    case 'get_donation_acknowledged':
      // true: the donation banner is a fixed overlay across the top of the shell and would
      // otherwise sit between the verifier and the stat cards on every single checkpoint.
      return true;
    case 'set_donation_acknowledged':
      return true;
    case 'get_app_data_dir':
      return '/rb/appdata';
    case 'get_app_log_dir':
      return '/rb/applog';
    case 'get_sync_blacklist':
      return [];
    case 'get_keep_upload_settings':
      return { enabled: false, folder_path: '' };
    case 'set_keep_upload_settings':
      return true;
    case 'export_backup_bytes':
      return textToBytes('{"rb":"backup"}');
    case 'import_backup':
    case 'import_backup_bytes':
      return 'rb-restored';
    case 'export_backup':
      return true;

    // --- Tauri plugins ----------------------------------------------------
    case 'plugin:event|listen':
    case 'plugin:event|unlisten':
      return 1;
    case 'plugin:log|log':
    case 'plugin:log|attach_console':
    case 'plugin:log|level_filter':
      return null;
    case 'plugin:dialog|save':
      return '/rb/exports/rb-export.txt';
    case 'plugin:dialog|open':
      return '/rb/exports';
    case 'plugin:dialog|message':
    case 'plugin:dialog|ask':
    case 'plugin:dialog|confirm':
      return true;
    case 'plugin:opener|open_url':
    case 'plugin:opener|open_path':
    case 'plugin:shell|open':
      return null;
    case 'plugin:fs|write_text_file':
    case 'plugin:fs|write_file': {
      const p = headerPath(options) ?? argPath(args) ?? '/rb/unknown';
      const text = bytesToText(args);
      record.vfs[p] = text;
      record.writes.push({ seq: record.writes.length + 1, path: p, bytes: text.length, text });
      return null;
    }
    case 'plugin:fs|read_text_file': {
      const p = argPath(args) ?? headerPath(options) ?? '';
      return textToBytes(Object.prototype.hasOwnProperty.call(record.vfs, p) ? record.vfs[p] : '');
    }
    case 'plugin:fs|read_file': {
      const p = argPath(args) ?? headerPath(options) ?? '';
      return Object.prototype.hasOwnProperty.call(record.vfs, p) ? textToBytes(record.vfs[p]) : pngBytes();
    }
    case 'plugin:fs|remove': {
      const p = argPath(args) ?? headerPath(options) ?? '';
      delete record.vfs[p];
      return null;
    }
    case 'plugin:fs|exists': {
      const p = argPath(args) ?? headerPath(options) ?? '';
      return Object.prototype.hasOwnProperty.call(record.vfs, p);
    }
    case 'plugin:fs|mkdir':
    case 'plugin:fs|rename':
    case 'plugin:fs|copy_file':
    case 'plugin:fs|truncate':
      return null;
    case 'plugin:fs|read_dir':
      return [];
    case 'plugin:fs|stat':
    case 'plugin:fs|lstat':
    case 'plugin:fs|fstat':
      return { isFile: true, isDirectory: false, size: 0, mtime: 0, atime: 0, birthtime: 0 };
    case 'plugin:path|resolve_directory':
      return '/rb/appdata';
    case 'plugin:path|join': {
      const parts = (args as { paths?: unknown[] })?.paths;
      return Array.isArray(parts) ? parts.map((p) => String(p)).join('/') : '/rb';
    }
    case 'plugin:window|internal_on_mousemove':
    case 'plugin:window|internal_on_mousedown':
      return null;
    case 'plugin:app|version':
      // flightStore.ts:1096-1099 calls getVersion() and only falls back to the vite-injected
      // __APP_VERSION__ when it throws. Answering with the SAME literal the build injects
      // (vite.config.ts:18 -> pkg.version) keeps `updateStatus` on 'latest' against the pinned
      // RB_NET_FIXTURES github tag, so no update banner ever sits over the stat cards - and it
      // closes the only `unknownCommands` entry measured by the 14:58 census leg.
      return '3.3.0';
    case 'plugin:app|name':
      return 'open-dronelog';
    case 'plugin:app|tauri_version':
      return '2.0.0';
    default:
      if (!record.unknownCommands.includes(cmd)) record.unknownCommands.push(cmd);
      return null;
  }
}

// ---------------------------------------------------------------------------
// network interception (RECON §3.1: 11 runtime hosts)
// ---------------------------------------------------------------------------

const hostOf = (url: string): string => {
  try {
    return new URL(url, location.href).hostname;
  } catch {
    return '';
  }
};

/** null => not ours, let the real network handle it. */
function netFixture(url: string): { status: number; type: string; body: string } | null {
  const host = hostOf(url);
  if (!host || host === location.hostname) return null;
  const fix = RB_NET_FIXTURES[host];
  if (fix) return fix;
  if (host === 'fonts.googleapis.com') return { status: 200, type: 'text/css', body: '/* rb offline font stub */' };
  if (host === 'fonts.gstatic.com') return { status: 200, type: 'font/woff2', body: '' };
  if (RB_MAP_HOSTS.includes(host)) {
    if (/\.png(\?|$)/i.test(url) || /\/tile\//i.test(url)) return { status: 200, type: 'image/png', body: RB_BLANK_PNG_B64 };
    if (/\.pbf(\?|$)/i.test(url)) return { status: 200, type: 'application/x-protobuf', body: '' };
    if (/tiles\.json(\?|$)/i.test(url)) {
      return { status: 200, type: 'application/json', body: JSON.stringify({ tilejson: '2.2.0', name: 'rb-terrain', tiles: [], minzoom: 0, maxzoom: 0, bounds: [0, 0, 0, 0] }) };
    }
    return { status: 200, type: 'application/json', body: RB_EMPTY_MAP_STYLE };
  }
  return null;
}

function installNetStub(): void {
  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const host = hostOf(url);
    const fix = netFixture(url);
    if (!fix) {
      if (host && host !== location.hostname) record.passthrough += 1;
      return originalFetch(input as RequestInfo, init);
    }
    record.net.push({ seq: record.net.length + 1, host, url, via: 'fetch' });
    return Promise.resolve(new Response(fix.body, { status: fix.status, headers: { 'Content-Type': fix.type } }));
  }) as unknown as typeof window.fetch;

  const OriginalXHR = window.XMLHttpRequest;
  const PatchedXHR = function (this: XMLHttpRequest) {
    const xhr = new OriginalXHR();
    let stubbed: { status: number; type: string; body: string } | null = null;
    let stubUrl = '';
    const proxy = xhr as unknown as Record<string, unknown>;
    const originalOpen = xhr.open.bind(xhr);
    proxy.open = ((method: string, url: string, ...rest: unknown[]) => {
      stubUrl = String(url);
      stubbed = netFixture(stubUrl);
      if (stubbed) {
        record.net.push({ seq: record.net.length + 1, host: hostOf(stubUrl), url: stubUrl, via: 'xhr' });
        return undefined;
      }
      return (originalOpen as (m: string, u: string, ...r: unknown[]) => void)(method, url, ...rest);
    }) as unknown as typeof xhr.open;
    const originalSend = xhr.send.bind(xhr);
    proxy.send = ((body?: Document | XMLHttpRequestBodyInit | null) => {
      if (!stubbed) return originalSend(body);
      const s = stubbed;
      Object.defineProperty(xhr, 'readyState', { get: () => 4, configurable: true });
      Object.defineProperty(xhr, 'status', { get: () => s.status, configurable: true });
      Object.defineProperty(xhr, 'responseText', { get: () => s.body, configurable: true });
      Object.defineProperty(xhr, 'response', { get: () => s.body, configurable: true });
      setTimeout(() => {
        xhr.dispatchEvent(new Event('readystatechange'));
        xhr.dispatchEvent(new ProgressEvent('load'));
        xhr.dispatchEvent(new ProgressEvent('loadend'));
      }, 0);
      return undefined;
    }) as unknown as typeof xhr.send;
    return proxy as unknown as XMLHttpRequest;
  } as unknown as typeof XMLHttpRequest;
  PatchedXHR.prototype = OriginalXHR.prototype;
  window.XMLHttpRequest = PatchedXHR;
}

// ---------------------------------------------------------------------------
// install
// ---------------------------------------------------------------------------

function installTauriInternals(): void {
  const callbacks: Record<number, (payload: unknown) => void> = {};
  let nextCallbackId = 1;
  let nextSeq = 1;

  const argKeysOf = (args: unknown): string => {
    if (args === null || args === undefined) return '';
    if (Array.isArray(args)) return '[array:' + args.length + ']';
    if (args instanceof Uint8Array) return '[bytes:' + args.byteLength + ']';
    if (typeof args !== 'object') return '[' + typeof args + ']';
    return Object.keys(args as Record<string, unknown>).sort().join(',');
  };

  window.__TAURI_INTERNALS__ = {
    invoke: (cmd: string, args?: unknown, options?: unknown) => {
      record.ipc.push({ seq: nextSeq++, cmd: String(cmd), argKeys: argKeysOf(args) });
      try {
        return Promise.resolve(dispatch(String(cmd), args, options));
      } catch (e) {
        return Promise.reject(e);
      }
    },
    transformCallback: (cb?: (payload: unknown) => void) => {
      const id = nextCallbackId++;
      if (cb) callbacks[id] = cb;
      return id;
    },
    unregisterCallback: (id: number) => {
      delete callbacks[id];
    },
    runCallback: (id: number, payload: unknown) => {
      const cb = callbacks[id];
      if (cb) cb(payload);
    },
    callbacks,
    metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main' } },
    convertFileSrc: (filePath: string) => 'file://' + String(filePath),
  };

  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
    unregisterListener: () => {
      /* no-op: the stub never emits backend-originated events */
    },
  };
}

export function installRbBackend(): void {
  if (record.installed) return;
  record.installed = true;
  installTauriInternals();
  try {
    installNetStub();
  } catch {
    // A failed network shim must never take the application down with it: the IPC stub above is
    // the load-bearing half, and every host this shim covers is also unreachable-by-design.
  }
  if (typeof window !== 'undefined') window.__rbBackend = record;
}

// Installed at module scope: src/main.tsx imports this file as its very first import, so the
// stub is guaranteed to exist before any lazily-imported @tauri-apps/* module resolves.
if (typeof window !== 'undefined') installRbBackend();
