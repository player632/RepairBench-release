// RepairBench grading-face adaptation: pin the seed's only reachable entropy source.
//
// charlie ships offline-clean - the graded surface (index.html + src/*.ts + the lib/*.fs and
// demo/*.fs files the build copies into dist/) issues no cross-origin request, so unlike most
// seeds this adaptation removes NO network dependency. Its one job is determinism.
//
// `lib/math.fs` publishes `Math. random`, which is `window.Math.random` reached through the VM's
// `js@` primitive, and it is the only nondeterministic value the REPL can print. A graded face has
// to reproduce its readings run to run, so Math.random is replaced here by a fixed-seed 32-bit LCG
// (Numerical Recipes constants) installed BEFORE the VM boots. Measured at design time: 0
// occurrences of Math.random in src/ and index.html, so nothing else in the seed observes the swap.
//
// Date is deliberately left alone: `lib/bench.fs`'s `now`/`timed` stay wall-clock (no checkpoint
// reads them) and setTimeout still drives `sleep` with real elapsed time, which the timing
// checkpoints depend on.
const RB_LCG_SEED = 0x2f6e2b1;

let rbState = RB_LCG_SEED >>> 0;

const rbRandom = () => {
	rbState = (Math.imul(rbState, 1664525) + 1013904223) >>> 0;
	return rbState / 0x100000000;
};

Math.random = rbRandom;

export const RB_RANDOM_SEED = RB_LCG_SEED;
