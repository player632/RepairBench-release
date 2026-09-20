/**
 * Repair-Bench read-only observation probe for repair-vue__vite-vue3-lowcode-01.
 *
 * Installed by environment/instrumentation.patch, which also adds
 * `import './rbProbe';` to src/main.ts, so this module is evaluated before the
 * application creates or mounts anything (src/main.ts:31 mounts inside
 * router.isReady().then(...)).
 *
 * NEUTRALITY CONTRACT (this file is deliberately NOT part of the tested surface):
 *  - It renders nothing, creates no element, and adds no attribute, class or
 *    data-testid to the document. Every reader below is a pure DOM / computed
 *    style READ; nothing here writes to the DOM.
 *  - It never writes application state: no Vue reactive write, no provide /
 *    inject, no router call, no sessionStorage or localStorage write, no
 *    observable timer, and no application prototype is patched. The only
 *    listeners registered are capture-phase recorders for uncaught errors; they
 *    never call preventDefault() or stopPropagation(), so what the application
 *    observes is byte-for-byte what it would observe without this file.
 *  - console.* is deliberately NOT observed: vite.config.ts:113-119 sets
 *    minify 'terser' with compress.drop_console, so console calls do not exist
 *    in the graded artifact and a defect that only provokes a console warning
 *    therefore cannot move any probe reading.
 *  - Every published value is a STRING scalar recomputed on read, because
 *    evaluation/dsl_runner.mjs compares an expectation against the value
 *    returned by page.evaluate() with a loose equality; an object or array
 *    expectation reads as always-false there. Structured readings are therefore
 *    published as JSON strings.
 *  - The getters are defined with enumerable: false, so they never show up in
 *    Object.keys(window) and cannot be picked up by application code that
 *    enumerates the global object.
 *  - window.__rbKeys and window.__rbDump are the SELF-CHECK face: they let a
 *    checkpoint prove on the running page that this probe really survived
 *    tree-shaking and minification, instead of trusting the build log. terser is
 *    configured with compress only (no mangle.properties), so these property
 *    names are preserved verbatim in dist.
 */

const RB_PROBE_VERSION = '1';
const BLOCK_PREFIX = 'rb-block-';
const SLOT_PREFIX = 'rb-slotblock-';
const LEFTTAB_PREFIX = 'rb-lefttab-';
const PAGENODE_PREFIX = 'rb-pagenode-';
const TOOL_PREFIX = 'rb-tool-';

type RbReader = () => string;

const q = (sel: string): Element | null => document.querySelector(sel);

const qa = (sel: string): Element[] => Array.prototype.slice.call(document.querySelectorAll(sel));

const norm = (value: string | null | undefined): string =>
  (value || '').trim().replace(/\s+/g, ' ');

const texts = (sel: string): string => JSON.stringify(qa(sel).map((el) => norm(el.textContent)));

const attrs = (sel: string, name: string): string =>
  JSON.stringify(qa(sel).map((el) => String(el.getAttribute(name))));

const stripPrefix = (sel: string, prefix: string): string =>
  JSON.stringify(qa(sel).map((el) => String(el.getAttribute('data-testid')).slice(prefix.length)));

// Computed style readings are normalised so a checkpoint expectation can never
// depend on the port the graded face happens to be served from.
const stripOrigin = (value: string): string => value.split(location.origin).join('');

const formItemValue = (label: string): string => {
  const items = qa('.el-form-item');
  for (let i = 0; i < items.length; i += 1) {
    const lab = items[i].querySelector('.el-form-item__label');
    if (lab && norm(lab.textContent) === label) {
      return norm(items[i].querySelector('.el-form-item__content')?.textContent);
    }
  }
  return '';
};

let uncaughtErrors = 0;
let resourceErrors = 0;

window.addEventListener(
  'error',
  (ev) => {
    const target = (ev as ErrorEvent).target as EventTarget | null;
    if (target && target !== window) {
      resourceErrors += 1;
    } else {
      uncaughtErrors += 1;
    }
  },
  true,
);

window.addEventListener('unhandledrejection', () => {
  uncaughtErrors += 1;
});

const readers: Record<string, RbReader> = {
  __rbVersion: () => RB_PROBE_VERSION,
  __rbKeys: () => Object.keys(readers).sort().join(','),
  __rbDump: () =>
    JSON.stringify(
      Object.keys(readers)
        .sort()
        .reduce((acc, key) => {
          acc[key] = key === '__rbDump' ? 'OMITTED' : safeRead(readers[key]);
          return acc;
        }, {} as Record<string, string>),
    ),
  __rbUncaughtErrors: () => String(uncaughtErrors),
  __rbResourceErrors: () => String(resourceErrors),
  __rbTitle: () => document.title,
  __rbHash: () => location.hash,
  __rbMounted: () => {
    const app = q('#app');
    return app && app.children.length > 0 ? '1' : '0';
  },
  __rbToolCount: () => String(qa('.el-header .tool-item').length),
  __rbToolTitles: () => texts('.el-header .tool-item .title'),
  __rbToolIds: () => stripPrefix(`[data-testid^="${TOOL_PREFIX}"]`, TOOL_PREFIX),
  __rbLeftTabs: () => texts('.left-aside .el-tabs__item'),
  __rbLeftTabIds: () => stripPrefix(`[data-testid^="${LEFTTAB_PREFIX}"]`, LEFTTAB_PREFIX),
  __rbActiveLeftTab: () => norm(q('.left-aside .el-tabs__item.is-active')?.textContent),
  __rbRightTabs: () => texts('.el-main .el-tabs__item'),
  __rbActiveRightTab: () => norm(q('.el-main .el-tabs__item.is-active')?.textContent),
  __rbAttrLabels: () => texts('.el-main .el-form-item__label'),
  __rbAttrIdText: () => formItemValue('组件ID'),
  __rbBlockCount: () => String(qa(`[data-testid^="${BLOCK_PREFIX}"]`).length),
  __rbBlockVids: () => stripPrefix(`[data-testid^="${BLOCK_PREFIX}"]`, BLOCK_PREFIX),
  __rbBlockLabels: () => attrs(`[data-testid^="${BLOCK_PREFIX}"]`, 'data-label'),
  __rbBlockTexts: () =>
    JSON.stringify(qa(`[data-testid^="${BLOCK_PREFIX}"]`).map((el) => norm(el.textContent))),
  __rbSlotBlockCount: () => String(qa(`[data-testid^="${SLOT_PREFIX}"]`).length),
  __rbSlotBlockVids: () => stripPrefix(`[data-testid^="${SLOT_PREFIX}"]`, SLOT_PREFIX),
  __rbFocusChain: () =>
    JSON.stringify(
      qa(`[data-testid^="${BLOCK_PREFIX}"],[data-testid^="${SLOT_PREFIX}"]`)
        .filter((el) => el.classList.contains('focus') || el.classList.contains('focusWithChild'))
        .map((el) => {
          const f = el.classList.contains('focus') ? 'f' : '';
          const w = el.classList.contains('focusWithChild') ? 'w' : '';
          return `${el.getAttribute('data-testid')}:${f}${w}`;
        }),
    ),
  __rbFocusJustify: () => {
    const focused = q(`[data-testid^="${BLOCK_PREFIX}"].focus`);
    if (!focused) {
      return '';
    }
    const nodes: Element[] = [focused].concat(qa(`[data-testid^="${BLOCK_PREFIX}"].focus *`));
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i] as HTMLElement;
      if (!el.getAttribute('style')) {
        continue;
      }
      if (window.getComputedStyle(el).display === 'flex') {
        return window.getComputedStyle(el).justifyContent;
      }
    }
    return '';
  },
  __rbCanvasBgColor: () => {
    const el = q('.simulator-editor-content') as HTMLElement | null;
    return el ? window.getComputedStyle(el).backgroundColor : '';
  },
  __rbCanvasBgImage: () => {
    const el = q('.simulator-editor-content') as HTMLElement | null;
    return el ? stripOrigin(window.getComputedStyle(el).backgroundImage) : '';
  },
  __rbPageNodeCount: () => String(qa('.custom-tree-node').length),
  __rbPageNodeLabels: () => texts('.custom-tree-node'),
  __rbPageNodeIds: () => stripPrefix(`[data-testid^="${PAGENODE_PREFIX}"]`, PAGENODE_PREFIX),
  __rbModelCount: () => String(qa('.model-item-title').length),
  __rbModelTitles: () => texts('.model-item-title .truncate'),
  __rbWidgetCount: () => String(qa('.el-aside [data-label]').length),
  __rbWidgetLabels: () => attrs('.el-aside [data-label]', 'data-label'),
  __rbBrokenImages: () =>
    String(
      Array.prototype.filter.call(
        document.images,
        (img: HTMLImageElement) => img.complete && img.naturalWidth === 0,
      ).length,
    ),
  __rbDialogTitles: () => texts('.el-dialog__title'),
  __rbMessageTexts: () => texts('.el-message__content'),
  __rbDropdownShown: () => (q('.dropdown-service-show') ? '1' : '0'),
  __rbDropdownLabels: () => texts('.dropdown-option'),
};

function safeRead(fn: RbReader): string {
  try {
    const value = fn();
    return typeof value === 'string' ? value : String(value);
  } catch (err) {
    const e = err as Error;
    return `__rb_reader_error:${e && e.message ? e.message : String(err)}`;
  }
}

Object.keys(readers).forEach((key) => {
  Object.defineProperty(window, key, {
    configurable: true,
    enumerable: false,
    get: () => safeRead(readers[key]),
  });
});

export {};
