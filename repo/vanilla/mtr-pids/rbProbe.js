// RepairBench instrumentation: a STRICTLY READ-ONLY measurement probe for the verifier.
// It is published once from index.html as a classic script in <head>, i.e. before any ES module
// (all of the application's scripts are type="module" and therefore deferred), so the fetch
// recorder below is installed before the application's first request.
//
//
// a pass-through wrapper on window.fetch rather than a network interception". It changes NO request
// semantics: same arguments, same returned promise, same response object; it only appends a record.
// Nothing here writes application state, patches a component, starts a process or serves anything.
//
// Why it exists: this task's environment adaptation replaces three off-origin API hosts and two
// Google Fonts hosts with same-origin fixtures. "Zero off-origin traffic" has to be a MEASUREMENT
// the verifier can read, not an assertion in a design note. net.external() counts off-origin
// entries from BOTH the fetch recorder and the browser's own resource-timing buffer, in the top
// window AND in every same-origin iframe (the twelve promo frames are created at boot by
// assets/js/promo.js setup(), and four of them are the pages that used to reach fonts.googleapis.com).
(function () {
  'use strict';
  if (window.__rb) return;

  var origin = window.location.origin;
  var fetchRecords = [];
  var nativeFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;

  function absolutise(u) {
    try { return new URL(String(u), window.location.href).href; } catch (e) { return String(u); }
  }
  function hostOf(u) {
    try { return new URL(String(u), window.location.href).host; } catch (e) { return ''; }
  }
  function isOff(u) {
    try { return new URL(String(u), window.location.href).origin !== origin; } catch (e) { return false; }
  }

  if (nativeFetch) {
    window.fetch = function (input, init) {
      var u = typeof input === 'string' ? input : (input && input.url) || String(input);
      var rec = { url: absolutise(u), host: hostOf(u), off_origin: isOff(u), at: Date.now(), status: null, ok: null, failed: false };
      fetchRecords.push(rec);
      return nativeFetch(input, init).then(function (r) {
        rec.status = r.status; rec.ok = r.ok; return r;
      }, function (e) {
        rec.failed = true; throw e;
      });
    };
  }

  // every same-origin window that can be read: the top window plus the promo iframes (recursively)
  function frames(win, acc, depth) {
    acc.push(win);
    if (depth > 3) return acc;
    var n = 0;
    try { n = win.frames.length; } catch (e) { return acc; }
    for (var i = 0; i < n; i++) {
      var child = null;
      try { child = win.frames[i]; } catch (e) { continue; }
      try { if (child && child.location && child.location.href) frames(child, acc, depth + 1); } catch (e) { /* cross-origin: unreadable by definition, and there is none after adaptation */ }
    }
    return acc;
  }

  function resourceEntries() {
    var out = [];
    var wins = frames(window, [], 0);
    for (var i = 0; i < wins.length; i++) {
      var list = [];
      try { list = wins[i].performance.getEntriesByType('resource') || []; } catch (e) { list = []; }
      for (var j = 0; j < list.length; j++) out.push({ name: list[j].name, type: list[j].initiatorType || '', frame: wins[i] === window ? 'top' : 'iframe' });
    }
    return out;
  }

  function offOriginUrls() {
    var seen = {};
    var out = [];
    var push = function (u) { if (!seen[u]) { seen[u] = 1; out.push(u); } };
    var res = resourceEntries();
    for (var i = 0; i < res.length; i++) if (isOff(res[i].name)) push(res[i].name);
    for (var k = 0; k < fetchRecords.length; k++) if (fetchRecords[k].off_origin) push(fetchRecords[k].url);
    return out;
  }

  function rows() {
    var out = [];
    var trs = document.querySelectorAll('#arrivalOverlay tr');
    for (var i = 0; i < trs.length; i++) {
      var dest = trs[i].querySelector('.destination-name');
      var eta = trs[i].querySelector('.eta');
      var min = trs[i].querySelector('.etamin');
      var plat = trs[i].querySelector('.plat-circle');
      var lrt = trs[i].querySelector('.lrt-route');
      out.push({
        dest: dest ? dest.textContent : '',
        eta: eta ? eta.textContent.replace(/\s+/g, ' ').trim() : '',
        etamin: min ? min.textContent : '',
        plat: plat ? plat.textContent : '',
        lrt: lrt ? lrt.textContent : ''
      });
    }
    return out;
  }

  window.__rb = {
    schema: 'rbProbe/1 (read-only; pass-through fetch recorder + resource-timing census)',
    net: {
      total: function () { return resourceEntries().length + fetchRecords.length; },
      external: function () { return offOriginUrls().length; },
      offenders: function () { return offOriginUrls(); },
      hosts: function () {
        var m = {};
        var res = resourceEntries();
        for (var i = 0; i < res.length; i++) m[hostOf(res[i].name)] = (m[hostOf(res[i].name)] || 0) + 1;
        for (var k = 0; k < fetchRecords.length; k++) m[fetchRecords[k].host] = (m[fetchRecords[k].host] || 0) + 1;
        return Object.keys(m).sort().map(function (h) { return h + '=' + m[h]; }).join(',');
      },
      fetches: function () { return fetchRecords.map(function (r) { return r.host + ' ' + r.status + ' ' + r.url.replace(origin, ''); }).join(' | '); },
      failures: function () {
        var n = 0;
        for (var i = 0; i < fetchRecords.length; i++) if (fetchRecords[i].failed || fetchRecords[i].ok === false) n++;
        return n;
      },
      frames: function () { return frames(window, [], 0).length; },
      externalCount: function () { return offOriginUrls().length; },
      offendersText: function () { var o = offOriginUrls(); return o.length ? o.join('|') : ''; },
      allSameOrigin: function () { return offOriginUrls().length === 0 ? 1 : 0; },
      hostText: function () { return window.__rb.net.hosts(); },
      forbiddenHits: function () {
        var bad = ["rt.data.gov.hk","rp.lx86.workers.dev","data.weather.gov.hk","fonts.googleapis.com","fonts.gstatic.com"];
        var n = 0, res = resourceEntries();
        for (var i = 0; i < res.length; i++) if (bad.indexOf(hostOf(res[i].name)) >= 0) n++;
        for (var k = 0; k < fetchRecords.length; k++) if (bad.indexOf(fetchRecords[k].host) >= 0) n++;
        return n;
      },
      forbiddenHostCounts: function () {
        var bad = ["rt.data.gov.hk","rp.lx86.workers.dev","data.weather.gov.hk","fonts.googleapis.com","fonts.gstatic.com"], out = [];
        for (var b = 0; b < bad.length; b++) {
          var n = 0, res = resourceEntries();
          for (var i = 0; i < res.length; i++) if (hostOf(res[i].name) === bad[b]) n++;
          for (var k = 0; k < fetchRecords.length; k++) if (fetchRecords[k].host === bad[b]) n++;
          out.push(bad[b] + '=' + n);
        }
        return out.join(',');
      }
    },
    dom: {
      rows: rows,
      dests: function () { return rows().map(function (r) { return r.dest === '' ? '(blank)' : r.dest; }).join('|'); },
      etas: function () { return rows().map(function (r) { return r.eta === '' ? '(blank)' : r.eta; }).join('|'); },
      plats: function () { return rows().map(function (r) { return r.plat === '' ? '(blank)' : r.plat; }).join('|'); },
      visibleRows: function () {
        var trs = document.querySelectorAll('#arrivalOverlay tr'); var n = 0;
        for (var i = 0; i < trs.length; i++) if (trs[i].querySelector('.destination-name')) n++;
        return n;
      },
      weatherIcons: function () {
        var imgs = document.querySelectorAll('#weather-icon img');
        var out = [];
        for (var i = 0; i < imgs.length; i++) out.push(String(imgs[i].getAttribute('src') || '').split('/').pop());
        return out.join(',');
      },
      temperature: function () { var e = document.querySelector('#temperature'); return e ? e.textContent : ''; },
      clock: function () { var e = document.querySelector('.clock'); return e ? e.textContent.trim() : ''; },
      promoSrcs: function () {
        var f = document.querySelectorAll('#promo iframe'); var out = [];
        for (var i = 0; i < f.length; i++) if (f[i].style.display !== 'none') out.push(f[i].getAttribute('src'));
        return out.join('|');
      },
      overlayHidden: function () { var e = document.querySelector('#overlay'); return e && e.classList.contains('hidden') ? 1 : 0; },
      dividerVisible: function () {
        var e = document.querySelector('.divider');
        if (!e) return -1;
        return window.getComputedStyle(e).display === 'none' ? 0 : 1;
      },
      promoVisible: function () {
        var e = document.querySelector('#promo');
        if (!e) return -1;
        return window.getComputedStyle(e).display === 'none' ? 0 : 1;
      },
      promoFull: function () {
        var e = document.querySelector('#promo');
        return e && e.classList.contains('promo-full') ? 1 : 0;
      },
      promoIframeCount: function () { return document.querySelectorAll('#promo iframe').length; },
      promoOffOriginCount: function () {
        var f = document.querySelectorAll('#promo iframe'), n = 0;
        for (var i = 0; i < f.length; i++) {
          var s = f[i].getAttribute('src');
          if (s == null) continue;
          try { if (new URL(s, window.location.href).origin !== origin) n++; } catch (e) { n++; }
        }
        return n;
      },
      adhocSrc: function () {
        var e = document.querySelector('.promo-STANDBACK_TRAIN');
        return e ? String(e.getAttribute('src') || '') : '(missing)';
      },
      adhocSrcSameOrigin: function () {
        var e = document.querySelector('.promo-STANDBACK_TRAIN');
        if (!e) return -1;
        try { return new URL(String(e.getAttribute('src')), window.location.href).origin === origin ? 1 : 0; } catch (x) { return 0; }
      },
      iframeRemoteFontLinks: function () {
        var wins = frames(window, [], 0), n = 0;
        for (var i = 0; i < wins.length; i++) {
          var ls = [];
          try { ls = wins[i].document.querySelectorAll('link[href]'); } catch (e) { continue; }
          for (var j = 0; j < ls.length; j++) {
            var h = String(ls[j].getAttribute('href') || '');
            if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(h)) n++;
          }
        }
        return n;
      },
      iframeLocalFontCss: function () {
        var wins = frames(window, [], 0), n = 0;
        for (var i = 1; i < wins.length; i++) {
          var ls = [];
          try { ls = wins[i].document.querySelectorAll('link[href]'); } catch (e) { continue; }
          for (var j = 0; j < ls.length; j++) if (/assets\/font\/font\.css$/.test(String(ls[j].getAttribute('href') || ''))) n++;
        }
        return n;
      },
      etaCellNum: function (tr) {
        var eta = tr.querySelector('.eta');
        if (!eta) return '(blank)';
        var first = eta.childNodes.length ? eta.childNodes[0] : null;
        var t = first && first.nodeType === 3 ? first.nodeValue : (eta.textContent || '');
        t = String(t).replace(/[\u00a0\s]/g, '').trim();
        return t === '' ? '(blank)' : t;
      },
      etaNums: function () {
        var trs = document.querySelectorAll('#arrivalOverlay tr'), out = [];
        for (var i = 0; i < trs.length; i++) out.push(window.__rb.dom.etaCellNum(trs[i]));
        return out.join('|');
      },
      rowEtaNum: function (i) {
        var trs = document.querySelectorAll('#arrivalOverlay tr');
        return i < trs.length ? window.__rb.dom.etaCellNum(trs[i]) : '(norow)';
      },
      rowEtamin: function (i) {
        var trs = document.querySelectorAll('#arrivalOverlay tr');
        if (i >= trs.length) return '(norow)';
        var m = trs[i].querySelector('.etamin');
        if (!m) return '(nospan)';
        var t = String(m.textContent || '').replace(/[\u00a0\s]/g, '').trim();
        return t === '' ? '(blank)' : t;
      },
      oneOf: function (got, pair) {
        if (got === '(norow)' || got === '(nospan)' || got === '(blank)' || got === '(missing)') return -1;
        var halves = String(pair).split('|');
        for (var i = 0; i < halves.length; i++) if (got === halves[i]) return 1;
        return 0;
      },
      rowDestOneOf: function (i, pair) { return window.__rb.dom.oneOf(window.__rb.dom.rows()[i] ? (window.__rb.dom.rows()[i].dest === '' ? '(blank)' : window.__rb.dom.rows()[i].dest) : '(norow)', pair); },
      rowEtaminOneOf: function (i, pair) { return window.__rb.dom.oneOf(window.__rb.dom.rowEtamin(i), pair); },
      rowDest: function (i) { var r = window.__rb.dom.rows(); return i < r.length ? (r[i].dest === '' ? '(blank)' : r[i].dest) : '(norow)'; },
      rtname: function () { var e = document.querySelector('.rtname'); return e ? String(e.textContent || '') : '(missing)'; },
      rtnameHasPipe: function () { var t = window.__rb.dom.rtname(); return t === '(missing)' ? -1 : (t.indexOf('|') >= 0 ? 1 : 0); },
      headerHasRouteColor: function () { var e = document.querySelector('#header-bar'); return e && e.classList.contains('route-color') ? 1 : 0; },
      t2Visible: function () {
        var e = document.querySelector('.t2');
        if (!e) return -1;
        return window.getComputedStyle(e).display === 'none' ? 0 : 1;
      },
      bodyRouteColor: function () {
        var v = window.getComputedStyle(document.body).getPropertyValue('--route-color');
        return String(v || '').trim() || '(unset)';
      },
      overlayTitle: function () {
        var e = document.querySelector('#overlay section.settings h1');
        return e ? String(e.textContent || '').replace(/\s+/g, ' ').trim() : '(missing)';
      },
      clockLooksLikeHHMM: function () { return /^\d{2}:\d{2}$/.test(window.__rb.dom.clock()) ? 1 : 0; },
      bridgeGlobals: function () {
        var out = [];
        for (var k in window) if (Object.prototype.hasOwnProperty.call(window, k) && k.indexOf('__rb') === 0) out.push(k);
        return out.sort().join(',');
      }
    },
    storage: {
      keys: function () {
        var out = [];
        try { for (var i = 0; i < localStorage.length; i++) out.push('local:' + localStorage.key(i)); } catch (e) {}
        try { for (var j = 0; j < sessionStorage.length; j++) out.push('session:' + sessionStorage.key(j)); } catch (e) {}
        return out.sort().join(',');
      },
      count: function () { var n = 0; try { n += localStorage.length; } catch (e) {} try { n += sessionStorage.length; } catch (e) {} return n; }
    }
  };
})();
