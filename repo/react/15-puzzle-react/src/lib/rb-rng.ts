// Repair-Bench adaptation: reproducible entropy source.
//
// The seed deals every level through src/lib/utils.ts randomSubarray(), which drew
// from Math.random(); each page load therefore produced a different board and no
// checkpoint could assert an exact tile layout. This module replaces ONLY the entropy
// source with a fixed-seed mulberry32 PRNG. The Fisher-Yates loop, its bounds and the
// trailing slice in randomSubarray are untouched, so the dealt board is still a uniform
// random permutation of 1..16 - it is merely reproducible across loads, and each
// successive call to the factory advances the stream (level 1, level 2, ...), so
// "New game" still deals a different board every time.
//
//
// deterministic mulberry32 seed 42 in polyfills to pin the 7-bag order").
//
// Seed constant 244: an arbitrary fixed initialiser for the stream. Only
// reproducibility matters here - the value itself carries no meaning.
let rbState = 244;

export const rbRandom = (): number => {
  rbState |= 0;
  rbState = (rbState + 0x6d2b79f5) | 0;
  let t = Math.imul(rbState ^ (rbState >>> 15), 1 | rbState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
