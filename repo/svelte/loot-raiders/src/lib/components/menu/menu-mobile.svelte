<script lang="ts">
	import { fly } from 'svelte/transition';
	import { getGameContext } from '$lib/store/game.svelte';
	import { toggleFullscreen, enterFullscreen, isTouchDevice } from '$lib/fullscreen';
	import { getMyRank } from '$lib/leaderboard/leaderboard-local';
	import { formatTime } from '$lib/utils';
	import { STAGES } from '$lib/config/stages';
	import Play from '$lib/ui-icon/play.svelte';
	import Restart from '$lib/ui-icon/restart.svelte';
	import Exit from '$lib/ui-icon/exit.svelte';
	import Video from '$lib/ui-icon/video.svelte';
	import Fullscreen from '$lib/ui-icon/fullscreen.svelte';
	import Sound from '$lib/ui-icon/sound.svelte';
	import LeaderboardIcon from '$lib/ui-icon/leaderboard.svelte';

	const { audio, overlay, tutorial, gameLoop, inventory, quest } = getGameContext();

	const optionClass =
		'group flex items-center gap-2 rounded-md border border-hairline bg-row px-3.5 py-2.5 text-left backdrop-blur-md transition-all active:scale-[0.99] active:border-accent/40';

	const paused = $derived(gameLoop.status === 'paused');

	const rankQuery = getMyRank();
	const myRank = $derived(rankQuery.current ?? null);

	const runTime = $derived(formatTime(gameLoop.timeLeft));
	const runLoot = $derived(inventory.scoredExtract.toLocaleString('en-US'));
	const runStage = $derived(`${quest.currentStage + 1}/${STAGES.length}`);

	function play() {
		audio.play('click');
		if (isTouchDevice()) enterFullscreen();
		tutorial.enter();
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
	function openLeaderboard() {
		audio.play('click');
		overlay.openLeaderboard();
	}
	function onFullscreen() {
		audio.play('click');
		toggleFullscreen();
	}
	function onMute() {
		audio.play('click');
		audio.toggleMute();
	}
</script>

<div class="relative h-full w-full">
	<header
		class="absolute inset-x-0 top-[max(16px,env(safe-area-inset-top))] flex flex-col items-center gap-1"
		in:fly|global={{ y: -10, duration: 300 }}
	>
		{@render wordmark()}
		{#if paused}
			<div
				class="flex items-center gap-2 font-mono tracking-wider"
				in:fly|global={{ y: 6, duration: 280, delay: 80 }}
			>
				{@render stat('Time', runTime, 'text-fg')}
				<span class="text-fg-faint">·</span>
				{@render stat('Loot', runLoot, 'text-accent')}
				<span class="text-fg-faint">·</span>
				{@render stat('Stage', runStage, 'text-fg')}
			</div>
		{/if}
	</header>

	<nav
		class="absolute bottom-[max(10px,env(safe-area-inset-bottom))] left-[max(24px,env(safe-area-inset-left))] flex w-[min(320px,38vw)] flex-col gap-2"
		in:fly|global={{ x: -16, duration: 280, delay: 40 }}
	>
		<button
			onclick={paused ? resume : play}
			class="group flex items-center gap-2 rounded-md border border-transparent bg-gradient-to-b from-primary-top to-primary-bottom px-3.5 py-2.5 text-left font-extrabold text-primary-ink transition-all active:scale-[0.99] active:brightness-105"
		>
			<Play class="size-4 flex-none" />
			<span class="flex-1 text-sm tracking-wider">{paused ? 'Resume' : 'Play'}</span>
		</button>

		{#if paused}
			<button onclick={restart} class={optionClass}>
				<Restart class="size-4 flex-none text-fg-muted" />
				<span class="flex-1 text-sm font-semibold tracking-wider text-fg-body">Restart</span>
			</button>
		{:else}
			<button onclick={howToPlay} class={optionClass}>
				<Video class="size-4 flex-none text-fg-muted" />
				<span class="flex-1 text-sm font-semibold tracking-wider text-fg-body">How to Play</span>
			</button>
		{/if}

		<div class="flex gap-2">
			{#if paused}
				<button onclick={exit} class="{optionClass} min-w-0 flex-1">
					<Exit class="size-4 flex-none text-fg-muted" />
					<span class="min-w-0 flex-1 truncate text-sm font-semibold tracking-wider text-fg-body"
						>End the Raid</span
					>
				</button>
			{:else}
				<button onclick={openLeaderboard} class="{optionClass} min-w-0 flex-1">
					<LeaderboardIcon class="size-4 flex-none text-fg-muted" />
					<span class="min-w-0 flex-1 truncate text-sm font-semibold tracking-wider text-fg-body"
						>Leaderboard</span
					>
					<span
						class="flex flex-none items-center gap-1.5 font-mono text-xs font-bold tracking-wider uppercase 2xl:text-[10px] 3xl:text-sm 4xl:text-[15px] pointer-coarse:text-[8px]"
					>
						{#if myRank !== null}
							<span class="text-accent tabular-nums">Rank # {myRank}</span>
						{/if}
					</span>
				</button>
			{/if}
			<button
				onclick={onMute}
				aria-label={audio.muted ? 'Unmute' : 'Mute'}
				aria-pressed={audio.muted}
				class="{optionClass} w-12 flex-none justify-center"
			>
				<Sound
					class="size-4 {audio.muted ? 'text-fg-faint' : 'text-fg-muted'}"
					muted={audio.muted}
				/>
			</button>
			<button
				onclick={onFullscreen}
				aria-label="Fullscreen"
				class="{optionClass} w-12 flex-none justify-center"
			>
				<Fullscreen class="size-4 text-fg-muted" />
			</button>
		</div>
	</nav>
</div>

{#snippet wordmark()}
	<span
		class="flex-row gap-2 font-[Saira_Condensed,Saira,system-ui,sans-serif] text-[60px] leading-none font-extrabold tracking-[0.05em] uppercase select-none"
	>
		<span class="text-[#f4ecdd]">LOOT</span>
		<span class="text-transparent [-webkit-text-stroke:1px_#f4ecdd]">RAIDERS</span>
	</span>
{/snippet}

{#snippet stat(label: string, value: string, valueClass: string)}
	<span class="flex items-center gap-1.5">
		<span class="text-[9px] font-bold tracking-[0.2em] text-fg-muted uppercase">{label}</span>
		<span class="text-[12px] font-black tabular-nums {valueClass}">{value}</span>
	</span>
{/snippet}
