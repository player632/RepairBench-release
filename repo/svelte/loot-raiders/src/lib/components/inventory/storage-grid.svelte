<script lang="ts">
	import Slot from './slot.svelte';
	import { getStorageConfig } from '$lib/config/storages';
	import { getGameContext } from '$lib/store/game.svelte';
	import { getAugmentUpgrade } from '$lib/config/augments';
	import type { StorageId } from '$lib/types';

	type Props = {
		storageId: StorageId;
		class?: string;
	};
	let { storageId, class: className = '' }: Props = $props();
	const { inventory, overlay } = getGameContext();
	const config = $derived(getStorageConfig(storageId));
	const slotCount = $derived(inventory.getStorageSize(storageId));

	const tempSlots = $derived.by(() => {
		if (storageId !== 'backpack' || !overlay.augmentPanel) return 0;
		if (!inventory.augmentItem) return 0;
		const upgrade = getAugmentUpgrade(inventory.augmentItem.defId);
		return upgrade?.bonusSlots ?? 0;
	});
</script>

{#each { length: slotCount } as _, index (index)}
	<Slot
		location={{ type: 'slot', storageId: config.name, index }}
		placeholder={config.placeholder}
		class={className}
	/>
{/each}
{#each { length: tempSlots } as _, i (i)}
	<div class="{className} p-1">
		<div
			class="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-cyan-400/60 bg-cyan-400/5"
		>
			<span class="text-[10px] font-bold text-cyan-400/50">+</span>
		</div>
	</div>
{/each}
