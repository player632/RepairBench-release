<template>
  <div ref="root" :class="[$style.step, classes]">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { STEPS_STORE } from './Steps.types';
import { useIntrinsicSize } from '@composables/intrinsic-size/useIntrinsicSize.ts';
import { computed, inject, onMounted, onUnmounted, useTemplateRef } from 'vue';
import type { StepsStore } from './Steps.types';
import type { ClassNames } from '@utils/types.ts';

const props = defineProps<{
  class?: ClassNames;
}>();

const root = useTemplateRef('root');
const intrinsicSize = useIntrinsicSize(root);
const { register, unregister } = inject<StepsStore>(STEPS_STORE)!;

onMounted(() => register(intrinsicSize));
onUnmounted(() => unregister(intrinsicSize));

const classes = computed(() => props.class);
</script>

<style lang="scss" module>
.step {
  display: inline-flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: 5px;
}
</style>
