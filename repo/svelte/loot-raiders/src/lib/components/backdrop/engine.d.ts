/// <reference types="@webgpu/types" />

// Public, typed surface of the frozen vendor engine in ./engine.js.

export interface EngineParams {
	intensity: number;
	fogAmt: number;
	bloomAmt: number;
	dofAmt: number;
	exposure: number;
	// Tonemap curve index: 0 ACES · 2 filmic · 3 Reinhard (1/AgX not ported). Defaults 0.
	tonemapMode: number;
	// Focus family mode (only read while the 'focus' toggle is on): 0 radial (centre) · 1 tilt-shift ·
	// 2 depth (samples the depth map). Defaults 0.
	focusMode: number;
	// VHS artifact strength 0..1 (only read while the 'vhs' toggle is on). Defaults 0.55.
	vhsAmt: number;
	// Per-particle-type turbulence (engine scale), keyed by particle toggle name; missing = 0.
	turb: Record<string, number>;
	// Depth-parallax reach (engine scale, ~0..0.1 uv); only sampled while the 'parallax' toggle is on
	// and a depth map is set via setDepth. Defaults 0.05 (matches the old fixed shift).
	parallaxAmt: number;
}

export interface EngineState {
	time: number;
	mouse: [number, number];
	wind: number;
	glitch: number;
	toggles: Record<string, boolean>;
	params: EngineParams;
}

export interface Engine {
	device: GPUDevice;
	state: EngineState;
	backend: 'webgpu';
	loadTexture(key: string, url: string): void;
	setActive(key: string): void;
	setTransition(modeIdx: number, durSec: number): void;
	// Key of the depth map (loaded via loadTexture) the parallax effect samples; null clears it.
	setDepth(key: string | null): void;
	setMouse(x: number, y: number): void;
	setToggles(toggles: Record<string, boolean>): void;
	setParams(params: Partial<EngineParams>): void;
	setGlitch(v: number): void;
	transitioning(): boolean;
	tick(dt: number): void;
	dispose(): void;
}

export function createEngine(canvas: HTMLCanvasElement): Promise<Engine>;
