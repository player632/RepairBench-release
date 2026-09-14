// Pure backdrop decision logic — no DOM or engine imports, so it runs headless under vite-node.

import type { EngineParams } from './engine';
import type { GameStatus } from '$lib/store/game-loop.svelte';
import type { SceneDef, SceneFxParams } from './scenes';
import { SCENES, STATUS_SCENE, STORM_STAGE } from './scenes';

export function resolveScene(status: GameStatus, stage: number): SceneDef {
	const base = STATUS_SCENE[status];
	if (base !== 'session') return SCENES[base];
	return stage >= STORM_STAGE ? SCENES.storm : SCENES.session;
}

export interface PanelParams {
	intensity: number;
	fogAmt: number;
	bloomAmt: number;
	dofAmt: number;
	exposure: number;
}

export const PARTICLE_KEYS = ['ash', 'dust'] as const;

type FxDerivedKeys = 'tonemapMode' | 'focusMode' | 'vhsAmt' | 'turb' | 'parallaxAmt';

export function normalizeParams(p: PanelParams): Omit<EngineParams, FxDerivedKeys> {
	return {
		intensity: p.intensity / 100,
		fogAmt: (p.fogAmt / 100) * 0.95,
		bloomAmt: (p.bloomAmt / 100) * 1.5,
		dofAmt: p.dofAmt / 100,
		exposure: p.exposure / 100
	};
}

export function normalizeFxParams(
	fxParams: SceneFxParams | undefined
): Pick<EngineParams, FxDerivedKeys> {
	const fx = fxParams ?? {};
	const turb: Record<string, number> = {};
	for (const k of PARTICLE_KEYS) turb[k] = (fx[k]?.turbulence ?? 0) * 0.002;
	return {
		tonemapMode: fx.tonemap?.mode ?? 0,
		focusMode: fx.focus?.mode ?? 0,
		vhsAmt: (fx.vhs?.strength ?? 55) * 0.01,
		turb,
		parallaxAmt: (fx.parallax?.strength ?? 50) * 0.001
	};
}

export interface BackdropEnv {
	webgpuAvailable: boolean;
	reducedMotion: boolean;
}

export interface BackdropProfile {
	// true → drive the WebGPU engine; false → show the static cover image.
	animate: boolean;
}

// WebGPU-only: the engine is the single render path. We animate only when WebGPU exists AND the
// user hasn't asked to reduce motion; either gap takes the static-image floor.
export function resolveProfile(env: BackdropEnv): BackdropProfile {
	return { animate: env.webgpuAvailable && !env.reducedMotion };
}
