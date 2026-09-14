<script lang="ts">
	let { class: className = 'size-[18px]' }: { class?: string } = $props();
</script>

<svg
	class={className}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.6"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<rect x="3" y="5" width="18" height="14" rx="2" />
	<path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
</svg>
