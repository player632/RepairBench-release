import Matter from 'matter-js';
import { get } from 'svelte/store';
import {
  balance,
  betAmount,
  betAmountOfExistingBalls,
  plinkoEngine,
  riskLevel,
  rowCount,
  totalProfitHistory,
  winRecords,
} from '$lib/stores/game';
import { isAnimationOn } from '$lib/stores/settings';

/**
 * Read-only instrumentation bridge. Exposes a deterministic snapshot of the
 * game stores and the physics world so checks can observe canvas-only state
 * without pixel assertions. Never writes application state.
 */
function read() {
  const history = get(totalProfitHistory);
  const engine = get(plinkoEngine);
  let engineBodies = -1;
  if (engine) {
    const world = (engine as unknown as { engine: Matter.Engine }).engine.world;
    engineBodies = Matter.Composite.allBodies(world).length;
  }
  return {
    balance: get(balance),
    betAmount: get(betAmount),
    inFlight: Object.keys(get(betAmountOfExistingBalls)).length,
    records: get(winRecords).length,
    historyLen: history.length,
    lastTotalProfit: history.length ? history[history.length - 1] : null,
    riskLevel: get(riskLevel),
    rowCount: get(rowCount),
    animationOn: get(isAnimationOn),
    engineBodies,
    engineRunning: engine !== null,
  };
}

if (typeof window !== 'undefined') {
  (window as unknown as { __plinko: { read: typeof read } }).__plinko = { read };
}
