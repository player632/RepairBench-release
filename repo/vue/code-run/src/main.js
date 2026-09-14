import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { atou } from '@/utils'
import EventEmitter from 'eventemitter3'
import './assets/style/monolisa.css'
import 'element-plus/dist/index.css'
import { ElLoadingDirective } from 'element-plus'
import 'nprogress/nprogress.css'
import './assets/iconfont/iconfont.css'

const create = () => {
  const app = createApp(App)
  app.config.globalProperties.$eventEmitter = new EventEmitter()
  app.use(router)
  app.use(store)
  app.directive('loading', ElLoadingDirective)
  app.mount('#app')
}

// [repair-bench instrumentation] read-only probe bridge for checkpoint assertions
// Fresh-read contract: every getter reads the live store/DOM at call time.
const installProbeBridge = () => {
  window.__CODERUN__ = {
    version: 1,
    title: () => store.state.editData.title,
    layout: () => store.state.editData.config.layout,
    autoRun: () => !!store.state.editData.config.autoRun,
    keepPreviousLogs: () => !!store.state.editData.config.keepPreviousLogs,
    openAlmightyConsole: () => !!store.state.editData.config.openAlmightyConsole,
    codeTheme: () => store.state.editData.config.codeTheme,
    codeFontSize: () => store.state.editData.config.codeFontSize,
    pageThemeSync: () => !!store.state.editData.config.pageThemeSyncCodeTheme,
    code: t => (store.state.editData.code[t] ? store.state.editData.code[t].content : null),
    language: t => (store.state.editData.code[t] ? store.state.editData.code[t].language : null),
    resourceCount: t => (store.state.editData.code[t] && store.state.editData.code[t].resources ? store.state.editData.code[t].resources.length : 0),
    resourceUrl: (t, i) => { try { return store.state.editData.code[t].resources[i].url } catch (e) { return null } },
    previewDoc: () => store.state.previewDoc || '',
    urlDataTitle: () => {
      try {
        const m = location.hash.match(/[?&]data=([^&]+)/)
        if (!m) return null
        return JSON.parse(atou(decodeURIComponent(m[1]))).title
      } catch (e) {
        return '__decode_error__'
      }
    },
    editors: {},
    editorCount: () => Object.keys(window.__CODERUN__.editors).length,
    editorValue: t => {
      const e = window.__CODERUN__.editors[t]
      if (!e || typeof e.getValue !== 'function') return null
      return e.getValue()
    },
    appendCode: (t, text) => {
      const e = window.__CODERUN__.editors[t]
      if (!e || typeof e.trigger !== 'function') return false
      try {
        for (const ch of String(text)) {
          e.trigger('cr-bridge', 'type', { text: ch })
        }
        return true
      } catch (err) {
        return false
      }
    },
    setCode: (t, text) => {
      const e = window.__CODERUN__.editors[t]
      if (!e || typeof e.setValue !== 'function') return false
      try {
        e.setValue(String(text))
        return true
      } catch (err) {
        return false
      }
    }
  }
}

const init = () => {
  store.dispatch('getGithubToken')
  installProbeBridge()
  create()
}
init()
