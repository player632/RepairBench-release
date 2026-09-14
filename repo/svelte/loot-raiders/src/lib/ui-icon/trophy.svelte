<script lang="ts">
	let { class: className = 'size-5' }: { class?: string } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.7"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	<path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" />
	<path d="M6 6H3.5v1A3.5 3.5 0 0 0 7 10.5M18 6h2.5v1A3.5 3.5 0 0 1 17 10.5" />
	<path d="M9 15h6M8 20h8M10 15l-.5 5M14 15l.5 5" />
</svg>
