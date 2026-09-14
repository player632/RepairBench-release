<script lang="ts">
	import { getRarityStyle } from '$lib/config/rarity';
	import { STAGES } from '$lib/config/stages';
	import type { ItemDefinition, RarityStyle } from '$lib/types';
	import { getGameContext } from '$lib/store/game.svelte';
	import Check from '$lib/ui-icon/match.svelte';
	import type { QuestItem } from '$lib/store/quest.svelte';

	const { gameLoop, quest } = getGameContext();
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
		class="absolute top-0 right-0 z-30 flex min-w-7 items-center justify-center rounded-bl-md border-b border-l px-1 py-0.5 md:min-w-8 md:px-1.5 lg:min-w-9 2xl:min-w-11 2xl:px-2 2xl:py-1 3xl:min-w-12 3xl:px-2.5 4xl:min-w-14 4xl:px-3 4xl:py-1.5 {item.matched
			? 'bg-emerald-900/60'
			: 'bg-black/40'}"
		style="border-color: color-mix(in srgb, var(--rarity-{item.def
			.rarity}) 50%, transparent); box-shadow: 0 0 10px color-mix(in srgb, var(--rarity-{item.def
			.rarity}) 50%, transparent)"
	>
		<span class="flex items-baseline gap-px font-mono leading-none tabular-nums">
			<span
				class="text-[10px] font-black lg:text-xs 2xl:text-sm 4xl:text-base"
				class:text-emerald-400={item.matched}
				class:text-white={!item.matched}
			>
				{item.matched ? item.count : collected}
			</span>
			<span
				class="text-[7px] font-bold text-white/40 lg:text-[8px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px]"
				>/{item.count}</span
			>
		</span>
	</div>
{/snippet}

{#snippet progressBar(item: QuestItem)}
	{@const collected = Math.min(item.count, quest.getCollected(item.defId))}
	{@const pct = item.matched ? 100 : (collected / item.count) * 100}
	{#if collected}
		<div class="absolute inset-x-0 bottom-0 z-20 h-0.5 bg-white/5 2xl:h-1 4xl:h-1.5">
			<div
				class="quest-fill relative h-full overflow-hidden transition-[width] duration-500 ease-out {item.matched
					? 'bg-emerald-400 text-emerald-400'
					: pct > 0
						? 'bg-cyan-400 text-cyan-400'
						: ''}"
				style="width: {pct}%"
			>
				{#if !item.matched}
					<span class="quest-shimmer absolute inset-0"></span>
				{/if}
			</div>
		</div>
	{/if}
{/snippet}

{#snippet matchedOverlay()}
	<div
		class="absolute inset-0 z-20 flex items-center justify-center rounded-[7px] bg-emerald-950/40"
	>
		<div
			class="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 lg:px-2.5 2xl:gap-1.5 2xl:px-3 2xl:py-1 4xl:gap-2 4xl:px-4 4xl:py-1.5"
		>
			<Check />
			<span
				class="text-[8px] font-bold tracking-wider text-emerald-400 uppercase lg:text-[9px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px]"
				>Done</span
			>
		</div>
	</div>
{/snippet}

<div
	class="relative z-10 flex w-36 flex-col rounded-t-lg rounded-b-none md:w-40 lg:w-44 2xl:w-56 3xl:w-64 4xl:w-72"
	data-tut="quest-bar"
	data-testid="quest-bar"
>
	{#if gameLoop.status !== 'idle'}
		<div
			class="flex flex-col gap-1 rounded-t-xl bg-background/50 px-2 py-1 backdrop-blur-md md:px-3 md:py-1.5 lg:px-4 2xl:gap-1.5 2xl:px-5 2xl:py-2 3xl:px-6 3xl:py-2.5 4xl:gap-2 4xl:px-7 4xl:py-3"
		>
			<div class="flex items-center justify-between gap-1.5">
				<div class="flex items-center gap-1 2xl:gap-1.5 4xl:gap-2">
					<img
						src="/assets/ui/Icon_Quest.webp"
						alt=""
						aria-hidden="true"
						class="size-3 shrink-0 object-contain md:size-3.5 lg:size-4 2xl:size-5 3xl:size-6 4xl:size-7"
					/>
					{#key quest.currentStage}
						<span
							class="stage-name text-[7px] font-medium text-white/50 uppercase md:text-[8px] lg:text-[9px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px]"
							>{quest.stageDef.name}</span
						>
					{/key}
				</div>
			</div>
			<div class="mt-0.5 flex w-full gap-1">
				{#each STAGES as _, i (i)}
					<div
						class="h-0.5 flex-1 overflow-hidden rounded-full bg-black/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)] ring-1 ring-white/5 lg:h-0.5 2xl:h-1 3xl:h-1.5 4xl:h-2"
					>
						<div
							class="h-full w-full transition-all duration-500 {i < quest.currentStage
								? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
								: i === quest.currentStage
									? 'animate-pulse bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
									: 'bg-white/20'}"
						></div>
					</div>
				{/each}
			</div>
		</div>

		<div
			class="flex flex-col gap-1 overflow-hidden bg-background/50 px-1.5 py-2 backdrop-blur-md md:gap-1.5 md:px-2 md:py-3 lg:min-h-[468px] lg:px-2.5 lg:py-3.5 2xl:min-h-[568px] 2xl:gap-2 2xl:px-3 2xl:py-4 3xl:min-h-[676px] 3xl:gap-3 3xl:px-4 3xl:py-5 4xl:min-h-[784px] 4xl:gap-4 4xl:px-5 4xl:py-6"
		>
			{#each quest.items as item, i (item.id)}
				{@const style = getRarityStyle(item.def.rarity)}
				{@const showAsWeaponLayout =
					item.def.type === 'weapon' && !!item.def.attachmentSlots?.length}

				<div
					class="stage-item flex w-full justify-center transition-opacity duration-500"
					style="--i: {i}"
					data-testid={`quest-item-${i}`}
					class:opacity-60={item.matched}
				>
					{#if showAsWeaponLayout}
						<div
							class="flex h-[76px] w-32 flex-col overflow-hidden rounded-lg bg-linear-to-tr p-[1px] md:h-[86px] md:w-36 lg:h-[96px] lg:w-40 2xl:h-[120px] 2xl:w-52 3xl:h-[140px] 3xl:w-60 4xl:h-[160px] 4xl:w-72 {item.matched
								? 'border border-emerald-500/30'
								: style.border}"
						>
							<div class="relative flex flex-col overflow-hidden rounded-[7px] bg-surface">
								{#if item.matched}
									{@render matchedOverlay()}
								{/if}
								<div
									class="relative flex h-9 items-center justify-center md:h-10 lg:h-12 2xl:h-16 3xl:h-20 4xl:h-24"
								>
									{@render itemImage(item.def, style, item.matched)}

									{#if !item.matched}
										{@render progressBadge(item)}
									{/if}
								</div>
								<div
									class="z-10 flex items-center justify-center gap-0.5 px-1 py-1.5 md:py-2 2xl:py-3 4xl:py-4"
								>
									{#each item.def.attachmentSlots as slot, i (slot.type + i)}
										<div
											class="flex size-5 items-center justify-center rounded border border-white/15 md:size-6 lg:size-7 2xl:size-9 3xl:size-10 4xl:size-12"
										>
											<img
												src={slot.placeholder}
												alt={slot.type}
												class="size-3.5 object-contain opacity-30 md:size-4 lg:size-5 2xl:size-7 3xl:size-8 4xl:size-9"
											/>
										</div>
									{/each}
								</div>
								{@render progressBar(item)}
							</div>
						</div>
					{:else}
						<div
							class="flex h-16 w-32 flex-col overflow-hidden rounded-lg bg-linear-to-tr p-[1px] md:h-18 md:w-36 lg:h-20 lg:w-40 2xl:h-24 2xl:w-52 3xl:h-28 3xl:w-60 4xl:h-32 4xl:w-72 {item.matched
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
		<div
			class="flex items-center justify-between rounded-b-lg bg-background/50 px-2 pb-1 backdrop-blur-md md:px-3 md:pb-1.5 lg:px-4 2xl:px-5 2xl:pb-2 3xl:px-6 3xl:pb-2.5 4xl:px-7 4xl:pb-3"
		>
			<span
				class="text-[7px] font-medium text-white/80 uppercase md:text-[8px] lg:text-[9px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px]"
			>
				Stage {quest.currentStage + 1}
			</span>
			<div class="flex items-center gap-1 2xl:gap-1.5 4xl:gap-2">
				<span
					class="text-[6px] font-medium tracking-wider text-muted uppercase md:text-[7px] lg:text-[8px] 2xl:text-[9px] 3xl:text-[10px] 4xl:text-[11px]"
					>Progress</span
				>
				<span class="flex items-baseline gap-1 font-mono tabular-nums">
					<span
						class="text-[7px] font-bold transition-colors duration-300 md:text-[8px] lg:text-[9px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px] {quest.stageCompleted
							? 'text-emerald-500/80 drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]'
							: 'text-white'}"
					>
						{quest.completed}
					</span>
					<span
						class="text-[7px] font-black text-white/30 md:text-[8px] lg:text-[9px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px]"
						>/</span
					>
					<span
						class="text-[6px] font-bold text-muted md:text-[7px] lg:text-[8px] 2xl:text-[9px] 3xl:text-[10px] 4xl:text-[11px]"
						>{quest.total}</span
					>
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.quest-fill {
		box-shadow: 0 0 6px color-mix(in srgb, currentColor 40%, transparent);
	}

	.quest-shimmer {
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.55) 50%,
			transparent 100%
		);
		animation: quest-shimmer 1.6s ease-in-out infinite;
	}

	@keyframes quest-shimmer {
		0% {
			transform: translateX(-100%);
		}
		60%,
		100% {
			transform: translateX(100%);
		}
	}

	.stage-item {
		animation: stage-item-in 360ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
		animation-delay: calc(var(--i, 0) * 70ms);
	}

	.stage-name {
		animation: stage-name-in 400ms ease-out;
	}

	@keyframes stage-item-in {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes stage-name-in {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stage-item,
		.stage-name {
			animation: none;
		}

		.quest-shimmer {
			animation: none;
			opacity: 0;
		}
	}
</style>
