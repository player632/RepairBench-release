import type { PanelParams } from './backdrop-params';
import type { GameStatus } from '$lib/store/game-loop.svelte';

export const ALL_TOGGLE_KEYS = [
	'grade',
	'warm',
	'scan',
	'vignette',
	'bloom',
	'glitch',
	'fog',
	'tonemap',
	'halation',
	'kenburns',
	'parallax',
	'ash',
	'dust',
	'vhs',
	'focus'
] as const;

export type ToggleKey = (typeof ALL_TOGGLE_KEYS)[number];

export type SceneId = 'menu' | 'session' | 'storm';

export interface SceneFxParams {
	tonemap?: { mode: number }; // curve index: 0 ACES · 2 filmic · 3 Reinhard
	focus?: { mode: number }; // focus family: 0 radial · 1 tilt-shift · 2 depth
	vhs?: { strength: number }; // panel 0–100
	parallax?: { strength: number }; // depth-parallax reach, panel 0–100
	ash?: { turbulence: number }; // panel 0–100
	dust?: { turbulence: number }; // panel 0–100
}

export interface SceneDef {
	id: SceneId;
	image: string; // background image URL — the engine's texture source; the grade is applied to this
	staticImage?: string; // optional graded still for the non-animated path; falls back to `image` when unset
	depth?: string; // optional depth-map URL; the 'parallax' effect samples its red channel
	fx: ToggleKey[]; // enabled effect toggles
	params: PanelParams; // PANEL scale, normalized at apply time
	fxParams?: SceneFxParams; // optional per-effect params (Studio), normalized at apply time
	dim: number; // 0..1 backdrop dimming, default 0
}

export const TRANSITION = { mode: 2, dur: 0.3 } as const;
export const GLITCH = { intervalMs: 5000, strength: 10 } as const;

export const SCENES: Record<SceneId, SceneDef> = {
	menu: {
		id: 'menu',
		image: '/assets/looks/ember-road.png',
		// Graded still of the menu look (captured from the canvas' GPU buffer, plain sRGB). Serves the
		// non-animated fallback and the preloader's fullscreen final frame; never fed back as a texture.
		staticImage: '/assets/preload/menu-graded.webp',
		depth: '/assets/depth/ember-road-depth.png',
		fx: [
			'bloom',
			'grade',
			'warm',
			'vignette',
			'fog',
			'kenburns',
			'parallax',
			'glitch',
			'dust',
			'vhs',
			'focus'
		],
		params: {
			intensity: 21,
			fogAmt: 16,
			bloomAmt: 18,
			dofAmt: 55,
			exposure: 108
		},
		fxParams: {
			focus: { mode: 1 },
			parallax: { strength: 6 },
			vhs: { strength: 16 },
			dust: { turbulence: 15 }
		},
		dim: 0
	},
	// The Night glow look (depth-parallax night scene with a halation/bloom glow stack), now the live
	// session scene. Ported from the Studio 'night-glow' look; fxParams pruned to what the engine reads
	// for this fx set — only parallax.strength (depth reach) and ash.turbulence survive.
	session: {
		id: 'session',
		image: '/assets/looks/session.png',
		depth: '/assets/depth/night-depth.png',
		fx: ['kenburns', 'parallax', 'halation', 'glitch', 'vignette', 'scan', 'ash', 'warm', 'bloom'],
		params: {
			intensity: 22,
			fogAmt: 26,
			bloomAmt: 40,
			dofAmt: 55,
			exposure: 118
		},
		fxParams: {
			parallax: { strength: 6 },
			ash: { turbulence: 12 }
		},
		dim: 0.25
	},
	// The Storm look (depth-parallax + filmic tonemap): the late-session scene, swapped in by resolveScene
	// from wave STORM_STAGE onward. A self-contained look with its full fx/fxParams. Boot-loaded with the
	// rest so the mid-session swap dissolves without a texture gap.
	storm: {
		id: 'storm',
		image: '/assets/looks/stormwatch.png',
		depth: '/assets/depth/stormwatch-depth.png',
		fx: [
			'scan',
			'grade',
			'ash',
			'kenburns',
			'parallax',
			'tonemap',
			'fog',
			'vignette',
			'warm',
			'glitch'
		],
		params: {
			intensity: 44,
			fogAmt: 30,
			bloomAmt: 16,
			dofAmt: 50,
			exposure: 106
		},
		fxParams: {
			parallax: { strength: 5 },
			ash: { turbulence: 24 },
			tonemap: { mode: 2 }
		},
		dim: 0
	}
};

export const STORM_STAGE = 2;

export const SCENE_IMAGE_URLS: readonly string[] = [SCENES.menu.image, SCENES.session.image];

export const STATUS_SCENE: Record<GameStatus, SceneId> = {
	idle: 'menu',
	playing: 'session',
	paused: 'menu',
	tutorial: 'session',
	over: 'menu'
};

// Only the enabled keys: setToggles replaces the whole set and the engine reads an absent key as off.
export function togglesFromFx(fx: readonly ToggleKey[]): Record<string, boolean> {
	const out: Record<string, boolean> = {};
	for (const k of fx) out[k] = true;
	return out;
}
