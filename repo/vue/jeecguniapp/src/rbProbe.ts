/* repair-bench instrumentation probe: read-only observation surface for the verifier.
 *
 * Installs `window.__rb` with pure DOM / localStorage / stub-log readers. It mutates no
 * application state, registers no listener, dispatches no event and renders nothing, so app
 * behaviour is byte-for-byte identical with or without this file. Every helper returns a SCALAR
 * (string / number / boolean) because the official dsl_runner js_eval assertions compare scalars.
 *
 * Why a probe at all: uni-app H5 compiles components to CLASS-bearing custom elements
 * (<uni-view>, <uni-text>, <uni-page>) rather than to semantic tags, and wot-design-uni /
 * z-paging / da-tree put the interesting state in modifier classes (.da-tree-checkbox-checked,
 * .wd-index-anchor, .uni-list-chat__content-note). Reading those through named getters keeps the
 * checkpoints free of raw locators, so no checkpoint can die as `setup_failure` before reaching
 * its own assertion.
 */

interface RbApiRecord {
  method: string
  url: string
  path: string
  search: string
  body: string | null
  headers: Record<string, string>
  fixture: string | null
}

declare global {
  interface Window {
    __rbApiLog?: RbApiRecord[]
    __rbStubInstalled?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __rb?: any
  }
}

const norm = (s: string | null | undefined): string => (s || '').replace(/\s+/g, ' ').trim()
const q = (sel: string): HTMLElement | null => document.querySelector(sel)
const qa = (sel: string): HTMLElement[] => Array.from(document.querySelectorAll(sel))
const texts = (sel: string): string[] => qa(sel).map((e) => norm(e.textContent))
const join = (a: string[]): string => a.join('|')
const log = (): RbApiRecord[] => window.__rbApiLog || []

/* one logical page section of pages/index/index.vue: .serveBox[0] = 常用服务, [1] = 其他服务 */
const gridLabels = (i: number): string[] => {
  const boxes = qa('.serveBox')
  const box = boxes[i]
  if (!box) return []
  return Array.from(box.querySelectorAll('.wd-grid-item')).map((e) => norm(e.textContent))
}

/* the four da-tree instances on pages/demo/tree.vue, in document order */
const treeRoots = (): HTMLElement[] => qa('.da-tree')
const chatRows = (): HTMLElement[] => qa('.uni-list-chat')
const rowPart = (row: HTMLElement, part: string): string => {
  const el = row.querySelector('.uni-list-chat__content-' + part)
  return el ? norm(el.textContent) : ''
}
/* uni-list renders the right-hand time inside the extra slot, not a __content-time node */
const rowTime = (row: HTMLElement): string => {
  const el = row.querySelector('.uni-list-chat__content-extra-text')
  return el ? norm(el.textContent) : ''
}

const storedUser = (): Record<string, unknown> | null => {
  try {
    const raw = window.localStorage.getItem('user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch (e) {
    return null
  }
}
const storedUserInfo = (): Record<string, unknown> => {
  const u = storedUser()
  const info = u && (u as Record<string, unknown>).userInfo
  return info && typeof info === 'object' ? (info as Record<string, unknown>) : {}
}
const apiMatch = (pathSub: string): RbApiRecord | null => {
  const hits = log().filter((r) => String(r.path || '').indexOf(pathSub) >= 0)
  return hits.length ? hits[hits.length - 1] : null
}
const visibleToast = (): string => {
  const t = qa('.wd-toast, .wd-toast__msg, .uni-toast, .uni-sample-toast')
    .map((e) => norm(e.textContent))
    .filter((s) => s.length > 0)
  return t.length ? t[t.length - 1] : ''
}

const rb = {
  /* ---- harness / boot ---- */
  version: (): string => 'rbProbe-jeecguniapp-1',
  stubInstalled: (): boolean => window.__rbStubInstalled === true,
  page: (): string => (q('uni-page') ? q('uni-page')!.getAttribute('data-page') || '' : ''),
  hash: (): string => window.location.hash || '',
  ready: (): boolean => !!q('uni-page') && qa('uni-view').length > 20,
  bodyText: (): string => norm(document.body ? document.body.textContent : ''),
  bodyTextLen: (): number => norm(document.body ? document.body.textContent : '').length,
  bodyHasText: (t: string): boolean => norm(document.body ? document.body.textContent : '').indexOf(t) >= 0,
  navTitle: (): string => {
    const el = q('.wd-navbar__title, .navbar-title, .uni-page-head__title, .u-navbar-title')
    return el ? norm(el.textContent) : ''
  },
  viewCount: (): number => qa('uni-view').length,
  pageErrorCount: (): number => log().length,

  /* ---- pages/message/message.vue : tab shell ---- */
  tabLabels: (): string => join(texts('.wd-tabs__nav-item')),
  tabCount: (): number => qa('.wd-tabs__nav-item').length,
  tabActiveText: (): string => {
    const a = q('.wd-tabs__nav-item.is-active')
    return a ? norm(a.textContent) : ''
  },
  chatListMounted: (): boolean => chatRows().length > 0,
  addressBookMounted: (): boolean => qa('.uni-list-chat').length === 0 && texts('.content').length > 0,

  /* ---- pages/message/components/chatList.vue ---- */
  chatRowCount: (): number => chatRows().length,
  chatTitles: (): string => join(chatRows().map((r) => rowPart(r, 'title'))),
  chatNotes: (): string => join(chatRows().map((r) => rowPart(r, 'note'))),
  chatTimes: (): string => join(chatRows().map((r) => rowTime(r))),
  chatFirstTitle: (): string => (chatRows().length ? rowPart(chatRows()[0], 'title') : ''),
  chatFirstRow: (): string =>
    chatRows().length
      ? [rowPart(chatRows()[0], 'title'), rowPart(chatRows()[0], 'note'), rowTime(chatRows()[0])].join('|')
      : '',
  chatTitleOfNote: (note: string): string => {
    const hit = chatRows().filter((r) => rowPart(r, 'note') === note)
    return hit.length ? rowPart(hit[0], 'title') : ''
  },
  chatNoteOfTitle: (title: string): string => {
    const hit = chatRows().filter((r) => rowPart(r, 'title') === title)
    return hit.length ? rowPart(hit[0], 'note') : ''
  },
  chatTimeHasYear: (): boolean =>
    chatRows().some((r) => /(^|[^0-9])(19|20)[0-9]{2}([^0-9]|$)/.test(rowTime(r))),

  /* ---- pages/message/components/addressBookList.vue ---- */
  addressBookLabels: (): string => join(texts('.list .content')),
  addressBookCount: (): number => qa('.list .content').length,
  addressBookFirst: (): string => {
    const t = texts('.list .content')
    return t.length ? t[0] : ''
  },

  /* ---- pages/index/index.vue : service grids ---- */
  sectionTitles: (): string => join(qa('.serveBox .title').map((e) => norm(e.textContent))),
  sectionCount: (): number => qa('.serveBox').length,
  commonGridLabels: (): string => join(gridLabels(0)),
  otherGridLabels: (): string => join(gridLabels(1)),
  commonGridCount: (): number => gridLabels(0).length,
  otherGridCount: (): number => gridLabels(1).length,
  gridsIdentical: (): boolean => join(gridLabels(0)) === join(gridLabels(1)) && gridLabels(0).length > 0,
  gridLabelIndex: (label: string): number => {
    const all = gridLabels(0).concat(gridLabels(1))
    return all.indexOf(label)
  },
  tabbarLabels: (): string => join(texts('.uni-tabbar__label')),
  tabbarCount: (): number => qa('.uni-tabbar__item').length,

  /* ---- pages/demo/indexBar.vue ---- */
  indexAnchorLabels: (): string => join(texts('.wd-index-anchor')),
  indexAnchorCount: (): number => qa('.wd-index-anchor').length,
  indexCellCount: (): number => qa('.wd-cell').length,
  indexBarPresent: (): boolean => qa('.wd-index-bar').length > 0,
  indexFirstCells: (): string => join(texts('.wd-cell').slice(0, 6)),
  searchInputPresent: (): boolean => !!q('.wd-search input'),
  searchCoverPresent: (): boolean => !!q('.wd-search__cover'),

  /* ---- pages/demo/tree.vue ---- */
  treeNodeCount: (i: number): number => {
    const t = treeRoots()[i]
    return t ? t.querySelectorAll('.da-tree-item').length : -1
  },
  treeCheckedCount: (i: number): number => {
    const t = treeRoots()[i]
    return t ? t.querySelectorAll('.da-tree-checkbox-checked').length : -1
  },
  treeIndeterminateCount: (i: number): number => {
    const t = treeRoots()[i]
    return t ? t.querySelectorAll('.da-tree-checkbox-indeterminate').length : -1
  },
  treeCount: (): number => treeRoots().length,
  treeButtonLabels: (): string => join(texts('.btnArea .wd-button')),
  treeButtonCount: (): number => qa('.btnArea .wd-button').length,
  treeFirstLabels: (i: number): string => {
    const t = treeRoots()[i]
    if (!t) return ''
    return join(Array.from(t.querySelectorAll('.da-tree-item__label')).slice(0, 4).map((e) => norm(e.textContent)))
  },

  /* ---- pages/demo/form.vue ---- */
  /* wot-design-uni puts each field's message in .wd-<comp>__error-message */
  formErrorMessages: (): string => join(texts('[class*=__error-message]')),
  formErrorCount: (): number => texts('[class*=__error-message]').filter((t) => t.length > 0).length,
  formHasErrorText: (t: string): boolean => texts('[class*=__error-message]').some((s) => s.indexOf(t) >= 0),
  formFieldLabels: (): string => join(texts('.wd-input__label-inner, .wd-cell__title')),
  formToast: (): string => visibleToast(),

  /* ---- pages/demo/selectPicker.vue ---- */
  pickerCells: (): string => join(texts('.wd-cell__title')),
  pickerCellCount: (): number => qa('.wd-cell').length,

  /* ---- pages/user/people.vue ---- */
  peopleRealname: (): string => {
    const info = storedUserInfo()
    return String(info.realname || '')
  },
  peopleMenuLabels: (): string => join(texts('.wd-cell__title')),

  /* ---- pages/workHome + pages-work/dragPage (the two decoys) ---- */
  dragTipText: (): string => join(texts('.wd-status-tip').filter((s) => s.length > 0)),
  dragEmptyState: (): boolean => texts('.wd-status-tip').some((s) => s.indexOf('暂无内容') >= 0),
  workHomeLabels: (): string => join(texts('.wd-cell__title, .wd-tab__nav-item, .nav-item')),

  /* ---- store + persisted state (the app's own persistence channel) ---- */
  userToken: (): string => String(storedUserInfo().token || ''),
  userTokenEmpty: (): boolean => String(storedUserInfo().token || '') === '',
  userName: (): string => String(storedUserInfo().username || ''),
  userRealname: (): string => String(storedUserInfo().realname || ''),
  userTenantId: (): string => String((storedUserInfo().tenantId as string | number | undefined) ?? ''),
  userHasStoredState: (): boolean => storedUser() !== null,

  /* ---- outgoing request shape, read from the adapter's own log ---- */
  apiCount: (): number => log().length,
  apiKeys: (): string => join(log().map((r) => r.method + ' ' + r.path)),
  apiPathOf: (sub: string): string => {
    const r = apiMatch(sub)
    return r ? r.path : ''
  },
  apiSearchOf: (sub: string): string => {
    const r = apiMatch(sub)
    return r ? r.search : ''
  },
  apiPathHasAmpQuery: (sub: string): boolean => {
    const r = apiMatch(sub)
    return !!r && String(r.path).indexOf('&') >= 0
  },
  apiHeaderOf: (sub: string, header: string): string => {
    const r = apiMatch(sub)
    if (!r) return ''
    const keys = Object.keys(r.headers || {})
    for (let i = 0; i < keys.length; i++) if (keys[i].toLowerCase() === header.toLowerCase()) return r.headers[keys[i]]
    return ''
  },
  apiFixtureOf: (sub: string): string => {
    const r = apiMatch(sub)
    return r ? String(r.fixture || '') : ''
  },
}

// SSR guard: uni builds the H5 bundle with createSSRApp, so never touch a host global at import
// time unless one actually exists. In the browser (the only measured surface) this always runs.
if (typeof window !== 'undefined') {
  window.__rb = rb
}

export default rb
