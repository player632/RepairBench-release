<script setup>
import { mdiChevronUp, mdiChevronDown } from '@mdi/js'
import { RouterLink } from 'vue-router'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useMainStore } from '@/stores/main.js'
import BaseIcon from '@/components/BaseIcon.vue'
import UserAvatarCurrentUser from '@/components/UserAvatarCurrentUser.vue'
import NavBarMenuList from '@/components/NavBarMenuList.vue'
import BaseDivider from '@/components/BaseDivider.vue'
import { useDarkModeStore } from '@/stores/darkMode'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['menu-click'])

const is = computed(() => {
  if (props.item.href) {
    return 'a'
  }

  if (props.item.to) {
    return RouterLink
  }

  return 'div'
})

const componentClass = computed(() => {
  const base = [
    isDropdownActive.value
      ? `navbar-item-label-active dark:text-slate-400`
      : `navbar-item-label dark:text-white dark:hover:text-slate-400`,
    props.item.menu ? 'lg:py-2 lg:px-3' : 'py-2 px-3',
  ]

  if (props.item.isDesktopNoLabel) {
    base.push('lg:w-16', 'lg:justify-center')
  }

  return base
})

const itemLabel = computed(() =>
  props.item.isCurrentUser ? useMainStore().userName : props.item.label,
)

const isDropdownActive = ref(false)

const menuClick = (event) => {
  emit('menu-click', event, props.item)

  if (props.item.menu) {
    isDropdownActive.value = !isDropdownActive.value
  }
}

const menuClickDropdown = (event, item) => {
  emit('menu-click', event, item)
}

const root = ref(null)

const forceClose = (event) => {
  if (root.value && root.value.contains(event.target)) {
    isDropdownActive.value = false
  }
}

onMounted(() => {
  if (props.item.menu) {
    window.addEventListener('click', forceClose)
  }
})

onBeforeUnmount(() => {
  if (props.item.menu) {
    window.removeEventListener('click', forceClose)
  }
})

const darkModeStore = useDarkModeStore()

// INSTRUMENTATION (repair-bench, read-only): a per-item probe registry plus the data-testid slug
// used by the template below. Keyed by the item's own label, so the checkpoint vocabulary stays
// stable if a menu is reordered. The upstream menu legitimately holds two logout entries (a top
// level 'Log out' and a nested 'Log Out' inside the user dropdown) which share the slug 'log-out';
// no checkpoint reads that key - the dropdown is addressed through rb-nav-dropdown scoped inside
// rb-nav-current-user.
const rbSlug = computed(() =>
  props.item.isCurrentUser
    ? 'current-user'
    : (props.item.label || 'divider').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
)
const rbTestId = computed(() =>
  props.item.isCurrentUser
    ? 'rb-nav-current-user'
    : props.item.label
      ? 'rb-nav-' + rbSlug.value
      : 'rb-nav-divider',
)
window.__rb = window.__rb || {}
window.__rb.navItems = window.__rb.navItems || {}
window.__rb.navItems[rbSlug.value] = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  return {
    slug: () => rbSlug.value,
    testid: () => rbTestId.value,
    label: () => safe(() => itemLabel.value),
    dropdownOpen: () => safe(() => isDropdownActive.value),
    hasMenu: () => safe(() => !!props.item.menu),
    menuEntries: () => safe(() => (props.item.menu || []).length),
    href: () => safe(() => props.item.href ?? null),
    target: () => safe(() => props.item.target ?? null),
    isToggle: () => safe(() => !!props.item.isToggleLightDark),
    isLogout: () => safe(() => !!props.item.isLogout),
    isDivider: () => safe(() => !!props.item.isDivider),
    isCurrentUser: () => safe(() => !!props.item.isCurrentUser),
    tag: () => safe(() => (props.item.href ? 'a' : props.item.to ? 'routerlink' : 'div')),
  }
})()
</script>

<template>
  <BaseDivider v-if="item.isDivider" nav-bar />
  <component
    :is="is"
    v-else
    ref="root"
    :data-testid="rbTestId"
    class="relative block cursor-pointer items-center lg:flex"
    :class="componentClass"
    :to="item.to ?? null"
    :href="item.href ?? null"
    :target="item.target ?? null"
    @click="menuClick"
  >
    <div
      class="flex items-center"
      :class="{
        'bg-gray-100 p-3 lg:bg-transparent lg:p-0 dark:bg-slate-800 lg:dark:bg-transparent':
          item.menu,
      }"
    >
      <UserAvatarCurrentUser v-if="item.isCurrentUser" class="mr-3 inline-flex h-6 w-6" />
      <BaseIcon
        v-if="item.icon"
        :path="item.icon"
        :class="{ 'transition-colors': !darkModeStore.isInProgress }"
      />
      <span
        class="px-2"
        :class="{
          'lg:hidden': item.isDesktopNoLabel && item.icon,
          'transition-colors': !darkModeStore.isInProgress,
        }"
        >{{ itemLabel }}</span
      >
      <BaseIcon
        v-if="item.menu"
        :path="isDropdownActive ? mdiChevronUp : mdiChevronDown"
        :class="{ 'transition-colors': !darkModeStore.isInProgress }"
        class="hidden lg:inline-flex"
      />
    </div>
    <div
      v-if="item.menu"
      data-testid="rb-nav-dropdown"
      class="border-b border-gray-100 text-sm lg:absolute lg:top-full lg:left-0 lg:z-20 lg:min-w-full lg:rounded-lg lg:border lg:bg-white lg:shadow-lg dark:border-slate-700 lg:dark:bg-slate-800"
      :class="{ 'lg:hidden': !isDropdownActive }"
    >
      <NavBarMenuList :menu="item.menu" @menu-click="menuClickDropdown" />
    </div>
  </component>
</template>
