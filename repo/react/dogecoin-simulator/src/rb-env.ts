// rb-env.ts - repair-bench environment handle.
//
// Import order matters and is the reason this file exists separately from ./rb-seed:
//   1. "./rb-seed"        - side effects only (seeded RNG, frozen Date.now, storage fixtures)
//   2. "./engine/game"    - the store module, which reads localStorage while it is evaluated
//   3. this file's body   - publishes window.__rb
// Evaluating the seed before the store is what makes a fresh page load land on a known state.
//
// window.__rb is a READ/DRIVE handle for the harness. It never changes game rules: every
// method either reads the store, writes state through the store's own setState, or advances
// the fixture clock. No defect-specific logic lives here.
//
// DELIBERATE ABSENCE: __rb exposes NO derived value (no hash rate, no research rate, no
// price). Re-deriving any of them here would mean a second copy of the app's arithmetic
// inside the fixture; that copy would keep computing the CORRECT formula after a defect
// changed the app's one, so a probe reading the fixture instead of the app could never go
// red. Derived numbers are therefore only ever observed through the app's own selectors
// (useHashRate / useResearchRate) inside the probe component.

import {
  RB_SEED,
  RB_SEED_VERSION,
  RB_EPOCH_MS,
  RB_PRESET_STATE,
  RB_PRESET_VICTORIES,
  RB_GAME_STORAGE_KEY,
  RB_VICTORY_STORAGE_KEY,
  rbRngDraws,
  rbRngReset,
  rbNow,
  rbAdvanceTime,
} from "./rb-seed";
import { useGameStore } from "./engine/game";
import { getVictoryStorage } from "./engine/victory-store";

type RbState = ReturnType<typeof useGameStore.getState>;

export type RbApi = {
  version: string;
  seedVersion: string;
  seed: number;
  epochMs: number;
  now: () => number;
  advanceTime: (ms: number) => number;
  state: () => RbState;
  setState: (patch: Partial<RbState>) => RbState;
  tick: (n: number) => number;
  rngDraws: () => number[];
  rngReset: () => void;
  victories: () => unknown[];
  storageKeys: () => string[];
  preset: () => { game: unknown; victories: unknown };
};

const api: RbApi = {
  version: "rb-doge-env/1",
  seedVersion: RB_SEED_VERSION,
  seed: RB_SEED,
  epochMs: RB_EPOCH_MS,
  now: () => rbNow(),
  advanceTime: (ms: number) => rbAdvanceTime(ms),
  state: () => useGameStore.getState(),
  setState: (patch: Partial<RbState>) => {
    // zustand v3 types setState's argument as Pick<T, K> (every listed key required), so a
    // Partial is not assignable to it. The functional form is both correctly typed and an
    // explicit shallow merge, which is the runtime behaviour we want: the patch overrides the
    // named keys and every action on the store is preserved.
    useGameStore.setState((previous) => ({ ...previous, ...patch }));
    return useGameStore.getState();
  },
  tick: (n: number) => {
    const times = Math.max(0, Math.floor(Number(n) || 0));
    for (let i = 0; i < times; i += 1) {
      useGameStore.getState().runTick();
    }
    return useGameStore.getState().ticks;
  },
  rngDraws: () => rbRngDraws(),
  rngReset: () => rbRngReset(),
  victories: () => getVictoryStorage(),
  storageKeys: () => {
    try {
      return Object.keys(window.localStorage);
    } catch (e) {
      void e;
      return [];
    }
  },
  preset: () => ({ game: RB_PRESET_STATE, victories: RB_PRESET_VICTORIES }),
};

declare global {
  interface Window {
    __rb: RbApi;
  }
}

window.__rb = api;

export const RB_STORAGE_KEYS = [RB_GAME_STORAGE_KEY, RB_VICTORY_STORAGE_KEY];
