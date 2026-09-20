import codes from './currencies.json' with { type: 'json' };
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

const availableCurrencies = new Set(codes);
const supportedCurrenciesByBrowser = new Set(Intl.supportedValuesOf('currency'));
const currencies = availableCurrencies.intersection(supportedCurrenciesByBrowser);

export const useAvailableCurrencyCodes = (include?: MaybeRefOrGetter<string[]>) =>
  computed(() => Array.from(currencies.union(new Set(toValue(include) ?? []))).sort());
