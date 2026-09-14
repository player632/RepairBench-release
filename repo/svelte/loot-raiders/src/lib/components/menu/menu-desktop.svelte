<script lang="ts">
	import { getGameContext } from '$lib/store/game.svelte';
	import { toggleFullscreen, enterFullscreen, isTouchDevice } from '$lib/fullscreen';
	import { getMyRank } from '$lib/leaderboard/leaderboard-local';
	import AudioSettings from './audio-settings.svelte';
	import Play from '$lib/ui-icon/play.svelte';
	import Restart from '$lib/ui-icon/restart.svelte';
	import Exit from '$lib/ui-icon/exit.svelte';
	import Video from '$lib/ui-icon/video.svelte';
	import Fullscreen from '$lib/ui-icon/fullscreen.svelte';
	import LeaderboardIcon from '$lib/ui-icon/leaderboard.svelte';
	import ChevronRight from '$lib/ui-icon/chevron-right.svelte';

	const { audio, overlay, tutorial, gameLoop, device } = getGameContext();

	const isIdle = $derived(gameLoop.status === 'idle');

	const rankQuery = getMyRank();
	const myRank = $derived(rankQuery.current ?? null);

	function play() {
		audio.play('click');
		if (isTouchDevice()) enterFullscreen();
		tutorial.enter();
	}
	function openLeaderboard() {
		audio.play('click');
		overlay.openLeaderboard();
	}
	function resume() {
		audio.play('click');
		if (isTouchDevice()) enterFullscreen();
		gameLoop.resume();
	}
	function restart() {
		audio.play('click');
		if (isTouchDevice()) enterFullscreen();
		gameLoop.restart();
	}
	function exit() {
		audio.play('click');
		gameLoop.quit();
	}
	function howToPlay() {
		audio.play('click');
		if (isTouchDevice()) enterFullscreen();
		tutorial.start();
	}
	function onFullscreen() {
		audio.play('click');
		toggleFullscreen();
	}
</script>

<div class="pointer-coarse:gap-1.2 flex flex-col gap-1.5 lg:gap-2 3xl:gap-4 4xl:gap-3.5">
	{#if isIdle}
		<button
			onclick={play} data-testid="menu-play"
			class="group flex w-full items-center gap-3 rounded-md bg-gradient-to-b from-primary-top to-primary-bottom px-5 py-4 text-left font-bold transition-all hover:brightness-105 active:scale-[0.99] 2xl:gap-3.5 2xl:px-6 2xl:py-4.5 3xl:gap-4 3xl:px-7 3xl:py-5 4xl:px-8 4xl:py-5.5 pointer-coarse:gap-2 pointer-coarse:px-3.5 pointer-coarse:py-2.5"
		>
			<Play
				class="size-[18px] flex-none text-primary-ink 2xl:size-5 3xl:size-6 4xl:size-7 pointer-coarse:size-4"
			/>
			<span
				class="flex-1 text-base font-extrabold tracking-wide text-primary-ink 2xl:text-[17px] 3xl:text-lg 4xl:text-xl pointer-coarse:text-sm"
				>Play</span
			>
			<kbd
				class="inline-flex min-w-8 items-center justify-center rounded-md border border-primary-ink/20 bg-primary-ink/10 px-1.5 py-0.5 text-[9px] font-bold text-primary-ink uppercase md:min-w-9 md:text-[10px] 2xl:min-w-10 2xl:text-[11px] 3xl:min-w-11 3xl:px-2 3xl:text-xs 4xl:min-w-12 4xl:text-[13px] pointer-coarse:hidden"
				>space</kbd
			>
		</button>

		<button
			onclick={openLeaderboard} data-testid="menu-leaderboard"
			class="group flex w-full items-center gap-3 rounded-md border border-hairline bg-row px-5 py-3.5 text-left transition-all hover:bg-accent-tint active:scale-[0.99] 2xl:gap-3.5 2xl:px-6 2xl:py-4 3xl:gap-4 3xl:px-7 3xl:py-4.5 4xl:px-8 4xl:py-5 pointer-coarse:gap-2 pointer-coarse:px-3.5 pointer-coarse:py-2.5"
		>
			<LeaderboardIcon
				class="size-5 flex-none text-fg-muted group-hover:text-fg 2xl:size-[22px] 3xl:size-6 4xl:size-7 pointer-coarse:size-4"
			/>
			<span
				class="flex-1 text-[15px] font-semibold tracking-wider text-fg-body group-hover:text-fg lg:text-base 2xl:text-[17px] 3xl:text-lg 4xl:text-xl pointer-coarse:text-sm"
				>Leaderboard</span
			>

			<span
				class="flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider uppercase 2xl:text-[10px] 3xl:text-sm 4xl:text-[15px] pointer-coarse:text-[8px]"
			>
				{#if myRank !== null}
					<span class="text-accent tabular-nums">Rank # {myRank}</span>
				{/if}
			</span>

			<ChevronRight
				class="size-[18px] flex-none text-fg-muted 2xl:size-5 3xl:size-6 4xl:size-7 pointer-coarse:size-4"
			/>
		</button>
	{:else}
		<button
			onclick={resume} data-testid="menu-resume"
			class="group flex w-full items-center gap-3 rounded-md bg-gradient-to-b from-primary-top to-primary-bottom px-5 py-4 text-left font-bold transition-all hover:brightness-105 active:scale-[0.99] 2xl:gap-3.5 2xl:px-6 2xl:py-4.5 3xl:gap-4 3xl:px-7 3xl:py-5 4xl:px-8 4xl:py-5.5 pointer-coarse:gap-2 pointer-coarse:px-3.5 pointer-coarse:py-2.5"
		>
			<Play
				class="size-[18px] flex-none text-primary-ink 2xl:size-5 3xl:size-6 4xl:size-7 pointer-coarse:size-4"
			/>
			<span
				class="flex-1 text-base font-extrabold tracking-wide text-primary-ink 2xl:text-[17px] 3xl:text-lg 4xl:text-xl pointer-coarse:text-sm"
				>Resume</span
			>
			<kbd
				class="inline-flex min-w-8 items-center justify-center rounded-md border border-primary-ink/20 bg-primary-ink/10 px-1.5 py-0.5 text-[9px] font-bold text-primary-ink uppercase md:min-w-9 md:text-[10px] 2xl:min-w-10 2xl:text-[11px] 3xl:min-w-11 3xl:px-2 3xl:text-xs 4xl:min-w-12 4xl:text-[13px] pointer-coarse:hidden"
				>esc</kbd
			>
		</button>

		<button
			onclick={restart} data-testid="menu-restart"
			class="group flex w-full items-center gap-3 rounded-md border border-hairline bg-row px-5 py-3.5 text-left transition-all hover:bg-accent-tint active:scale-[0.99] 2xl:gap-3.5 2xl:px-6 2xl:py-4 3xl:gap-4 3xl:px-7 3xl:py-4.5 4xl:px-8 4xl:py-5 pointer-coarse:gap-2 pointer-coarse:px-3.5 pointer-coarse:py-2.5"
		>
			<Restart
				class="size-5 flex-none text-fg-muted group-hover:text-fg 2xl:size-[22px] 3xl:size-6 4xl:size-7 pointer-coarse:size-4"
			/>
			<span
				class="flex-1 text-[15px] font-semibold tracking-wider text-fg-body group-hover:text-fg lg:text-base 2xl:text-[17px] 3xl:text-lg 4xl:text-xl pointer-coarse:text-sm"
				>Restart</span
			>
		</button>

		<button
			onclick={exit} data-testid="menu-exit"
			class="group flex w-full items-center gap-3 rounded-md border border-hairline bg-row px-5 py-3.5 text-left transition-all hover:bg-accent-tint active:scale-[0.99] 2xl:gap-3.5 2xl:px-6 2xl:py-4 3xl:gap-4 3xl:px-7 3xl:py-4.5 4xl:px-8 4xl:py-5 pointer-coarse:gap-2 pointer-coarse:px-3.5 pointer-coarse:py-2.5"
		>
			<Exit
				class="size-5 flex-none text-fg-muted group-hover:text-fg 2xl:size-[22px] 3xl:size-6 4xl:size-7 pointer-coarse:size-4"
			/>
			<span
				class="flex-1 text-[15px] font-semibold tracking-wider text-fg-body group-hover:text-fg lg:text-base 2xl:text-[17px] 3xl:text-lg 4xl:text-xl pointer-coarse:text-sm"
				>End the Raid</span
			>
		</button>
		<div
			class="my-0.5 hidden h-px w-full bg-hairline md:my-0.5 md:block 2xl:my-0 pointer-coarse:hidden"
		></div>
	{/if}

	{#if isIdle}
		<button
			onclick={howToPlay} data-testid="menu-howto"
			class="group flex w-full items-center gap-3 rounded-md border border-hairline bg-row px-5 py-3.5 text-left transition-all hover:bg-accent-tint active:scale-[0.99] 2xl:gap-3.5 2xl:px-6 2xl:py-4 3xl:gap-4 3xl:px-7 3xl:py-4.5 4xl:px-8 4xl:py-5 pointer-coarse:gap-2 pointer-coarse:px-3.5 pointer-coarse:py-2.5"
		>
			<Video
				class="size-5 flex-none text-fg-muted group-hover:text-fg 2xl:size-[22px] 3xl:size-6 4xl:size-7 pointer-coarse:size-4"
			/>
			<span
				class="flex-1 text-[15px] font-semibold tracking-wider text-fg-body group-hover:text-fg lg:text-base 2xl:text-[17px] 3xl:text-lg 4xl:text-xl pointer-coarse:text-sm"
				>How to Play</span
			>
		</button>
		<div
			class="my-0.5 hidden h-px w-full bg-hairline md:my-0.5 md:block 2xl:my-0 pointer-coarse:hidden"
		></div>
	{/if}

	<AudioSettings />

	<button
		onclick={onFullscreen}
		class="group flex w-full items-center gap-3 rounded-md border border-hairline bg-row px-5 py-3.5 text-left transition-all hover:bg-accent-tint active:scale-[0.99] 2xl:gap-3.5 2xl:px-6 2xl:py-4 3xl:gap-4 3xl:px-7 3xl:py-4.5 4xl:px-8 4xl:py-5 pointer-coarse:gap-2 pointer-coarse:px-3.5 pointer-coarse:py-2.5"
	>
		<Fullscreen
			class="size-5 flex-none text-fg-muted group-hover:text-fg 2xl:size-[22px] 3xl:size-6 4xl:size-7 pointer-coarse:size-4"
		/>
		<span
			class="flex-1 text-[15px] font-semibold tracking-wider text-fg-body group-hover:text-fg lg:text-base 2xl:text-[17px] 3xl:text-lg 4xl:text-xl pointer-coarse:text-sm"
			>Fullscreen</span
		>
		<span
			class="font-mono text-[11px] font-bold tracking-wide text-fg-faint uppercase 2xl:text-xs 3xl:text-[13px] 4xl:text-sm pointer-coarse:text-[10px]"
			>{device.isFullscreen ? 'On' : 'Off'}</span
		>
	</button>
</div>
