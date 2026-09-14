<script lang="ts">
	import { untrack } from 'svelte';
	import { getGameContext } from '$lib/store/game.svelte';
	import { trackLayout } from '$lib/utils';
	import type { GestureKind } from '$lib/store/tutorial.svelte';

	const { tutorial, audio, device, inventory, loot, interaction } = getGameContext();

	const GESTURE_LABEL: Record<GestureKind, string> = {
		tap: 'Tap',
		drag: 'Drag',
		'double-tap': '2× Tap',
		hold: 'Hold'
	};

	function badgeToGesture(badge: string): GestureKind {
		switch (badge) {
			case 'drag':
				return 'drag';
			case 'long-press':
				return 'hold';
			default:
				return 'tap';
		}
	}

	const isMobile = $derived(device.isCoarsePointer);

	const mobileGestures = $derived.by<GestureKind[]>(() => {
		const s = tutorial.step;
		if (!s) return [];
		if (s.gestures?.length) return s.gestures;
		return [badgeToGesture(s.badge)];
	});

	type MouseKind = 'left' | 'right' | 'drag';

	const MOUSE_BADGE: Record<string, MouseKind> = {
		click: 'left',
		'right-click': 'right',
		drag: 'drag'
	};

	const mouseKind = $derived(tutorial.step ? (MOUSE_BADGE[tutorial.step.badge] ?? null) : null);

	const segments = $derived(Array.from({ length: tutorial.total }, (_, i) => i));

	$effect(() => {
		if (!tutorial.active) return;
		void tutorial.index;
		untrack(() => tutorial.enterStep());
	});

	// Advance when the step's predicate holds (ADR-0002). The manual path (player acts) and
	// the skip path (autoPerform) both converge here, so completion has a single owner.
	$effect(() => {
		if (!tutorial.active) return;
		if (tutorial.stepComplete) {
			untrack(() => tutorial.advance());
		}
	});

	function go() {
		audio.play('click');
		tutorial.advance();
	}

	function skip() {
		audio.play('click');
		tutorial.skip();
	}

	function skipAll() {
		audio.play('click');
		tutorial.skipTutorial();
	}

	type Placement = 'right' | 'left' | 'top' | 'bottom';
	interface Pos {
		x: number;
		y: number;
		placement: Placement;
		caret: number;
	}

	const caretPos: Record<Placement, string> = {
		right: '-left-[7px] top-[var(--c)] -mt-[7px] border-b-[0.5px] border-l-[0.5px]',
		left: '-right-[7px] top-[var(--c)] -mt-[7px] border-t-[0.5px] border-r-[0.5px]',
		bottom: '-top-[7px] left-[var(--c)] -ml-[7px] border-t-[0.5px] border-l-[0.5px]',
		top: '-bottom-[7px] left-[var(--c)] -ml-[7px] border-r-[0.5px] border-b-[0.5px]'
	};

	const anchorId = $derived(
		tutorial.active ? (tutorial.step?.pulse?.[0] ?? tutorial.step?.targets?.[0] ?? null) : null
	);

	const itemAnchorDef = $derived(
		tutorial.active ? (tutorial.step?.itemAnchor ?? tutorial.step?.itemPulse?.[0] ?? null) : null
	);

	let cardEl = $state<HTMLElement>();
	let pos = $state<Pos | null>(null);

	const ready = $derived((!anchorId && !itemAnchorDef) || pos !== null);
	const posStyle = $derived(
		pos
			? `left:0;top:0;transform:translate(${pos.x}px,${pos.y}px)`
			: 'left:50%;top:50%;transform:translate(-50%,-50%)'
	);

	function place(a: DOMRect, cw: number, ch: number): Pos {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const M = 12;
		const GAP = 16;
		const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));
		const cx = a.left + a.width / 2;
		const cy = a.top + a.height / 2;

		let placement: Placement;
		if (vw - a.right >= cw + GAP + M) placement = 'right';
		else if (a.left >= cw + GAP + M) placement = 'left';
		else if (vh - a.bottom >= ch + GAP + M) placement = 'bottom';
		else placement = 'top';

		let x: number;
		let y: number;
		let caret: number;
		if (placement === 'right' || placement === 'left') {
			x = placement === 'right' ? a.right + GAP : a.left - GAP - cw;
			y = clamp(cy - ch / 2, M, vh - ch - M);
			caret = clamp(cy - y, 16, ch - 16);
		} else {
			y = placement === 'bottom' ? a.bottom + GAP : a.top - GAP - ch;
			x = clamp(cx - cw / 2, M, vw - cw - M);
			caret = clamp(cx - x, 16, cw - 16);
		}
		return { x, y, placement, caret };
	}

	$effect(() => {
		if (!tutorial.active || isMobile) {
			pos = null;
			return;
		}
		const id = anchorId;
		const itemDef = itemAnchorDef;
		void tutorial.index;

		void inventory.items.length;
		void loot.phase;
		void interaction.status;
		const card = cardEl;
		if ((!id && !itemDef) || !card) {
			pos = null;
			return;
		}

		const findAnchor = (): HTMLElement | null =>
			itemDef
				? document.querySelector<HTMLElement>(`[data-tut-item="${itemDef}"]`)
				: document.querySelector<HTMLElement>(`[data-tut="${id}"]`);

		const measure = () => {
			const el = findAnchor();
			if (!el) {
				pos = null;
				return;
			}
			const a = el.getBoundingClientRect();
			const c = card.getBoundingClientRect();
			pos = place(a, c.width, c.height);
		};

		return trackLayout(() => {
			const el = findAnchor();
			return el ? [card, el] : [card];
		}, measure);
	});
</script>

{#if tutorial.active && tutorial.step}
	{#if isMobile}
		<div
			class="fixed right-3 bottom-3 z-40 max-h-[calc(100dvh-1.5rem)] w-[min(480px,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-accent/40 bg-gradient-to-b from-panel-top to-panel-bottom px-3.5 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-sm"
		>
			<div class="mb-2 flex items-center gap-2.5">
				{@render progress()}
				{#if tutorial.isActionStep}
					<button
						onclick={skip} data-testid="tut-skip"
						class="shrink-0 font-mono text-[10px] font-medium tracking-[0.1em] text-accent uppercase transition-colors active:text-accent/70"
					>
						Skip step ›
					</button>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				<div class="flex shrink-0 items-start gap-2">
					{#each mobileGestures as g (g)}
						{@render gestureDemo(g)}
					{/each}
				</div>

				<div class="min-w-0 flex-1">
					<h2
						class="font-['Saira_Condensed'] text-base font-extrabold tracking-wide text-white uppercase"
					>
						{tutorial.step.title}
					</h2>
					<p class="mt-0.5 text-[11.5px] leading-snug text-[#a9b6c6]">
						{tutorial.step.description}
					</p>
				</div>

				{#if !tutorial.isActionStep}
					<button
						onclick={go} data-testid="tut-cta"
						class="shrink-0 self-center rounded-md bg-primary px-4 py-1.5 font-['Saira_Condensed'] text-sm font-extrabold tracking-wide whitespace-nowrap text-primary-foreground transition-all active:scale-[0.99]"
					>
						{tutorial.step.cta}
					</button>
				{/if}
			</div>

			<div class="mt-1 flex justify-end">
				<button
					onclick={skipAll} data-testid="tut-skip-all"
					class="shrink-0 font-mono text-[8px] font-medium tracking-[0.1em] text-[#8291a3] uppercase underline decoration-dotted underline-offset-2 transition-colors active:text-[#c3ccd8]"
				>
					Skip tutorial
				</button>
			</div>
		</div>
	{:else}
		<div
			bind:this={cardEl}
			class="fixed z-40 w-[280px] transition-opacity duration-200 2xl:w-[310px] {ready
				? 'pointer-events-auto opacity-100'
				: 'pointer-events-none opacity-0'}"
			style={posStyle}
		>
			{#if pos}
				<span
					class="pointer-events-none absolute z-20 h-3.5 w-3.5 rotate-45 border-accent/40 bg-panel-top {caretPos[
						pos.placement
					]}"
					style="--c:{pos.caret}px"
				></span>
			{/if}

			<div
				class="relative z-10 rounded-2xl border border-accent/40 bg-gradient-to-b from-panel-top to-panel-bottom p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
			>
				<div class="mb-2 flex items-center gap-2">
					{@render progress()}
				</div>
				<div class="flex items-start justify-between gap-2 pr-1">
					<div class="flex">
						{#if mouseKind}
							{@render mouseDemo(mouseKind)}
						{/if}

						<h2
							class="font-['Saira_Condensed'] text-base font-extrabold tracking-wide text-white uppercase 2xl:text-lg"
						>
							{tutorial.step.title}
						</h2>
					</div>
				</div>

				<p class="mt-1 text-[11.5px] leading-snug text-[#a9b6c6] 2xl:text-[12px]">
					{tutorial.step.description}
				</p>
				<div class="mt-2.5 flex w-full items-center justify-between gap-2">
					<button
						onclick={skipAll} data-testid="tut-skip-all"
						class="shrink-0 font-mono text-[10px] font-medium tracking-[0.1em] text-[#8291a3] uppercase underline decoration-dotted underline-offset-2 transition-colors hover:text-[#c3ccd8]"
					>
						Skip tutorial
					</button>
					{#if tutorial.isActionStep}
						<button
							onclick={skip} data-testid="tut-skip"
							class="shrink-0 font-mono text-[10px] font-medium tracking-[0.1em] text-accent uppercase transition-colors hover:text-accent/70"
						>
							Skip step ›
						</button>
					{:else}
						<button
							onclick={go} data-testid="tut-cta"
							class="shrink-0 rounded-md bg-primary px-4 py-1.5 font-['Saira_Condensed'] text-sm font-extrabold tracking-wide text-primary-foreground transition-all hover:bg-primary-hover active:scale-[0.99]"
						>
							{tutorial.step.cta}
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{/if}

{#snippet progress()}
	<span class="shrink-0 font-mono text-[10px] font-medium tracking-[0.16em] text-accent uppercase"
		 data-testid="tut-step">Step {tutorial.stepNumber}/{tutorial.total}</span
	>
	<div class="flex flex-1 items-center gap-[5px]">
		{#each segments as i (i)}
			<span
				class="h-[5px] flex-1 rounded-full transition-colors {i <= tutorial.index
					? 'bg-accent'
					: 'bg-[rgba(190,205,225,0.16)]'}"
			></span>
		{/each}
	</div>
{/snippet}

{#snippet mouseDemo(kind: MouseKind)}
	<div class=" flex shrink-0 flex-col items-center gap-1 rounded-lg pr-2">
		<div
			class="overflow-hidden rounded-md p-1 {kind === 'right' ? '-scale-x-100' : ''} bg-gray-800"
		>
			<img
				src="/assets/ui/icon-actions.webp"
				alt=""
				draggable="false"
				class="block h-5 w-5 object-contain {kind === 'drag'
					? 'tut-m-drag'
					: 'tut-m-press'} motion-reduce:animate-none!"
			/>
		</div>
	</div>
{/snippet}

{#snippet gestureDemo(kind: GestureKind)}
	{@const gold = kind === 'double-tap' || kind === 'hold'}
	<div
		class="flex flex-col items-center gap-1 rounded-lg border px-2.5 py-1.5 {gold
			? 'border-[#ffb800]/35 bg-[#ffb800]/10'
			: 'border-[#56a8e0]/35 bg-[#56a8e0]/10'}"
	>
		<div class="relative flex h-6 w-7 items-center justify-center">
			{#if kind === 'tap'}
				<span
					class="tut-g-tapring absolute h-[22px] w-[22px] rounded-full border-2 border-[#8cc6f5] motion-reduce:animate-none!"
				></span>
				<span
					class="tut-g-tap block h-4 w-4 rounded-full border-2 border-[#8cc6f5] bg-[#56a8e0]/25 motion-reduce:animate-none!"
				></span>
			{:else if kind === 'drag'}
				<span
					class="tut-g-drag block h-4 w-4 rounded-full border-2 border-[#8cc6f5] bg-[#56a8e0]/25 motion-reduce:animate-none!"
				></span>
			{:else if kind === 'double-tap'}
				<span
					class="tut-g-dtap block h-4 w-4 rounded-full border-2 border-[#ffb800] bg-[#ffb800]/20 motion-reduce:animate-none!"
				></span>
			{:else}
				<span
					class="tut-g-holdring absolute h-[22px] w-[22px] rounded-full border-2 border-[#ffb800] motion-reduce:animate-none!"
				></span>
				<span
					class="tut-g-hold block h-4 w-4 rounded-full border-2 border-white/70 bg-white/15 motion-reduce:animate-none!"
				></span>
			{/if}
		</div>
		<span
			class="font-['Saira_Condensed'] text-[8px] font-bold tracking-[0.12em] uppercase {gold
				? 'text-[#ffb800]'
				: 'text-[#8cc6f5]'}">{GESTURE_LABEL[kind]}</span
		>
	</div>
{/snippet}

<style>
	.tut-m-press {
		animation: tut-m-press 1.3s ease-in-out infinite;
	}
	.tut-m-drag {
		animation: tut-m-drag 1.6s ease-in-out infinite;
	}
	@keyframes tut-m-press {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		30% {
			transform: translateY(1px) scale(0.9);
		}
		55% {
			transform: translateY(0) scale(1);
		}
	}
	@keyframes tut-m-drag {
		0% {
			transform: translateX(-3px);
		}
		50% {
			transform: translateX(3px);
		}
		100% {
			transform: translateX(-3px);
		}
	}

	.tut-g-tap {
		animation: tut-g-tap 1.3s ease-in-out infinite;
	}
	.tut-g-tapring {
		animation: tut-g-tapring 1.3s ease-in-out infinite;
	}
	.tut-g-drag {
		animation: tut-g-drag 1.6s ease-in-out infinite;
	}
	.tut-g-dtap {
		animation: tut-g-dtap 1.3s ease-in-out infinite;
	}
	.tut-g-hold {
		animation: tut-g-hold 1.8s ease-in-out infinite;
	}
	.tut-g-holdring {
		animation: tut-g-holdring 1.8s ease-in-out infinite;
	}

	@keyframes tut-g-tap {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.85;
		}
		30% {
			transform: scale(0.7);
			opacity: 1;
		}
		55% {
			transform: scale(1);
			opacity: 0.85;
		}
	}
	@keyframes tut-g-tapring {
		0%,
		20% {
			opacity: 0;
			transform: scale(0.5);
		}
		45% {
			opacity: 0.8;
			transform: scale(1);
		}
		75%,
		100% {
			opacity: 0;
			transform: scale(1.3);
		}
	}
	@keyframes tut-g-drag {
		0% {
			transform: translate(-7px, -5px);
		}
		50% {
			transform: translate(7px, 5px);
		}
		100% {
			transform: translate(-7px, -5px);
		}
	}
	@keyframes tut-g-dtap {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.85;
		}
		18% {
			transform: scale(0.7);
			opacity: 1;
		}
		36% {
			transform: scale(1);
		}
		54% {
			transform: scale(0.7);
			opacity: 1;
		}
		72% {
			transform: scale(1);
			opacity: 0.85;
		}
	}
	@keyframes tut-g-hold {
		0%,
		12% {
			transform: scale(1);
		}
		45%,
		72% {
			transform: scale(0.82);
		}
		100% {
			transform: scale(1);
		}
	}
	@keyframes tut-g-holdring {
		0%,
		12% {
			opacity: 0;
			transform: scale(0.5);
		}
		45% {
			opacity: 0.9;
			transform: scale(1);
		}
		80%,
		100% {
			opacity: 0;
			transform: scale(1.25);
		}
	}
</style>
