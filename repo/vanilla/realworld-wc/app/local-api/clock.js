// Deterministic monotonic clock for entities created at runtime. The base is
// 2026-03-01T08:00:00Z, one minute per issued sequence value, so new
// articles/comments always sort after every fixture entry and never collide.

const BASE_MS = Date.parse("2026-03-01T08:00:00.000Z");
const STEP_MS = 60000;

let seq = 0;

export function nextSeq() {
    seq += 1;
    return seq;
}

export function timestampFor(seqValue) {
    return new Date(BASE_MS + seqValue * STEP_MS).toISOString();
}
