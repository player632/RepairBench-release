<script lang="ts">
	import { flip } from 'svelte/animate';
	import { getGameContext } from '$lib/store/game.svelte';
	import Toast from './toast.svelte';

	const { notifications, device } = getGameContext();
</script>

{#if !device.isCoarsePointer}
	<div class="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-3" data-testid="toasts">
		{#each notifications.toasts as toast (toast.id)}
			<div animate:flip={{ duration: 250 }}>
				<Toast
					kind={toast.kind}
					label={toast.label}
					message={toast.message}
					amount={toast.amount}
					suffix={toast.suffix}
					onclose={() => notifications.dismiss(toast.id)}
				/>
			</div>
		{/each}
	</div>
{/if}
