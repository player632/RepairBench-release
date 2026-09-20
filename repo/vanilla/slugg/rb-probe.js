/* rb-probe.js -- read-only observation probe for repair-vanilla__slugg-01.
 * Added by environment/instrumentation.patch; removed again by `git apply -R`
 * of that same patch, which is why tests/roundtrip_ignore.json is empty.
 *
 * CONTRACT (read-only, and the reason this file is allowed to exist at all):
 *   1. The ONLY global this file creates is `window.__rb`. It never assigns to,
 *      deletes, redefines or shadows anything the seed owns: not `world`, `ctx`,
 *      `canvas`, `animate`, `loading`, `animation_data`, `TAU`, not one of the
 *      thirteen seed classes, not one of the four asset loaders, and not one of
 *      the ~40 names the inline boot script hoists off `Math` onto `self`.
 *   2. It never mutates application state, never schedules work, never blocks,
 *      never re-enters the frame loop, and never throws into the app: every
 *      recorder body is wrapped in try/catch and every published member is a
 *      pure read that returns a fresh scalar or a fresh array.
 *   3. The two pass-through recorders (`XMLHttpRequest.prototype.open` and
 *      `window.fetch`) record the call and then invoke the native implementation
 *      with the original `this` and the original arguments, returning its
 *      original result unchanged. The seed's own same-origin CoffeeScript source
 *      fetch therefore behaves exactly as it did before this file existed. Both
 *      recorders are installed only when the native hook is really present.
 *   4. Nothing here is a test oracle and nothing here is scored on its own.
 *      tests/dsl.json reads the seed's own globals for every scored scalar;
 *      __rb only publishes the request/residue census that the seed itself
 *      cannot expose, which is what the two guard checkpoints P26/P27 read.
 *   5. Every namespace below is frozen, so a "fix" cannot quietly republish a
 *      different probe in order to fake a green reading.
 */
(function () {
  "use strict";
  if (window.__rb) { return; }
  var rb = {};
  var records = { xhr: [], fetch: [] };

  function isExternal(u) {
    try {
      var a = new URL(String(u), window.location.href);
      return a.origin !== window.location.origin;
    } catch (e) { return false; }
  }

  try {
    if (typeof XMLHttpRequest === "function" && XMLHttpRequest.prototype && typeof XMLHttpRequest.prototype.open === "function") {
      var nativeOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        try { records.xhr.push({ via: "xhr", method: String(method), url: String(url), external: isExternal(url), at: Date.now() }); } catch (e) {}
        return nativeOpen.apply(this, arguments);
      };
    }
  } catch (e) {}

  try {
    if (typeof window.fetch === "function") {
      var nativeFetch = window.fetch;
      window.fetch = function (input, init) {
        try {
          var u = typeof input === "string" ? input : ((input && typeof input.url === "string") ? input.url : "");
          records.fetch.push({ via: "fetch", method: (init && init.method) || "GET", url: u, external: isExternal(u), at: Date.now() });
        } catch (e) {}
        return nativeFetch.apply(this, arguments);
      };
    }
  } catch (e) {}

  rb.version = "slugg-rb-probe/1";

  rb.net = {
    requests: function () { return records.xhr.concat(records.fetch); },
    count: function () { return records.xhr.length + records.fetch.length; },
    sameOriginXhr: function () {
      var n = 0;
      for (var i = 0; i < records.xhr.length; i++) { if (!records.xhr[i].external) { n++; } }
      return n;
    },
    external: function () {
      var n = 0, i;
      var list = records.xhr.concat(records.fetch);
      for (i = 0; i < list.length; i++) { if (list[i].external) { n++; } }
      try {
        var res = (window.performance && typeof window.performance.getEntriesByType === "function")
          ? window.performance.getEntriesByType("resource") : [];
        for (i = 0; i < res.length; i++) { if (isExternal(res[i].name)) { n++; } }
      } catch (e) {}
      return n;
    }
  };

  rb.boot = {
    loading: function () { try { return window.loading === true; } catch (e) { return null; } },
    scriptTags: function () { try { return document.getElementsByTagName("script").length; } catch (e) { return -1; } },
    coffeeTags: function () {
      try {
        var s = document.getElementsByTagName("script"), n = 0;
        for (var i = 0; i < s.length; i++) { if (s[i].type === "text/coffeescript") { n++; } }
        return n;
      } catch (e) { return -1; }
    },
    canvasCount: function () { try { return document.getElementsByTagName("canvas").length; } catch (e) { return -1; } }
  };

  rb.dom = {
    testid: function (name) {
      try { return document.querySelector('[data-testid="' + String(name) + '"]') ? 1 : 0; } catch (e) { return -1; }
    },
    bodyClass: function () { try { return String(document.body.className || ""); } catch (e) { return null; } }
  };

  rb.residue = {
    storage: function () {
      try { return (window.localStorage ? window.localStorage.length : 0) + (window.sessionStorage ? window.sessionStorage.length : 0); } catch (e) { return -1; }
    },
    hash: function () { try { return String(window.location.hash || ""); } catch (e) { return null; } },
    probeGlobals: function () {
      var n = 0;
      try { for (var k in window) { if (Object.prototype.hasOwnProperty.call(window, k) && /^__rb/.test(k)) { n++; } } } catch (e) { return -1; }
      return n;
    }
  };

  Object.freeze(rb.net);
  Object.freeze(rb.boot);
  Object.freeze(rb.dom);
  Object.freeze(rb.residue);
  Object.freeze(rb);
  window.__rb = rb;
})();
