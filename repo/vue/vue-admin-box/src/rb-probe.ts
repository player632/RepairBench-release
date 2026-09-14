/*
 * rb-probe.ts - RepairBench read-only verifier bridge (INSTRUMENTATION layer).
 *
 * This file is added by environment/instrumentation.patch. It changes no
 * application logic. It does exactly two things:
 *
 *   (a) re-publishes the application's OWN singletons (the vuex store, the
 *       vue-router instance, the reactive `modules` menu array, the front-end
 *       route table, the vue-i18n instance) behind defensive SCALAR getters,
 *       so a verifier can read one number / one string / one boolean at a time
 *       instead of serialising live Vue reactive proxies; and
 *
 *   (b) provides thin drivers that call the application's own entry points
 *       (store.dispatch('user/login'), getAuthRoutes(), router.push(),
 *       store.commit(), closeCurrentTab(), createNameComponent()). A driver
 *       never reimplements a feature - it only invokes what the shipped code
 *       already exports.
 *
 * Two passive recorders are installed at import time. Neither alters behaviour:
 *
 *   - HTMLInputElement.prototype.select is wrapped so the payload that the
 *     v-copy directive puts on the clipboard can be read back. The wrapper
 *     still calls the original select() with the original receiver.
 *   - a capture-phase document click listener counts real clicks on the four
 *     zero-size switch <div>s in layout/theme1/Tabs/index.vue, because their
 *     ids are the entire API of src/utils/tab/index.ts and "the util reached
 *     its target" is otherwise indistinguishable from "the util no-oped".
 *
 * Everything is published on the single global `window.__rb`. The probe keeps
 * its own counters inside this module's closure so extraGlobals() can prove no
 * other __rb* residue was left on window.
 */
import store from '@/store'
import router, { modules } from '@/router'
import FrontRoutes from '@/router/permission/front'
import { getAuthRoutes } from '@/router/permission'
import { createNameComponent } from '@/router/createNode'
import { closeCurrentTab, closeOtherTab, closeAllTab, refreshCurrentTab } from '@/utils/tab'
import i18n from '@/locale'

/* ------------------------------------------------------------------ */
/* module-private state (never published as a global)                  */
/* ------------------------------------------------------------------ */
const counters: { [k: string]: number } = {}
let copyLog: string[] = []

/* A full page reload is part of the application's own logout flow, so the
 * verifier needs a marker that survives it. sessionStorage does. The marker is
 * armed by a driver and flipped to 'fired' by the freshly-evaluated probe of
 * the NEXT document, which is the proof that a re-boot really happened. */
try {
  if (sessionStorage.getItem('__rbBootMark') === 'armed') {
    sessionStorage.setItem('__rbBootMark', 'fired')
  }
} catch (e) { /* storage may be unavailable; every getter degrades instead of throwing */ }

/* ------------------------------------------------------------------ */
/* passive recorder 1: clipboard payload                               */
/* ------------------------------------------------------------------ */
const origSelect = HTMLInputElement.prototype.select
HTMLInputElement.prototype.select = function (this: HTMLInputElement) {
  try { copyLog.push(String(this.value)) } catch (e) { /* ignore */ }
  return origSelect.apply(this)
}

/* ------------------------------------------------------------------ */
/* passive recorder 2: hidden tab-switch clicks                        */
/* ------------------------------------------------------------------ */
document.addEventListener('click', (e: MouseEvent) => {
  try {
    const el = e.target as HTMLElement | null
    if (el && typeof el.id === 'string' && el.id.indexOf('vueAdminBoxTab') === 0) {
      counters[el.id] = (counters[el.id] || 0) + 1
    }
  } catch (err) { /* ignore */ }
}, true)

/* ------------------------------------------------------------------ */
/* small defensive helpers                                             */
/* ------------------------------------------------------------------ */
const tr = (key: string): string => {
  try { return String((i18n.global as any).t(key)) } catch (e) { return '' }
}
const q = (sel: string): HTMLElement | null => {
  try { return document.querySelector(sel) as HTMLElement | null } catch (e) { return null }
}
const qa = (sel: string): HTMLElement[] => {
  try { return Array.prototype.slice.call(document.querySelectorAll(sel)) as HTMLElement[] } catch (e) { return [] }
}
const byTestid = (id: string): HTMLElement | null => q('[data-testid="' + id + '"]')
const txt = (el: HTMLElement | null): string => (el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '')
const num = (v: any): number => { const n = Number(v); return isFinite(n) ? n : -1 }
const inputOf = (id: string): HTMLInputElement | null => {
  const host = byTestid(id)
  if (!host) return null
  if (host.tagName === 'INPUT') return host as HTMLInputElement
  return host.querySelector('input') as HTMLInputElement | null
}
const fire = (el: HTMLElement | null, type: string): boolean => {
  if (!el) return false
  try {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0 }))
    return true
  } catch (e) { return false }
}

/* dragable demo page: the two draggable rows and their current parent box */
const dragRow = (i: number): HTMLElement | null => { const rows = qa('[data-testid="rb-dg-box"] .row'); return rows[i] || null }
const dragParent = (i: number): HTMLElement | null => {
  const row = dragRow(i) as any
  if (!row) return null
  return (row.__parentDom__ as HTMLElement) || null
}
const rectOf = (el: HTMLElement | null): { x: number, y: number, w: number, h: number } => {
  if (!el) return { x: -1, y: -1, w: -1, h: -1 }
  const r = el.getBoundingClientRect()
  return { x: num(r.x), y: num(r.y), w: num(r.width), h: num(r.height) }
}

/* ------------------------------------------------------------------ */
/* the published surface                                               */
/* ------------------------------------------------------------------ */
const rb: any = {
  version(): string { return 'rb-probe/vue-admin-box/1' },

  /* ---------------- boot ---------------- */
  ready(): boolean {
    try {
      const app = q('#app')
      return !!app && app.children.length > 0 && !!router.currentRoute.value
    } catch (e) { return false }
  },
  armBootMark(): boolean { try { sessionStorage.setItem('__rbBootMark', 'armed'); return true } catch (e) { return false } },
  bootMarkFired(): boolean { try { return sessionStorage.getItem('__rbBootMark') === 'fired' } catch (e) { return false } },
  clearBootMark(): boolean { try { sessionStorage.removeItem('__rbBootMark'); return true } catch (e) { return false } },

  /* ---------------- routing / menu / i18n ---------------- */
  routePath(): string { try { return String(router.currentRoute.value.path) } catch (e) { return '' } },
  routeFullPath(): string { try { return String(router.currentRoute.value.fullPath) } catch (e) { return '' } },
  title(): string { try { return String(document.title) } catch (e) { return '' } },
  titleHasRawKey(): boolean { try { return String(document.title).indexOf('message.') !== -1 } catch (e) { return true } },
  expectedTitle(key: string): string { return tr(key) + '-' + tr('message.system.title') },
  titleMatchesRoute(): boolean {
    try {
      const m: any = router.currentRoute.value.matched
      const last = m && m.length ? m[m.length - 1] : null
      const key = last && last.meta && last.meta.title ? String(last.meta.title) : ''
      if (!key) return false
      return String(document.title) === (tr(key) + '-' + tr('message.system.title'))
    } catch (e) { return false }
  },
  t(key: string): string { return tr(key) },
  tResolves(key: string): boolean { const v = tr(key); return v.length > 0 && v.indexOf('message.') === -1 },
  modulesLen(): number { try { return num((modules as any).length) } catch (e) { return -1 } },
  frontLen(): number { try { return num((FrontRoutes as any).length) } catch (e) { return -1 } },
  /* System contributes exactly 3 entries (see src/router/modules/system.ts),
   * every one of them hideMenu, so a fully registered menu table is
   * 3 + FrontRoutes.length. Zero is a self-consistent target: it does not
   * hardcode a magic constant that a route-table edit would invalidate. */
  menuDelta(): number { try { return num((modules as any).length) - 3 - num((FrontRoutes as any).length) } catch (e) { return -99 } },
  menuRegistered(): boolean { return rb.menuDelta() === 0 && rb.modulesLen() >= 14 },
  routerRoutes(): number { try { return num(router.getRoutes().length) } catch (e) { return -1 } },
  resolveDepth(p: string): number { try { return num(router.resolve(p).matched.length) } catch (e) { return -1 } },
  resolveOk(p: string): boolean { return rb.resolveDepth(p) >= 2 },
  menuGroups(): number { const m = byTestid('rb-menu'); return m ? num(m.children.length) : -1 },
  menuGroupsOk(): boolean { return rb.menuGroups() >= 11 },
  menuTextLen(): number { return txt(byTestid('rb-menu')).length },
  menuHasGroup(key: string): boolean { return txt(byTestid('rb-menu')).indexOf(tr(key)) !== -1 && tr(key).length > 0 },
  menuLinkCount(): number { return num(qa('.layout-menu a[href^="#/"]').length) },
  hasMenuLink(p: string): boolean { return !!q('.layout-menu a[href="#' + p + '"]') },
  htmlLang(): string { try { return String(document.documentElement.getAttribute('lang') || '') } catch (e) { return '' } },

  /* ---------------- store ---------------- */
  token(): string { try { return String(store.state.user.token) } catch (e) { return '' } },
  loggedIn(): boolean { return rb.token() !== '' },
  userName(): string { try { return String((store.state.user.info as any).name || '') } catch (e) { return '' } },
  typeOfApp(key: string): string { try { return typeof (store.state.app as any)[key] } catch (e) { return 'unreachable' } },
  appIsTrue(key: string): boolean { try { return (store.state.app as any)[key] === true } catch (e) { return false } },
  appIsFalse(key: string): boolean { try { return (store.state.app as any)[key] === false } catch (e) { return false } },
  appScalarOk(key: string): boolean { const t2 = rb.typeOfApp(key); return t2 === 'boolean' || t2 === 'string' || t2 === 'number' },
  keepAliveNames(): string {
    try {
      const a: any = store.getters['keepAlive/keepAliveComponentsName']
      return Array.isArray(a) ? a.join(',') : '<not-an-array>'
    } catch (e) { return '' }
  },
  keepAliveLen(): number {
    try { const a: any = store.getters['keepAlive/keepAliveComponentsName']; return Array.isArray(a) ? num(a.length) : -1 } catch (e) { return -1 }
  },
  keepAliveIsArray(): boolean {
    try { return Array.isArray(store.getters['keepAlive/keepAliveComponentsName']) } catch (e) { return false }
  },

  /* ---------------- residue / isolation ---------------- */
  lsKeys(): string {
    try { const k: string[] = []; for (let i = 0; i < localStorage.length; i++) k.push(String(localStorage.key(i))); return k.sort().join(',') } catch (e) { return '<unreachable>' }
  },
  lsKeysAllowed(): boolean {
    const k = rb.lsKeys()
    if (k === '<unreachable>') return false
    /* the seed itself owns exactly two localStorage keys: 'vuex' written by
     * src/store/plugins/persistent.ts and 'tabs' written by
     * src/layout/theme1/Tabs/tabsHook.ts. Anything else is residue. */
    return k.split(',').filter((x: string) => x.length > 0).every((x: string) => x === 'vuex' || x === 'tabs')
  },
  lsVuexToken(): string {
    try { const o = JSON.parse(localStorage.getItem('vuex') || '{}'); return String((o && o.user && o.user.token) || '') } catch (e) { return '<unparsable>' }
  },
  hasLsVuexToken(): boolean { return rb.lsVuexToken() !== '' && rb.lsVuexToken() !== '<unparsable>' },
  ssLen(): number { try { return num(sessionStorage.length) } catch (e) { return -1 } },
  ssClean(): boolean {
    /* sessionStorage must hold nothing but the probe's own reload marker, and
     * only while a logout checkpoint is in flight. persistent.ts actively
     * removes its 'vuex' key on every mutation, so 0 or 1 is the contract. */
    const n = rb.ssLen()
    return n === 0 || (n === 1 && rb.bootMarkFired())
  },
  extraGlobals(): number {
    try { let n = 0; for (const k in window) { if (k.indexOf('__rb') === 0 && k !== '__rb') n++ } return n } catch (e) { return -1 }
  },
  urlSearch(): string { try { return String(location.search) } catch (e) { return '<unreachable>' } },
  residueClean(): boolean {
    return rb.extraGlobals() === 0 && rb.ssClean() && rb.lsKeysAllowed() && rb.urlSearch() === ''
  },

  /* ---------------- DOM scalars ---------------- */
  text(id: string): string { return txt(byTestid(id)) },
  countTestid(id: string): number { return num(qa('[data-testid="' + id + '"]').length) },
  count(sel: string): number { return num(qa(sel).length) },
  exists(id: string): boolean { return !!byTestid(id) },
  display(id: string): string { const el = byTestid(id); return el ? String(getComputedStyle(el).display) : '<absent>' },
  offsetHeight(id: string): number { const el = byTestid(id); return el ? num(el.offsetHeight) : -1 },
  offsetHeightOf(sel: string): number { const el = q(sel); return el ? num(el.offsetHeight) : -1 },
  bgIsUrl(id: string): boolean {
    const el = byTestid(id)
    if (!el) return false
    return String(getComputedStyle(el).backgroundImage || '').indexOf('url(') === 0
  },
  bgLen(id: string): number {
    const el = byTestid(id)
    return el ? num(String(getComputedStyle(el).backgroundImage || '').length) : -1
  },
  childCanvasDisplay(id: string): string {
    const host = byTestid(id)
    if (!host) return '<host-absent>'
    const c = host.querySelector('canvas')
    return c ? String(getComputedStyle(c).display) : '<canvas-absent>'
  },
  childCanvasCount(id: string): number { const host = byTestid(id); return host ? num(host.querySelectorAll('canvas').length) : -1 },
  childCanvasHeight(id: string): number {
    const host = byTestid(id)
    if (!host) return -1
    const c = host.querySelector('canvas') as HTMLElement | null
    return c ? num(c.offsetHeight) : -1
  },
  attr(id: string, name: string): string { const el = byTestid(id); return el ? String(el.getAttribute(name) || '') : '<absent>' },
  messages(): number { return num(qa('.el-message').length) },
  messageTexts(): string { return qa('.el-message').map((m) => txt(m)).join('|') },
  bodyInputCount(): number { return num(qa('body > input').length) },
  asideWidth(): string { const el = q('.el-aside'); return el ? String(getComputedStyle(el).width) : '<absent>' },
  tabsItemCount(): number { return num(qa('.tabs .tags-view-item').length) },
  logoCount(): number { return num(qa('.logo-container').length) },
  headerCount(): number { return num(qa('.el-header').length) },
  menuElExists(): boolean { return !!byTestid('rb-menu') },

  /* ---------------- probe-side recorders ---------------- */
  copyLogLen(): number { return num(copyLog.length) },
  copyLast(): string { return copyLog.length ? String(copyLog[copyLog.length - 1]) : '<none>' },
  copyReset(): boolean { copyLog = []; return true },
  tabClicks(id: string): number { return num(counters[id] || 0) },
  tabClicksTotal(): number { let n = 0; for (const k in counters) n += num(counters[k]); return n },
  countersReset(): boolean { for (const k in counters) delete counters[k]; return true },

  /* ---------------- dragable demo page scalars ---------------- */
  dragParentTag(i: number): string { const p = dragParent(num(i)); return p ? String(p.tagName).toLowerCase() : '<absent>' },
  dragParentSelOk(i: number, sel: string): boolean {
    const p = dragParent(num(i))
    if (!p) return false
    try { return !!q(sel) && q(sel) === p } catch (e) { return false }
  },
  dragParentPosition(i: number): string { const p = dragParent(num(i)); return p ? String(getComputedStyle(p).position) : '<absent>' },
  dragPosX(i: number): number { const r = dragRow(num(i)) as any; return r && r.__position__ ? num(r.__position__.x) : -1 },
  dragPosY(i: number): number { const r = dragRow(num(i)) as any; return r && r.__position__ ? num(r.__position__.y) : -1 },
  dragClampMaxX(i: number): number {
    const p = dragParent(num(i)), r = dragRow(num(i))
    if (!p || !r) return -1
    return num(rectOf(p).w - rectOf(r).w)
  },
  dragClampMaxY(i: number): number {
    const p = dragParent(num(i)), r = dragRow(num(i))
    if (!p || !r) return -1
    return num(rectOf(p).h - rectOf(r).h)
  },
  dragOverflowX(i: number): number {
    const idx = num(i)
    return num(rb.dragPosX(idx) + rectOf(dragRow(idx)).w - rectOf(dragParent(idx)).w)
  },
  dragFitsParentX(i: number): boolean {
    const idx = num(i)
    const px = rb.dragPosX(idx)
    return px >= 0 && px <= rb.dragClampMaxX(idx)
  },
  dragFitsParentY(i: number): boolean {
    const idx = num(i)
    const py = rb.dragPosY(idx)
    return py >= 0 && py <= rb.dragClampMaxY(idx)
  },
  dragRawX(i: number): number {
    /* the un-clamped value the directive computed, re-derived from the same
     * inputs so a verifier can tell "clamped correctly" from "never moved" */
    const idx = num(i)
    const p = dragParent(idx), r = dragRow(idx)
    if (!p || !r) return -1
    return num(rectOf(p).w)
  },

  /* ---------------- thin drivers over the app's own entry points ---------------- */
  async login(): Promise<boolean> {
    try {
      await store.dispatch('user/login', { name: 'admin', password: '123456' })
      await getAuthRoutes()
      return true
    } catch (e) { return false }
  },
  async push(p: string): Promise<boolean> { try { await router.push(p); return true } catch (e) { return false } },
  commit(type: string, payload?: any): boolean { try { store.commit(type, payload); return true } catch (e) { return false } },
  async dispatch(type: string, payload?: any): Promise<boolean> { try { await store.dispatch(type, payload); return true } catch (e) { return false } },
  /* loginOut ends in location.reload(); the driver deliberately does NOT await
   * it so no js_eval step is in flight when the document is torn down. */
  loginOutFire(): boolean {
    try { setTimeout(() => { try { store.dispatch('user/loginOut') } catch (e) { /* ignore */ } }, 0); return true } catch (e) { return false }
  },
  clickMenuLink(p: string): boolean {
    const a = q('.layout-menu a[href="#' + p + '"]')
    if (!a) return false
    try { (a as HTMLElement).click(); return true } catch (e) { return false }
  },
  clickTestid(id: string): boolean { const el = byTestid(id); if (!el) return false; try { el.click(); return true } catch (e) { return false } },
  clickSel(sel: string): boolean { const el = q(sel); if (!el) return false; try { el.click(); return true } catch (e) { return false } },
  fireOnTestid(id: string, type: string): boolean { return fire(byTestid(id), type) },
  fireOnSel(sel: string, type: string): boolean { return fire(q(sel), type) },
  /* dragable: mousedown on the row, then document-level mousemove/mouseup,
   * exactly the three listeners the directive registers. */
  dragRowTo(i: number, downX: number, downY: number, moveX: number, moveY: number): boolean {
    const idx = num(i)
    const row = dragRow(idx)
    if (!row) return false
    try {
      row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0, clientX: num(downX), clientY: num(downY) }))
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, button: 0, clientX: num(moveX), clientY: num(moveY) }))
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0, clientX: num(moveX), clientY: num(moveY) }))
      return true
    } catch (e) { return false }
  },
  setTestidValue(id: string, v: string): boolean {
    const el = inputOf(id)
    if (!el) return false
    try {
      el.value = String(v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    } catch (e) { return false }
  },
  /* createNameComponent is the app's own exported wrapper factory; calling it
   * with a stub module is the only way to read the name it generates without
   * waiting for a route to resolve. */
  async makeNodeName(explicit?: string): Promise<string> {
    try {
      const inner: any = explicit ? { name: String(explicit), render() { return null } } : { render() { return null } }
      const factory: any = createNameComponent(() => Promise.resolve({ default: inner }))
      const comp: any = await factory()
      return String(comp && comp.name ? comp.name : '<no-name>')
    } catch (e) { return '<err>' }
  },
  closeCurrentTab(): boolean { try { closeCurrentTab(); return true } catch (e) { return false } },
  closeOtherTab(): boolean { try { closeOtherTab(); return true } catch (e) { return false } },
  closeAllTab(): boolean { try { closeAllTab(); return true } catch (e) { return false } },
  refreshCurrentTab(): boolean { try { refreshCurrentTab(); return true } catch (e) { return false } },
}

try { (window as any).__rb = rb } catch (e) { /* ignore */ }

export default rb
