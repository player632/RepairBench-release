<script lang="ts">
	import { getDef } from '$lib/config/items';
	import ItemCard from './item-card.svelte';
	import type { InstanceItem } from '$lib/types';
	import { fade, scale } from 'svelte/transition';
	import { getGameContext } from '$lib/store/game.svelte';

	const { overlay, inventory } = getGameContext();
	const modalData = $derived(overlay.recycleModal);

	const slots = $derived(
		(modalData?.locations ?? [])
			.map((location) => ({ location, item: inventory.getItem(location) }))
			.filter((s): s is { location: (typeof s)['location']; item: InstanceItem } => s.item !== null)
	);

	const isBatch = $derived(slots.length > 1);
	const def = $derived(slots.length === 1 ? getDef(slots[0].item.defId) : null);
	// Single-item recycle scales with the stack count; batch reports how many items were selected.
	const selectedCount = $derived(isBatch ? slots.length : (slots[0]?.item.count ?? 0));

	// Aggregate the preview: sum identical output itemIds across all recyclable items (respecting
	// each source item's count multiplier), preserving first-seen order. Best-effort — may overstate
	// the yield if space runs out at recycle time.
	const resources = $derived.by(() => {
		const totals: { itemId: string; amount: number }[] = [];
		for (const { item } of slots) {
			const recycling = getDef(item.defId).recycling;
			if (!recycling) continue;
			for (const res of recycling) {
				const yield_ = res.amount * item.count;
				const existing = totals.find((t) => t.itemId === res.itemId);
				if (existing) existing.amount += yield_;
				else totals.push({ itemId: res.itemId, amount: yield_ });
			}
		}
		return totals;
	});

	const attachments = $derived(
		slots.flatMap(
			({ item }) => item.attachments?.filter((a): a is InstanceItem => a !== null) ?? []
		)
	);

	function handleClose() {
		overlay.closeRecycleModal();
	}

	function handleConfirm() {
		if (!modalData) return;
		inventory.recycleItems(modalData.locations);
		inventory.deselectUnrecyclable();
		overlay.closeRecycleModal();
	}
</script>

{#if modalData && slots.length}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		data-testid="recycle-modal"
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
		transition:fade={{ duration: 150 }}
		onclick={handleClose}
	>
		<div
			class="flex w-[300px] flex-col overflow-hidden rounded-md shadow-2xl md:w-[360px] lg:w-[420px] xl:w-[470px] 2xl:w-[540px] 3xl:w-[620px]"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
		>
			<div
				class="bg-modal px-4 py-3 text-modal-foreground md:px-5 md:py-4 lg:px-6 lg:py-5 2xl:px-7 2xl:py-6 3xl:px-8 3xl:py-7"
			>
				<h1
					class="mb-1.5 text-base leading-none font-black tracking-tight uppercase md:mb-2 md:text-lg lg:text-xl xl:text-2xl 2xl:mb-3 2xl:text-[28px] 3xl:text-[32px]"
				>
					{isBatch ? `Recycle ${slots.length} Items` : `Recycle ${def?.name}`}
				</h1>

				<p
					class="mb-2.5 text-[10px] leading-snug font-medium text-modal-secondary-foreground md:mb-3 md:text-[11px] lg:text-xs xl:text-[13px] 2xl:mb-5 2xl:text-[15px] 3xl:text-[17px]"
				>
					You have selected {selectedCount} item{selectedCount > 1 ? 's' : ''} to recycle. These are the
					resources you will get back:
				</p>

				<div
					class="flex min-h-[70px] flex-wrap gap-1.5 rounded bg-modal-secondary p-2 md:min-h-[80px] md:gap-2 md:p-2.5 lg:min-h-[90px] xl:min-h-[100px] 2xl:min-h-[110px] 2xl:gap-2.5 2xl:p-3 3xl:min-h-[130px] 3xl:gap-3 3xl:p-3.5"
				>
					{#each resources as res (res.itemId)}
						<ItemCard
							item={{
								uid: res.itemId,
								defId: res.itemId,
								count: res.amount
							}}
							selected={false}
							className="h-14 w-14 md:h-16 md:w-16 lg:h-18 lg:w-18 xl:h-20 xl:w-20 2xl:h-[90px] 2xl:w-[90px] 3xl:h-[105px] 3xl:w-[105px]"
							readonly={true}
						/>
					{/each}

					{#each attachments as att (att.uid)}
						<ItemCard
							item={att}
							selected={false}
							className="h-14 w-14 md:h-16 md:w-16 lg:h-18 lg:w-18 xl:h-20 xl:w-20 2xl:h-[90px] 2xl:w-[90px] 3xl:h-[105px] 3xl:w-[105px]"
							readonly={true}
						/>
					{/each}

					{#if resources.length === 0 && attachments.length === 0}
						<div
							class="flex w-full items-center justify-center text-[10px] font-bold text-black/30 md:text-[11px] lg:text-xs 2xl:text-sm 3xl:text-[15px]"
						>
							No resources can be salvaged.
						</div>
					{/if}
				</div>
			</div>

			<div
				class="flex gap-2 border border-accent/10 bg-surface px-4 py-3 md:gap-2.5 md:px-5 md:py-4 lg:gap-3 lg:px-6 lg:py-5 2xl:gap-4 2xl:px-7 2xl:py-6 3xl:px-8 3xl:py-7"
			>
				<button
					class="flex h-8 flex-1 items-center justify-center rounded-full bg-secondary text-[9px] font-bold tracking-widest text-white transition-colors hover:bg-secondary-hover active:scale-[0.98] md:h-9 md:text-[10px] lg:h-10 lg:text-[11px] 2xl:h-11 2xl:text-[13px] 3xl:h-12 3xl:text-[15px]"
					data-testid="recycle-cancel"
					onclick={handleClose}
				>
					CANCEL
				</button>
				<button
					class="flex h-8 flex-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold tracking-widest text-primary-foreground transition-colors hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 md:h-9 md:text-[10px] lg:h-10 lg:text-[11px] 2xl:h-11 2xl:text-[13px] 3xl:h-12 3xl:text-[15px]"
					data-testid="recycle-confirm"
					disabled={resources.length === 0}
					onclick={handleConfirm}
				>
					RECYCLE
				</button>
			</div>
		</div>
	</div>
{/if}
