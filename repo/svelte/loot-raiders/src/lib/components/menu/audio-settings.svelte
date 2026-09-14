<script lang="ts">
	import { getGameContext } from '$lib/store/game.svelte';

	const { audio } = getGameContext();

	const MAX = 2;
	const STEPS = 10;

	const pct = $derived(audio.muted ? 0 : Math.round((audio.volume / MAX) * 100));
	const onCount = $derived(Math.round((pct / 100) * STEPS));
	const level = $derived(audio.muted ? 0 : audio.volume / MAX < 0.5 ? 1 : 2);

	const fillOpacity = $derived(0.35 + 0.65 * (pct / 100));

	function onInput(e: Event) {
		audio.setVolume(Number((e.currentTarget as HTMLInputElement).value));
		if (audio.muted) audio.toggleMute();
	}
	function toggleMute() {
		audio.play('click');
		audio.toggleMute();
	}
</script>

<div
	class="group flex w-full items-center gap-3 rounded-md border border-hairline bg-row px-5 py-3.5 transition-all hover:bg-accent-tint 2xl:gap-3.5 2xl:px-6 2xl:py-4 3xl:gap-4 3xl:px-7 3xl:py-4.5 4xl:px-8 4xl:py-5 pointer-coarse:gap-2 pointer-coarse:px-3.5 pointer-coarse:py-2.5"
>
	<!-- speaker = mute toggle -->
	<button
		type="button"
		onclick={toggleMute}
		aria-label={audio.muted ? 'Unmute' : 'Mute'}
		aria-pressed={audio.muted}
		class="group flex shrink-0 cursor-pointer items-center transition-colors {audio.muted
			? 'text-fg-faint'
			: 'text-fg'}"
	>
		<svg
			viewBox="0 0 24 24"
			class="h-5 w-5 text-fg-muted group-hover:text-fg 2xl:h-[22px] 2xl:w-[22px] 3xl:h-6 3xl:w-6 4xl:h-7 4xl:w-7 pointer-coarse:h-4 pointer-coarse:w-4"
			fill="none"
			stroke="currentColor"
			stroke-width="1.7"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M4 9h3l4-3.5v13L7 15H4z" fill="currentColor" stroke="none" />
			{#if !audio.muted && level >= 1}
				<path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
			{/if}
			{#if !audio.muted && level >= 2}
				<path d="M18 6.8a7.5 7.5 0 0 1 0 10.4" />
			{/if}
			{#if audio.muted}
				<path d="M16 9.5l4.5 5M20.5 9.5l-4.5 5" />
			{/if}
		</svg>
	</button>

	<div
		onclick={toggleMute}
		class="text-[15px] font-semibold tracking-wider text-fg-body group-hover:text-fg lg:text-base 2xl:text-[17px] 3xl:text-lg 4xl:text-xl pointer-coarse:text-sm"
	>
		Sound
	</div>

	<div class="relative flex h-8 flex-1 items-center 3xl:h-9 pointer-coarse:h-5">
		<div class="pointer-events-none flex w-full items-center gap-1">
			{#each { length: STEPS }, i (i)}
				<span
					class="h-[20px] flex-1 rounded-[3px] transition-[background-color,opacity] pointer-coarse:h-[17.5px] {i <
					onCount
						? 'bg-accent'
						: 'bg-[rgba(190,205,225,0.16)]/40'}"
					style={i < onCount ? `opacity: ${fillOpacity}` : undefined}
				></span>
			{/each}
		</div>
		<input
			type="range"
			min="0"
			max="2"
			step="0.2"
			value={audio.volume}
			oninput={onInput}
			aria-label="Volume"
			class="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
		/>
	</div>

	<span
		class="w-10 text-right font-mono text-[13px] font-semibold tabular-nums 2xl:text-sm 3xl:w-12 3xl:text-[15px] 4xl:w-14 4xl:text-base pointer-coarse:w-8 pointer-coarse:text-[11px] {audio.muted
			? 'text-fg-faint'
			: 'text-accent'}">{audio.muted ? 'OFF' : `${pct}%`}</span
	>
</div>
