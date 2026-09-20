// rb-probe.ts - RepairBench measurement probe for repair-react__mochord-01. INSTRUMENTATION ONLY.
//
// Shipped by environment/instrumentation.patch as ONE new file plus ONE import inserted as line 1 of
// src/main.tsx (gate src/main.tsx:1 is `import React from "react";`), so every statement below runs
// before any application module body and, crucially, before src/App.tsx:63
// `const initialWorkspace = useMemo(() => loadWorkspaceState(), []);` reads Web Storage during React's
// first render. That ordering is the whole reason this file exists in this shape:
//   MEASURED (OBSERVE_PROBE8.json phase W9_storage_reset_recipes, clean tree, headless chromium):
//     R1 `localStorage.clear()` then reload            -> DOES NOT RESET. src/hooks/useProgressSync.ts:146
//                                                          installs a `beforeunload` handler that calls
//                                                          saveGuestProgress(latestProgress.current), and
//                                                          progressService.writeLocalProgressSnapshot
//                                                          rewrites mochord:workspace-state /
//                                                          mochord_guest_progress / mochord:library during
//                                                          the unload, so the cleared state is restored
//                                                          before the next document ever boots.
//     R2 close page, open a new page, clear, goto      -> DOES NOT RESET (same handler, new document).
//     R3 clear BEFORE any page script (addInitScript)  -> RESETS, and keeps resetting on every later
//                                                          navigation in the same context.
//   R3 is exactly what a first-line `import './rb-probe';` gives us, so every dsl checkpoint that starts
//   with `goto /` boots from DEFAULT_WORKSPACE_STATE (src/utils/workspaceState.ts:33-48: activePage
//   "home", chordName "C", bpm 90, timeSignature 4/4, countInBars 0, accentFirstBeat true,
//   metronomeDuringPlayback true, selectedKey "C", selectedMode "Major", tuningPresetId "standard",
//   referenceA 440). Checkpoints are therefore order-independent, which is what makes the F2P/P2P
//   readings reproducible state by state.
//
// WHAT IT PUBLISHES - window.__rb, 21 zero-argument functions that each return a STRING scalar (never an
// object, never a number: evaluation/dsl_runner.mjs:787-790 compares a js_eval result against the dsl's
// `expected` with a loose ==, so a non-scalar would silently compare false):
//   version()               this probe's own literal. Asserted verbatim by P01 so that a stale or absent
//                           instrumentation can never turn a sentinel into a "no probe" pass.
//   ready()                 'true' once the synchronous boot sequence finished (storage reset, error and
//                           load listeners, all wrappers installed, __rb published). Service-worker and
//                           CacheStorage cleanup is deliberately fire-and-forget and NOT part of it.
//   frameReady()            'true' once #root has at least one child element, i.e. the React root really
//                           rendered (index.html:14 <div id="root"></div> is the only mount point and
//                           src/main.tsx:8 createRoot(...).render(...) is the only render call).
//   loadFired()             'true' once the window 'load' event was observed (or readyState was already
//                           'complete'). This is the readiness gate every checkpoint polls on.
//   navLang()               document.documentElement.lang, which src/i18n.tsx:633/640 owns ('en' or
//                           'zh-CN'). NOT navigator.language, which follows the browser locale and is
//                           therefore not seed-owned.
//   hookCount()             how many wrappers actually installed - THE instrument-alive control.
//   classifySelfTest()      'ok' when the origin classifier returns its expected verdict for seven
//                           baked-in inputs (absolute cross-origin, protocol-relative cross-origin,
//                           absolute same-origin, root-relative same-origin, data:, blob:, empty). Proves
//                           egressCount()=='0' is a measurement and not a classifier that classifies
//                           nothing. Issues no request.
//   egressCount()           requests / DOM resource assignments whose url resolves to an origin other
//                           than the served one. Asserted '0' by P02.
//   egressHosts()           the distinct external hosts seen, comma-joined and sorted ('' when none).
//   sameOriginCount()       same-origin requests seen through the four REQUEST wrappers (fetch / XHR /
//                           sendBeacon / window.open). Expected '0' on this seed: the shipped page has no
//                           API call at all, and src/lib/supabase.ts's client stays inert offline because
//                           no session is persisted (MEASURED: four probe rounds, 0 external requests).
//   domResourceEgressCount() external URLs assigned through the four DOM property setters. Expected '0'.
//   testidCount()           number of [data-testid] elements. Asserted '0': this face adds none, because
//                           every checkpoint addresses the seed's own class/id/aria surface through
//                           js_eval, so the instrumentation patch stays 1 new file + 1 import line.
//   swCount()               service-worker registrations seen plus a live controller, if any.
//   errorCount()            window 'error' + 'unhandledrejection' events observed. Asserted '0'.
//   storageKeys()           every localStorage key, sorted and comma-joined - the state-isolation census
//                           P05 asserts against the seed's own whitelist (mochord:workspace-state,
//                           mochord:language, mochord:library, mochord:practice-sessions,
//                           mochord_guest_progress, mochord_guest_progress_updated_at and the
//                           mochord:guitar-voicing:* / mochord:tuning-presets prefixes).
//   storageKeyCount()       how many keys that is.
//   sessionStorageKeys()    same census for sessionStorage. Expected '' (MEASURED: empty).
//   cookieCount()           number of cookies visible to document.cookie. Expected '0' (MEASURED: '').
//   unexpectedGlobals()     every own window property starting with '__' except __rb itself, sorted and
//                           comma-joined. Expected '': no checkpoint may leave a global behind, and the
//                           probe is the only __-prefixed thing this face is allowed to add.
//   storageResetAtBoot()    'true' when both clear() calls at boot succeeded.
//   mountChildCount()       #root's childElementCount as a string ('-1' when #root is absent).
//
// WHAT IT DOES NOT DO: it changes no behaviour. Every wrapper calls through to the original with the
// original arguments and returns its result; the counters are incremented before the call, never after a
// condition. It holds NO selector, constant or expected value belonging to any injected defect - the
// clean and delivered readings live in tests/dsl.json's `expected` + `derivation` fields, so a solver
// who reads the instrumentation learns nothing about the twelve defects.
export {};

(() => {
  const W = window as unknown as Record<string, any>;
  const D = document;
  const VERSION = "rb-probe/mochord-01/v1";

  let bootComplete = false;
  let loadFired = false;
  let errorCount = 0;
  let hookCount = 0;
  let egressCount = 0;
  let sameOriginCount = 0;
  let domResourceEgressCount = 0;
  let swRegistrations = 0;
  let storageResetOk = false;
  const egressHosts: Record<string, number> = {};

  // ---------------------------------------------------------------- origin classifier
  // 'external' | 'same' | 'inline' | 'empty' - a pure function of the url string and the served origin.
  function classify(rawUrl: unknown): "external" | "same" | "inline" | "empty" {
    const u = rawUrl === undefined || rawUrl === null ? "" : String(rawUrl).trim();
    if (u === "") return "empty";
    if (/^(data|blob|filesystem):/i.test(u)) return "inline";
    if (/^about:/i.test(u)) return "inline";
    try {
      const abs = new URL(u, window.location.href);
      if (abs.origin === window.location.origin) return "same";
      if (abs.protocol === "data:" || abs.protocol === "blob:") return "inline";
      return "external";
    } catch (e) {
      // An unparseable url cannot reach the network from a browser context; treat it as inline and let
      // the wrapped call produce whatever error it would have produced anyway.
      return "inline";
    }
  }

  function classifySelfTest(): string {
    const cases: Array<[string, string]> = [
      ["https://example.test/a.png", "external"],
      ["//cdn.example.test/lib.js", "external"],
      [window.location.origin + "/x", "same"],
      ["/assets/y.js", "same"],
      ["data:image/png;base64,AAAA", "inline"],
      ["blob:" + window.location.origin + "/zz", "inline"],
      ["", "empty"],
    ];
    for (let i = 0; i < cases.length; i += 1) {
      if (classify(cases[i][0]) !== cases[i][1]) return "mismatch@" + i + ":" + classify(cases[i][0]);
    }
    return "ok";
  }

  function hostOf(rawUrl: unknown): string {
    try {
      return new URL(String(rawUrl), window.location.href).host;
    } catch (e) {
      return "unparseable";
    }
  }

  // via: 'fetch' | 'xhr' | 'beacon' | 'window.open' | 'EventSource' | 'WebSocket' | 'dom'
  function tally(rawUrl: unknown, via: string): void {
    const kind = classify(rawUrl);
    if (kind === "external") {
      egressCount += 1;
      const h = hostOf(rawUrl);
      egressHosts[h] = (egressHosts[h] || 0) + 1;
      if (via === "dom") domResourceEgressCount += 1;
    } else if (kind === "same") {
      if (via === "fetch" || via === "xhr" || via === "beacon" || via === "window.open") sameOriginCount += 1;
    }
  }

  // ---------------------------------------------------------------- boot storage reset (recipe R3)
  function resetStorage(): void {
    let ok = true;
    try {
      window.localStorage.clear();
    } catch (e) {
      ok = false;
    }
    try {
      window.sessionStorage.clear();
    } catch (e) {
      ok = false;
    }
    storageResetOk = ok;
  }

  function dropServiceWorkers(): void {
    try {
      const nav = window.navigator as Navigator | undefined;
      if (nav && nav.serviceWorker && typeof nav.serviceWorker.getRegistrations === "function") {
        nav.serviceWorker.getRegistrations().then(
          (regs) => {
            swRegistrations = regs ? regs.length : 0;
            for (let i = 0; i < (regs ? regs.length : 0); i += 1) {
              try {
                regs[i].unregister();
              } catch (e) {
                /* one failed unregister */
              }
            }
          },
          () => {
            /* getRegistrations rejected */
          },
        );
      }
      if (W.caches && typeof W.caches.keys === "function") {
        Promise.resolve(W.caches.keys()).then(
          (ks: string[]) => {
            for (let i = 0; i < (ks ? ks.length : 0); i += 1) {
              try {
                W.caches.delete(ks[i]);
              } catch (e) {
                /* one failed delete */
              }
            }
          },
          () => {
            /* Cache Storage unsupported */
          },
        );
      }
    } catch (e) {
      /* Cache Storage unsupported */
    }
  }

  // ---------------------------------------------------------------- wrappers (count, never change)
  function wrapFetch(): boolean {
    try {
      const original = window.fetch;
      if (typeof original !== "function") return false;
      W.fetch = function (this: any, input: any, init?: any) {
        try {
          tally(typeof input === "string" ? input : input && input.url ? input.url : input, "fetch");
        } catch (e) {
          /* tally never blocks the call */
        }
        return original.apply(this, arguments as any);
      };
      return true;
    } catch (e) {
      return false;
    }
  }

  function wrapXhr(): boolean {
    try {
      const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
      if (!proto || typeof proto.open !== "function") return false;
      const original = proto.open;
      (proto as any).open = function (this: XMLHttpRequest, method: any, url: any) {
        try {
          tally(url, "xhr");
        } catch (e) {
          /* tally never blocks the call */
        }
        return (original as any).apply(this, arguments as any);
      };
      return true;
    } catch (e) {
      return false;
    }
  }

  function wrapSendBeacon(): boolean {
    try {
      const nav = window.navigator as any;
      if (!nav || typeof nav.sendBeacon !== "function") return false;
      const original = nav.sendBeacon;
      nav.sendBeacon = function (url: any, data?: any) {
        try {
          tally(url, "beacon");
        } catch (e) {
          /* tally never blocks the call */
        }
        return original.apply(this, arguments as any);
      };
      return true;
    } catch (e) {
      return false;
    }
  }

  function wrapWindowOpen(): boolean {
    try {
      const original = window.open;
      if (typeof original !== "function") return false;
      W.open = function (this: any, url?: any, target?: any, features?: any) {
        try {
          tally(url, "window.open");
        } catch (e) {
          /* tally never blocks the call */
        }
        return original.apply(this, arguments as any);
      };
      return true;
    } catch (e) {
      return false;
    }
  }

  function wrapPropSetter(ctor: any, prop: string): boolean {
    try {
      if (!ctor || !ctor.prototype) return false;
      const descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, prop);
      if (!descriptor || typeof descriptor.set !== "function") return false;
      const originalSet = descriptor.set;
      const originalGet = descriptor.get;
      Object.defineProperty(ctor.prototype, prop, {
        configurable: true,
        enumerable: descriptor.enumerable,
        get: originalGet,
        set(this: unknown, value: unknown) {
          try {
            tally(value, "dom");
          } catch (e) {
            /* tally never blocks the call */
          }
          return originalSet.call(this, value as any);
        },
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function wrapCtor(name: string): boolean {
    try {
      const Original = W[name];
      if (typeof Original !== "function") return false;
      const wrapped = function (this: any, url: any, protocols?: any) {
        try {
          tally(url, name);
        } catch (e) {
          /* tally never blocks the call */
        }
        return protocols === undefined ? new Original(url) : new Original(url, protocols);
      };
      wrapped.prototype = Original.prototype;
      (wrapped as any).__rbOriginal = Original;
      W[name] = wrapped;
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------------------------------------------------------------- listeners
  function watchErrors(): void {
    try {
      window.addEventListener(
        "error",
        () => {
          errorCount += 1;
        },
        true,
      );
      window.addEventListener("unhandledrejection", () => {
        errorCount += 1;
      });
    } catch (e) {
      /* listener installation is best effort */
    }
  }

  function watchLoad(): void {
    try {
      if (D.readyState === "complete") loadFired = true;
      window.addEventListener("load", () => {
        loadFired = true;
      });
    } catch (e) {
      /* listener installation is best effort */
    }
  }

  // ---------------------------------------------------------------- surface
  function storageLength(): number {
    let n = 0;
    try {
      n = window.localStorage.length;
    } catch (e) {
      return -1;
    }
    return n;
  }

  function storageKeyList(): string[] {
    const out: string[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const k = window.localStorage.key(i);
        if (k !== null) out.push(k);
      }
    } catch (e) {
      return [];
    }
    out.sort();
    return out;
  }

  function sessionKeyList(): string[] {
    const out: string[] = [];
    try {
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const k = window.sessionStorage.key(i);
        if (k !== null) out.push(k);
      }
    } catch (e) {
      return [];
    }
    out.sort();
    return out;
  }

  const surface = {
    version: (): string => VERSION,
    ready: (): string => (bootComplete ? "true" : "false"),
    frameReady: (): string => {
      try {
        const host = D.getElementById("root");
        return host && host.childElementCount > 0 ? "true" : "false";
      } catch (e) {
        return "ERR";
      }
    },
    loadFired: (): string => (loadFired ? "true" : "false"),
    navLang: (): string => {
      try {
        return String((D.documentElement && D.documentElement.lang) || "");
      } catch (e) {
        return "ERR";
      }
    },
    hookCount: (): string => String(hookCount),
    classifySelfTest: (): string => {
      try {
        return classifySelfTest();
      } catch (e) {
        return "ERR";
      }
    },
    egressCount: (): string => String(egressCount),
    egressHosts: (): string => {
      const out: string[] = [];
      for (const k in egressHosts) {
        if (Object.prototype.hasOwnProperty.call(egressHosts, k)) out.push(k);
      }
      out.sort();
      return out.join(",");
    },
    sameOriginCount: (): string => String(sameOriginCount),
    domResourceEgressCount: (): string => String(domResourceEgressCount),
    testidCount: (): string => {
      try {
        return String(D.querySelectorAll("[data-testid]").length);
      } catch (e) {
        return "ERR";
      }
    },
    swCount: (): string => {
      let n = swRegistrations;
      try {
        const nav = window.navigator as any;
        if (nav && nav.serviceWorker && nav.serviceWorker.controller) n += 1;
      } catch (e) {
        /* unsupported */
      }
      return String(n);
    },
    errorCount: (): string => String(errorCount),
    storageKeys: (): string => storageKeyList().join(","),
    storageKeyCount: (): string => String(storageLength()),
    sessionStorageKeys: (): string => sessionKeyList().join(","),
    cookieCount: (): string => {
      try {
        const c = String(D.cookie || "");
        return c === "" ? "0" : String(c.split(";").filter((x) => x.trim() !== "").length);
      } catch (e) {
        return "ERR";
      }
    },
    unexpectedGlobals: (): string => {
      try {
        return Object.getOwnPropertyNames(window)
          .filter((k) => k.indexOf("__") === 0 && k !== "__rb")
          .sort()
          .join(",");
      } catch (e) {
        return "ERR";
      }
    },
    storageResetAtBoot: (): string => (storageResetOk ? "true" : "false"),
    mountChildCount: (): string => {
      try {
        const host = D.getElementById("root");
        return host ? String(host.childElementCount) : "-1";
      } catch (e) {
        return "ERR";
      }
    },
  };

  watchErrors();
  watchLoad();
  resetStorage();
  dropServiceWorkers();
  if (wrapFetch()) hookCount += 1;
  if (wrapXhr()) hookCount += 1;
  if (wrapSendBeacon()) hookCount += 1;
  if (wrapWindowOpen()) hookCount += 1;
  if (wrapPropSetter(W.HTMLImageElement, "src")) hookCount += 1;
  if (wrapPropSetter(W.HTMLIFrameElement, "src")) hookCount += 1;
  if (wrapPropSetter(W.HTMLScriptElement, "src")) hookCount += 1;
  if (wrapPropSetter(W.HTMLLinkElement, "href")) hookCount += 1;
  if (wrapCtor("EventSource")) hookCount += 1;
  if (wrapCtor("WebSocket")) hookCount += 1;

  try {
    Object.defineProperty(W, "__rb", { value: surface, writable: true, configurable: true, enumerable: true });
  } catch (e) {
    W.__rb = surface;
  }
  bootComplete = true;
})();
