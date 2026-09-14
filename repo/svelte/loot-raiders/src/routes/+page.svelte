<script lang="ts">
	import Shortcuts from '$lib/components/hud/shortcuts.svelte';
	import { getGameContext } from '$lib/store/game.svelte';
	import StorageGrid from '$lib/components/inventory/storage-grid.svelte';
	import { ElectricBorder } from '$lib/motion-core';
	import QuestBar from '$lib/components/quest/quest-bar.svelte';
	import DropZone from '$lib/components/inventory/drop-zone.svelte';
	import QuestWidget from '$lib/components/quest/quest-widget.svelte';
	import { formatTime, formatCompact } from '$lib/utils';

	// Canonical production origin — adjust if a custom domain is added.
	const SITE_URL = 'https://loot-raiders.vercel.app';
	const TITLE = 'Loot Raiders — Timed Inventory Game';
	const DESCRIPTION =
		'Timed inventory game — manage drag-and-drop loot, complete quests, survive the raid.';
	const OG_IMAGE = SITE_URL + '/og.jpg';

	const { gameLoop, inventory, loot, selection, audio, overlay, device, augment } =
		getGameContext();
</script>

<svelte:head>
	<title>{TITLE}</title>
	<meta name="description" content={DESCRIPTION} />
	<link rel="canonical" href={SITE_URL} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Loot Raiders" />
	<meta property="og:title" content={TITLE} />
	<meta property="og:description" content={DESCRIPTION} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:image" content={OG_IMAGE} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:alt" content="Loot Raiders gameplay" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={TITLE} />
	<meta name="twitter:description" content={DESCRIPTION} />
	<meta name="twitter:image" content={OG_IMAGE} />
</svelte:head>

<div
	class="flex h-full items-center justify-center transition-opacity duration-300 {gameLoop.inSession
		? ''
		: 'pointer-events-none opacity-0'}"
	onpointerdown={(e) => {
		if (e.button === 0) selection.clear();
	}}
>
	<div
		class="flex flex-col gap-3 md:gap-5 lg:gap-7 xl:gap-9 2xl:gap-12 3xl:gap-16"
		data-wide-short-outer-col
	>
		<div
			class="flex items-start justify-center gap-1 md:gap-2 lg:gap-4 xl:gap-4 2xl:gap-5 3xl:gap-10"
		>
			<div
				class="flex flex-col gap-1 md:gap-10 lg:gap-10 xl:gap-12 2xl:gap-14 3xl:gap-18"
				data-wide-short-inner-col
			>
				<div class="flex items-start gap-1 md:gap-1 lg:gap-4 xl:gap-4 2xl:gap-5 3xl:gap-10">
					<div class="z-10 flex flex-col items-start">
						<div
							class="flex h-6 items-center gap-1.5 rounded-t-lg bg-background/50 px-3 backdrop-blur-md md:h-8 lg:gap-3 lg:px-4 xl:gap-3.5 xl:px-4.5 2xl:h-9 2xl:gap-4 2xl:px-5 3xl:h-10 3xl:gap-5 3xl:px-6 4xl:h-11 4xl:gap-6 4xl:px-7"
							data-wide-short-bar
							data-tut="header-loot"
						>
							<span
								class="text-[8px] font-semibold tracking-wider uppercase xl:text-[9px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px]"
								>Loot Drop</span
							>

							{@render divider()}

							<div class="flex items-center gap-1 2xl:gap-1.5 4xl:gap-2">
								<span
									class="text-[7px] font-semibold tracking-wider text-muted uppercase xl:text-[8px] 2xl:text-[9px] 3xl:text-[10px] 4xl:text-[11px]"
									>Next</span
								>
								<span
									data-testid="hud-cooldown"
								class="font-mono text-[7px] font-black whitespace-pre text-cyan-400 tabular-nums xl:text-[11px] 2xl:text-xs 3xl:text-[13px] 4xl:text-[14px]"
								>
									{Math.ceil(loot.cooldown).toString().padStart(2, ' ')}s
								</span>
							</div>

							{@render divider()}

							<button
								type="button"
								data-tut="open-now"
						data-testid="loot-open-now"
								onclick={() => gameLoop.inSession && loot.next()}
								aria-label="Open loot now"
								class="group flex cursor-pointer items-center gap-1 transition-opacity hover:opacity-90 2xl:gap-1.5 4xl:gap-2 pointer-coarse:rounded-md pointer-coarse:bg-cyan-400/10 pointer-coarse:px-1.5 pointer-coarse:py-0.5 pointer-coarse:ring-1 pointer-coarse:ring-cyan-400/30 pointer-coarse:active:scale-95"
							>
								<kbd
									class="inline-flex min-w-6 items-center justify-center rounded-md bg-gradient-to-b from-kbd-from via-kbd-via to-kbd-to px-1.5 py-0.5 text-[7px] font-semibold text-kbd-text uppercase shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_1px_2px_rgba(0,0,0,0.2)] transition-transform group-active:scale-95 xl:min-w-7 xl:text-[8px] 2xl:min-w-8 2xl:px-2 2xl:text-[9px] 3xl:text-[10px] 4xl:min-w-9 4xl:text-[11px] pointer-coarse:hidden"
								>
									Space
								</kbd>

								<span
									class="text-[7px] font-semibold tracking-wider text-muted uppercase group-hover:text-white/90 xl:text-[8px] 2xl:text-[9px] 3xl:text-[10px] 4xl:text-[11px] pointer-coarse:text-[7px] pointer-coarse:font-bold pointer-coarse:text-cyan-400"
									>Open Now</span
								>
							</button>
						</div>

						<div
							class="z-10 flex flex-col gap-1 rounded-tr-lg rounded-br-lg rounded-bl-lg bg-background/50 p-1 backdrop-blur-md md:gap-2 md:p-2 lg:gap-3 lg:p-3 xl:gap-3.5 xl:p-3.5 2xl:gap-4 2xl:p-4 3xl:gap-5 3xl:p-5 4xl:gap-6 4xl:p-6"
							data-wide-short-panel
							data-tut="loot-drop"
						>
							<div class="grid grid-cols-4">
								<StorageGrid
									storageId="lootBack"
									class="aspect-square h-11 w-11 md:h-16 md:w-16 lg:h-20 lg:w-20 xl:h-22 xl:w-22 2xl:h-24 2xl:w-24 3xl:h-28 3xl:w-28 4xl:h-32 4xl:w-32 landscape-narrow:h-12 landscape-narrow:w-12 landscape-mid:h-14 landscape-mid:w-14 wide-short:h-22 wide-short:w-22"
								/>
							</div>
							<div class="hidden md:block pointer-coarse:hidden" data-tut="loot-dropzone">
								<DropZone />
							</div>
							<div class="hidden pointer-coarse:block" data-tut="quest-widget">
								<QuestWidget onclick={() => overlay.openQuestSheet()} />
							</div>
						</div>
					</div>

					<div class="z-10 flex flex-col items-end">
						{@render scoreTimeTab()}
						<div
							class="flex flex-col gap-1 rounded-lg rounded-tl-lg rounded-tr-none bg-background/50 p-1 backdrop-blur-md md:gap-2 md:p-2 lg:gap-3 lg:p-3 xl:gap-3.5 xl:p-3.5 2xl:gap-4 2xl:p-4 3xl:gap-5 3xl:p-5 4xl:gap-6 4xl:p-6"
							data-wide-short-panel
							data-tut="full-backpack"
						>
							<div
								class="flex h-full w-full justify-center gap-1 md:gap-1 lg:gap-4 xl:gap-5 2xl:gap-8 3xl:gap-10"
							>
								<div
									class="flex flex-col gap-1 md:gap-1 lg:gap-3 xl:gap-3.5 2xl:gap-4 3xl:gap-5"
									data-wide-short-storage-stack
								>
									<div class="flex gap-0.5 md:gap-0.5 lg:gap-3 xl:gap-3.5 2xl:gap-4 3xl:gap-5">
										<div data-tut="augment">
											<ElectricBorder
												pulse={augment.upgradePulse}
												color="#22d3ee"
												speed={1}
												chaos={0.05}
												borderRadius={8}
											>
												<StorageGrid
													storageId="augment"
													class="h-11 w-16 md:h-14 md:w-24 lg:h-20 lg:w-[112px] xl:h-22 xl:w-[126px] 2xl:h-24 2xl:w-[140px] 3xl:h-28 3xl:w-[160px] 4xl:h-32 4xl:w-[180px] landscape-narrow:h-12 landscape-narrow:w-18 landscape-mid:h-14 landscape-mid:w-20 wide-short:h-22 wide-short:w-[126px]"
												/>
											</ElectricBorder>
										</div>
										<div data-tut="shield">
											<StorageGrid
												storageId="shield"
												class="h-11 w-16 md:h-14 md:w-24 lg:h-20 lg:w-[112px] xl:h-22 xl:w-[126px] 2xl:h-24 2xl:w-[140px] 3xl:h-28 3xl:w-[160px] 4xl:h-32 4xl:w-[180px] landscape-narrow:h-12 landscape-narrow:w-18 landscape-mid:h-14 landscape-mid:w-20 wide-short:h-22 wide-short:w-[126px]"
											/>
										</div>
									</div>
									<StorageGrid
										storageId="weapon"
										class="h-22 w-32 md:h-28 md:w-48 lg:h-40 lg:w-[240px] xl:h-44 xl:w-[268px] 2xl:h-48 2xl:w-[295px] 3xl:h-52 3xl:w-[340px] 4xl:h-60 4xl:w-[392px] landscape-narrow:h-24 landscape-narrow:w-36 landscape-mid:h-28 landscape-mid:w-40 wide-short:h-44 wide-short:w-[268px]"
									/>
								</div>

								<div class="flex flex-col gap-1 md:gap-1 lg:gap-3 xl:gap-3.5 2xl:gap-4 3xl:gap-5">
									<div class="grid grid-cols-4" data-tut="backpack">
										<StorageGrid
											storageId="backpack"
											class="aspect-square h-11 w-11 md:h-16 md:w-16 lg:h-20 lg:w-20 xl:h-22 xl:w-22 2xl:h-24 2xl:w-24 3xl:h-28 3xl:w-28 4xl:h-32 4xl:w-32 landscape-narrow:h-12 landscape-narrow:w-12 landscape-mid:h-14 landscape-mid:w-14 wide-short:h-22 wide-short:w-22"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="hidden lg:block pointer-coarse:hidden">
				<QuestBar />
			</div>
		</div>

		<div
			data-tut="hotkeys"
			class="hidden w-full items-center transition-opacity md:flex pointer-coarse:hidden {gameLoop.inSession
				? 'opacity-100'
				: 'pointer-events-none opacity-0'}"
		>
			<Shortcuts />
		</div>
	</div>
</div>

{#snippet divider()}
	<div class="h-2.5 w-[1px] bg-white/20 2xl:h-3 3xl:h-3.5 4xl:h-4"></div>
{/snippet}

{#snippet scoreTimeTab()}
	{#if gameLoop.status !== 'idle'}
		{@const weightPct = Math.min(100, (inventory.totalWeight / inventory.maxWeight) * 100)}
		{@const overweight = inventory.isOverweight}
		{@const penaltyPct = Math.round((1 - inventory.weightMultiplier) * 100)}
		<div
			class="flex h-6 items-center gap-2.5 rounded-t-lg bg-background/50 px-3 backdrop-blur-md md:h-8 lg:gap-3 lg:px-4 xl:gap-3.5 xl:px-4.5 2xl:h-9 2xl:gap-4 2xl:px-5 3xl:h-10 3xl:gap-5 3xl:px-6 4xl:h-11 4xl:gap-6 4xl:px-7"
			data-tut="header-backpak"
			data-wide-short-bar
		>
			{#if gameLoop.status !== 'tutorial'}
				<button
					type="button"
					onclick={() => {
						audio.play('click');
						gameLoop.pause();
					}}
					data-testid="hud-pause"
					aria-label="Pause"
					class="flex cursor-pointer items-center justify-center rounded-md bg-white/5 px-1.5 py-1 text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white/90 active:scale-95"
				>
					<svg
						class="size-3 2xl:size-3.5 3xl:size-4 4xl:size-5"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<rect x="6" y="5" width="4" height="14" rx="1" />
						<rect x="14" y="5" width="4" height="14" rx="1" />
					</svg>
				</button>

				<div class="h-2.5 w-[1px] bg-white/20 2xl:h-3 3xl:h-3.5 4xl:h-4"></div>
			{/if}

			<span
				data-tut="timer"
			data-testid="hud-timer"
				class="relative inline-block font-mono text-[10px] font-bold tracking-widest transition-colors duration-300 xl:text-[11px] 2xl:text-xs 3xl:text-[13px] 4xl:text-[14px] {gameLoop.timeLeft <
				10
					? 'text-red-400'
					: 'text-white/90'} {gameLoop.shieldTimeBonus > 0 || gameLoop.questTimeBonus > 0
					? 'time-flash'
					: ''}"
			>
				{formatTime(gameLoop.timeLeft)}
				{#if !device.isCoarsePointer}
					{@render timeBonus(
						gameLoop.shieldTimeBonus,
						'shield',
						() => (gameLoop.shieldTimeBonus = 0)
					)}
					{@render timeBonus(gameLoop.questTimeBonus, 'quest', () => (gameLoop.questTimeBonus = 0))}
				{/if}
			</span>

			{@render divider()}

			<div class="flex items-center gap-1.5 rounded py-1 2xl:gap-2 4xl:gap-2.5">
				<span
					class="text-[7px] font-semibold tracking-wider text-muted uppercase xl:text-[8px] 2xl:text-[9px] 3xl:text-[10px] 4xl:text-[11px]"
					>Extract</span
				>

				<div class="flex items-center gap-1 2xl:gap-1.5 4xl:gap-2">
					<img
						src="/assets/ui/Coins.webp"
						alt="coins"
						class="size-3 object-contain 2xl:size-3.5 3xl:size-4 4xl:size-5"
					/>
					<span
						data-testid="hud-extract"
						class="inline-block min-w-[6ch] text-center font-mono text-[10px] font-black tabular-nums transition-colors duration-300 xl:text-[11px] 2xl:text-xs 3xl:text-[13px] 4xl:text-[14px] {overweight
							? 'text-amber-400'
							: 'text-white'}"
					>
						{formatCompact(inventory.scoredExtract)}
					</span>
					{#if overweight}
						<span
							data-testid="hud-penalty"
							class="font-mono text-[8px] font-black text-red-400 tabular-nums xl:text-[9px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px]"
						>
							−{penaltyPct}%
						</span>
					{/if}
				</div>
			</div>
			{@render divider()}

			<div class="flex items-center gap-1.5 2xl:gap-2 4xl:gap-2.5">
				<div
					data-testid="hud-weight"
					class="relative flex items-center gap-1 overflow-hidden rounded bg-black/40 px-2 py-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] ring-1 2xl:gap-1.5 2xl:px-2.5 4xl:gap-2 4xl:px-3 {overweight
						? 'ring-red-500/70'
						: 'ring-white/10'}"
					class:weight-over={overweight}
				>
					<div
						class="absolute top-0 left-0 h-full transition-all duration-300 {weightPct > 90
							? 'bg-red-500/30'
							: weightPct > 70
								? 'bg-yellow-400/30'
								: 'bg-cyan-400/50'}"
						style="width: {weightPct}%"
					></div>

					<img
						src="/assets/ui/placeholder/weight.webp"
						alt="weight"
						class="size-2.5 object-contain 2xl:size-3 3xl:size-3.5 4xl:size-4"
					/>

					<span class="relative z-10 flex items-baseline gap-1 font-mono tabular-nums">
						<span
							class="min-w-3 text-[10px] font-black transition-colors duration-300 xl:text-[11px] 2xl:min-w-4 2xl:text-xs 3xl:text-[13px] 4xl:text-[14px] {weightPct >
							90
								? 'text-red-400 '
								: 'text-white'}"
						>
							{Math.round(inventory.totalWeight)}
						</span>
						<span
							class="text-[8px] font-black text-white/20 xl:text-[9px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px]"
							>/</span
						>
						<span
							class="text-[8px] font-bold text-white/50 xl:text-[9px] 2xl:text-[10px] 3xl:text-[11px] 4xl:text-[12px]"
							>{inventory.maxWeight}</span
						>
					</span>
				</div>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet timeBonus(amount: number, label: string, onEnd: () => void)}
	{#if amount > 0}
		{#key amount}
			<span
				class="time-bonus-pop pointer-events-none absolute -top-4 -right-2 flex items-center gap-1 font-mono whitespace-nowrap"
				onanimationend={onEnd}
			>
				<span
					class="text-[7px] font-semibold tracking-wider text-white/80 uppercase 2xl:text-[8px] 4xl:text-[9px]"
					>{label}</span
				>
				<span
					class="text-[9px] font-black text-emerald-400 tabular-nums drop-shadow-[0_0_8px_rgba(52,211,153,0.75)] 2xl:text-xs 4xl:text-[14px]"
					>+{amount}<span class="font-semibold">s</span></span
				>
			</span>
		{/key}
	{/if}
{/snippet}

<style>
	@reference "tailwindcss";

	.time-bonus-pop {
		animation: time-bonus-pop 1.2s cubic-bezier(0.2, 0.9, 0.25, 1.2) forwards;
	}

	@keyframes time-bonus-pop {
		0% {
			opacity: 0;
			transform: translateY(5px) scale(0.7);
		}
		18% {
			opacity: 1;
			transform: translateY(0) scale(1.12);
		}
		34% {
			transform: translateY(0) scale(1);
		}
		68% {
			opacity: 1;
			transform: translateY(-7px);
		}
		100% {
			opacity: 0;
			transform: translateY(-20px) scale(0.9);
		}
	}

	.time-flash {
		animation: time-flash 1.2s ease-out;
	}

	@keyframes time-flash {
		0%,
		16% {
			color: var(--color-emerald-400);
			text-shadow: 0 0 12px rgba(52, 211, 153, 0.7);
			transform: scale(1.13);
		}
		100% {
			text-shadow: none;
			transform: scale(1);
		}
	}

	.weight-over {
		animation: weight-over 1s ease-in-out infinite;
	}

	@keyframes weight-over {
		0%,
		100% {
			box-shadow:
				inset 0 1px 2px rgba(0, 0, 0, 0.5),
				0 0 0 0 rgba(239, 68, 68, 0);
		}
		50% {
			box-shadow:
				inset 0 1px 2px rgba(0, 0, 0, 0.5),
				0 0 8px 1px rgba(239, 68, 68, 0.6);
		}
	}
</style>
