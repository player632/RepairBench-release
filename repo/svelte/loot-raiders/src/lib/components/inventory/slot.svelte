<script lang="ts">
	import { getGameContext } from '$lib/store/game.svelte';
	import ItemSlot from './item-slot.svelte';
	import EmptySlot from './empty-slot.svelte';
	import Scanner from './scanner.svelte';
	import type { ItemLocation } from '$lib/types';

	type Props = {
		location: ItemLocation;
		class: string;
		placeholder?: string;
	};

	let { location, class: className = '', placeholder }: Props = $props();

	const { interaction, inventory, overlay, loot, selection, gameLoop } = getGameContext();
	const item = $derived(inventory.getItem(location));
	const itemUid = $derived(item?.uid ?? '');
	const selectedItem = $derived(selection.isSelected(itemUid));
	const slotState = $derived({ location, item });

	const isAugmentSlot = $derived(location.type === 'slot' && location.storageId === 'augment');
	const isLootBack = $derived(
		location.type === 'slot' && location.storageId === 'lootBack' && !!item
	);
	const scanningItem = $derived(isLootBack && loot.scanning(itemUid));
	const loading = $derived(isLootBack && loot.hidden(itemUid));
	const showShine = $derived(loot.shineQueue.has(itemUid));

	const isDraggingThisItem = $derived(interaction.isSource(location));

	const isHovered = $derived(interaction.isHovered(location));
	const showInvalidHint = $derived(interaction.shouldShowInvalidHint(slotState));

	let augmentTapWasOpen = false;
</script>

<div
	class="{className}  relative overflow-hidden rounded-lg"
	data-tut-slot={location.type === 'slot' ? `${location.storageId}-${location.index}` : null}
	data-testid={location.type === 'slot' ? `slot-${location.storageId}-${location.index}` : undefined}
>
	{@render gradientBorder()}
	<!-- svelte-ignore a11y_no_static_element_interactions -->

	{#if loading || scanningItem}
		<div class="h-full w-full p-[1.5px] md:p-[2px] lg:p-[3.5px]">
			<div class="relative h-full w-full overflow-hidden rounded-[7px]">
				{@render loadingItem()}
			</div>
		</div>
	{:else}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="relative z-20 h-full w-full p-[1.5px] md:p-[2px] lg:p-[3.5px]"
			onpointerdowncapture={(e) => {
				if (e.button === 0) {
					if (!item) selection.clear();
					overlay.closeContextMenu();
				}
				augmentTapWasOpen = isAugmentSlot && overlay.augmentPanel !== null;
			}}
			oncontextmenu={(e) => {
				e.preventDefault();
				if (isAugmentSlot) return;
				if (e.ctrlKey) return;
				if (slotState.item) {
					overlay.openContextMenu(e.clientX, e.clientY, slotState);
					// File-manager convention: keep an active multi-selection when right-clicking one
					// of its members; otherwise collapse the selection to just this item.
					if (!selection.isSelected(slotState.item.uid)) selection.select(slotState.item.uid);
				}
			}}
			onclick={(e) => {
				if (!isAugmentSlot || augmentTapWasOpen) return;
				const rect = e.currentTarget.getBoundingClientRect();
				overlay.openAugmentUpgrade(rect.right, rect.top);
			}}
			onpointerenter={(e) => {
				if (e.pointerType === 'touch') return;
				if (interaction.status !== 'idle' || !item) return;
				const rect = e.currentTarget.getBoundingClientRect();
				if (isAugmentSlot) {
					overlay.openAugmentUpgrade(rect.right, rect.top);
				} else {
					overlay.showTooltip(rect.right, rect.top, item);
				}
			}}
			onpointerleave={() => {
				if (isAugmentSlot) {
					overlay.closeAugmentUpgrade();
				} else {
					overlay.hideTooltip();
				}
			}}
		>
			{#if item && !isDraggingThisItem}
				<div
					class="relative h-full w-full"
					class:shine-effect={showShine}
					onanimationend={() => loot.clearShine(itemUid)}
				>
					<ItemSlot
						{slotState}
						selected={selectedItem}
						className="h-full w-full"
						onmatched={() => inventory.removeMatch(itemUid)}
					/>
				</div>
			{:else}
				<EmptySlot {slotState} {placeholder} className="h-full w-full" />
			{/if}
		</div>
		{@render invalidIcon()}
	{/if}
</div>

{#snippet loadingItem()}
	<div class="loading-border h-full w-full rounded-lg p-[1.5px]">
		<div class="h-full w-full rounded-[7px] bg-[#080b14]"></div>
	</div>
	{#if scanningItem}
		<Scanner onscanned={() => loot.slotScanned()} pause={gameLoop.status === 'paused'} />
	{/if}
{/snippet}

{#snippet gradientBorder()}
	{#if isHovered}
		<div class="glow-ring-mask absolute inset-0 z-0 transition-opacity duration-300">
			<div class="glow-animation absolute inset-[-100%]"></div>
		</div>
	{/if}
{/snippet}

{#snippet invalidIcon()}
	{#if showInvalidHint}
		<div class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
			<img src="/assets/ui/invalid.webp" alt="!!" class="size-10 opacity-50" />
		</div>
	{/if}
{/snippet}

<style>
	.shine-effect {
		position: relative;
		overflow: hidden;
		border-radius: 7px;
	}

	.shine-effect::after {
		content: '';
		position: absolute;
		border-radius: inherit;

		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 50;
		pointer-events: none;
		transform: skewX(-20deg) translateX(-150%);
		background: linear-gradient(
			to right,
			transparent 0%,
			rgba(255, 255, 255, 0) 10%,
			rgba(255, 255, 255, 0.6) 50%,
			rgba(255, 255, 255, 0) 90%
		);
		mix-blend-mode: overlay;
		animation: shine 0.4s ease-out forwards;
	}

	@keyframes shine {
		0% {
			transform: skewX(-20deg) translateX(-150%);
		}
		100% {
			transform: skewX(-20deg) translateX(150%);
		}
	}

	.loading-border {
		background: conic-gradient(
			from 90deg,
			var(--glow-cyan),
			var(--glow-magenta) 180deg,
			var(--glow-cyan) 360deg
		);
		opacity: 0.5;
	}

	.glow-ring-mask {
		border-radius: inherit;

		padding: 1px;

		-webkit-mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);

		/* cut center */
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
