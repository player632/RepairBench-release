// Read-only probe bridge for the repair-bench verifier (repair-vue__domternal-01).
// Added by environment/instrumentation.patch and imported FIRST from apps/demo-vue/src/main.ts.
//
// Contract: this module NEVER changes application behaviour.
//   * it publishes exactly one global, window.__rb, and nothing else;
//   * every accessor is a READ (DOM text/class/attribute, the demo's own
//     window.__DEMO_EDITOR__ handle, performance resource entries, storage keys);
//   * it never writes application state, never patches a component, never
//     dispatches an event, and installs no timer;
//   * the fetch recorder below is a strict pass-through: it appends one string to
//     a module-private array and returns the untouched promise of the native
//     fetch, so request order, arguments, credentials and rejection semantics are
//     exactly what the application asked for.
//
// Every accessor returns a SCALAR (string / number / boolean). Lists are joined
// with "|" and objects are joined with "," so the verifier can compare them with
// a single equality (evaluation/dsl_runner.mjs js_eval asserts compare scalars).

const CALLS: string[] = [];
const nativeFetch = window.fetch;

window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  try {
    const raw = typeof input === 'string' ? input : String((input && (input as Request).url) || input);
    const method = String((init && init.method) || ((input as Request) && (input as Request).method) || 'GET').toUpperCase();
    CALLS.push(raw + ' ' + method);
  } catch (e) {
    /* a recorder must never break a request */
  }
  return nativeFetch.apply(this, arguments as unknown as [RequestInfo | URL, RequestInit?]);
};

const norm = (s: unknown): string => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const q = (sel: string): HTMLElement[] => Array.from(document.querySelectorAll(sel)) as HTMLElement[];
const one = (sel: string): HTMLElement | null => document.querySelector(sel) as HTMLElement | null;
const textOf = (el: HTMLElement | null): string =>
  el ? norm(el.innerText != null && el.innerText !== '' ? el.innerText : el.textContent) : '';
const classOf = (el: HTMLElement | null): string => (el ? norm(el.getAttribute('class')) : '');
const attrOf = (el: HTMLElement | null, name: string): string =>
  el ? String(el.getAttribute(name) ?? '__ABSENT__') : '__NO_ELEMENT__';
const join = (a: unknown[]): string => a.map((x) => String(x)).join('|');
const MISS = '__MISSING__';

// The manual (useEditor) mode renders into App.vue's `.app-editor-demo` wrapper.
const MAN = '.app-editor-demo';
const pmOf = (scope: string): HTMLElement | null => one(scope + ' .dm-editor .ProseMirror') || one(scope + ' .ProseMirror');

function demoEditor(): any {
  try {
    return (window as unknown as Record<string, any>).__DEMO_EDITOR__ || null;
  } catch (e) {
    return null;
  }
}

const rb = {
  version: 1,

  // ---- 0 outbound: how often the APPLICATION asks, and whether anything leaves the origin ----
  net: {
    total(): number {
      return CALLS.length;
    },
    calls(substr: string): number {
      const s = String(substr);
      return CALLS.filter((c) => c.indexOf(s) !== -1).length;
    },
    external(): number {
      const o = window.location.origin;
      return CALLS.filter((c) => {
        const u = c.split(' ')[0];
        return /^https?:\/\//i.test(u) && u.indexOf(o) !== 0;
      }).length;
    },
    urls(): string {
      return join(CALLS.slice(0, 40)) || '__NONE__';
    },
    // Read-only second opinion from the browser's own resource timing buffer: it
    // sees every subresource the page actually pulled, whichever API asked for it.
    resources(): number {
      try {
        return performance.getEntriesByType('resource').length;
      } catch (e) {
        return -1;
      }
    },
    resourceExternal(): number {
      try {
        const o = window.location.origin;
        return performance.getEntriesByType('resource').filter((r) => {
          try {
            return new URL(r.name).origin !== o;
          } catch (e) {
            return false;
          }
        }).length;
      } catch (e) {
        return -1;
      }
    },
    resourceHosts(): string {
      try {
        const o = window.location.origin;
        const hosts = performance.getEntriesByType('resource').map((r) => {
          try {
            const u = new URL(r.name);
            return u.origin === o ? 'same' : u.host;
          } catch (e) {
            return 'unparsed';
          }
        });
        return join(Array.from(new Set(hosts)).sort()) || '__NONE__';
      } catch (e) {
        return '__ERR__';
      }
    },
  },

  // ---- page chrome / mode switch ----
  app: {
    mounted(): boolean {
      const el = one('#app');
      return !!el && el.children.length > 0;
    },
    h1(): string {
      return textOf(one('.demo > h1'));
    },
    documentTitle(): string {
      return String(document.title || '');
    },
    mode(): string {
      const act = one('[data-testid="demo-mode-toggle"] button.active');
      return act ? String(act.getAttribute('data-testid') || MISS).replace(/^mode-/, '') : MISS;
    },
    modeCount(): number {
      return q('[data-testid="demo-mode-toggle"] button').length;
    },
    modeLabels(): string {
      return join(q('[data-testid="demo-mode-toggle"] button').map((b) => norm(b.textContent)));
    },
    bodyClasses(): string {
      return classOf(document.body) || '__NONE__';
    },
    darkOn(): boolean {
      return document.body.classList.contains('dm-theme-dark');
    },
    themeTitle(): string {
      return attrOf(one('.theme-toggle'), 'title');
    },
    themeLabel(): string {
      return textOf(one('.theme-toggle'));
    },
    layoutToggleLabels(): string {
      return join(q('.toolbar-mode-toggle button').map((b) => norm(b.textContent) + (b.classList.contains('active') ? '*' : '')));
    },
  },

  // ---- the editor instance the demo itself exposes (read-only) ----
  ed: {
    present(): boolean {
      return !!demoEditor();
    },
    destroyed(): boolean {
      const ed = demoEditor();
      return ed ? !!ed.isDestroyed : false;
    },
    editable(): boolean {
      const ed = demoEditor();
      return ed ? !!ed.isEditable : false;
    },
    focused(): boolean {
      const ed = demoEditor();
      return ed ? !!ed.isFocused : false;
    },
    empty(): boolean {
      const ed = demoEditor();
      return ed ? !!ed.isEmpty : false;
    },
    active(name: string): boolean {
      const ed = demoEditor();
      try {
        return ed ? !!ed.isActive(String(name)) : false;
      } catch (e) {
        return false;
      }
    },
    text(): string {
      const ed = demoEditor();
      try {
        return ed ? norm(ed.getText()) : MISS;
      } catch (e) {
        return '__ERR__';
      }
    },
    has(substr: string): boolean {
      const ed = demoEditor();
      try {
        return ed ? String(ed.getText()).indexOf(String(substr)) !== -1 : false;
      } catch (e) {
        return false;
      }
    },
    htmlHas(substr: string): boolean {
      const ed = demoEditor();
      try {
        return ed ? String(ed.getHTML()).indexOf(String(substr)) !== -1 : false;
      } catch (e) {
        return false;
      }
    },
    htmlLen(): number {
      const ed = demoEditor();
      try {
        return ed ? String(ed.getHTML()).length : -1;
      } catch (e) {
        return -1;
      }
    },
    blockTags(): string {
      const ed = demoEditor();
      try {
        if (!ed) return MISS;
        const out: string[] = [];
        ed.state.doc.forEach((n: any) => out.push(String(n.type.name)));
        return join(out);
      } catch (e) {
        return '__ERR__';
      }
    },
    blockCount(): number {
      const ed = demoEditor();
      try {
        return ed ? ed.state.doc.childCount : -1;
      } catch (e) {
        return -1;
      }
    },
    selFrom(): number {
      const ed = demoEditor();
      try {
        return ed ? Number(ed.state.selection.from) : -1;
      } catch (e) {
        return -1;
      }
    },
    selTo(): number {
      const ed = demoEditor();
      try {
        return ed ? Number(ed.state.selection.to) : -1;
      } catch (e) {
        return -1;
      }
    },
    selEmpty(): boolean {
      const ed = demoEditor();
      try {
        return ed ? !!ed.state.selection.empty : false;
      } catch (e) {
        return false;
      }
    },
    canUndo(): boolean {
      const ed = demoEditor();
      try {
        return ed ? !!ed.can().undo() : false;
      } catch (e) {
        return false;
      }
    },
    canRedo(): boolean {
      const ed = demoEditor();
      try {
        return ed ? !!ed.can().redo() : false;
      } catch (e) {
        return false;
      }
    },
    hasUndoCommand(): boolean {
      const ed = demoEditor();
      try {
        return ed ? typeof ed.commands.undo === 'function' : false;
      } catch (e) {
        return false;
      }
    },
    activeElement(): string {
      const a = document.activeElement;
      if (!a) return '__NONE__';
      const cls = classOf(a as HTMLElement);
      return String(a.tagName.toLowerCase()) + (cls ? '.' + cls.split(' ')[0] : '') +
        (a.getAttribute && a.getAttribute('aria-label') ? '[' + a.getAttribute('aria-label') + ']' : '');
    },
  },

  // ---- toolbar (packages/vue toolbar layer) ----
  toolbar: {
    count(scope: string): number {
      return q((scope === '-' ? '' : scope + ' ') + '.dm-toolbar .dm-toolbar-button').length;
    },
    labels(scope: string): string {
      return join(q((scope === '-' ? '' : scope + ' ') + '.dm-toolbar .dm-toolbar-button').map((b) => attrOf(b, 'aria-label')));
    },
    separators(scope: string): number {
      return q((scope === '-' ? '' : scope + ' ') + '.dm-toolbar .dm-toolbar-separator').length;
    },
    btn(label: string): HTMLElement | null {
      return one('.dm-toolbar .dm-toolbar-button[aria-label="' + String(label) + '"]');
    },
    pressed(label: string): string {
      return attrOf(rb.toolbar.btn(label), 'aria-pressed');
    },
    disabled(label: string): boolean {
      const b = rb.toolbar.btn(label);
      return b ? b.disabled === true : false;
    },
    present(label: string): boolean {
      return !!rb.toolbar.btn(label);
    },
    title(label: string): string {
      return attrOf(rb.toolbar.btn(label), 'title');
    },
    classes(label: string): string {
      return classOf(rb.toolbar.btn(label));
    },
    activeClass(label: string): boolean {
      const b = rb.toolbar.btn(label);
      return b ? b.classList.contains('dm-toolbar-button--active') : false;
    },
    iconHead(label: string): string {
      const b = rb.toolbar.btn(label);
      return b ? String(b.innerHTML).slice(0, 12) : MISS;
    },
    tabindex0Index(scope: string): number {
      const bs = q((scope === '-' ? '' : scope + ' ') + '.dm-toolbar .dm-toolbar-button');
      return bs.findIndex((b) => String(b.getAttribute('tabindex')) === '0');
    },
    tabindexList(scope: string): string {
      return join(q((scope === '-' ? '' : scope + ' ') + '.dm-toolbar .dm-toolbar-button').map((b) => String(b.getAttribute('tabindex'))));
    },
    focusedButtonIndex(scope: string): number {
      const bs = q((scope === '-' ? '' : scope + ' ') + '.dm-toolbar .dm-toolbar-button');
      return bs.indexOf(document.activeElement as HTMLElement);
    },
    activeNames(scope: string): string {
      return join(q((scope === '-' ? '' : scope + ' ') + '.dm-toolbar .dm-toolbar-button--active')
        .map((b) => attrOf(b, 'aria-label'))) || '__NONE__';
    },
    disabledNames(scope: string): string {
      return join(q((scope === '-' ? '' : scope + ' ') + '.dm-toolbar .dm-toolbar-button')
        .filter((b) => (b as HTMLButtonElement).disabled === true)
        .map((b) => attrOf(b, 'aria-label'))) || '__NONE__';
    },
    dropdownNames(scope: string): string {
      return join(q((scope === '-' ? '' : scope + ' ') + '.dm-toolbar .dm-toolbar-dropdown-trigger')
        .map((b) => String(b.getAttribute('data-dropdown') || attrOf(b, 'aria-label'))));
    },
    openDropdown(): string {
      const t = q('.dm-toolbar .dm-toolbar-dropdown-trigger').filter((b) => String(b.getAttribute('aria-expanded')) === 'true');
      return t.length ? String(t[0].getAttribute('data-dropdown') || MISS) : '__NONE__';
    },
    panelItems(): number {
      return q('.dm-toolbar-dropdown-panel [role="menuitem"]').length;
    },
    panelItemLabels(): string {
      return join(q('.dm-toolbar-dropdown-panel [role="menuitem"]').map((b) => attrOf(b, 'aria-label'))) || '__NONE__';
    },
    toolbarPresent(scope: string): boolean {
      return !!one((scope === '-' ? '' : scope + ' ') + '.dm-toolbar');
    },
  },

  // ---- manual mode: useEditorState mirrors ----
  sel: {
    isBold(): string {
      return textOf(one('[data-testid="is-bold"]')) || MISS;
    },
    isItalic(): string {
      return textOf(one('[data-testid="is-italic"]')) || MISS;
    },
    isEmpty(): string {
      return textOf(one('[data-testid="is-empty"]')) || MISS;
    },
    row(): string {
      return textOf(one('[data-testid="selector-state"]')) || MISS;
    },
  },
  out: {
    html(): string {
      return textOf(one(MAN + ' pre.output')) || '__EMPTY__';
    },
    htmlHas(substr: string): boolean {
      return textOf(one(MAN + ' pre.output')).indexOf(String(substr)) !== -1;
    },
    htmlLen(): number {
      return textOf(one(MAN + ' pre.output')).length;
    },
    styledLen(): number {
      return textOf(one(MAN + ' pre.output-styled')).length;
    },
    styledHas(substr: string): boolean {
      return textOf(one(MAN + ' pre.output-styled')).indexOf(String(substr)) !== -1;
    },
  },
  dom: {
    pmText(scope: string): string {
      return textOf(pmOf(scope)) || '__EMPTY__';
    },
    pmHas(scope: string, substr: string): boolean {
      return textOf(pmOf(scope)).indexOf(String(substr)) !== -1;
    },
    pmCount(scope: string): number {
      return q(scope + ' .ProseMirror').length;
    },
    pmHtmlHead(scope: string): string {
      const el = pmOf(scope);
      return el ? String(el.innerHTML).slice(0, 40) : MISS;
    },
    count(sel: string): number {
      return q(sel).length;
    },
    text(sel: string): string {
      return textOf(one(sel)) || MISS;
    },
    has(sel: string, substr: string): boolean {
      return textOf(one(sel)).indexOf(String(substr)) !== -1;
    },
    classes(sel: string): string {
      return classOf(one(sel)) || '__NONE__';
    },
    classOn(sel: string, cls: string): boolean {
      const el = one(sel);
      return el ? el.classList.contains(String(cls)) : false;
    },
    attr(sel: string, name: string): string {
      return attrOf(one(sel), name);
    },
    nthClasses(sel: string, i: number): string {
      const els = q(sel);
      return els[i] ? classOf(els[i]) : MISS;
    },
    nthAttr(sel: string, i: number, name: string): string {
      const els = q(sel);
      return els[i] ? attrOf(els[i], name) : MISS;
    },
    nthText(sel: string, i: number): string {
      const els = q(sel);
      return els[i] ? textOf(els[i]) : MISS;
    },
    joinText(sel: string): string {
      return join(q(sel).map((e) => textOf(e))) || '__NONE__';
    },
    exists(sel: string): boolean {
      return !!one(sel);
    },
    visible(sel: string): boolean {
      const el = one(sel);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    },
  },

  // ---- v-model mode ----
  vmodel: {
    output(): string {
      return textOf(one('[data-testid="vmodel-output"]')) || '__EMPTY__';
    },
    outputHas(substr: string): boolean {
      return textOf(one('[data-testid="vmodel-output"]')).indexOf(String(substr)) !== -1;
    },
    updateCount(): string {
      return textOf(one('[data-testid="update-count"]')) || MISS;
    },
    textarea(): string {
      const el = one('[data-testid="vmodel-textarea"]') as HTMLTextAreaElement | null;
      return el ? String(el.value) : MISS;
    },
    textareaHas(substr: string): boolean {
      const el = one('[data-testid="vmodel-textarea"]') as HTMLTextAreaElement | null;
      return el ? String(el.value).indexOf(String(substr)) !== -1 : false;
    },
    editorHas(substr: string): boolean {
      return textOf(pmOf('[data-demo="vmodel"]')).indexOf(String(substr)) !== -1;
    },
    editorText(): string {
      return textOf(pmOf('[data-demo="vmodel"]')) || '__EMPTY__';
    },
  },

  // ---- compound mode ----
  compound: {
    hasEditor(): string {
      return textOf(one('[data-testid="has-editor"]')) || MISS;
    },
    injectDisabled(): boolean {
      const b = one('[data-testid="inject-bold"]') as HTMLButtonElement | null;
      return b ? b.disabled === true : false;
    },
    toolbarButtons(): number {
      return q('[data-demo="compound"] .dm-toolbar .dm-toolbar-button').length;
    },
    editorText(): string {
      return textOf(pmOf('[data-demo="compound"]')) || '__EMPTY__';
    },
    editorHas(substr: string): boolean {
      return textOf(pmOf('[data-demo="compound"]')).indexOf(String(substr)) !== -1;
    },
    dmEditorDivs(): number {
      return q('[data-demo="compound"] .dm-editor').length;
    },
    bubblePresent(): boolean {
      return !!one('[data-demo="compound"] .dm-bubble-menu') || !!one('.dm-bubble-menu');
    },
  },

  // ---- node view mode (VueNodeViewRenderer + Callout) ----
  nodeview: {
    callouts(): number {
      return q('[data-testid="callout-wrapper"]').length;
    },
    variant(i: number): string {
      return attrOf(q('[data-testid="callout-wrapper"]')[i], 'data-variant');
    },
    classes(i: number): string {
      return classOf(q('[data-testid="callout-wrapper"]')[i]) || MISS;
    },
    hasClass(i: number, cls: string): boolean {
      const el = q('[data-testid="callout-wrapper"]')[i];
      return el ? el.classList.contains(String(cls)) : false;
    },
    icon(i: number): string {
      const el = q('[data-testid="callout-wrapper"]')[i];
      return el ? textOf(el.querySelector('[data-testid="callout-icon"]') as HTMLElement) : MISS;
    },
    injected(i: number): string {
      const el = q('[data-testid="callout-wrapper"]')[i];
      return el ? textOf(el.querySelector('[data-testid="callout-injected-editor-ok"]') as HTMLElement) : MISS;
    },
    selectValue(): string {
      const el = one('[data-testid="callout-variant-select"]') as HTMLSelectElement | null;
      return el ? String(el.value) : MISS;
    },
    text(i: number): string {
      const el = q('[data-testid="callout-wrapper"]')[i];
      return el ? textOf(el.querySelector('[data-node-view-content]') as HTMLElement) : MISS;
    },
    contentPresent(i: number): boolean {
      const el = q('[data-testid="callout-wrapper"]')[i];
      return el ? !!el.querySelector('[data-node-view-content]') : false;
    },
    wrapperAttr(i: number): string {
      return attrOf(q('[data-testid="callout-wrapper"]')[i], 'data-node-view-wrapper');
    },
  },

  // ---- multi editor mode ----
  multi: {
    panels(): number {
      return q('.multi-editor-panel').length;
    },
    titles(): string {
      return join(q('.multi-editor-panel strong').map((e) => textOf(e)));
    },
    indexes(): string {
      return join(q('.multi-editor-panel').map((e) => String(e.getAttribute('data-editor-index'))));
    },
    removeButtons(): number {
      return q('[data-testid="multi-remove-editor"]').length;
    },
    editors(): number {
      return q('.multi-editor-panel .ProseMirror').length;
    },
    globalsCount(): number {
      const w = window as unknown as Record<string, unknown>;
      return Array.isArray(w.__MULTI_EDITORS__) ? (w.__MULTI_EDITORS__ as unknown[]).length : -1;
    },
    panelHasText(i: number, substr: string): boolean {
      const p = q('.multi-editor-panel')[i];
      return p ? textOf(p).indexOf(String(substr)) !== -1 : false;
    },
  },

  // ---- bubble / floating menus ----
  menus: {
    bubbleCount(): number {
      return q('.dm-bubble-menu').length;
    },
    bubbleVisible(): boolean {
      const el = one('.dm-bubble-menu');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const st = window.getComputedStyle(el);
      return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && Number(st.opacity || '1') > 0.05;
    },
    bubbleLabels(): string {
      return join(q('.dm-bubble-menu .dm-toolbar-button').map((b) => attrOf(b, 'aria-label'))) || '__NONE__';
    },
    bubbleCount2(): number {
      return q('.dm-bubble-menu .dm-toolbar-button').length;
    },
    floatingCount(): number {
      return q('.dm-floating-menu').length;
    },
    floatingVisible(): boolean {
      const el = one('.dm-floating-menu');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    },
    floatingItems(): number {
      return q('.dm-floating-menu-item').length;
    },
    emojiHost(): number {
      return q('.dm-emoji-picker-host').length;
    },
  },

  // ---- notion mode ----
  notion: {
    pageClasses(): string {
      return classOf(one('.notion-page')) || MISS;
    },
    scrollable(): boolean {
      const el = one('.notion-page');
      return el ? el.classList.contains('notion-page--scrollable') : false;
    },
    editorClasses(): string {
      return classOf(one('.app-notion-demo .dm-editor')) || MISS;
    },
    notionModeClass(): boolean {
      const el = one('.app-notion-demo .dm-editor');
      return el ? el.classList.contains('dm-notion-mode') : false;
    },
    toasts(): number {
      return q('.notion-demo-toast').length;
    },
    toastTexts(): string {
      return join(q('.notion-demo-toast').map((e) => textOf(e))) || '__NONE__';
    },
    toastRoles(): string {
      return join(q('.notion-demo-toast').map((e) => attrOf(e, 'role'))) || '__NONE__';
    },
    outputHas(substr: string): boolean {
      return textOf(one('.app-notion-demo pre.output')).indexOf(String(substr)) !== -1;
    },
    outputLen(): number {
      return textOf(one('.app-notion-demo pre.output')).length;
    },
    placeholderCount(): number {
      return q('.app-notion-demo .dm-is-empty, .app-notion-demo [data-placeholder]').length;
    },
  },

  // ---- tab + lists mode ----
  tab: {
    panels(): number {
      return q('.tab-indent-panel').length;
    },
    editors(): number {
      return q('.tab-indent-panel .ProseMirror').length;
    },
    prevFields(): number {
      return q('[data-testid^="tab-prev-"]').length;
    },
    nextFields(): number {
      return q('[data-testid^="tab-next-"]').length;
    },
    firstListItems(): number {
      return q('.tab-indent-panel li').length;
    },
  },

  // ---- residue / isolation guards (§1.8.7) ----
  storage: {
    localKeys(): string {
      const out: string[] = [];
      try {
        for (let i = 0; i < window.localStorage.length; i += 1) out.push(String(window.localStorage.key(i)));
      } catch (e) {
        return '__ERR__';
      }
      return join(out.sort()) || '__NONE__';
    },
    sessionKeys(): string {
      const out: string[] = [];
      try {
        for (let i = 0; i < window.sessionStorage.length; i += 1) out.push(String(window.sessionStorage.key(i)));
      } catch (e) {
        return '__ERR__';
      }
      return join(out.sort()) || '__NONE__';
    },
    local(key: string): string {
      try {
        const v = window.localStorage.getItem(String(key));
        return v === null ? '__MISSING__' : String(v);
      } catch (e) {
        return '__ERR__';
      }
    },
  },
  globals: {
    rbKeys(): string {
      return join(Object.keys(window).filter((k) => k.indexOf('__rb') === 0).sort()) || '__NONE__';
    },
    demoKeys(): string {
      return join(Object.keys(window).filter((k) => k.indexOf('__DEMO') === 0 || k.indexOf('__MULTI') === 0 || k.indexOf('__DOMTERNAL') === 0).sort()) || '__NONE__';
    },
    probeOnly(): boolean {
      return Object.keys(window).filter((k) => k.indexOf('__rb') === 0).length === 1;
    },
  },
};

(window as unknown as Record<string, unknown>).__rb = rb;
