// RepairBench measurement probe. Instrumentation only - it is NOT part of the game and
// it changes no behaviour: every member below is a live getter/setter over state the
// application already owns. It exists so an offline verifier can observe the same things
// a player observes (the persisted global state, the four message bundles and the active
// locale, the pure rule helpers, and the two components that already publish a command
// API through defineExpose) without parsing the DOM and without guessing at timings.
// Discipline: nothing time-bearing (no clock reads, no random ids) and no snapshots.
import { useGlobalState } from '@/store'
import i18n from '@/i18n'
import * as utils from '@/utils'

type Any = any

const FIELDS = [
  'playerRole', 'language', 'isAiBattle', 'difficulty', 'rounds', 'gameState',
  'playerCardItems', 'computerCardItems', 'bgImage', 'isShowGameInfo',
  'gameLogItems', 'dropedCardItems',
]

const state: Any = useGlobalState()
const i18nGlobal: Any = i18n.global

// The store ref is REPLACED wholesale by initRounds(), so a snapshot would go stale
// immediately. Bind every field to the ref instead: reads and writes both stay live.
const store: Any = {}
for (const key of FIELDS) {
  Object.defineProperty(store, key, {
    enumerable: true,
    get: () => state.value[key],
    set: (value) => { state.value[key] = value },
  })
}

const appOf = (): Any => {
  const el: Any = document.querySelector('#app')
  return el ? el.__vue_app__ : null
}

//
// R37 diag_vueapp leg): `app._instance` is literally null while the mount container's
// `_vnode.component` IS the root component instance (`_container === #app`, `__vue_app__` present,
// `_instance: null`). Entering through `app._instance` alone therefore stranded the walker at the
// root, so exposedOf() returned null for every name and P15's whole command-surface arm went red on
// a tree whose defineExpose surface was in fact intact. Resolve the root through both handles,
// `app._instance` first, so neither Vue build shape can strand it.
const rootInstanceOf = (): Any => {
  const el: Any = document.querySelector('#app')
  if (!el) return null
  const app: Any = el.__vue_app__
  if (app && app._instance) return app._instance
  return (el._vnode && el._vnode.component) || null
}

// Production builds inline <script setup> into a render function, so component
// setupState is empty; defineExpose DOES survive. Walk the vnode tree by __name.
const exposedOf = (name: string): Any => {
  const root = rootInstanceOf()
  if (!root) return null
  const seen = new Set()
  const walkVNode = (vnode: Any): Any => {
    if (!vnode || typeof vnode !== 'object') return null
    if (vnode.component) {
      const hit = walkInstance(vnode.component)
      if (hit) return hit
    }
    const kids = vnode.children
    if (Array.isArray(kids)) {
      for (const kid of kids) { const hit = walkVNode(kid); if (hit) return hit }
    } else if (kids && typeof kids === 'object') {
      for (const kid of Object.keys(kids)) { const hit = walkVNode(kids[kid]); if (hit) return hit }
    }
    if (vnode.suspense) { const hit = walkVNode(vnode.suspense.activeBranch); if (hit) return hit }
    return null
  }
  const walkInstance = (inst: Any): Any => {
    if (!inst || seen.has(inst)) return null
    seen.add(inst)
    const type: Any = inst.type || {}
    if ((type.__name || type.name) === name) return inst.exposed || null
    return walkVNode(inst.subTree)
  }
  return walkInstance(root)
}

const unwrap = (maybeRef: Any) => (maybeRef && typeof maybeRef === 'object' && 'value' in maybeRef ? maybeRef.value : maybeRef)

const RB: Any = {
  version: 'ecard-probe-1',
  fields: FIELDS.slice(),
  store,
  state,
  i18n: i18nGlobal,
  t: (key: string) => i18nGlobal.t(key),
  utils: {
    getRandomNumber: utils.getRandomNumber,
    deepClone: utils.deepClone,
    getAssetsFile: utils.getAssetsFile,
    createCard: utils.createCard,
    initRoleItems: utils.initRoleItems,
    getReverseRole: utils.getReverseRole,
    initRounds: utils.initRounds,
    nextRounds: utils.nextRounds,
  },
  navCount: () => document.querySelectorAll('nav button, nav a').length,
  navNode: (index: number) => {
    const node: Any = document.querySelectorAll('nav button, nav a')[index]
    if (!node) return null
    return { tag: node.tagName, title: node.getAttribute('title'), icon: ((node.firstElementChild || {}) as Any).getAttribute ? (node.firstElementChild.getAttribute('class') || '') : '', visible: node.offsetParent !== null }
  },
  navClick: (index: number) => {
    const node: Any = document.querySelectorAll('nav button, nav a')[index]
    if (!node) return false
    node.click()
    return true
  },
  // `instance.exposed` is the RAW defineExpose object, so `show` is normally a RefImpl;
  // if a future build hands back the proxyRefs wrapper instead, `show` is already a
  // boolean. Read through unwrap() and write only when there is really a ref, so neither
  // shape can throw (a throw here would surface as a runner setup_failure).
  menuShow: () => {
    try {
      const exposed = exposedOf('GameMenu')
      return exposed ? unwrap(exposed.show) : null
    } catch (e) { return null }
  },
  setMenuShow: (value: boolean) => {
    try {
      const exposed = exposedOf('GameMenu')
      const ref: Any = exposed ? exposed.show : null
      if (ref && typeof ref === 'object' && 'value' in ref) { ref.value = value; return true }
      return false
    } catch (e) { return false }
  },
  reshow: () => {
    const exposed = exposedOf('GameMenu')
    if (exposed && typeof exposed.reshow === 'function') { exposed.reshow(); return true }
    return false
  },
  playCard: (index: number) => {
    const exposed = exposedOf('PlayerCard')
    const hand = state.value.playerCardItems || []
    const card = hand[index]
    if (exposed && typeof exposed.cardCheckClick === 'function' && card) { exposed.cardCheckClick(card); return true }
    return false
  },
}

Object.defineProperty(RB, 'locale', {
  enumerable: true,
  get: () => unwrap(i18nGlobal.locale),
  set: (value) => { if (i18nGlobal.locale && typeof i18nGlobal.locale === 'object' && 'value' in i18nGlobal.locale) i18nGlobal.locale.value = value },
})
Object.defineProperty(RB, 'msg', { enumerable: true, get: () => unwrap(i18nGlobal.messages) })
Object.defineProperty(RB, 'menu', { enumerable: true, get: () => exposedOf('GameMenu') })
Object.defineProperty(RB, 'playerCard', { enumerable: true, get: () => exposedOf('PlayerCard') })
Object.defineProperty(RB, 'mounted', { enumerable: true, get: () => !!appOf() })
Object.defineProperty(RB, 'mirror', {
  enumerable: true,
  get: () => { try { return JSON.parse(window.localStorage.getItem('global-state') || 'null') } catch (e) { return null } },
})

;(window as Any).__RB = RB

export default RB
