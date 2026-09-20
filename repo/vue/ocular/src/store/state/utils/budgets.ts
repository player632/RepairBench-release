import { sum } from '@utils/array/array.ts';
import type { BudgetGroup, BudgetYear } from '../types';
import type { DeepReadonly } from 'vue';

export const totals = (groups: DeepReadonly<BudgetGroup[]>): number[] => {
  const totals = new Array(12).fill(0);

  for (const { budgets } of groups) {
    for (const { values } of budgets) {
      for (let i = 0; i < values.length; i++) {
        totals[i] += values[i];
      }
    }
  }

  return totals;
};

export interface FlattedBudgetGroup extends BudgetGroup {
  totals: number[];
}

export const flatten = (groups: DeepReadonly<BudgetGroup[]>): FlattedBudgetGroup[] =>
  groups.map((group) => {
    const totals = new Array(12).fill(0);

    for (const { values } of group.budgets) {
      for (let i = 0; i < values.length; i++) {
        totals[i] += values[i];
      }
    }

    return { ...group, totals } as FlattedBudgetGroup;
  });

export const sumOfBudgets = (budgets: DeepReadonly<BudgetGroup['budgets']>): number =>
  sum(budgets.flatMap((v) => v.values));

export const sumOfBudgetGroups = (groups: DeepReadonly<BudgetGroup[]>): number =>
  sum(groups.flatMap((v) => sumOfBudgets(v.budgets)));

export const sumOfBudgetYear = ({ income, expenses }: DeepReadonly<BudgetYear>) =>
  sumOfBudgetGroups(income) - sumOfBudgetGroups(expenses);
