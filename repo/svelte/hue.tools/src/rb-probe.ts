// rb-probe.ts - RepairBench neutral, READ-ONLY instrumentation probe.
//
// WHAT THIS IS: environment/instrumentation.patch drops this file into the seed tree and adds
// `import '$src/rb-probe'` as the FIRST import of src/routes/__layout.svelte, so its module body runs
// before the app's own modules. It renders nothing, adds no element, no class, no attribute and
// NO data-testid (the seed has none and the probe introduces none), and it changes no behaviour:
// every wrapper below delegates to the original and only records a scalar on the way through.
//
// WHY IT EXISTS: this face is graded offline, so "the app made no network request" has to be a
// MEASUREMENT and not a hope. The probe publishes the boot / egress / storage / error scalars that the
// dsl asserts on (window.__rb.*), and it wipes the seed's own persisted keys at init so that a
// checkpoint cannot inherit state from an earlier one.
//
// HONESTY NOTES (deliberate design choices, not omissions):
//  * HTMLImageElement.prototype.src is NOT redefined. Overriding a native accessor risks breaking the
//    very image loads it is meant to observe, and it would add no evidence: the DOM census below already
//    enumerates every img[src] (plus link/script/iframe/audio/video/source) on every read, which catches
//    an external image both statically and after any later DOM mutation.
//  * `errorCount` counts ONLY uncaught script errors and unhandled promise rejections. Element resource
//    load failures are tallied separately as `resourceErrorCount`, because a failed <img>/<link> is a
//    network fact and must not be laundered into a "the app threw" reading.
//  * Every value published on window.__rb is a STRING, because the grader compares js_eval results with
//    a loose == against a string expectation. Getters recompute on read, so they can never go stale.
//  * The whole module body is wrapped in try/catch: a probe that throws would poison errorCount and turn
//    a behavioural red into an infrastructure red, which is exactly what this file must never do.

const RB_VERSION = 'rb-probe/hue.tools-01/v1';

// The seed's own persisted keys: __layout.svelte:29 writes 'format', __layout.svelte:50 writes 'theme',
// mix.svelte:45-46 write 'mode' and 'steps'. All four are cleared at init for state isolation (the dsl
// also runs every checkpoint in a fresh browser context, so this is belt and braces).
const SEED_STORAGE_KEYS = ['format', 'theme', 'mode', 'steps'];

// Anything the grader may want to read is funnelled through here and stringified on the way out.
const state = {
  egressCount: 0,
  netHosts: [] as string[],
  windowOpened: 0,
  errorCount: 0,
  errorText: '',
  resourceErrorCount: 0,
  storageWritable: false,
  wipedKeys: [] as string[],
};

const record = (url: unknown) => {
  try {
    const u = new URL(String(url), location.href);
    if (u.origin === location.origin) return; // same-origin asset: not egress
    state.egressCount += 1;
    if (state.netHosts.indexOf(u.host) < 0) state.netHosts.push(u.host);
  } catch {
    state.egressCount += 1; // an unparseable transport target is still an attempt to leave
    if (state.netHosts.indexOf('unparseable') < 0) state.netHosts.push('unparseable');
  }
};

const uniqSorted = (xs: string[]) => xs.slice().sort().filter((x, i, a) => a.indexOf(x) === i);

const extRefs = () => {
  const out: string[] = [];
  try {
    const sel = 'link[href],script[src],img[src],iframe[src],audio[src],video[src],source[src]';
    const els = document.querySelectorAll(sel);
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const raw =
        el.getAttribute('href') ||
        el.getAttribute('src') ||
        '';
      if (!raw) continue;
      if (/^(data:|blob:|#|mailto:|tel:|javascript:)/i.test(raw)) continue;
      let u: URL;
      try {
        u = new URL(raw, location.href);
      } catch {
        out.push(el.tagName.toLowerCase() + '[' + raw.slice(0, 80) + ']');
        continue;
      }
      if (u.origin !== location.origin) out.push(el.tagName.toLowerCase() + '[' + u.host + u.pathname.slice(0, 60) + ']');
    }
  } catch {
    /* census is best-effort; a failure yields 0 rather than a throw */
  }
  return out;
};

const storageKeys = () => {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k !== null) out.push(k);
    }
  } catch {
    /* storage may be blocked; storageWritable reports that separately */
  }
  return uniqSorted(out);
};

try {
  // ---- 1. wipe the seed's own persisted state BEFORE any app module reads it ----
  for (const k of SEED_STORAGE_KEYS) {
    try {
      if (localStorage.getItem(k) !== null) state.wipedKeys.push(k);
      localStorage.removeItem(k);
    } catch {
      /* ignore per-key failures */
    }
  }
  state.wipedKeys = uniqSorted(state.wipedKeys);

  // ---- 2. non-vacuity proof: is storage writable at all? (self-removing probe key) ----
  try {
    const probeKey = '__rb_probe_writable__';
    localStorage.setItem(probeKey, '1');
    state.storageWritable = localStorage.getItem(probeKey) === '1';
    localStorage.removeItem(probeKey);
  } catch {
    state.storageWritable = false;
  }

  // ---- 3. transport wrappers: record, then delegate ----
  try {
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    if (origFetch) {
      (window as any).fetch = function (input: any, init?: any) {
        try {
          record(typeof input === 'string' ? input : input && input.url ? input.url : String(input));
        } catch {
          /* never let the probe break the call */
        }
        return origFetch(input, init);
      };
    }
  } catch {
    /* fetch may be absent */
  }

  try {
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method: any, url: any, ...rest: any[]) {
      try {
        record(url);
      } catch {
        /* ignore */
      }
      return (origOpen as any).apply(this, [method, url, ...rest]);
    } as any;
  } catch {
    /* XHR may be absent */
  }

  try {
    if (navigator.sendBeacon) {
      const origBeacon = navigator.sendBeacon.bind(navigator);
      (navigator as any).sendBeacon = function (url: any, data?: any) {
        try {
          record(url);
        } catch {
          /* ignore */
        }
        return origBeacon(url, data);
      };
    }
  } catch {
    /* sendBeacon may be absent */
  }

  try {
    const origOpenWin = window.open ? window.open.bind(window) : null;
    if (origOpenWin) {
      (window as any).open = function (url?: any, ...rest: any[]) {
        state.windowOpened += 1;
        try {
          record(url);
        } catch {
          /* ignore */
        }
        return (origOpenWin as any)(url, ...rest);
      };
    }
  } catch {
    /* window.open may be absent */
  }

  try {
    if (typeof EventSource !== 'undefined') {
      const OrigES: any = EventSource;
      (window as any).EventSource = function (url: any, cfg?: any) {
        try {
          record(url);
        } catch {
          /* ignore */
        }
        return new OrigES(url, cfg);
      };
    }
  } catch {
    /* EventSource may be absent */
  }

  try {
    if (typeof WebSocket !== 'undefined') {
      const OrigWS: any = WebSocket;
      (window as any).WebSocket = function (url: any, protos?: any) {
        try {
          record(url);
        } catch {
          /* ignore */
        }
        return protos === undefined ? new OrigWS(url) : new OrigWS(url, protos);
      };
    }
  } catch {
    /* WebSocket may be absent */
  }

  // ---- 4. error accounting ----
  window.addEventListener(
    'error',
    (ev: any) => {
      try {
        const isResource = ev && ev.target && ev.target !== window && (ev.target.src !== undefined || ev.target.href !== undefined);
        if (isResource) {
          state.resourceErrorCount += 1;
          return;
        }
        state.errorCount += 1;
        const msg = (ev && (ev.message || (ev.error && ev.error.message))) || 'unknown error';
        state.errorText = (state.errorText ? state.errorText + ' | ' : '') + String(msg).slice(0, 200);
      } catch {
        /* ignore */
      }
    },
    true,
  );

  window.addEventListener('unhandledrejection', (ev: any) => {
    try {
      state.errorCount += 1;
      const r = ev && ev.reason;
      const msg = (r && (r.message || r.toString())) || 'unhandled rejection';
      state.errorText = (state.errorText ? state.errorText + ' | ' : '') + String(msg).slice(0, 200);
    } catch {
      /* ignore */
    }
  });

  // ---- 5. publish STRING scalars; getters recompute so they can never go stale ----
  (window as any).__rb = {
    get ready() {
      return 'true';
    },
    get probeVersion() {
      return RB_VERSION;
    },
    get egressCount() {
      return String(state.egressCount);
    },
    get netHosts() {
      return uniqSorted(state.netHosts).join(',');
    },
    get windowOpened() {
      return String(state.windowOpened);
    },
    get errorCount() {
      return String(state.errorCount);
    },
    get errorText() {
      return state.errorText;
    },
    get resourceErrorCount() {
      return String(state.resourceErrorCount);
    },
    get storageWritable() {
      return String(state.storageWritable);
    },
    get storageKeys() {
      return storageKeys().join(',');
    },
    get wipedKeys() {
      return state.wipedKeys.join(',');
    },
    get extRefsCount() {
      return String(extRefs().length);
    },
    get extRefsSample() {
      return extRefs().slice(0, 4).join(' ; ');
    },
  };
} catch (e) {
  // Last resort: still publish something readable, so a probe failure reads as a red assertion
  // (window.__rb.ready !== 'true') instead of a setup crash.
  try {
    (window as any).__rb = {
      ready: 'false',
      probeVersion: RB_VERSION,
      egressCount: '-1',
      netHosts: 'probe-init-failed',
      windowOpened: '-1',
      errorCount: '-1',
      errorText: String((e && (e as any).message) || e).slice(0, 200),
      resourceErrorCount: '-1',
      storageWritable: 'false',
      storageKeys: '',
      wipedKeys: '',
      extRefsCount: '-1',
      extRefsSample: 'probe-init-failed',
    };
  } catch {
    /* nothing else can be done */
  }
}

export {};
