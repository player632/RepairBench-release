// RepairBench measurement probe for repair-vue__ayanami-01 - INSTRUMENTATION ONLY.
// Shipped by environment/instrumentation.patch together with one side-effect import as the FIRST line of
// src/main.ts, so every wrapper below is installed before any application module body runs. That ordering
// matters twice on this seed: (1) src/store/canvas.ts:14 imports "@/worker?worker" and :90 constructs the
// canvas worker inside initOffScreenCanvas, which is reached from Canvas.vue:31-38 onMounted - the probe is
// already publishing by then; (2) all SEVEN useLocalStorage call sites over six files (src/store/colorPicker.ts:24
// and :29, src/components/Toolbar/Toolbar.vue:22, src/components/Toolbar/FpsRange.vue:9,
// src/components/Toolbar/PixelSizeRange.vue:12, src/components/ColorPicker/index.vue:17 and
// src/components/ColorPicker/Palette.vue:22) read at component-setup time, i.e. after the storage reset below,
// so every measurement starts from the seed's own defaults (src/constants/index.ts:14-34) and never from a
// previous run's residue.
//
// WHAT IT PUBLISHES (window.__rb, every value a STRING scalar - the dsl runner compares js_eval asserts
// loosely against a string `expected`, so a non-scalar would be permanently false):
//   version              the probe's own version literal, asserted by tests/dsl.json P01 so a stale or
//                        absent instrumentation can never turn a sentinel into a 'no-probe' pass.
//   ready                'true' once the synchronous boot sequence finished (storage reset, error
//                        listeners, four request wrappers installed, __rb published). The service-worker
//                        and cache cleanup below is deliberately fire-and-forget and NOT part of this flag.
//   frameReady           'true' once #app has at least one child element (the app shell really mounted).
//   navLang              navigator.language captured at boot, before any module could change the locale.
//   egressCount          script-initiated requests (fetch / XHR.open / sendBeacon / window.open) whose url
//                        resolves to an origin other than the served one.
//   egressHosts          the distinct external hosts seen through those wrappers, comma-joined and sorted.
//   sameOriginCount      script-initiated same-origin requests - one half of the positive control.
//   resourceEgressCount  SUBRESOURCE loads (script / link / img / font / worker / xhr) from
//                        performance.getEntriesByType('resource') whose url is cross-origin. This seed does
//                        ALL of its loading through the parser and through Vite's emitted asset urls rather
//                        than through fetch, so this is the leg that actually measures its external face.
//   resourceHosts        the distinct external hosts among those entries, comma-joined and sorted.
//   resourceCount        total resource-timing entries seen - the other half of the positive control, and
//                        the reason 'egressCount 0' is a measurement rather than a vacuous pass: a page that
//                        loaded nothing would also show 0 egress, so P01 requires this to be non-zero.
//   wrapped              how many of the four script-level wrappers were really installed ('4' when all of
//                        them were), so an environment without sendBeacon cannot silently weaken P01.
//   errorCount           window 'error' + 'unhandledrejection' events. console.* is NOT hooked on purpose,
//                        and the listener is registered in the BUBBLE phase only: index.html:6 ships a dead
//                        <link href="/src/styles.css"> that 404s in dev and against the built dist alike,
//                        and a resource load failure fires a non-bubbling 'error' on the LINK element, so
//                        that seed-owned 404 is registered as a decoy (instruction.md item 8) and guarded by
//                        P20/P21 instead of being allowed to redden a sentinel no defect owns.
//   controlled           'true' when a service worker controls this document (asserted 'false' by P02).
//
// NEUTRALITY: it renders nothing, adds no data-testid, creates no element, holds no selector / constant /
// expectation belonging to any of the 12 defects, never reads the pinia stores or the alien-signals worker
// state and never writes application state. The only mutation it performs is on the browser's own storage
// and service-worker registrations, to start every measurement from a clean slate.
//
// TYPE SAFETY: package.json:8 "build" == "vue-tsc -b && vite build" and tsconfig.app.json:26 includes
// src/**/*.ts with strict + noUnusedLocals + noUnusedParameters (:17-19), so this file IS type-checked as
// part of the build. It therefore declares every binding it uses, confines each untyped browser surface
// behind one `Record<string, any>` alias, keeps every DOM API behind a feature test and a try/catch, and
// returns a string from all thirteen getters. STATUS of that argument: DECLARED_NOT_MEASURED - the gate
// clone has no node_modules and this seat ran 0 install / 0 build / 0 network, so vue-tsc was never
// executed here; it was validated only by importing this file under node 24 type-stripping.

const g = globalThis as unknown as Record<string, any>;

const ORIGIN: string = typeof location === 'undefined' ? '' : String(location.origin ?? '');
const BOOT_NAV_LANGUAGE: string = typeof navigator === 'undefined' ? '' : String(navigator.language ?? '');

let egressCount = 0;
let sameOriginCount = 0;
let errorCount = 0;
let wrapped = 0;
let bootComplete = false;
const egressHosts: Set<string> = new Set<string>();

// Resolve whatever a caller handed us (string url, URL, Request) onto an absolute href, or '' when it
// cannot be resolved. Never throws: a probe that throws would break the page it measures.
const hrefOf = (input: unknown): string => {
  try {
    if (typeof input === 'string') {
      if (!input) return '';
      if (/^(?:https?:)?\/\//i.test(input)) {
        return input.startsWith('//')
          ? String(typeof location === 'undefined' ? 'http:' : location.protocol) + input
          : input;
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

const tallyHref = (href: string): void => {
  if (!href || IGNORED_SCHEME.test(href)) return;
  let external = false;
  try {
    external = /^https?:\/\//i.test(href) && (!ORIGIN || new URL(href).origin !== ORIGIN);
  } catch {
    external = false;
  }
  if (!external) return;
  egressCount += 1;
  try {
    egressHosts.add(new URL(href).host);
  } catch {
    egressHosts.add(href);
  }
};

const tally = (input: unknown): void => {
  const href = hrefOf(input);
  if (!href || IGNORED_SCHEME.test(href)) return;
  if (!/^https?:\/\//i.test(href)) {
    sameOriginCount += 1;
    return;
  }
  if (ORIGIN) {
    try {
      if (new URL(href).origin === ORIGIN) {
        sameOriginCount += 1;
        return;
      }
    } catch {
      /* unresolvable absolute url - fall through and count it as external */
    }
  }
  tallyHref(href);
};

// --- script-level request wrappers (fetch / XHR.open / sendBeacon / window.open) ---
const wrapFetch = (): void => {
  const original = g.fetch;
  if (typeof original !== 'function') return;
  const bound = original.bind(g);
  g.fetch = function patchedFetch(input: unknown, init?: unknown): unknown {
    tally(input);
    return bound(input, init);
  };
  wrapped += 1;
};

const wrapXhr = (): void => {
  const ctor = g.XMLHttpRequest;
  if (!ctor || !ctor.prototype || typeof ctor.prototype.open !== 'function') return;
  const original = ctor.prototype.open;
  ctor.prototype.open = function patchedOpen(
    this: unknown,
    method: unknown,
    url: unknown,
    ...rest: unknown[]
  ): unknown {
    tally(url);
    return original.apply(this, [method, url, ...rest]);
  };
  wrapped += 1;
};

const wrapSendBeacon = (): void => {
  const nav = g.navigator;
  if (!nav || typeof nav.sendBeacon !== 'function') return;
  const original = nav.sendBeacon.bind(nav);
  nav.sendBeacon = (url: unknown, data?: unknown): unknown => {
    tally(url);
    return original(url, data);
  };
  wrapped += 1;
};

const wrapWindowOpen = (): void => {
  const original = g.open;
  if (typeof original !== 'function') return;
  g.open = (url?: unknown, ...rest: unknown[]): unknown => {
    if (url) tally(url);
    return original.apply(g, [url, ...rest]);
  };
  wrapped += 1;
};

// --- subresource census (parser-driven loads: script / link / img / font / worker) ---
const resources = (): { name?: unknown }[] => {
  try {
    const perf = g.performance;
    if (!perf || typeof perf.getEntriesByType !== 'function') return [];
    const list = perf.getEntriesByType('resource');
    return Array.isArray(list) ? (list as { name?: unknown }[]) : [];
  } catch {
    return [];
  }
};

const resourceCensus = (): { total: number; external: number; hosts: string[] } => {
  const list = resources();
  const hosts: string[] = [];
  let external = 0;
  for (const entry of list) {
    const href = typeof entry?.name === 'string' ? entry.name : '';
    if (!href || IGNORED_SCHEME.test(href)) continue;
    if (!/^https?:\/\//i.test(href)) continue;
    let isExternal = false;
    try {
      isExternal = !ORIGIN || new URL(href).origin !== ORIGIN;
    } catch {
      isExternal = false;
    }
    if (!isExternal) continue;
    external += 1;
    try {
      const host = new URL(href).host;
      if (!hosts.includes(host)) hosts.push(host);
    } catch {
      /* keep counting even when a host cannot be parsed */
    }
  }
  return { total: list.length, external, hosts };
};

// --- crash sentinels (window-level, bubble phase only; console.* deliberately untouched) ---
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
    return 'ayanami-rb-probe-1';
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
  get resourceEgressCount(): string {
    return String(resourceCensus().external);
  },
  get resourceHosts(): string {
    return resourceCensus().hosts.sort().join(',');
  },
  get resourceCount(): string {
    return String(resourceCensus().total);
  },
  get wrapped(): string {
    return String(wrapped);
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
