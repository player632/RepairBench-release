import { createMigration, createMigrator } from 'yuppee';
import type { SettingsStateV1, SettingsStateV2, SettingsStateV3, SettingsStateV4, SettingsStateV5 } from './types';

type Versions = SettingsStateV1 | SettingsStateV2 | SettingsStateV3 | SettingsStateV4 | SettingsStateV5;

export const migrateSettingsState = createMigrator<SettingsStateV5, Versions>({
  init: () => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      appearance: {
        theme: dark ? 'dark' : 'light',
        animations: !reducedMotion
      }
    };
  },
  migrations: [
    createMigration<SettingsStateV1, SettingsStateV2>({
      from: 1,
      to: 2,
      migrate: (from) => ({
        ...from,
        version: 2,
        appearance: {
          ...from.appearance,
          mode: 'normal'
        }
      })
    }),
    createMigration<SettingsStateV2, SettingsStateV3>({
      from: 2,
      to: 3,
      migrate: (from) => ({
        ...from,
        version: 3,
        general: {
          monthOffset: 0
        }
      })
    }),
    createMigration<SettingsStateV3, SettingsStateV4>({
      from: 3,
      to: 4,
      migrate: (from) => ({
        ...from,
        version: 4,
        general: {
          ...from.general,
          carryOver: false
        }
      })
    }),
    createMigration<SettingsStateV4, SettingsStateV5>({
      from: 4,
      to: 5,
      migrate: (from) => ({
        ...from,
        version: 5,
        general: {
          ...from.general,
          showMinimumFractionDigits: false,
          switchNumberSeparators: false
        }
      })
    })
  ]
});
