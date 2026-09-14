<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { mdiMinus, mdiPlus } from '@mdi/js'
import { getButtonColor } from '@/colors.js'
import BaseIcon from '@/components/BaseIcon.vue'
import AsideMenuList from '@/components/AsideMenuList.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isDropdownList: Boolean,
})

const emit = defineEmits(['menu-click'])

const hasColor = computed(() => props.item && props.item.color)

const asideMenuItemActiveStyle = computed(() =>
  hasColor.value ? '' : 'aside-menu-item-active font-bold',
)

const isDropdownActive = ref(false)

const componentClass = computed(() => [
  props.isDropdownList ? 'py-3 px-6 text-sm' : 'py-3',
  hasColor.value
    ? getButtonColor(props.item.color, false, true)
    : `aside-menu-item dark:text-slate-300 dark:hover:text-white`,
])

const hasDropdown = computed(() => !!props.item.menu)

// INSTRUMENTATION (repair-bench, read-only): data-testid slug + a per-item probe entry so the
// aside dropdown state and the colour-driven class list are assertable without pixel checks.
const rbSlug = computed(() => (props.item.label || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-'))
const rbTestId = computed(() => 'rb-aside-' + rbSlug.value)
window.__rb = window.__rb || {}
window.__rb.asideItems = window.__rb.asideItems || {}
window.__rb.asideItems[rbSlug.value] = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  return {
    slug: () => rbSlug.value,
    label: () => safe(() => props.item.label ?? null),
    to: () => safe(() => props.item.to ?? null),
    href: () => safe(() => props.item.href ?? null),
    hasColor: () => safe(() => !!hasColor.value),
    hasDropdown: () => safe(() => !!hasDropdown.value),
    dropdownOpen: () => safe(() => isDropdownActive.value),
    classText: () => safe(() => (Array.isArray(componentClass.value) ? componentClass.value.flat().join(' ') : String(componentClass.value))),
  }
})()

const menuClick = (event) => {
  emit('menu-click', event, props.item)

  if (hasDropdown.value) {
    isDropdownActive.value = !isDropdownActive.value
  }
}
</script>

<template>
  <li>
    <component
      :is="item.to ? RouterLink : 'a'"
      v-slot="vSlot"
      :data-testid="rbTestId"
      :to="item.to ?? null"
      :href="item.href ?? null"
      :target="item.target ?? null"
      class="flex cursor-pointer"
      :class="componentClass"
      @click="menuClick"
    >
      <BaseIcon
        v-if="item.icon"
        :path="item.icon"
        class="flex-none"
        :class="[vSlot && vSlot.isExactActive ? asideMenuItemActiveStyle : '']"
        w="w-16"
        :size="18"
      />
      <span
        class="line-clamp-1 grow text-ellipsis"
        :class="[
          { 'pr-6': !hasDropdown },
          vSlot && vSlot.isExactActive ? asideMenuItemActiveStyle : '',
        ]"
        >{{ item.label }}</span
      >
      <BaseIcon
        v-if="hasDropdown"
        :path="isDropdownActive ? mdiMinus : mdiPlus"
        class="flex-none"
        :class="[vSlot && vSlot.isExactActive ? asideMenuItemActiveStyle : '']"
        w="w-12"
      />
    </component>
    <AsideMenuList
      v-if="hasDropdown"
      data-testid="rb-aside-dropdown"
      :menu="item.menu"
      :class="['aside-menu-dropdown', isDropdownActive ? 'block dark:bg-slate-800/50' : 'hidden']"
      is-dropdown-list
    />
  </li>
</template>
