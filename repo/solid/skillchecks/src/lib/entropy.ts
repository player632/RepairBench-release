// [repair-bench adaptation] Deterministic entropy source.
// The seed drew every board colour, every flood cell, every alphabet letter and every
// words draw from the platform PRNG (8 Math.random call sites), so no reading of any
// face was reproducible. This module pins Math.random to a seeded mulberry32 stream.
// It changes NO game logic: the 8 call sites, the thresholds, the grid shapes and the
// colour lists are all byte-identical to the seed. resetEntropy() lets a checkpoint
// restart the stream at a known position so a freshly mounted game always draws the
// same board (the app itself never calls it).
const SEED = 0x534b43;
let state = SEED >>> 0;
const next = () => {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const nativeRandom = Math.random;
Math.random = next;
export const entropySeed = SEED;
export const resetEntropy = (s = SEED) => { state = s >>> 0; };
