// rb-seed.ts - repair-bench determinism seed (side-effect module).
//
// This file is imported FIRST by ./rb-env, which is in turn the first import of
// src/main.tsx. ES module evaluation runs imports in declaration order, so every
// statement below executes BEFORE src/engine/game.ts is evaluated. That ordering is
// the whole point: the game store reads localStorage at module-evaluation time
// (loadGame()), so the storage fixtures and the seeded RNG have to be in place
// before that happens, not after.
//
// It carries no application logic and no knowledge of any defect. It only makes the
// page reproducible: same URL -> same RNG stream -> same stored state -> same numbers.

export const RB_SEED_VERSION = "rb-doge-seed/1";

// ---- 1. seeded RNG (mulberry32) -----------------------------------------------------------------
// Math.random drives the market price walk, the tweet lottery and the launch roll.
// Seeding it makes every one of those reproducible for a given ?rb_seed=.
const params = new URLSearchParams(window.location.search);
const rawSeed = params.get("rb_seed");
const parsed = rawSeed === null ? NaN : Number.parseInt(rawSeed, 10);
export const RB_SEED = Number.isFinite(parsed) ? (parsed as number) >>> 0 : 0x5eed1e;

let rngState = (RB_SEED || 0x5eed1e) >>> 0;
const draws: number[] = [];

const rbRandom = (): number => {
  rngState = (rngState + 0x6d2b79f5) >>> 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  draws.push(value);
  return value;
};

const nativeRandom = Math.random;
Math.random = rbRandom;

export const rbRngDraws = (): number[] => draws.slice();
export const rbRngReset = (): void => {
  rngState = (RB_SEED || 0x5eed1e) >>> 0;
  draws.length = 0;
};
export const rbNativeRandom = nativeRandom;

// ---- 2. frozen clock ----------------------------------------------------------------------------
// Only Date.now() is frozen. The no-arg Date constructor is deliberately LEFT ALONE:
// the single no-arg call site in this app is the victory timestamp written on a
// successful launch, and no checkpoint reads that line. Replacing the Date
// constructor with a subclass would be a much larger blast radius (every third-party
// library sees it) for no measured gain here.
export const RB_EPOCH_MS = 1700000000000;
let rbNowMs = RB_EPOCH_MS;
const nativeNow = Date.now;
Date.now = (): number => rbNowMs;
export const rbNow = (): number => rbNowMs;
export const rbAdvanceTime = (ms: number): number => {
  rbNowMs += Number(ms) || 0;
  return rbNowMs;
};
export const rbNativeNow = nativeNow;

// ---- 3. storage fixtures ------------------------------------------------------------------------
// The game persists under "game-storage" (src/engine/storage-persist.ts) and the
// victory log under "victory-storage" (src/engine/victory-store.ts). Both are seeded
// with a fixed mid-game position so a fresh page load is a known, interesting state
// instead of an empty one.
export const RB_GAME_STORAGE_KEY = "game-storage";
export const RB_VICTORY_STORAGE_KEY = "victory-storage";

export const RB_PRESET_STATE = {
  ticks: 0,
  phase: 4,
  luck: 0,
  paused: false,

  dogecoin: 2000000,
  usd: 500000,
  maxDogecoin: 2000000,
  maxUsd: 500000,

  smallMiners: 2,
  mediumMiners: 1,
  largeMiners: 0,

  realEstate: ["Server", "Meme Factory"],
  unlocks: ["Social Media Manager", "Incorporate"],

  tweetCount: 3,
  twitterFollowers: 120,
  tweetIDs: [0, 1, 2],

  currentMission: null,
  currentLocation: "earth",

  engineers: 0,
  astronauts: 0,
  successChance: 0,
  minerAllocation: 0,
  failures: 0,
  casualties: 0,

  dogePerUSD: 15000,
  priceHistory: [15000],
};

export const RB_PRESET_VICTORIES = [
  {
    date: "Tue Nov 14 2023 22:13:20 GMT+0000",
    ticks: 1200,
    maxDoge: 4200000,
    failures: 2,
    casualties: 3,
  },
];

const seedStorage = (): void => {
  try {
    window.localStorage.setItem(RB_GAME_STORAGE_KEY, JSON.stringify(RB_PRESET_STATE));
    window.localStorage.setItem(RB_VICTORY_STORAGE_KEY, JSON.stringify(RB_PRESET_VICTORIES));
  } catch (e) {
    // Storage can be unavailable in exotic contexts; the fixture must never crash the app.
    void e;
  }
};

seedStorage();
