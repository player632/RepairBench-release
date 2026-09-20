// js/rb-probe.js
// repair-bench READ-ONLY verifier probe (added by environment/instrumentation.patch).
//
// It publishes three observations the checker needs and the application does not publish itself:
//   1. how many requests tried to leave this origin through fetch / XMLHttpRequest / sendBeacon,
//   2. how many service-worker registrations were attempted and whether a worker controls the page,
//   3. whether any __rb_ prefixed residue leaked into web storage or the global object.
//
// Discipline: pass-through observation only. Every wrapper forwards the original arguments to the
// original function and returns its result untouched. Nothing here reads or writes application
// state, no application global is replaced, and no rendering or persistence path is altered.
(function () {
  'use strict';
  if (window.__RB__) { return; }

  var OUTBOUND = { n: 0, hosts: [] };

  function note(target) {
    try {
      var href = typeof target === 'string' ? target : ((target && target.url) || '');
      if (!href) { return; }
      var abs = new URL(href, window.location.href);
      if (abs.origin !== window.location.origin) {
        OUTBOUND.n += 1;
        if (OUTBOUND.hosts.indexOf(abs.host) < 0) { OUTBOUND.hosts.push(abs.host); }
      }
    } catch (e) { /* not a URL we can classify - ignore */ }
  }

  try {
    var nativeFetch = window.fetch;
    if (typeof nativeFetch === 'function') {
      window.fetch = function (input, init) { note(input); return nativeFetch.apply(this, arguments); };
    }
  } catch (e) { /* ignore */ }

  try {
    var nativeOpen = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
    if (typeof nativeOpen === 'function') {
      window.XMLHttpRequest.prototype.open = function (method, url) { note(url); return nativeOpen.apply(this, arguments); };
    }
  } catch (e) { /* ignore */ }

  try {
    if (navigator.sendBeacon) {
      var nativeBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function (url, data) { note(url); return nativeBeacon(url, data); };
    }
  } catch (e) { /* ignore */ }

  var SW_CALLS = 0;
  try {
    if (navigator.serviceWorker && typeof navigator.serviceWorker.register === 'function') {
      var nativeRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
      navigator.serviceWorker.register = function (url, options) { SW_CALLS += 1; return nativeRegister(url, options); };
    }
  } catch (e) { /* ignore */ }

  function prefixedKeys(store) {
    try {
      return Object.keys(store).filter(function (k) { return k.indexOf('__rb_') === 0; }).length;
    } catch (e) { return 0; }
  }

  window.__RB__ = {
    v: 1,
    outboundCount: function () { return OUTBOUND.n; },
    outboundHosts: function () { return OUTBOUND.hosts.slice().sort().join(','); },
    swRegisterCalls: function () { return SW_CALLS; },
    swControlled: function () { return !!(navigator.serviceWorker && navigator.serviceWorker.controller); },
    residueKeys: function () { return prefixedKeys(window.localStorage) + prefixedKeys(window.sessionStorage); },
    probeGlobals: function () {
      try {
        return Object.keys(window).filter(function (k) { return k.indexOf('__rb_leak') === 0; }).length;
      } catch (e) { return -1; }
    }
  };
})();
