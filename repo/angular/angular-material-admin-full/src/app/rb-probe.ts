/**
 * RepairBench observability probe (instrumentation face).
 *
 * A read-only DOM surface plus user-executable action primitives for the
 * angular-material-admin-full delivery face. It exposes exactly one global,
 * window.__AMAF__, whose members are plain functions: calling a reader never
 * mutates application state. Every reader degrades to the sentinel '-' (string) or -1
 * (number) when the element it needs is absent, so a broken face reports a
 * stable value instead of throwing.
 *
 * It holds no reference to any Angular component, directive or service
 * instance, reads no component-internal field, and adds no test-selector
 * attribute to any template. Everything below is derived from the DOM that the
 * shipped templates already render.
 */
const all = (sel: string, root?: ParentNode): HTMLElement[] =>
  Array.prototype.slice.call((root || document).querySelectorAll(sel)) as HTMLElement[];

const q = (sel: string, root?: ParentNode): HTMLElement | null =>
  (root || document).querySelector(sel) as HTMLElement | null;

const str = (v: string | null | undefined): string =>
  v === null || v === undefined || v === '' ? '-' : String(v);

const num = (v: number): number => (Number.isFinite(v) && v >= 0 ? v : -1);

const text = (el: HTMLElement | null): string =>
  el ? str((el.textContent || '').replace(/\s+/g, ' ').trim()) : '-';

const pxOf = (v: string | null): number => {
  const m = /^([0-9.]+)px$/.exec((v || '').trim());
  return m ? Number(m[1]) : -1;
};

const usersTable = (): HTMLElement | null => q('table[matsort]');

const usersHeaderCells = (): HTMLElement[] => {
  const t = usersTable();
  return t ? all('tr[mat-header-row] th[mat-header-cell]', t) : [];
};

const usersBodyRows = (): HTMLElement[] => {
  const t = usersTable();
  return t ? all('tr[mat-row]', t) : [];
};

const columnIndex = (heading: string): number => {
  const cells = usersHeaderCells();
  for (let i = 0; i < cells.length; i++) {
    if (text(cells[i]).toLowerCase().indexOf(heading.toLowerCase()) === 0) { return i; }
  }
  return -1;
};

const columnTexts = (heading: string): string[] => {
  const i = columnIndex(heading);
  if (i < 0) { return ['-']; }
  const out: string[] = [];
  const rows = usersBodyRows();
  for (let r = 0; r < rows.length; r++) {
    const cells = all('td[mat-cell]', rows[r]);
    out.push(cells.length > i ? text(cells[i]) : '-');
  }
  return out.length ? out : ['-'];
};

const supportHost = (): HTMLElement | null => q('app-support-requests');

const supportMaster = (): HTMLElement | null => {
  const h = supportHost();
  return h ? q('th[mat-header-cell] mat-checkbox', h) : null;
};

const supportRowBoxes = (): HTMLElement[] => {
  const h = supportHost();
  return h ? all('td[mat-cell] mat-checkbox', h) : [];
};

const boxInput = (box: HTMLElement | null): HTMLInputElement | null =>
  box ? (q('input[type=checkbox]', box) as HTMLInputElement | null) : null;

const clickEl = (el: HTMLElement | null): number => {
  if (!el) { return 0; }
  el.click();
  return 1;
};

const api: { [k: string]: (...args: any[]) => unknown } = {
  probeVersion: (): string => 'amaf-probe-1',
  onUsersPage: (): number => (usersTable() ? 1 : 0),
  onDashboard: (): number => (supportHost() ? 1 : 0),
  usersHeaderCellCount: (): number => num(usersHeaderCells().length),
  usersBodyRowCount: (): number => num(usersBodyRows().length),
  usersFirstRowCellCount: (): number => {
    const rows = usersBodyRows();
    return rows.length ? num(all('td[mat-cell]', rows[0]).length) : -1;
  },
  usersColumnOrder: (): string[] => {
    const c = usersHeaderCells();
    return c.length ? c.map((x) => text(x)) : ['-'];
  },
  usersColumnTexts: (heading: string): string[] => columnTexts(heading),
  usersDisabledCheckedCount: (): number => {
    const t = usersTable();
    if (!t) { return -1; }
    return num(all('tr[mat-row] mat-checkbox input[type=checkbox]', t)
      .filter((b) => (b as HTMLInputElement).checked).length);
  },
  usersDisabledBoxCount: (): number => {
    const t = usersTable();
    return t ? num(all('tr[mat-row] mat-checkbox input[type=checkbox]', t).length) : -1;
  },
  usersAvatarSrcCount: (): number => {
    const t = usersTable();
    return t ? num(all('img.table-img', t).length) : -1;
  },
  usersAvatarNonEmptySrcCount: (): number => {
    const t = usersTable();
    if (!t) { return -1; }
    return num(all('img.table-img', t)
      .filter((i) => str(i.getAttribute('src')) !== '-').length);
  },
  usersAvatarSrcs: (): string[] => {
    const t = usersTable();
    if (!t) { return ['-']; }
    const v = all('img.table-img', t).map((i) => str(i.getAttribute('src')));
    return v.length ? v : ['-'];
  },
  cardCount: (): number => num(all('mat-card.card').length),
  filterPanelVisible: (): number => (all('mat-card.card').length > 1 ? 1 : 0),
  apiDocsHref: (): string => {
    const a = all('a').filter((x) => text(x).indexOf('API documentation for users') === 0)[0];
    return a ? str(a.getAttribute('href')) : '-';
  },
  dialogContainerCount: (): number => num(all('.mat-mdc-dialog-container').length),
  dialogWidthPx: (): number => {
    const c = q('.mat-mdc-dialog-container');
    return c ? pxOf(c.ownerDocument.defaultView ? c.ownerDocument.defaultView.getComputedStyle(c).width : null) : -1;
  },
  createRoleValue: (): string => {
    const g = all('mat-radio-group[formcontrolname=role]');
    if (!g.length) { return '-'; }
    for (let i = 0; i < g.length; i++) {
      const checked = q('mat-radio-button.mat-mdc-radio-checked', g[i]);
      if (checked) { return text(checked); }
    }
    return '-';
  },
  createDisabledChecked: (): number => {
    const b = q('mat-checkbox[formcontrolname=disabled] input[type=checkbox]');
    return b ? ((b as HTMLInputElement).checked ? 1 : 0) : -1;
  },
  supportMasterChecked: (): number => {
    const b = boxInput(supportMaster());
    return b ? (b.checked ? 1 : 0) : -1;
  },
  supportMasterIndeterminate: (): number => {
    const b = boxInput(supportMaster());
    return b ? (b.indeterminate ? 1 : 0) : -1;
  },
  supportMasterAriaLabel: (): string => {
    const b = boxInput(supportMaster());
    return b ? str(b.getAttribute('aria-label')) : '-';
  },
  supportRowBoxCount: (): number => num(supportRowBoxes().length),
  supportRowCheckedCount: (): number =>
    num(supportRowBoxes().map(boxInput).filter((b) => b !== null && (b as HTMLInputElement).checked).length),
  supportRowAriaLabels: (): string[] => {
    const v = supportRowBoxes().map((x) => str(boxInput(x)?.getAttribute('aria-label')));
    return v.length ? v : ['-'];
  },
  supportColumnTexts: (heading: string): string[] => {
    const h = supportHost();
    if (!h) { return ['-']; }
    const heads = all('th[mat-header-cell]', h);
    let idx = -1;
    for (let i = 0; i < heads.length; i++) {
      if (text(heads[i]).toLowerCase().indexOf(heading.toLowerCase()) === 0) { idx = i; break; }
    }
    if (idx < 0) { return ['-']; }
    const out: string[] = [];
    const rows = all('tr[mat-row]', h);
    for (let r = 0; r < rows.length; r++) {
      const cells = all('td[mat-cell]', rows[r]);
      const td = cells.length > idx ? cells[idx] : null;
      const nameNode = td ? q('p.table-body-text', td) : null;
      out.push(nameNode ? text(nameNode) : '-');
    }
    return out.length ? out : ['-'];
  },
  chartContainerCount: (): number => num(all('[echarts]').length),
  chartHeights: (): string[] => {
    const v = all('[echarts]').map((e) => str(e.style.height));
    return v.length ? v : ['-'];
  },
  chartWidths: (): string[] => {
    const v = all('[echarts]').map((e) => str(e.style.width));
    return v.length ? v : ['-'];
  },
  chartHeightPx: (): number => {
    const e = q('[echarts]');
    return e ? pxOf(e.style.height) : -1;
  },
  chartWidthPx: (): number => {
    const e = q('[echarts]');
    return e ? pxOf(e.style.width) : -1;
  },
  clickFirstByText: (sel: string, needle: string): number => {
    const m = all(sel).filter((x) => text(x).indexOf(needle) >= 0)[0];
    return clickEl(m || null);
  },
  clickSelector: (sel: string, index: number): number => {
    const m = all(sel);
    return clickEl(m.length > index && index >= 0 ? m[index] : null);
  },
  setInputValue: (sel: string, value: string): number => {
    const el = q(sel) as HTMLInputElement | null;
    if (!el) { return 0; }
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return 1;
  },
  sortUsersBy: (heading: string): number => {
    const i = columnIndex(heading);
    if (i < 0) { return 0; }
    return clickEl(usersHeaderCells()[i] || null);
  },
  openPageSizeSelect: (): number => clickEl(q('mat-paginator .mat-mdc-select-value-text, mat-paginator .mat-mdc-select-trigger')),
  pageSizeOptionTexts: (): string[] => {
    const v = all('mat-option').map((o) => text(o)).filter((t) => t !== '-');
    return v.length ? v : ['-'];
  },
  usersSortableHeaderCount: (): number => {
    const t = usersTable();
    return t ? num(all('th[mat-header-cell][mat-sort-header]', t).length) : -1;
  },
  usersHeaderAriaSort: (heading: string): string => {
    const c = usersHeaderCells();
    const i = columnIndex(heading);
    return i >= 0 && c[i] ? str(c[i].getAttribute('aria-sort')) : '-';
  },
  createDisabledBoxCount: (): number =>
    num(all('mat-checkbox[formcontrolname=disabled] input[type=checkbox]').length),
  dialogTitleText: (): string => text(q('.mat-mdc-dialog-container h2.title')),
  mousedownSelector: (sel: string, index: number): number => {
    const m = all(sel);
    const el = m.length > index && index >= 0 ? m[index] : null;
    if (!el) { return 0; }
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    return 1;
  },
  readerNames: (): string[] => Object.keys(api).sort(),
};

const frozen: { [k: string]: unknown } = {};
for (const k of Object.keys(api)) {
  Object.defineProperty(frozen, k, { value: api[k], enumerable: true, writable: false, configurable: false });
}
Object.defineProperty(window, '__AMAF__', { value: frozen, writable: false, configurable: false });
