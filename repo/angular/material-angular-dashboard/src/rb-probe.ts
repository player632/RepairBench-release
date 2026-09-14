// Offline verification probe for the repair-bench harness.
//
// Two responsibilities, both strictly read-only with respect to application
// state:
//   1. window.__MAD__ - a bridge of live getters. Every getter re-queries the
//      DOM / localStorage on each call and returns a scalar (string, number or
//      boolean); nothing is memoised, so a consumer that polls always sees the
//      current render.
//   2. data-testid stamping. Angular recreates view nodes on every route
//      change and MDL re-parents upgraded widgets, so the stamping pass runs
//      from a childList MutationObserver plus a low-frequency safety tick and
//      is idempotent.
//
// The probe never clicks, never writes to storage, never patches application
// code and never changes what the user sees.

const TID = 'data-testid';

function slug(text) {
  return String(text || '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function plainLabel(el) {
  if (!el) { return ''; }
  const clone = el.cloneNode(true);
  const glyphs = clone.querySelectorAll('.material-icons');
  for (let i = 0; i < glyphs.length; i += 1) {
    if (glyphs[i].parentNode) { glyphs[i].parentNode.removeChild(glyphs[i]); }
  }
  return String(clone.textContent || '').replace(/\s+/g, ' ').trim();
}

function q(root, sel) {
  try { return root.querySelectorAll(sel); } catch (e) { return []; }
}

function first(root, sel) {
  const list = q(root, sel);
  return list.length ? list[0] : null;
}

function attrOf(root, sel, name) {
  const el = first(root, sel);
  return el ? el.getAttribute(name) : null;
}

function textOf(root, sel) {
  const el = first(root, sel);
  return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '';
}

function innerTextOf(root, sel) {
  const el = first(root, sel);
  if (!el) { return ''; }
  return String((el as any).innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
}

function countOf(root, sel) {
  return q(root, sel).length;
}

function setTid(el, id) {
  if (el && el.getAttribute(TID) !== id) { el.setAttribute(TID, id); }
}

function stampOne(sel, id) {
  setTid(first(document, sel), id);
}

function stampList(sel, prefix) {
  const list = q(document, sel);
  for (let i = 0; i < list.length; i += 1) { setTid(list[i], prefix + '-' + i); }
  return list.length;
}

let stamping = false;

function stamp() {
  if (stamping) { return; }
  stamping = true;
  try {
    // --- top bar -----------------------------------------------------------
    stampOne('.avatar-dropdown', 'mad-avatar-dropdown');
    stampOne('#notification', 'mad-notification-trigger');
    stampOne('#inbox', 'mad-message-trigger');
    stampOne('#more', 'mad-more-trigger');
    stampOne('#search', 'mad-search-input');

    const accountItems = q(document, '.account-dropdown .mdl-list__item-primary-content');
    for (let i = 0; i < accountItems.length; i += 1) {
      const label = slug(plainLabel(accountItems[i]));
      if (label) { setTid(accountItems[i], 'mad-account-' + label); }
    }

    // --- sidebar -----------------------------------------------------------
    const submenus = q(document, 'base-submenu-item');
    for (let i = 0; i < submenus.length; i += 1) {
      const anchor = first(submenus[i], 'a.mdl-navigation__link');
      const label = slug(plainLabel(anchor));
      setTid(anchor, 'mad-submenu-' + (label || i));
      setTid(submenus[i], 'mad-submenu-host-' + (label || i));
    }
    const navLinks = q(document, 'base-menu-link-item a.mdl-navigation__link');
    for (let i = 0; i < navLinks.length; i += 1) {
      const label = slug(plainLabel(navLinks[i]));
      setTid(navLinks[i], 'mad-navlink-' + (label || i));
    }

    // --- tables page -------------------------------------------------------
    const headers = q(document, '.sorting-table thead th');
    for (let i = 0; i < headers.length; i += 1) {
      const label = slug(plainLabel(headers[i]));
      setTid(headers[i], 'mad-adv-th-' + (label || i));
    }
    stampList('.sorting-table tbody tr', 'mad-adv-row');
    stampOne('.sorting-table tbody tr:first-child td:nth-child(2)', 'mad-adv-first-title');
    stampList('.sorting-table tbody button', 'mad-addcart');
    stampOne('base-pagination span:nth-child(1)', 'mad-page-prev');
    stampOne('base-pagination span:nth-child(2)', 'mad-page-info');
    stampOne('base-pagination span:nth-child(3)', 'mad-page-next');
    stampOne('base-pagination .goto input', 'mad-page-goto-input');
    stampOne('base-pagination .goto form', 'mad-page-goto-form');

    // --- to-do list --------------------------------------------------------
    const todoItems = q(document, 'app-todo-list ul.mdl-list > li');
    for (let i = 0; i < todoItems.length; i += 1) {
      setTid(todoItems[i], 'mad-todo-item-' + i);
      setTid(first(todoItems[i], 'label.mdl-checkbox'), 'mad-todo-label-' + i);
      setTid(first(todoItems[i], 'input.mdl-checkbox__input'), 'mad-todo-check-' + i);
      setTid(first(todoItems[i], '.mdl-list__item-secondary-content button'), 'mad-todo-del-' + i);
    }
    stampOne('app-todo-list .mdl-button--fab', 'mad-todo-fab');
    stampOne('#todoInput', 'mad-todo-input');
    const todoActions = q(document, 'app-todo-list base-card-actions button');
    for (let i = 0; i < todoActions.length; i += 1) {
      if (!(todoActions[i] as any).className.includes('mdl-button--fab')) {
        setTid(todoActions[i], 'mad-todo-remove-selected');
      }
    }

    // --- right sidebar / filters -------------------------------------------
    stampOne('base-right-sidebar', 'mad-rsb-host');
    stampOne('base-right-sidebar .close button', 'mad-rsb-close');
    stampOne('base-right-sidebar .open-icon button', 'mad-rsb-open');
    const selects = q(document, 'app-filters material-angular-select');
    for (let i = 0; i < selects.length; i += 1) {
      setTid(selects[i], 'mad-filter-select-' + i);
      setTid(first(selects[i], 'input.mdl-textfield__input'), 'mad-filter-input-' + i);
      const opts = q(selects[i], '.mdl-menu__item');
      for (let j = 0; j < opts.length; j += 1) { setTid(opts[j], 'mad-filter-opt-' + i + '-' + j); }
    }

    // --- blank layout (login / sign-up) ------------------------------------
    stampOne('.login-form #email', 'mad-email');
    stampOne('.login-form #password', 'mad-password');
    stampOne('.login-form #username', 'mad-username');
    stampOne('.login-form button[type=submit]', 'mad-submit');
  } catch (e) {
    // probe must never break the host application
  } finally {
    stamping = false;
  }
}

// ---------------------------------------------------------------------------
// live-only bridge
// ---------------------------------------------------------------------------
const DOC = document;

const bridge = {
  // --- shell / routing -----------------------------------------------------
  ready: () => !!first(DOC, 'app-root .mdl-layout') || !!first(DOC, 'app-root .mdl-card__blank-layout-card'),
  hash: () => DOC.location.hash,
  title: () => DOC.title,
  sidebarHeader: () => textOf(DOC, 'app-sidebar header'),
  avatarName: () => textOf(DOC, '.avatar-dropdown span'),
  bodyHas: (needle) => String(DOC.body.innerText || DOC.body.textContent || '').replace(/\s+/g, ' ').indexOf(String(needle)) >= 0,
  frozen: (key) => {
    const bag = (window as any).__rb_frozen;
    return bag ? bag[String(key)] : null;
  },

  // --- localStorage --------------------------------------------------------
  lsKeys: () => Object.keys(window.localStorage).length,
  lsToken: () => !!window.localStorage.getItem('token'),
  lsUsername: () => window.localStorage.getItem('username'),
  lsEmail: () => window.localStorage.getItem('email'),

  // --- sidebar -------------------------------------------------------------
  submenuOpen: (name) => {
    const host = first(DOC, '[data-testid="mad-submenu-host-' + slug(name) + '"]');
    return !!host && String(host.className).indexOf('sub-navigation--show') >= 0;
  },
  submenuCount: () => countOf(DOC, 'base-submenu-item'),
  navChildVisible: (name) => {
    const el = first(DOC, '[data-testid="mad-navlink-' + slug(name) + '"]');
    return !!el && (el as any).offsetParent !== null;
  },
  navCurrent: (name) => {
    const el = first(DOC, '[data-testid="mad-navlink-' + slug(name) + '"]');
    return !!el && String(el.className).indexOf('mdl-navigation__link--current') >= 0;
  },
  navLinkCount: () => countOf(DOC, 'base-menu-link-item a.mdl-navigation__link'),
  navLinkHref: (name) => {
    const el = first(DOC, '[data-testid="mad-navlink-' + slug(name) + '"]');
    return el ? el.getAttribute('href') : null;
  },

  // --- tables --------------------------------------------------------------
  tableCount: () => countOf(DOC, 'app-tables table'),
  cardTitleAt: (i) => {
    const list = q(DOC, 'app-tables .mdl-card__title-text');
    return list.length > Number(i) ? String(list[Number(i)].textContent || '').trim() : '';
  },
  advRowCount: () => countOf(DOC, '.sorting-table tbody tr'),
  advFirstTitle: () => textOf(DOC, '.sorting-table tbody tr:first-child td:nth-child(2)'),
  advFirstCell: () => textOf(DOC, '.sorting-table tbody tr:first-child td:nth-child(1)'),
  advHeaderCount: () => countOf(DOC, '.sorting-table thead th'),
  advHeaderSortClass: (i) => {
    const icon = first(DOC, '.sorting-table thead th:nth-child(' + (Number(i) + 1) + ') i.sorting');
    return icon ? String(icon.className) : '';
  },
  plainTableFirstTitle: (tableIndex) => {
    const list = q(DOC, 'app-tables table');
    const t = list.length > Number(tableIndex) ? list[Number(tableIndex)] : null;
    return t ? textOf(t, 'tbody tr:first-child td:nth-child(2)') : '';
  },
  pageInfo: () => innerTextOf(DOC, 'base-pagination span:nth-child(2)'),
  gotoValue: () => {
    const el = first(DOC, 'base-pagination .goto input') as any;
    return el ? String(el.value) : '';
  },
  addCartCount: () => countOf(DOC, '.sorting-table tbody button'),
  addCartDisabledCount: () => countOf(DOC, '.sorting-table tbody button:disabled'),

  // --- to-do list ----------------------------------------------------------
  todoCount: () => countOf(DOC, 'app-todo-list ul.mdl-list > li'),
  todoLabelAt: (i) => {
    const list = q(DOC, 'app-todo-list .mdl-checkbox__label');
    return list.length > Number(i) ? String(list[Number(i)].textContent || '').replace(/\s+/g, ' ').trim() : '';
  },
  todoFirstLabel: () => bridge.todoLabelAt(0),
  todoLastLabel: () => {
    const list = q(DOC, 'app-todo-list .mdl-checkbox__label');
    return list.length ? String(list[list.length - 1].textContent || '').replace(/\s+/g, ' ').trim() : '';
  },
  todoCheckedCount: () => countOf(DOC, 'app-todo-list label.mdl-checkbox.is-checked'),
  todoCheckedLabels: () => {
    const list = q(DOC, 'app-todo-list label.mdl-checkbox.is-checked .mdl-checkbox__label');
    let out = '';
    for (let i = 0; i < list.length; i += 1) { out += (out ? '|' : '') + String(list[i].textContent || '').trim(); }
    return out;
  },
  todoInputExists: () => !!first(DOC, '#todoInput'),
  fabDisabled: () => {
    const el = first(DOC, 'app-todo-list .mdl-button--fab') as any;
    return !!el && !!el.disabled;
  },
  removeSelectedDisabled: () => {
    const el = first(DOC, '[data-testid="mad-todo-remove-selected"]') as any;
    return !!el && !!el.disabled;
  },
  removeSelectedText: () => innerTextOf(DOC, '[data-testid="mad-todo-remove-selected"]'),

  // --- dashboard cards -----------------------------------------------------
  weatherCity: () => textOf(DOC, 'app-weather .mdl-card__subtitle-text'),
  weatherTemp: () => textOf(DOC, 'app-weather .weather-temperature'),
  weatherDesc: () => textOf(DOC, 'app-weather .weather-description'),
  projectsRowCount: () => countOf(DOC, 'app-table-card tbody tr'),
  projectsSelectedCount: () => countOf(DOC, 'app-table-card tbody tr.is-selected'),
  projectsFirstCell: () => textOf(DOC, 'app-table-card tbody tr:first-child td:nth-child(2)'),
  projectsSecondCell: () => textOf(DOC, 'app-table-card tbody tr:nth-child(2) td:nth-child(2)'),
  projectsSelectCellCount: () => countOf(DOC, 'app-table-card tbody tr:first-child td'),
  projectsCompleteCount: () => countOf(DOC, 'app-table-card tbody td.task-done'),
  robotHas: (needle) => {
    const el = first(DOC, 'app-robot-card');
    return !!el && String(el.textContent || '').replace(/\s+/g, ' ').indexOf(String(needle)) >= 0;
  },
  cotoneasterHas: (needle) => {
    const el = first(DOC, 'app-cotoneaster-card');
    return !!el && String(el.textContent || '').replace(/\s+/g, ' ').indexOf(String(needle)) >= 0;
  },
  trendingExists: () => !!first(DOC, 'app-trending'),

  // --- dashboard line chart ------------------------------------------------
  lineLegendCount: () => countOf(DOC, 'app-line-chart .legend__text'),
  lineLegendAt: (i) => {
    const list = q(DOC, 'app-line-chart .legend__text');
    return list.length > Number(i) ? String(list[Number(i)].textContent || '').trim() : '';
  },
  lineBarsCount: () => countOf(DOC, 'app-line-chart svg g.bars rect'),
  lineXLabel: () => textOf(DOC, 'app-line-chart svg .x-axis-label'),
  lineYLabel: () => textOf(DOC, 'app-line-chart svg .y-axis-label'),
  lineSvgCount: () => countOf(DOC, 'app-line-chart svg'),
  pieSvgCount: () => countOf(DOC, 'app-pie-chart svg'),
  mapAdvancedExists: () => !!first(DOC, 'app-map-advanced'),
  progBarWidthAt: (i) => {
    const list = q(DOC, 'app-progress-bars base-progress .progressbar');
    return list.length > Number(i) ? String((list[Number(i)] as any).style.width) : '';
  },
  progIndeterminateCount: () => countOf(DOC, 'app-progress-bars base-progress.mdl-progress__indeterminate'),
  switchUpgradedCount: () => countOf(DOC, 'app-toggles label.mdl-switch.is-upgraded'),

  // --- charts page ---------------------------------------------------------
  chartsTitleAt: (i) => {
    const list = q(DOC, 'app-charts .mdl-card__title-text');
    return list.length > Number(i) ? String(list[Number(i)].textContent || '').trim() : '';
  },
  chartsSvgCount: () => countOf(DOC, 'app-charts svg'),
  chartsLegendText: () => {
    const list = q(DOC, 'app-charts .nv-legend-text');
    let out = '';
    for (let i = 0; i < list.length; i += 1) { out += (out ? '|' : '') + String(list[i].textContent || '').trim(); }
    return out;
  },
  chartsLegendHas: (needle) => bridge.chartsLegendText().split('|').indexOf(String(needle)) >= 0,
  chartsAxisLabelCount: () => countOf(DOC, 'app-charts .x-axis-label, app-charts .y-axis-label'),

  // --- top-bar menus -------------------------------------------------------
  notifBadge: () => attrOf(DOC, '#notification', 'data-badge'),
  msgBadge: () => attrOf(DOC, '#inbox', 'data-badge'),
  notifItemCount: () => countOf(DOC, '.notifications-dropdown li.mdl-menu__item'),
  msgItemCount: () => countOf(DOC, '.messages-dropdown li.mdl-menu__item'),
  notifFooterText: () => innerTextOf(DOC, '.notifications-dropdown li:last-child button'),
  msgFooterText: () => innerTextOf(DOC, '.messages-dropdown li:last-child button'),
  visibleMenuCount: () => countOf(DOC, '.mdl-menu__container.is-visible'),
  accountMenuOpen: () => {
    const list = q(DOC, '.mdl-menu__container.is-visible');
    for (let i = 0; i < list.length; i += 1) {
      if (first(list[i], '.account-dropdown')) { return true; }
    }
    return false;
  },
  notifMenuOpen: () => {
    const list = q(DOC, '.mdl-menu__container.is-visible');
    for (let i = 0; i < list.length; i += 1) {
      if (first(list[i], '.notifications-dropdown')) { return true; }
    }
    return false;
  },
  msgMenuOpen: () => {
    const list = q(DOC, '.mdl-menu__container.is-visible');
    for (let i = 0; i < list.length; i += 1) {
      if (first(list[i], '.messages-dropdown')) { return true; }
    }
    return false;
  },
  accountItemCount: () => countOf(DOC, '.account-dropdown li.mdl-menu__item'),
  accountTaskBadge: () => textOf(DOC, '.account-dropdown .mdl-list__item-secondary-content .label'),

  // --- right sidebar -------------------------------------------------------
  rsbClosed: () => {
    const el = first(DOC, 'base-right-sidebar');
    return !!el && String(el.className).indexOf('is-closed') >= 0;
  },
  rsbOpenIconVisible: () => {
    const el = first(DOC, 'base-right-sidebar .open-icon button');
    return !!el && (el as any).offsetParent !== null;
  },
  rsbTitle: () => textOf(DOC, 'base-right-sidebar .mdl-card__title-text'),
  rsbCardPresent: () => !!first(DOC, 'base-right-sidebar base-card'),
  filterSelectCount: () => countOf(DOC, 'app-filters material-angular-select'),
  filterValueAt: (i) => {
    const list = q(DOC, 'app-filters material-angular-select input.mdl-textfield__input');
    return list.length > Number(i) ? String((list[Number(i)] as any).value) : '';
  },
  filterVisibleOptionCount: () => {
    const list = q(DOC, 'app-filters material-angular-select .mdl-menu__item');
    let n = 0;
    for (let i = 0; i < list.length; i += 1) { if ((list[i] as any).offsetParent !== null) { n += 1; } }
    return n;
  },

  // --- components page -----------------------------------------------------
  chipCount: () => countOf(DOC, 'app-chips .mdl-chip'),
  badgeCount: () => countOf(DOC, 'app-badges .mdl-badge'),
  sliderCount: () => countOf(DOC, 'app-sliders input.mdl-slider'),
  progressCount: () => countOf(DOC, 'app-progress-bars base-progress'),
  tooltipCount: () => countOf(DOC, 'app-tooltips .mdl-tooltip'),
  tooltipClass: (forId) => {
    const el = first(DOC, 'app-tooltips .mdl-tooltip[for="' + String(forId) + '"]');
    return el ? String(el.getAttribute('class') || '') : '';
  },
  tooltipHasClass: (forId, cls) => bridge.tooltipClass(forId).split(/\s+/).indexOf(String(cls)) >= 0,
  toggleIdTotal: () => countOf(DOC, 'app-toggles input[id^="base-toggle-"]'),
  toggleIdUnique: () => {
    const list = q(DOC, 'app-toggles input[id^="base-toggle-"]');
    const seen = {};
    let n = 0;
    for (let i = 0; i < list.length; i += 1) {
      const id = list[i].getAttribute('id');
      if (!seen[id]) { seen[id] = true; n += 1; }
    }
    return n;
  },
  toggleIdsUnique: () => bridge.toggleIdUnique() === bridge.toggleIdTotal() && bridge.toggleIdTotal() > 0,
  toggleFirstId: () => {
    const el = first(DOC, 'app-toggles input[id^="base-toggle-"]');
    return el ? el.getAttribute('id') : '';
  },
  checkboxCheckedCount: () => countOf(DOC, 'app-toggles label.mdl-checkbox.is-checked'),
  switchCheckedCount: () => countOf(DOC, 'app-toggles label.mdl-switch.is-checked'),
  iconToggleCheckedCount: () => countOf(DOC, 'app-toggles label.mdl-icon-toggle.is-checked'),
  radioCheckedCount: () => countOf(DOC, 'app-toggles label.mdl-radio.is-checked'),
  toggleInputCount: () => countOf(DOC, 'app-toggles input'),
  listCardTitleAt: (i) => {
    const list = q(DOC, 'app-components .mdl-card__title-text');
    return list.length > Number(i) ? String(list[Number(i)].textContent || '').trim() : '';
  },

  // --- blank layout / auth forms -------------------------------------------
  blankCardName: () => textOf(DOC, '.blank-layout-card-name'),
  submitDisabled: () => {
    const el = first(DOC, '.login-form button[type=submit]') as any;
    return !!el && !!el.disabled;
  },
  emailFieldInvalid: () => {
    const el = first(DOC, '.login-form #email');
    return !!el && String(el.parentNode.className).indexOf('is-invalid') >= 0;
  },
  emailFieldValid: () => {
    const el = first(DOC, '.login-form #email');
    return !!el && String(el.parentNode.className).indexOf('is-valid') >= 0;
  },
  formErrorCount: () => countOf(DOC, '.login-form .mdl-textfield__error'),
  formErrorText: () => {
    const list = q(DOC, '.login-form .mdl-textfield__error');
    let out = '';
    for (let i = 0; i < list.length; i += 1) {
      const t = String((list[i] as any).innerText || list[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (t) { out += (out ? '|' : '') + t; }
    }
    return out;
  },
  errorHeading: () => textOf(DOC, '.mdl-card__blank-layout-card .mdl-card__title-text'),
  forgotLinkCount: () => countOf(DOC, '.login-form a.blank-layout-card-link'),
  signUpExists: () => !!first(DOC, 'app-sign-up'),
  loginExists: () => !!first(DOC, 'app-login'),
  dashboardExists: () => !!first(DOC, 'app-dashboard'),
  componentsExists: () => !!first(DOC, 'app-components'),
  chartsExists: () => !!first(DOC, 'app-charts'),
  formsExists: () => !!first(DOC, 'app-employer-form'),
  tablesExists: () => !!first(DOC, '.sorting-table'),
  rightSidebarExists: () => !!first(DOC, 'base-right-sidebar'),
  employerFirstName: () => {
    const el = first(DOC, '#firstName') as any;
    return el ? String(el.value) : '';
  },
  employerRadioCheckedId: () => {
    const list = q(DOC, 'app-employer-form input[type=radio]');
    for (let i = 0; i < list.length; i += 1) { if ((list[i] as any).checked) { return list[i].getAttribute('id'); } }
    return '';
  },
  searchExists: () => !!first(DOC, '#search'),
  searchExpanded: () => {
    const el = first(DOC, '.mdl-textfield--expandable.search');
    return !!el && String(el.className).indexOf('is-focused') >= 0;
  },
};

(window as any).__MAD__ = bridge;

// ---------------------------------------------------------------------------
// stamping lifecycle
// ---------------------------------------------------------------------------
let scheduled = false;
function scheduleStamp() {
  if (scheduled) { return; }
  scheduled = true;
  setTimeout(() => { scheduled = false; stamp(); }, 0);
}

function install() {
  stamp();
  try {
    const observer = new MutationObserver(() => scheduleStamp());
    observer.observe(DOC.documentElement, { childList: true, subtree: true });
  } catch (e) {
    // fall back to the safety tick only
  }
  setTimeout(stamp, 300);
  setTimeout(stamp, 1200);
  setInterval(stamp, 400);
}

if (DOC.readyState === 'loading') {
  DOC.addEventListener('DOMContentLoaded', install);
} else {
  install();
}

export const RB_PROBE_VERSION = 'mad-probe-1';
