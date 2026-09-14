<script lang="ts">
	import { droppable } from '$lib/actions/actions';
	import type { SlotState } from '$lib/types';

	type Props = {
		slotState: SlotState;
		className?: string;
		placeholder?: string;
	};

	let { slotState, className = '', placeholder }: Props = $props();
</script>

<div class={className} {@attach droppable(slotState)}>
	<div
		class="flex h-full w-full cursor-default items-center justify-center rounded-lg border border-white/20"
	>
		{#if placeholder}
			<img src={placeholder} alt="placeholder" class="w-[50%] object-contain opacity-50" />
		{/if}
	</div>
</div>
