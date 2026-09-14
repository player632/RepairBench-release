<script lang="ts">
	let { class: className = 'size-2' }: { class?: string } = $props();
</script>

<svg
	class="{className} text-cyan-500/50"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="3"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<polyline points="9 18 15 12 9 6"></polyline>
</svg>
