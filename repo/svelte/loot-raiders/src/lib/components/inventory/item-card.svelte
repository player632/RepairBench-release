<script lang="ts">
	import { getDef } from '$lib/config/items';
	import { getRarityStyle } from '$lib/config/rarity';
	import { getGameContext } from '$lib/store/game.svelte';
	import Scanner from './scanner.svelte';
	import ArrowUpgradeIcon from '$lib/ui-icon/arrow-upgrade.svelte';
	import type { InstanceItem, ItemLocation } from '$lib/types';

	type Props = {
		item: InstanceItem;
		location?: ItemLocation;
		className?: string;
		selected: boolean;
		readonly?: boolean;
		onmatched?: () => void;
	};

	let { item, location, className = 'h-20 w-20', selected, readonly, onmatched }: Props = $props();

	const { interaction, gameLoop, augment } = getGameContext();

	const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;

	const def = $derived(getDef(item.defId));
	const style = $derived(getRarityStyle(def.rarity));
	const hasAttachments = $derived(item.attachments?.some((a) => a !== null) ?? false);
	const displayCount = $derived(
		location ? interaction.getDisplayCount(item, location) : item.count
	);
	const isAugment = $derived(def.type === 'augment');
	const augInfo = $derived(isAugment ? augment.info : null);
</script>

<div class="{className} group">
	<div
		class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-linear-to-tr p-[1px] {style.border}"
	>
		<div
			class="relative h-full w-full overflow-hidden rounded-[7px] {selected
				? 'bg-white'
				: 'bg-surface'}"
		>
			{#if item.match}
				<div class="pointer-events-none absolute inset-0 z-20 overflow-hidden">
					<Scanner
						duration={1}
						direction="vertical"
						wipe
						pause={gameLoop.status === 'paused'}
						onscanned={onmatched}
					/>
				</div>
			{/if}
			<div class="relative flex h-full w-full flex-col">
				<div class="relative min-h-0 flex-1 items-center justify-center">
					{@render absoluteGlowShadow()}
					{@render absoluteBlob()}
					<img
						src={def.image}
						alt="Loot"
						class="relative z-10 h-full w-full object-contain transition-transform {readonly ||
						interaction.status === 'dragging'
							? ''
							: 'group-hover:scale-105'}"
					/>
				</div>

				{@render footer()}
			</div>
		</div>
	</div>
</div>

{#snippet absoluteGlowShadow()}
	<div class="absolute bottom-0 left-0 z-0 h-[80%] w-[80%] opacity-20 blur-xl {style.glow}"></div>
{/snippet}

{#snippet absoluteBlob()}
	<div
		class="absolute -bottom-0.5 -left-0.5 z-0 aspect-square {style.height} {style.bg}"
		style="mask-image: radial-gradient(circle at 100% 0%, transparent 69%, black 70%);
			-webkit-mask-image: radial-gradient(circle at 100% 0%, transparent 69%, black 70%);"
	></div>
{/snippet}

{#snippet footer()}
	<div
		class="z-10 flex h-[25%] w-full shrink-0 items-center justify-between bg-black pr-1 pl-0.5 2xl:pr-1"
	>
		{#if def.type === 'weapon'}
			<img
				src={def.categoryIcon}
				alt="ammo type"
				class="size-2.5 object-contain md:size-3 lg:size-3.5 2xl:size-4 3xl:size-5"
			/>
			{#if hasAttachments}
				<img
					src="/assets/ui/mod_slot_assets/weapon-mod.webp"
					alt="modded"
					class="size-2.5 object-contain opacity-50 md:size-3 lg:size-3.5 2xl:size-4 3xl:size-5"
				/>
			{/if}
		{:else if augInfo && !augInfo.isMaxLevel}
			<div
				class="flex items-center gap-0.5 font-mono text-[6px] font-black tracking-wider md:text-[7px] lg:gap-1 lg:text-[8px] 2xl:text-[9px] 3xl:text-[10px]"
			>
				<img
					src={def.categoryIcon}
					alt="category"
					class="size-2.5 object-contain opacity-50 md:size-3 lg:size-3.5 2xl:size-4 3xl:size-5"
				/>
				<span class="text-white/30">{ROMAN[augInfo.level]}</span>
				<ArrowUpgradeIcon class="size-1.5 md:size-2 2xl:size-2.5" />
				<span class="text-cyan-400">{ROMAN[augInfo.level + 1]}</span>
			</div>
		{:else}
			<div class="text-white/70">
				<img
					src={def.categoryIcon}
					alt="category"
					class="size-2.5 object-contain md:size-3 lg:size-3.5 2xl:size-4 3xl:size-5"
				/>
			</div>
			{#if displayCount > 1}
				<div
					class="flex items-center gap-0.5 text-[7px] leading-none font-medium text-white md:text-[8px] lg:text-[9px] 2xl:text-xs 3xl:text-[13px]"
				>
					<span class="text-[6px] md:text-[7px] lg:text-[8px] 2xl:text-[9px] 3xl:text-[10px]"
						>x</span
					>
					<span class="font-sans tracking-[-0.05em]">
						{displayCount}
					</span>
				</div>
			{/if}
		{/if}
	</div>
{/snippet}
