<script lang="ts">
	import { getGameContext } from '$lib/store/game.svelte';
	import { getRarityStyleTooltip } from '$lib/config/rarity';
	import { clickOutside } from '$lib/actions/actions';
	import Grid from '$lib/ui-icon/grid.svelte';
	import type { ItemDefinition } from '$lib/types';

	const PADDING = 6;
	const TAB_HEIGHT = 32;

	const { overlay, augment } = getGameContext();
	const panelData = $derived(overlay.augmentPanel);
	const info = $derived(augment.info);

	let panelRef = $state<HTMLElement>();
	let adjustedX = $state(0);
	let adjustedY = $state(0);

	$effect(() => {
		if (panelData && panelRef) {
			const rect = panelRef.getBoundingClientRect();
			const vh = window.innerHeight;
			const vw = window.innerWidth;

			adjustedX = Math.min(panelData.x + PADDING, vw - rect.width - PADDING);

			const rawY = panelData.y + rect.height > vh ? vh - rect.height - PADDING : panelData.y;
			adjustedY = Math.max(TAB_HEIGHT + 4, rawY);
		}
	});
</script>

{#if panelData && info}
	<div
		bind:this={panelRef}
		class="fixed z-[100] flex w-[200px] flex-col md:w-[230px] lg:w-[270px] xl:w-[300px] 2xl:w-[340px] 3xl:w-[400px]"
		style="top: {adjustedY}px; left: {adjustedX}px;"
		{@attach clickOutside(() => overlay.closeAugmentUpgrade())}
	>
		<div
			class="flex h-6 w-fit items-center gap-1.5 rounded-t-[6px] bg-modal-secondary px-2.5 font-bold text-modal-foreground md:h-7 md:px-3 lg:gap-2 lg:px-3.5 2xl:h-8 2xl:px-4 3xl:h-9 3xl:px-5 pointer-coarse:hidden"
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

		<div
			class="flex flex-col rounded-tr-[6px] rounded-b-[6px] bg-modal text-modal-foreground pointer-coarse:rounded-tl-[6px]"
		>
			<div
				class="flex flex-col px-3 py-2 md:px-3.5 md:py-2.5 lg:px-4 2xl:px-5 2xl:py-3 3xl:px-6 3xl:py-3.5"
			>
				<div
					class="mb-1 flex gap-0.5 text-[8px] font-bold text-black uppercase md:text-[9px] lg:mb-1.5 lg:text-[10px] 2xl:mb-2 2xl:text-xs 3xl:text-[13px]"
				>
					<div class="px-1 {info.style.bg} flex items-center rounded-l-xs">
						<img
							src={info.def.categoryIcon}
							alt="category"
							class="size-3.5 object-contain brightness-0 md:size-4 2xl:size-5 3xl:size-6"
						/>
					</div>
					<div class="flex items-center px-1 {info.style.bg}">
						Lv. {info.level + 1}
					</div>
					<div class="flex items-center rounded-r-xs px-1 {info.style.bg}">
						{info.def.rarity}
					</div>
				</div>

				<h1
					class="mb-1 text-xs leading-none font-black tracking-tight uppercase md:text-sm lg:mb-1.5 lg:text-base xl:text-lg 2xl:mb-2 2xl:text-xl 3xl:text-2xl"
				>
					{info.def.name}
				</h1>

				{#if info.def.description}
					<p
						class="mb-1 text-[9px] leading-snug font-medium text-modal-secondary-foreground md:text-[10px] lg:mb-1.5 lg:text-[11px] 2xl:mb-2 2xl:text-sm 3xl:text-[15px]"
					>
						{info.def.description}
					</p>
				{/if}

				{#if info.isMaxLevel}
					<div
						class="flex items-center justify-center border-b border-modal-foreground/10 px-1 pt-1.5 pb-1.5 lg:px-1.5 lg:pt-2 lg:pb-2"
					>
						<span
							class="text-[9px] font-bold tracking-widest text-cyan-400 uppercase md:text-[10px] lg:text-[11px] 2xl:text-sm 3xl:text-[15px]"
						>
							Max Level
						</span>
					</div>
				{:else}
					<div class="flex flex-col">
						<span
							class="mb-1 pb-0.5 text-[8px] font-bold text-modal-foreground uppercase md:text-[9px] lg:mb-1.5 lg:pb-1 lg:text-[10px] 2xl:mb-2 2xl:text-xs 3xl:text-[13px]"
						>
							Upgrade To
						</span>
						<div
							class="flex items-center gap-2 border-t border-b border-modal-foreground/10 bg-modal-secondary/40 py-1.5 lg:gap-3 lg:py-2 3xl:gap-3.5"
						>
							{@render itemTile(info.nextDef, info.nextStyle.border, info.nextStyle.glow)}
							<div class="flex flex-col">
								<span
									class="text-[9px] font-bold text-modal-foreground md:text-[10px] lg:text-[11px] 2xl:text-sm 3xl:text-[15px]"
								>
									{info.nextDef.name}
								</span>
							</div>
						</div>
					</div>

					<div class="mt-2 flex gap-1 lg:mt-3 lg:gap-1.5 3xl:gap-2 pointer-coarse:hidden">
						<div class="flex flex-col gap-0.5 lg:gap-1">
							<div class="flex gap-0.5 lg:gap-1">
								<div
									class="flex size-8 items-center justify-center rounded border border-modal-foreground/20 md:size-9 lg:size-10 2xl:size-13 3xl:size-15"
								>
									<img
										src="/assets/ui/placeholder/augment_placeholder.webp"
										alt="augment"
										class="size-5 object-contain md:size-6 2xl:size-8 3xl:size-10"
									/>
								</div>
								<div
									class="flex size-8 items-center justify-center rounded border border-modal-foreground/20 md:size-9 lg:size-10 2xl:size-13 3xl:size-15"
								>
									<img
										src="/assets/ui/placeholder/shield_placeholder.webp"
										alt="shield"
										class="size-5 object-contain md:size-6 2xl:size-8 3xl:size-10"
									/>
								</div>
							</div>
							<div
								class="flex h-7 items-center justify-center rounded border border-modal-foreground/20 md:h-8 lg:h-9 2xl:h-11 3xl:h-13"
							>
								<img
									src="/assets/ui/placeholder/placeholder_weapon.webp"
									alt="weapon"
									class="h-5 object-contain md:h-6 2xl:h-8 3xl:h-10"
								/>
							</div>
							<div
								class="flex h-7 items-center justify-center rounded border border-modal-foreground/20 md:h-8 lg:h-9 2xl:h-11 3xl:h-13"
							>
								<img
									src="/assets/ui/placeholder/placeholder_weapon.webp"
									alt="weapon"
									class="h-5 object-contain md:h-6 2xl:h-8 3xl:h-10"
								/>
							</div>
						</div>
						<!-- right: backpack -->
						<div class="flex flex-1 items-center justify-center rounded border border-black/20">
							<div class="flex items-center gap-1 lg:gap-1.5">
								<Grid />
								<span
									class="text-[9px] font-bold md:text-[10px] lg:text-[11px] 2xl:text-sm 3xl:text-[15px]"
								>
									×{info.futureBackpackSlots}
								</span>
							</div>
						</div>
					</div>
					<!-- required resources -->
					<div class="mt-2 flex flex-col lg:mt-3">
						<span
							class="text-[8px] font-bold text-modal-foreground uppercase md:text-[9px] lg:text-[10px] 2xl:text-xs 3xl:text-[13px]"
						>
							Required Resources
						</span>
						<div
							class="mt-0.5 flex items-center gap-3 border-t border-modal-foreground/10 pt-1.5 lg:mt-1 lg:gap-4 lg:pt-2 3xl:gap-5"
						>
							{#each info.costs as cost (cost.defId)}
								<div class="flex flex-1 items-center gap-2 lg:gap-3 3xl:gap-3.5">
									{@render resourceTile(cost.def)}
									<div class="flex flex-col">
										<span
											class="text-[9px] font-bold text-modal-foreground md:text-[10px] lg:text-[11px] 2xl:text-sm 3xl:text-[15px]"
										>
											{cost.def.name}
										</span>
										<span class="flex items-baseline gap-px font-mono leading-none tabular-nums">
											<span
												class="text-[9px] font-black md:text-[10px] lg:text-[11px] 2xl:text-sm 3xl:text-[15px] {cost.ok
													? 'text-cyan-400'
													: 'text-black/50'}"
											>
												{cost.have}
											</span>
											<span
												class="text-[7px] font-bold text-black md:text-[8px] lg:text-[9px] 2xl:text-[10px] 3xl:text-[11px]"
												>/{cost.need}</span
											>
										</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#snippet itemTile(tileDef: ItemDefinition, border: string, glow: string)}
	<div class="aspect-square size-6 rounded-lg md:size-7 lg:size-8 2xl:size-10 3xl:size-12">
		<div
			class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-linear-to-tr p-[1px] {border}"
		>
			<div class="relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-surface">
				<div class="absolute bottom-0 left-0 z-0 h-[80%] w-[80%] blur-xl {glow}"></div>
				<div class="relative min-h-0 flex-1 items-center justify-center">
					<img
						src={tileDef.image}
						alt={tileDef.name}
						class="relative z-10 h-full w-full scale-105 object-contain"
					/>
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet resourceTile(resDef: ItemDefinition)}
	{@const resStyle = getRarityStyleTooltip(resDef.rarity)}
	<div class="size-5 md:size-6 lg:size-7 2xl:size-8 3xl:size-10">
		<div
			class="flex h-full w-full flex-col overflow-hidden rounded bg-linear-to-tr p-[1px] {resStyle.bg}"
		>
			<div class="relative flex h-full w-full flex-col overflow-hidden rounded-sm bg-black/80">
				<img
					src={resDef.image}
					alt={resDef.name}
					class="relative z-10 h-full w-full object-contain"
				/>
			</div>
		</div>
	</div>
{/snippet}
