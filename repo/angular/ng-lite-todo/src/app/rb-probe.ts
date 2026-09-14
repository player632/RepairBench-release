/* tslint:disable */
/**
 * RepairBench read-only observation bridge for repair-angular__ng-lite-todo-01
 * (seed ng-lite-todo: Angular 15.2.6 standalone-component todo app, local baseline commit
 * 02a859469d87f0f15c2ea32d1cce2dbcc843f265 of the gate clone).
 *
 * DISCIPLINE (the same contract the report-editor / code-editor bridges ship under):
 *  - It reads the DOM the seed already renders: element censuses, attributes, text, computed
 *    styles, the document title, the location, the history entry count, the storage key set,
 *    resource timing and a passive console/error latch. It reads NO Angular component field, NO
 *    service module binding and NO Task object. The one non-DOM surface it reads is the request
 *    log of the offline transport adapter that environment/adaptation.patch installs, which is
 *    harness-owned environment code, not application state.
 *  - Its drivers perform ONLY writes a user could perform: setting the value of the very input the
 *    seed binds (change) to and dispatching the input+change pair a real commit produces, setting
 *    the value of the very select the seed binds (change) to and dispatching the same pair, and
 *    element.click() on the very checkbox the seed binds (change) to. Every driver returns a
 *    string receipt so a checkpoint can prove the interaction happened instead of trusting a sleep.
 *  - Every reader is wrapped: an unavailable reading degrades to the sentinel '-' (or -1 for a
 *    count) instead of throwing, so a checkpoint can only ever fail on a measured value and never
 *    on a bridge crash.
 *  - It adds NO markup hook and NO data-testid, edits NO template, moves NO element and changes NO
 *    style. src/main.ts gains exactly one line, `import './app/rb-probe';`, ahead of every other
 *    import so the console latch is installed before Angular boots.
 *  - Numeric style readings are returned as the browser's own serialised strings and are never
 *    re-parsed here, so no checkpoint depends on this file's arithmetic.
 *  - BUILD_TOKEN is the stale-artefact positive control: it exists only in a bundle produced from
 *    this instrumentation, so a checkpoint that reads it back proves the bytes being served were
 *    built by this run and not left over in an untracked dist/ (see meta.outdir_blind_zone).
 */
import { rbApiLog } from './rb-local-api';

const W: any = window as any;
const SENT = '-';
const SENTN = -1;
const TOKEN = 'nlt-r24-18z20-1';
const KIND = 'rb-probe/ng-lite-todo/1';

const SEL_ROOT = 'app-root';
const SEL_H1 = 'app-root h1';
const SEL_ADD = 'app-task-add';
const SEL_ADD_INPUT = 'app-task-add input[type="text"]';
const SEL_LIST = 'app-task-list';
const SEL_COUNT = 'app-task-list .count';
const SEL_FILTER = 'app-task-filter';
const SEL_SELECT = 'app-task-filter select#filter';
const SEL_SELECT_OPTION = 'app-task-filter select#filter option';
const SEL_FILTER_LABEL = 'app-task-filter label';
const SEL_ITEM = 'app-task-item';
const SEL_ITEM_LABEL = 'app-task-item label';
const SEL_BOX = 'app-task-item input[type="checkbox"]';

const baseHistoryLen = (function (): number {
  try {
    const n = Number(window.history.length);
    return Number.isFinite(n) ? n : SENTN;
  } catch (e) {
    return SENTN;
  }
})();

let consoleErrorCount = 0;
let pageErrorCount = 0;
const consoleErrorTexts: string[] = [];
let lastDriver = SENT;
let driverCount = 0;

(function installLatches(): void {
  try {
    const orig = console.error;
    console.error = function (...args: any[]): void {
      consoleErrorCount++;
      try {
        consoleErrorTexts.push(String(args && args.length ? args[0] : '').slice(0, 200));
      } catch (e) {
        /* the latch never throws */
      }
      if (orig) {
        orig.apply(console, args);
      }
    };
  } catch (e) {
    /* console not patchable here */
  }
  try {
    window.addEventListener('error', function (): void { pageErrorCount++; });
    window.addEventListener('unhandledrejection', function (): void { pageErrorCount++; });
  } catch (e) {
    /* window not patchable here */
  }
})();

function q(sel: string): Element[] {
  try {
    return Array.prototype.slice.call(document.querySelectorAll(sel)) as Element[];
  } catch (e) {
    return [];
  }
}

function one(sel: string): Element | null {
  const a = q(sel);
  return a.length ? a[0] : null;
}

function norm(s: any): string {
  return String(s === null || s === undefined ? '' : s).replace(/\s+/g, ' ').trim();
}

function txt(el: Element | null): string {
  try {
    return el ? norm(el.textContent || '') : SENT;
  } catch (e) {
    return SENT;
  }
}

function attr(el: Element | null, name: string): string {
  try {
    if (!el) { return SENT; }
    const v = el.getAttribute(name);
    return v === null ? SENT : String(v);
  } catch (e) {
    return SENT;
  }
}

function styleOf(el: Element | null, pseudo: string | null, prop: string): string {
  try {
    if (!el) { return SENT; }
    const cs = window.getComputedStyle(el as HTMLElement, pseudo === null ? undefined : pseudo);
    const v = cs.getPropertyValue(prop);
    return v === null || v === '' ? SENT : String(v).trim();
  } catch (e) {
    return SENT;
  }
}

function boxes(): (HTMLInputElement | null)[] {
  return q(SEL_ITEM).map(function (el: Element): HTMLInputElement | null {
    try {
      return el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    } catch (e) {
      return null;
    }
  });
}

function firstBoxWith(wanted: boolean): HTMLInputElement | null {
  const bs = boxes();
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    if (b && b.checked === wanted) { return b; }
  }
  return null;
}

function itemTextList(): string[] {
  return q(SEL_ITEM).map(function (el: Element): string {
    const l = el.querySelector('label');
    return txt(l || el);
  });
}

function logEntries(method: string): any[] {
  try {
    return rbApiLog.filter(function (e: any): boolean { return String(e.method) === method; });
  } catch (e) {
    return [];
  }
}

function lastEntry(method: string): any {
  const a = logEntries(method);
  return a.length ? a[a.length - 1] : null;
}

function parsedBody(entry: any): any {
  try {
    const v = JSON.parse(String(entry && entry.body ? entry.body : ''));
    return v && typeof v === 'object' ? v : null;
  } catch (e) {
    return null;
  }
}

function bodyKeysOf(entry: any): string {
  const v = parsedBody(entry);
  if (!v) { return entry ? SENT : 'none'; }
  const ks = Object.keys(v).sort();
  return ks.length ? ks.join(',') : 'empty';
}

function bodyFieldOf(entry: any, key: string): string {
  const v = parsedBody(entry);
  if (!v) { return entry ? SENT : 'none'; }
  return v[key] === undefined ? SENT : String(v[key]);
}

const api = {
  buildToken(): string { return TOKEN; },
  probeKind(): string { return KIND; },
  bridgeOwnGlobalCount(): number {
    try {
      return Object.keys(window).filter(function (k: string): boolean { return k.indexOf('__rb') === 0; }).length;
    } catch (e) { return SENTN; }
  },
  appRootCount(): number { return q(SEL_ROOT).length; },
  h1Text(): string { return txt(one(SEL_H1)); },
  h1TextTransform(): string { return styleOf(one(SEL_H1), null, 'text-transform'); },
  h1Color(): string { return styleOf(one(SEL_H1), null, 'color'); },
  addHostCount(): number { return q(SEL_ADD).length; },
  listHostCount(): number { return q(SEL_LIST).length; },
  filterHostCount(): number { return q(SEL_FILTER).length; },
  itemCount(): number { return q(SEL_ITEM).length; },
  itemLabelCount(): number { return q(SEL_ITEM_LABEL).length; },
  itemTexts(): string { return itemTextList().join('|'); },
  itemTextSet(): string { return itemTextList().slice().sort().join('|'); },
  checkedCount(): number {
    return boxes().filter(function (b: HTMLInputElement | null): boolean { return !!b && b.checked === true; }).length;
  },
  checkboxCount(): number { return q(SEL_BOX).length; },
  checkboxTypeSet(): string {
    const vs = q(SEL_BOX).map(function (el: Element): string { return attr(el, 'type'); });
    return vs.length ? Array.from(new Set(vs)).sort().join('|') : SENT;
  },
  checkboxInputWidth(): string { const b = boxes()[0]; return styleOf(b, null, 'width'); },
  checkedMarkerColor(): string { return styleOf(firstBoxWith(true), '::before', 'background-color'); },
  uncheckedMarkerColor(): string { return styleOf(firstBoxWith(false), '::before', 'background-color'); },
  countText(): string { return txt(one(SEL_COUNT)); },
  addInputCount(): number { return q(SEL_ADD_INPUT).length; },
  addInputType(): string { return attr(one(SEL_ADD_INPUT), 'type'); },
  addInputValue(): string {
    try {
      const el = one(SEL_ADD_INPUT) as HTMLInputElement | null;
      return el ? String(el.value) : SENT;
    } catch (e) { return SENT; }
  },
  addInputPlaceholder(): string { return attr(one(SEL_ADD_INPUT), 'placeholder'); },
  filterSelectCount(): number { return q(SEL_SELECT).length; },
  filterOptionValues(): string {
    const vs = q(SEL_SELECT_OPTION).map(function (el: Element): string { return attr(el, 'value'); });
    return vs.join('|');
  },
  filterSelectValue(): string {
    try {
      const el = one(SEL_SELECT) as HTMLSelectElement | null;
      return el ? String(el.value) : SENT;
    } catch (e) { return SENT; }
  },
  filterLabelText(): string { return txt(one(SEL_FILTER_LABEL)); },
  docTitle(): string { try { return norm(document.title); } catch (e) { return SENT; } },
  pathname(): string { try { return String(window.location.pathname); } catch (e) { return SENT; } },
  historyDelta(): number {
    try {
      const n = Number(window.history.length);
      if (!Number.isFinite(n) || baseHistoryLen === SENTN) { return SENTN; }
      return n - baseHistoryLen;
    } catch (e) { return SENTN; }
  },
  baseHref(): string { return attr(one('base'), 'href'); },
  documentElementLang(): string { return attr(document.documentElement, 'lang'); },
  metaViewportContent(): string { return attr(one('meta[name="viewport"]'), 'content'); },
  faviconHref(): string { return attr(one('link[rel="icon"]'), 'href'); },
  bodyMargin(): string { return styleOf(document.body, null, 'margin-top'); },
  bodyFontFamilyFirst(): string {
    const f = styleOf(document.body, null, 'font-family');
    return f === SENT ? SENT : f.split(',')[0].trim().replace(/^["']|["']$/g, '');
  },
  itemHostBorderBottomWidth(): string { return styleOf(one(SEL_ITEM), null, 'border-bottom-width'); },
  listHostMaxWidth(): string { return styleOf(one(SEL_LIST), null, 'max-width'); },
  addHostMaxWidth(): string { return styleOf(one(SEL_ADD), null, 'max-width'); },
  storageKeys(): string {
    try { return Object.keys(window.localStorage).sort().join(','); } catch (e) { return SENT; }
  },
  storageUserIdShape(): string {
    try {
      const v = window.localStorage.getItem('userId');
      if (v === null) { return 'absent'; }
      return /^[a-z0-9]{4,}$/.test(String(v)) ? 'ok' : 'bad';
    } catch (e) { return SENT; }
  },
  consoleErrorCount(): number { return consoleErrorCount; },
  pageErrorCount(): number { return pageErrorCount; },
  consoleErrorFirst(): string { return consoleErrorTexts.length ? consoleErrorTexts[0] : 'none'; },
  externalResourceCount(): number {
    try {
      const es = performance.getEntriesByType('resource');
      let n = 0;
      for (let i = 0; i < es.length; i++) {
        try {
          const u = new URL(String(es[i].name), window.location.href);
          if (u.origin !== window.location.origin) { n++; }
        } catch (e) { /* unparseable entry is not an external hit */ }
      }
      return n;
    } catch (e) { return SENTN; }
  },
  apiLogSummary(): string {
    try {
      const order: string[] = [];
      const counts: any = {};
      for (let i = 0; i < rbApiLog.length; i++) {
        const m = String(rbApiLog[i].method);
        if (counts[m] === undefined) { counts[m] = 0; order.push(m); }
        counts[m] = counts[m] + 1;
      }
      return order.length ? order.map(function (m: string): string { return m + ':' + counts[m]; }).join('|') : 'empty';
    } catch (e) { return SENT; }
  },
  apiMethods(): string {
    try {
      const order: string[] = [];
      for (let i = 0; i < rbApiLog.length; i++) {
        const m = String(rbApiLog[i].method);
        if (order.indexOf(m) < 0) { order.push(m); }
      }
      return order.length ? order.join('|') : 'empty';
    } catch (e) { return SENT; }
  },
  apiLastGetPathShape(): string {
    const e = lastEntry('GET');
    if (!e) { return 'none'; }
    return /^\/users\/[a-z0-9]+\/tasks\/?$/.test(String(e.path)) ? 'ok' : 'bad:' + String(e.path);
  },
  apiLastPatchPathShape(): string {
    const e = lastEntry('PATCH');
    if (!e) { return 'none'; }
    return /^\/users\/[a-z0-9]+\/tasks\/\d+\/?$/.test(String(e.path)) ? 'ok' : 'bad:' + String(e.path);
  },
  apiPostBodyKeys(): string { const e = lastEntry('POST'); return e ? bodyKeysOf(e) : 'none'; },
  apiPostBodyDescription(): string { const e = lastEntry('POST'); return e ? bodyFieldOf(e, 'description') : 'none'; },
  apiPostResponseStatus(): number { const e = lastEntry('POST'); return e ? Number(e.status) : SENTN; },
  apiPatchCount(): number { return logEntries('PATCH').length; },
  apiPatchBodyKeys(): string { const e = lastEntry('PATCH'); return e ? bodyKeysOf(e) : 'none'; },
  apiPatchBodyCompletedValue(): string { const e = lastEntry('PATCH'); return e ? bodyFieldOf(e, 'completed') : 'none'; },
  settle(maxMs: number): Promise<string> {
    const t0 = Date.now();
    const ready = function (): boolean {
      try {
        return q(SEL_ITEM).length > 0 && !!one(SEL_ADD_INPUT) && !!one(SEL_SELECT) && !!one(SEL_H1);
      } catch (e) {
        return false;
      }
    };
    return new Promise<string>(function (resolve: (v: string) => void): void {
      const step = function (): void {
        const done = ready();
        const spent = Date.now() - t0;
        if (done || spent > Number(maxMs)) {
          resolve('settled:' + String(done) + ':' + String(spent));
          return;
        }
        setTimeout(step, 50);
      };
      step();
    });
  },
  lastDriver(): string { return lastDriver; },
  driverCount(): number { return driverCount; },
  typeAndCommitAdd(text: string): string {
    try {
      const el = one(SEL_ADD_INPUT) as HTMLInputElement | null;
      if (!el) { lastDriver = 'no-input'; driverCount++; return lastDriver; }
      el.value = String(text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      lastDriver = 'typed:' + String(text).length + ':input+change';
      driverCount++;
      return lastDriver;
    } catch (e) { lastDriver = 'error:' + String(e); driverCount++; return lastDriver; }
  },
  chooseFilter(value: string): string {
    try {
      const el = one(SEL_SELECT) as HTMLSelectElement | null;
      if (!el) { lastDriver = 'no-select'; driverCount++; return lastDriver; }
      el.value = String(value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      lastDriver = 'selected:' + String(el.value);
      driverCount++;
      return lastDriver;
    } catch (e) { lastDriver = 'error:' + String(e); driverCount++; return lastDriver; }
  },
  clickItemBox(index: number): string {
    try {
      const bs = boxes();
      const el = bs[index];
      if (!el) { lastDriver = 'no-box:' + String(index); driverCount++; return lastDriver; }
      (el as HTMLElement).click();
      lastDriver = 'clicked:' + String(index);
      driverCount++;
      return lastDriver;
    } catch (e) { lastDriver = 'error:' + String(e); driverCount++; return lastDriver; }
  }
};

W.__rb_nlt = api;
