<template>
  <SummaryTable :title="title">
    <div :class="$style.table">
      <!-- Header -->
      <span />
      <span
        v-for="(month, index) of months"
        :key="month"
        :class="[$style.bold, { [$style.currentMonth]: isCurrentMonth(index) }]"
      >
        <span>{{ month }}</span>
      </span>
      <span :class="$style.bold">{{ t('feature.budgetPane.total') }}</span>
      <span :class="$style.bold">{{ t('feature.budgetPane.average') }}</span>

      <!-- Groups -->
      <template v-for="(group, groupIndex) of flatted" :key="group.id">
        <span :data-testid="`${testId}-group-${groupIndex}`" :class="$style.bold">{{ group.name }}</span>
        <span
          v-for="(amount, index) of group.totals"
          :key="index"
          :class="{
            [$style.current]: isCurrentMonth(index),
            [$style.first]: groupIndex === 0,
            [$style.last]: groupIndex === flatted.length - 1
          }"
        >
          {{ n(amount) }}
        </span>
        <span :class="$style.bold">{{ n(sum(group.totals)) }}</span>
        <span :class="$style.bold">{{ n(average(group.totals)) }}</span>
      </template>

      <!-- Totals -->
      <template v-if="flatted.length > 1">
        <span :class="$style.bold">{{ t('feature.budgetPane.total') }}</span>
        <span v-for="(month, index) of months" :key="month" :class="$style.bold">
          {{ n(sum(flatted.map((v) => v.totals[index]))) }}
        </span>
        <span :class="$style.underline">
          {{ n(sum(add(...flatted.map((v) => v.totals)))) }}
        </span>
        <span :class="$style.underline">
          {{ n(average(add(...flatted.map((v) => v.totals)))) }}
        </span>
      </template>
    </div>
  </SummaryTable>
</template>

<script lang="ts" setup>
import SummaryTable from './SummaryTable.vue';
import { useNumberFormatter } from '@composables/number-formatter/useNumberFormatter.ts';
import { useStateUtils } from '@composables/state-utils/useStateUtils.ts';
import { useMonthNames } from '@composables/time/useMonthNames.ts';
import { useSettingsStore } from '@store/settings';
import { flatten } from '@store/state/utils/budgets';
import { average, sum, add } from '@utils/array/array.ts';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BudgetGroup } from '@store/state/types';
import type { ClassNames } from '@utils/types.ts';
import type { DeepReadonly } from 'vue';

const props = defineProps<{
  class?: ClassNames;
  groups: DeepReadonly<BudgetGroup[]>;
  testId: string;
  title: string;
}>();

const { t } = useI18n();
const { n } = useNumberFormatter();
const { isCurrentMonth } = useStateUtils();
const { state: settings } = useSettingsStore();
const months = useMonthNames('long', () => settings.general.monthOffset);

const flatted = computed(() => flatten(props.groups));
</script>

<style lang="scss" module>
@use 'shared';

.table {
  display: grid;
  grid-template: auto / var(--grid-layout);
  font-size: var(--font-size-xs);
}
</style>
