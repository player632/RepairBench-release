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
	<polyline points="4 9 4 4 9 4" />
	<polyline points="15 4 20 4 20 9" />
	<polyline points="20 15 20 20 15 20" />
	<polyline points="9 20 4 20 4 15" />
</svg>
