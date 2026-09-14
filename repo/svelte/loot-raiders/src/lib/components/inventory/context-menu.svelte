<script lang="ts">
	import { getGameContext } from '$lib/store/game.svelte';
	import { getDef } from '$lib/config/items';
	import { getStorageConfig } from '$lib/config/storages';
	import { getRarityStyleTooltip } from '$lib/config/rarity';
	import { clickOutside } from '$lib/actions/actions';
	import { resolveBatchTargets, isBatchEngaged } from '$lib/inventory-validation';
	import { isEqualLocation } from '$lib/utils';

	const { overlay, inventory, tutorial, audio, selection } = getGameContext();
	const menuData = $derived(overlay.contextMenu);

	const close = () => overlay.closeContextMenu();
	const def = $derived(menuData ? getDef(menuData.slot.item.defId) : null);

	const batchTargets = $derived(resolveBatchTargets(inventory.items, selection.ids));
	const batchMode = $derived(
		!!menuData &&
			isBatchEngaged(batchTargets) &&
			batchTargets.dropLocations.some((loc) => isEqualLocation(loc, menuData.slot.location))
	);

	// Drop is enabled only on its teaching step; recycle stays unlocked from its step onward
	const dropDisabled = $derived(!tutorial.canDropFromMenu);
	const recycleDisabled = $derived(!tutorial.canRecycle);
</script>

{#if menuData && def}
	{@const moveTargetId =
		menuData.slot.location.type === 'slot'
			? getStorageConfig(menuData.slot.location.storageId)?.quickMoveTarget
			: undefined}

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		{@attach clickOutside(close)}
		data-testid="ctx-menu"
		class="fixed z-[100] flex w-32 flex-col rounded-sm border border-modal-border bg-modal pt-1 shadow-xl md:w-36 md:pt-1.5 lg:w-40 xl:w-44 2xl:w-48 3xl:w-56 pointer-coarse:pb-1"
		style="top: {menuData.y}px; left: {menuData.x}px;"
		oncontextmenu={(e) => e.preventDefault()}
	>
		<div
			class="flex items-center gap-1 border-b border-modal-border px-2 pt-0.5 pb-1 md:gap-1.5 md:px-2.5 md:pt-0.5 md:pb-1 lg:px-3 lg:pt-1 lg:pb-2 3xl:px-3.5"
		>
			{#if !batchMode}
				<img
					src={def.categoryIcon}
					alt=""
					class="size-3 shrink-0 object-contain opacity-60 brightness-0 md:size-3.5 lg:size-4 3xl:size-5"
				/>
			{/if}
			<span
				class="text-[9px] font-bold tracking-wider text-muted uppercase md:text-[10px] lg:text-[11px] 2xl:text-xs 3xl:text-[13px]"
			>
				{batchMode ? `${batchTargets.dropLocations.length} items selected` : def.name}
			</span>
		</div>

		{#if moveTargetId && !batchMode}
			<button
				class="flex w-full px-2 py-1 text-left text-[10px] font-medium text-modal-foreground hover:bg-accent md:px-2.5 md:py-1.5 md:text-[11px] lg:px-3 lg:text-xs 2xl:text-[13px] 3xl:px-3.5 3xl:text-sm"
				data-testid="ctx-move"
				onclick={() => {
					inventory.quickMove(menuData.slot.location);
					close();
				}}
			>
				Move to {moveTargetId === 'backpack' ? 'backpack' : 'loot'}
			</button>
		{/if}

		{#if def.maxStack && menuData.slot.item.count > 1 && !batchMode}
			<button
				class="flex w-full px-2 py-1 text-left text-[10px] font-medium text-modal-foreground hover:bg-accent md:px-2.5 md:py-1.5 md:text-[11px] lg:px-3 lg:text-xs 2xl:text-[13px] 3xl:px-3.5 3xl:text-sm"
				data-testid="ctx-split"
				onclick={() => {
					inventory.splitStack(menuData.slot.location);
					close();
				}}
			>
				Split Stack
			</button>
		{/if}

		<div class=" border-t border-modal-border"></div>

		<button
			class="flex w-full px-2 py-1 text-left text-[10px] font-medium text-modal-foreground hover:bg-accent disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40 disabled:hover:bg-transparent md:px-2.5 md:py-1.5 md:text-[11px] lg:px-3 lg:text-xs 2xl:text-[13px] 3xl:px-3.5 3xl:text-sm"
			disabled={dropDisabled}
			data-testid="ctx-drop"
			onclick={() => {
				if (batchMode) {
					inventory.dropItems(batchTargets.dropLocations);
				} else {
					inventory.removeItem(menuData.slot.location);
					audio.play('drop');
				}
				close();
			}}
		>
			{batchMode ? 'Drop all' : 'Drop'}
		</button>

		{#if batchMode}
			<button
				class="flex w-full px-2 py-1 text-left text-[10px] font-medium text-modal-foreground hover:bg-accent-alt disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40 disabled:hover:bg-transparent md:px-2.5 md:py-1.5 md:text-[11px] lg:px-3 lg:text-xs 2xl:text-[13px] 3xl:px-3.5 3xl:text-sm"
				disabled={recycleDisabled || batchTargets.recycleLocations.length === 0}
				data-testid="ctx-recycle"
				onclick={() => {
					overlay.openRecycleModal(batchTargets.recycleLocations);
					close();
				}}
			>
				Recycle all
			</button>
		{:else if def.recycling?.length}
			<button
				class="flex w-full px-2 py-1 text-left text-[10px] font-medium text-modal-foreground hover:bg-accent-alt disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40 disabled:hover:bg-transparent md:px-2.5 md:py-1.5 md:text-[11px] lg:px-3 lg:text-xs 2xl:text-[13px] 3xl:px-3.5 3xl:text-sm"
				disabled={recycleDisabled}
				data-testid="ctx-recycle"
				onclick={() => {
					overlay.openRecycleModal([menuData.slot.location]);
					close();
				}}
			>
				Recycle
			</button>

			<div
				class="hidden flex-col gap-1 border-t border-modal-border px-1 md:px-2.5 md:pt-1 pointer-coarse:flex"
			>
				<span class=" font-bold tracking-wider text-muted uppercase md:text-[8px]">
					Recycles Into
				</span>
				<div class="flex flex-wrap gap-1 lg:gap-1.5">
					{#each def.recycling as res (res.itemId)}
						{@const resDef = getDef(res.itemId)}
						{@const resStyle = getRarityStyleTooltip(resDef.rarity)}
						<div class="size-7 md:size-7">
							<div
								class="flex h-full w-full overflow-hidden rounded-md bg-linear-to-tr {resStyle.bg}"
							>
								<div
									class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[5px] bg-black/80"
								>
									<img
										src={resDef.image}
										alt={resDef.name}
										class="relative z-10 h-[100%] w-[100%] object-contain"
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
