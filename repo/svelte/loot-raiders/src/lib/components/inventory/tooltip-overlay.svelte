<script lang="ts">
	import { getGameContext } from '$lib/store/game.svelte';
	import { getDef } from '$lib/config/items';
	import { getRarityStyleTooltip } from '$lib/config/rarity';
	import type { ItemDefinition } from '$lib/types';

	const PADDING = 6;
	const TAB_HEIGHT = 32;

	const { overlay } = getGameContext();
	const tooltipData = $derived(overlay.tooltip);

	let tooltipRef = $state<HTMLElement>();
	let adjustedX = $state(0);
	let adjustedY = $state(0);

	const def = $derived(tooltipData?.item ? getDef(tooltipData.item.defId) : null);

	const isWeapon = $derived(def?.type === 'weapon');
	const isAttachment = $derived(def?.type === 'attachment');

	const attachments = $derived(tooltipData?.item.attachments ?? []);
	const recycling = $derived(def?.recycling ?? []);
	const style = $derived(def ? getRarityStyleTooltip(def.rarity) : null);

	$effect(() => {
		if (tooltipData && tooltipRef) {
			const rect = tooltipRef.getBoundingClientRect();
			const vh = window.innerHeight;

			adjustedX = tooltipData.x + PADDING;

			const rawY = tooltipData.y + rect.height > vh ? vh - rect.height - PADDING : tooltipData.y;
			adjustedY = Math.max(TAB_HEIGHT + 4, rawY);
		}
	});
</script>

{#if tooltipData && def}
	<div
		bind:this={tooltipRef}
		class="pointer-events-none fixed z-[100] flex w-[200px] flex-col md:w-[230px] lg:w-[270px] xl:w-[300px] 2xl:w-[320px] 3xl:w-[400px]"
		style="top: {adjustedY}px; left: {adjustedX}px;"
	>
		<div
			class="flex h-6 w-fit items-center gap-1.5 rounded-t-[6px] bg-modal-secondary px-2.5 font-bold text-modal-foreground md:h-7 md:px-3 lg:gap-2 lg:px-3.5 2xl:h-8 2xl:px-4 3xl:h-9 3xl:px-5"
		>
			<img
				src="/assets/ui/icon-actions.webp"
				alt="actions"
				class="size-3.5 object-contain md:size-4 2xl:size-5 3xl:size-6"
			/>
			<span
				class="text-[9px] tracking-widest uppercase md:text-[10px] lg:text-[11px] 2xl:text-[13px] 3xl:text-[15px]"
				>Actions</span
			>
		</div>

		<div class="flex flex-col rounded-tr-[6px] rounded-b-[6px] bg-modal text-modal-foreground">
			<div
				class="flex flex-col px-3 py-2 md:px-3.5 md:py-2.5 lg:px-4 2xl:px-5 2xl:py-3 3xl:px-6 3xl:py-3.5"
			>
				<div
					class="mb-1 flex gap-0.5 text-[8px] font-bold text-black uppercase md:text-[9px] lg:mb-1.5 lg:text-[10px] 2xl:mb-2 2xl:text-xs 3xl:text-[13px]"
				>
					<div class="px-1 {style?.bg} flex items-center rounded-l-xs">
						<img
							src={def.categoryIcon}
							alt="category"
							class="size-3.5 object-contain brightness-0 md:size-4 2xl:size-5 3xl:size-6"
						/>
					</div>
					{#if isWeapon}
						<div class="flex items-center px-1 {style?.bg}">
							{def.weaponClass}
						</div>
					{/if}
					<div class="flex items-center rounded-r-xs px-1 {style?.bg}">
						{def.rarity}
					</div>
				</div>

				<h1
					class="mb-1 text-sm leading-none font-black tracking-tight uppercase md:text-base lg:mb-1.5 lg:text-lg xl:text-xl 2xl:mb-2 2xl:text-2xl 3xl:text-[28px]"
				>
					{def.name}
				</h1>

				{#if def.description}
					<p
						class="mb-1 text-[9px] leading-snug font-medium text-modal-secondary-foreground md:text-[10px] lg:mb-1.5 lg:text-[11px] 2xl:mb-2 2xl:text-sm 3xl:text-[15px]"
					>
						{def.description}
					</p>
				{/if}

				{#if isWeapon}
					<div class="flex gap-1 lg:gap-1.5 3xl:gap-2">
						{#each def.attachmentSlots ?? [] as slot, i (i)}
							{@const attached = attachments[i]}
							{@const attDef = attached ? getDef(attached.defId) : null}
							{@render attachmentItem(attDef, slot.placeholder)}
						{/each}
					</div>
				{/if}

				{#if isWeapon}
					<div
						class="mb-2 flex flex-col text-[9px] font-medium text-modal-foreground md:text-[10px] lg:mb-3 lg:text-[11px] 2xl:mb-4 2xl:text-sm 3xl:text-[15px]"
					>
						<div
							class="flex items-center justify-between border-b border-modal-foreground/10 px-1.5 pt-2 pb-1"
						>
							<span class="text-modal-secondary-foreground">Ammo Type</span>
							<span class="flex items-center gap-1 font-bold">
								<img
									src={def.categoryIcon}
									alt=""
									class="size-4 object-contain brightness-0 md:size-4.5 2xl:size-6 3xl:size-7"
								/>
								{def.ammoType}
							</span>
						</div>

						<div
							class="flex items-center justify-between border-b border-modal-foreground/10 px-1.5 pt-2 pb-1"
						>
							<span class="text-modal-secondary-foreground">Magazine Size</span>
							<span class="font-bold">{def.magazineSize}</span>
						</div>

						<div
							class="flex items-center justify-between border-b border-modal-foreground/10 bg-modal-secondary/40 px-1.5 pt-2 pb-1"
						>
							<span class="text-modal-secondary-foreground">Firing Mode</span>
							<span class="font-bold">{def.firingMode}</span>
						</div>

						<div
							class="flex items-center justify-between border-b border-modal-foreground/10 px-1.5 pt-2 pb-1"
						>
							<span class="text-modal-secondary-foreground">ARC Armor Penetration</span>
							<span class="font-bold">{def.armorPenetration}</span>
						</div>
					</div>
				{/if}

				{#if isAttachment}
					<div class="mb-2 flex flex-col gap-0.5 lg:mb-3 lg:gap-1 2xl:mb-4 3xl:gap-1.5">
						{#each def.statBonuses ?? [] as bonus, i (i)}
							<span
								class="text-[9px] leading-snug font-medium text-modal-secondary-foreground md:text-[10px] lg:text-[11px] 2xl:text-sm 3xl:text-[15px]"
							>
								{bonus}
							</span>
						{/each}
					</div>
				{/if}

				{#if recycling.length > 0}
					<div class="flex flex-col {isWeapon ? 'pl-2' : ''}">
						<span
							class="mb-1 text-[8px] font-bold text-modal-foreground uppercase md:text-[9px] lg:mb-1.5 lg:text-[10px] 2xl:mb-2 2xl:text-xs 3xl:text-[13px]"
						>
							Recycles Into
						</span>
						<div class="flex gap-1 lg:gap-1.5 3xl:gap-2">
							{#each recycling as res (res.itemId)}
								{@const resDef = getDef(res.itemId)}
								{@render recycleItem(resDef)}
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#snippet attachmentItem(attDef: ItemDefinition | null, placeholder: string)}
	{@const style = attDef ? getRarityStyleTooltip(attDef.rarity) : null}
	{#if attDef && style}
		<div class="aspect-square size-6 rounded-lg md:size-7 lg:size-8 2xl:size-10 3xl:size-12">
			<div
				class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-linear-to-tr p-[1px] {style.border}"
			>
				<div class="relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-surface">
					<div class="absolute bottom-0 left-0 z-0 h-[80%] w-[80%] blur-xl {style.glow}"></div>
					<div class="relative min-h-0 flex-1 items-center justify-center">
						<img
							src={attDef.image}
							alt={attDef.name}
							class="relative z-10 h-full w-full scale-105 object-contain"
						/>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="aspect-square size-6 rounded-lg md:size-7 lg:size-8 2xl:size-10 3xl:size-12">
			<div
				class="flex h-full w-full items-center justify-center rounded-lg border border-black/10 bg-black/5"
			>
				<img
					src={placeholder}
					alt="mod slot"
					class="h-[90%] w-[90%] object-contain opacity-40 brightness-0"
				/>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet recycleItem(resDef: ItemDefinition)}
	{@const style = getRarityStyleTooltip(resDef.rarity)}

	<div class="size-6 md:size-7 lg:size-8 2xl:size-10 3xl:size-12">
		<div
			class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-linear-to-tr p-[1px] {style.bg}"
		>
			<div class="relative flex h-full w-full flex-col overflow-hidden rounded-[7px] bg-black/80">
				<img src={resDef.image} alt="Loot" class="relative z-10 h-full w-full object-contain" />
			</div>
		</div>
	</div>
{/snippet}
