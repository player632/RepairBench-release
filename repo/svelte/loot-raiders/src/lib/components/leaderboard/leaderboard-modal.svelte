<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { getGameContext } from '$lib/store/game.svelte';
	import { getLeaderboard } from '$lib/leaderboard/leaderboard-local';
	import { formatTime } from '$lib/utils';
	import Cross from '$lib/ui-icon/cross.svelte';
	import Trophy from '$lib/ui-icon/trophy.svelte';

	const { overlay, audio } = getGameContext();

	let listEl = $state<HTMLDivElement | undefined>();

	const query = $derived(overlay.leaderboard ? getLeaderboard() : undefined);
	const data = $derived(query?.current);

	function handleClose() {
		audio.play('click');
		overlay.closeLeaderboard();
	}

	const rows = $derived(
		(data?.entries ?? []).map((entry, index) => ({
			entry,
			rank: index + 1,
			isMine: entry.playerId === data?.myPlayerId
		}))
	);

	const myRank = $derived(data?.myRank ?? rows.find((r) => r.isMine)?.rank ?? null);

	const MIN_ROWS = 3;
	const skeletonRows = [0, 1, 2, 3];

	const isLoading = $derived(query !== undefined && data === undefined);

	const displayRows = $derived.by(() => {
		const real = rows.map((r) => ({ ...r, placeholder: false as const }));
		if (real.length >= MIN_ROWS) return real;
		const fillers = Array.from({ length: MIN_ROWS - real.length }, (_, i) => ({
			placeholder: true as const,
			rank: real.length + i + 1
		}));
		return [...real, ...fillers];
	});

	$effect(() => {
		const target = data?.myPlayerId;
		if (!overlay.leaderboard || !listEl || !target) return;
		queueMicrotask(() => {
			const row = listEl?.querySelector<HTMLElement>(`[data-entry-id="${target}"]`);
			row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
		});
	});

	const medalGradient = (rank: number) =>
		rank === 1
			? 'from-rank-1-from to-rank-1-to'
			: rank === 2
				? 'from-rank-2-from to-rank-2-to'
				: 'from-rank-3-from to-rank-3-to';

	const pad2 = (n: number) => String(n).padStart(2, '0');
</script>

{#if overlay.leaderboard}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		data-testid="lb-modal"
		class="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm"
		transition:fade={{ duration: 150 }}
		onclick={handleClose}
	>
		<div
			class="flex max-h-[88dvh] w-[calc(100vw-1rem)] max-w-[520px] flex-col overflow-hidden rounded-md border border-accent/20 bg-gradient-to-b from-panel-top to-panel-bottom font-sans text-fg-body shadow-[0_40px_100px_rgba(0,0,0,0.6)] lg:max-w-[800px]"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
		>
			<!-- header -->
			<div class="flex items-center justify-between border-b border-hairline px-5 py-3 lg:py-3.5">
				<div class="flex items-center gap-3">
					<span
						class="flex size-8 items-center justify-center rounded-lg border border-accent/40 bg-gradient-to-b from-accent/20 to-accent/5 text-accent md:size-10"
					>
						<Trophy class="size-4.5 lg:size-5.5" />
					</span>
					<span
						class="font-sans text-[13px] font-extrabold tracking-[0.22em] text-fg uppercase md:text-[16px]"
					>
						Leaderboard
					</span>
				</div>
				<button
					type="button"
					aria-label="Close"
					data-testid="lb-close"
					class="flex size-8 items-center justify-center rounded-full border border-hairline bg-white/5 text-[#c6bcb0] transition-colors hover:border-accent/40 hover:text-accent active:scale-90"
					onclick={handleClose}
				>
					<Cross />
				</button>
			</div>

			<!-- your-rank banner -->
			{#if myRank !== null}
				<div
					class="flex items-center justify-between border-b border-hairline bg-gradient-to-r from-accent/10 to-transparent px-5 py-1.5 lg:py-2.5"
				>
					<span
						class="font-mono text-[9px] font-medium tracking-[0.22em] text-accent uppercase lg:text-[11px]"
					>
						Your rank
					</span>
					<span
						class="font-sans text-[16px] font-extrabold text-accent tabular-nums lg:text-[20px]"
					>
						#{myRank}
					</span>
				</div>
			{/if}

			<!-- column header -->
			<div
				class="grid grid-cols-[34px_1fr_72px_50px] items-center gap-3 border-b border-hairline px-6.5 pt-2.5 pb-2 font-mono text-[9px] tracking-[0.2em] text-fg-faint uppercase lg:grid-cols-[48px_1fr_100px_68px] lg:px-7.5 lg:text-[10px]"
			>
				<div>#</div>
				<div>Raider</div>
				<div class="text-right">Loot</div>
				<div class="text-right">Time</div>
			</div>

			<!-- rows -->
			<div
				bind:this={listEl}
				class="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-2 md:px-4"
			>
				{#if isLoading}
					{#each skeletonRows as i (i)}
						<div
							class="grid grid-cols-[34px_1fr_72px_50px] items-center gap-3 rounded-md bg-row px-3.5 py-3 md:grid-cols-[48px_1fr_100px_68px]"
						>
							<div class="size-7 animate-pulse rounded-md bg-white/10 md:size-9"></div>
							<div class="h-3.5 w-2/3 animate-pulse rounded bg-white/10"></div>
							<div class="ml-auto h-3.5 w-12 animate-pulse rounded bg-white/10"></div>
							<div class="ml-auto h-3.5 w-8 animate-pulse rounded bg-white/10"></div>
						</div>
					{/each}
				{:else}
					{#each displayRows as row (row.placeholder ? `empty-${row.rank}` : row.entry.playerId)}
						{#if row.placeholder}
							<div
								data-testid="lb-row"
								class="grid grid-cols-[34px_1fr_72px_50px] items-center gap-3 rounded-md border border-transparent bg-[rgba(24,28,34,0.32)] px-3.5 py-2.5 opacity-40 md:grid-cols-[48px_1fr_100px_68px]"
							>
								<span class="pl-1 font-mono text-[12px] text-fg-faint tabular-nums md:text-[15px]">
									{pad2(row.rank)}
								</span>
								<div class="text-[12px] tracking-wide text-fg-faint uppercase md:text-[15px]">
									—
								</div>
								<div
									class="text-right font-mono text-[12px] text-fg-faint tabular-nums md:text-[15px]"
								>
									—
								</div>
								<div
									class="text-right font-mono text-[10px] text-fg-faint tabular-nums md:text-[12px]"
								>
									—
								</div>
							</div>
						{:else}
							{@const rowClass = row.isMine
								? `relative bg-gradient-to-r from-accent/15 to-accent/5 border border-accent/50 before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:rounded-r before:bg-accent before:content-['']`
								: row.rank <= 3
									? 'bg-row border border-white/[0.06]'
									: 'bg-[rgba(24,28,34,0.32)] border border-transparent'}
							{@const nameClass = row.isMine
								? 'text-[#f6efe1] font-extrabold'
								: row.rank <= 3
									? 'text-fg-body font-bold'
									: 'text-[#c6bcb0] font-semibold'}
							{@const podium = row.isMine || row.rank <= 3}
							<div
								data-entry-id={row.entry.playerId}
								data-testid="lb-row"
								class="grid grid-cols-[34px_1fr_72px_50px] items-center gap-3 rounded-md px-3.5 py-1.5 transition-colors md:grid-cols-[48px_1fr_100px_68px] lg:py-2.5 {rowClass}"
							>
								<div class="flex items-center">
									{#if row.rank <= 3}
										<span
											class="inline-flex size-8 items-center justify-center rounded-md bg-gradient-to-b {medalGradient(
												row.rank
											)} text-[14px] font-extrabold text-[#12140f] tabular-nums md:text-[15px] lg:size-9"
										>
											{row.rank}
										</span>
									{:else}
										<span
											class="pl-1 font-mono text-[14px] text-fg-muted tabular-nums md:text-[15px]"
										>
											{pad2(row.rank)}
										</span>
									{/if}
								</div>

								<div class="flex min-w-0 items-center gap-2">
									<span
										class="truncate text-[12.5px] tracking-wide uppercase md:text-[15px] {nameClass}"
									>
										{row.entry.nickname}
									</span>
									{#if row.isMine}
										<span
											class="shrink-0 rounded bg-accent px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[0.14em] text-[#12140f] uppercase"
										>
											you
										</span>
									{/if}
								</div>

								<div
									class="text-right font-mono text-[12px] font-medium tabular-nums md:text-[15px] {podium
										? 'text-accent'
										: 'text-[#c6a969]'}"
								>
									{row.entry.extract.toLocaleString('en-US')}
								</div>
								<div
									class="text-right font-mono text-[10px] tabular-nums md:text-[12px] {podium
										? 'text-fg-body'
										: 'text-fg-muted'}"
								>
									{formatTime(row.entry.time)}
								</div>
							</div>
						{/if}
					{/each}
				{/if}
			</div>

			<!-- footer -->
			<div
				class=":text-[11px] flex items-center justify-center gap-2 border-t border-hairline py-3 font-mono text-[8px] tracking-[0.2em] text-fg-faint uppercase"
			>
				<span class="text-fg-muted">Top runs</span>
				<span class="text-accent">·</span>
				<span>All time</span>
			</div>
		</div>
	</div>
{/if}
