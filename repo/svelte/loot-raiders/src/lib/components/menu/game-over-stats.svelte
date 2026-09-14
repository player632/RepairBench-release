<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fly, fade } from 'svelte/transition';
	import { getGameContext } from '$lib/store/game.svelte';
	import { getDef } from '$lib/config/items';
	import { formatTime } from '$lib/utils';
	import { getExtractionTier } from '$lib/config/extraction';
	import { STAGES } from '$lib/config/stages';
	import { enterFullscreen, isTouchDevice } from '$lib/fullscreen';
	import {
		NICK_ALLOWED_REGEX,
		NICK_HAS_ALNUM_REGEX,
		NICK_MAX,
		NICK_MIN
	} from '$lib/leaderboard/schema';
	import { submitScore } from '$lib/leaderboard/leaderboard-local';
	import type { ItemRarity } from '$lib/types';
	import Restart from '$lib/ui-icon/restart.svelte';
	import Leaderboard from '$lib/ui-icon/leaderboard.svelte';

	const TONE_STYLE = {
		good: {
			border: 'border-emerald-500',
			text: 'text-emerald-500',
			tint: 'rgba(34,197,94,0.13)',
			glow: 'rgba(34,197,94,0.4)'
		},
		neutral: {
			border: 'border-amber-400',
			text: 'text-amber-400',
			tint: 'rgba(255,184,0,0.13)',
			glow: 'rgba(255,184,0,0.4)'
		},
		bad: {
			border: 'border-red-500',
			text: 'text-red-500',
			tint: 'rgba(239,68,68,0.13)',
			glow: 'rgba(239,68,68,0.4)'
		}
	} as const;

	const { gameLoop, quest, inventory, loot, audio, leaderboard, overlay } = getGameContext();

	let submitted = $state(false);
	let nicknameInput = $state(leaderboard.nickname);
	let showNicknameForm = $state(false);

	const nickError = $derived.by(() => {
		const value = nicknameInput.trim();
		if (value.length < NICK_MIN) return `At least ${NICK_MIN} characters`;
		if (!NICK_ALLOWED_REGEX.test(value)) return 'Letters, numbers, and dashes only';
		if (!NICK_HAS_ALNUM_REGEX.test(value)) return 'Needs at least one letter or number';
		return null;
	});
	const canSubmit = $derived(nickError === null);

	function restartGame() {
		audio.play('click');
		if (isTouchDevice()) enterFullscreen();
		gameLoop.restart();
	}

	async function doSubmit() {
		if (!leaderboard.hasNickname) return;
		try {
			await submitScore({
				nickname: leaderboard.nickname,
				extract: Math.max(0, inventory.scoredExtract),
				time: Math.max(0, Math.round(gameLoop.elapsedTime))
			});
		} catch {
			return;
		}
		submitted = true;
		overlay.openLeaderboard();
	}

	function onSubmitClick() {
		audio.play('click');
		if (!leaderboard.hasNickname) {
			showNicknameForm = true;
			return;
		}
		doSubmit();
	}

	function onSaveNickname(e: SubmitEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		audio.play('click');
		leaderboard.setNickname(nicknameInput);
		showNicknameForm = false;
		doSubmit();
	}

	function onChangeNickname() {
		audio.play('click');
		nicknameInput = leaderboard.nickname;
		showNicknameForm = true;
	}

	function onCancelNickname() {
		audio.play('click');
		nicknameInput = leaderboard.nickname;
		showNicknameForm = false;
	}

	function onOpenLeaderboard() {
		audio.play('click');
		overlay.openLeaderboard();
	}

	const augmentItem = inventory.augmentItem;
	const augmentRarity: ItemRarity | null = augmentItem ? getDef(augmentItem.defId).rarity : null;

	const finalExtract = inventory.scoredExtract;
	const overweightPenalty = Math.round((1 - inventory.weightMultiplier) * 100);
	const tier = getExtractionTier(finalExtract);

	const toneStyle = TONE_STYLE[tier.tone];

	const opts = { duration: 1400, easing: cubicOut };
	function countUp(to: number) {
		const t = new Tween(0, opts);
		t.target = to;
		return t;
	}

	const extract = countUp(finalExtract);
	const stages = countUp(quest.stagesCleared);
	const chests = countUp(loot.chestsOpened);
	const time = countUp(Math.floor(gameLoop.elapsedTime));

	const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
</script>

{#snippet breakdownCell(label: string, value: string)}
	<div class="rounded-xs border border-hairline bg-row px-3 py-1.5 lg:px-3.5 lg:py-3">
		<div class="font-mono text-[9px] font-bold tracking-[0.32em] text-fg-muted uppercase">
			{label}
		</div>
		<div
			class="mt-1 font-mono text-[18px] leading-none font-black tracking-[-0.01em] text-fg-body tabular-nums md:text-[22px] 3xl:text-[26px]"
		>
			{value}
		</div>
	</div>
{/snippet}

<div
	data-testid="go-report"
	in:fade|global={{ duration: 240 }}
	class="relative w-[calc(100vw-1rem)] max-w-[420px] overflow-hidden rounded-md border border-accent/20 bg-gradient-to-b from-panel-top to-panel-bottom font-sans text-fg-body md:max-w-[680px] lg:max-w-[760px] 3xl:max-w-[840px] landscape-narrow:max-w-[540px] landscape-mid:max-w-[620px]"
>
	<div class="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
		{#if leaderboard.hasNickname && !showNicknameForm}
			<span class="font-mono text-[9px] font-bold tracking-[0.24em] uppercase">
				<span class="font-extrabold text-[#c6a969] uppercase">{leaderboard.nickname}</span>
				<span class="text-fg-faint">·</span>
				<button
					type="button"
					onclick={onChangeNickname}
					class="text-fg-muted underline decoration-dotted underline-offset-[3px] hover:text-fg-body"
				>
					edit
				</button>
			</span>
		{:else}
			<span></span>
		{/if}

		<span
			class="flex items-center gap-2 font-mono text-[10px] font-extrabold tracking-[0.22em] text-accent uppercase"
		>
			<span class="size-1.5 rounded-full bg-accent shadow-[0_0_8px_#ebbb4e]"></span>
			Run Report
		</span>
	</div>

	<div
		class="grid grid-cols-[110px_1fr] items-center gap-4 border-b border-hairline px-4 py-2 md:grid-cols-[140px_1fr] md:gap-5 md:px-5 md:py-3 lg:grid-cols-[170px_1fr] lg:gap-7 lg:px-6 lg:py-6 landscape-narrow:grid-cols-[120px_1fr] landscape-mid:grid-cols-[130px_1fr]"
		in:fly|global={{ y: 8, duration: 420, delay: 80 }}
	>
		<div
			class="relative flex h-[110px] items-center justify-center border-2 md:h-[140px] lg:h-[170px] landscape-narrow:h-[100px] landscape-mid:h-[110px] {toneStyle.border}"
			style="background: radial-gradient(circle at 50% 50%, {toneStyle.tint} 0%, transparent 70%);"
		>
			<span
				aria-hidden="true"
				class="absolute -top-[2px] -left-[2px] size-3.5 border-t-2 border-l-2 border-white/90"
			></span>
			<span
				aria-hidden="true"
				class="absolute -top-[2px] -right-[2px] size-3.5 border-t-2 border-r-2 border-white/90"
			></span>
			<span
				aria-hidden="true"
				class="absolute -bottom-[2px] -left-[2px] size-3.5 border-b-2 border-l-2 border-white/90"
			></span>
			<span
				aria-hidden="true"
				class="absolute -right-[2px] -bottom-[2px] size-3.5 border-r-2 border-b-2 border-white/90"
			></span>

			<span
				data-testid="go-grade"
			class="text-[80px] leading-[0.9] font-black tracking-[-0.06em] font-stretch-condensed md:text-[100px] lg:text-[130px] 3xl:text-[150px] landscape-narrow:text-[70px] landscape-mid:text-[80px] {toneStyle.text}"
				style="font-family: ui-sans-serif, Impact, 'Arial Black', sans-serif; text-shadow: 0 0 24px {toneStyle.glow};"
			>
				{tier.grade}
			</span>

			<span
				class="absolute -top-[10px] left-2 bg-[#0f111a] px-2 py-[2px] font-mono text-[9px] font-extrabold tracking-[0.4em] text-white/50 uppercase"
			>
				Grade
			</span>
		</div>

		<div class="flex flex-col gap-0.5 lg:gap-2.5">
			<div>
				<h1
					data-testid="go-title"
					class="text-2xl leading-none font-black tracking-[-0.02em] text-fg uppercase md:text-3xl lg:text-[32px] 3xl:text-[36px]"
				>
					{tier.title}
				</h1>
				<p class="mt-1.5 max-w-xs font-serif text-xs leading-relaxed text-fg-muted italic">
					"{tier.description}"
				</p>
			</div>

			<div
				class="mt-0.5 flex items-end justify-between gap-5 border-t border-dashed border-hairline pt-1.5 lg:mt-1.5 lg:pt-3"
			>
				<div>
					<div class="font-mono text-[9px] font-extrabold tracking-[0.4em] text-fg-muted uppercase">
						Loot Value
					</div>
					<div class="mt-1 flex items-center gap-2">
						<span
							class="font-mono text-[32px] leading-none font-black tracking-[-0.04em] text-accent tabular-nums drop-shadow-[0_0_20px_rgba(235,187,78,0.3)] md:text-[40px] lg:text-[48px] 3xl:text-[56px] landscape-mid:text-[36px]"
						>
							{fmt(extract.current)}
						</span>
						<img
							src="/assets/ui/Coins.webp"
							alt="credits"
							class="size-8 object-contain drop-shadow-[0_0_12px_rgba(235,187,78,0.35)] md:size-9"
						/>
					</div>
					{#if overweightPenalty > 0}
						<div
							class="mt-1 font-mono text-[10px] font-extrabold tracking-[0.2em] text-danger/90 uppercase"
						>
							−{overweightPenalty}% overweight
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div
		class="grid px-4 pt-2 pb-2 md:px-5 lg:px-6 lg:pt-5 lg:pb-6"
		in:fade|global={{ duration: 320, delay: 340 }}
	>
		<div
			class="col-start-1 row-start-1 transition-all duration-[240ms] ease-out {showNicknameForm
				? 'translate-x-0 opacity-100'
				: 'pointer-events-none translate-x-9 opacity-0'}"
			inert={!showNicknameForm}
		>
			<div class="flex justify-between">
				<div
					class="mb-2 font-mono text-[10px] font-extrabold tracking-[0.36em] text-fg-muted uppercase"
				>
					Nickname
				</div>
				{#if nicknameInput.length > 0 && nickError}
					<div class="font-sans text-[11px] text-danger/80 md:text-xs">{nickError}</div>
				{:else}
					<div class="font-sans text-[11px] text-fg-faint md:text-xs">Public on leaderboard</div>
				{/if}
			</div>
			<form
				class="relative flex h-[40px] items-stretch rounded-md border border-accent/40 shadow-[0_0_0_1px_rgba(235,187,78,0.09),0_0_16px_rgba(235,187,78,0.08),0_0_45px_rgba(235,187,78,0.03),0_10px_28px_rgba(0,0,0,0.45)] transition-shadow duration-200 ease-out focus-within:shadow-[0_0_0_1px_rgba(235,187,78,0.26),0_0_20px_rgba(235,187,78,0.22),0_0_55px_rgba(235,187,78,0.1),0_10px_28px_rgba(0,0,0,0.45)] md:h-[50px]"
				onsubmit={onSaveNickname}
			>
				<input
					id="leaderboard-nickname"
					data-testid="go-nick-input"
					type="text"
					bind:value={nicknameInput}
					autocomplete="off"
					spellcheck="false"
					maxlength={NICK_MAX}
					aria-label="Choose your nickname"
					class="min-w-0 flex-1 border-0 bg-transparent px-4 font-sans text-base font-semibold tracking-[0.02em] text-fg caret-accent outline-none placeholder:text-fg-faint md:px-4.5 md:text-[19px]"
				/>

				<div
					class="flex items-center px-3 font-mono text-[11px] font-semibold tracking-[0.04em] text-fg-faint tabular-nums md:px-3.5 md:text-xs"
				>
					{nicknameInput.length} / {NICK_MAX}
				</div>

				<button
					type="button"
					onclick={onCancelNickname}
					class="my-1.5 flex items-center gap-2 rounded-md border border-hairline bg-transparent px-3 font-sans text-[12px] font-bold tracking-[0.04em] text-fg-muted transition-all hover:bg-white/5 hover:text-fg active:scale-[0.98] md:px-4 md:text-[13px]"
				>
					<span>Cancel</span>
				</button>

				<button
					type="submit"
					data-testid="go-nick-save"
					disabled={!canSubmit}
					class="m-1.5 flex items-center gap-2 rounded-md border-none bg-gradient-to-b from-primary-top to-primary-bottom px-4 font-sans text-[12px] font-bold tracking-[0.04em] text-primary-ink transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 md:px-5.5 md:text-[13px]"
				>
					<span>Save</span>
				</button>
			</form>
		</div>
		<div
			class="col-start-1 row-start-1 transition-all duration-[240ms] ease-out {showNicknameForm
				? 'pointer-events-none -translate-x-9 opacity-0'
				: 'translate-x-0 opacity-100'}"
			inert={showNicknameForm}
		>
			<div
				class="mb-2 font-mono text-[10px] font-extrabold tracking-[0.36em] text-fg-muted uppercase"
			>
				Run Breakdown
			</div>

			<div class="grid grid-cols-4 gap-1.5">
				{@render breakdownCell('Time', formatTime(time.current))}
				{@render breakdownCell('Stages', `${fmt(stages.current)}/${STAGES.length}`)}
				{@render breakdownCell('Chests', fmt(chests.current))}
				<div class="rounded-xs border border-hairline bg-row px-3 py-2.5 md:px-3.5 md:py-3">
					<div class="font-mono text-[9px] font-bold tracking-[0.32em] text-fg-muted uppercase">
						Augment
					</div>
					<div
						class="mt-1 font-mono text-base leading-none font-black tracking-[0.1em] uppercase"
						style="color: {augmentRarity ? `var(--rarity-${augmentRarity})` : 'var(--text-faint)'};"
					>
						{augmentRarity?.toUpperCase() ?? 'NONE'}
					</div>
				</div>
			</div>
		</div>
	</div>

	<div
		class="grid grid-cols-2 border-t border-hairline"
		in:fly|global={{ y: 8, duration: 350, delay: 460 }}
	>
		<button
			type="button"
			data-testid="go-restart"
			onclick={restartGame}
			class="group flex items-center justify-center gap-2.5 border-r border-hairline bg-row py-2 text-fg transition-colors hover:bg-white/5 active:scale-[0.99] md:py-2.5 lg:py-4"
		>
			<Restart
				class="size-3 flex-none text-fg-muted group-hover:text-fg 2xl:size-[18px] 3xl:size-4 4xl:size-5 pointer-coarse:size-4"
			/>
			<span class="text-[10px] font-black tracking-[0.28em] uppercase">Retry</span>
		</button>
		{#if submitted}
			<button
				type="button"
				onclick={onOpenLeaderboard}
				class="flex items-center justify-center gap-2.5 bg-gradient-to-b from-primary-top to-primary-bottom py-2 text-primary-ink transition-[filter] hover:brightness-105 active:scale-[0.99] md:py-2.5 lg:py-4"
			>
				<Leaderboard />
				<span class="text-[13px] font-black tracking-[0.28em] uppercase">Leaderboard</span>
			</button>
		{:else}
			<button
				type="button"
				data-testid="go-submit"
				onclick={onSubmitClick}
				class="flex items-center justify-center gap-2.5 bg-gradient-to-b from-primary-top to-primary-bottom py-2 text-primary-ink transition-[filter] hover:brightness-105 active:scale-[0.99] md:py-2.5 lg:py-4"
			>
				<Leaderboard />
				<span class="text-[10px] font-black tracking-[0.28em] uppercase">Submit Score</span>
			</button>
		{/if}
	</div>
</div>
