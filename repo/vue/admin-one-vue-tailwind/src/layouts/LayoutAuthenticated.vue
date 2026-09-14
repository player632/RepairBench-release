<script setup>
import { mdiForwardburger, mdiBackburger, mdiMenu } from '@mdi/js'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { menuAsideMain, menuAsideBottom } from '@/menuAside.js'
import menuNavBar from '@/menuNavBar.js'
import { useDarkModeStore } from '@/stores/darkMode.js'
import BaseIcon from '@/components/BaseIcon.vue'
import FormControl from '@/components/FormControl.vue'
import NavBar from '@/components/NavBar.vue'
import NavBarItemPlain from '@/components/NavBarItemPlain.vue'
import AsideMenu from '@/components/AsideMenu.vue'
import FooterBar from '@/components/FooterBar.vue'
import PremiumVersionBadge from '@/components/PremiumVersionBadge.vue'

const layoutAsidePadding = 'xl:pl-60'

const darkModeStore = useDarkModeStore()

const router = useRouter()

// INSTRUMENTATION (repair-bench, read-only): the navbar search field is the single FormControl
// in the app that opts into the ctrl+k focus hook (LayoutAuthenticated.vue is its only host),
// so focus state is exposed here as scalars. Addressed by the placeholder the app itself sets,
// not by an instrumentation-invented selector, so a renamed/removed control reads as null
// instead of silently passing. Getters only, fail-close, no listener registered here.
window.__rb = window.__rb || {}
window.__rb.search = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  const SEL = 'input[placeholder="Search (ctrl+k)"]'
  const el = () => document.querySelector(SEL)
  return {
    present: () => safe(() => !!el()),
    focused: () => safe(() => !!el() && document.activeElement === el()),
    value: () => safe(() => (el() ? String(el().value) : null)),
    activeTag: () => safe(() => (document.activeElement ? String(document.activeElement.tagName) : null)),
    activePlaceholder: () =>
      safe(() =>
        document.activeElement && document.activeElement.getAttribute
          ? String(document.activeElement.getAttribute('placeholder') || '')
          : '',
      ),
  }
})()

const isAsideMobileExpanded = ref(false)
const isAsideLgActive = ref(false)

router.beforeEach(() => {
  isAsideMobileExpanded.value = false
  isAsideLgActive.value = false
})

// INSTRUMENTATION (repair-bench, read-only): window.__rb.layout covers the theme/aside surface
// this layout owns (the dark-mode store, the two html/body class writes it performs, and the two
// aside refs the router hook resets). Getters only, fail-close, no listener, no state write.
window.__rb = window.__rb || {}
window.__rb.layout = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  return {
    hash: () => safe(() => location.hash),
    darkEnabled: () => safe(() => darkModeStore.isEnabled),
    darkInProgress: () => safe(() => darkModeStore.isInProgress),
    darkStored: () => safe(() => localStorage.getItem('darkMode')),
    htmlHasDark: () => safe(() => document.documentElement.classList.contains('dark')),
    htmlHasDarkCompat: () => safe(() => document.documentElement.classList.contains('dark-scrollbars-compat')),
    bodyHasDarkScrollbars: () => safe(() => document.body.classList.contains('dark-scrollbars')),
    asideMobileExpanded: () => safe(() => isAsideMobileExpanded.value),
    asideLgActive: () => safe(() => isAsideLgActive.value),
    asidePadding: () => safe(() => layoutAsidePadding),
  }
})()

const menuClick = (event, item) => {
  if (item.isToggleLightDark) {
    darkModeStore.set(null, false)
  }

  if (item.isLogout) {
    alert('Logout clicked')
  }
}
</script>

<template>
  <div
    data-testid="rb-layout-authenticated"
    :class="{
      'overflow-hidden lg:overflow-visible': isAsideMobileExpanded,
    }"
  >
    <div
      :class="[layoutAsidePadding, { 'ml-60 lg:ml-0': isAsideMobileExpanded }]"
      class="min-h-screen w-screen bg-gray-50 pt-14 transition-(--transition-position) lg:w-auto dark:bg-slate-800 dark:text-slate-100"
    >
      <NavBar
        :menu="menuNavBar"
        :class="[layoutAsidePadding, { 'ml-60 lg:ml-0': isAsideMobileExpanded }]"
        @menu-click="menuClick"
      >
        <NavBarItemPlain
          display="flex lg:hidden"
          @click.prevent="isAsideMobileExpanded = !isAsideMobileExpanded"
        >
          <BaseIcon :path="isAsideMobileExpanded ? mdiBackburger : mdiForwardburger" size="24" />
        </NavBarItemPlain>
        <NavBarItemPlain display="hidden lg:flex xl:hidden" @click.prevent="isAsideLgActive = true">
          <BaseIcon :path="mdiMenu" size="24" />
        </NavBarItemPlain>
        <NavBarItemPlain use-margin>
          <FormControl placeholder="Search (ctrl+k)" ctrl-k-focus transparent borderless />
        </NavBarItemPlain>
      </NavBar>
      <AsideMenu
        :is-aside-mobile-expanded="isAsideMobileExpanded"
        :is-aside-lg-active="isAsideLgActive"
        :menu="menuAsideMain"
        :menu-bottom="menuAsideBottom"
        @menu-click="menuClick"
        @aside-lg-close-click="isAsideLgActive = false"
      />
      <slot />
      <FooterBar>
        <div class="flex items-center justify-center lg:justify-start">
          <PremiumVersionBadge />
        </div>
      </FooterBar>
    </div>
  </div>
</template>
