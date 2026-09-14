<script setup>
import { computed } from 'vue'
import { mdiTrendingDown, mdiTrendingUp, mdiTrendingNeutral } from '@mdi/js'
import CardBox from '@/components/CardBox.vue'
import BaseLevel from '@/components/BaseLevel.vue'
import PillTag from '@/components/PillTag.vue'
import UserAvatar from '@/components/UserAvatar.vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  login: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
  text: String,
  type: String,
})

const pillType = computed(() => {
  if (props.type) {
    return props.type
  }

  if (props.progress) {
    if (props.progress >= 60) {
      return 'success'
    }
    if (props.progress >= 40) {
      return 'warning'
    }

    return 'danger'
  }

  return 'info'
})

const pillIcon = computed(() => {
  return {
    success: mdiTrendingUp,
    warning: mdiTrendingNeutral,
    danger: mdiTrendingDown,
    info: null,
  }[pillType.value]
})

const pillText = computed(() => props.text ?? `${props.progress}%`)

// INSTRUMENTATION (repair-bench, read-only): client-card registry keyed by the client name, so
// the progress->pill mapping is assertable as a scalar instead of a Tailwind class guess.
const rbSlug = computed(() => String(props.name || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-'))
const rbTestId = computed(() => 'rb-client-card-' + rbSlug.value)
window.__rb = window.__rb || {}
window.__rb.clients = window.__rb.clients || {}
window.__rb.clients[rbSlug.value] = (function () {
  const safe = (fn) => {
    try {
      return fn()
    } catch (e) {
      return null
    }
  }
  return {
    slug: () => rbSlug.value,
    name: () => safe(() => props.name ?? null),
    login: () => safe(() => props.login ?? null),
    date: () => safe(() => props.date ?? null),
    progress: () => safe(() => props.progress ?? null),
    textProp: () => safe(() => props.text ?? null),
    typeProp: () => safe(() => props.type ?? null),
    pillType: () => safe(() => pillType.value),
    pillText: () => safe(() => pillText.value),
    pillIcon: () => safe(() => (pillIcon.value ? 'icon' : 'none')),
  }
})()
</script>

<template>
  <CardBox class="mb-6 last:mb-0" :data-testid="rbTestId">
    <BaseLevel>
      <BaseLevel type="justify-start">
        <UserAvatar class="mr-6 h-12 w-12" :username="name" />
        <div class="overflow-hidden text-center md:text-left">
          <h4 class="text-xl text-ellipsis">
            {{ name }}
          </h4>
          <p class="text-gray-500 dark:text-slate-400">{{ date }} @ {{ login }}</p>
        </div>
      </BaseLevel>
      <PillTag data-testid="rb-client-pill" :color="pillType" :label="pillText" :icon="pillIcon" />
    </BaseLevel>
  </CardBox>
</template>
