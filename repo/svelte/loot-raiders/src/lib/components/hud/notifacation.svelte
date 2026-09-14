<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	let {
		amount = 200,
		label = 'XP',
		message = 'Scavenged'
	}: {
		amount?: number | string;
		label?: string;
		message?: string;
	} = $props();
</script>

<div
	class="pointer-events-none flex items-center gap-3"
	in:fly={{ y: 15, duration: 300 }}
	out:fade={{ duration: 200 }}
>
	<div class="flex items-center gap-2 bg-[#ffbc00] px-2.5 py-0.5 text-[#0a0a0a]">
		<span class="text-lg font-black tracking-[-0.08em] uppercase">
			{label}
		</span>

		<span class="text-lg font-bold">
			+{amount}
		</span>
	</div>

	<span
		class="text-lg font-semibold tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
	>
		{message}
	</span>
</div>
