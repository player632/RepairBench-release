<script lang="ts">
	import { droppable, draggable } from '$lib/actions/actions';
	import { getGameContext } from '$lib/store/game.svelte';
	import { getDef } from '$lib/config/items';
	import { getRarityStyle } from '$lib/config/rarity';
	import type { InstanceItem, ItemLocation, SlotState } from '$lib/types';

	type Props = {
		parentLocation: ItemLocation;
		attachIndex: number;
		attachment: InstanceItem | null;
		placeholder?: string;
	};

	let { parentLocation, attachIndex, attachment, placeholder }: Props = $props();

	const { interaction } = getGameContext();

	const location: ItemLocation = $derived({ type: 'attachment', parentLocation, attachIndex });
	const slotState: SlotState = $derived({ location, item: attachment });

	const isDraggingThisItem = $derived(interaction.isSource(location));

	const def = $derived(attachment ? getDef(attachment.defId) : null);
	const style = $derived(def ? getRarityStyle(def.rarity) : null);

	let isHovered = $state(false);
</script>

{#if attachment && def && style && !isDraggingThisItem}
	<div
		class="relative z-20 aspect-square size-6 rounded-lg md:size-7 lg:size-8 2xl:size-10 3xl:size-12"
		data-slot-type="attachment"
		{@attach droppable(slotState)}
		{@attach draggable(slotState)}
		onpointerenter={(e) => {
			if (e.pointerType === 'touch') return;
			isHovered = true;
		}}
		onpointerleave={() => (isHovered = false)}
	>
		{@render glowRing()}
		<div class="relative z-10 h-full w-full p-[2px]">
			<div
				class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-linear-to-tr p-[1px] {style.border}"
			>
				<div class="relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-surface">
					<div
						class="absolute bottom-0 left-0 z-0 h-[80%] w-[80%] opacity-60 blur-xl {style.glow}"
					></div>
					<div class="relative min-h-0 flex-1 items-center justify-center">
						<img
							src={def.image}
							alt={def.name}
							class="relative z-10 h-full w-full scale-125 object-contain"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div
		class="relative z-20 aspect-square size-6 rounded-lg md:size-7 lg:size-8 2xl:size-10 3xl:size-12"
		data-slot-type="attachment"
		{@attach droppable(slotState)}
		onpointerenter={(e) => {
			if (e.pointerType === 'touch') return;
			isHovered = true;
		}}
		onpointerleave={() => (isHovered = false)}
	>
		{@render glowRing()}
		<div class="relative z-10 h-full w-full p-[2px]">
			<div
				class="flex h-full w-full cursor-default items-center justify-center rounded-lg border border-white/20"
			>
				{#if placeholder}
					<img src={placeholder} alt="mod slot" class="h-[90%] w-[90%] object-contain opacity-20" />
				{/if}
			</div>
		</div>
	</div>
{/if}

{#snippet glowRing()}
	{#if isHovered}
		<div class="glow-ring-mask absolute inset-0 z-0">
			<div class="glow-animation absolute inset-[-100%]"></div>
		</div>
	{/if}
{/snippet}

<style>
	.glow-ring-mask {
		border-radius: inherit;
		padding: 1px;
		-webkit-mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
	}

	.glow-animation {
		background: conic-gradient(
			from 0deg,
			var(--glow-magenta) 0deg,
			var(--glow-cyan) 45deg,
			transparent 90deg,
			var(--glow-blue) 135deg,
			var(--glow-magenta) 180deg,
			var(--glow-cyan) 240deg,
			transparent 270deg,
			var(--glow-magenta) 330deg,
			var(--glow-magenta) 360deg
		);
		animation: rotate 4s linear infinite;
		will-change: transform;
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
