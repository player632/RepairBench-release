import { useSettingsStore } from '@store/settings';
import { useDataStore } from '@store/state';
import { createGlobalState } from '@vueuse/core';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export type FormattingOptions = Omit<Intl.NumberFormatOptions, 'style'> & {
  key?: 'currency' | 'percent' | 'blank';
  switchNumberSeparators?: boolean;
};

export const useNumberFormatter = createGlobalState(() => {
  const { state: settings } = useSettingsStore();
  const { state: data } = useDataStore();
  const { n } = useI18n();

  const separators = computed(() => {
    const parts = n(1234.56, { key: 'currency', currency: 'USD', part: true });

    let group = parts.find((part) => part.type === 'group')?.value;
    let decimal = parts.find((part) => part.type === 'decimal')?.value;

    if (settings.general.switchNumberSeparators) {
      [group, decimal] = [decimal, group];
    }

    return { group, decimal };
  });

  const format = (value?: number, options?: FormattingOptions) => {
    const switchSeparators = options?.switchNumberSeparators ?? settings.general.switchNumberSeparators;
    const { key = 'currency', currency = key === 'currency' ? data.currency : undefined, ...rest } = options ?? {};

    if (!switchSeparators) {
      return n(value ?? 0, { key, currency, ...rest });
    }

    const { decimal, group } = separators.value;
    const parts = n(value ?? 0, { key, currency, ...rest, part: true });

    return parts
      .map((v) => {
        switch (v.type) {
          case 'group':
            return group ?? v.value;
          case 'decimal':
            return decimal ?? v.value;
          default:
            return v.value;
        }
      })
      .join('');
  };

  return {
    separators,
    n: format
  };
});
