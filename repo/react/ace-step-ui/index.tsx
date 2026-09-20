import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ResponsiveProvider } from './context/ResponsiveContext';

// ---------------------------------------------------------------------------
// RB INSTRUMENTATION - verification probes only, ZERO behaviour change.
// One non-enumerable global, window.__rb_asu, carrying read-only handles that the
// verifier's checkpoints call. EVERY handle is a pure read of the DOM or of the
// web stores: no setter, no cache, no write to any state, storage, cookie or URL.
// Three consequences the design leans on:
//   * assertions are polled by evaluation/dsl_runner.mjs (evalAssert re-runs the
//     expression every 150 ms until it holds or the per-checkpoint timeout
//     expires), so a handle that mutated anything could flip its own checkpoint
//     false-green on the second poll. Pure reads cannot.
//   * a candidate fix cannot score by flattering the facade - there is nothing to
//     flatter, the handles only report what the app itself rendered.
//   * no application module reads window.__rb_asu, so deleting this whole block
//     and every data-rb-* attribute changes no behaviour.
// The data-rb-* attributes the components carry are the state mirror these
// handles read. They are inert markup (React renders them, nothing consumes
// them) and every one of them is listed in tests/leakage_config.json#hard so the
// repair brief cannot name them.
// ---------------------------------------------------------------------------
(function installRbFacade() {
  var q = function (sel) { try { return document.querySelector(sel); } catch (e) { return null; } };
  var qa = function (sel) { try { return Array.prototype.slice.call(document.querySelectorAll(sel)); } catch (e) { return []; } };
  var norm = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
  var attrOf = function (el, name) {
    if (!el || !el.getAttribute) return 'ABSENT';
    var v = el.getAttribute(name);
    return v === null ? 'ABSENT' : String(v);
  };
  var attr = function (sel, name) { return attrOf(q(sel), name); };
  var rb = function (name) { return attr('[data-rb-' + name + ']', 'data-rb-' + name); };
  var txt = function (sel) { var el = q(sel); return el === null ? 'ABSENT' : norm(el.textContent); };
  var cnt = function (sel) { return qa(sel).length; };
  var val = function (sel) { var el = q(sel); return el === null ? 'ABSENT' : String(el.value === undefined || el.value === null ? '' : el.value); };
  var byText = function (sel, want) {
    var list = qa(sel);
    for (var i = 0; i < list.length; i++) { if (norm(list[i].textContent) === want) return list[i]; }
    return null;
  };
  var childWithClass = function (sel, frag) {
    var list = qa(sel);
    for (var i = 0; i < list.length; i++) {
      if (!list[i].querySelectorAll) continue;
      var kids = Array.prototype.slice.call(list[i].querySelectorAll('*'));
      for (var j = 0; j < kids.length; j++) { if (String(kids[j].className || '').indexOf(frag) >= 0) return list[i]; }
    }
    return null;
  };
  // Every key the application itself may write to localStorage, in the baseline
  // AND in the mutated build (the drifted persistence key is listed too, so the
  // residue check below is face-invariant and can never go red because of a
  // defect). Sorted, so the joined string is a stable scalar.
  var DECLARED_KEYS = ['ace-batchSize', 'ace-bulkCount', 'ace-dismissed-news', 'ace-lmModel', 'ace-model', 'ace-theme', 'acestep_lyrics_height', 'acestep_token', 'acestep_user', 'language', 'pexels_api_key', 'theme', 'volume'];
  var facade = {
    // ---- identity ----
    version: function () { return 'rb-asu-1'; },
    // ---- boot gate (every checkpoint that needs the app alive reads this) ----
    booted: function () { return rb('app') === '1' && rb('auth-loading') === 'false'; },
    // ---- generic probe reads ----
    probe: function (name) { return rb(String(name)); },
    attr: function (sel, name) { return attr(String(sel), String(name)); },
    text: function (sel) { return txt(String(sel)); },
    value: function (sel) { return val(String(sel)); },
    count: function (sel) { return cnt(String(sel)); },
    present: function (sel) { return q(String(sel)) !== null; },
    //
    storage: function (k) { var v = null; try { v = localStorage.getItem(String(k)); } catch (e) { return 'THREW'; } return v === null ? 'NULL' : String(v); },
    storageKeys: function () { var a = []; try { for (var i = 0; i < localStorage.length; i++) a.push(localStorage.key(i)); } catch (e) { return 'THREW'; } return a.sort().join(','); },
    undeclaredKeys: function () { var a = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (DECLARED_KEYS.indexOf(k) < 0) a.push(k); } } catch (e) { return 'THREW'; } return a.sort().join(','); },
    declaredKeys: function () { return DECLARED_KEYS.slice().sort().join(','); },
    sessionLen: function () { try { return sessionStorage.length; } catch (e) { return -1; } },
    cookie: function () { try { return document.cookie === undefined ? 'UNDEF' : String(document.cookie); } catch (e) { return 'THREW'; } },
    pathname: function () { return String(location.pathname); },
    search: function () { return String(location.search); },
    hash: function () { return String(location.hash); },
    // ---- app shell ----
    authed: function () { return rb('authed') === 'true'; },
    usernameModal: function () { return rb('username-modal') === 'true'; },
    view: function () { return rb('view'); },
    themeProbe: function () { return rb('theme'); },
    htmlTheme: function () { return document.documentElement.classList.contains('dark') ? 'dark' : 'light'; },
    songCount: function () { var v = rb('song-count'); return v === 'ABSENT' ? -1 : Number(v); },
    settingsModalOpen: function () { return rb('settings-modal') === 'true'; },
    generating: function () { return rb('generating') === 'true'; },
    // ---- sidebar ----
    sidebarOpen: function () { return rb('sidebar') === 'true'; },
    sidebarProbe: function () { return rb('sidebar'); },
    brandPresent: function () {
      var list = qa('[data-rb-sidebar] span');
      for (var i = 0; i < list.length; i++) { if (norm(list[i].textContent) === 'ACE Step') return true; }
      return false;
    },
    navTitles: function () {
      return qa('[data-rb-nav]').map(function (b) { return String(b.getAttribute('data-rb-nav') || ''); }).filter(Boolean).join(',');
    },
    navActiveTitle: function () {
      var b = childWithClass('[data-rb-nav]', 'bg-pink-500');
      return b === null ? 'NONE' : String(b.getAttribute('data-rb-nav') || 'NOTITLE');
    },
    sidebarToggleTitle: function () {
      var list = qa('[data-rb-sidebar] button[title]');
      for (var i = 0; i < list.length; i++) {
        var t = String(list[i].getAttribute('title') || '');
        if (t === 'Collapse Sidebar' || t === 'Expand Sidebar') return t;
      }
      return 'ABSENT';
    },
    themeToggleTitle: function () {
      var list = qa('[data-rb-sidebar] button[title]');
      for (var i = 0; i < list.length; i++) {
        var t = String(list[i].getAttribute('title') || '');
        if (t === 'Light Mode' || t === 'Dark Mode') return t;
      }
      return 'ABSENT';
    },
    // ---- create panel ----
    createPanelPresent: function () { return q('[data-rb-create-panel]') !== null; },
    cp: function (name) { return attr('[data-rb-create-panel]', 'data-rb-' + String(name)); },
    customMode: function () { return rb('custom-mode'); },
    bpmProbe: function () { return rb('bpm'); },
    durationProbe: function () { return rb('duration'); },
    batchSizeProbe: function () { return rb('batch-size'); },
    bulkCountProbe: function () { return rb('bulk-count'); },
    showAdvancedProbe: function () { return rb('show-advanced'); },
    styleProbe: function () { return rb('style'); },
    selectedModelProbe: function () { return rb('selected-model'); },
    inferenceStepsProbe: function () { return rb('inference-steps'); },
    maxDurationProbe: function () { return rb('max-duration'); },
    styleInputPresent: function () { return q('[data-rb-style-input]') !== null; },
    styleInput: function () { return val('[data-rb-style-input]'); },
    tagChipCount: function () { return cnt('[data-rb-tag-chips] button'); },
    tagChipText: function (i) { var l = qa('[data-rb-tag-chips] button'); var e = l[Number(i)]; return e === undefined ? 'ABSENT' : norm(e.textContent); },
    tagChips: function () { return qa('[data-rb-tag-chips] button').map(function (b) { return norm(b.textContent); }).join('|'); },
    advancedTogglePresent: function () { return q('[data-rb-advanced-toggle]') !== null; },
    advancedToggleText: function () { return txt('[data-rb-advanced-toggle]'); },
    advancedPanelPresent: function () { return q('[data-rb-advanced-panel]') !== null; },
    advancedPanelText: function () { return txt('[data-rb-advanced-panel]'); },
    musicParametersPresent: function () { return byText('[data-rb-create-panel] h3', 'Music Parameters') !== null; },
    createButtonPresent: function () { return q('[data-rb-create-button]') !== null; },
    createButtonText: function () { return txt('[data-rb-create-button]'); },
    createButtonDisabled: function () { var b = q('[data-rb-create-button]'); return b === null ? null : !!b.disabled; },
    modelMenuButtonPresent: function () { return q('[data-rb-model-menu-button]') !== null; },
    modelButtonText: function () { return txt('[data-rb-model-menu-button]'); },
    modelMenuButtonDisabled: function () { var b = q('[data-rb-model-menu-button]'); return b === null ? null : !!b.disabled; },
    modelOptionCount: function () { return cnt('[data-rb-model-option]'); },
    modelOptionIds: function () { return qa('[data-rb-model-option]').map(function (b) { return String(b.getAttribute('data-rb-model-option') || ''); }).join(','); },
    modelOptionText: function (id) { var b = q('[data-rb-model-option="' + String(id) + '"]'); return b === null ? 'ABSENT' : norm(b.textContent); },
    // ---- editable sliders ----
    esCount: function (label) { return cnt('[data-rb-es="' + String(label) + '"]'); },
    esPresent: function (label) { return q('[data-rb-es="' + String(label) + '"]') !== null; },
    esValue: function (label) { return attr('[data-rb-es="' + String(label) + '"]', 'data-rb-es-value'); },
    esMin: function (label) { return attr('[data-rb-es="' + String(label) + '"]', 'data-rb-es-min'); },
    esMax: function (label) { return attr('[data-rb-es="' + String(label) + '"]', 'data-rb-es-max'); },
    esStep: function (label) { return attr('[data-rb-es="' + String(label) + '"]', 'data-rb-es-step'); },
    esDisplay: function (label) { return txt('[data-rb-es="' + String(label) + '"] [data-rb-es-display]'); },
    esRangeValue: function (label) { return val('[data-rb-es="' + String(label) + '"] [data-rb-es-range]'); },
    esInputPresent: function (label) { return q('[data-rb-es="' + String(label) + '"] [data-rb-es-input]') !== null; },
    // ---- news ----
    newsPresent: function () { return q('[data-rb-news]') !== null; },
    newsActive: function () { var v = rb('news-active'); return v === 'ABSENT' ? -1 : Number(v); },
    newsDismissed: function () { var v = rb('news-dismissed'); return v === 'ABSENT' ? -1 : Number(v); },
    newsDismissButtonCount: function () { return cnt('[data-rb-news] button[title="Dismiss"]'); },
    newsRestoreButtonCount: function () {
      return qa('[data-rb-news] button').filter(function (b) { return norm(b.textContent) === 'Restore'; }).length;
    },
    newsFirstActiveTitle: function () { return txt('[data-rb-news] h3'); },
    // ---- library ----
    libPresent: function () { return q('[data-rb-library]') !== null; },
    libTab: function () { return rb('lib-tab'); },
    libAll: function () { var v = rb('lib-all'); return v === 'ABSENT' ? -1 : Number(v); },
    libLiked: function () { var v = rb('lib-liked'); return v === 'ABSENT' ? -1 : Number(v); },
    libPlaylists: function () { var v = rb('lib-playlists'); return v === 'ABSENT' ? -1 : Number(v); },
    libTabCount: function () { return cnt('[data-rb-lib-tabs] button'); },
    libTabLabels: function () { return qa('[data-rb-lib-tabs] button').map(function (b) { return norm(b.textContent); }).join('|'); },
    libActiveTabLabel: function () {
      var b = childWithClass('[data-rb-lib-tabs] button', 'bg-green-500');
      return b === null ? 'NONE' : norm(b.textContent);
    },
    libEmptyText: function () {
      var list = qa('[data-rb-library] div');
      for (var i = 0; i < list.length; i++) { if (norm(list[i].textContent) === 'No songs yet.') return 'No songs yet.'; }
      return 'ABSENT';
    },
    libHeading: function () { return txt('[data-rb-library] h1'); },
    // ---- toast ----
    toastPresent: function () { return q('[data-rb-toast]') !== null; },
    toastType: function () { return rb('toast'); },
    toastText: function () { return txt('[data-rb-toast]'); },
    // ---- player ----
    playerMode: function () { return rb('player'); },
    playerMinimalText: function () { return txt('[data-rb-player="minimal"]'); },
    // ---- settings modal ----
    settingsPanelPresent: function () { return q('[data-rb-settings-panel]') !== null; },
    settingsHeading: function () { return txt('[data-rb-settings-panel] h2'); },
    settingsThemeProbe: function () { return attr('[data-rb-settings-panel]', 'data-rb-settings-theme'); },
    settingsLangValue: function () { return val('[data-rb-lang-select]'); },
    settingsLangOptionCount: function () { return cnt('[data-rb-lang-select] option'); },
    settingsButtonLabels: function () {
      return qa('[data-rb-settings-panel] button').map(function (b) { return norm(b.textContent); }).filter(Boolean).join('|');
    },
    settingsLightPresent: function () { return byText('[data-rb-settings-panel] button', 'Light') !== null; },
    settingsDarkPresent: function () { return byText('[data-rb-settings-panel] button', 'Dark') !== null; },
    settingsUsername: function () { return txt('[data-rb-settings-panel] h3'); },
    settingsClosePresent: function () { return q('[data-rb-settings-close]') !== null; },
    // ---- probe-keyed element reads. Every one is a pure read of an attribute, a
    //      text node or a node count; NONE of them clicks, focuses, sets or writes.
    //      They exist so a checkpoint setup can address an element by a stable
    //      instrumentation attribute instead of by visible text (the i18n layer owns
    //      that text, and a label edit by the answering model would otherwise move a
    //      locator under a still-correct fix). ----
    navCount: function () { return cnt('[data-rb-nav]'); },
    navPresent: function (label) { return q('[data-rb-nav="' + String(label) + '"]') !== null; },
    navTitle: function (label) { return attr('[data-rb-nav="' + String(label) + '"]', 'title'); },
    advancedToggleProbe: function () { return q('[data-rb-advanced-toggle]') === null ? 'ABSENT' : '1'; },
    themeTogglePresent: function () { return q('[data-rb-theme-toggle]') !== null; },
    themeToggleProbe: function () { return attr('[data-rb-theme-toggle]', 'title'); },
    settingsOpenPresent: function () { return q('[data-rb-settings-open]') !== null; },
    settingsOpenTitle: function () { return attr('[data-rb-settings-open]', 'title'); },
    sidebarTogglePresent: function () { return q('[data-rb-sidebar-toggle]') !== null; },
    sidebarToggleProbe: function () { return attr('[data-rb-sidebar-toggle]', 'title'); },
    newsDismissCount: function () { return cnt('[data-rb-news-dismiss]'); },
    newsDismissIds: function () { return qa('[data-rb-news-dismiss]').map(function (b) { return String(b.getAttribute('data-rb-news-dismiss') || ''); }).join(','); },
    libTabButtonCount: function () { return cnt('[data-rb-lib-tab-button]'); },
    libTabButtonIds: function () { return qa('[data-rb-lib-tab-button]').map(function (b) { return String(b.getAttribute('data-rb-lib-tab-button') || ''); }).join(','); },
    libTabButtonPresent: function (tab) { return q('[data-rb-lib-tab-button="' + String(tab) + '"]') !== null; },
    themeOptionPresent: function (which) { return q('[data-rb-theme-option="' + String(which) + '"]') !== null; },
    themeOptionLabel: function (which) { return txt('[data-rb-theme-option="' + String(which) + '"]'); },
    themeOptionCount: function () { return cnt('[data-rb-theme-option]'); },
    esLabels: function () { return qa('[data-rb-es]').map(function (b) { return String(b.getAttribute('data-rb-es') || ''); }).join(','); },
    esCountAll: function () { return cnt('[data-rb-es]'); }
  };
  Object.freeze(facade);
  Object.defineProperty(window, '__rb_asu', { value: facade, enumerable: false, writable: false, configurable: false });
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ResponsiveProvider>
        <App />
      </ResponsiveProvider>
    </AuthProvider>
  </React.StrictMode>
);