// RepairBench measurement probe for repair-vue__ocular-01 - INSTRUMENTATION ONLY.
// Shipped by environment/instrumentation.patch together with one import as the FIRST line of
// src/main.ts, so every wrapper below is installed before any application module body runs (in
// particular before src/i18n/index.ts:89 executes its top-level `await changeLocale(...)`, whose
// :73 `fetch(url)` is the one same-origin request this probe is expected to see).
//
// WHAT IT PUBLISHES (window.__rb, every value a STRING scalar):
//   version         the probe's own version literal, asserted by tests/dsl.json P01 so a stale or
//                   absent instrumentation can never turn a sentinel into a 'no-probe' pass.
//   ready           'true' once the synchronous boot sequence finished (storage reset, error
//                   listeners, four request wrappers installed, __rb published). The service-worker
//                   cleanup below is deliberately fire-and-forget and is NOT part of this flag.
//   frameReady      'true' once #app has at least one child element (the app shell really mounted).
//   navLang         navigator.language captured at boot, before any module could change the locale.
//   egressCount     number of requests whose url resolves to an origin other than the served one.
//   egressHosts     the distinct external hosts seen, comma-joined and sorted ('' when none).
//   sameOriginCount number of same-origin requests seen - the positive control that proves the
//                   wrappers are actually counting, i.e. that egressCount 0 is a measurement.
//   errorCount      window 'error' + 'unhandledrejection' events. console.* is NOT hooked on
//                   purpose: the seed's own harness ignores /intlify/ output
//                   (test/utils/assertNoErrors.ts:4), so vue-i18n's legitimate missing-key warnings
//                   would otherwise redden a sentinel no defect owns.
//   controlled      'true' when a service worker controls this document (asserted 'false' by P02).
//
// NEUTRALITY: it renders nothing, adds no data-testid, holds no selector / constant / expectation
// belonging to any of the 12 defects, never writes application state and never reads the store.
// The only mutation it performs is on the browser's own storage and service-worker registrations,
// to start every measurement from a clean slate.
//
// TYPE SAFETY: `pnpm run build` == `vue-tsc -b && vite build` (package.json:16) and
// tsconfig.app.json includes src/**/*.ts with strict + noUnusedLocals + noUnusedParameters +
// erasableSyntaxOnly + verbatimModuleSyntax, so this file is type-checked as part of the build.
// It therefore uses only erasable syntax (no enum / namespace / parameter property), no unused
// binding, and confines every untyped browser surface behind one `Record<string, any>` alias.
//

const g = globalThis as unknown as Record<string, any>;

const ORIGIN: string = typeof location === 'undefined' ? '' : String(location.origin ?? '');
const BOOT_NAV_LANGUAGE: string = typeof navigator === 'undefined' ? '' : String(navigator.language ?? '');

let egressCount = 0;
let sameOriginCount = 0;
let errorCount = 0;
let bootComplete = false;
const egressHosts: Set<string> = new Set<string>();

// Resolve whatever a caller handed us (string url, URL, Request) onto an absolute href, or '' when
// it cannot be resolved. Never throws: a probe that throws would break the page it measures.
const hrefOf = (input: unknown): string => {
  try {
    if (typeof input === 'string') {
      if (!input) return '';
      if (/^(?:https?:)?\/\//i.test(input)) {
        return input.startsWith('//') ? String(typeof location === 'undefined' ? 'http:' : location.protocol) + input : input;
      }
      if (/^[a-z][a-z0-9+.\-]*:/i.test(input)) return input;
      return ORIGIN ? new URL(input, ORIGIN).href : '';
    }
    const candidate = input as { url?: unknown } | null | undefined;
    const nested = candidate && typeof candidate.url === 'string' ? candidate.url : '';
    return nested ? hrefOf(nested) : '';
  } catch {
    return '';
  }
};

const IGNORED_SCHEME = /^(?:data|blob|about|javascript|file):/i;

const tally = (input: unknown): void => {
  const href = hrefOf(input);
  if (!href || IGNORED_SCHEME.test(href)) return;
  if (!/^https?:\/\//i.test(href)) {
    sameOriginCount += 1;
    return;
  }
  if (ORIGIN && href.startsWith(ORIGIN)) {
    sameOriginCount += 1;
    return;
  }
  egressCount += 1;
  try {
    egressHosts.add(new URL(href).host);
  } catch {
    egressHosts.add('unparseable');
  }
};

// --- request wrappers (fetch / XHR.open / sendBeacon / window.open) ---
const wrapFetch = (): void => {
  const original = g.fetch;
  if (typeof original !== 'function') return;
  g.fetch = function patchedFetch(input: unknown, init?: unknown): unknown {
    tally(input);
    return original.call(g, input, init);
  };
};

const wrapXhr = (): void => {
  const ctor = g.XMLHttpRequest;
  if (!ctor || !ctor.prototype || typeof ctor.prototype.open !== 'function') return;
  const original = ctor.prototype.open;
  ctor.prototype.open = function patchedOpen(this: unknown, method: unknown, url: unknown, ...rest: unknown[]): unknown {
    tally(url);
    return original.apply(this, [method, url, ...rest]);
  };
};

const wrapSendBeacon = (): void => {
  const nav = g.navigator;
  if (!nav || typeof nav.sendBeacon !== 'function') return;
  const original = nav.sendBeacon.bind(nav);
  nav.sendBeacon = (url: unknown, data?: unknown): unknown => {
    tally(url);
    return original(url, data);
  };
};

const wrapWindowOpen = (): void => {
  const original = g.open;
  if (typeof original !== 'function') return;
  g.open = (url?: unknown, ...rest: unknown[]): unknown => {
    if (url) tally(url);
    return original.apply(g, [url, ...rest]);
  };
};

// --- crash sentinels (window-level only, console.* deliberately untouched) ---
const watchErrors = (): void => {
  if (typeof g.addEventListener !== 'function') return;
  g.addEventListener('error', () => {
    errorCount += 1;
  });
  g.addEventListener('unhandledrejection', () => {
    errorCount += 1;
  });
};

// --- clean slate: storage reset + defensive service-worker / cache cleanup ---
const resetStorage = (): void => {
  try {
    g.localStorage?.clear();
  } catch {
    /* opaque origin or disabled storage - nothing to reset */
  }
  try {
    g.sessionStorage?.clear();
  } catch {
    /* opaque origin or disabled storage - nothing to reset */
  }
};

const dropServiceWorkers = (): void => {
  try {
    const sw = g.navigator?.serviceWorker;
    if (sw && typeof sw.getRegistrations === 'function') {
      void Promise.resolve(sw.getRegistrations())
        .then((registrations: { unregister?: () => unknown }[]) => {
          for (const registration of registrations || []) {
            try {
              registration.unregister?.();
            } catch {
              /* ignore a single failed unregistration */
            }
          }
        })
        .catch(() => {
          /* service workers unsupported or blocked */
        });
    }
  } catch {
    /* service workers unsupported or blocked */
  }
  try {
    const cachesRef = g.caches;
    if (cachesRef && typeof cachesRef.keys === 'function') {
      void Promise.resolve(cachesRef.keys())
        .then((keys: string[]) => {
          for (const key of keys || []) {
            try {
              void cachesRef.delete(key);
            } catch {
              /* ignore a single failed delete */
            }
          }
        })
        .catch(() => {
          /* Cache Storage unsupported */
        });
    }
  } catch {
    /* Cache Storage unsupported */
  }
};

const probe = {
  get version(): string {
    return 'ocular-rb-probe-1';
  },
  get ready(): string {
    return bootComplete ? 'true' : 'false';
  },
  get frameReady(): string {
    try {
      const host = g.document?.getElementById?.('app');
      return host && Number(host.childElementCount) > 0 ? 'true' : 'false';
    } catch {
      return 'ERR';
    }
  },
  get navLang(): string {
    return BOOT_NAV_LANGUAGE;
  },
  get egressCount(): string {
    return String(egressCount);
  },
  get egressHosts(): string {
    return [...egressHosts].sort().join(',');
  },
  get sameOriginCount(): string {
    return String(sameOriginCount);
  },
  get errorCount(): string {
    return String(errorCount);
  },
  get controlled(): string {
    try {
      return g.navigator?.serviceWorker?.controller ? 'true' : 'false';
    } catch {
      return 'ERR';
    }
  }
};

watchErrors();
resetStorage();
dropServiceWorkers();
wrapFetch();
wrapXhr();
wrapSendBeacon();
wrapWindowOpen();
g.__rb = probe;
bootComplete = true;

export {};
