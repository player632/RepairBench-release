<script lang="ts">
	import { fade } from "svelte/transition";

	export function pop(text: string, duration = 1) {
		toast = [text, ...toast];
		setTimeout(() => (toast = toast.slice(1)), duration * 1000);
	}
	let toast: string[] = [];
</script>

<div data-testid="toaster" class="toast">
	{#each toast as slice}
		<div data-testid="toast-slice" class="slice" out:fade={{ duration: 200 }}>{slice}</div>
	{/each}
</div>

<style>
	.toast {
		top: 10%;
		left: 50%;
		transform: translateX(-50%);
		position: absolute;
		z-index: 10;
		font-weight: bold;
	}
	.slice {
		color: var(--bg-primary);
		background: var(--fg-primary);
		padding: 16px;
		margin: 16px auto;
		border-radius: 4px;
		width: fit-content;
	}
</style>
