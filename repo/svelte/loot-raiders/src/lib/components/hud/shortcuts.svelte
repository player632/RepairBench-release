<script lang="ts">
</script>

{#snippet shortcut(key: string, label: string)}
	<div class="flex items-center gap-1 md:gap-1.5 lg:gap-2 2xl:gap-2.5 4xl:gap-3">
		<kbd
			class="inline-flex min-w-7 items-center justify-center rounded-md bg-gradient-to-b from-kbd-from via-kbd-via to-kbd-to px-1.5 py-0.5 text-[7px] font-semibold text-kbd-text uppercase shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_1px_2px_rgba(0,0,0,0.2)] md:min-w-8 md:px-2 md:py-1 md:text-[8px] lg:min-w-9 lg:text-[9px] xl:text-[10px] 2xl:min-w-11 2xl:text-xs 3xl:min-w-12 3xl:text-[13px] 4xl:min-w-14 4xl:text-[14px]"
		>
			{key}
		</kbd>
		<span
			class="text-[7px] font-semibold tracking-wider text-muted uppercase md:text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs 3xl:text-[13px] 4xl:text-[14px]"
		>
			{label}
		</span>
	</div>
{/snippet}

<nav
	class="z-10 flex gap-3 md:gap-4 lg:gap-6 xl:gap-7 2xl:gap-8 3xl:gap-10 4xl:gap-12"
	aria-label="Keyboard shortcuts"
>
	{@render shortcut('Ctrl', 'Multi select')}
	{@render shortcut('Shift', 'Quick move')}
	{@render shortcut('Alt', 'Split stack')}
</nav>
