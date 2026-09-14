<script lang="ts">
	import { untrack } from 'svelte';
	import { linear, cubicOut } from 'svelte/easing';
	import { getGameContext } from '$lib/store/game.svelte';
	import { trackLayout, elementToPath } from '$lib/utils';

	const { tutorial, overlay, inventory, device, loot } = getGameContext();

	function traceDraw(
		node: SVGPathElement,
		{ speed = 2.5, easing = linear }: { speed?: number; easing?: (t: number) => number } = {}
	) {
		const len = node.getTotalLength();
		return {
			duration: len / speed,
			easing,
			css: (t: number) => `stroke-dasharray: 1 1; stroke-dashoffset: ${1 - t}`
		};
	}

	type HoleShape = { id: string; d: string; cx: number; cy: number };

	function iris(_node: Element, { cx, cy }: { cx: number; cy: number }) {
		const reduce = device.prefersReducedMotion;
		return {
			duration: reduce ? 0 : 300,
			easing: cubicOut,
			css: (t: number) =>
				`transform: translate(${cx}px, ${cy}px) scale(${t}) translate(${-cx}px, ${-cy}px)`
		};
	}

	// Latch the quest-sheet open for the mobile 'open-quests' step, whose predicate completes on the
	// subsequent close. The reactive sheet flag is the only "was opened" signal, so we bridge it here.
	$effect(() => {
		if (!tutorial.active) return;
		if (overlay.questSheet) untrack(() => tutorial.noteQuestSheetOpened());
	});

	const FRAME_W = 1.5;

	const RING_PAD = 6;

	const RING_PAD_MOBILE = 4;

	const ITEM_RING_PAD = 3;

	const EXCLUDE_RADIUS = 6;

	let holes = $state<HoleShape[]>([]);
	let frameHoles = $state<HoleShape[]>([]);
	let excludeHoles = $state<string[]>([]);
	let rings = $state<string[]>([]);

	const revealIds = $derived(tutorial.active ? (tutorial.step?.targets ?? []) : []);
	const pulseIds = $derived(
		tutorial.active ? (tutorial.step?.pulse ?? tutorial.step?.targets ?? []) : []
	);
	const excludeIds = $derived(tutorial.active ? (tutorial.step?.exclude ?? []) : []);
	const itemPulseDefs = $derived(tutorial.active ? (tutorial.step?.itemPulse ?? []) : []);

	// pointer-transparent via `body.tutorial-active`; only revealed targets get it back.
	$effect(() => {
		const on = tutorial.active;
		document.body.classList.toggle('tutorial-active', on);
		return () => document.body.classList.remove('tutorial-active');
	});

	// Resolve every referenced id by `data-tut`, re-measure on entry and on any layout shift.
	// Only reveal ∪ pulse become interactive; excluded ids are measured but stay dimmed.
	$effect(() => {
		void inventory.items.length;
		void loot.phase;

		const interactiveIds = Array.from(new Set([...revealIds, ...pulseIds]));
		const allIds = Array.from(new Set([...interactiveIds, ...excludeIds]));
		if (allIds.length === 0 && itemPulseDefs.length === 0) {
			holes = [];
			frameHoles = [];
			excludeHoles = [];
			rings = [];
			return;
		}

		const resolved = new Map<string, HTMLElement>();
		for (const id of allIds) {
			const el = document.querySelector<HTMLElement>(`[data-tut="${id}"]`);
			if (el) resolved.set(id, el);
		}

		const interactiveEls: HTMLElement[] = [];
		for (const id of interactiveIds) {
			const el = resolved.get(id);
			if (el) {
				el.classList.add('tut-active');
				interactiveEls.push(el);
			}
		}

		// Item rings address a moving item by defId, so one def can resolve to several live nodes.
		const itemEls = itemPulseDefs.flatMap((def) =>
			Array.from(document.querySelectorAll<HTMLElement>(`[data-tut-item="${def}"]`))
		);

		const pathsOf = (ids: string[], pad = 0, forceRadius?: number): string[] =>
			ids
				.map((id) => resolved.get(id))
				.filter((el): el is HTMLElement => !!el)
				.map((el) => elementToPath(el, pad, forceRadius));

		// Like pathsOf but keyed by target id and carrying each shape's viewport centre. The id keys
		// the {#each} so the iris transition plays only for newly-revealed zones — zones that persist
		// across steps keep their node and don't re-animate. Deduped so keys stay unique.
		const shapesOf = (ids: string[], pad = 0, forceRadius?: number): HoleShape[] =>
			Array.from(new Set(ids))
				.map((id) => [id, resolved.get(id)] as const)
				.filter((pair): pair is [string, HTMLElement] => !!pair[1])
				.map(([id, el]) => {
					const r = el.getBoundingClientRect();
					return {
						id,
						d: elementToPath(el, pad, forceRadius),
						cx: r.left + r.width / 2,
						cy: r.top + r.height / 2
					};
				});

		const ringPad = device.isCoarsePointer ? RING_PAD_MOBILE : RING_PAD;

		const measure = () => {
			holes = shapesOf(interactiveIds);
			frameHoles = shapesOf(revealIds);
			excludeHoles = pathsOf(excludeIds, 0, EXCLUDE_RADIUS);
			rings = [
				...pathsOf(pulseIds, ringPad),
				...itemEls.map((el) => elementToPath(el, ITEM_RING_PAD))
			];
		};

		const stop = trackLayout(() => [...resolved.values(), ...itemEls], measure);

		return () => {
			for (const el of interactiveEls) el.classList.remove('tut-active');
			stop();
		};
	});
</script>

{#if tutorial.active}
	<!-- Cosmetic layer only: pointer-transparent, so clicks fall through the hole onto the
	     one re-enabled target underneath  -->
	<svg
		class="pointer-events-none fixed inset-0 z-30 h-full w-full"
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<pattern
				id="tut-hatch"
				width="11"
				height="11"
				patternUnits="userSpaceOnUse"
				patternTransform="rotate(35)"
			>
				<rect width="11" height="11" fill="rgba(7,10,16,0.82)" />
				<line x1="0" y1="0" x2="0" y2="11" stroke="rgba(255,255,255,0.025)" stroke-width="6" />
			</pattern>

			<!-- Erodes the rasterised union of the reveal shape, so the inner edge of the frame band
			     follows the combined contour with no seam where adjacent cuts (tab + panel) meet. -->
			<filter id="tut-erode">
				<feMorphology operator="erode" radius={FRAME_W} />
			</filter>

			<!-- Soft gold halo around the pulsing goal ring. Generous region so the blur isn't clipped. -->
			<filter id="tut-ring-glow" x="-50%" y="-50%" width="200%" height="200%">
				<feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffb800" flood-opacity="0.85" />
			</filter>

			<mask id="tut-mask">
				<rect width="100%" height="100%" fill="white" />
				{#each holes as hole (hole.id)}
					<g in:iris={{ cx: hole.cx, cy: hole.cy }}>
						<path d={hole.d} fill="black" />
					</g>
				{/each}
				<!-- Carve excluded sub-regions back out: re-cover them with hatch, keep them dimmed. -->
				{#each excludeHoles as ex, i (i)}
					<path d={ex} fill="white" />
				{/each}
			</mask>

			<!-- Frame band = union(reveal) minus erode(union(reveal)). Both layers are rasterised
			     unions, so touching cuts merge with no internal line. -->
			<mask id="tut-frame">
				{#each frameHoles as hole (hole.id)}
					<g in:iris={{ cx: hole.cx, cy: hole.cy }}>
						<path d={hole.d} fill="white" />
					</g>
				{/each}
				<g filter="url(#tut-erode)">
					{#each frameHoles as hole (hole.id)}
						<g in:iris={{ cx: hole.cx, cy: hole.cy }}>
							<path d={hole.d} fill="black" />
						</g>
					{/each}
				</g>
			</mask>
		</defs>

		<rect width="100%" height="100%" fill="url(#tut-hatch)" mask="url(#tut-mask)" />

		<!-- Static frame around the combined revealed shape — matches the quest card border (bg-white/20). -->
		<rect width="100%" height="100%" fill="#ffffff" fill-opacity="0.08" mask="url(#tut-frame)" />

		<!-- Pulsing gold ring on the goal target(s) only — padded off the edge and softly glowing.
		     Keyed on the step index so each step entry tears the rings down and re-mounts them, letting
		     `in:draw` trace the goal contour before the idle pulse takes over. -->
		{#key tutorial.index}
			{#each rings as ring, i (i)}
				<path
					class="tut-ring"
					d={ring}
					pathLength="1"
					fill="none"
					stroke="#ffb800"
					stroke-width="1.5"
					filter="url(#tut-ring-glow)"
					in:traceDraw|global={{ speed: 2.5 }}
				/>
			{/each}
		{/key}
	</svg>
{/if}

<style>
	.tut-ring {
		animation: tut-ring-pulse 1.5s ease-in-out 0.46s infinite;
	}

	@keyframes tut-ring-pulse {
		0%,
		100% {
			opacity: 0.55;
			stroke-width: 1.25;
		}
		50% {
			opacity: 1;
			stroke-width: 2.5;
		}
	}
</style>
