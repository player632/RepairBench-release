// rb-probe.js - RepairBench measurement probe for repair-vue__avatar-maker-01. INSTRUMENTATION ONLY.
//
// Shipped by environment/instrumentation.patch as ONE new file plus ONE import as the first line of
// src/main.js (gate src/main.js:1 is `import Vue from 'vue';`), so every wrapper below is installed
// before any component module body runs - in particular before src/App.vue:112-116 `mounted()`
// attaches its own `window.addEventListener('load', ...)` and before src/components/save_image.vue:79
// calls `canvas.getContext('2d')`.
//
// WHAT IT PUBLISHES - window.__rb, 26 zero-argument functions that each return a STRING scalar
// (never an object, never a number: evaluation/dsl_runner.mjs compares js_eval results with a loose
// `==` against tests/dsl.json's `expected`, so a non-scalar would silently compare false):
//   version()              this probe's own literal, so a stale or absent instrumentation can never
//                          turn a sentinel into a 'no-probe' pass (asserted by P01/P03/P04).
//   ready()                'true' once the synchronous boot sequence finished (storage reset, error
//                          and load listeners, 12 wrappers installed, __rb published). The
//                          service-worker cleanup is deliberately fire-and-forget and NOT part of it.
//   frameReady()           'true' once #app has at least one child element, i.e. the Vue root really
//                          mounted (public/index.html:14 `<div id="app"></div>` is the only mount).
//   loadFired()            'true' once the window 'load' event was observed (or readyState was
//                          already 'complete'). This is the readiness gate every checkpoint polls on,
//                          because App.vue:113 hangs randomAvatar() off that very event.
//   navLang()              document.documentElement.lang - vue-meta writes 'en' from App.vue:47-49
//                          htmlAttrs. NOT navigator.language, which follows the browser locale
//                          ('en-US' under tests/dsl.json's context) and is therefore not seed-owned.
//   hookCount()            how many of the 12 wrappers actually installed. THE instrument-alive
//                          control for this seed: see sameOriginCount() below for why a traffic-based
//                          control would be vacuous here.
//   classifySelfTest()     'ok' when the origin classifier returns the expected verdict for seven
//                          baked-in probe inputs (absolute cross-origin, protocol-relative
//                          cross-origin, absolute same-origin, root-relative same-origin, data:,
//                          blob:, empty). Proves egressCount()=='0' is a measurement and not a
//                          classifier that classifies nothing. Issues no request.
//   egressCount()          requests/DOM-resource assignments whose url resolves to an origin other
//                          than the served one. Asserted '0' by P03.
//   egressHosts()          the distinct external hosts seen, comma-joined and sorted ('' when none).
//   sameOriginCount()      same-origin requests seen through the four REQUEST wrappers. EXPECTED '0'
//                          on this seed and deliberately NOT used as the alive control: avatar-maker
//                          issues no fetch/XHR/beacon at all, and its images reach the DOM either as
//                          webpack `require()` results under url-loader's 4096 B inline limit
//                          (src/assets/img/download.svg 465 B, clear.svg 1063 B, random.svg 2088 B ->
//                          `data:` URLs, i.e. no request) or through a Vue-rendered ATTRIBUTE
//                          (src/components/footer.vue:4,6, save_image.vue:3, layout/githubIcon.vue:6),
//                          which goes through Element.setAttribute and never touches a prototype
//                          property setter. So a 'same-origin traffic seen' control would be false.
//   domResourceEgressCount() external URLs assigned through the four DOM property setters
//                          (img/iframe/script `.src`, link `.href`). Expected '0'.
//   testidCount()          number of [data-testid] elements. Asserted '0': this probe adds none and
//                          the seed has none, so a hack fix that injects a testid hook is visible.
//   swCount()              service-worker registrations found at boot plus 1 if a controller already
//                          controls this document. Asserted '0' by P03 (the seed registers none).
//   errorCount()           window 'error' + 'unhandledrejection' events. console.* is NOT hooked:
//                          Vue 2.6.11 reports component warnings through console.error, and hooking
//                          it would redden a sentinel no defect owns. Only asserted '0' in the
//                          checkpoints whose setup performs no user action (P03, F05, F08, F11):
//                          App.vue:94/:106 legitimately throw once src/components/layout/mouths.vue:85
//                          is mutated, so any checkpoint that presses clear or the dice records one.
//   contextSeen()          'true' once HTMLCanvasElement.prototype.getContext ran - the proof that
//                          save_image.vue:79 was reached, which is what makes firstCanvasWidth() and
//                          firstCanvasHeight() meaningful rather than merely empty.
//   firstCanvasWidth()     this.width of the FIRST canvas that ever asked for a context, as a string
//                          ('' until then). save_image.vue:76-79 creates the export canvas with
//                          document.createElement('canvas'), sizes it at :77/:78 and only then calls
//                          getContext, so this is the export canvas's real width. That canvas is never
//                          attached to the document, so no selector or layout read can see it.
//   firstCanvasHeight()    the same for this.height at that first getContext.
//   lastCanvasWidth()      this.width at the most recent getContext.
//   lastCanvasHeight()     this.height at the most recent getContext.
//   canvasCount()          how many times getContext ran in total. A diagnostic, deliberately not
//                          asserted: if it reads > 1 after a single download click then canvg created
//                          a canvas of its own, which is exactly the case maxCanvas*() is robust to.
//   maxCanvasWidth()       the LARGEST this.width seen at any getContext, as a string ('' until the
//                          first one). THIS is what F06 asserts, not firstCanvasWidth(). Reason:
//                          src/components/save_image.vue:8 statically imports canvg@3.0.7
//                          (package.json:16, package-lock.json:1496), so canvg's module body runs at
//                          bundle evaluation, i.e. BEFORE any click. Whether canvg 3.0.7 touches a
//                          canvas while it initialises is NOT decidable from this design seat - canvg
//
//
//                          guess: if canvg did create one, firstCanvasWidth() would read canvg's
//                          default 300 in BOTH the clean and the delivered tree and F06 would never go
//                          red. 'max' is robust either way, because the export canvas is the only
//                          large canvas in the page: the ten layer SVGs carry 0 <pattern>, 0
//                          <linearGradient>, 0 <radialGradient>, 0 <filter>, 0 <clipPath>, 0 <mask>,
//                          0 <image> and 0 <use> elements (measured over src/components/layout/ and
//                          src/components/options/), which are the only canvg 3 code paths that create
//                          an offscreen canvas during render. Registered as RECIPE.cold_test_items
//                          and as meta.notes.canvg_static_analysis; the lane can confirm it by reading
//                          canvasCount() and firstCanvasWidth() out of a real run.
//   maxCanvasHeight()      the same for this.height. THIS is what F07 asserts.
//   dataUrlCount()         how many times toDataURL returned.
//   lastDataUrlMime()      the MIME type parsed out of the most recent `data:` URL header.
//   lastDataUrlPrefix()    the most recent data-URL header up to (not including) the first comma,
//                          capped at 64 characters. The payload itself is never retained: a
//                          1200x1200 PNG data URL is ~2 MB and would bloat every assert.
//   storageCount()         localStorage.length + sessionStorage.length, read live. Asserted '0' by
//
//
// NEUTRALITY: it renders nothing, creates no element that stays in the document, adds no data-testid,
// holds no selector / id / class / numeric constant belonging to any of the 12 injected defects, and
// never writes application state. Its only mutations are defensive and state-CLEARING: localStorage
// and sessionStorage are emptied and any service worker / Cache Storage entry is dropped at boot, so
// every measurement starts from a clean slate. All 12 wrappers only OBSERVE and then call through to
// the original with the original arguments and receiver.
//
// SYNTAX CONSTRAINT: ES2017 only - no optional chaining, no nullish coalescing, no class fields, no
// object spread, no `let`/`const` in a position a pre-ES2015 parser would reject. Reason: the gate
// declares NO @vue/cli-plugin-babel (package.json:14-20 devDependencies are only @vue/cli-service,
// canvg, sass, sass-loader, vue-template-compiler), so nothing transpiles .js downward, and the
// parser that has to accept this file is webpack 4.42.0's acorn (package-lock.json:10188), which
// stops at ES2019. Everything below therefore stays inside ES2017 and uses `var` + `arguments`
// throughout, so the file is also readable by an ES5 engine.
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') { return; }

  var W = window;
  var D = document;
  var VERSION = 'avatar-maker-rb-probe-1';

  var ORIGIN = '';
  try { ORIGIN = String((W.location && W.location.origin) || ''); } catch (e) { ORIGIN = ''; }

  var egressCount = 0;
  var sameOriginCount = 0;
  var domResourceEgressCount = 0;
  var errorCount = 0;
  var hookCount = 0;
  var dataUrlCount = 0;
  var swRegistrations = 0;
  var contextSeen = false;
  var loadFired = false;
  var bootComplete = false;
  var lastDataUrlMime = '';
  var lastDataUrlPrefix = '';
  var firstCanvasWidth = '';
  var firstCanvasHeight = '';
  var lastCanvasWidth = '';
  var lastCanvasHeight = '';
  var maxCanvasWidth = '';
  var maxCanvasHeight = '';
  var canvasCount = 0;
  var egressHosts = {};

  // Resolve whatever a caller handed us (string url, URL, Request, anchor) onto an absolute href, or
  // '' when it cannot be resolved. Never throws: a probe that throws would break the page it measures.
  function hrefOf(input) {
    try {
      if (typeof input === 'string') {
        if (!input) { return ''; }
        if (/^\/\//.test(input)) {
          return String((W.location && W.location.protocol) || 'http:') + input;
        }
        if (/^[a-z][a-z0-9+.\-]*:/i.test(input)) { return input; }
        if (!ORIGIN || typeof W.URL !== 'function') { return ''; }
        return new W.URL(input, ORIGIN).href;
      }
      if (input && typeof input === 'object') {
        if (typeof input.url === 'string') { return hrefOf(input.url); }
        if (typeof input.href === 'string') { return hrefOf(input.href); }
      }
      return '';
    } catch (e) { return ''; }
  }

  var IGNORED_SCHEME = /^(?:data|blob|about|javascript|file):/i;

  // 'external' | 'same' | 'ignored' | 'other' | 'unresolved'
  function classify(href) {
    if (!href) { return 'unresolved'; }
    if (IGNORED_SCHEME.test(href)) { return 'ignored'; }
    if (!/^https?:\/\//i.test(href)) { return 'other'; }
    if (!ORIGIN || typeof W.URL !== 'function') { return 'external'; }
    var o = '';
    try { o = new W.URL(href).origin; } catch (e) { o = ''; }
    return (o && o === ORIGIN) ? 'same' : 'external';
  }

  function hostOf(href) {
    try { return new W.URL(href).host; } catch (e) { return String(href).slice(0, 120); }
  }

  // via: 'fetch' | 'xhr' | 'beacon' | 'window.open' | 'EventSource' | 'WebSocket' | 'dom'
  function tally(input, via) {
    var href = hrefOf(input);
    var kind = classify(href);
    if (kind === 'external') {
      egressCount += 1;
      if (via === 'dom') { domResourceEgressCount += 1; }
      egressHosts[hostOf(href)] = true;
    } else if (kind === 'same' && via !== 'dom') {
      sameOriginCount += 1;
    }
    return kind;
  }

  function classifySelfTest() {
    var cases = [
      ['https://rb-probe.invalid/a.png', 'external'],
      ['//rb-probe.invalid/b.js', 'external'],
      ['/favicon.png', 'same'],
      ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB', 'ignored'],
      ['', 'unresolved']
    ];
    if (ORIGIN) {
      cases.push([ORIGIN + '/favicon.png', 'same']);
      cases.push(['blob:' + ORIGIN + '/c3d1', 'ignored']);
    } else {
      cases.push(['blob:http://rb-probe.invalid/c3d1', 'ignored']);
      cases.push(['http://rb-probe.invalid/c', 'external']);
    }
    for (var i = 0; i < cases.length; i += 1) {
      var got = classify(hrefOf(cases[i][0]));
      if (got !== cases[i][1]) { return 'MISMATCH@' + i + ':' + got + '!=' + cases[i][1]; }
    }
    return 'ok';
  }

  // --- the four request-side wrappers ---
  function wrapFetch() {
    if (typeof W.fetch !== 'function') { return false; }
    var original = W.fetch;
    W.fetch = function (input) { tally(input, 'fetch'); return original.apply(W, arguments); };
    return true;
  }

  function wrapXhr() {
    var C = W.XMLHttpRequest;
    if (!C || !C.prototype || typeof C.prototype.open !== 'function') { return false; }
    var original = C.prototype.open;
    C.prototype.open = function (method, url) { tally(url, 'xhr'); return original.apply(this, arguments); };
    return true;
  }

  function wrapSendBeacon() {
    var nav = W.navigator;
    if (!nav || typeof nav.sendBeacon !== 'function') { return false; }
    var original = nav.sendBeacon;
    nav.sendBeacon = function (url) { tally(url, 'beacon'); return original.apply(nav, arguments); };
    return true;
  }

  function wrapWindowOpen() {
    if (typeof W.open !== 'function') { return false; }
    var original = W.open;
    W.open = function (url) { if (url !== undefined && url !== null) { tally(url, 'window.open'); } return original.apply(W, arguments); };
    return true;
  }

  // --- the four DOM resource-property setters ---
  // A prototype accessor is replaced in place, keeping the ORIGINAL getter, so reading `.src` still
  // returns the resolved absolute url the browser computed. Vue 2 renders `:src` through
  // Element.setAttribute (src/platforms/web/runtime/modules/attrs.js: mustUseProp covers only
  // value/selected/checked/muted), so these setters fire only for imperative assignments - which is
  // exactly the class a hack fix would use.
  function wrapPropSetter(ctor, prop, via) {
    if (!ctor || !ctor.prototype) { return false; }
    var d = Object.getOwnPropertyDescriptor(ctor.prototype, prop);
    if (!d || typeof d.set !== 'function' || typeof d.get !== 'function') { return false; }
    var originalSet = d.set;
    try {
      Object.defineProperty(ctor.prototype, prop, {
        configurable: true,
        enumerable: d.enumerable,
        get: d.get,
        set: function (v) { tally(v, via); return originalSet.call(this, v); }
      });
    } catch (e) { return false; }
    return true;
  }

  // --- the two constructor wrappers ---
  // Reflect.construct keeps the real prototype chain and the real return value; assigning `prototype`
  // makes `new Wrapped(...)` and `instanceof` behave for callers that construct directly.
  function wrapCtor(name) {
    var C = W[name];
    if (typeof C !== 'function' || typeof Reflect === 'undefined' || typeof Reflect.construct !== 'function') { return false; }
    var patched = function () { tally(arguments[0], name); return Reflect.construct(C, arguments); };
    try { patched.prototype = C.prototype; } catch (e) { /* read-only prototype: harmless */ }
    W[name] = patched;
    return true;
  }

  // --- the two canvas wrappers (the only way save_image.vue's off-DOM export canvas is observable) ---
  function wrapCanvas() {
    var C = W.HTMLCanvasElement;
    var n = 0;
    if (!C || !C.prototype) { return n; }
    if (typeof C.prototype.getContext === 'function') {
      var og = C.prototype.getContext;
      C.prototype.getContext = function () {
        try {
          contextSeen = true;
          var w = String(this.width);
          var h = String(this.height);
          canvasCount += 1;
          if (firstCanvasWidth === '') { firstCanvasWidth = w; firstCanvasHeight = h; }
          lastCanvasWidth = w;
          lastCanvasHeight = h;
          if (maxCanvasWidth === '' || Number(w) > Number(maxCanvasWidth)) { maxCanvasWidth = w; }
          if (maxCanvasHeight === '' || Number(h) > Number(maxCanvasHeight)) { maxCanvasHeight = h; }
        } catch (e) { /* a canvas with no width still gets its context */ }
        return og.apply(this, arguments);
      };
      n += 1;
    }
    if (typeof C.prototype.toDataURL === 'function') {
      var ot = C.prototype.toDataURL;
      C.prototype.toDataURL = function () {
        var out = ot.apply(this, arguments);
        try {
          dataUrlCount += 1;
          var s = String(out);
          var comma = s.indexOf(',');
          var head = comma >= 0 ? s.slice(0, comma) : s.slice(0, 64);
          lastDataUrlPrefix = head.slice(0, 64);
          var m = /^data:([^;,]*)/.exec(head);
          lastDataUrlMime = m ? m[1] : '';
        } catch (e) { /* keep the original return value no matter what */ }
        return out;
      };
      n += 1;
    }
    return n;
  }

  // --- crash sentinels (window level only; console.* deliberately untouched, see errorCount above) ---
  function watchErrors() {
    try {
      W.addEventListener('error', function () { errorCount += 1; });
      W.addEventListener('unhandledrejection', function () { errorCount += 1; });
    } catch (e) { /* no addEventListener: nothing to watch */ }
  }

  function watchLoad() {
    try {
      if (D.readyState === 'complete') { loadFired = true; }
      W.addEventListener('load', function () { loadFired = true; });
    } catch (e) { /* no addEventListener: loadFired stays 'false' and the ready-poll times out loudly */ }
  }

  // --- clean slate: storage reset + defensive service-worker / Cache Storage cleanup ---
  function storageLength() {
    var n = 0;
    try { if (W.localStorage) { n += W.localStorage.length; } } catch (e) { /* opaque origin */ }
    try { if (W.sessionStorage) { n += W.sessionStorage.length; } } catch (e) { /* opaque origin */ }
    return n;
  }

  function resetStorage() {
    try { if (W.localStorage) { W.localStorage.clear(); } } catch (e) { /* opaque origin or disabled */ }
    try { if (W.sessionStorage) { W.sessionStorage.clear(); } } catch (e) { /* opaque origin or disabled */ }
  }

  function dropServiceWorkers() {
    try {
      var sw = W.navigator && W.navigator.serviceWorker;
      if (sw && typeof sw.getRegistrations === 'function') {
        Promise.resolve(sw.getRegistrations()).then(function (regs) {
          swRegistrations = (regs && typeof regs.length === 'number') ? regs.length : 0;
          for (var i = 0; i < swRegistrations; i += 1) {
            try { if (regs[i] && typeof regs[i].unregister === 'function') { regs[i].unregister(); } } catch (e) { /* one failed unregister */ }
          }
        }, function () { swRegistrations = 0; });
      }
    } catch (e) { /* service workers unsupported or blocked */ }
    try {
      if (W.caches && typeof W.caches.keys === 'function') {
        Promise.resolve(W.caches.keys()).then(function (keys) {
          for (var i = 0; i < (keys ? keys.length : 0); i += 1) {
            try { W.caches['delete'](keys[i]); } catch (e) { /* one failed delete */ }
          }
        }, function () { /* Cache Storage unsupported */ });
      }
    } catch (e) { /* Cache Storage unsupported */ }
  }

  var surface = {
    version: function () { return VERSION; },
    ready: function () { return bootComplete ? 'true' : 'false'; },
    frameReady: function () {
      try {
        var host = D.getElementById('app');
        return (host && host.childElementCount > 0) ? 'true' : 'false';
      } catch (e) { return 'ERR'; }
    },
    loadFired: function () { return loadFired ? 'true' : 'false'; },
    navLang: function () {
      try { return String((D.documentElement && D.documentElement.lang) || ''); } catch (e) { return 'ERR'; }
    },
    hookCount: function () { return String(hookCount); },
    classifySelfTest: function () {
      try { return classifySelfTest(); } catch (e) { return 'ERR'; }
    },
    egressCount: function () { return String(egressCount); },
    egressHosts: function () {
      var out = [];
      for (var k in egressHosts) { if (Object.prototype.hasOwnProperty.call(egressHosts, k)) { out.push(k); } }
      out.sort();
      return out.join(',');
    },
    sameOriginCount: function () { return String(sameOriginCount); },
    domResourceEgressCount: function () { return String(domResourceEgressCount); },
    testidCount: function () {
      try { return String(D.querySelectorAll('[data-testid]').length); } catch (e) { return 'ERR'; }
    },
    swCount: function () {
      var n = swRegistrations;
      try { if (W.navigator && W.navigator.serviceWorker && W.navigator.serviceWorker.controller) { n += 1; } } catch (e) { /* unsupported */ }
      return String(n);
    },
    errorCount: function () { return String(errorCount); },
    contextSeen: function () { return contextSeen ? 'true' : 'false'; },
    firstCanvasWidth: function () { return firstCanvasWidth; },
    firstCanvasHeight: function () { return firstCanvasHeight; },
    lastCanvasWidth: function () { return lastCanvasWidth; },
    lastCanvasHeight: function () { return lastCanvasHeight; },
    canvasCount: function () { return String(canvasCount); },
    maxCanvasWidth: function () { return maxCanvasWidth; },
    maxCanvasHeight: function () { return maxCanvasHeight; },
    dataUrlCount: function () { return String(dataUrlCount); },
    lastDataUrlMime: function () { return lastDataUrlMime; },
    lastDataUrlPrefix: function () { return lastDataUrlPrefix; },
    storageCount: function () {
      try { return String(storageLength()); } catch (e) { return 'ERR'; }
    }
  };

  watchErrors();
  watchLoad();
  resetStorage();
  dropServiceWorkers();
  if (wrapFetch()) { hookCount += 1; }
  if (wrapXhr()) { hookCount += 1; }
  if (wrapSendBeacon()) { hookCount += 1; }
  if (wrapWindowOpen()) { hookCount += 1; }
  if (wrapPropSetter(W.HTMLImageElement, 'src', 'dom')) { hookCount += 1; }
  if (wrapPropSetter(W.HTMLIFrameElement, 'src', 'dom')) { hookCount += 1; }
  if (wrapPropSetter(W.HTMLScriptElement, 'src', 'dom')) { hookCount += 1; }
  if (wrapPropSetter(W.HTMLLinkElement, 'href', 'dom')) { hookCount += 1; }
  if (wrapCtor('EventSource')) { hookCount += 1; }
  if (wrapCtor('WebSocket')) { hookCount += 1; }
  hookCount += wrapCanvas();

  try {
    Object.defineProperty(W, '__rb', { value: surface, writable: true, configurable: true, enumerable: true });
  } catch (e) {
    W.__rb = surface;
  }
  bootComplete = true;
}());
