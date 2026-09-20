<template>
  <div :class="[$style.developmentChart, classes]">
    <ChartPlaceholder v-if="isEmpty" />
    <LineChart v-else :data="data" />
  </div>
</template>

<script lang="ts" setup>
import LineChart from '@components/charts/line-chart/LineChart.vue';
import ChartPlaceholder from '@components/feature/chart-placeholder/ChartPlaceholder.vue';
import { useNumberFormatter } from '@composables/number-formatter/useNumberFormatter.ts';
import { useMonthNames } from '@composables/time/useMonthNames.ts';
import { useSettingsStore } from '@store/settings';
import { useDataStore } from '@store/state';
import { totals } from '@store/state/utils/budgets';
import { aggregate, subtract, sum } from '@utils/array/array.ts';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { LineChartConfig } from '@components/charts/line-chart/LineChart.types';
import type { ClassNames } from '@utils/types.ts';

const props = defineProps<{
  class?: ClassNames;
}>();

const { state } = useDataStore();
const { state: settings } = useSettingsStore();
const { n } = useNumberFormatter();
const { t } = useI18n();
const months = useMonthNames('long', () => settings.general.monthOffset);

const classes = computed(() => props.class);
const isEmpty = computed(() => {
  const totalIncome = sum(totals(state.income));
  const totalExpenses = sum(totals(state.expenses));
  return !totalIncome || !totalExpenses;
});

const data = computed((): LineChartConfig => {
  const income = totals(state.income);
  const expenses = totals(state.expenses);
  const endingBalance = aggregate(subtract(income, expenses));

  // valueFormatter isn't reactive, but we have to capture dependencies of n
  void n(0);

  return {
    valueFormatter: (value) => n(value),
    labels: months.value,
    series: [
      { name: t('page.dashboard.income'), color: 'var(--c-success-light-dimmed)', data: income },
      { name: t('page.dashboard.expenses'), color: 'var(--c-danger-light-dimmed)', data: expenses },
      { name: t('page.dashboard.endingBalance'), color: 'var(--c-primary-light-dimmed)', data: endingBalance }
    ]
  };
});
</script>

<style lang="scss" module>
.developmentChart {
  display: flex;
}
</style>
