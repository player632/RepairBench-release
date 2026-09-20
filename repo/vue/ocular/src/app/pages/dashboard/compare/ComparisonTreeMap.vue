<template>
  <TreeMapChart :class="classes" :data="data" />
</template>

<script lang="ts" setup>
import TreeMapChart from '@components/charts/tree-map-chart/TreeMapChart.vue';
import { useNumberFormatter } from '@composables/number-formatter/useNumberFormatter.ts';
import { sumOfBudgetGroups, sumOfBudgets } from '@store/state/utils/budgets.ts';
import { sum } from '@utils/array/array.ts';
import { uuid } from '@utils/uuid/uuid.ts';
import { computed, type DeepReadonly } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TreeMapChartConfig, TreeMapChartNode } from '@components/charts/tree-map-chart/TreeMapChart.types.ts';
import type { BudgetGroup, BudgetYear } from '@store/state/types.ts';
import type { ClassNames } from '@utils/types.ts';

const props = defineProps<{
  class?: ClassNames;
  years: DeepReadonly<BudgetYear>[];
}>();

const { t } = useI18n();
const { n } = useNumberFormatter();

const classes = computed(() => props.class);

const color = (base: string, transparency: number) =>
  `color-mix(in srgb, ${base} ${Math.max(transparency * 100, 10)}%, transparent)`;

const budgetGroupToNode = (
  groups: DeepReadonly<BudgetGroup[]>,
  name: string,
  colorMapper: (fraction: number) => string
): TreeMapChartNode => {
  const total = sumOfBudgetGroups(groups);

  return {
    name,
    id: uuid(),
    value: total,
    children: groups.map((group) => ({
      id: uuid(),
      name: group.name,
      value: sumOfBudgets(group.budgets),
      children: group.budgets.map((budget) => {
        const budgetTotal = sum(budget.values);

        return {
          id: uuid(),
          name: budget.name,
          value: budgetTotal,
          label: `${budget.name} (${n(budgetTotal)})`,
          color: colorMapper(budgetTotal / total)
        };
      })
    }))
  };
};

const resolveNode = (
  nodes: TreeMapChartNode[],
  predicate: (node: TreeMapChartNode) => boolean
): TreeMapChartNode | undefined => {
  for (const child of nodes) {
    if (predicate(child)) return child;
    const resolvedChild = resolveNode(child.children ?? [], predicate);

    if (resolvedChild) {
      return resolvedChild;
    }
  }

  return undefined;
};

const data = computed((): TreeMapChartConfig => {
  const [current, other] = props.years;

  const incomeGroup = budgetGroupToNode(current.income, 'Income', (value) => color('var(--c-success)', value));
  const expensesGroup = budgetGroupToNode(current.expenses, 'Expenses', (value) => color('var(--c-danger)', value));

  const resolve = (
    predicate: (node: TreeMapChartNode) => boolean
  ): { type: 'income' | 'expenses'; node: TreeMapChartNode } | undefined => {
    const incomeNode = resolveNode([incomeGroup], predicate);
    const expensesNode = resolveNode([expensesGroup], predicate);

    return incomeNode
      ? { type: 'income', node: incomeNode }
      : expensesNode
        ? { type: 'expenses', node: expensesNode }
        : undefined;
  };

  return {
    tooltip: (id) => {
      const { node, type } = resolve((v) => v.id === id) ?? {};
      if (!node || !type) return undefined;

      const otherGroup = other[type];
      const otherBudgetGroup = otherGroup.find((v) => v.name === node.name);
      const otherBudgetGroupSum = otherBudgetGroup ? sumOfBudgets(otherBudgetGroup.budgets) : undefined;

      const otherBudget = otherGroup.flatMap((v) => v.budgets).find((v) => v.name === node.name);
      const otherBudgetSum = otherBudget ? sum(otherBudget.values) : undefined;

      const otherSum = otherBudgetGroupSum ?? otherBudgetSum;
      if (!otherSum) return undefined;

      if (otherSum === node.value) {
        return t('page.dashboard.compare.sameAs', {
          absolute: n(node.value),
          name: node.name,
          year: other.year
        });
      }

      return otherSum < node.value
        ? t('page.dashboard.compare.upComparedTo', {
            absolute: n(node.value - otherSum),
            percent: n((node.value - otherSum) / otherSum, { key: 'percent' }),
            name: node.name,
            year: other.year
          })
        : t('page.dashboard.compare.downComparedTo', {
            absolute: n(otherSum - node.value),
            percent: n((otherSum - node.value) / otherSum, { key: 'percent' }),
            name: node.name,
            year: other.year
          });
    },
    nodes: [incomeGroup, expensesGroup]
  };
});
</script>
