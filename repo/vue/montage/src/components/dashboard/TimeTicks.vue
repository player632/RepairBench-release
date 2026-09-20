<template>
  <div class="flex items-center py-3 relative border-y border-zinc-700" data-testid="rb-ticks">
    <!-- Full seconds -->
    <span
      data-testid="rb-tick-second"
      class="text-white text-right select-none"
      :key="n"
      v-for="n in duration"
      :style="{
        width: '100px'
      }"
    >
      {{ n }}s
    </span>
    <!-- Half seconds -->
    <span
      data-testid="rb-tick-half"
      class="text-white-400 select-none absolute"
      :key="n"
      v-for="n in duration * 2"
      :style="{
        left: `${50 * n - 5}px`,
        display: !(n % 2) ? 'none' : undefined
      }"
    >
      •
    </span>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  duration: number;
}>();
</script>
