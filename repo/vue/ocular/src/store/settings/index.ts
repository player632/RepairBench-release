import { migrateSettingsState } from './migrator';
import { useStorage } from '@store/storage/useStorage.ts';
import { createGlobalState } from '@vueuse/core';
import { reactive, readonly } from 'vue';
import type { SettingsState } from './types';

export const useSettingsStore = createGlobalState(() => {
  const storage = useStorage();
  const state = reactive<SettingsState>(migrateSettingsState());

  storage?.sync<SettingsState>({
    name: 'settings',
    state: () => state,
    clear: () => Object.assign(state, migrateSettingsState()),
    push: (data) => Object.assign(state, migrateSettingsState(data))
  });

  return {
    state: readonly(state),

    setGeneral: <K extends keyof SettingsState['general']>(key: K, value: SettingsState['general'][K]) => {
      state.general[key] = value;
    },

    setAppearance: <K extends keyof SettingsState['appearance']>(key: K, value: SettingsState['appearance'][K]) => {
      state.appearance[key] = value;
    }
  };
});
