<script lang="ts">
	import { untrack } from 'svelte';
	import { getGameContext } from '$lib/store/game.svelte';
	import WidgetArrow from '$lib/ui-icon/widget-arrow.svelte';
	import ArrowUpgrade from '$lib/ui-icon/arrow-upgrade.svelte';
	import BonusTime from '$lib/ui-icon/bonus-time.svelte';

	type Props = {
		onclick?: () => void;
	};
	let { onclick }: Props = $props();
	const { quest } = getGameContext();
</script>

{#if quest.items.length}
	<button
		type="button"
		{onclick}
		aria-label="Open quests"
		data-testid="quest-widget-open"
		class="group relative flex w-full items-center gap-2 rounded-2xl bg-[#0c101c]/80 px-2 py-1.5 ring-1 ring-white/5 backdrop-blur-md transition-transform active:scale-[0.98]"
	>
		{#if quest.totalQuestsCompleted > 0}
			{#key quest.totalQuestsCompleted}
				{@const isStage = untrack(() => quest.stageCompleted)}
				<span
					class="flash pointer-events-none absolute inset-0 rounded-2xl {isStage
						? 'flash-stage'
						: 'flash-quest'}"
				></span>
			{/key}
		{/if}

		<img
			src="/assets/ui/Icon_Quest.webp"
			alt=""
			aria-hidden="true"
			class="size-7 shrink-0 object-contain"
		/>

		<div class="flex flex-1 flex-col items-start overflow-hidden leading-tight">
			<div class="flex items-baseline gap-1">
				<span class="text-[9px] font-bold tracking-wider text-white/80 uppercase">Quests</span>
				<span class="font-mono text-[10px] font-black text-emerald-400 tabular-nums">
					{quest.completed}<span class="text-[8px] font-bold text-white/30">/{quest.total}</span>
				</span>
			</div>

			<div class="relative h-4 w-full overflow-hidden">
				{#if quest.totalQuestsCompleted > 0}
					{#key quest.totalQuestsCompleted}
						{@const isStage = untrack(() => quest.stageCompleted)}
						<div class="reel absolute inset-x-0 top-0">
							<span
								class="block h-4 truncate text-left text-[10px] leading-4 font-medium text-white/50"
							>
								{quest.stageDef.name}
							</span>
							{#if isStage}
								<span
									class="msg-stage flex h-4 items-center gap-1 text-[10px] leading-4 font-medium text-cyan-400/80"
								>
									<ArrowUpgrade />
									Stage Cleared
								</span>
							{:else}
								<span
									class="msg-quest flex h-4 items-center gap-1 text-[10px] leading-4 font-medium text-emerald-400/80"
								>
									<BonusTime />
									Bonus time
								</span>
							{/if}
						</div>
					{/key}
				{:else}
					<span
						class="block h-4 truncate text-left text-[10px] leading-4 font-medium text-white/50"
					>
						{quest.stageDef.name}
					</span>
				{/if}
			</div>
		</div>

		<div class="flex h-6 min-w-[3.25rem] shrink-0 items-center justify-end gap-1 text-white/40">
			<span class="text-[8px] font-bold tracking-wider uppercase">View</span>
			<WidgetArrow />
		</div>
	</button>
{/if}

<style>
	.flash {
		animation: flash-pulse 1.4s ease-out forwards;
	}

	.flash-quest {
		--glow: 52 211 153;
	}

	.flash-stage {
		--glow: 34 211 238;
	}

	@keyframes flash-pulse {
		0% {
			box-shadow:
				inset 0 0 0 1px rgb(var(--glow) / 0.9),
				0 0 16px -2px rgb(var(--glow) / 0.65);
		}
		25% {
			box-shadow:
				inset 0 0 0 1px rgb(var(--glow) / 0.8),
				0 0 16px -2px rgb(var(--glow) / 0.55);
		}
		100% {
			box-shadow:
				inset 0 0 0 1px rgb(var(--glow) / 0),
				0 0 16px -2px rgb(var(--glow) / 0);
		}
	}

	.reel {
		animation: reel-swap 1.6s ease-out;
	}

	.msg-quest {
		filter: drop-shadow(0 0 6px rgb(52 211 153 / 0.7));
	}

	.msg-stage {
		filter: drop-shadow(0 0 6px rgb(34 211 238 / 0.7));
	}

	@keyframes reel-swap {
		0% {
			transform: translateY(0);
		}
		12% {
			transform: translateY(-50%);
		}
		82% {
			transform: translateY(-50%);
		}
		100% {
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reel {
			animation: none;
		}
	}
</style>
