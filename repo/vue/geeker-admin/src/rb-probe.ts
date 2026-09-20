// RepairBench measurement probe. INSTRUMENTATION ONLY: it is not part of the application, it renders
// nothing, it owns no state the application reads back as behaviour, and it changes no application code
// path. It exists because three things have to be true BEFORE the app boots or be measured from INSIDE
// the page, and a black-box driver can do neither:
//   1. offline auth seed - the router guard (src/routers/index.ts:65) redirects to /login whenever
//      useUserStore().token is empty, and that store is persisted to localStorage under "geeker-user"
//      (src/stores/modules/user.ts:28). Writing that one key before boot is what lets every measurement
//      start on an authenticated page with a single navigation instead of a login round-trip. The token
//      written here is not invented: it is the "admin 成功" access_token the seed itself records in
//      src/assets/mock/apifox/geeker.mock-expectations.json, and it is the same token that file's
//      "admin 菜单" / "admin 按钮" expectations are keyed on.
//   2. deterministic starting state - "geeker-global" and "geeker-tabs" are persisted too, so a value a
//      previous run left behind would override the store defaults this task measures. Both are removed at
//      boot so every run starts from the application's own defaults.
//   3. egress / crash accounting - the probe records every outbound url the page produces (fetch, XHR,
//     sendBeacon, window.open) and every uncaught error, so "nothing left the origin" and "nothing threw"
//     are measured facts rather than assumptions.
//
// Discipline: this file knows NOTHING about the defects under repair. It contains no selector, constant or
// expectation belonging to any single defect; it only publishes scalars about boot, storage, egress and
// errors, plus three structural readiness readings over class names the application itself defines
// (#app, .el-main, .card.table-main). Nothing here reads a clock or a random source into a RETURNED value.
// Every published member is a string, a number or a boolean so the verifier compares scalars only.

type RbGlobal = typeof globalThis & { __rb?: RbSurface };

const win = window as unknown as RbGlobal;

const PROBE_VERSION = "geeker-rb-probe-1";
// The admin access_token recorded by the seed's own mock expectations (login "admin 成功").
const OFFLINE_TOKEN = "bqddxxwqmfncffacvbpkuxvwvqrhln";
const USER_STORAGE_KEY = "geeker-user";
// Keys the seed persists through pinia-plugin-persistedstate (stores/modules/{user,global,tabs}.ts).
const RESET_KEYS = ["geeker-global", "geeker-tabs"];
// Opt-out for a leg that wants to measure the unauthenticated path (set before load).
const NOAUTH_FLAG = "rb-noauth";

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

// ---- 1 + 2. storage: seed the offline session, clear the two persisted ui stores ----
let seeded = false;
let noauth = false;
let storageWritable = false;
const boot = () => {
  noauth = safe(() => sessionStorage.getItem(NOAUTH_FLAG) !== null, false);
  storageWritable = safe(() => {
    const probeKey = "rb-probe-write-test";
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    return true;
  }, false);
  if (!storageWritable) return;
  for (const k of RESET_KEYS) safe(() => localStorage.removeItem(k), undefined);
  if (noauth) return;
  seeded = safe(() => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ token: OFFLINE_TOKEN, userInfo: { name: "Geeker" } }));
    return true;
  }, false);
};
boot();

// ---- 3a. egress accounting ----
const urls: string[] = [];
const openedTargets: string[] = [];

const absolute = (u: unknown): string => safe(() => new URL(String(u), window.location.href).href, String(u));
const isExternal = (u: string): boolean =>
  safe(() => new URL(u, window.location.href).origin !== window.location.origin, false);
const record = (u: unknown) => {
  const s = absolute(u);
  if (s && s.indexOf("data:") !== 0 && s.indexOf("blob:") !== 0) urls.push(s);
  return s;
};
const uniqueHosts = (): string[] => {
  const out: string[] = [];
  for (const u of urls) {
    if (!isExternal(u)) continue;
    const h = safe(() => new URL(u).host, "");
    if (h && out.indexOf(h) === -1) out.push(h);
  }
  return out;
};

const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
if (nativeFetch) {
  (window as any).fetch = function (input: any, init?: any) {
    record(typeof input === "string" ? input : input && input.url ? input.url : String(input));
    return nativeFetch(input, init);
  };
}

const xhrProto = XMLHttpRequest.prototype as any;
const nativeXhrOpen = xhrProto.open;
xhrProto.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: any[]): void {
  record(url);
  nativeXhrOpen.apply(this, [method, url, ...rest]);
};

const nav = navigator as any;
if (typeof nav.sendBeacon === "function") {
  const nativeBeacon = nav.sendBeacon.bind(nav);
  nav.sendBeacon = function (url: string, data?: any) {
    record(url);
    return nativeBeacon(url, data);
  };
}

// window.open is intercepted rather than performed: the seed calls it for isLink menu items
// (src/layouts/components/Menu/SubMenu.vue:30), which would both open a real tab the driver counts as a
// page and reach the internet. The target is recorded, so "an outbound navigation was attempted" stays
// measurable, and null is returned exactly as a blocked popup would. The native function is deliberately
// NOT kept callable: an offline verifier must have no path back to the network.
(window as any).open = function (target?: any): null {
  if (target !== undefined && target !== null) openedTargets.push(record(target));
  return null;
};

// ---- 3b. crash accounting ----
const errors: string[] = [];
window.addEventListener("error", (e: ErrorEvent) => {
  errors.push(String((e && (e.message || (e.error && e.error.message))) || "error"));
});
window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  const r: any = e && e.reason;
  errors.push("unhandledrejection: " + String((r && (r.message || r.msg)) || r || "unknown"));
});

// ---- published surface (scalars only) ----
const q = (sel: string): Element | null => document.querySelector(sel);
const qa = (sel: string): Element[] => Array.prototype.slice.call(document.querySelectorAll(sel));
const text = (el: Element | null): string => (el ? String(el.textContent || "").replace(/\s+/g, " ").trim() : "");
const isVisible = (el: Element | null): boolean => {
  if (!el) return false;
  const he = el as HTMLElement;
  if (he.style && he.style.display === "none") return false;
  return safe(() => window.getComputedStyle(he).display !== "none", false);
};

interface RbSurface {
  v: string;
  [k: string]: unknown;
}

const surface: RbSurface = {
  v: PROBE_VERSION,
  get seeded() {
    return seeded ? "true" : "false";
  },
  get noauth() {
    return noauth ? "true" : "false";
  },
  get storageWritable() {
    return storageWritable ? "true" : "false";
  },
  // #app has been mounted by vue (main.ts mount("#app"))
  get ready() {
    const app = q("#app");
    return app && app.childElementCount > 0 ? "true" : "false";
  },
  // the authenticated layout is on screen
  get layoutReady() {
    return q(".el-main") ? "true" : "false";
  },
  // the ProTable card of the page under measurement has rendered a table body
  get tableReady() {
    return q(".card.table-main .el-table__body-wrapper") ? "true" : "false";
  },
  get rows(): number {
    return qa(".card.table-main .el-table__body-wrapper tbody tr.el-table__row").length;
  },
  get netCount(): number {
    return urls.length;
  },
  get netExternal(): number {
    return urls.filter(isExternal).length;
  },
  get netAllSameOrigin() {
    return urls.every((u) => !isExternal(u)) ? "true" : "false";
  },
  get netHosts() {
    return uniqueHosts().sort().join(",");
  },
  get netUrls() {
    return urls.slice(0, 12).join(" | ");
  },
  get openedCount(): number {
    return openedTargets.length;
  },
  get openedTargets() {
    return openedTargets.slice(0, 8).join(" | ");
  },
  get errorCount(): number {
    return errors.length;
  },
  get errorText() {
    return errors.slice(0, 3).join(" | ").slice(0, 400);
  },
  get storageKeys() {
    return safe(() => Object.keys(localStorage).sort().join(","), "");
  },
  get storageCount(): number {
    return safe(() => Object.keys(localStorage).length, 0);
  },
  get hash() {
    return window.location.hash;
  }
};

Object.defineProperty(win, "__rb", { value: surface, writable: true, configurable: true, enumerable: true });

export {};
