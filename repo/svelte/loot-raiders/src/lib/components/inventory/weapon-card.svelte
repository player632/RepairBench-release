<script lang="ts">
	import AttachmentSlot from './attachment-slot.svelte';
	import Scanner from './scanner.svelte';
	import { getDef } from '$lib/config/items';
	import { getRarityStyle } from '$lib/config/rarity';
	import { getGameContext } from '$lib/store/game.svelte';
	import type { InstanceItem, ItemLocation } from '$lib/types';

	type Props = {
		item: InstanceItem;
		className?: string;
		location: ItemLocation;
		onmatched?: () => void;
	};

	let { item, className = '', location, onmatched }: Props = $props();
	let def = $derived(getDef(item.defId));

	const { gameLoop, interaction } = getGameContext();
	const style = $derived(getRarityStyle(def.rarity));
</script>

<div class="{className} weapon-card group/weapon">
	<div
		class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-linear-to-tr p-[1px] {style.border}"
	>
		<div
			class="weapon-card__body relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-t-[8px] bg-surface transition-shadow duration-300"
		>
			{#if item.match}
				<div class="pointer-events-none absolute inset-0 z-30 overflow-hidden">
					<Scanner
						duration={1}
						direction="vertical"
						wipe
						pause={gameLoop.status === 'paused'}
						onscanned={onmatched}
					/>
				</div>
			{/if}
			{@render absoluteGlowShadow()}
			{@render absoluteBlob()}
			<div class="relative z-10 min-h-0 flex-1">
				<img
					src={def.image}
					alt="weapon"
					class="max-h-full max-w-full object-contain transition-transform {interaction.status ===
					'dragging'
						? ''
						: 'group-hover/weapon:scale-110'}"
				/>
			</div>
			<div class="weapon-card__slots z-20 mb-0.5 flex shrink-0 items-center justify-center gap-0.5 lg:mb-1 lg:gap-1 3xl:gap-1.5">
				{#each def.attachmentSlots ?? [] as slotDef, index (index)}
					<AttachmentSlot
						parentLocation={location}
						attachIndex={index}
						attachment={item.attachments?.[index] ?? null}
						placeholder={slotDef.placeholder}
					/>
				{/each}
			</div>
		</div>
		<div class="shrink-0">
			{@render footer()}
		</div>
	</div>
</div>

{#snippet absoluteGlowShadow()}
	<div class="absolute bottom-0 left-0 z-0 h-[80%] w-[80%] opacity-20 blur-xl {style.glow}"></div>
{/snippet}

{#snippet absoluteBlob()}
	<div
		class="absolute -bottom-1 -left-0.5 z-0 aspect-square {style.height} {style.bg}"
		style="mask-image: radial-gradient(circle at 100% 0%, transparent 69%, black 70%);"
	></div>
{/snippet}

{#snippet footer()}
	<div
		class="z-10 flex h-5 w-full items-center justify-between rounded-b-[8px] bg-black pr-1 pl-0.5 md:h-6 lg:h-7 2xl:h-8 2xl:pr-2 3xl:h-9"
	>
		<div class="flex h-full items-center justify-center gap-0.5">
			<img src={def.categoryIcon} alt="ammo" class="size-5 object-contain md:size-6 lg:size-7 2xl:size-9 3xl:size-10" />
		</div>
	</div>
{/snippet}
