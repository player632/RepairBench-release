// rb_probe.js - read-only verification facade for this repair task.
//
// WHAT THIS FILE IS: one non-enumerable, frozen global (window.__rb_neovid) whose members are all
// PURE READS of things the page already owns - the document, a computed style, the two storage
// objects, the location object, the service-worker container, or a pure function that the seed's own
// classic script already declares at global scope (CONFIG, DOM, state, formatTime, truncateTitle,
// getFormData, getProgressBackground are all reachable from this file because the seed loads its page
// script as a classic script, so its top-level const/let/function declarations live in the shared
// global lexical scope of this realm).
//
// WHAT THIS FILE IS NOT: it has no setter, it caches nothing, it writes nowhere, it never mutates the
// document, the storage objects, the player or the model, and it contains no special case keyed on a
// probe name. There is no occurrence of an innerHTML assignment, a textContent assignment, a click
// call, an attribute-write call, a storage-write call or a dialog call anywhere below. Every
// handle is safe to call repeatedly while an assertion polls, and a candidate cannot score by
// pleasing a handle because no handle can change anything.
//
// Load order matters: the entry document loads this file immediately after the page script, so every
// global it reads is already declared, and it still runs before DOMContentLoaded, so it is installed
// before the page's own first render pass.
(function () {
  "use strict";

  var byTestId = function (id) { return document.querySelector('[data-testid="' + id + '"]'); };
  var byId = function (id) { return document.getElementById(id); };
  var computed = function (el, prop) { return el ? window.getComputedStyle(el)[prop] : null; };
  var inlineDisplay = function (el) { return el ? el.style.display : null; };
  var rows = function () { return document.querySelectorAll('[data-testid="rb-recent-items"] > li'); };
  var row = function (i) { var r = rows(); return i >= 0 && i < r.length ? r[i] : null; };
  var readRecent = function () {
    try { return JSON.parse(window.localStorage.getItem("recentVideos") || "[]"); }
    catch (err) { return null; }
  };
  var sameOriginUrl = function (raw) {
    if (typeof raw !== "string" || raw === "") return null;
    try { return new URL(raw, window.location.href); } catch (err) { return null; }
  };
  var isOffOrigin = function (raw) {
    var u = sameOriginUrl(raw);
    if (!u) return false;
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return u.origin !== window.location.origin;
  };
  // rel values that make a <link> fetch something. "canonical"/"alternate"/... are inert metadata.
  var LOADING_RELS = ["stylesheet", "icon", "shortcut icon", "apple-touch-icon", "manifest", "preload",
    "prefetch", "modulepreload", "preconnect", "dns-prefetch", "subresource", "import", "profile"];

  var facade = {
    // ---- document / lifecycle ----
    docReadyState: function () { return document.readyState; },
    documentTitle: function () { return document.title; },
    htmlLangAttribute: function () { return document.documentElement.getAttribute("lang"); },
    themeColorContent: function () { return (document.querySelector('meta[name="theme-color"]') || {}).content || null; },
    versionLineText: function () { var e = byTestId("rb-version"); return e ? e.textContent.trim() : null; },
    noticeMentionsVtt: function () { var e = byTestId("rb-notice"); return !!e && e.textContent.indexOf(".vtt") !== -1; },
    noticeMentionsSrt: function () { var e = byTestId("rb-notice"); return !!e && e.textContent.indexOf(".srt") !== -1; },
    footerPresent: function () { return !!byTestId("rb-footer"); },

    // ---- facade self-description + residue ----
    facadeInstalled: function () { return typeof window.__rb_neovid === "object" && window.__rb_neovid !== null; },
    facadeIsFrozen: function () { return Object.isFrozen(window.__rb_neovid); },
    facadeIsEnumerable: function () {
      var d = Object.getOwnPropertyDescriptor(window, "__rb_neovid");
      return d ? !!d.enumerable : null;
    },
    facadeIsWritable: function () {
      var d = Object.getOwnPropertyDescriptor(window, "__rb_neovid");
      return d ? !!d.writable : null;
    },
    facadeMemberCount: function () { return Object.getOwnPropertyNames(window.__rb_neovid).length; },
    undeclaredResidueCount: function () {
      var declared = window.__rb_residue || [];
      return Object.getOwnPropertyNames(window).filter(function (n) {
        return n.indexOf("__rb_") === 0 && declared.indexOf(n) === -1;
      }).length;
    },

    // ---- storage / URL state isolation ----
    localStorageKeyList: function () { return JSON.stringify(Object.keys(window.localStorage).sort()); },
    sessionStorageKeyList: function () { return JSON.stringify(Object.keys(window.sessionStorage).sort()); },
    cookieEntryCount: function () {
      var c = document.cookie;
      return c === "" ? 0 : c.split(";").filter(function (x) { return x.trim() !== ""; }).length;
    },
    locationSearchString: function () { return window.location.search; },
    locationPathIsEntry: function () { return /\/index\.html$/.test(window.location.pathname); },
    storedWatchTimeRaw: function () { return window.localStorage.getItem("watchTime"); },
    storedRecentRaw: function () { return window.localStorage.getItem("recentVideos"); },
    storedItemCount: function () { var r = readRecent(); return r ? r.length : null; },
    storedItemTitleAt: function (i) { var r = readRecent(); return r && r[i] ? String(r[i].title) : null; },
    storedItemVideoTypeAt: function (i) { var r = readRecent(); return r && r[i] ? String(r[i].videoType) : null; },
    storedItemProgressOfTitle: function (t) {
      var r = readRecent();
      if (!r) return null;
      for (var i = 0; i < r.length; i++) if (r[i] && r[i].title === t) return Number(r[i].progress);
      return null;
    },
    storedListContainsTitle: function (t) {
      var r = readRecent();
      if (!r) return null;
      return r.some(function (x) { return !!x && x.title === t; });
    },

    // ---- seed's own pure functions (called with explicit arguments, no model contact) ----
    formatSeconds: function (n) { try { return formatTime(Number(n)); } catch (err) { return null; } },
    truncateTo: function (t, n) { try { return truncateTitle(t, Number(n)); } catch (err) { return null; } },
    truncateWithDefaultBudget: function (t) { try { return truncateTitle(t); } catch (err) { return null; } },
    progressGradientFor: function (p) { try { return getProgressBackground(Number(p)); } catch (err) { return null; } },
    configTitleMaxLength: function () { try { return Number(CONFIG.LIMITS.TITLE_MAX_LENGTH); } catch (err) { return null; } },
    configRecentTitleRatio: function () { try { return Number(CONFIG.LIMITS.RECENT_TITLE_RATIO); } catch (err) { return null; } },
    configCompletedPercent: function () { try { return Number(CONFIG.LIMITS.COMPLETED_PERCENT); } catch (err) { return null; } },
    configRecentSizeCap: function () { try { return Number(CONFIG.LIMITS.RECENT_SIZE); } catch (err) { return null; } },
    configVolumeStep: function () { try { return Number(CONFIG.LIMITS.VOLUME_STEP); } catch (err) { return null; } },
    configSkipThreshold: function () { try { return Number(CONFIG.LIMITS.SKIP_THRESHOLD); } catch (err) { return null; } },

    // ---- model state (the seed's own top-level `state` binding) ----
    modelCurrentVideo: function () { try { return state.currentVideo === null ? "NULL" : String(state.currentVideo); } catch (err) { return null; } },
    modelCurrentVideoType: function () { try { return String(state.currentVideoType); } catch (err) { return null; } },
    modelCurrentTitle: function () { try { return state.currentTitle === null ? "NULL" : String(state.currentTitle); } catch (err) { return null; } },
    modelCurrentSubtitle: function () { try { return state.currentSubtitle === "" ? "EMPTY" : String(state.currentSubtitle); } catch (err) { return null; } },
    modelTotalWatchTime: function () { try { return Number(state.totalWatchTime); } catch (err) { return null; } },

    // ---- watch-time readout ----
    watchTimeText: function () { var e = byTestId("rb-watch-time"); return e ? e.textContent : null; },
    watchTimeComputedDisplay: function () { return computed(byTestId("rb-watch-time"), "display"); },
    watchTimeHasLayoutBox: function () { var e = byTestId("rb-watch-time"); return e ? e.getClientRects().length > 0 : null; },
    watchTimeAriaLive: function () { var e = byTestId("rb-watch-time"); return e ? e.getAttribute("aria-live") : null; },
    watchTimeLabelComputedDisplay: function () { return computed(byTestId("rb-watch-time-label"), "display"); },
    watchTimeLabelFontWeight: function () { return computed(byTestId("rb-watch-time-label"), "fontWeight"); },
    watchTimeLabelText: function () { var e = byTestId("rb-watch-time-label"); return e ? e.textContent.trim() : null; },
    watchTimeContainerTextAlign: function () { return computed(byTestId("rb-watch-time-container"), "textAlign"); },
    watchTimeResetButtonPresent: function () { return !!byTestId("rb-reset-watch-time-button"); },

    // ---- recently-played list ----
    renderedRowCount: function () { return rows().length; },
    renderedRowTitleAt: function (i) {
      var r = row(i); if (!r) return null;
      var t = r.querySelector(".recent-title");
      return t ? t.textContent : null;
    },
    renderedRowTitleLengthAt: function (i) {
      var r = row(i); if (!r) return null;
      var t = r.querySelector(".recent-title");
      return t ? t.textContent.length : null;
    },
    renderedTitleFitsItsBudget: function () {
      var list = byTestId("rb-recent-items");
      var r = row(0);
      if (!list || !r) return null;
      var t = r.querySelector(".recent-title");
      if (!t) return null;
      try { return t.textContent.length <= list.offsetWidth / Number(CONFIG.LIMITS.RECENT_TITLE_RATIO); }
      catch (err) { return null; }
    },
    renderedRowTitleBudget: function () {
      var list = byTestId("rb-recent-items");
      if (!list) return null;
      try { return Number(list.offsetWidth) / Number(CONFIG.LIMITS.RECENT_TITLE_RATIO); } catch (err) { return null; }
    },
    renderedRowIconClassListAt: function (i) {
      var r = row(i); if (!r) return null;
      var t = r.querySelector(".recent-title"); if (!t) return null;
      return JSON.stringify(Array.prototype.map.call(t.querySelectorAll("i"), function (e) { return e.className; }));
    },
    renderedRowTagClassListAt: function (i) {
      var r = row(i); if (!r) return null;
      var t = r.querySelector(".recent-title"); if (!t) return null;
      return JSON.stringify(Array.prototype.map.call(t.querySelectorAll("span"), function (e) { return e.className; }));
    },
    renderedRowTagCountAt: function (i) {
      var r = row(i); if (!r) return null;
      var t = r.querySelector(".recent-title");
      return t ? t.querySelectorAll("span").length : null;
    },
    renderedRowProgressTextAt: function (i) {
      var r = row(i); if (!r) return null;
      var p = r.querySelector(".recent-progress");
      return p ? p.textContent : null;
    },
    renderedRowProgressIsIconAt: function (i) {
      var r = row(i); if (!r) return null;
      var p = r.querySelector(".recent-progress");
      return p ? p.querySelectorAll("i").length > 0 : null;
    },
    renderedRowBackgroundAt: function (i) { var r = row(i); return r ? r.style.background : null; },
    renderedRowRemoveIconAt: function (i) {
      var r = row(i); if (!r) return null;
      var d = r.querySelector(".recent-remove i");
      return d ? d.className : null;
    },
    exportInlineDisplay: function () { return inlineDisplay(byTestId("rb-export-button")); },
    removeAllInlineDisplay: function () { return inlineDisplay(byTestId("rb-remove-all-button")); },
    recentNoticeInlineDisplay: function () { return inlineDisplay(byTestId("rb-recent-notice")); },
    importButtonPresent: function () { return !!byTestId("rb-import-button"); },
    resumeButtonDisabled: function () { var e = byTestId("rb-resume-button"); return e ? !!e.disabled : null; },

    // ---- form / load-type selects / buttons ----
    videoUrlValue: function () { var e = byTestId("rb-video-url"); return e ? e.value : null; },
    subtitleUrlValue: function () { var e = byTestId("rb-subtitle-url"); return e ? e.value : null; },
    videoUrlInlineDisplay: function () { return inlineDisplay(byTestId("rb-video-url")); },
    videoFileInlineDisplay: function () { return inlineDisplay(byTestId("rb-video-file")); },
    videoFileComputedDisplay: function () { return computed(byTestId("rb-video-file"), "display"); },
    subtitleUrlInlineDisplay: function () { return inlineDisplay(byTestId("rb-subtitle-url")); },
    subtitleFileInlineDisplay: function () { return inlineDisplay(byTestId("rb-subtitle-file")); },
    videoSelectValue: function () { var e = byTestId("rb-video-load-type"); return e ? e.value : null; },
    subtitleSelectValue: function () { var e = byTestId("rb-subtitle-load-type"); return e ? e.value : null; },
    videoSelectOptionLabelList: function () {
      var e = byTestId("rb-video-load-type"); if (!e) return null;
      return JSON.stringify(Array.prototype.map.call(e.options, function (o) { return o.text; }));
    },
    subtitleSelectOptionLabelList: function () {
      var e = byTestId("rb-subtitle-load-type"); if (!e) return null;
      return JSON.stringify(Array.prototype.map.call(e.options, function (o) { return o.text; }));
    },
    subtitleSelectOptionCount: function () { var e = byTestId("rb-subtitle-load-type"); return e ? e.options.length : null; },
    subtitleFileAcceptAttribute: function () { var e = byTestId("rb-subtitle-file"); return e ? e.getAttribute("accept") : null; },
    videoFileAcceptAttribute: function () { var e = byTestId("rb-video-file"); return e ? e.getAttribute("accept") : null; },
    // Reads the seed's own form-collection routine. Guarded so that it can never open a dialog: the
    // routine only shows an alert when the video field is empty, and this handle returns null instead
    // of calling it in that case. With a filled video field it is a pure read of the two selects.
    formCollectedSubtitleType: function () {
      try {
        if (!byTestId("rb-video-url").value.trim()) return null;
        var d = getFormData();
        return d ? String(d.subtitleType) : null;
      } catch (err) { return null; }
    },
    formCollectedVideoType: function () {
      try {
        if (!byTestId("rb-video-url").value.trim()) return null;
        var d = getFormData();
        return d ? String(d.videoType) : null;
      } catch (err) { return null; }
    },
    playButtonTypeAttribute: function () { var e = byTestId("rb-play-button"); return e ? e.getAttribute("type") : null; },
    exportButtonTypeAttribute: function () { var e = byTestId("rb-export-button"); return e ? e.getAttribute("type") : null; },
    importButtonTypeAttribute: function () { var e = byTestId("rb-import-button"); return e ? e.getAttribute("type") : null; },
    removeAllButtonTypeAttribute: function () { var e = byTestId("rb-remove-all-button"); return e ? e.getAttribute("type") : null; },
    downloadVideoButtonDisabled: function () { var e = byTestId("rb-download-video-button"); return e ? !!e.disabled : null; },
    downloadSubtitleButtonDisabled: function () { var e = byTestId("rb-download-subtitle-button"); return e ? !!e.disabled : null; },
    formElementPresent: function () { return !!byTestId("rb-video-form"); },

    // ---- player / keyboard surface (no media asset is needed for any of these) ----
    playerSourceElementCount: function () { var e = byTestId("rb-video-player"); return e ? e.querySelectorAll("source").length : null; },
    playerTrackElementCount: function () { var e = byTestId("rb-video-player"); return e ? e.querySelectorAll("track").length : null; },
    playerMutedFlag: function () { var e = byTestId("rb-video-player"); return e ? !!e.muted : null; },
    playerVolumeValue: function () { var e = byTestId("rb-video-player"); return e ? Number(e.volume) : null; },
    playerControlsAttribute: function () { var e = byTestId("rb-video-player"); return e ? !!e.controls : null; },
    playerPreloadAttribute: function () { var e = byTestId("rb-video-player"); return e ? e.getAttribute("preload") : null; },

    // ---- player overlay anchoring ----
    wrapperComputedPosition: function () { return computed(byTestId("rb-video-wrapper"), "position"); },
    wrapperComputedMaxWidth: function () { return computed(byTestId("rb-video-wrapper"), "maxWidth"); },
    playerComputedMaxWidth: function () { return computed(byTestId("rb-video-player"), "maxWidth"); },
    skipButtonComputedPosition: function () { return computed(byTestId("rb-skip-button"), "position"); },
    skipButtonComputedDisplay: function () { return computed(byTestId("rb-skip-button"), "display"); },
    skipButtonInlineDisplay: function () { return inlineDisplay(byTestId("rb-skip-button")); },
    skipButtonAriaLabel: function () { var e = byTestId("rb-skip-button"); return e ? e.getAttribute("aria-label") : null; },

    // ---- install banner ----
    installBannerComputedDisplay: function () { return computed(byTestId("rb-install-banner"), "display"); },
    installBannerComputedZIndex: function () { return computed(byTestId("rb-install-banner"), "zIndex"); },
    installBannerComputedPosition: function () { return computed(byTestId("rb-install-banner"), "position"); },
    installBannerComputedTop: function () { return computed(byTestId("rb-install-banner"), "top"); },
    installBannerHasLayoutBox: function () { var e = byTestId("rb-install-banner"); return e ? e.getClientRects().length > 0 : null; },
    installButtonPresent: function () { return !!byTestId("rb-install-button"); },
    closeInstallButtonPresent: function () { return !!byTestId("rb-close-install"); },

    // ---- service worker (async; dsl_runner awaits a promise returned by js_eval) ----
    serviceWorkerSupported: function () { return "serviceWorker" in navigator; },
    serviceWorkerControllerAttached: function () { return !!navigator.serviceWorker.controller; },
    serviceWorkerControllerUrlSameOrigin: function () {
      var c = navigator.serviceWorker.controller;
      return c ? isOffOrigin(c.scriptURL) === false : null;
    },
    serviceWorkerRegistrationPresent: function () {
      return navigator.serviceWorker.getRegistration().then(function (r) { return !!r; }).catch(function () { return null; });
    },
    serviceWorkerScopePathname: function () {
      return navigator.serviceWorker.getRegistration().then(function (r) {
        return r ? new URL(r.scope).pathname : null;
      }).catch(function () { return null; });
    },
    serviceWorkerActiveStateName: function () {
      return navigator.serviceWorker.getRegistration().then(function (r) {
        return r && r.active ? String(r.active.state) : "NONE";
      }).catch(function () { return null; });
    },
    serviceWorkerScriptIsSameOrigin: function () {
      return navigator.serviceWorker.getRegistration().then(function (r) {
        var w = r && (r.active || r.installing || r.waiting);
        return w ? isOffOrigin(w.scriptURL) === false : null;
      }).catch(function () { return null; });
    },

    // ---- offline self-sufficiency (the adaptation self-proof, measured on the served face) ----
    offOriginLoadingElementCount: function () {
      var n = 0;
      var pairs = [["script", "src"], ["img", "src"], ["source", "src"], ["track", "src"], ["iframe", "src"],
        ["video", "src"], ["audio", "src"], ["embed", "src"]];
      pairs.forEach(function (p) {
        Array.prototype.forEach.call(document.querySelectorAll(p[0] + "[" + p[1] + "]"), function (e) {
          if (isOffOrigin(e.getAttribute(p[1]))) n += 1;
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll("link[href]"), function (e) {
        var rel = String(e.getAttribute("rel") || "").toLowerCase();
        var loads = LOADING_RELS.some(function (r) { return rel === r || rel.split(/\s+/).indexOf(r) !== -1; });
        if (loads && isOffOrigin(e.getAttribute("href"))) n += 1;
      });
      return n;
    },
    offOriginInertReferenceCount: function () {
      var n = 0;
      var c = document.querySelector('link[rel="canonical"][href]');
      if (c && /^https?:/i.test(c.getAttribute("href"))) n += 1;
      Array.prototype.forEach.call(
        document.querySelectorAll('meta[property^="og:"][content], meta[name^="twitter:"][content]'),
        function (m) { if (/^https?:/i.test(String(m.getAttribute("content") || ""))) n += 1; });
      Array.prototype.forEach.call(document.querySelectorAll("a[href]"), function (a) {
        if (/^https?:/i.test(String(a.getAttribute("href") || ""))) n += 1;
      });
      return n;
    },
    remoteScriptElementCount: function () {
      return Array.prototype.filter.call(document.scripts, function (s) {
        return !!s.src && isOffOrigin(s.src);
      }).length;
    },
    coreLoadPathAbsoluteHttpHitCount: function () {
      // every element that the browser will actually fetch on the load path, plus every @font-face
      // src in every same-origin stylesheet, resolved against its own sheet: 0 means the served face
      // pulls nothing from outside its own origin.
      var n = 0;
      Array.prototype.forEach.call(document.querySelectorAll("script[src]"), function (e) {
        if (/^\s*(https?:)?\/\//i.test(e.getAttribute("src"))) n += 1;
      });
      Array.prototype.forEach.call(document.querySelectorAll("link[href]"), function (e) {
        var rel = String(e.getAttribute("rel") || "").toLowerCase();
        var loads = LOADING_RELS.some(function (r) { return rel === r || rel.split(/\s+/).indexOf(r) !== -1; });
        if (loads && /^\s*(https?:)?\/\//i.test(e.getAttribute("href"))) n += 1;
      });
      Array.prototype.forEach.call(document.querySelectorAll("img[src],source[src],track[src],video[src],iframe[src]"), function (e) {
        if (/^\s*(https?:)?\/\//i.test(e.getAttribute("src"))) n += 1;
      });
      Array.prototype.forEach.call(document.styleSheets, function (sh) {
        var rules = null;
        try { rules = sh.cssRules; } catch (err) { n += 1; return; }
        if (!rules) return;
        var base = sh.href || window.location.href;
        Array.prototype.forEach.call(rules, function (r) {
          var isFontFace = (typeof CSSFontFaceRule !== "undefined" && r instanceof CSSFontFaceRule) ||
            String(r.constructor && r.constructor.name) === "CSSFontFaceRule";
          if (!isFontFace || !r.style) return;
          var src = r.style.getPropertyValue("src") || "";
          var m = src.match(/url\(\s*['"]?([^'")]*)['"]?\s*\)/g) || [];
          m.forEach(function (one) {
            var inner = one.replace(/^url\(\s*['"]?/, "").replace(/['"]?\s*\)$/, "");
            if (/^\s*(https?:)?\/\//i.test(inner)) { n += 1; return; }
            try { if (new URL(inner, base).origin !== window.location.origin) n += 1; } catch (err) { n += 1; }
          });
        });
      });
      return n;
    },
    styleSheetCount: function () { return document.styleSheets.length; },
    scriptElementCount: function () { return document.scripts.length; }
  };

  var frozen = Object.freeze(facade);
  Object.defineProperty(window, "__rb_neovid", {
    value: frozen, writable: false, enumerable: false, configurable: false
  });
  // The residue marker: the complete list of __rb_* globals this probe is allowed to install. A
  // state-isolation checkpoint asserts that no other __rb_* property exists on window, which is the
  // directed counter to a fix that smuggles a flag through a global.
  Object.defineProperty(window, "__rb_residue", {
    value: Object.freeze(["__rb_neovid", "__rb_residue"]), writable: false, enumerable: false, configurable: false
  });
})();
