<!-- 图标组件（离线占位：原 @iconify/vue Icon 需访问在线图标 API，adaptation 本地化） -->
<template>
  <span v-if="icon" class="art-svg-icon inline" v-bind="bindAttrs"></span>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtSvgIcon', inheritAttrs: false })

  interface Props {
    /** Iconify icon name */
    icon?: string
  }

  defineProps<Props>()

  const attrs = useAttrs()

  const bindAttrs = computed<{ class: string; style: string }>(() => ({
    class: (attrs.class as string) || '',
    style: (attrs.style as string) || ''
  }))
</script>
