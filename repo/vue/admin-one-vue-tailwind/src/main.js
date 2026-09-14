import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useMainStore } from '@/stores/main.js'
// INSTRUMENTATION (repair-bench): read-only probe import. window.__rb.boot READS the dark-mode
// store; it never initialises it. The commented-out darkModeStore.init() further down stays
// commented - restoring persisted dark mode on boot would be an application-behaviour change.
import { useDarkModeStore } from '@/stores/darkMode'

import './css/main.css'

// Init Pinia
const pinia = createPinia()

// Create Vue app
createApp(App).use(router).use(pinia).mount('#app')

// Init main store
const mainStore = useMainStore(pinia)

// INSTRUMENTATION (repair-bench, read-only probe bridge). Publishes window.__rb.boot ONCE, after
// the app has mounted and before the sample-data fetches. Getters only: nothing here writes
// application state, adds a listener or changes a render path, and every getter is fail-close
// (try/catch -> null) so an unrendered page reads as 'not ready' rather than throwing inside a
// checkpoint. Component-level areas (__rb.layout / __rb.table / __rb.chart / __rb.navItems / ...)
// are published by the components themselves.
window.__rb = window.__rb || {}
window.__rb.boot = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  const dark = () => safe(() => useDarkModeStore(pinia))
  const styleTokens = () =>
    Array.prototype.filter
      .call(document.documentElement.classList, (t) => t.indexOf('style') === 0)
      .join(',')
  return {
    published: true,
    hash: () => safe(() => location.hash),
    path: () => safe(() => location.pathname),
    title: () => safe(() => document.title),
    appMounted: () =>
      safe(() => !!document.querySelector('#app') && document.querySelector('#app').childElementCount > 0),
    userName: () => safe(() => mainStore.userName),
    userEmail: () => safe(() => mainStore.userEmail),
    userAvatar: () => safe(() => mainStore.userAvatar),
    clientsCount: () => safe(() => mainStore.clients.length),
    historyCount: () => safe(() => mainStore.history.length),
    clientName: (i) => safe(() => mainStore.clients[i].name),
    clientLogin: (i) => safe(() => mainStore.clients[i].login),
    clientProgress: (i) => safe(() => mainStore.clients[i].progress),
    historyType: (i) => safe(() => mainStore.history[i].type),
    historyAccount: (i) => safe(() => mainStore.history[i].account),
    fieldFocusRegistered: () => safe(() => mainStore.isFieldFocusRegistered),
    darkEnabled: () => safe(() => dark().isEnabled),
    darkInProgress: () => safe(() => dark().isInProgress),
    darkStored: () => safe(() => localStorage.getItem('darkMode')),
    htmlClass: () => safe(() => document.documentElement.className),
    bodyClass: () => safe(() => document.body.className),
    htmlStyleTokens: () => safe(styleTokens),
    lsKeys: () => safe(() => Object.keys(localStorage).sort().join(',')),
    ssKeys: () => safe(() => Object.keys(sessionStorage).sort().join(',')),
    cookie: () => safe(() => document.cookie),
    dunderKeys: () => safe(() => Object.keys(window).filter((k) => k.indexOf('__') === 0).sort().join(',')),
    externalResources: () =>
      safe(() =>
        performance
          .getEntriesByType('resource')
          .filter((r) => String(r.name).indexOf(location.origin) !== 0)
          .map((r) => String(r.name))
          .join('|'),
      ),
    resourceCount: () => safe(() => performance.getEntriesByType('resource').length),
    imageCount: () => safe(() => document.images.length),
    imagesLoaded: () =>
      safe(() => Array.prototype.filter.call(document.images, (im) => im.complete && im.naturalWidth > 0).length),
    rbAreas: () => safe(() => Object.keys(window.__rb).sort().join(',')),
  }
})()

// Fetch sample data
mainStore.fetchSampleClients()
mainStore.fetchSampleHistory()

// Dark mode
// Uncomment, if you'd like to restore persisted darkMode setting, or use `prefers-color-scheme: dark`.
// import { useDarkModeStore } from '@/stores/darkMode'

// const darkModeStore = useDarkModeStore(pinia)
// darkModeStore.init()

// Default title tag
const defaultDocumentTitle = 'Admin One Vue 3 Tailwind'

// Set document title from route meta
router.afterEach((to) => {
  document.title = to.meta?.title
    ? `${to.meta.title} — ${defaultDocumentTitle}`
    : defaultDocumentTitle
})
