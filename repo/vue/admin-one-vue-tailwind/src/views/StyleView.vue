<script setup>
import { useRouter } from 'vue-router'
import { useDarkModeStore } from '@/stores/darkMode.js'
import { gradientBgPurplePink } from '@/colors.js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import LayoutGuest from '@/layouts/LayoutGuest.vue'

const styles = ['basic', 'white']

const darkModeStore = useDarkModeStore()

darkModeStore.set(false)

// INSTRUMENTATION (repair-bench, read-only): exposes the <html> style-token set, the authored
// style list and the dark-mode reset this view performs, as scalars. Getters only, fail-close.
window.__rb = window.__rb || {}
window.__rb.style = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  const tokens = () =>
    Array.prototype.filter
      .call(document.documentElement.classList, (t) => t.indexOf('style') === 0)
      .join(',')
  return {
    hash: () => safe(() => location.hash),
    styleCount: () => safe(() => styles.length),
    styleNames: () => safe(() => styles.join(',')),
    htmlTokens: () => safe(tokens),
    htmlTokenCount: () => safe(() => tokens().split(',').filter((t) => t.length).length),
    htmlClass: () => safe(() => String(document.documentElement.className)),
    darkEnabled: () => safe(() => darkModeStore.isEnabled),
    cardCount: () => safe(() => document.querySelectorAll("[data-testid^=\"rb-style-card-\"]").length),
    screenshotCount: () => safe(() => document.querySelectorAll("[data-testid^=\"rb-screenshot\"]").length),
    screenshotsLoaded: () =>
      safe(() =>
        Array.prototype.filter.call(document.querySelectorAll('[data-testid^="rb-screenshot"]'), (im) => im.complete && im.naturalWidth > 0).length,
      ),
  }
})()

const router = useRouter()

const handleStyleChange = (slug) => {
  document.documentElement.classList.forEach((token) => {
    if (token.indexOf('style') === 0) {
      document.documentElement.classList.remove(token)
    }
  })

  router.push('/dashboard')
}
</script>

<template>
  <LayoutGuest>
    <div :class="gradientBgPurplePink" class="flex min-h-screen items-center justify-center">
      <SectionMain>
        <h1 class="mt-12 mb-3 text-center text-4xl font-bold text-white md:text-5xl lg:mt-0">
          Pick a style&hellip;
        </h1>
        <h2 class="mb-12 text-center text-xl text-white md:text-xl">
          Style switching with a single
          <code class="rounded-sm bg-white/20 px-1.5 py-0.5">modifier</code>
        </h2>
        <div class="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 lg:grid-cols-2">
          <CardBox
            v-for="style in styles"
            :key="style"
            :data-testid="'rb-style-card-' + style"
            class="cursor-pointer bg-gray-50"
            is-hoverable
            @click="handleStyleChange(style)"
          >
            <div class="mb-3 md:mb-6">
              <img
                :src="`/vendor/screenshot-placeholder.svg?style=${style}`"
                data-testid="rb-screenshot-style"
                width="1280"
                height="720"
              />
            </div>

            <h1 :data-testid="'rb-style-name-' + style" class="text-xl font-black capitalize md:text-2xl">
              {{ style }}
            </h1>
            <h2 class="text-lg md:text-xl">& Dark mode</h2>
          </CardBox>
        </div>
      </SectionMain>
    </div>
  </LayoutGuest>
</template>
