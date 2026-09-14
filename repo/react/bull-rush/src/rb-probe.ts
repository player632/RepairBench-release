// rb-probe.ts - verifier bridge, added by the repair-bench instrumentation patch.
//
// OBSERVATION ONLY. This module changes no rule, no constant, no render path and
// no game outcome: it reads state the application already publishes and calls the
// application's own public actions, so a checkpoint drives the real code paths
// instead of a reimplementation. Every getter returns a scalar (integer, short
// string or 0/1) because the verifier polls each assertion repeatedly - a read
// that mutated anything would flip itself green on the second poll.
//
// Nothing here reads a pixel. The 3D surface is observed through the simulation
// state and through the store the render loop already writes into; there is no
// getImageData, no canvas hash and no screenshot comparison anywhere.
import { useGameStore, refs } from './store';
import { storage } from './storage';
import { activeSim } from './sim/active';
import { createSim, stepSim, simPlayerX } from './sim/sim';
import { Rng } from './sim/prng';
import { SimRunner } from './sim/runner';
import { hashCanonical, replayHash, encodeInputsFlat, validateReplayStructure } from './sim/replay';
import { verifyGhostReplay } from './sim/ghost';
import { useClassicEngine } from './sim/flag';
import { buildReplay, apiEnabled } from './api';
import { GAME_VERSION, RULESET_HASH } from './sim/ruleset';
import { rankFor } from './data/ranks';

// The two published grid seeds this task's checkpoints race. Both are no-input
// courses that end the run inside ~7 seconds of simulation time, which keeps the
// death-driven checkpoints bounded on a software rasteriser.
const SEED_A = '0xa708a7ae';
const SEED_B = '0xec48c90d';
// A fixed lane/dash script, in [tick, action] pairs, used by the replay probes.
const SCRIPT: [number, number][] = [
    [30, 0],
    [70, 1],
    [110, 2],
    [150, 0],
];

const OWN_GLOBALS = new Set(Object.keys(window).filter((k) => k.startsWith('__')));
OWN_GLOBALS.add('__rb');

function tid(id: string): Element | null {
    return document.querySelector('[data-testid="' + id + '"]');
}
function tidAll(id: string): Element[] {
    return Array.from(document.querySelectorAll('[data-testid="' + id + '"]'));
}
function txt(el: Element | null): string {
    return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '';
}
function st(): any {
    return useGameStore.getState();
}
function guard<T>(fn: () => T, fallback: T): T {
    try {
        return fn();
    } catch {
        return fallback;
    }
}
async function pollUntil(pred: () => boolean, ms: number): Promise<boolean> {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
        if (guard(pred, false)) return true;
        await new Promise((r) => setTimeout(r, 60));
    }
    return guard(pred, false);
}

// ---- deterministic course / engine read-outs (the app's own modules) ----
function spawnRows(seed: string) {
    const s = createSim(seed);
    return s.rows.map((r) => ({ index: r.index, cells: r.cells.map((c) => (c ? c.kind : null)), keys: Object.keys(r.cells) }));
}
function walkKinds(seed: string, ticks: number) {
    const s = createSim(seed);
    const kinds = new Set<string>();
    for (let t = 0; t < ticks; t += 1) {
        stepSim(s, []);
        for (const r of s.rows) for (const c of r.cells) if (c) kinds.add(c.kind);
        if (!s.alive) {
            s.alive = true;
            s.hearts = 3;
            s.invulnUntil = s.tick + 60;
        }
    }
    for (const r of s.rows) for (const c of r.cells) if (c) kinds.add(c.kind);
    return kinds;
}
function laneWalk(seed: string, lefts: number, ticks: number) {
    const s = createSim(seed);
    let minTarget = 99;
    let minX = 1e9;
    for (let t = 0; t < ticks; t += 1) {
        const acts = t < lefts ? [0] : [];
        stepSim(s, acts as any);
        if (s.laneTarget < minTarget) minTarget = s.laneTarget;
        const x = simPlayerX(s);
        if (x < minX) minX = x;
        if (!s.alive) break;
    }
    return { minTarget, minX };
}
function driveRunner(seed: string, script: [number, number][], ticks: number) {
    const r = new SimRunner(seed);
    const by = new Map<number, number[]>();
    for (const [t, a] of script) {
        if (!by.has(t)) by.set(t, []);
        by.get(t)!.push(a);
    }
    while (r.tick < ticks && r.alive) {
        for (const a of by.get(r.tick) || []) r.input(a as any);
        r.advance(1 / 60);
    }
    return r;
}

// Frame-aligned drivers. The restart path retires a finished runner from a passive
// effect keyed on runId (src/three/SimScene.tsx), while the runner itself is advanced from a
// requestAnimationFrame callback in the same component. Driving a restart from an ordinary
// script task lets the already-pending rAF callback run before React flushes that deferred
// effect, so the loop advances the finished runner once more; SimRunner.advance() returns
// early for a dead runner WITHOUT clearing lastEvents (src/sim/runner.ts:46-48), the stale
// 'death' event fires again and the fresh run is dead on its first frame. Issuing the same
// call from inside a rAF callback puts React's effect flush (a task) between the state change
// and the next rendered frame, which makes the retirement observable before the loop runs.
// Measured on the unmodified seed: the same restart both passed and failed depending only on
// main-thread congestion, so the alignment is a measurement determinism fix, not a behaviour
// change - it retires nothing itself and mutates no application state.
function atFrame<T>(fn: () => T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        requestAnimationFrame(() => {
            try {
                resolve(fn());
            } catch (e) {
                reject(e);
            }
        });
    });
}

const rb = {
    // ---- identity / readiness ----
    version: 1,
    seedA: SEED_A,
    seedB: SEED_B,
    ready(): boolean {
        return !!tid('app-root') && typeof st().phase === 'string';
    },
    apiEnabled(): number {
        return guard(() => (apiEnabled ? 1 : 0), -1);
    },
    gameVersion(): string {
        return guard(() => GAME_VERSION, 'ERR');
    },
    rulesetHashLength(): number {
        return guard(() => String(RULESET_HASH).length, -1);
    },
    canvasCount(): number {
        return guard(() => document.querySelectorAll('canvas').length, -1);
    },
    appRootPresent(): number {
        return guard(() => (tid('app-root') ? 1 : 0), -1);
    },

    // ---- store / refs scalars ----
    phase(): string {
        return guard(() => String(st().phase), 'ERR');
    },
    hearts(): number {
        return guard(() => st().hearts, -1);
    },
    score(): number {
        return guard(() => st().score, -1);
    },
    dist(): number {
        return guard(() => st().dist, -1);
    },
    combo(): number {
        return guard(() => st().combo, -1);
    },
    dashPct(): number {
        return guard(() => Math.round(st().dashPct * 1000), -1);
    },
    shield(): number {
        return guard(() => (st().shield ? 1 : 0), -1);
    },
    runId(): number {
        return guard(() => st().runId, -1);
    },
    musicMode(): number {
        return guard(() => st().musicMode, -99);
    },
    muted(): number {
        return guard(() => (st().muted ? 1 : 0), -1);
    },
    resultDistance(): number {
        return guard(() => (st().result ? st().result.distance : -1), -1);
    },
    resultRank(): string {
        return guard(() => (st().result ? String(st().result.rank) : ''), 'ERR');
    },
    resultCause(): string {
        return guard(() => (st().result ? String(st().result.cause) : ''), 'ERR');
    },
    ghostDeltaAbsent(): number {
        return guard(() => (st().ghostDelta === null ? 1 : 0), -1);
    },
    refSeed(): string {
        return guard(() => String(refs.seed), 'ERR');
    },
    refSeedIsA(): number {
        return guard(() => (refs.seed === SEED_A ? 1 : 0), -1);
    },
    refDistance(): number {
        return guard(() => Math.floor(refs.distance), -1);
    },
    refPosXBelowLaneEdge(): number {
        return guard(() => (refs.pos.x < -3.2 ? 1 : 0), -1);
    },
    refLaneTarget(): number {
        return guard(() => refs.laneTarget, -99);
    },
    refGridTicketSet(): number {
        return guard(() => (refs.gridTicketId ? 1 : 0), -1);
    },

    // ---- live runner scalars ----
    runnerExists(): number {
        return guard(() => (activeSim.runner ? 1 : 0), -1);
    },
    runnerTick(): number {
        return guard(() => (activeSim.runner ? activeSim.runner.tick : -1), -1);
    },
    runnerAlive(): number {
        return guard(() => (activeSim.runner && activeSim.runner.alive ? 1 : 0), -1);
    },
    runnerSeedMatchesRef(): number {
        return guard(() => (activeSim.runner && activeSim.runner.seed === refs.seed ? 1 : 0), -1);
    },
    runnerLogLength(): number {
        return guard(() => (activeSim.runner ? activeSim.runner.log.length : -1), -1);
    },
    runnerDistanceEqualsStore(): number {
        return guard(() => (activeSim.runner && activeSim.runner.distance === st().dist ? 1 : 0), -1);
    },
    liveReplayEnvelopeValid(): number {
        return guard(() => {
            const rp = buildReplay('rb-probe');
            if (!rp) return -1;
            return validateReplayStructure(rp) === null ? 1 : 0;
        }, -2);
    },
    liveReplayFirstInputTick(): number {
        return guard(() => {
            const rp = buildReplay('rb-probe');
            if (!rp || rp.inputs.length === 0) return -1;
            return rp.inputs[0].tick;
        }, -2);
    },
    liveReplayTicksEqualsRunner(): number {
        return guard(() => {
            const rp = buildReplay('rb-probe');
            if (!rp || !activeSim.runner) return -1;
            return rp.ticks === activeSim.runner.tick ? 1 : 0;
        }, -2);
    },
    liveReplaySeedEqualsRunner(): number {
        return guard(() => {
            const rp = buildReplay('rb-probe');
            if (!rp || !activeSim.runner) return -1;
            return String(rp.seed) === String(activeSim.runner.seed) ? 1 : 0;
        }, -2);
    },

    // ---- DOM scalars ----
    heartOnCount(): number {
        return guard(() => tidAll('heart').filter((e) => String(e.className).includes('on')).length, -1);
    },
    heartCount(): number {
        return guard(() => tidAll('heart').length, -1);
    },
    hudDistanceText(): string {
        return guard(() => txt(tid('hud-distance')), 'ERR');
    },
    hudDashLabel(): string {
        return guard(() => txt(tid('hud-dash-label')), 'ERR');
    },
    hudPresent(): number {
        return guard(() => (tid('hud-root') ? 1 : 0), -1);
    },
    cineDotsOn(): number {
        return guard(() => tidAll('cine-dot').filter((e) => String(e.className).includes('on')).length, -1);
    },
    cineDotCount(): number {
        return guard(() => tidAll('cine-dot').length, -1);
    },
    cineLine(): string {
        return guard(() => txt(tid('cine-line')), 'ERR');
    },
    cinePresent(): number {
        return guard(() => (tid('cine-root') ? 1 : 0), -1);
    },
    menuPresent(): number {
        return guard(() => (tid('menu-root') ? 1 : 0), -1);
    },
    tutPresent(): number {
        return guard(() => (tid('tut-root') ? 1 : 0), -1);
    },
    tutDotsOn(): number {
        return guard(() => tidAll('tut-dot').filter((e) => String(e.className).includes('on')).length, -1);
    },
    tutDotCount(): number {
        return guard(() => tidAll('tut-dot').length, -1);
    },
    tutNextLabel(): string {
        return guard(() => txt(tid('tut-next')), 'ERR');
    },
    boardPresent(): number {
        return guard(() => (tid('board-root') ? 1 : 0), -1);
    },
    boardKicker(): string {
        return guard(() => txt(tid('board-kicker')), 'ERR');
    },
    boardTabsPresent(): number {
        return guard(() => (tid('board-tabs') ? 1 : 0), -1);
    },
    boardRowCount(): number {
        return guard(() => tidAll('board-row').length, -1);
    },
    boardEmptyPresent(): number {
        return guard(() => (tid('board-empty') ? 1 : 0), -1);
    },
    boardDistances(): string {
        return guard(() => tidAll('board-dist').map((e) => txt(e)).join('|'), 'ERR');
    },
    boardDescending(): number {
        return guard(() => {
            const v = tidAll('board-dist').map((e) => Number(txt(e).replace(/[^0-9-]/g, '')));
            if (v.length === 0) return -1;
            for (let i = 1; i < v.length; i += 1) if (!(v[i - 1] >= v[i])) return 0;
            return 1;
        }, -2);
    },
    boardDistinct(): number {
        return guard(() => {
            const v = tidAll('board-dist').map((e) => Number(txt(e).replace(/[^0-9-]/g, '')));
            return new Set(v).size === v.length && v.length > 1 ? 1 : 0;
        }, -2);
    },
    gameoverPresent(): number {
        return guard(() => (tid('gameover-root') ? 1 : 0), -1);
    },
    gameoverDistance(): string {
        return guard(() => txt(tid('gameover-distance')), 'ERR');
    },
    gameoverRank(): string {
        return guard(() => txt(tid('gameover-rank')), 'ERR');
    },
    gameoverCause(): string {
        return guard(() => txt(tid('gameover-cause')), 'ERR');
    },
    gameoverGridKicker(): number {
        return guard(() => (tid('gameover-grid-kicker') ? 1 : 0), -1);
    },
    gridPresent(): number {
        return guard(() => (tid('grid-panel') ? 1 : 0), -1);
    },
    gridEmptyText(): string {
        return guard(() => txt(tid('grid-empty')), 'ERR');
    },
    musicChipLabel(): string {
        return guard(() => txt(tid('music-chip')), 'ERR');
    },
    musicChipPresent(): number {
        return guard(() => (tid('music-chip') ? 1 : 0), -1);
    },
    muteIcon(): string {
        return guard(() => txt(tid('mute-btn')), 'ERR');
    },

    // ---- drivers: side effects, therefore only ever called from checkpoint setup ----
    dismissIntro(): number {
        return guard(() => {
            const skip = tid('cine-skip');
            if (!skip) return 0;
            (skip as HTMLElement).click();
            return 1;
        }, -1);
    },
    clickById(id: string): number {
        return guard(() => {
            const el = tid(id) as HTMLElement | null;
            if (!el) return 0;
            el.click();
            return 1;
        }, -1);
    },
    clickByIdAtFrame(id: string): Promise<number> {
        return atFrame(() => rb.clickById(id)).catch(() => -1);
    },
    key(k: string): number {
        return guard(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
            return 1;
        }, -1);
    },
    beginGridRun(seed: string): number {
        return guard(() => {
            st().startGridRun(seed as any, 'rb-ticket', 'rb-grid');
            return 1;
        }, -1);
    },
    beginGridRunAtFrame(seed: string): Promise<number> {
        return atFrame(() => rb.beginGridRun(seed)).catch(() => -1);
    },
    beginPractice(): number {
        return guard(() => {
            st().start();
            return 1;
        }, -1);
    },
    toMenu(): number {
        return guard(() => {
            st().reset();
            return 1;
        }, -1);
    },
    openBoardScreen(): number {
        return guard(() => {
            st().openBoard();
            return 1;
        }, -1);
    },
    openGridScreen(): number {
        return guard(() => {
            st().openGridScreen();
            return 1;
        }, -1);
    },
    setHearts(n: number): number {
        return guard(() => {
            useGameStore.setState({ hearts: n } as any);
            return 1;
        }, -1);
    },
    setMusicMode(i: number): number {
        return guard(() => {
            st().setMusicMode(i);
            return 1;
        }, -1);
    },
    toggleMute(): number {
        return guard(() => {
            st().toggleMute();
            return 1;
        }, -1);
    },
    waitPhase(p: string, ms: number): Promise<number> {
        return pollUntil(() => st().phase === p, ms).then((ok) => (ok ? 1 : 0));
    },
    waitRunner(ms: number): Promise<number> {
        return pollUntil(() => !!activeSim.runner, ms).then((ok) => (ok ? 1 : 0));
    },
    waitDead(ms: number): Promise<number> {
        return pollUntil(() => st().phase === 'dead' && !!st().result, ms).then((ok) => (ok ? 1 : 0));
    },
    waitTickAtLeast(n: number, ms: number): Promise<number> {
        return pollUntil(() => !!activeSim.runner && activeSim.runner.tick >= n, ms).then((ok) => (ok ? 1 : 0));
    },
    waitTid(id: string, ms: number): Promise<number> {
        return pollUntil(() => !!tid(id), ms).then((ok) => (ok ? 1 : 0));
    },
    waitHearts(ms: number): Promise<number> {
        return pollUntil(() => tidAll('heart').length > 0, ms).then((ok) => (ok ? 1 : 0));
    },
    waitBoardRows(n: number, ms: number): Promise<number> {
        return pollUntil(() => tidAll('board-dist').length >= n, ms).then((ok) => (ok ? 1 : 0));
    },
    // Polls the opening crawl's lit-dot count. A poll (not a fixed sleep) is what
    // keeps F11 load-tolerant: the crawl is driven by one 2.8s timer per beat, and
    // under a software rasteriser those timers fire late, so a sleep-then-read
    // would race the beat it is trying to observe.
    waitCineDots(n: number, ms: number): Promise<number> {
        return pollUntil(() => tidAll('cine-dot').filter((e) => String(e.className).includes('on')).length >= n, ms).then((ok) => (ok ? 1 : 0));
    },

    // ---- deterministic engine probes: pure functions of a pinned seed ----
    tier0Occupied(seed: string): number {
        return guard(() => {
            let n = 0;
            for (const r of spawnRows(seed)) if (r.index >= 3 && r.index <= 9) n += r.cells.filter((c) => c !== null).length;
            return n;
        }, -1);
    },
    tier0AtLeastOne(seed: string): number {
        return guard(() => (rb.tier0Occupied(seed) > 0 ? 1 : 0), -1);
    },
    firstOccupiedRow(seed: string): number {
        return guard(() => {
            for (const r of spawnRows(seed)) if (r.cells.some((c) => c !== null)) return r.index;
            return -1;
        }, -2);
    },
    mevReachable(seed: string, ticks: number): number {
        return guard(() => (walkKinds(seed, ticks).has('mev') ? 1 : 0), -1);
    },
    kindCount(seed: string, ticks: number): number {
        return guard(() => walkKinds(seed, ticks).size, -1);
    },
    belowMax(seed: string, n: number, draws: number): number {
        return guard(() => {
            const r = new Rng(seed);
            let mx = -1;
            for (let i = 0; i < draws; i += 1) {
                const v = r.below(n);
                if (v > mx) mx = v;
            }
            return mx;
        }, -99);
    },
    belowViolations(seed: string, n: number, draws: number): number {
        return guard(() => {
            const r = new Rng(seed);
            let c = 0;
            for (let i = 0; i < draws; i += 1) {
                const v = r.below(n);
                if (!(v >= 0 && v < n)) c += 1;
            }
            return c;
        }, -1);
    },
    laneTargetBelowFloor(seed: string, lefts: number, ticks: number): number {
        return guard(() => (laneWalk(seed, lefts, ticks).minTarget < -1 ? 1 : 0), -1);
    },
    laneTargetFloor(seed: string, lefts: number, ticks: number): number {
        return guard(() => laneWalk(seed, lefts, ticks).minTarget, -99);
    },
    playerXBelowLaneEdge(seed: string, lefts: number, ticks: number): number {
        return guard(() => (laneWalk(seed, lefts, ticks).minX < -3.2 ? 1 : 0), -1);
    },
    driveFirstLoggedTick(seed: string, ticks: number): number {
        return guard(() => {
            const r = driveRunner(seed, SCRIPT, ticks);
            return r.log.length ? r.log[0].tick : -1;
        }, -2);
    },
    driveScriptTickHonoured(seed: string, ticks: number): number {
        return guard(() => (rb.driveFirstLoggedTick(seed, ticks) === SCRIPT[0][0] ? 1 : 0), -1);
    },
    driveReplayAgrees(seed: string, ticks: number): number {
        return guard(() => {
            const r = driveRunner(seed, SCRIPT, ticks);
            const rp = { inputs: r.log.map((e) => ({ tick: e.tick, action: e.act })), ticks: r.tick };
            if (validateReplayStructure(rp as any) !== null) return -2;
            const res = driveRunner(seed, SCRIPT, ticks);
            return rp.ticks === res.tick ? 1 : 0;
        }, -3);
    },
    hashOrderStable(): number {
        return guard(() => {
            const a = hashCanonical({ alpha: '1', beta: '2', gamma: [1, 2, { zeta: 1, eta: 2 }] });
            const b = hashCanonical({ gamma: [1, 2, { eta: 2, zeta: 1 }], beta: '2', alpha: '1' });
            return a === b ? 1 : 0;
        }, -1);
    },
    hashLength(): number {
        return guard(() => String(hashCanonical({ alpha: '1' })).length, -1);
    },
    // Length only, and named for exactly that: this is a SHAPE sentinel that must
    // stay green under every defect (G10 leans on it), so it deliberately does not
    // compare the digest itself. rulesetHashIsPinned() below is the value leg.
    rulesetHashLengthOK(): number {
        return guard(() => (String(RULESET_HASH).length === 66 ? 1 : 0), -1);
    },
    // Value leg. RULESET_HASH is the on-chain ruleset commitment: it is a pure
    // function of the rule tables plus canonicalStringify, with no environment
    // input, so it is pinnable. Measured in Node by running this seed's own
    // modules: clean 0x54d84bdd..., D05 (the .sort() dropped from Object.keys)
    // 0x41ab5f13..., and identical to clean under D01/D02/D03/D04/D06/D07.
    // Red under D05 only, which is what makes F05 un-hackable by rewriting the
    // ruleset instead of restoring canonicalisation.
    rulesetHashIsPinned(): number {
        return guard(() => (String(RULESET_HASH) === '0x54d84bdd0fd1d3f602f3702bb251000aa02d04ee3f1ba2cb5ece6b3796a23531' ? 1 : 0), -1);
    },
    ghostAcceptsOwnHash(): number {
        return guard(() => {
            const inputs = [
                { tick: 12, action: 0 },
                { tick: 90, action: 2 },
                { tick: 200, action: 1 },
            ];
            const ticks = 400;
            const own = replayHash({ inputs, ticks } as any);
            return verifyGhostReplay(encodeInputsFlat(inputs), ticks, own) !== null ? 1 : 0;
        }, -1);
    },
    ghostRejectsTamperedTrace(): number {
        return guard(() => {
            const inputs = [
                { tick: 12, action: 0 },
                { tick: 90, action: 2 },
                { tick: 200, action: 1 },
            ];
            const tampered = [
                { tick: 12, action: 1 },
                { tick: 90, action: 2 },
                { tick: 200, action: 1 },
            ];
            const ticks = 400;
            const own = replayHash({ inputs, ticks } as any);
            return verifyGhostReplay(encodeInputsFlat(tampered), ticks, own) === null ? 1 : 0;
        }, -1);
    },
    classicEngineInProductionQuery(): number {
        return guard(() => (useClassicEngine(false, '?classic=1') ? 1 : 0), -1);
    },
    classicEngineInDevQuery(): number {
        return guard(() => (useClassicEngine(true, '?classic=1') ? 1 : 0), -1);
    },
    classicEngineInProductionPlain(): number {
        return guard(() => (useClassicEngine(false, '') ? 1 : 0), -1);
    },
    classicEngineInDevPlain(): number {
        return guard(() => (useClassicEngine(true, '') ? 1 : 0), -1);
    },
    rankAtBoundary(): string {
        return guard(() => rankFor(1000), 'ERR');
    },
    rankBelowBoundary(): string {
        return guard(() => rankFor(999), 'ERR');
    },
    boardEntriesStored(): number {
        return guard(() => storage.scores().length, -1);
    },
    boardStoredDescending(): number {
        return guard(() => {
            const v = storage.scores().map((s) => s.distance);
            if (v.length < 2) return -1;
            for (let i = 1; i < v.length; i += 1) if (!(v[i - 1] >= v[i])) return 0;
            return 1;
        }, -2);
    },
    introSeenFlag(): string {
        return guard(() => String(localStorage.getItem('bullrush_intro_seen')), 'ERR');
    },
    refCodeStored(): string {
        return guard(() => String(localStorage.getItem('bullrush_ref')), 'ERR');
    },
    musicModeStored(): string {
        return guard(() => String(localStorage.getItem('bullrush_music_mode')), 'ERR');
    },

    // ---- state-isolation tail (methodology 1.8.7) ----
    // Globals this bridge tolerates: the ones already on window when the bridge
    // loaded, this bridge itself, the per-checkpoint freeze slots the verifier
    // writes (__d4b_*), and the internals React/Vite/wagmi/automation tooling
    // install on their own. Anything else starting with "__" is residue a repair
    // is not supposed to leave behind.
    strayGlobalCount(): number {
        return guard(
            () =>
                Object.keys(window).filter(
                    (k) =>
                        k.startsWith('__') &&
                        !OWN_GLOBALS.has(k) &&
                        !/^__d4b_/.test(k) &&
                        !/^__(REACT_DEVTOOLS|react|vite|three|THREE|zone|core-js|postcss|wagmi|viem|pw|playwright|coverage|karma)/i.test(k),
                ).length,
            -1,
        );
    },
    appStorageKeysKnown(): number {
        return guard(() => {
            const known = ['bullrush_scores', 'bullrush_name', 'bullrush_ref', 'bullrush_intro_seen', 'bullrush_music_mode'];
            return Object.keys(localStorage)
                .filter((k) => k.indexOf('bullrush_') === 0)
                .every((k) => known.indexOf(k) >= 0)
                ? 1
                : 0;
        }, -1);
    },
    appStorageKeyCount(): number {
        return guard(() => Object.keys(localStorage).filter((k) => k.indexOf('bullrush_') === 0).length, -1);
    },
    nonAppStorageKeyCount(): number {
        return guard(() => Object.keys(localStorage).filter((k) => k.indexOf('bullrush_') !== 0 && !/^(__|wagmi|viem|WC_)/i.test(k)).length, -1);
    },
    straySessionKeyCount(): number {
        return guard(() => Object.keys(sessionStorage).filter((k) => !/^(__|wagmi|viem|WC_)/i.test(k)).length, -1);
    },
    sessionStorageCount(): number {
        return guard(() => Object.keys(sessionStorage).length, -1);
    },
    cookieCount(): number {
        return guard(() => (document.cookie ? document.cookie.split(';').filter((c) => c.trim()).length : 0), -1);
    },
    pathnameIsRoot(): number {
        return guard(() => (window.location.pathname === '/' ? 1 : 0), -1);
    },
    externalResourceCount(): number {
        return guard(() => {
            const o = window.location.origin;
            return performance
                .getEntriesByType('resource')
                .map((e) => String((e as any).name || ''))
                .filter((u) => u && u.indexOf(o) !== 0 && u.indexOf('data:') !== 0 && u.indexOf('blob:') !== 0).length;
        }, -1);
    },
    musicRequestCount(): number {
        return guard(
            () => performance.getEntriesByType('resource').filter((e) => String((e as any).name || '').indexOf('/assets/audio/music/') >= 0).length,
            -1,
        );
    },
};

(window as any).__rb = rb;
export type RbProbe = typeof rb;
