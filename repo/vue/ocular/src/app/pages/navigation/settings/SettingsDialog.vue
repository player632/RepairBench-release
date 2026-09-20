<template>
  <Dialog :open="open" :title="t('navigation.settings.settings')" @close="emit('close')">
    <div :class="$style.settingsDialog">
      <Select
        :modelValue="state.locale"
        testId="change-locale"
        :label="t('navigation.settings.language')"
        :options="locales"
        @update:modelValue="changeLocale($event as AvailableLocale)"
      />

      <Select
        :modelValue="state.currency"
        testId="change-currency"
        :label="t('navigation.settings.currency')"
        :options="currencies"
        searchable
        @update:modelValue="changeCurrency($event as string)"
      />

      <Select
        :modelValue="settings.general.monthOffset"
        testId="change-month-offset"
        :label="t('navigation.settings.firstMonthOfYear')"
        :options="months"
        @update:modelValue="setGeneral('monthOffset', $event as number)"
      />

      <CheckBox
        :label="t('navigation.settings.showAnimationsAndTransitions')"
        :modelValue="settings.appearance.animations"
        @update:modelValue="setAppearance('animations', $event as boolean)"
      />

      <CheckBox
        :label="
          t('navigation.settings.switchNumberSeparators', {
            old: n(1234.56, { switchNumberSeparators: false }),
            new: n(1234.56, { switchNumberSeparators: true })
          })
        "
        testId="switch-number-separators"
        :modelValue="settings.general.switchNumberSeparators"
        @update:modelValue="setGeneral('switchNumberSeparators', $event as boolean)"
      />

      <CheckBox
        :label="
          t('navigation.settings.showMinimumFractionDigits', {
            old: n(3.5, { minimumFractionDigits: 0 }),
            new: n(3.5, { minimumFractionDigits: 2 })
          })
        "
        testId="show-minimum-fraction-digits"
        :modelValue="settings.general.showMinimumFractionDigits"
        @update:modelValue="setGeneral('showMinimumFractionDigits', $event as boolean)"
      />

      <CheckBox
        :label="t('navigation.settings.carryOverNetSavings')"
        :subLabel="t('navigation.settings.carryOverNetSavingsInfo')"
        :modelValue="settings.general.carryOver"
        testId="carry-over-net-savings"
        @update:modelValue="setGeneral('carryOver', $event as boolean)"
      />
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import CheckBox from '@components/base/check-box/CheckBox.vue';
import Dialog from '@components/base/dialog/Dialog.vue';
import Select from '@components/base/select/Select.vue';
import { useAvailableCurrencyCodes } from '@composables/available-currency-codes/useAvailableCurrencyCodes.ts';
import { useNumberFormatter } from '@composables/number-formatter/useNumberFormatter.ts';
import { useMonthNames } from '@composables/time/useMonthNames.ts';
import { availableLocales, initialLocale } from '@i18n/index.ts';
import { useSettingsStore } from '@store/settings';
import { useDataStore } from '@store/state';
import { RiCheckLine } from '@remixicon/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContextMenuOption } from '@components/base/context-menu/ContextMenu.types.ts';
import type { AvailableLocale } from '@i18n/index.ts';

const emit = defineEmits<{
  close: [];
}>();

defineProps<{
  open: boolean;
}>();

const { n } = useNumberFormatter();
const { t, locale } = useI18n();
const { setAppearance, setGeneral, state: settings } = useSettingsStore();
const { changeCurrency, changeLocale, state } = useDataStore();
const currencyCodes = useAvailableCurrencyCodes(() => [state.currency]);
const monthNames = useMonthNames();

const locales = computed<ContextMenuOption[]>(() => {
  const displayNames = new Intl.DisplayNames(initialLocale, { type: 'language' });

  return availableLocales.map((value) => ({
    id: value,
    icon: state.locale === value ? RiCheckLine : undefined,
    label: displayNames.of(value)
  }));
});

const currencies = computed<ContextMenuOption[]>(() =>
  currencyCodes.value.map((value) => ({
    id: value,
    icon: state.currency === value ? RiCheckLine : undefined,
    label: `${formatNumber(locale.value, value, 'name')} ${value} (${formatNumber(locale.value, value)})`
  }))
);

const months = computed<ContextMenuOption[]>(() =>
  monthNames.value.map((value, index) => ({
    id: index,
    label: value,
    icon: settings.general.monthOffset === index ? RiCheckLine : undefined
  }))
);

const formatNumber = (locale: string, currency: string, currencyDisplay?: Intl.NumberFormatOptionsCurrencyDisplay) => {
  const symbol = new Intl.NumberFormat(locale, {
    style: 'currency',
    currencyDisplay,
    currency
  })
    .formatToParts(0)
    .find((x) => x.type === 'currency')?.value;

  return symbol ? symbol[0].toUpperCase() + symbol.slice(1) : symbol;
};
</script>

<style lang="scss" module>
.settingsDialog {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
