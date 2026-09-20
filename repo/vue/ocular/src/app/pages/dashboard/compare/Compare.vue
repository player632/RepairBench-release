<template>
  <div :class="[$style.compare, classes]">
    <ChartPlaceholder v-if="!range || !years" :placeholder="t('page.dashboard.compare.minimumTwoYearsRequired')" />

    <template v-else>
      <CompareControls v-model="range" />

      <div :class="$style.maps">
        <ComparisonTreeMap :years="[years[0], years[1]]" />
        <ComparisonTreeMap :years="[years[1], years[0]]" />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import CompareControls from '@app/pages/dashboard/compare/CompareControls.vue';
import ComparisonTreeMap from '@app/pages/dashboard/compare/ComparisonTreeMap.vue';
import ChartPlaceholder from '@components/feature/chart-placeholder/ChartPlaceholder.vue';
import { useDataStore } from '@store/state';
import { sumOfBudgetYear } from '@store/state/utils/budgets.ts';
import { computed, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ClassNames } from '@utils/types.ts';

const props = defineProps<{
  class?: ClassNames;
}>();

const { t } = useI18n();
const { state } = useDataStore();
const range = ref<[number, number] | undefined>();

const classes = computed(() => props.class);

const years = computed(() => {
  const a = state.years.find((v) => v.year === range.value?.[0]);
  const b = state.years.find((v) => v.year === range.value?.[1]);

  if (!a || !b || !sumOfBudgetYear(a) || !sumOfBudgetYear(b)) {
    return;
  }

  return [a, b];
});

watchEffect(() => {
  if (state.years.length > 1 && !range.value) {
    const first = state.years[0].year;
    const last = state.years.at(-1)!.year;
    range.value = [first, last];
  }
});
</script>

<style lang="scss" module>
.compare {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  padding-bottom: 10px;
}

.maps {
  display: grid;
  overflow: hidden;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  height: 100%;
  width: 100%;
}
</style>
