/**
 * rb-probe.ts - RepairBench read-only observation bridge for ng-devui-admin.
 *
 * Published on `window.__DA__`. Every reading is taken from the LIVE DOM, from
 * getComputedStyle, from localStorage, from the resource-timing buffer or from a
 * passive console latch: the bridge never reads an Angular component field, never
 * reaches into an ng-devui component instance and never mutates application state
 * on its own. The only writes it performs are the ones a user could perform
 * (element.click(), typing into an input by setting its value and dispatching the
 * same input/change/keyup events a keyboard produces, scrolling a container,
 * hovering a dropdown toggle), and every driver reports what it did as a string so
 * a checkpoint can prove the interaction happened instead of trusting a sleep.
 *
 * Nothing here throws: every member is wrapped, and an unavailable reading degrades
 * to the sentinel '-' (or -1 for a count) rather than to an exception, so a
 * checkpoint can only fail on a measured value and never on a bridge crash.
 *
 * No markup hook and no test-id attribute is added anywhere: every reading comes from
 * DOM the seed already renders (its own `da-*` component host elements, the app's
 * `da-*` classes, and ng-devui's own `devui-*` classes), which is why no template was
 * edited to make room for the harness.
 *
 * Drivers that open an overlay (a dialog, a drawer or an inline form) are split into
 * an OPEN step and an ACT step, because the overlay is created by Angular during a
 * change-detection cycle and a checkpoint must be able to wait between the two.
 */

const DA_VERSION = '1.0-r24da';
const NA = '-';
const NAC = -1;

/* ------------------------------------------------------------------ *
 * passive latches, installed at import time (before bootstrapModule)
 * ------------------------------------------------------------------ */

const consoleErrors: string[] = [];
const consoleInfos: string[] = [];
const consoleLogs: string[] = [];
const pageErrors: string[] = [];

function flatten(data: unknown[]): string {
  return data
    .map((d) => {
      try {
        return typeof d === 'string' ? d : JSON.stringify(d) || String(d);
      } catch {
        return String(d);
      }
    })
    .join(' ')
    .slice(0, 300);
}

function latch(name: 'error' | 'info' | 'log', sink: string[]): void {
  const orig = console[name].bind(console) as (...d: unknown[]) => void;
  console[name] = (...d: unknown[]): void => {
    try {
      sink.push(flatten(d));
    } catch {
      /* the latch must never break the app's own logging */
    }
    orig(...d);
  };
}
latch('error', consoleErrors);
latch('info', consoleInfos);
latch('log', consoleLogs);

try {
  window.addEventListener('error', (ev: ErrorEvent) => {
    try {
      pageErrors.push(String(ev.message || 'error').slice(0, 300));
    } catch {
      /* ignore */
    }
  });
  window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
    try {
      pageErrors.push('unhandledrejection:' + flatten([ev.reason]).slice(0, 280));
    } catch {
      /* ignore */
    }
  });
} catch {
  /* ignore */
}

/* ------------------------------------------------------------------ *
 * DOM primitives - none of these throws
 * ------------------------------------------------------------------ */

function q(sel: string, root?: ParentNode | null): Element[] {
  try {
    const r: ParentNode | null = root === undefined ? document : root;
    return r ? Array.from(r.querySelectorAll(sel)) : [];
  } catch {
    return [];
  }
}

function one(sel: string, root?: ParentNode | null): Element | null {
  try {
    const r: ParentNode | null = root === undefined ? document : root;
    return r ? r.querySelector(sel) : null;
  } catch {
    return null;
  }
}

/** First selector in the list that matches anything. Layered so a single ng-devui
 *  class-name difference cannot turn a real reading into a sentinel. */
function layered(sels: string[], root?: ParentNode | null): Element[] {
  for (const s of sels) {
    const found = q(s, root);
    if (found.length) return found;
  }
  return [];
}

function layeredOne(sels: string[], root?: ParentNode | null): Element | null {
  for (const s of sels) {
    const found = one(s, root);
    if (found) return found;
  }
  return null;
}

function txt(el: Element | null): string {
  if (!el) return NA;
  try {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length ? t : NA;
  } catch {
    return NA;
  }
}

function val(el: Element | null): string {
  if (!el) return NA;
  try {
    const v = (el as HTMLInputElement).value;
    return v === undefined || v === null ? NA : String(v);
  } catch {
    return NA;
  }
}

function cs(el: Element | null, prop: string): string {
  if (!el) return NA;
  try {
    const v = (getComputedStyle(el as HTMLElement) as unknown as { [key: string]: string })[prop];
    return v === undefined || v === null || v === '' ? NA : String(v);
  } catch {
    return NA;
  }
}

function visible(el: Element | null): boolean {
  if (!el) return false;
  try {
    const h = el as HTMLElement;
    if (getComputedStyle(h).display === 'none') return false;
    if (getComputedStyle(h).visibility === 'hidden') return false;
    return h.getBoundingClientRect().width > 0 || h.getBoundingClientRect().height > 0;
  } catch {
    return false;
  }
}

function click(el: Element | null): boolean {
  if (!el) return false;
  try {
    (el as HTMLElement).click();
    return true;
  } catch {
    return false;
  }
}

function hover(el: Element | null): boolean {
  if (!el) return false;
  try {
    const h = el as HTMLElement;
    for (const type of ['pointerover', 'mouseover', 'mouseenter', 'pointerenter']) {
      h.dispatchEvent(new MouseEvent(type, { bubbles: type !== 'mouseenter', cancelable: false, view: window }));
    }
    return true;
  } catch {
    return false;
  }
}

/** Types into an input the way a keyboard does: the value is set and then the very
 *  events a keystroke produces are dispatched. ng-devui's search box registers
 *  `fromEvent(input, 'input')` and its forms use the default value accessor, so the
 *  'input' event is the one that carries the value into the app. */
/** Selectors for the sign-out anchor of the header's appendToBody user dropdown
 *  (header-operation.component.html:31 `<a class="devui-dropdown-item logout">`; its (click) handler
 *  sits on the wrapping `li[role="menuitem"]` at line 30, so a click on the anchor bubbles to it). */
const LOGOUT_LINK_SELECTORS: string[] = ['a.logout', '.devui-dropdown-item.logout', 'a.devui-dropdown-item.logout'];

/** Bounded deferred click for overlays that Angular only attaches after the next change-detection tick.
 *  The hover is re-dispatched on every attempt because an appendToBody hover dropdown closes on
 *  mouseleave and this poll runs without a real pointer. Gives up silently after 12 attempts (720 ms):
 *  nothing is faked here - the caller's own report already said the click is deferred, and the
 *  checkpoint's assertion is what decides whether the gesture landed. */
function scheduleDeferredClick(selectors: string[], toggle: Element | null): void {
  let attempt = 0;
  const step = (): void => {
    attempt += 1;
    if (toggle) hover(toggle);
    const target = layeredOne(selectors);
    if (target) {
      click(target);
      return;
    }
    if (attempt < 12) setTimeout(step, 60);
  };
  setTimeout(step, 60);
}

function setInput(el: Element | null, value: string): boolean {
  if (!el) return false;
  try {
    const input = el as HTMLInputElement;
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  } catch {
    return false;
  }
}

/** Field lookup for the seed's own `da-admin-form`: admin-form.component.html binds `[name]="item.prop"`,
 *  which Angular writes as a DOM *property*, so the rendered `<input>` carries `ng-reflect-name` but NO
 *  `name` attribute (measured: all 7 inputs of the editable list's add-row form have
 *  getAttribute('name') === null). An attribute selector therefore matches nothing, the required fields
 *  stay empty and dForm validation swallows the submit. Try the attribute first (components that set it
 *  statically still work), then the live property, then ng-reflect-name. */
function formField(root: Element | null, key: string, selector: string): Element | null {
  const byAttr = one(selector + '[name="' + key + '"]', root);
  if (byAttr) return byAttr;
  for (const el of q(selector, root)) {
    if ((el as HTMLInputElement).name === key) return el;
    if (el.getAttribute('ng-reflect-name') === key) return el;
  }
  return null;
}
function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function lsGet(key: string): string {
  try {
    const s = store();
    if (!s) return NA;
    const v = s.getItem(key);
    return v === null || v === undefined ? NA : String(v);
  } catch {
    return NA;
  }
}

/* ------------------------------------------------------------------ *
 * page scopes - every one is a `da-*` host element the seed itself declares
 * as its component selector, so none of them can be missing on the right route
 * ------------------------------------------------------------------ */

function scope(host: string): Element | null {
  return one(host);
}
const cardScope = (): Element | null => scope('da-card-list');
const basicScope = (): Element | null => scope('da-basic-list');
const editScope = (): Element | null => scope('da-editable-list');
const advScope = (): Element | null => scope('da-advance-list');
const treeScope = (): Element | null => scope('da-tree-list');
const noticeScope = (): Element | null => scope('da-header-notice');
const headerOpsScope = (): Element | null => scope('da-header-operation');
const pagesScope = (): Element | null => scope('da-pages');

/** The outermost table of a scope. ng-devui renders nested child tables INSIDE a
 *  `tr.child-table` wrapper row, so scoping to this table is what separates a
 *  top-level row from a nested one. */
function outerTable(root: Element | null): HTMLTableElement | null {
  const t = layeredOne(['table.devui-table', 'table'], root);
  return t ? (t as HTMLTableElement) : null;
}

/** The table that actually holds a scope's top-level body rows. With
 *  `[fixHeader]="true"` ng-devui's DataTable renders TWO `table.devui-table` elements:
 *  a header-only table inside `div.table-wrap` (`#fixHeaderContainerRef`, carrying the
 *  projected `<thead>` and no data rows of its own) followed by the body table
 *  (`#tableBody`) inside the `div.devui-scrollbar` container that carries
 *  `dLazyLoad [enableLazyLoad]="lazy"`. `outerTable()` returns the FIRST match, so on
 *  such a page it lands on the header-only table and every `tbody > tr` read comes back
 *  empty - /pages/list/advance is the seed's only fixHeader list page. Taking the first
 *  table that owns at least one top-level `tbody > tr` reads the rows where they really
 *  are, and the `outerTable()` fallback keeps single-table scopes (basic / editable /
 *  tree lists, and any genuinely empty table) resolving to exactly the element they
 *  resolved to before. */
function rowTable(root: Element | null): HTMLTableElement | null {
  const tables = layered(['table.devui-table', 'table'], root).map((t) => t as HTMLTableElement);
  for (const t of tables) {
    if (q('tbody > tr', t).some((tr) => tr.closest('table') === t)) return t;
  }
  return outerTable(root);
}

/** Top-level DATA rows of a scope: direct children of the outer table's tbody,
 *  excluding the wrapper rows ng-devui adds (child-table, expand-row) and excluding
 *  the editable list's header add-row form row. */
function dataRows(root: Element | null): HTMLElement[] {
  const t = rowTable(root);
  if (!t) return [];
  return q('tbody > tr', t)
    .filter((tr) => tr.closest('table') === t)
    .filter((tr) => !tr.classList.contains('child-table') && !tr.classList.contains('expand-row'))
    .filter((tr) => !one('.cursor-pointer', tr) && !one('da-admin-form.editable-row', tr))
    .map((tr) => tr as HTMLElement);
}

function cells(row: HTMLElement | null): HTMLElement[] {
  if (!row) return [];
  return q(':scope > td', row).map((td) => td as HTMLElement);
}

function cellText(row: HTMLElement | null, index: number): string {
  const c = cells(row);
  if (!c.length) return NA;
  const i = index < 0 ? 0 : index;
  return i < c.length ? txt(c[i]) : NA;
}

/** The `tr.child-table` wrapper ng-devui inserts directly after a parent row when
 *  that parent's child table is open. */
function childWrapper(parentRow: HTMLElement | null): HTMLElement | null {
  if (!parentRow) return null;
  const n = parentRow.nextElementSibling;
  return n && n.tagName === 'TR' && n.classList.contains('child-table') ? (n as HTMLElement) : null;
}

function childRows(parentRow: HTMLElement | null): HTMLElement[] {
  const w = childWrapper(parentRow);
  if (!w) return [];
  const t = outerTable(w);
  if (!t) return [];
  return q('tbody > tr', t)
    .filter((tr) => tr.closest('table') === t)
    .filter((tr) => !tr.classList.contains('child-table') && !tr.classList.contains('expand-row'))
    .map((tr) => tr as HTMLElement);
}

/** Checkbox state of a row, read from the DOM only: ng-devui renders
 *  `div.devui-checkbox` (carrying the `halfchecked` class) around
 *  `input.devui-checkbox-input` whose `checked`/`indeterminate` are the truth. */
function checkState(row: Element | null): string {
  if (!row) return NA;
  const box = layeredOne(['.devui-checkbox', 'd-checkbox'], row);
  if (!box) return NA;
  const input = layeredOne(['input.devui-checkbox-input', 'input[type="checkbox"]'], box) as HTMLInputElement | null;
  let half = false;
  let on = false;
  try {
    half = box.classList.contains('halfchecked');
  } catch {
    half = false;
  }
  if (input) {
    try {
      half = half || !!input.indeterminate;
      on = !!input.checked;
    } catch {
      on = false;
    }
  } else {
    on = box.classList.contains('checked') || box.classList.contains('devui-checked');
  }
  if (half) return 'halfchecked';
  return on ? 'checked' : 'unchecked';
}

function checkControl(row: Element | null): Element | null {
  if (!row) return null;
  const box = layeredOne(['.devui-checkbox', 'd-checkbox'], row);
  if (!box) return null;
  return layeredOne(['label', 'span.devui-checkbox-material', '.devui-checkbox-material', 'input'], box) || box;
}

function joined(parts: string[], sep: string): string {
  return parts.length ? parts.join(sep) : NA;
}

/* ------------------------------------------------------------------ *
 * overlay helpers
 * ------------------------------------------------------------------ */

function modalRoot(): Element | null {
  return layeredOne(['.devui-modal', 'd-modal', '[role="dialog"]', '.modal-footer', '#delete-dialog', '#theme']);
}

function modalFooterButtons(): HTMLElement[] {
  const m = modalRoot();
  if (!m) return [];
  return layered(['.modal-footer button', '.modal-footer d-button button', '.devui-modal-footer button', '.modal-footer .devui-btn'], m).map(
    (b) => b as HTMLElement
  );
}

function drawerRoot(): Element | null {
  return layeredOne(['.devui-drawer', 'd-drawer', '.da-drawer-menu', '.devui-drawer-content']);
}

function buttonByText(candidates: HTMLElement[], label: string): HTMLElement | null {
  const want = label.replace(/\s+/g, ' ').trim().toLowerCase();
  for (const b of candidates) {
    if (txt(b).toLowerCase() === want) return b;
  }
  for (const b of candidates) {
    if (txt(b).toLowerCase().indexOf(want) >= 0) return b;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * guard wrappers - the contract that nothing here throws
 * ------------------------------------------------------------------ */

function guardStr(fn: () => string): string {
  try {
    const v = fn();
    return v === undefined || v === null || v === '' ? NA : v;
  } catch {
    return NA;
  }
}

function guardNum(fn: () => number): number {
  try {
    const v = fn();
    return typeof v === 'number' && isFinite(v) ? v : NAC;
  } catch {
    return NAC;
  }
}

/* ------------------------------------------------------------------ *
 * the bridge
 * ------------------------------------------------------------------ */

const NOTICE_TABS: { [key: string]: number } = { notice: 0, message: 1, todo: 2 };

function noticeNavItem(which: string): Element | null {
  const root = noticeScope();
  if (!root) return null;
  const items = layered(['ul.devui-nav > li.devui-nav-tab-item', 'li.devui-nav-tab-item', '[role="tablist"] > li', 'ul.devui-nav > li'], root);
  const idx = NOTICE_TABS[which] === undefined ? -1 : NOTICE_TABS[which];
  if (idx >= 0 && idx < items.length) return items[idx];
  const byId = one('li#' + which, root);
  return byId;
}

/** Which tab of the notice dropdown is selected, read from the nav item ng-devui marks
 *  with `.active` - the tabs template binds `[class.active]="tab.id == activeTab"` and
 *  `[id]="tab.id"` on that same `li.devui-nav-tab-item`. */
function noticeActiveTabId(): string {
  const root = noticeScope();
  if (!root) return NA;
  const items = layered(
    ['ul.devui-nav > li.devui-nav-tab-item.active', 'li.devui-nav-tab-item.active', '[role="tablist"] > li.active'],
    root
  );
  if (!items.length) return NA;
  const id = items[0].getAttribute('id');
  return id === null || id === '' ? NA : id;
}

/** ng-devui's `d-tabs` renders its content through `destroyTpl`, whose template is a
 *  `div.devui-tab-pane` guarded by `*ngIf="tab.id == activeTab"`: exactly ONE pane is in the
 *  DOM at a time and it belongs to the selected tab. `d-tab`'s `id` is an @Input, so no
 *  `d-tab#<id>` attribute ever reaches the DOM and a pane cannot be addressed by tab name -
 *  only by first proving that the requested tab is the active one. */
function noticePane(which: string): Element | null {
  const root = noticeScope();
  if (!root) return null;
  const item = noticeNavItem(String(which));
  if (!item) return null;
  let active = false;
  try {
    active = item.classList.contains('active');
  } catch {
    active = false;
  }
  if (!active) return null;
  return layeredOne(['.devui-tab-content .devui-tab-pane', '.devui-tab-pane[role="tabpanel"]', '.devui-tab-pane'], root);
}

const bridgeCore = {
  version: DA_VERSION,

  /* ---------------- card list (/pages/list/card) ---------------- */

  cardGridCount: (): number => guardNum(() => layered(['da-card-list d-card.card-item', 'da-card-list d-card', '.da-list-content d-card'], cardScope()).length),

  cardGridNames: (): string =>
    guardStr(() => {
      const cards = layered(['da-card-list d-card.card-item', 'da-card-list d-card'], cardScope());
      return joined(
        cards.map((c) => {
          const av = one('d-avatar', c);
          const span = one('span.devui-avatar-style', av);
          const t = txt(span);
          if (t !== NA) return t;
          const img = one('img', av);
          if (img) {
            const src = img.getAttribute('src') || '';
            return 'img:' + (src.split('/').pop() || NA);
          }
          return NA;
        }),
        '|'
      );
    }),

  // The card filter runs on the data's `name` field while the card DISPLAYS `title`,
  // and the seed deliberately diverges two of them (name 'NG-evUI' / title 'NG-DevUI',
  // name 'Vue11' / title 'Vue22'), so the title channel is the one that identifies
  // which cards survived the filter. The avatar channel above is truncated by
  // ng-devui's own name-display rule and is kept only as a second opinion.
  cardGridTitles: (): string =>
    guardStr(() => joined(layered(['da-card-list d-card.card-item', 'da-card-list d-card'], cardScope()).map((c) => txt(one('d-card-title', c))), '|')),

  cardPagerTotal: (): string => guardStr(() => txt(layeredOne(['.devui-total-size', 'd-pagination .devui-total-size', 'd-pagination'], cardScope()))),

  cardSearchInput: (): string => guardStr(() => val(layeredOne(['d-search input.devui-input', 'd-search input', 'input.devui-input'], cardScope()))),

  driveCardSearch: (text: string): string =>
    guardStr(() => {
      const root = cardScope();
      const input = layeredOne(['d-search input.devui-input', 'd-search input'], root) as HTMLInputElement | null;
      if (!input) return 'no-search-input';
      const typed = setInput(input, String(text));
      const icon = layeredOne(['d-search .devui-search-icon', '.devui-search-icon'], root);
      const searched = click(icon);
      return 'typed "' + text + '":' + (typed ? 'ok' : 'fail') + ' clicked-search-icon:' + (searched ? 'ok' : 'fail');
    }),

  /* ---------------- basic list (/pages/list/basic) ---------------- */

  basicListRowCount: (): number => guardNum(() => dataRows(basicScope()).length),

  basicListFirstRowId: (): string => guardStr(() => cellText(dataRows(basicScope())[0] || null, 0)),

  basicListRowIds: (): string => guardStr(() => joined(dataRows(basicScope()).map((r) => cellText(r, 0)), '|')),

  // Opens the row's delete dialog only. ng-devui's DialogService creates the modal
  // during a change-detection cycle, so the checkpoint waits and then calls
  // driveDialogConfirm('Ok') - that split is why this driver does not confirm too.
  driveBasicListDelete: (rowIndex: number): string =>
    guardStr(() => {
      const rows = dataRows(basicScope());
      const i = Number(rowIndex);
      if (!isFinite(i) || i < 0 || i >= rows.length) return 'no-row-at-' + rowIndex + '-of-' + rows.length;
      const btn = layeredOne(['d-button[title="delete"] button', 'd-button[title="delete"]', '[title="delete"] button', '[title="delete"]'], rows[i]);
      if (!btn) return 'no-delete-control-on-row-' + i;
      return 'clicked-delete-on-row-' + i + ':' + (click(btn) ? 'ok' : 'fail');
    }),

  basicListDialogOpen: (): string =>
    guardStr(() => {
      const m = modalRoot();
      if (!m) return 'closed';
      return visible(m) || modalFooterButtons().length > 0 ? 'open' : 'closed';
    }),

  // Shared confirm driver: clicks the footer button of whatever dialog is open.
  driveDialogConfirm: (label: string): string =>
    guardStr(() => {
      const want = String(label || 'Ok');
      const btns = modalFooterButtons();
      if (!btns.length) return 'no-dialog-footer-buttons';
      const b = buttonByText(btns, want) || btns[0];
      const idAttr = b.getAttribute('id') || NA;
      return 'clicked-dialog-button "' + txt(b) + '" id:' + idAttr + ':' + (click(b) ? 'ok' : 'fail') + '-of-' + btns.length;
    }),

  /* ---------------- editable list (/pages/list/editable) ---------------- */

  editableListRowCount: (): number => guardNum(() => dataRows(editScope()).length),

  editableListFirstRowTitle: (): string => guardStr(() => cellText(dataRows(editScope())[0] || null, 1)),

  editableListRowTitles: (): string => guardStr(() => joined(dataRows(editScope()).map((r) => cellText(r, 1)), '|')),

  editableListHeaderFormOpen: (): string =>
    guardStr(() => {
      const root = editScope();
      if (!root) return NA;
      if (one('da-admin-form.editable-row', root)) return 'form';
      if (one('.cursor-pointer', root)) return 'trigger';
      return 'none';
    }),

  driveEditableListOpenAddRow: (): string =>
    guardStr(() => {
      const root = editScope();
      if (!root) return 'no-editable-list';
      if (one('da-admin-form.editable-row', root)) return 'already-open';
      const trigger = one('.cursor-pointer', root);
      if (!trigger) return 'no-add-row-trigger';
      return 'clicked-add-row-trigger:' + (click(trigger) ? 'ok' : 'fail');
    }),

  driveEditableListAddRow: (fieldValues: { [key: string]: string }): string =>
    guardStr(() => {
      const root = editScope();
      if (!root) return 'no-editable-list';
      const form = one('da-admin-form.editable-row', root) || one('da-admin-form', root);
      if (!form) return 'add-row-form-not-open';
      const done: string[] = [];
      const keys = fieldValues && typeof fieldValues === 'object' ? Object.keys(fieldValues) : [];
      for (const k of keys) {
        const want = String((fieldValues as { [key: string]: unknown })[k]);
        // [name] on these inputs is an Angular property binding, not an attribute - see formField().
        const input = formField(form, k, 'input') as HTMLInputElement | null;
        if (input) {
          done.push(k + '=' + (setInput(input, want) ? 'typed' : 'fail'));
          continue;
        }
        const sel = formField(form, k, 'd-select');
        if (sel) {
          const opened = click(layeredOne(['.devui-input', '.devui-dropdown-origin', 'input'], sel) || sel);
          const opts = layered(['.devui-dropdown-menu li', '.devui-select-option', 'ul[role="menu"] li']);
          const pick = buttonByText(opts.map((o) => o as HTMLElement), want);
          done.push(k + '=' + (opened ? 'opened' : 'open-fail') + '/' + (pick ? 'picked-' + txt(pick) : 'option-not-found'));
          if (pick) click(pick);
          continue;
        }
        done.push(k + '=no-field');
      }
      const btns = layered(['d-button[dFormSubmit] button', 'd-button[dFormSubmit]', 'form button', 'd-button button'], form).map((b) => b as HTMLElement);
      const confirm = buttonByText(btns, 'Confirm') || btns[0] || null;
      return 'fields[' + done.join(',') + '] confirm:' + (confirm ? txt(confirm) + ':' + (click(confirm) ? 'ok' : 'fail') : 'no-confirm-button');
    }),

  // Second, independent channel on the same defect: the pager's own page-size
  // reading. The row count and this reading must move together, and the pager's
  // TOTAL must not move at all - that triple is what separates "the editable list
  // stopped loading rows" from "the list loads a different number of them".
  editableListPageSizeReading: (): string =>
    guardStr(() => {
      const root = editScope();
      const cfg = layeredOne(['.devui-page-size-config', '.devui-pagination-config-item.devui-page-size-config', '.devui-pagination-config-item'], root);
      if (cfg) return txt(cfg);
      return txt(layeredOne(['d-pagination', '.devui-pagination'], root));
    }),

  editableListPagerTotal: (): string => guardStr(() => txt(layeredOne(['.devui-total-size', 'd-pagination .devui-total-size'], editScope()))),

  /* ---------------- notice dropdown (header) ---------------- */

  noticeTabHeading: (which: string): string =>
    guardStr(() => {
      const item = noticeNavItem(String(which));
      if (!item) return NA;
      return txt(layeredOne(['a[role="tab"] span', 'a[role="tab"]', 'span'], item));
    }),

  noticeActiveTab: (): string => guardStr(() => noticeActiveTabId()),

  noticeBadge: (): string =>
    guardStr(() => {
      const root = headerOpsScope();
      const badge = layeredOne(['.da-operations-notice d-badge', 'd-badge'], root);
      if (!badge) return NA;
      const count = layeredOne(['.devui-badge-count', '.devui-badge-content-count', 'span.devui-badge-count'], badge);
      if (count) return txt(count);
      return visible(badge) ? 'hidden' : NA;
    }),

  driveNoticeOpen: (): string =>
    guardStr(() => {
      const root = headerOpsScope();
      const toggle = layeredOne(['.da-operations-notice', '.da-operations-notice [dDropDownToggle]', '.da-operations-notice d-badge'], root);
      if (!toggle) return 'no-notice-toggle';
      return 'clicked-notice-toggle:' + (click(toggle) ? 'ok' : 'fail') + ' pane:' + (noticeScope() ? 'present' : 'absent');
    }),

  // Selects a tab of the notice dropdown the way a user does: one click on the nav item,
  // which is the element ng-devui binds `(click)="select(tab.id)"` to. Kept apart from the
  // readers because the newly selected pane is created during a change-detection cycle, so a
  // checkpoint must be able to wait between the click and the reading.
  driveNoticeTab: (which: string): string =>
    guardStr(() => {
      const item = noticeNavItem(String(which));
      if (!item) return 'no-notice-tab-' + which;
      const before = noticeActiveTabId();
      return 'clicked-notice-tab-' + which + ':' + (click(item) ? 'ok' : 'fail') + ' active-before:' + before;
    }),

  driveNoticeItemClick: (which: string, index: number): string =>
    guardStr(() => {
      const pane = noticePane(String(which));
      if (!pane) return 'no-pane-' + which;
      const sel =
        String(which) === 'notice'
          ? ['.da-notice-item', '.da-notice-container-item']
          : String(which) === 'message'
          ? ['.da-message-item', '.da-notice-container-item']
          : ['.da-todo-item', '.da-notice-container-item'];
      const items = layered(sel, pane);
      const i = Number(index);
      if (!isFinite(i) || i < 0 || i >= items.length) return 'no-item-' + index + '-of-' + items.length + '-in-' + which;
      const before = items[i].classList.contains('da-notice-checked');
      return 'clicked-' + which + '-item-' + i + ':' + (click(items[i]) ? 'ok' : 'fail') + ' checked-before:' + (before ? 'yes' : 'no');
    }),

  driveNoticeClear: (which: string): string =>
    guardStr(() => {
      const pane = noticePane(String(which));
      if (!pane) return 'no-pane-' + which;
      const zone = one('.da-notice-clear', pane);
      if (!zone) return 'no-clear-zone-in-' + which;
      const btns = layered(['d-button button', 'd-button', 'button'], zone).map((b) => b as HTMLElement);
      if (!btns.length) return 'no-clear-button-in-' + which;
      return 'clicked-' + which + '-clear "' + txt(btns[0]) + '":' + (click(btns[0]) ? 'ok' : 'fail') + '-of-' + btns.length;
    }),

  /* ---------------- personalisation (theme / font / radius) ---------------- */

  persistedTextSize: (): string => guardStr(() => lsGet('font')),
  persistedRounding: (): string => guardStr(() => lsGet('radius')),
  persistedTheme: (): string => guardStr(() => lsGet('theme')),

  persistedDark: (): string =>
    guardStr(() => {
      let body = 'light';
      try {
        body = document.body && document.body.classList.contains('is-dark') ? 'dark' : 'light';
      } catch {
        body = NA;
      }
      const raw = lsGet('user-custom-theme-config');
      let stored = NA;
      if (raw !== NA) {
        try {
          const parsed = JSON.parse(raw) as { isDark?: boolean };
          stored = parsed && parsed.isDark ? 'dark' : 'light';
        } catch {
          stored = 'unparseable';
        }
      }
      return 'body:' + body + '|stored:' + stored;
    }),

  appliedFontSizePx: (): string =>
    guardStr(() => {
      let v = NA;
      try {
        v = getComputedStyle(document.documentElement).getPropertyValue('--devui-font-size').replace(/\s+/g, ' ').trim() || NA;
      } catch {
        v = NA;
      }
      return 'var:' + v + '|body:' + cs(document.body, 'fontSize');
    }),

  personalizeDialogOpen: (): string =>
    guardStr(() => {
      const m = one('#theme') || modalRoot();
      if (!m) return 'closed';
      return one('.da-personalize-config', m) ? 'open' : 'closed';
    }),

  // The trigger div in pages.component.html and the dialog's own root share the
  // class `da-personalize-config`, so the trigger is picked as the one that is NOT
  // inside a modal.
  drivePersonaliseOpen: (): string =>
    guardStr(() => {
      if (one('.da-personalize-config', modalRoot())) return 'already-open';
      const cands = layered(['.da-personalize-config', 'da-pages > .da-personalize-config']);
      let trigger: Element | null = null;
      for (const c of cands) {
        if (!c.closest('.devui-modal') && !c.closest('d-modal') && !c.closest('[role="dialog"]')) {
          trigger = c;
          break;
        }
      }
      if (!trigger) return 'no-personalize-trigger';
      return 'clicked-personalize-trigger:' + (click(trigger) ? 'ok' : 'fail');
    }),

  // choose = '<group title>|<option label>', both matched on rendered text.
  drivePersonalise: (choose: string): string =>
    guardStr(() => {
      const spec = String(choose || '');
      const bar = spec.indexOf('|');
      if (bar < 0) return 'bad-choose-format(want group|option)';
      const group = spec.slice(0, bar).trim();
      const option = spec.slice(bar + 1).trim();
      const dlg = one('.da-personalize-config', modalRoot()) || one('.da-personalize-config');
      if (!dlg) return 'personalize-dialog-not-open';
      const items = layered(['da-col-item', '.item'], dlg);
      let target: Element | null = null;
      for (const it of items) {
        const label = txt(one('.da-item-title-text', it));
        if (label.toLowerCase().indexOf(group.toLowerCase()) >= 0) {
          target = it;
          break;
        }
      }
      if (!target) return 'group-not-found:' + group + '-of-' + items.length;
      const radios = layered(['label.devui-radio', 'd-radio label', 'd-radio'], target);
      const pick = buttonByText(radios.map((r) => r as HTMLElement), option);
      if (!pick) return 'option-not-found:' + option + '-in-' + group + '-of-' + radios.length;
      const before = pick.classList.contains('active');
      const input = one('input.devui-radio-input', pick) || one('input[type="radio"]', pick);
      return 'clicked-' + group + '->' + option + ':' + (click(input || pick) ? 'ok' : 'fail') + ' active-before:' + (before ? 'yes' : 'no');
    }),

  /* ---------------- layout arrangement (side settings) ---------------- */

  persistedArrangementId: (): string => guardStr(() => lsGet('da-layout-id')),

  persistedArrangementConfig: (): string =>
    guardStr(() => {
      const raw = lsGet('da-layout');
      if (raw === NA) return NA;
      try {
        const c = JSON.parse(raw) as {
          id?: string;
          mode?: string;
          sidebar?: { fixed?: boolean; hidden?: boolean };
          header?: { fixed?: boolean; hidden?: boolean };
        };
        return (
          'id:' + (c.id || NA) +
          '|mode:' + (c.mode || NA) +
          '|sidebarFixed:' + (c.sidebar && c.sidebar.fixed ? 'yes' : 'no') +
          '|sidebarHidden:' + (c.sidebar && c.sidebar.hidden ? 'yes' : 'no') +
          '|headerFixed:' + (c.header && c.header.fixed ? 'yes' : 'no')
        );
      } catch {
        return 'unparseable:' + raw.slice(0, 40);
      }
    }),

  // What the shell is ACTUALLY rendering, read from the DOM the seed already
  // renders: pages.component.html puts `da-navbar` in the header only when
  // layoutConfig.id === 'topNav', puts `da-header-logo` in the sidebar only when
  // layoutConfig.mode !== 'headerTop', and da-layout.component.html renders a second
  // fixed `d-aside` only when config.sidebar.fixed and hides the main one when
  // config.sidebar.hidden. Those four facts distinguish all three arrangements.
  shellArrangement: (): string =>
    guardStr(() => {
      const header = one('da-layout-header');
      const sidebar = one('da-layout-sidebar');
      const navbar = header ? !!one('da-navbar', header) : false;
      const logo = sidebar ? !!one('da-header-logo', sidebar) : false;
      const asides = q('d-aside');
      const shown = asides.filter((a) => visible(a)).length;
      return 'navbar:' + (navbar ? 'yes' : 'no') + '|logo:' + (logo ? 'yes' : 'no') + '|aside:' + asides.length + '|visible:' + shown;
    }),

  // Second channel on the same choice: which of the three thumbnails in the settings
  // drawer carries its selection tick.
  arrangementTick: (): string =>
    guardStr(() => {
      const root = drawerRoot();
      if (!root) return 'drawer-closed';
      const names = ['da-side-bar-layout-item', 'da-topnav-layout-item', 'da-left-right-layout-item'];
      const out: string[] = [];
      for (const n of names) {
        const item = one('.' + n, root);
        if (!item) {
          out.push(n + ':absent');
          continue;
        }
        const tick = one('i.icon-right', item);
        let display = NA;
        try {
          display = tick ? getComputedStyle(tick as HTMLElement).display : NA;
        } catch {
          display = NA;
        }
        out.push(n.replace('da-', '').replace('-layout-item', '') + ':' + (display !== 'none' && display !== NA ? 'tick' : 'notick'));
      }
      return joined(out, '|');
    }),

  settingsDrawerOpen: (): string =>
    guardStr(() => {
      const d = drawerRoot();
      if (!d) return 'closed';
      return one('.da-drawer-menu', d) || one('.da-option-item', d) ? 'open' : 'closed';
    }),

  driveSettingsOpen: (): string =>
    guardStr(() => {
      if (one('.da-drawer-menu', drawerRoot())) return 'already-open';
      const trigger = one('.da-multi-settings', pagesScope()) || one('.da-multi-settings');
      if (!trigger) return 'no-settings-trigger';
      return 'clicked-settings-trigger:' + (click(trigger) ? 'ok' : 'fail');
    }),

  driveArrangementChoice: (which: string): string =>
    guardStr(() => {
      const root = drawerRoot();
      if (!root) return 'settings-drawer-not-open';
      const map: { [key: string]: string } = {
        sidebar: '.da-side-bar-layout-item',
        topnav: '.da-topnav-layout-item',
        topNav: '.da-topnav-layout-item',
        'left-right': '.da-left-right-layout-item',
      };
      const sel = map[String(which)];
      if (!sel) return 'unknown-arrangement:' + which;
      const item = one(sel, root);
      if (!item) return 'arrangement-option-not-rendered:' + which;
      return 'clicked-arrangement-' + which + ':' + (click(item) ? 'ok' : 'fail');
    }),

  /* ---------------- session / guard ---------------- */

  // Read through the guard's own predicate surface: AuthGuardService.canActivate
  // calls AuthService.isUserLoggedIn(), whose entire body is
  // `localStorage.getItem('userinfo')`. Reading that key is reading the same Web
  // Storage entry the guard reads - it is not an Angular component field.
  signedIn: (): string => guardStr(() => (lsGet('userinfo') === NA ? 'no' : 'yes')),

  driveSignIn: (account: string, password: string): string =>
    guardStr(() => {
      const root = scope('da-login');
      if (!root) return 'no-login-page';
      const user = layeredOne(['input[name="userName"]', 'form input[name="userName"]'], root) as HTMLInputElement | null;
      const pass = layeredOne(['input[name="password"]', 'form input[name="password"]'], root) as HTMLInputElement | null;
      if (!user || !pass) return 'login-fields-missing user:' + (user ? 'ok' : 'no') + ' pass:' + (pass ? 'ok' : 'no');
      const a = setInput(user, String(account));
      const p = setInput(pass, String(password));
      const submit = layeredOne(['button.da-submit-button', 'd-button[dFormSubmit] button', 'button[dFormSubmit]', 'form button'], root);
      return 'typed-account:' + (a ? 'ok' : 'fail') + ' typed-password:' + (p ? 'ok' : 'fail') + ' clicked-submit:' + (click(submit) ? 'ok' : 'fail');
    }),

  driveSignOut: (): string =>
    guardStr(() => {
      const toggle = layeredOne(['.da-operations-user', '.da-operations-user d-avatar'], headerOpsScope());
      const hovered = hover(toggle);
      // The user menu is an appendToBody dropdown, so the logout anchor is searched
      // document-wide rather than inside the header.
      const link = layeredOne(LOGOUT_LINK_SELECTORS);
      if (link) return 'hovered:' + (hovered ? 'ok' : 'fail') + ' clicked-logout:' + (click(link) ? 'ok' : 'fail');
      // ng-devui opens this hover dropdown from fromEvent(host, 'mouseenter'), which the dispatched hover
      // does reach, but with appendToBody the overlay only enters the document after Angular's next
      // change-detection tick - never inside the same task, so the synchronous lookup above can only ever
      // miss it: measured right after the hover the anchor is simply absent from the document, the click
      // never happens and the sign-out path never runs at all. Re-hover and click from a bounded deferred
      // poll instead; the wait that follows this step in the caller covers the 720ms bound. The report
      // states plainly that the click is deferred, so nothing here claims a synchronous click happened.
      // (No checkpoint id, defect id, leg name or expected reading belongs in this file: it ships into the
      // answering workspace, so anything of the sort would be leakage.)
      scheduleDeferredClick(LOGOUT_LINK_SELECTORS, toggle);
      return 'hovered:' + (hovered ? 'ok' : 'fail') + ' logout-link:not-rendered-yet click:deferred';
    }),

  guardedAddressLandsWhere: (): string =>
    guardStr(() => {
      let path = NA;
      let href = NA;
      try {
        path = window.location.pathname;
        href = window.location.href;
      } catch {
        return NA;
      }
      const login = !!scope('da-login');
      const shell = !!scope('da-pages');
      return 'path:' + path + '|login-page:' + (login ? 'yes' : 'no') + '|shell:' + (shell ? 'yes' : 'no') + '|href:' + href;
    }),

  routePath: (): string =>
    guardStr(() => {
      try {
        return window.location.pathname;
      } catch {
        return NA;
      }
    }),

  /* ---------------- advance list (/pages/list/advance) ---------------- */

  advanceListRowCount: (): number => guardNum(() => dataRows(advScope()).length),

  advanceListFirstRowId: (): string => guardStr(() => cellText(dataRows(advScope())[0] || null, 1)),

  advanceListRowIds: (): string =>
    guardStr(() => {
      const rows = dataRows(advScope());
      if (!rows.length) return NA;
      // Column 0 is the checkbox cell (`td.devui-checkable-cell`), so the id is column 1.
      const first = cells(rows[0]);
      const offset = first.length && first[0].classList.contains('devui-checkable-cell') ? 1 : 0;
      return joined(rows.map((r) => cellText(r, offset)), '|');
    }),

  advanceListFirstRowTitle: (): string =>
    guardStr(() => {
      const rows = dataRows(advScope());
      if (!rows.length) return NA;
      const first = cells(rows[0]);
      const offset = first.length && first[0].classList.contains('devui-checkable-cell') ? 1 : 0;
      return cellText(rows[0], offset + 1);
    }),

  // ng-devui's LazyLoadDirective sits on the scroll container
  // (`div.devui-scrollbar` with `[enableLazyLoad]="lazy"`), so scrolling that one
  // element to its own bottom is what makes the table emit loadMore.
  driveAdvanceListLoadMore: (): string =>
    guardStr(() => {
      const root = advScope();
      if (!root) return 'no-advance-list';
      const cands = layered(['div.devui-scrollbar.scroll-view', 'div.devui-scrollbar', '.table-wrap', 'd-data-table div'], root);
      let target: HTMLElement | null = null;
      for (const c of cands) {
        const h = c as HTMLElement;
        try {
          if (h.scrollHeight > h.clientHeight + 1) {
            target = h;
            break;
          }
        } catch {
          /* keep looking */
        }
      }
      if (!target) return 'no-scrollable-container-of-' + cands.length;
      const before = target.scrollTop;
      try {
        target.scrollTop = target.scrollHeight;
      } catch {
        return 'scroll-assign-failed';
      }
      target.dispatchEvent(new Event('scroll', { bubbles: true }));
      return (
        'scrolled ' +
        (target.className || 'container').slice(0, 40) +
        ' from ' +
        before +
        ' to ' +
        target.scrollTop +
        ' of scrollHeight ' +
        target.scrollHeight +
        '/clientHeight ' +
        target.clientHeight
      );
    }),

  driveAdvanceListColumnFilter: (column: string, value: string): string =>
    guardStr(() => {
      const root = advScope();
      if (!root) return 'no-advance-list';
      const heads = layered(['thead th[dHeadCell]', 'thead th', 'th'], root).map((h) => h as HTMLElement);
      let head: HTMLElement | null = null;
      const want = String(column).trim().toLowerCase();
      for (const h of heads) {
        if (txt(h).toLowerCase().indexOf(want) >= 0) {
          head = h;
          break;
        }
      }
      if (!head) return 'column-not-found:' + column + '-of-' + heads.length;
      const icon = layeredOne(['.devui-icon-filter', '[class*="filter"]', 'svg', '.datatable-svg'], head);
      const opened = click(icon || head);
      // The filter panel is appended to the body, so it is searched document-wide.
      // ng-devui's FilterComponent renders the panel as `div.data-table-column-filter-content`
      // inside the appendToBody `div.devui-dropdown-menu`, so the specific class is tried first
      // (measured: the three `.devui-filter*` guesses below match 0 nodes in this app).
      const panel = layeredOne(['.data-table-column-filter-content', '.devui-filter-bar', '.devui-table-filter-bar', '.devui-dropdown-menu', '.devui-filter-content']);
      if (!panel) return 'opened-filter:' + (opened ? 'ok' : 'fail') + ' panel:not-rendered';
      const boxes = layered(['.devui-checkbox', 'd-checkbox', 'li'], panel);
      const pick = buttonByText(boxes.map((b) => b as HTMLElement), String(value));
      if (!pick) return 'opened-filter:' + (opened ? 'ok' : 'fail') + ' value-not-found:' + value + '-of-' + boxes.length;
      const ticked = click(one('label', pick) || one('input', pick) || pick);
      // The multiple-filter footer's OK control is ONE `<span class="button-style">{{ btnOk }}</span>`
      // (FilterComponent template, ng-devui@15.1.5): not a <button>, and its label comes from the app's
      // own i18n, so this app never renders the literal 'Confirm'. Match the class first (measured:
      // exactly 1 hit inside the panel) and keep the original text lookup as the fallback.
      const confirm =
        layeredOne(['span.button-style', '.button-style'], panel) ||
        buttonByText(
          layered(['button', '.devui-btn', 'd-button button'], panel).map((b) => b as HTMLElement),
          'Confirm'
        );
      const confirmed = confirm ? (click(confirm) ? 'ok' : 'fail') : 'no-confirm-button';
      return 'opened-filter:' + (opened ? 'ok' : 'fail') + ' ticked:' + (ticked ? 'ok' : 'fail') + ' confirmed:' + confirmed;
    }),

  /* ---------------- tree list (/pages/list/tree) ---------------- */

  treeRowCount: (): number => guardNum(() => dataRows(treeScope()).length),

  treeParentCheckState: (rowIndex: number): string =>
    guardStr(() => {
      const rows = dataRows(treeScope());
      const i = Number(rowIndex);
      if (!isFinite(i) || i < 0 || i >= rows.length) return 'no-row-' + rowIndex + '-of-' + rows.length;
      return checkState(rows[i]);
    }),

  treeChildRowCount: (rowIndex: number): number =>
    guardNum(() => {
      const rows = dataRows(treeScope());
      const i = Number(rowIndex);
      if (!isFinite(i) || i < 0 || i >= rows.length) return NAC;
      return childRows(rows[i]).length;
    }),

  treeChildCheckStates: (rowIndex: number): string =>
    guardStr(() => {
      const rows = dataRows(treeScope());
      const i = Number(rowIndex);
      if (!isFinite(i) || i < 0 || i >= rows.length) return 'no-row-' + rowIndex + '-of-' + rows.length;
      const kids = childRows(rows[i]);
      if (!kids.length) return 'no-children-rendered';
      return joined(kids.map((k) => checkState(k)), '|');
    }),

  // ng-devui renders the fold/unfold control as `span.childtable-toggler` carrying
  // `(click)="toggleChildTable(rowItem)"`, inside the cell the seed marks
  // `[nestedColumn]="true"` - in this table that is the SECOND cell, because the first is
  // `td.devui-checkable-cell` holding the row's own checkbox. The toggler is therefore
  // searched over the whole row and anything inside a checkbox is refused, so this driver
  // can never tick the row instead of expanding it (ticking the parent would fake the very
  // upward propagation a checkpoint measures).
  driveTreeExpand: (rowIndex: number): string =>
    guardStr(() => {
      const rows = dataRows(treeScope());
      const i = Number(rowIndex);
      if (!isFinite(i) || i < 0 || i >= rows.length) return 'no-row-' + rowIndex + '-of-' + rows.length;
      if (childWrapper(rows[i])) return 'already-open-children:' + childRows(rows[i]).length;
      const cand = layered(
        ['span.childtable-toggler', '.childtable-toggler', '.expand-icon-wrapper', '.devui-table-expand-icon', '[class*="fold"]'],
        rows[i]
      ).filter((el) => !el.closest('.devui-checkbox') && !el.closest('d-checkbox') && !el.closest('label'));
      const target = cand.length ? cand[0] : null;
      if (!target) return 'no-expand-control-on-row-' + i;
      let shown = 'unknown';
      try {
        shown = getComputedStyle(target as HTMLElement).visibility;
      } catch {
        shown = 'unknown';
      }
      return (
        'clicked-expand-on-row-' +
        i +
        ':' +
        (click(target) ? 'ok' : 'fail') +
        ' control:' +
        String((target as HTMLElement).className || 'none').slice(0, 40) +
        ' visibility:' +
        shown
      );
    }),

  driveTreeTickParent: (rowIndex: number): string =>
    guardStr(() => {
      const rows = dataRows(treeScope());
      const i = Number(rowIndex);
      if (!isFinite(i) || i < 0 || i >= rows.length) return 'no-row-' + rowIndex + '-of-' + rows.length;
      const before = checkState(rows[i]);
      const ctl = checkControl(rows[i]);
      if (!ctl) return 'no-checkbox-on-row-' + i;
      return 'ticked-parent-' + i + ':' + (click(ctl) ? 'ok' : 'fail') + ' state-before:' + before;
    }),

  driveTreeTickAllChildren: (rowIndex: number): string =>
    guardStr(() => {
      const rows = dataRows(treeScope());
      const i = Number(rowIndex);
      if (!isFinite(i) || i < 0 || i >= rows.length) return 'no-row-' + rowIndex + '-of-' + rows.length;
      const kids = childRows(rows[i]);
      if (!kids.length) return 'no-children-rendered-expand-first';
      let ok = 0;
      const states: string[] = [];
      for (const k of kids) {
        states.push(checkState(k));
        const ctl = checkControl(k);
        if (ctl && click(ctl)) ok += 1;
      }
      return 'ticked-' + ok + '-of-' + kids.length + '-children states-before:' + joined(states, ',');
    }),

  /* ---------------- harness self-audit ---------------- */

  persistedKeyList: (): string =>
    guardStr(() => {
      const s = store();
      if (!s) return NA;
      const keys: string[] = [];
      for (let i = 0; i < s.length; i += 1) {
        const k = s.key(i);
        if (k !== null) keys.push(k);
      }
      keys.sort();
      return joined(keys, '|');
    }),

  bridgePropertyList: (): string =>
    guardStr(() => {
      const hits: string[] = [];
      try {
        for (const k in window) {
          if (Object.prototype.hasOwnProperty.call(window, k) && /^__[A-Za-z]*DA[A-Za-z]*__$/.test(k)) hits.push(k);
        }
      } catch {
        return NA;
      }
      hits.sort();
      return joined(hits, '|') === NA ? 'none' : joined(hits, '|');
    }),

  foreignRequestCensus: (): string =>
    guardStr(() => {
      let entries: PerformanceEntry[] = [];
      try {
        entries = performance.getEntriesByType('resource');
      } catch {
        return NA;
      }
      let origin = '';
      try {
        origin = window.location.origin;
      } catch {
        origin = '';
      }
      let same = 0;
      const foreign: string[] = [];
      const byType: { [key: string]: number } = {};
      for (const e of entries) {
      const type = (e as PerformanceResourceTiming).initiatorType || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
        const name = e.name || '';
        if (name.indexOf(origin) === 0 || name.indexOf('/') === 0) {
          same += 1;
          continue;
        }
        const m = name.match(/^(?:https?:)?\/\/([^/]+)/);
        foreign.push(m ? m[1] : name.slice(0, 60));
      }
      const hosts: string[] = [];
      for (const f of foreign) {
        if (hosts.indexOf(f) < 0) hosts.push(f);
      }
      hosts.sort();
      const types: string[] = [];
      for (const k of Object.keys(byType)) {
        types.push(k + ':' + byType[k]);
      }
      types.sort();
      return 'total:' + entries.length + '|same:' + same + '|foreign:' + foreign.length + '|hosts:' + joined(hosts, ',') + '|types:' + joined(types, ',');
    }),

  consoleLatch: (): string =>
    guardStr(() =>
      'errors:' + consoleErrors.length +
      '|infos:' + consoleInfos.length +
      '|logs:' + consoleLogs.length +
      '|pageerrors:' + pageErrors.length +
      '|first-error:' + (consoleErrors.length ? consoleErrors[0] : NA) +
      '|first-pageerror:' + (pageErrors.length ? pageErrors[0] : NA)
    ),

};

/* ------------------------------------------------------------------ *
 * snapshot
 * ------------------------------------------------------------------ */

// The drivers are deliberately EXCLUDED from snapshot(): snapshot() is a read, and
// calling a driver from it would click, type, scroll or hover on every reading.
// snapshot is attached with Object.assign rather than written inside the literal so
// that it can enumerate the bridge without the literal referring to itself, which
// under `strict` would make the const's own type circular.
const DA_DRIVER_NAMES: string[] = [
  'driveCardSearch',
  'driveBasicListDelete',
  'driveDialogConfirm',
  'driveEditableListOpenAddRow',
  'driveEditableListAddRow',
  'driveNoticeOpen',
  'driveNoticeTab',
  'driveNoticeItemClick',
  'driveNoticeClear',
  'drivePersonaliseOpen',
  'drivePersonalise',
  'driveSettingsOpen',
  'driveArrangementChoice',
  'driveSignIn',
  'driveSignOut',
  'driveAdvanceListLoadMore',
  'driveAdvanceListColumnFilter',
  'driveTreeExpand',
  'driveTreeTickParent',
  'driveTreeTickAllChildren',
];

const bridge = Object.assign(bridgeCore, {
  snapshot: (): { [key: string]: unknown } => {
    const out: { [key: string]: unknown } = {};
    for (const k of Object.keys(bridgeCore)) {
      if (DA_DRIVER_NAMES.indexOf(k) >= 0) continue;
      const fn = (bridgeCore as unknown as { [key: string]: unknown })[k];
      if (typeof fn !== 'function') continue;
      try {
        if ((fn as (...a: unknown[]) => unknown).length > 0) continue;
        out[k] = (fn as () => unknown)();
      } catch (e) {
        const msg = e instanceof Error && e.message ? e.message : String(e);
        out[k] = 'bridge-error:' + msg.slice(0, 60);
      }
    }
    return out;
  },
});

try {
  (window as unknown as { [key: string]: unknown })['__DA__'] = bridge;
} catch {
  /* nothing to do if the global cannot be published */
}

export type DaBridge = typeof bridge;
