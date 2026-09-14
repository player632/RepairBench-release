/**
 * RepairBench instrumentation probe for coreui-free-vue-admin-template.
 * Installs the window.__CUI__ bridge (live reads only - every getter fetches
 * fresh state, nothing is snapshotted) and stamps data-testid probes onto the
 * CoreUI shell DOM (sidebar/header/footer, nav links and groups by route,
 * breadcrumb, theme + account dropdowns, search button/modal, dashboard
 * controls). Chart components register their chart.js instances via
 * registerChart so canvas assertions can ride the bridge instead of pixels.
 */
(function () {
  'use strict';

  var charts = {};

  window.__CUI__ = {
    ready: true,
    registerChart: function (name, inst) {
      if (name && inst) charts[name] = inst;
      return true;
    },
    chart: function (name) {
      return charts[name] || null;
    },
    route: function () {
      var h = window.location.hash || '';
      return h.replace(/^#/, '') || '/';
    },
    themeAttr: function () {
      return document.documentElement.getAttribute('data-coreui-theme');
    },
    lsTheme: function () {
      return localStorage.getItem('coreui-free-vue-admin-template-theme');
    },
  };

  function stamp(el, id) {
    if (el && !el.getAttribute('data-testid')) {
      el.setAttribute('data-testid', id);
    }
    return el;
  }

  function slugHref(href) {
    return String(href)
      .replace(/^#\//, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function directText(el) {
    var s = '';
    for (var i = 0; i < el.childNodes.length; i += 1) {
      if (el.childNodes[i].nodeType === 3) s += el.childNodes[i].textContent;
    }
    return s.trim();
  }

  function slugText(s) {
    return String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function stampTree(root) {
    if (!root || !root.querySelectorAll) return;

    var sidebar = root.querySelector('.sidebar');
    if (sidebar && root === document) stamp(sidebar, 'cui-sidebar');
    var header = root.querySelector('.header');
    if (header && root === document) stamp(header, 'cui-header');
    var footer = root.querySelector('.footer');
    if (footer && root === document) stamp(footer, 'cui-footer');

    var nodes = root.querySelectorAll(
      '.sidebar, .header, .footer, .header-toggler, .sidebar-toggler, .sidebar .nav-link, .nav-group, .breadcrumb, .header .nav-item.dropdown, #headerSearchModal, [aria-label="Open search dialog"], [aria-label="Basic outlined example"]',
    );
    for (var i = 0; i < nodes.length; i += 1) {
      var n = nodes[i];
      if (n.classList.contains('header-toggler')) stamp(n, 'cui-header-toggler');
      if (n.classList.contains('sidebar-toggler')) stamp(n, 'cui-sidebar-toggler');
      if (n.classList.contains('sidebar')) stamp(n, 'cui-sidebar');
      if (n.classList.contains('header')) stamp(n, 'cui-header');
      if (n.classList.contains('footer')) stamp(n, 'cui-footer');
      if (n.classList.contains('breadcrumb')) stamp(n, 'cui-breadcrumb');
      if (n.id === 'headerSearchModal') stamp(n, 'cui-search-modal');
      if (n.getAttribute('aria-label') === 'Open search dialog') stamp(n, 'cui-search-btn');
      if (n.getAttribute('aria-label') === 'Basic outlined example') stamp(n, 'cui-traffic-range');

      if (n.classList.contains('nav-link') && n.closest('.sidebar')) {
        var href = n.getAttribute('href') || '';
        if (href.indexOf('#/') === 0) {
          stamp(n, 'cui-nav-' + slugHref(href));
        } else if (n.classList.contains('nav-group-toggle')) {
          var gt = directText(n);
          if (gt) stamp(n.closest('.nav-group'), 'cui-grp-' + slugText(gt));
        }
      }

      if (n.classList.contains('nav-group') && !n.getAttribute('data-testid')) {
        var tg = n.querySelector(':scope > .nav-group-toggle');
        var t = tg ? directText(tg) : '';
        if (t) stamp(n, 'cui-grp-' + slugText(t));
      }

      if (n.classList.contains('dropdown') && n.closest('.header')) {
        if (n.querySelector('.avatar')) {
          stamp(n, 'cui-acct-dd');
          stamp(n.querySelector('a.nav-link'), 'cui-acct-toggle');
        } else if (!document.querySelector('[data-testid="cui-theme-dd"]') || n.getAttribute('data-testid') === 'cui-theme-dd') {
          stamp(n, 'cui-theme-dd');
          stamp(n.querySelector('a.nav-link'), 'cui-theme-toggle');
          var items = n.querySelectorAll('.dropdown-item');
          for (var j = 0; j < items.length; j += 1) {
            var txt = items[j].textContent || '';
            if (txt.indexOf('Light') !== -1) stamp(items[j], 'cui-theme-light');
            else if (txt.indexOf('Dark') !== -1) stamp(items[j], 'cui-theme-dark');
            else if (txt.indexOf('Auto') !== -1) stamp(items[j], 'cui-theme-auto');
          }
        }
      }
    }
  }

  function boot() {
    stampTree(document);
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i += 1) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j += 1) {
          var node = added[j];
          if (node.nodeType === 1) stampTree(node);
        }
        if (mutations[i].type === 'attributes') stampTree(document);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
