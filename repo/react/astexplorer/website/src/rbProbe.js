/**
 * Repair-Bench read-only observation probe for repair-react__astexplorer-01.
 *
 * Added by environment/instrumentation.patch, which also inserts
 * `import './rbProbe.js';` as the FIRST import of website/src/app.js, so this
 * module is evaluated before any other application module.
 *
 * NEUTRALITY CONTRACT (this file is deliberately NOT part of the tested surface):
 *  - It renders nothing and adds no element, no class, no attribute and ZERO
 *    data-testid to the document; window.__rb.domTestidCount is published so a
 *    reader can verify that claim on the running page instead of trusting it.
 *  - It never touches application state: no redux dispatch, no localStorage /
 *    sessionStorage write that survives the install, no history or URL write, no
 *    observable timer, and no prototype belonging to the application is patched.
 *  - Every transport wrapper is strictly pass-through: same arguments, same
 *    return value, same receiver, and exceptions are never swallowed. Only the
 *    recording itself sits inside a try/catch.
 *  - It counts ONLY uncaught errors: a window 'error' event whose target is the
 *    window (not an element), plus 'unhandledrejection'. console.error and
 *    console.warn are deliberately NOT counted, because that is where React 16
 *    puts its development warnings; a defect that merely provokes a React
 *    warning therefore cannot move any probe reading.
 *  - Element-level load failures are counted separately (resourceErrorCount) so
 *    an offline-face regression cannot hide inside the application error count.
 *  - Every published value is a STRING scalar recomputed on read, because the
 *    official runner (evaluation/dsl_runner.mjs evalAssert -> assertEq loose ==)
 *    compares an object or array expectation as always-false.
 *
 * The seed ships exactly ONE transport call site, website/src/storage/api.js:6
 * `fetch(API_HOST + '/api/v1' + path)`, and webpack.config.js:13-15 defines
 * process.env.API_HOST as '' at build time, so that call is same-origin AND is
 * only reachable from a save / share / snippet action that no checkpoint
 * performs. There is no WebSocket, EventSource, navigator.sendBeacon or
 * window.open call anywhere under website/src (verified by grep at design time);
 * those three are still wrapped defensively because wrapping them is free, while
 * EventSource / WebSocket constructors are NOT redefined - replacing a native
 * constructor with a plain function would break `new` and `instanceof` for code
 * this probe has no business touching.
 */
(function installRBProbe() {
  if (typeof window === 'undefined') {
    return;
  }
  if (window.__rbInstalled) {
    return;
  }
  window.__rbInstalled = true;

  var VERSION = 'rbprobe-astexplorer-1';
  var egress = [];
  var hosts = [];
  var windowOpened = 0;
  var errorCount = 0;
  var errorText = '';
  var resourceErrorCount = 0;
  var resourceErrorSample = '';
  var storageWritable = false;

  function external(url) {
    try {
      var u = new URL(String(url), window.location.href);
      if (u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'about:') {
        return false;
      }
      return u.origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }

  function hostOf(url) {
    try {
      return new URL(String(url), window.location.href).host;
    } catch (e) {
      return '';
    }
  }

  function note(kind, url) {
    if (!external(url)) {
      return;
    }
    egress.push(kind + ' ' + String(url));
    var h = hostOf(url);
    if (h && hosts.indexOf(h) === -1) {
      hosts.push(h);
    }
  }

  // --- transports: pass-through wrappers -------------------------------
  if (typeof window.fetch === 'function') {
    var boundFetch = window.fetch.bind(window);
    window.fetch = function rbFetch(input) {
      try {
        note('fetch', typeof input === 'string' ? input : ((input && input.url) || ''));
      } catch (e) { /* recording must never break the call */ }
      return boundFetch.apply(null, arguments);
    };
  }

  if (window.XMLHttpRequest && typeof window.XMLHttpRequest.prototype.open === 'function') {
    var nativeXhrOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function rbXhrOpen(method, url) {
      try {
        note('xhr', url);
      } catch (e) { /* recording must never break the call */ }
      return nativeXhrOpen.apply(this, arguments);
    };
  }

  if (window.navigator && typeof window.navigator.sendBeacon === 'function') {
    var boundBeacon = window.navigator.sendBeacon.bind(window.navigator);
    window.navigator.sendBeacon = function rbSendBeacon(url) {
      try {
        note('beacon', url);
      } catch (e) { /* recording must never break the call */ }
      return boundBeacon.apply(null, arguments);
    };
  }

  if (typeof window.open === 'function') {
    var boundOpen = window.open.bind(window);
    window.open = function rbWindowOpen(url) {
      windowOpened += 1;
      try {
        note('window.open', url);
      } catch (e) { /* recording must never break the call */ }
      return boundOpen.apply(null, arguments);
    };
  }

  // --- errors: uncaught only, never preventDefault, never stopPropagation --
  window.addEventListener('error', function rbOnError(event) {
    try {
      var t = event && event.target;
      if (t && t !== window && (t.src !== undefined || t.href !== undefined)) {
        resourceErrorCount += 1;
        if (!resourceErrorSample) {
          resourceErrorSample = String(t.src || t.href || '').slice(0, 160);
        }
        return;
      }
      errorCount += 1;
      if (!errorText) {
        errorText = String(
          (event && (event.message || (event.error && event.error.message))) || 'uncaught error'
        ).slice(0, 160);
      }
    } catch (e) { /* recording must never break the page */ }
  }, true);

  window.addEventListener('unhandledrejection', function rbOnRejection(event) {
    try {
      errorCount += 1;
      if (!errorText) {
        errorText = String(
          (event && event.reason && (event.reason.message || event.reason)) || 'unhandled rejection'
        ).slice(0, 160);
      }
    } catch (e) { /* recording must never break the page */ }
  });

  // --- one-shot storage capability probe (runs at install, leaves no key) ---
  try {
    var probeKey = '__rb_probe_capability__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    storageWritable = true;
  } catch (e) {
    storageWritable = false;
  }

  // --- DOM census of external subresource references ---------------------
  // `a[href]` is deliberately EXCLUDED: the seed renders seven documentation
  // anchors in the #contribution footer (website/index.ejs:15-23) and one help
  // anchor plus one parser-homepage anchor in the toolbar. An anchor loads
  // nothing until it is activated, and no checkpoint activates one, so counting
  // them would report egress that does not exist. Everything that CAN pull bytes
  // on its own is counted.
  var CENSUS_SELECTOR =
    'link[href],script[src],img[src],iframe[src],audio[src],video[src],source[src],embed[src],object[data]';

  function extRefs() {
    var out = [];
    var els;
    try {
      els = document.querySelectorAll(CENSUS_SELECTOR);
    } catch (e) {
      return out;
    }
    for (var i = 0; i < els.length; i += 1) {
      var el = els[i];
      var url = el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('data') || '';
      if (url && external(url)) {
        out.push(String(url));
      }
    }
    return out;
  }

  function storageKeys() {
    try {
      return Object.keys(window.localStorage).sort();
    } catch (e) {
      return null;
    }
  }

  var rb = {
    get ready() { return 'true'; },
    get probeVersion() { return VERSION; },
    get egressCount() { return String(egress.length); },
    get egressSample() { return egress.length ? String(egress[0]).slice(0, 160) : ''; },
    get netHosts() { return hosts.slice().sort().join(','); },
    get windowOpened() { return String(windowOpened); },
    get errorCount() { return String(errorCount); },
    get errorText() { return errorText; },
    get resourceErrorCount() { return String(resourceErrorCount); },
    get resourceErrorSample() { return resourceErrorSample; },
    get extRefsCount() { return String(extRefs().length); },
    get extRefsSample() {
      var refs = extRefs();
      return refs.length ? String(refs[0]).slice(0, 160) : '';
    },
    get storageWritable() { return storageWritable ? 'true' : 'false'; },
    get storageKeys() {
      var keys = storageKeys();
      return keys === null ? 'ERR' : keys.join(',');
    },
    get foreignStorageKeys() {
      var keys = storageKeys();
      if (keys === null) {
        return 'ERR';
      }
      var own = ['explorerSettingsV1', 'tree_settings'];
      return keys.filter(function (k) { return own.indexOf(k) === -1; }).join(',');
    },
    get hash() { return String(window.location.hash); },
    get route() {
      return String(window.location.pathname + window.location.search + window.location.hash);
    },
    get domTestidCount() {
      try {
        return String(document.querySelectorAll('[data-testid]').length);
      } catch (e) {
        return 'ERR';
      }
    },
    get viewport() {
      return String(window.innerWidth + 'x' + window.innerHeight);
    },
  };

  Object.defineProperty(window, '__rb', {
    configurable: false,
    enumerable: true,
    get: function () { return rb; },
  });
})();
