<script lang="ts">
	let { class: className = 'size-3' }: { class?: string } = $props();
</script>

<svg
	class={className}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2.5"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<polyline points="17 11 12 6 7 11"></polyline>
	<polyline points="17 18 12 13 7 18"></polyline>
</svg>
