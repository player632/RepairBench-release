<template>
  <div :class="[$style.compareControls, { [$style.minified]: minified }, classes]">
    <Select
      v-model="modelValue[0]"
      :class="$style.select"
      :options="firstOptions"
      :label="t('page.dashboard.compare.compareThisYear')"
    />
    <Button :class="$style.switch" :icon="RiArrowLeftRightLine" @click="switchYears" />
    <Select
      v-model="modelValue[1]"
      :class="$style.select"
      :options="secondOptions"
      :label="t('page.dashboard.compare.againstThisYear')"
    />

    <Button
      :tooltip="t('page.dashboard.compare.toggleControls')"
      :class="$style.contractBtn"
      :icon="minified ? RiContractUpDownLine : RiExpandUpDownLine"
      @click="minified = !minified"
    />

    <ComponentTransition>
      <div v-if="minified" :class="$style.placeholder">
        <p>{{ t('page.dashboard.compare.comparingYearWithYear', { a: modelValue[0], b: modelValue[1] }) }}</p>
      </div>
    </ComponentTransition>
  </div>
</template>

<script lang="ts" setup>
import Button from '@components/base/button/Button.vue';
import Select from '@components/base/select/Select.vue';
import ComponentTransition from '@components/misc/component-transition/ComponentTransition.vue';
import { useDataStore } from '@store/state';
import { RiArrowLeftRightLine, RiContractUpDownLine, RiExpandUpDownLine } from '@remixicon/vue';
import { useLocalStorage } from '@vueuse/core';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ClassNames } from '@utils/types.ts';

const modelValue = defineModel<[number, number]>({ required: true });

const props = defineProps<{
  class?: ClassNames;
}>();

const { t } = useI18n();
const { state } = useDataStore();

const minified = useLocalStorage('dashboard/minify-compare-controls', false);

const classes = computed(() => props.class);

const availableYears = computed(() =>
  state.years.map((v) => ({
    id: v.year,
    label: v.year.toString(),
    value: v.year
  }))
);

const firstOptions = computed(() => availableYears.value.filter((v) => v.value !== modelValue.value?.[1]));

const secondOptions = computed(() => availableYears.value.filter((v) => v.value !== modelValue.value?.[0]));

const switchYears = () => {
  modelValue.value = [modelValue.value[1], modelValue.value[0]];
};
</script>

<style lang="scss" module>
.compareControls {
  position: relative;
  display: flex;
  background: var(--dialog-background);
  align-items: flex-end;
  padding: 8px 16px;
  border-radius: var(--border-radius-m);
  transition: all var(--transition-s);
  height: min-content;
  gap: 6px;

  &.minified {
    height: 36px;
    padding: 8px 8px;

    .select,
    .switch {
      opacity: 0;
    }
  }

  .select {
    min-width: 100px;
    transition: opacity var(--transition-s);
  }

  .switch {
    margin-bottom: 4px;
    transition: opacity var(--transition-s);
  }
}

.contractBtn {
  align-self: center;
  margin-left: auto;
}

.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  > p {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-l);
  }
}
</style>
