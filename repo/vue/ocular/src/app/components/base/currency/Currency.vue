<template>
  <span v-if="settings.appearance.mode === 'privacy'" :data-testid="testId" :class="[$style.container, props.class]">
    {{ formatted }}
    <span :class="$style.overlay" />
  </span>
  <span v-else :data-testid="testId" :class="props.class">
    {{ formatted }}
  </span>
</template>

<script lang="ts" setup>
import { type FormattingOptions, useNumberFormatter } from '@composables/number-formatter/useNumberFormatter.ts';
import { useSettingsStore } from '@store/settings';
import { computed } from 'vue';
import type { ClassNames } from '@utils/types.ts';

const props = defineProps<{
  value?: number;
  locale?: string;
  class?: ClassNames;
  testId?: string;
  formatting?: FormattingOptions;
}>();

const { n } = useNumberFormatter();
const { state: settings } = useSettingsStore();

const formatted = computed(() =>
  n(props.value, {
    minimumFractionDigits: settings.general.showMinimumFractionDigits ? 2 : 0,
    ...props.formatting
  })
);
</script>

<style lang="scss" module>
.container {
  display: inline-block;
  position: relative;
  filter: blur(5px) opacity(0.85);
  transition: all var(--transition-m);

  &:hover {
    filter: none;
  }
}
</style>
