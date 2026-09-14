// WLB repair-bench observation probe (added by environment/instrumentation.patch).
// STRICTLY READ-ONLY: every getter reads DOM text/class/attribute/state, the two
// Web Storage areas, the location object or the browser's own
// PerformanceResourceTiming buffer. It never writes application state, never
// patches a component, never wraps or intercepts a request, and never throws -
// a missing node yields the sentinel "__MISSING__" (strings), "__ABSENT__"
// (absent attribute / absent DMARC tag), 0 (counts) or false (booleans).
// Published exactly once, as window.__rb, from src/main.js.
(function installRbProbe() {
  if (typeof window === "undefined") return;
  if (window.__rb) return;

  var VERSION = "rbprobe-1.0.0-dmarcguard";
  var MISS = "__MISSING__";
  var ABSENT = "__ABSENT__";

  function norm(s) {
    return String(s === null || s === undefined ? "" : s).replace(/\s+/g, " ").trim();
  }
  function q(sel, root) {
    try { return (root || document).querySelector(sel) || null; } catch (e) { return null; }
  }
  function qa(sel, root) {
    try { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    catch (e) { return []; }
  }
  function text(sel, root) { var el = q(sel, root); return el ? norm(el.textContent) : MISS; }
  function texts(sel, root) {
    return qa(sel, root).map(function (el) { return norm(el.textContent); }).join("|");
  }
  function count(sel, root) { return qa(sel, root).length; }
  function klass(sel, root) { var el = q(sel, root); return el ? norm(el.className) : MISS; }
  function hasClass(sel, cls, root) {
    var el = q(sel, root);
    return !!(el && el.classList && el.classList.contains(cls));
  }
  function disabled(sel, root) { var el = q(sel, root); return !!(el && el.disabled === true); }
  function checked(sel, root) { var el = q(sel, root); return !!(el && el.checked === true); }
  function value(sel, root) {
    var el = q(sel, root);
    return el && typeof el.value === "string" ? el.value : MISS;
  }
  function styleWidth(sel, root) {
    var el = q(sel, root);
    if (!el || !el.style) return MISS;
    return el.style.width ? el.style.width : ABSENT;
  }
  function originOf() { try { return window.location.origin; } catch (e) { return ""; } }
  function isExternal(u) {
    try { return new URL(String(u), window.location.href).origin !== originOf(); }
    catch (e) { return false; }
  }
  function resources() {
    try { return window.performance.getEntriesByType("resource") || []; }
    catch (e) { return []; }
  }
  function resUrl(el) {
    if (!el) return "";
    return String(el.currentSrc || el.src || el.href || el.data || "");
  }
  function storageKeys(area) {
    var out = [];
    try {
      var st = area === "session" ? window.sessionStorage : window.localStorage;
      for (var i = 0; i < st.length; i++) out.push(st.key(i));
    } catch (e) { return ["__ERR__"]; }
    return out.sort();
  }
  function storageGet(area, k) {
    try {
      var st = area === "session" ? window.sessionStorage : window.localStorage;
      var v = st.getItem(k);
      return v === null ? ABSENT : v;
    } catch (e) { return "__ERR__"; }
  }
  function genRecordValue() {
    var el = q('[data-testid="gen-code"] .string');
    if (!el) return MISS;
    var s = norm(el.textContent);
    if (s.length >= 2 && s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') s = s.slice(1, -1);
    return s;
  }
  function genTags() {
    var out = {};
    var raw = genRecordValue();
    if (!raw || raw === MISS) return out;
    raw.split(";").forEach(function (part) {
      var p = norm(part);
      if (!p) return;
      var i = p.indexOf("=");
      if (i < 0) { if (!Object.prototype.hasOwnProperty.call(out, p)) out[p] = ""; return; }
      var k = norm(p.slice(0, i));
      var v = norm(p.slice(i + 1));
      if (!Object.prototype.hasOwnProperty.call(out, k)) out[k] = v;
    });
    return out;
  }
  function alignedItems() {
    return qa(".auth-item").filter(function (it) { return !!q(".alignment-tag.aligned", it); });
  }

  var RB = {
    v: VERSION,
    boot: {
      mounted: function () { return !!q(".app"); },
      title: function () { return norm(document.title); },
      navTitle: function () { return text(".nav-title"); },
      view: function () {
        if (q('[data-testid="gen-code"]')) return "generator";
        if (q(".stat-grid")) return "dashboard";
        return ABSENT;
      },
      probeVersion: function () { return VERSION; },
    },
    net: {
      all: function () { return resources().length; },
      external: function () {
        return resources().filter(function (e) { return isExternal(e.name); }).length;
      },
      externalUrls: function () {
        return resources().filter(function (e) { return isExternal(e.name); })
          .map(function (e) { return String(e.name); }).join("|") || ABSENT;
      },
      remoteTags: function () {
        return qa("link[href],script[src],img[src],iframe[src],source[src],embed[src],object[data]")
          .filter(function (el) { return isExternal(resUrl(el)); }).length;
      },
      remoteTagUrls: function () {
        return qa("link[href],script[src],img[src],iframe[src],source[src],embed[src],object[data]")
          .map(resUrl).filter(isExternal).join("|") || ABSENT;
      },
    },
    dom: {
      count: count, text: text, texts: texts, klass: klass,
      hasClass: hasClass, disabled: disabled, checked: checked, value: value,
    },
    hero: {
      scorePresent: function () { return !!q('[data-testid="hero-score"]'); },
      scoreValue: function () { return text('[data-testid="hero-score"] .score-val'); },
      scoreLabel: function () { return text('[data-testid="hero-score"] .score-label'); },
      healthMessage: function () { return text('[data-testid="hero-health"] .stat-value'); },
      healthSubtext: function () { return text('[data-testid="hero-health"] .stat-desc'); },
      healthLabel: function () { return text('[data-testid="hero-health"] .stat-label'); },
      healthClass: function () { return klass('[data-testid="hero-health"]'); },
      subtitle: function () { return text(".hero-container .page-subtitle"); },
      pageTitle: function () { return text(".hero-container .page-title"); },
      volume: function () { return text('[data-testid="hero-volume"]'); },
      sources: function () { return text('[data-testid="hero-sources"]'); },
      refreshDisabled: function () { return disabled('[data-testid="hero-refresh"]'); },
    },
    sources: {
      count: function () { return count('[data-testid="source-item"]'); },
      ips: function () { return texts('[data-testid="source-item"] .source-ip'); },
      messages: function (i) {
        var it = qa('[data-testid="source-item"]')[i];
        return it ? text(".source-count", it) : MISS;
      },
      passWidth: function (i) {
        var it = qa('[data-testid="source-item"]')[i];
        return it ? styleWidth(".source-bar-pass", it) : MISS;
      },
      failWidth: function (i) {
        var it = qa('[data-testid="source-item"]')[i];
        return it ? styleWidth(".source-bar-fail", it) : MISS;
      },
      legend: function (i) {
        var it = qa('[data-testid="source-item"]')[i];
        if (!it) return MISS;
        return norm(q(".legend-pass", it) ? q(".legend-pass", it).textContent : "") + "|" +
               norm(q(".legend-fail", it) ? q(".legend-fail", it).textContent : "");
      },
    },
    reports: {
      rowCount: function () { return count('[data-testid="report-row"]'); },
      headCount: function () { return count(".report-table thead th"); },
      heads: function () { return texts(".report-table thead th"); },
      orgText: function (i) { var r = qa('[data-testid="report-row"]')[i]; return r ? text(".org-name", r) : MISS; },
      domainText: function (i) { var r = qa('[data-testid="report-row"]')[i]; return r ? text(".col-domain", r) : MISS; },
      volumeText: function (i) { var r = qa('[data-testid="report-row"]')[i]; return r ? text(".col-vol", r) : MISS; },
      complianceText: function (i) { var r = qa('[data-testid="report-row"]')[i]; return r ? text(".col-rate", r) : MISS; },
      policyText: function (i) { var r = qa('[data-testid="report-row"]')[i]; return r ? text(".policy-badge", r) : MISS; },
      policyClass: function (i) { var r = qa('[data-testid="report-row"]')[i]; return r ? klass(".policy-badge", r) : MISS; },
      dateText: function (i) { var r = qa('[data-testid="report-row"]')[i]; return r ? text(".col-date", r) : MISS; },
      statusText: function (i) { var r = qa('[data-testid="report-row"]')[i]; return r ? text(".badge", r) : MISS; },
      statusClass: function (i) { var r = qa('[data-testid="report-row"]')[i]; return r ? klass(".badge", r) : MISS; },
      emptyPresent: function () { return !!q('[data-testid="reports-empty"]'); },
      emptyText: function () { return text('[data-testid="reports-empty"]'); },
      searchValue: function () { return value('[data-testid="reports-search"]'); },
    },
    drawer: {
      rootOpen: function () { return hasClass('[data-testid="drawer-root"]', "is-open"); },
      panelHeaderCount: function () { return count(".panel-header"); },
      title: function () { return text(".panel-title"); },
      subtitle: function () { return text(".panel-subtitle"); },
      verdict: function () { return text(".verdict-value"); },
      verdictClass: function () { return klass('[data-testid="drawer-verdict"]'); },
      verdictMetaPolicy: function () { var s = qa(".verdict-meta strong"); return s[0] ? norm(s[0].textContent) : MISS; },
      verdictMetaVolume: function () { var s = qa(".verdict-meta strong"); return s[1] ? norm(s[1].textContent) : MISS; },
      tabTexts: function () { return texts(".tabs button"); },
      activeTabText: function () { return text(".tabs button.active"); },
      infoLabels: function () { return texts(".info-label"); },
      infoValues: function () { return texts(".info-value"); },
      infoValue: function (label) {
        var items = qa(".info-item");
        for (var i = 0; i < items.length; i++) {
          if (norm(q(".info-label", items[i]) ? q(".info-label", items[i]).textContent : "") === label) {
            return text(".info-value", items[i]);
          }
        }
        return MISS;
      },
      recordCount: function () { return count(".record-card"); },
      recordIps: function () { return texts(".record-ip .font-mono"); },
      recordCounts: function () { return texts(".record-count"); },
      dispositions: function () { return texts(".record-footer strong"); },
      alignedCount: function () { return alignedItems().length; },
      unalignedCount: function () { return count(".alignment-tag.unaligned"); },
      alignedDomains: function () {
        return alignedItems().map(function (it) { return text(".domain-mono", it); }).join("|") || ABSENT;
      },
      authItemCount: function () { return count(".auth-item"); },
      loadingPresent: function () { return !!q(".panel-loading"); },
    },
    gen: {
      present: function () { return !!q('[data-testid="gen-code"]'); },
      recordValue: genRecordValue,
      tagValue: function (tag) {
        var t = genTags();
        return Object.prototype.hasOwnProperty.call(t, tag) ? t[tag] : ABSENT;
      },
      tagNames: function () { return Object.keys(genTags()).join("|") || ABSENT; },
      hostValue: function () { var v = qa('[data-testid="gen-code"] .line .value'); return v[0] ? norm(v[0].textContent) : MISS; },
      typeValue: function () { var v = qa('[data-testid="gen-code"] .line .value'); return v[1] ? norm(v[1].textContent) : MISS; },
      terminalTitle: function () { return text(".terminal-title"); },
      previewTitle: function () { return text(".preview-card .card-title"); },
      domainValue: function () { return value('[data-testid="gen-domain"]'); },
      ruaValue: function () { return value('[data-testid="gen-rua"]'); },
      rufValue: function () { return value('[data-testid="gen-ruf"]'); },
      pctLabel: function () { return text(".range-value"); },
      strictChecked: function () { return checked('[data-testid="gen-strict"]'); },
      segmentedCount: function () { return count(".segmented-control"); },
      policyButtons: function () { var s = qa(".segmented-control"); return s[0] ? texts("button", s[0]) : MISS; },
      spButtons: function () { var s = qa(".segmented-control"); return s[1] ? texts("button", s[1]) : MISS; },
      formActive: function () {
        return qa(".segmented-control button.active").map(function (b) { return norm(b.textContent); }).join("|") || ABSENT;
      },
    },
    settings: {
      open: function () { return !!q(".modal-backdrop"); },
      titleText: function () { return text("#settings-title"); },
      inputValue: function () { return value('[data-testid="settings-endpoint-input"]'); },
      inputIsDefault: function () {
        var v = value('[data-testid="settings-endpoint-input"]');
        return v === originOf() + "/api";
      },
      defaultHint: function () { return text(".default-hint code"); },
      error: function () { return text('[data-testid="settings-error"]'); },
      errorPresent: function () { return !!q('[data-testid="settings-error"]'); },
      saveDisabled: function () { return disabled('[data-testid="settings-save"]'); },
      resetDisabled: function () { return disabled('[data-testid="settings-reset"]'); },
      testDisabled: function () { return disabled('[data-testid="settings-test"]'); },
      optionCount: function () { return count(".theme-option"); },
      optionLabels: function () { return texts(".theme-option span"); },
      themeActive: function () { return text(".theme-option.active span"); },
      sectionLabels: function () { return texts(".section-label"); },
    },
    storage: {
      localKeys: function () { return storageKeys("local").join("|"); },
      sessionKeys: function () { return storageKeys("session").join("|"); },
      keys: function () { return storageKeys("local").concat(storageKeys("session")).sort().join("|"); },
      theme: function () { return storageGet("local", "theme"); },
      settings: function () { return storageGet("local", "settings"); },
      dataTheme: function () {
        var v = document.documentElement.getAttribute("data-theme");
        return v === null ? ABSENT : v;
      },
    },
    loc: {
      search: function () { return String(window.location.search); },
      hash: function () { return String(window.location.hash); },
      pathname: function () { return String(window.location.pathname); },
      origin: originOf,
    },
    refs: {
      blankTargetCount: function () { return count('a[target="_blank"]'); },
      noopenerCount: function () {
        return qa('a[target="_blank"]').filter(function (a) {
          return /noopener/.test(String(a.getAttribute("rel") || ""));
        }).length;
      },
      blankHosts: function () {
        return qa('a[target="_blank"]').map(function (a) {
          try { return new URL(String(a.getAttribute("href") || ""), window.location.href).host; }
          catch (e) { return ABSENT; }
        }).sort().join("|");
      },
      footerHeads: function () { return texts(".footer-section h4"); },
      footerBottom: function () { return text(".footer-bottom"); },
    },
    globals: {
      rbPublished: function () { return window.__rb === RB; },
      rbKeyCount: function () { return Object.keys(RB).length; },
      leakedKeys: function () {
        return Object.keys(window).filter(function (k) {
          return /^__rb/.test(k) && k !== "__rb";
        }).sort().join("|") || ABSENT;
      },
    },
  };

  try { Object.defineProperty(window, "__rb", { value: RB, writable: false, configurable: false, enumerable: true }); }
  catch (e) { window.__rb = RB; }
})();
