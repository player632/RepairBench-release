<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fly, fade } from 'svelte/transition';
	import type { ToastKind } from '$lib/store/notifications.svelte';

	let {
		kind = 'stage',
		label,
		message,
		amount,
		suffix = '',
		ttl = 3200,
		onclose
	}: {
		kind?: ToastKind;
		label: string;
		message?: string;
		amount?: number;
		suffix?: string;
		ttl?: number;
		onclose?: () => void;
	} = $props();

	const ACCENT: Record<ToastKind, string> = {
		stage: '#22c55e',
		augment: '#22d3ee',
		shield: '#22c55e'
	};
	const accent = $derived(ACCENT[kind]);

	const count = new Tween(0, { duration: 850, easing: cubicOut });
	const target = untrack(() => amount);
	if (target != null) count.target = target;

	onMount(() => {
		if (ttl <= 0) return;
		const t = setTimeout(() => onclose?.(), ttl);
		return () => clearTimeout(t);
	});

	function growY(_node: Element, { duration = 420 }: { duration?: number } = {}) {
		return {
			duration,
			easing: cubicOut,
			css: (t: number) => `transform: scaleY(${t})`
		};
	}
</script>

<button
	type="button"
	data-testid="toast"
	data-kind={kind}
	onclick={() => onclose?.()}
	in:fly={{ x: 6, duration: 380, easing: cubicOut }}
	out:fade={{ duration: 300 }}
	class="pointer-events-auto flex w-[200px] gap-3 text-left"
>
	<div class="flex-1">
		<div class="flex items-baseline justify-between">
			<span
				class="font-mono text-[9px] font-bold tracking-[0.3em] uppercase"
				style="color: {accent};"
			>
				{label}
			</span>
			{#if amount != null}
				<span class="font-mono text-[15px] font-extrabold tabular-nums" style="color: {accent};">
					+{Math.round(count.current)}{suffix}
				</span>
			{/if}
		</div>
		{#if message}
			<div class="mt-0.5 text-[14px] font-semibold text-white">
				{message}
			</div>
		{/if}
	</div>

	<span
		in:growY={{ duration: 420 }}
		class="w-[3px] origin-top"
		style="background: {accent}; box-shadow: 0 0 8px {accent}bf;"
	></span>
</button>
