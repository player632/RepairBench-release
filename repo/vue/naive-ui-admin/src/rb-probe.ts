/* RepairBench neutral read-only instrumentation probe (added by environment/instrumentation.patch).
 *
 * WHAT THIS FILE IS: a measurement surface, not a feature. It is imported as the FIRST line of
 * src/main.ts (above seed line 1 `import './styles/tailwind.css';`), so by ES module evaluation
 * order (depth-first, source order) its whole body runs BEFORE `createApp` is imported from 'vue'
 * (seed src/main.ts:3), BEFORE setupRouter(app) at :31 and therefore BEFORE the router guard at
 * src/router/guards.ts:32 reads `storage.get(ACCESS_TOKEN)` - i.e. the login token is already
 * seeded, both storages are already wiped, and the request wrappers plus the resource observer are
 * already installed when the first byte of application code runs. Nothing can be missed by
 * arriving late, and nothing downstream can observe a pre-existing storage residue.
 *
 * WHAT IT DOES, in order:
 *   1. records any boot-time exception, so a probe fault can never masquerade as an app fault;
 *   2. snapshots the window property names that exist at boot and any pre-existing
 *      localStorage/sessionStorage key, wipes BOTH storages, then seeds exactly ONE key:
 *      localStorage['ACCESS-TOKEN'] = JSON.stringify({ value, expire }) - the login bypass. Its
 *      shape is the seed's own: src/utils/Storage.ts:29-35 set() writes `{value, expire: now +
 *      expire*1000}` and :42-58 get() returns `value` when `expire >= Date.now()`; the KEY name is
 *      src/store/mutation-types.ts:1 `ACCESS_TOKEN = 'ACCESS-TOKEN'` run through
 *      src/utils/Storage.ts:19-21 getKey() (prefixKey '' at :124 `new Storage('')`, then
 *      toUpperCase()). IS-SCREENLOCKED is deliberately NOT seeded: src/store/modules/screenLock.ts:8
 *      reads it with default false, and App.vue:32 `isLock` would hide the whole NConfigProvider.
 *   3. installs a BUFFERED PerformanceObserver over 'resource' entries and classifies each URL as
 *      inert (data:/blob:/about:), same-origin or cross-origin - this is the egress measurement, and
 *      the only way to see element-src loads (the 15 NAvatar <img> that mock/table/list.ts:12 feeds
 *      through src/views/list/basicList/columns.ts and src/views/comp/table/basicColumns.ts:38-44,
 *      and the <iframe :src> at src/views/iframe/index.vue:4), which no fetch/XHR wrapper can see;
 *   4. wraps fetch, XMLHttpRequest.prototype.open, navigator.sendBeacon and window.open purely to
 *      COUNT calls (behaviour unchanged: every wrapper forwards all arguments and returns the
 *      original result). fetch is the one that matters here: src/utils/http/alova/index.ts:18-37
 *      builds `createAlovaMockAdapter([...], { enable: useMock, httpAdapter: adapterFetch(), delay:
 *      1000 })`, i.e. the seed talks to its own mock through the FETCH adapter, and the real sink
 *      this face guards against is `window.open(key)` at src/layout/components/Menu/index.vue:126;
 *   5. counts window errors, unhandled rejections and resource load errors;
 *   6. publishes window.__rb, a flat object of ZERO-ARGUMENT GETTERS THAT ALL RETURN A STRING.
 *
 * WHAT IT NEVER DOES: it renders nothing, creates no DOM element, adds no data-testid attribute,
 * registers no route, touches no pinia store, issues no request, and changes no application
 * behaviour (the one localStorage key it writes is the documented login bypass, without which
 * src/router/guards.ts:34-52 redirects every route to /login and there is no face left to measure).
 * Every getter returns a string because evaluation/dsl_runner.mjs compares js_eval asserts with
 * assertEq(expected, got, loose=true) (evaluation/dsl_runner.mjs:43-49), so a number would compare
 * by coercion and an object or array never would.
 *
 * WHY THE COLD FACE IS OFFLINE: .env.production:2 `VITE_USE_MOCK = true` keeps the alova mock
 * adapter ENABLED in the production build (src/hooks/setting/index.ts:35-45 reads
 * import.meta.env.VITE_USE_MOCK), and .env.production:11 `VITE_GLOB_API_URL =` is EMPTY, so
 * src/utils/http/alova/index.ts:14 urlPrefix '/api' produces same-origin relative URLs that the mock
 * adapter answers in-process after its fixed 1000 ms delay. The three endpoints this face touches
 * (/api/admin_info, /api/table/list, /api/dashboard/console) are all in src/utils/http/alova/mocks.ts:3-10.
 * The remaining external literals in the seed are neutralised by environment/adaptation.patch at
 * their DATA SOURCE (src/router/modules/{frame,docs,newVersion}.ts, mock/table/list.ts:12, three view
 * files and one n-upload action), and one inline literal with no data source
 * (src/layout/components/Header/index.vue:288). Two declared-but-unconsumed sites are left alone and
 * registered instead: src/utils/downloadFile.ts:49/:53-55 (0 consumers in the whole gate) and the
 * `<a href target="_blank">` links at src/views/about/index.vue:25/:30 (no click handler, and an
 * <a href> is not fetched by a browser unless clicked - this face never clicks one).
 *
 * MOUNT DETECTION: src/main.ts:42 is `app.mount('#app', true)`, but the second argument is IGNORED -
 * @vue/runtime-dom v3.5.42 overrides app.mount with a one-parameter function
 * (node_modules/@vue/runtime-dom/dist/runtime-dom.cjs.js:1893 `app.mount = (containerOrSelector) => {`),
 * which empties the container at :1901 `container.textContent = ""` and then calls the core mount with
 * isHydrate=false at :1903, and finally stamps `data-v-app=""` on the container at :1906. So the
 * index.html loading placeholder inside #app (`<style>` + `.first-loading-wrap`, dist/index.html
 * measured 2400 B) is REMOVED, this is NOT a hydration boot, and `#app[data-v-app]` is a positive
 * mount marker. mountPresent() below requires that marker AND at least one `.n-layout` under #app
 * (src/layout/index.vue:2 `<n-layout class="layout" ...>`, the layout root every routed page renders).
 *
 * blob:/about: URLs are classified as INERT, not as egress: URL.createObjectURL is an in-process object
 * reference, and 'about:blank' is what environment/adaptation.patch puts in the three frameSrc route
 * metas so that src/views/iframe/index.vue:4 cannot reach the network.
 */
// The empty export below makes this file an ES module in every TS/vite configuration (it is imported
// for its side effects only); it exports no value and binds no name.
export {};

;(function () {
  const w: any = typeof window !== 'undefined' ? window : null;
  if (!w) return;
  if (w.__rb) return;

  const VERSION = 'naive-ui-admin-rb-probe-1';
  // src/store/mutation-types.ts:1 `export const ACCESS_TOKEN = 'ACCESS-TOKEN';` +
  // src/utils/Storage.ts:19-21 getKey() = `${prefixKey}${key}`.toUpperCase() with prefixKey '' (:124).
  const TOKEN_KEY = 'ACCESS-TOKEN';
  const TOKEN_VALUE = 'rb-offline-token';
  // Globals the seed itself legitimately creates AFTER the probe boots, so they are not pollution:
  // src/plugins/naiveDiscreteApi.ts:35-38 assigns window['$message'|'$dialog'|'$notification'|'$loading']
  // (read back at src/router/guards.ts:19/:103 and src/views/list/basicList/index.vue:281), and
  // dist/app.config.js assigns window.__PRODUCTION__ADMINPRO__CONF__ (read by src/utils/env.ts:17-23) -
  // that one is a classic <script> in <head>, so it normally predates this module and is in bootGlobals
  // anyway; it is whitelisted for order-independence. `globalThis` is declared by index.html:119.
  const GLOBAL_WHITELIST = [
    '$message',
    '$dialog',
    '$notification',
    '$loading',
    '__PRODUCTION__ADMINPRO__CONF__',
    '__VUE__',
    '__VUE_DEVTOOLS_GLOBAL_HOOK__',
    'globalThis',
  ];
  // The probe's own published surface plus the per-checkpoint frozen slots the dsl writes
  // (window.__rbF01v, window.__rbP26a, ...) must not be reported as application pollution.
  const GLOBAL_WHITELIST_RE = /^__rb/;

  let bootState = 'ok';
  let bootError = 'none';
  let seeded = 'false';

  let fetchCalls = 0;
  let xhrCalls = 0;
  let beaconCalls = 0;
  let windowOpenCalls = 0;
  let crossOriginAttempts = 0;
  let wrapped = 0;

  let jsErrors = 0;
  let resourceErrors = 0;
  let rejections = 0;

  let crossOrigin = 0;
  let sameOrigin = 0;
  let inert = 0;
  let total = 0;
  let observerActive = false;
  const crossHosts: string[] = [];
  const fetchPaths: string[] = [];

  let residueBefore = '';
  let bootGlobals: string[] = [];

  const classify = (raw: string): string => {
    const url = String(raw == null ? '' : raw);
    if (!url) return 'inert';
    if (/^(data:|blob:|about:)/i.test(url)) return 'inert';
    try {
      const u = new URL(url, w.location ? w.location.href : undefined);
      if (u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'about:') return 'inert';
      const here = w.location ? w.location.origin : '';
      if (here && u.origin === here) return 'same';
      if (!/^(https?:|wss?:)/i.test(u.protocol)) return 'inert';
      return 'cross';
    } catch (e) {
      return 'inert';
    }
  };

  const hostOf = (raw: string): string => {
    try {
      const u = new URL(String(raw), w.location ? w.location.href : undefined);
      return u.host || '';
    } catch (e) {
      return '';
    }
  };

  const note = (raw: string): void => {
    const kind = classify(raw);
    total += 1;
    if (kind === 'same') sameOrigin += 1;
    else if (kind === 'inert') inert += 1;
    else {
      crossOrigin += 1;
      const h = hostOf(raw);
      if (h && crossHosts.indexOf(h) < 0) crossHosts.push(h);
    }
  };

  try {
    // ---- 1/2. boot globals snapshot, storage residue snapshot, wipe, then the ONE seeded key ----
    try {
      bootGlobals = Object.getOwnPropertyNames(w);
    } catch (e) {
      bootGlobals = [];
    }
    try {
      const seen: string[] = [];
      const ls = w.localStorage;
      const ss = w.sessionStorage;
      if (ls) for (let i = 0; i < ls.length; i += 1) seen.push('local:' + String(ls.key(i)));
      if (ss) for (let i = 0; i < ss.length; i += 1) seen.push('session:' + String(ss.key(i)));
      residueBefore = seen.join(',');
      if (ls) ls.clear();
      if (ss) ss.clear();
      if (ls) {
        // src/utils/Storage.ts:29-35 writes exactly this shape; :49 accepts it while expire >= Date.now().
        const payload = JSON.stringify({ value: TOKEN_VALUE, expire: Date.now() + 86400000 });
        ls.setItem(TOKEN_KEY, payload);
        seeded = String(ls.getItem(TOKEN_KEY) === payload);
      }
    } catch (e) {
      residueBefore = residueBefore || 'storage-unavailable';
      seeded = 'ERR';
    }

    // ---- 3. buffered resource observer = the egress measurement ----
    const PO: any = w.PerformanceObserver;
    if (PO) {
      const obs = new PO((list: any) => {
        try {
          const entries = list.getEntries();
          for (let i = 0; i < entries.length; i += 1) note(entries[i].name);
        } catch (e) {
          /* a malformed entry must never break the page */
        }
      });
      try {
        obs.observe({ type: 'resource', buffered: true });
        observerActive = true;
      } catch (e) {
        try {
          obs.observe({ entryTypes: ['resource'] });
          observerActive = true;
        } catch (e2) {
          observerActive = false;
        }
      }
    }

    // ---- 4. count-only request wrappers (every one forwards and returns unchanged) ----
    if (typeof w.fetch === 'function') {
      const origFetch = w.fetch.bind(w);
      w.fetch = function (...args: any[]) {
        fetchCalls += 1;
        try {
          const first: any = args[0];
          const url = typeof first === 'string' ? first : first && first.url ? String(first.url) : '';
          const kind = classify(url);
          if (kind === 'cross') {
            crossOriginAttempts += 1;
            const h = hostOf(url);
            if (h && crossHosts.indexOf(h) < 0) crossHosts.push(h);
          } else if (kind === 'same') {
            const p = new URL(url, w.location.href).pathname;
            if (fetchPaths.indexOf(p) < 0) fetchPaths.push(p);
          }
        } catch (e) {
          /* counting must never break the call */
        }
        return origFetch(...args);
      };
      wrapped += 1;
    }
    if (w.XMLHttpRequest && w.XMLHttpRequest.prototype && typeof w.XMLHttpRequest.prototype.open === 'function') {
      const origOpen = w.XMLHttpRequest.prototype.open;
      w.XMLHttpRequest.prototype.open = function (...args: any[]) {
        xhrCalls += 1;
        try {
          const url = String(args[1] == null ? '' : args[1]);
          if (classify(url) === 'cross') {
            crossOriginAttempts += 1;
            const h = hostOf(url);
            if (h && crossHosts.indexOf(h) < 0) crossHosts.push(h);
          }
        } catch (e) {
          /* ignore */
        }
        return origOpen.apply(this, args as any);
      };
      wrapped += 1;
    }
    if (w.navigator && typeof w.navigator.sendBeacon === 'function') {
      const origBeacon = w.navigator.sendBeacon.bind(w.navigator);
      w.navigator.sendBeacon = function (...args: any[]) {
        beaconCalls += 1;
        try {
          if (classify(String(args[0] == null ? '' : args[0])) === 'cross') crossOriginAttempts += 1;
        } catch (e) {
          /* ignore */
        }
        return origBeacon(...args);
      };
      wrapped += 1;
    }
    if (typeof w.open === 'function') {
      const origWindowOpen = w.open.bind(w);
      w.open = function (...args: any[]) {
        windowOpenCalls += 1;
        try {
          const url = String(args[0] == null ? '' : args[0]);
          if (classify(url) === 'cross') {
            crossOriginAttempts += 1;
            const h = hostOf(url);
            if (h && crossHosts.indexOf(h) < 0) crossHosts.push(h);
          }
        } catch (e) {
          /* ignore */
        }
        return origWindowOpen(...args);
      };
      wrapped += 1;
    }

    // ---- 5. error counters ----
    w.addEventListener(
      'error',
      (ev: any) => {
        if (ev && ev.target && ev.target !== w && (ev.target.src || ev.target.href)) resourceErrors += 1;
        else jsErrors += 1;
      },
      true
    );
    w.addEventListener('unhandledrejection', () => {
      rejections += 1;
    });
  } catch (e) {
    bootState = 'error';
    bootError = String((e as any) && (e as any).message ? (e as any).message : e)
      .split('\n')[0]
      .slice(0, 200);
  }

  // ---- 6. the published measurement surface: zero-argument getters, every one a STRING ----
  const storageNames = (which: string): string[] => {
    const out: string[] = [];
    try {
      const st = which === 'session' ? w.sessionStorage : w.localStorage;
      if (st) for (let i = 0; i < st.length; i += 1) out.push(String(st.key(i)));
    } catch (e) {
      out.push('storage-unavailable');
    }
    return out;
  };

  const newGlobals = (): string[] => {
    let now: string[] = [];
    try {
      now = Object.getOwnPropertyNames(w);
    } catch (e) {
      return [];
    }
    const before: { [k: string]: boolean } = {};
    for (let i = 0; i < bootGlobals.length; i += 1) before[bootGlobals[i]] = true;
    const out: string[] = [];
    for (let i = 0; i < now.length; i += 1) {
      const k = now[i];
      if (before[k]) continue;
      if (GLOBAL_WHITELIST.indexOf(k) >= 0) continue;
      if (GLOBAL_WHITELIST_RE.test(k)) continue;
      out.push(k);
    }
    return out;
  };

  // Elements that can carry an outbound URL. Same-origin, data: and about: references are NOT egress;
  // only a resolved cross-origin src/href/data counts. This is the DOM-side complement to the resource
  // observer: it sees a DECLARED reference even when the browser never fires it (and, conversely, an
  // <a href> is deliberately not in the selector list, because an anchor is not fetched by a browser
  // until it is clicked - the two external anchors at src/views/about/index.vue:25/:30 are registered
  // as declared-but-unconsumed rather than counted as egress).
  const externalElementRefs = (): number => {
    let n = 0;
    try {
      const sel =
        'script[src],link[href],img[src],iframe[src],frame[src],embed[src],object[data],source[src],video[src],audio[src],input[src]';
      const els = w.document.querySelectorAll(sel);
      for (let i = 0; i < els.length; i += 1) {
        const el: any = els[i];
        const raw = String(el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('data') || '');
        if (!raw) continue;
        if (classify(el.src || el.href || el.data || raw) === 'cross') n += 1;
      }
    } catch (e) {
      return -1;
    }
    return n;
  };

  const attrJoin = (sel: string, attr: string): string => {
    try {
      const els = w.document.querySelectorAll(sel);
      const out: string[] = [];
      for (let i = 0; i < els.length; i += 1) out.push(String(els[i].getAttribute(attr) || ''));
      return out.length ? out.join('|') : 'none';
    } catch (e) {
      return 'ERR';
    }
  };

  const api: { [k: string]: () => string } = {
    version: () => VERSION,
    bootState: () => String(bootState),
    bootError: () => String(bootError),
    // positive control: the app really mounted (see the MOUNT DETECTION block in the header comment).
    mountPresent: () => {
      try {
        const stamped = w.document.querySelectorAll('#app[data-v-app]').length === 1;
        const laid = w.document.querySelectorAll('#app .n-layout').length > 0;
        return String(stamped && laid ? 'true' : 'false');
      } catch (e) {
        return 'ERR';
      }
    },
    domNodes: () => {
      try {
        return String(w.document.getElementsByTagName('*').length);
      } catch (e) {
        return 'ERR';
      }
    },
    readyState: () => {
      try {
        return String(w.document.readyState);
      } catch (e) {
        return 'ERR';
      }
    },
    pageTitle: () => {
      try {
        return String(w.document.title);
      } catch (e) {
        return 'ERR';
      }
    },
    //
    seeded: () => String(seeded),
    tokenPresent: () => {
      try {
        return String(w.localStorage.getItem(TOKEN_KEY) ? 'true' : 'false');
      } catch (e) {
        return 'ERR';
      }
    },
    storageKeyCount: () => {
      const names = storageNames('local');
      return String(names.length === 1 && names[0] === 'storage-unavailable' ? 0 : names.length);
    },
    sessionKeyCount: () => {
      const names = storageNames('session');
      return String(names.length === 1 && names[0] === 'storage-unavailable' ? 0 : names.length);
    },
    storageResidueNow: () => storageNames('local').join(','),
    storageResidueBefore: () => String(residueBefore),
    globalNewKeys: () => newGlobals().join(','),
    globalNewKeyCount: () => String(newGlobals().length),
    locationState: () => {
      try {
        return String(w.location.pathname + w.location.search + w.location.hash);
      } catch (e) {
        return 'ERR';
      }
    },
    pathname: () => {
      try {
        return String(w.location.pathname);
      } catch (e) {
        return 'ERR';
      }
    },
    // --- egress measurement ---
    extHosts: () => crossHosts.slice().sort().join(','),
    extHostCount: () => String(crossHosts.length),
    crossOriginCount: () => String(crossOrigin),
    sameOriginCount: () => String(sameOrigin),
    inertCount: () => String(inert),
    resourceCount: () => String(total),
    // positive control: a static SPA always loads its own js/css/png plus /app.config.js and the
    // same-origin /api/* mock calls, so this must be 'true'. Without it, extHosts()=='' could be read
    // off a dead observer instead of an offline page.
    sameOriginPresent: () => String(sameOrigin > 0 ? 'true' : 'false'),
    observerActive: () => String(observerActive),
    externalElementRefs: () => String(externalElementRefs()),
    iframeSrcs: () => attrJoin('iframe', 'src'),
    scriptSrcs: () => attrJoin('script', 'src'),
    scriptTagCount: () => {
      try {
        return String(w.document.querySelectorAll('script').length);
      } catch (e) {
        return 'ERR';
      }
    },
    fetchCalls: () => String(fetchCalls),
    fetchWrapped: () => String(wrapped),
    fetchPaths: () => fetchPaths.slice().sort().join(','),
    xhrCalls: () => String(xhrCalls),
    beaconCalls: () => String(beaconCalls),
    windowOpenCalls: () => String(windowOpenCalls),
    crossOriginAttempts: () => String(crossOriginAttempts),
    errors: () => String(jsErrors),
    resourceErrors: () => String(resourceErrors),
    rejections: () => String(rejections),
  };
  // getterCount is DERIVED at call time and includes itself, so it can never drift when a getter is
  // added or removed: it is always exactly the number of published zero-arg getters on window.__rb.
  api.getterCount = () => String(Object.keys(api).length);
  try {
    Object.defineProperty(w, '__rb', { value: api, writable: false, configurable: false, enumerable: false });
  } catch (e) {
    w.__rb = api;
  }
})();
