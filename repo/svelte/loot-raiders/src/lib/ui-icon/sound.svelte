<script lang="ts">
	let { class: className = 'size-3', muted = false }: { class?: string; muted?: boolean } =
		$props();

	const level = $derived(muted ? 0 : 2);
</script>

<svg
	class={className}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.7"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d="M4 9h3l4-3.5v13L7 15H4z" fill="currentColor" stroke="none" />
	{#if !muted && level >= 1}
		<path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
	{/if}
	{#if !muted && level >= 2}
		<path d="M18 6.8a7.5 7.5 0 0 1 0 10.4" />
	{/if}
	{#if muted}
		<path d="M16 9.5l4.5 5M20.5 9.5l-4.5 5" />
	{/if}
</svg>
