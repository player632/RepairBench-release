<script lang="ts">
	import { droppable, draggable } from '$lib/actions/actions';
	import { getDef } from '$lib/config/items';
	import WeaponCard from './weapon-card.svelte';
	import ItemCard from './item-card.svelte';

	import type { SlotState } from '$lib/types';

	type Props = {
		slotState: SlotState;
		className?: string;
		selected: boolean;
		onmatched?: () => void;
	};

	let { slotState, className = '', selected, onmatched }: Props = $props();

	// Guaranteed non-null — parent only renders ItemSlot when slotState.item exists
	const item = $derived(slotState.item!);
	const location = $derived(slotState.location);

	const def = $derived(getDef(item.defId));
	const showAsWeaponCard = $derived(
		def.type === 'weapon' && location.type === 'slot' && location.storageId === 'weapon'
	);

	// Augment is fixed in its slot by design — the player can never drag it out.
	const isAugment = $derived(location.type === 'slot' && location.storageId === 'augment');
</script>

<div
	class="{className} h-full w-full"
	data-tut-item={item.defId}
	data-testid={`item-${item.defId}`}
	{@attach droppable(slotState)}
	{@attach !isAugment && draggable(slotState)}
>
	{#if showAsWeaponCard}
		<WeaponCard {item} {location} className="h-full w-full" {onmatched} />
	{:else}
		<ItemCard {item} {selected} {location} className="h-full w-full" {onmatched} />
	{/if}
</div>
