<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { getRarityStyle } from '$lib/config/rarity';
	import { getGameContext } from '$lib/store/game.svelte';
	import { STAGES } from '$lib/config/stages';
	import Check from '$lib/ui-icon/match.svelte';
	import Cross from '$lib/ui-icon/cross.svelte';
	import type { ItemDefinition, RarityStyle } from '$lib/types';
	import type { QuestItem } from '$lib/store/quest.svelte';

	const { overlay, quest } = getGameContext();

	let dragY = $state(0);
	let dragStartY = 0;
	let dragging = $state(false);
	let animating = $state(false);
	let pendingY = 0;
	let rafId = 0;
	const CLOSE_THRESHOLD = 100;

	function onPointerDown(e: PointerEvent) {
		dragStartY = e.clientY;
		dragging = true;
		pendingY = 0;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		pendingY = Math.max(0, e.clientY - dragStartY);
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			dragY = pendingY;
			rafId = 0;
		});
	}

	function onPointerUp(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
		if (pendingY > CLOSE_THRESHOLD) {
			overlay.closeQuestSheet();
		}
		dragY = 0;
		pendingY = 0;
	}
</script>

{#snippet itemImage(def: ItemDefinition, style: RarityStyle, matched: boolean)}
	<div class="absolute bottom-0 left-0 z-0 h-[80%] w-[80%] opacity-20 blur-xl {style.glow}"></div>
	<img
		src={def.image}
		alt={def.name}
		class="relative z-10 h-full w-full object-contain transition-all duration-500"
		class:grayscale={matched}
		class:opacity-40={matched}
	/>
{/snippet}

{#snippet progressBadge(item: QuestItem)}
	{@const collected = Math.min(item.count, quest.getCollected(item.defId))}
	<div
		class="absolute top-0 right-0 z-30 flex min-w-9 items-center justify-center rounded-bl-md border-b border-l px-1.5 py-1 {item.matched
			? 'bg-emerald-900/60'
			: 'bg-black/40'}"
		style="border-color: color-mix(in srgb, var(--rarity-{item.def
			.rarity}) 50%, transparent); box-shadow: 0 0 10px color-mix(in srgb, var(--rarity-{item.def
			.rarity}) 50%, transparent)"
	>
		<span class="flex items-baseline gap-0.5 font-mono leading-none tabular-nums">
			<span
				class="text-sm font-black"
				class:text-emerald-400={item.matched}
				class:text-white={!item.matched}
			>
				{item.matched ? item.count : collected}
			</span>
			<span class="text-[10px] font-bold text-white/40">/{item.count}</span>
		</span>
	</div>
{/snippet}

{#snippet progressBar(item: QuestItem)}
	{@const collected = Math.min(item.count, quest.getCollected(item.defId))}
	{@const pct = item.matched ? 100 : (collected / item.count) * 100}
	{#if collected}
		<div class="absolute inset-x-0 bottom-0 z-20 h-0.5 bg-white/5">
			<div
				class="h-full transition-all duration-300 {item.matched
					? 'bg-emerald-400'
					: pct > 0
						? 'bg-cyan-400'
						: ''}"
				style="width: {pct}%"
			></div>
		</div>
	{/if}
{/snippet}

{#snippet matchedOverlay()}
	<div
		class="absolute inset-0 z-20 flex items-center justify-center rounded-[7px] bg-emerald-950/40"
	>
		<div class="flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5">
			<Check />
			<span class="text-[8px] font-bold tracking-wider text-emerald-400 uppercase">Done</span>
		</div>
	</div>
{/snippet}

{#if overlay.questSheet}
	<button
		type="button"
		aria-label="Close quests"
		class="fixed inset-0 z-[120] bg-black/60"
		class:backdrop-blur-sm={!dragging && !animating}
		onclick={() => overlay.closeQuestSheet()}
		transition:fade={{ duration: 200 }}
	></button>

	<div
		class="fixed inset-x-0 bottom-0 z-[121] flex flex-col rounded-t-2xl bg-[#0c101c]/95 pb-[env(safe-area-inset-bottom,12px)] shadow-[0_-8px_24px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
		class:backdrop-blur-md={!dragging && !animating}
		class:will-change-transform={dragging || animating}
		style="transform: translate3d(0, {dragY}px, 0);  transition: transform {dragging
			? '0s'
			: '220ms'} cubic-bezier(0.2, 0.8, 0.2, 1);"
		transition:fly={{ y: 500, duration: 320, easing: quintOut }}
		onintrostart={() => (animating = true)}
		onintroend={() => (animating = false)}
		onoutrostart={() => (animating = true)}
	>
		<button
			type="button"
			aria-label="Drag to close"
			class="flex w-full cursor-grab touch-none justify-center py-2.5 active:cursor-grabbing"
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
		>
			<div class="h-1 w-10 rounded-full bg-white/30"></div>
		</button>

		<div class="flex items-center gap-3 px-3">
			<img
				src="/assets/ui/Icon_Quest.webp"
				alt=""
				aria-hidden="true"
				class="size-8 shrink-0 object-contain"
			/>
			<div class="flex min-w-0 flex-1 flex-col gap-0.5">
				<span class="truncate text-[13px] font-bold tracking-wider text-white uppercase"
					>{quest.stageDef.name}</span
				>
				<div class="flex items-baseline gap-1">
					<span class="text-[9px] font-bold tracking-wider text-white/40 uppercase">Stage</span>
					<span class="font-mono text-xs leading-none font-bold text-white/70 tabular-nums"
						>{quest.currentStage + 1}</span
					>
				</div>
			</div>
			<button
				type="button"
				aria-label="Close"
				class="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition-transform active:scale-90"
				onclick={() => overlay.closeQuestSheet()}
			>
				<Cross />
			</button>
		</div>

		<div class="px-3 pb-4">
			<div class="mt-4 flex gap-1.5">
				{#each STAGES as _, i}
					<div
						class="h-1 flex-1 rounded-full {i <= quest.currentStage
							? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
							: 'bg-white/10'}"
					></div>
				{/each}
			</div>
		</div>

		<div class="flex gap-1 px-2 py-2">
			{#each quest.items as item (item.id)}
				{@const style = getRarityStyle(item.def.rarity)}
				{@const showAsWeaponLayout =
					item.def.type === 'weapon' && !!item.def.attachmentSlots?.length}

				<div
					class="flex min-w-0 flex-1 items-end justify-center transition-opacity duration-500"
					class:opacity-60={item.matched}
				>
					{#if showAsWeaponLayout}
						<div
							class="flex aspect-[10/7] w-full flex-col overflow-hidden rounded-lg bg-linear-to-tr p-[1px] {item.matched
								? 'border border-emerald-500/30'
								: style.border}"
						>
							<div
								class="relative flex h-full w-full flex-col overflow-hidden rounded-[7px] bg-surface"
							>
								{#if item.matched}
									{@render matchedOverlay()}
								{/if}
								<div class="relative flex flex-1 items-center justify-center">
									{@render itemImage(item.def, style, item.matched)}
									{#if !item.matched}
										{@render progressBadge(item)}
									{/if}
								</div>
								<div class="z-10 flex items-center justify-center gap-1 px-1 pb-1">
									{#each item.def.attachmentSlots as slot, i (slot.type + i)}
										<div
											class="flex size-6 items-center justify-center rounded border border-white/15"
										>
											<img
												src={slot.placeholder}
												alt={slot.type}
												class="size-5 object-contain opacity-30"
											/>
										</div>
									{/each}
								</div>
								{@render progressBar(item)}
							</div>
						</div>
					{:else}
						<div
							class="flex aspect-[10/7] w-full overflow-hidden rounded-lg bg-linear-to-tr p-[1px] {item.matched
								? 'border border-emerald-500/30'
								: style.border}"
						>
							<div class="relative flex h-full w-full overflow-hidden rounded-[7px] bg-surface">
								{#if item.matched}
									{@render matchedOverlay()}
								{/if}
								{@render itemImage(item.def, style, item.matched)}
								{#if !item.matched}
									{@render progressBadge(item)}
								{/if}
								{@render progressBar(item)}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
