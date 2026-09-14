<script lang="ts">
	import { droppable } from '$lib/actions/actions';
	import { getGameContext } from '$lib/store/game.svelte';
	import type { SlotState, ItemLocation } from '$lib/types';

	const { interaction, tutorial } = getGameContext();

	const trashLocation: ItemLocation = { type: 'trash' };
	const trashSlotState: SlotState = { location: trashLocation, item: null };

	// While the tutorial keeps drops locked, the zone shows no drag/hover border.
	const isDragging = $derived(interaction.status === 'dragging' && tutorial.canDrop);
	const isHovered = $derived(isDragging && interaction.isHovered(trashLocation));
</script>

<div class="relative w-full" data-testid="dropzone" {@attach droppable(trashSlotState)}>
	<div
		class="pointer-events-none absolute -inset-1 rounded-xl border-2 transition-colors duration-150
		{isHovered
			? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
			: isDragging
				? 'border-red-600/40'
				: 'border-transparent'}"
	></div>

	<div
		class="relative flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg border border-white/20 transition-all duration-150 md:min-h-24 md:gap-1.5 lg:min-h-32 lg:gap-2 xl:min-h-36 2xl:min-h-40 3xl:min-h-44 3xl:gap-2.5"
	>
		<img
			src="assets/ui/drop.webp"
			alt="Drop Item"
			class="size-5 object-contain transition-all duration-150 md:size-8 lg:size-10 2xl:size-12 3xl:size-14"
		/>
		<span
			class="font-sans text-[8px] text-white uppercase md:text-[9px] lg:text-[10px] xl:text-[11px] 2xl:text-sm 3xl:text-[15px]"
			>drop item</span
		>
	</div>
</div>
