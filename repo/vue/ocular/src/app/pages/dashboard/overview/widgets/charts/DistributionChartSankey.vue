<template>
  <SankeyChart ref="chart" :percentages="percentages" :data="data" />
</template>

<script lang="ts" setup>
import SankeyChart from '@components/charts/sankey-chart/SankeyChart.vue';
import { useNumberFormatter } from '@composables/number-formatter/useNumberFormatter.ts';
import { useSettingsStore } from '@store/settings';
import { useDataStore } from '@store/state';
import { sumOfBudgets } from '@store/state/utils/budgets.ts';
import { sum } from '@utils/array/array.ts';
import { uuid } from '@utils/uuid/uuid.ts';
import { computed, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  SankeyChartConfig,
  SankeyChartLabel,
  SankeyChartLink,
  SankeyChartType
} from '@components/charts/sankey-chart/SankeyChart.types';

const props = defineProps<{
  highlight?: 'income' | 'expenses';
  averages?: boolean;
  percentages?: boolean;
  totalIncome: number;
  totalExpenses: number;
}>();

const { state: settings } = useSettingsStore();
const { state } = useDataStore();
const { n } = useNumberFormatter();
const { t } = useI18n();

const chart = useTemplateRef('chart');

const color = (hue: number) => `hsl(${hue}, var(--chart-generic-saturation), var(--chart-generic-lightness))`;

const format = (value: number, type: SankeyChartType) =>
  n(value, {
    key: type === 'absolute' ? 'currency' : 'percent',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });

const data = computed((): SankeyChartConfig => {
  const overallBalance = state.overallBalance ?? 0;
  const deficitAmount = -state.endingBalance;
  const labels: SankeyChartLabel[] = [];
  const links: SankeyChartLink[] = [];

  const income: SankeyChartLabel = {
    id: uuid(),
    formatter: (value, type) =>
      type === 'percentage' ? t('page.dashboard.income') : `${t('page.dashboard.income')} (${format(value, type)})`,
    color: color(120)
  };

  labels.push(income);

  if (settings.general.carryOver && overallBalance > 0) {
    const carryOverSource = uuid();
    const carryOverTarget = uuid();

    labels.push({
      id: carryOverSource,
      formatter: (value, type) => `${t('page.dashboard.overview.lastYear')} (${format(value, type)})`,
      color: color(60 + 60 * (overallBalance / props.totalIncome)),
      muted: props.highlight === 'expenses'
    });

    labels.push({
      id: carryOverTarget,
      formatter: (value, type) => `${t('page.dashboard.overview.surplus')} (${format(value, type)})`,
      color: color(60 + 60 * (overallBalance / props.totalIncome)),
      muted: props.highlight === 'expenses'
    });

    links.push({
      id: uuid(),
      target: carryOverTarget,
      source: carryOverSource,
      value: overallBalance,
      muted: props.highlight === 'expenses'
    });

    links.push({
      id: uuid(),
      target: income.id,
      source: carryOverTarget,
      value: overallBalance,
      muted: props.highlight === 'expenses'
    });
  }

  if (!settings.general.carryOver && deficitAmount > 0) {
    const carryOverSource = uuid();
    const carryOverTarget = uuid();

    labels.push({
      id: carryOverSource,
      formatter: (value, type) => `${t('page.dashboard.overview.deficit')} (${format(value, type)})`,
      color: color(0),
      muted: props.highlight === 'expenses'
    });

    labels.push({
      id: carryOverTarget,
      formatter: (value, type) => `${t('page.dashboard.overview.deficit')} (${format(value, type)})`,
      color: color(0),
      muted: props.highlight === 'expenses'
    });

    links.push({
      id: uuid(),
      target: carryOverTarget,
      source: carryOverSource,
      value: deficitAmount,
      muted: props.highlight === 'expenses'
    });

    links.push({
      id: uuid(),
      target: income.id,
      source: carryOverTarget,
      value: deficitAmount,
      muted: props.highlight === 'expenses'
    });
  }

  for (const group of state.income) {
    const total = sumOfBudgets(group.budgets);

    if (!total) {
      continue;
    }

    labels.push({
      id: group.id,
      formatter: (value, type) => `${group.name} (${format(value, type)})`,
      color: color(60 + 60 * (total / props.totalIncome)),
      muted: props.highlight === 'expenses'
    });

    links.push({
      id: uuid(),
      target: income.id,
      source: group.id,
      value: total,
      muted: props.highlight === 'expenses'
    });

    for (let i = 0; i < group.budgets.length; i++) {
      const budget = group.budgets[i];
      const total = sum(budget.values);

      if (total) {
        labels.push({
          id: budget.id,
          formatter: (value, type) => `${budget.name} (${format(value, type)})`,
          color: color(60 + 60 * (total / props.totalIncome)),
          muted: props.highlight === 'expenses',
          radius: [5, 0, 0, 5]
        });

        links.push({
          id: uuid(),
          target: group.id,
          source: budget.id,
          value: total,
          muted: props.highlight === 'expenses'
        });
      }
    }
  }

  for (const group of state.expenses) {
    const total = sumOfBudgets(group.budgets);

    if (!total) {
      continue;
    }

    labels.push({
      id: group.id,
      formatter: (value, type) => `${group.name} (${format(value, type)})`,
      color: color(60 * (1 - total / props.totalExpenses)),
      muted: props.highlight === 'income'
    });

    links.push({
      id: uuid(),
      target: group.id,
      source: income.id,
      value: total,
      muted: props.highlight === 'income'
    });

    for (let i = 0; i < group.budgets.length; i++) {
      const budget = group.budgets[i];
      const total = sum(budget.values);

      if (total) {
        labels.push({
          id: budget.id,
          formatter: (value, type) => `${budget.name} (${format(value, type)})`,
          color: color(60 * (1 - total / props.totalExpenses)),
          align: 'left',
          muted: props.highlight === 'income',
          radius: [0, 5, 5, 0]
        });

        links.push({
          id: uuid(),
          target: budget.id,
          source: group.id,
          value: total,
          muted: props.highlight === 'income'
        });
      }
    }
  }

  if (settings.general.carryOver && overallBalance < 0) {
    const deficitSource = uuid();
    const deficitTarget = uuid();

    labels.push({
      id: deficitSource,
      formatter: (value, type) => `${t('page.dashboard.overview.lastYear')} (${format(value, type)})`,
      color: color(60 + 60 * (-overallBalance / props.totalIncome)),
      muted: props.highlight === 'income'
    });

    labels.push({
      id: deficitTarget,
      formatter: (value, type) => `${t('page.dashboard.overview.deficit')} (${format(value, type)})`,
      color: color(60 + 60 * (-overallBalance / props.totalIncome)),
      muted: props.highlight === 'income',
      align: 'left'
    });

    links.push({
      id: uuid(),
      target: deficitSource,
      source: income.id,
      value: -overallBalance,
      muted: props.highlight === 'income'
    });

    links.push({
      id: uuid(),
      target: deficitTarget,
      source: deficitSource,
      value: -overallBalance,
      muted: props.highlight === 'income'
    });
  }

  if (props.averages) {
    links.forEach((v) => (v.value /= 12));
  }

  return { labels, links };
});

defineExpose({
  download: (name: string, type: 'png' | 'svg') => chart.value?.download(name, type)
});
</script>
