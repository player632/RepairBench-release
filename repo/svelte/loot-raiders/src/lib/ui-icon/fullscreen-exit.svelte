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
	<polyline points="4 10 10 10 10 4" />
	<polyline points="20 10 14 10 14 4" />
	<polyline points="14 20 14 14 20 14" />
	<polyline points="10 20 10 14 4 14" />
</svg>
