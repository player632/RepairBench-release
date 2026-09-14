<script lang="ts">
	let { class: className = 'size-full' }: { class?: string } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	<circle cx="12" cy="12" r="10" />
	<line x1="12" y1="16" x2="12" y2="12" />
	<line x1="12" y1="8" x2="12.01" y2="8" />
</svg>
