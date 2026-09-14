<script setup>
import { computed } from 'vue'

const props = defineProps({
  username: {
    type: String,
    required: true,
  },
  avatar: String,
  api: {
    type: String,
    default: 'avataaars',
  },
})

// OFFLINE ADAPTATION (repair-bench): same substitution as src/stores/main.js - the dicebear
// request becomes a local placeholder while the api name and the sanitised seed stay in the
// query string, so every avatar src is still distinct and still encodes its username.
const avatar = computed(
  () =>
    props.avatar ??
    `/vendor/avatar-placeholder.svg?api=${props.api}&seed=${props.username.replace(
      /[^a-z0-9]+/gi,
      '-',
    )}.svg`,
)

const username = computed(() => props.username)
</script>

<template>
  <div data-testid="rb-avatar">
    <img
      data-testid="rb-avatar-img"
      :src="avatar"
      :alt="username"
      class="block h-auto w-full max-w-full rounded-full bg-gray-100 dark:bg-slate-800"
    />
    <slot />
  </div>
</template>
