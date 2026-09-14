/**
 * rb-probe.js - RepairBench instrumentation bridge for d2-admin.
 *
 * Provides:
 *  - offline auth seeding (the router guard only checks the token cookie, so
 *    every page load re-seeds token + uuid and each checkpoint context starts
 *    authenticated without touching the login flow),
 *  - window.__D2__: live-only getters (every value is a function evaluated at
 *    read time; nothing is cached at install time),
 *  - data-testid stamping over the shell, the header action buttons (matched
 *    by their font-awesome icon class) and the sidebar toggle.
 *
 * All getters read fresh state on every call; DSL checkpoints must re-read
 * window.__D2__ on every js_eval and never cache the bridge object.
 */
import Vue from 'vue'
import store from '@/store/index'
import i18n from '@/i18n'
import util from '@/libs/util'

// offline auth seed (js-cookie based, prefixed d2admin-<version>-)
util.cookies.set('token', 'rb-token')
util.cookies.set('uuid', 'admin-uuid')

const stamp = (el, id) => {
  if (el && !el.getAttribute('data-testid')) el.setAttribute('data-testid', id)
}

const stampShell = () => {
  stamp(document.querySelector('.d2-layout-header-aside-group'), 'd2-shell')
  stamp(document.querySelector('.d2-theme-header'), 'd2-header')
  stamp(document.querySelector('.d2-theme-container-aside'), 'd2-aside')
  stamp(document.querySelector('.toggle-aside-btn'), 'd2-aside-toggle')
  stamp(document.querySelector('.d2-theme-container-main'), 'd2-main')
  stamp(document.querySelector('.d2-multiple-page-control-group'), 'd2-tabs')
  stamp(document.querySelector('.d2-header-right'), 'd2-header-right')
  document.querySelectorAll('.d2-header-right .btn-text').forEach(b => {
    const i = b.querySelector('i')
    const c = i ? i.className : ''
    if (c.includes('fa-search')) stamp(b, 'd2-search-btn')
    else if (c.includes('fa-diamond')) stamp(b, 'd2-theme-btn')
    else if (c.includes('fa-font')) stamp(b, 'd2-size-btn')
    else if (c.includes('fa-language')) stamp(b, 'd2-locales-btn')
    else if (c.includes('fa-arrows-alt') || c.includes('fa-compress')) stamp(b, 'd2-fullscreen-btn')
  })
  const headerDropdowns = document.querySelectorAll('.d2-header-right .el-dropdown')
  stamp(headerDropdowns[headerDropdowns.length - 1], 'd2-user-dd')
}

const installBridge = () => {
  window.__D2__ = {
    ready: true,
    version: () => process.env.VUE_APP_VERSION,
    route: () => location.hash.replace(/^#/, '') || '/',
    hash: () => location.hash,
    title: () => document.title,
    themeClass: () => document.body.className,
    themeActiveName: () => store.state.d2admin.theme.activeName,
    elementSize: () => (Vue.prototype.$ELEMENT ? Vue.prototype.$ELEMENT.size : undefined),
    locale: () => i18n.locale,
    searchActive: () => store.state.d2admin.search.active,
    searchPoolSize: () => store.state.d2admin.search.pool.length,
    grayActive: () => store.state.d2admin.gray.active,
    asideCollapse: () => store.state.d2admin.menu.asideCollapse,
    asideTransition: () => store.state.d2admin.menu.asideTransition,
    transitionActive: () => store.state.d2admin.transition.active,
    logLength: () => store.getters['d2admin/log/length'],
    logLengthError: () => store.getters['d2admin/log/lengthError'],
    userName: () => (store.state.d2admin.user.info || {}).name || '',
    tabsCount: () => store.state.d2admin.page.opened.length
  }
}

const boot = () => {
  installBridge()
  stampShell()
  // the shell and its header buttons mount asynchronously after the router
  // resolves; keep stamping until both the shell and the header buttons carry
  // their testids (stamping is idempotent; on header-less pages like /login
  // the timer simply runs out)
  let tries = 0
  const timer = setInterval(() => {
    stampShell()
    tries += 1
    const done = document.querySelector('[data-testid="d2-shell"]') &&
      document.querySelector('[data-testid="d2-theme-btn"]')
    if (done || tries > 300) clearInterval(timer)
  }, 100)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
