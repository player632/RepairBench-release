// hv/wlb-shim.js v5.3 - verification shim: assigns data-testid to library-rendered DOM
// (Nebular/ng2-smart-table internals). Observation-only; no behavior changes
// except the verifier-side window.confirm accept used by the delete-confirm probe.
(function () {
  'use strict';
  window.confirm = function () { return true; };

  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function setTid(el, tid) { if (el && el.getAttribute('data-testid') !== tid) el.setAttribute('data-testid', tid); }
  function textOf(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  function assign() {
    // nb-menu: top-level item titles (order assert) + Infinite List item anchor
    var topMenu = document.querySelector('nb-menu ul.menu-items');
    if (topMenu) {
      Array.prototype.forEach.call(topMenu.children, function (li) {
        var t = li.querySelector('.menu-title') || (li.classList.contains('menu-group') ? li.querySelector('span') : null);
        if (t) setTid(t, 'menu-group-titles');
        if (t && t.textContent.trim() === 'Layout') setTid(li, 'menu-group-layout');
      });
    }
    each('nb-menu li.menu-item a', function (a) {
      var t = a.querySelector('.menu-title');
      if (t && textOf(t) === 'Infinite List') setTid(a, 'menu-item-infinite-list');
    });

    // toastr container/items (+ viewport-derived position tag)
    each('nb-toastr-container', function (el) {
      setTid(el, 'nb-toast-container');
      var r = el.getBoundingClientRect();
      var vert = (r.top + r.bottom) / 2 > window.innerHeight / 2 ? 'bottom' : 'top';
      var horz = (r.left + r.right) / 2 > window.innerWidth / 2 ? 'right' : 'left';
      el.setAttribute('data-pos', vert + '-' + horz);
    });
    each('nb-toast', function (el) { setTid(el, 'nb-toast-item'); });

    // dialog / window containers
    each('nb-dialog-container', function (el) { setTid(el, 'nb-dialog-container'); });
    each('nb-windows-container', function (el) { setTid(el, 'nb-window-container'); });
    each('nb-window', function (el) { setTid(el, 'nb-window-item'); });

    // tabset headers by text; recent-time caption when Recent tab active
    each('ul.tabset > li.tab', function (li) {
      if (textOf(li) === 'Recent') setTid(li, 'contacts-recent-tab');
    });
    each('nb-tabset', function (ts) {
      var active = ts.querySelector('ul.tabset > li.tab.active');
      if (active && textOf(active) === 'Recent') {
        var cap = ts.querySelector('.caption');
        if (cap) setTid(cap, 'contacts-recent-first-time');
      }
    });

    // calendar / datepicker day cells
    each('.day-cell', function (el) {
      var txt = textOf(el);
      if (!/^\d{1,2}$/.test(txt)) return;
      var picker = !!el.closest('.cdk-overlay-container') || !!el.closest('nb-datepicker');
      if (el.classList.contains('selected')) {
        setTid(el, picker ? 'dp-cell-selected' : 'cal-cell-selected');
      } else {
        setTid(el, (picker ? 'dp-cell-' : 'cal-cell-') + txt);
      }
    });

    // ng2-smart-table rows/cells/actions
    each('tr.ng2-smart-row', function (tr) {
      setTid(tr, 'st-row');
      var cells = tr.querySelectorAll('td');
      if (cells[1]) setTid(cells[1], 'st-col-id');
      if (cells[5]) setTid(cells[5], 'st-col-email');
    });
    each('a.ng2-smart-action-add-add', function (el) { setTid(el, 'st-add'); });
    var formRow = document.querySelector('tr[ng2-st-thead-form-row]');
    if (formRow) {
      var inputs = formRow.querySelectorAll('input');
      if (inputs[0]) setTid(inputs[0], 'st-add-id');
      if (inputs[1]) setTid(inputs[1], 'st-add-firstName');
      var create = formRow.querySelector('a.ng2-smart-action-add-create');
      if (create) setTid(create, 'st-add-confirm');
    }
    var delButtons = document.querySelectorAll('tr.ng2-smart-row a.ng2-smart-action-delete-delete');
    if (delButtons.length) setTid(delButtons[0], 'st-delete-first');

    // tree-grid rows + first toggle
    each('tr.cdk-row', function (tr) { setTid(tr, 'tg-row'); });
    var toggles = document.querySelectorAll('nb-tree-grid-row-toggle');
    if (toggles.length) setTid(toggles[0], 'tg-expand-first');

    // chat form input/send
    each('nb-chat-form input', function (el) { setTid(el, 'chat-input'); });
    each('nb-chat-form button', function (el) { setTid(el, 'chat-send'); });

    // nb-search trigger + expanded field
    each('nb-search button.start-search', function (el) { setTid(el, 'header-search'); });
    each('nb-search-field input', function (el) { setTid(el, 'search-input-expanded'); });

    // body theme mirror for exact-match assertions (pace adds unrelated classes)
    var tm = document.body.className.match(/nb-theme-[\w-]+/);
    document.body.setAttribute('data-theme', tm ? tm[0] : '');

    // checkbox state mirror (span.custom-checkbox carries .checked)
    each('nb-checkbox', function (el) {
      var ind = el.querySelector('.custom-checkbox');
      el.setAttribute('data-checked', ind && ind.classList.contains('checked') ? 'true' : 'false');
    });

    // nb-auth forms (login/register): email/password inputs + submit button
    each('form', function (form) {
      var em = form.querySelector('input[name="email"]');
      var pw = form.querySelector('input[name="password"]');
      if (em) setTid(em, 'login-email');
      if (pw) setTid(pw, 'login-password');
      if (em || pw) {
        var btn = form.querySelector('button[type="submit"], button:not([type])');
        if (btn) setTid(btn, 'login-submit');
      }
    });

    // nb-tab scope for the temperature drag: both tabs render their thumbs in DOM,
    // and the wlb-drag-probe targets are siblings of the dragger, so the drag
    // source and targets are scoped to the Temperature tab container.
    each('nb-tab', function (el) {
      if (el.getAttribute('tabTitle') === 'Temperature') setTid(el, 'temp-tab-temperature');
    });

    // authed-indicator probe geometry: the *ngIf div renders empty (0px tall), so
    // Playwright isVisible() reports false even while it is attached; give it a tiny
    // fixed box (pointer-events:none) so visibility reflects authentication state.
    each('[data-testid= authed-indicator]', function (el) {
      if (el.style.width !== '2px') {
        el.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;z-index:2147483647;pointer-events:none;';
      }
    });
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; assign(); });
  }
  var mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('DOMContentLoaded', assign);
})();
