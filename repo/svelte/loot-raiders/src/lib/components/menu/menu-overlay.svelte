<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { getGameContext } from '$lib/store/game.svelte';
	import { formatTime } from '$lib/utils';
	import { STAGES } from '$lib/config/stages';
	import GameOverStats from './game-over-stats.svelte';
	import MenuDesktop from './menu-desktop.svelte';
	import MenuMobile from './menu-mobile.svelte';
	import Disclaimer from './disclaimer.svelte';

	const { gameLoop, inventory, quest, device } = getGameContext();

	const runTime = $derived(formatTime(gameLoop.timeLeft));
	const runLoot = $derived(inventory.scoredExtract.toLocaleString('en-US'));
	const runStage = $derived(`${quest.currentStage + 1}/${STAGES.length}`);
</script>

{#if !gameLoop.inSession}
	<div
		data-testid="menu-overlay"
		class="fixed inset-0 z-30"
		transition:fade|global={{ duration: gameLoop.status === 'idle' ? 300 : 0 }}
	>
		{#if gameLoop.status === 'over'}
			<div class="flex h-full w-full items-center justify-center p-2">
				<GameOverStats />
			</div>
		{:else if device.isCoarsePointer}
			<MenuMobile />

			<Disclaimer />
		{:else}
			<div class="flex h-full flex-col overflow-y-auto">
				<div
					class="flex shrink-0 items-start justify-between pt-7 pr-6 pl-10 md:pr-10 md:pl-14 2xl:pt-9 3xl:pt-12 3xl:pr-14 3xl:pl-20 4xl:pt-16 4xl:pr-20 4xl:pl-28"
				>
					<div>
						<div in:fly|global={{ y: -10, duration: 300 }}>
							{@render wordmark()}
						</div>

						<div
							class="mt-4 flex items-center gap-4 transition-opacity duration-200 lg:gap-5 2xl:mt-5 3xl:mt-6 3xl:gap-6 4xl:mt-8 4xl:gap-7 {gameLoop.status ===
							'paused'
								? 'opacity-100'
								: 'opacity-0'}"
							aria-hidden={gameLoop.status !== 'paused'}
						>
							{@render runStat('Time', runTime, 'text-fg')}
							{@render runStat('Loot', runLoot, 'text-accent')}
							{@render runStat('Stage', runStage, 'text-fg')}
						</div>
					</div>
				</div>

				<div
					class="my-auto flex shrink-0 items-center pr-6 pl-10 md:pr-10 md:pl-14 3xl:pr-14 3xl:pl-20 4xl:pr-20 4xl:pl-28"
				>
					<div
						class="w-[400px] 2xl:w-[440px] 3xl:w-[500px] 4xl:w-[580px] pointer-coarse:w-[340px]"
						in:fly|global={{ x: -16, duration: 280, delay: 40 }}
					>
						<MenuDesktop />
					</div>
				</div>
			</div>

			<Disclaimer />
		{/if}
	</div>
{/if}

{#snippet wordmark()}
	<span
		class="inline-flex flex-col items-start font-[Saira_Condensed,Saira,system-ui,sans-serif] text-[70px] leading-[0.82] font-extrabold tracking-[0.02em] uppercase select-none md:text-[70px] lg:text-[75px] xl:text-[80px] 2xl:text-[85px] 3xl:text-[95px] 4xl:text-[105px] pointer-coarse:!text-[70px]"
	>
		<span class="text-[#f4ecdd]">LOOT</span>
		<span class="text-transparent [-webkit-text-stroke:1px_#f4ecdd]">RAIDERS</span>
	</span>
{/snippet}

{#snippet runStat(label: string, value: string, valueClass: string)}
	<div class="flex items-center gap-1.5 3xl:gap-2">
		<span
			class="font-mono text-[9px] font-bold tracking-[0.25em] text-fg-muted uppercase 3xl:text-[10px] 4xl:text-[11px]"
			>{label}</span
		>
		<span
			class="font-mono text-[13px] font-black tabular-nums 2xl:text-sm 3xl:text-base 4xl:text-lg {valueClass}"
			>{value}</span
		>
	</div>
{/snippet}
