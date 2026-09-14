<script lang="ts">
	import type { Engine } from './engine';
	import { getGameContext } from '$lib/store/game.svelte';
	import { GLITCH, SCENES, TRANSITION, togglesFromFx, type SceneDef } from './scenes';
	import {
		normalizeFxParams,
		normalizeParams,
		resolveProfile,
		resolveScene
	} from './backdrop-params';

	let { revealed = false }: { revealed?: boolean } = $props();

	const game = getGameContext();

	const reducedMotion = game.device.prefersReducedMotion;

	let useStatic = $state(reducedMotion);

	// The engine is purely decorative; the wrapper is the bridge that reads the phase and drives it.
	let engine = $state<Engine | undefined>();

	const depthKey = (id: SceneDef['id']) => `${id}:depth`;

	const scene = $derived(resolveScene(game.gameLoop.status, game.quest.currentStage));

	let glitchAmp = 0;
	let glitchAcc = 0;
	let glitchNext = 3;

	function fireGlitch(strength: number) {
		glitchAmp = Math.min(1, strength / 100 + 0.15);
		glitchAcc = 0;
	}

	function backdrop(node: HTMLCanvasElement) {
		let raf = 0;
		let last = performance.now();
		let dead = false;
		let eng: Engine | undefined;

		const loop = (now: number) => {
			let dt = (now - last) / 1000;
			last = now;
			if (dt > 0.1) dt = 0.1;

			const edt = revealed ? dt : 0;

			if (eng && game.gameLoop.status !== 'tutorial') {
				if (scene.fx.includes('glitch')) {
					glitchAcc += edt;
					if (glitchAcc >= glitchNext) {
						glitchNext = Math.max(0.4, (GLITCH.intervalMs / 1000) * (0.7 + Math.random() * 0.6));
						fireGlitch(GLITCH.strength);
					}
				}
				if (glitchAmp > 0) glitchAmp = Math.max(0, glitchAmp - edt * 3.0);
				eng.setGlitch(glitchAmp);
				eng.tick(edt);
			}
			raf = requestAnimationFrame(loop);
		};

		const onPointer = (e: PointerEvent) => {
			if (!revealed) return;
			eng?.setMouse(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
		};

		const onVisibility = () => {
			if (document.hidden) {
				cancelAnimationFrame(raf);
				raf = 0;
			} else if (eng && !raf && !dead) {
				last = performance.now();
				raf = requestAnimationFrame(loop);
			}
		};

		(async () => {
			if (!resolveProfile({ webgpuAvailable: !!navigator.gpu, reducedMotion }).animate) {
				useStatic = true;
				return;
			}
			try {
				const { createEngine } = await import('./engine');
				eng = await createEngine(node);
				if (dead) {
					eng.dispose();
					eng = undefined;
					return;
				}

				for (const s of Object.values(SCENES)) {
					eng.loadTexture(s.id, s.image);
					if (s.depth) eng.loadTexture(depthKey(s.id), s.depth);
				}

				last = performance.now();
				if (!document.hidden) raf = requestAnimationFrame(loop);
				document.addEventListener('visibilitychange', onVisibility);
				window.addEventListener('pointermove', onPointer);

				engine = eng;
			} catch (e) {
				console.error('living-background: engine init failed', e);
				useStatic = true;
			}
		})();

		return () => {
			dead = true;
			cancelAnimationFrame(raf);
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('pointermove', onPointer);
			eng?.dispose();
			eng = undefined;
			engine = undefined;
		};
	}

	$effect(() => {
		const eng = engine;
		const s = scene;
		if (!eng) return;
		eng.setDepth(s.depth ? depthKey(s.id) : null);
		eng.setTransition(TRANSITION.mode, TRANSITION.dur);
		eng.setToggles(togglesFromFx(s.fx));
		eng.setParams({ ...normalizeParams(s.params), ...normalizeFxParams(s.fxParams) });
		eng.setActive(s.id);
	});
</script>

{#if useStatic}
	<img
		src={scene.staticImage ?? scene.image}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 h-full w-full object-cover"
	/>
{:else}
	<canvas
		{@attach backdrop}
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 h-full w-full"
	></canvas>
{/if}

<!-- Per-scene dimming for UI-legibility testing; defaults to 0 (no dim). -->
{#if scene.dim > 0}
	<div
		class="pointer-events-none absolute inset-0 bg-black"
		style="opacity: {scene.dim}"
		aria-hidden="true"
	></div>
{/if}
