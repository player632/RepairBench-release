<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { getGameContext } from '$lib/store/game.svelte';
	import Cross from '$lib/ui-icon/cross.svelte';
	import Info from '$lib/ui-icon/info.svelte';
	import Github from '$lib/ui-icon/github.svelte';

	const { audio, device } = getGameContext();

	let open = $state(false);

	const wrapperPos = $derived(
		!device.isCoarsePointer
			? 'bottom-5 right-4'
			: 'bottom-[max(10px,env(safe-area-inset-bottom))] right-[max(24px,env(safe-area-inset-right))]'
	);

	function openModal() {
		audio.play('click');
		open = true;
	}
	function close() {
		open = false;
	}
</script>

<div class="pointer-events-none fixed {wrapperPos}">
	<div
		class="pointer-events-auto inline-flex items-center gap-2 rounded-full px-2.5 py-1 backdrop-blur-xs 2xl:gap-2.5 2xl:px-3 2xl:py-1.5"
	>
		<span class="font-mono text-[8px] text-fg-faint 2xl:text-[10px] 3xl:text-[11px] 4xl:text-xs"
			>A fan-made project inspired by ARC Raiders<span class="pointer-coarse:hidden"> · </span><br
				class="hidden pointer-coarse:inline"
			/>Not affiliated with
			<a
				href="https://www.embark-studios.com/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-fg-muted underline decoration-hairline underline-offset-2 transition-colors hover:text-accent hover:decoration-accent/60"
				>Embark Studios AB</a
			></span
		>
		<span class="h-4 w-px shrink-0 bg-hairline 2xl:h-[18px] 4xl:h-5"></span>
		<button
			type="button"
			onclick={openModal}
			aria-label="Legal disclaimer"
			class="flex size-4 shrink-0 items-center justify-center rounded-full text-fg-faint transition-colors hover:text-accent active:scale-90 2xl:size-[18px] 4xl:size-5"
		>
			<Info />
		</button>
		<a
			href="https://github.com/Fedorse/loot-raiders"
			target="_blank"
			rel="noopener noreferrer"
			aria-label="GitHub"
			class="flex size-4 shrink-0 items-center justify-center rounded-full text-fg-faint transition-colors hover:text-accent active:scale-90 2xl:size-[18px] 4xl:size-5"
		>
			<Github class="size-full" />
		</a>
	</div>
</div>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
		onclick={close}
		transition:fade={{ duration: 150 }}
	>
		<div
			class="max-h-[88dvh] w-full max-w-[520px] overflow-hidden rounded-md border border-accent/20 bg-gradient-to-b from-panel-top to-panel-bottom font-sans text-fg-body shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<div class="flex items-center justify-between gap-4 border-b border-hairline px-6 py-3.5">
				<span
					class="font-sans text-[13px] font-extrabold tracking-[0.22em] text-fg uppercase 2xl:text-[15px]"
				>
					Legal Disclaimer
				</span>
				<button
					type="button"
					onclick={close}
					aria-label="Close"
					class="flex size-8 shrink-0 items-center justify-center rounded-full border border-hairline bg-white/5 text-fg-muted transition-colors hover:border-accent/40 hover:text-accent active:scale-90"
				>
					<Cross />
				</button>
			</div>

			<div
				class="flex max-h-[calc(88dvh-56px)] flex-col gap-3 overflow-y-auto px-6 py-5 text-[13px] leading-relaxed text-fg-muted 2xl:text-sm 3xl:text-[15px]"
			>
				<p>
					Loot Raiders is an independent, unofficial fan project inspired by ARC Raiders. We are not
					affiliated with, endorsed by, or approved by <a
						href="https://www.embark-studios.com/"
						target="_blank"
						rel="noopener noreferrer"
						class="text-fg-body underline decoration-hairline underline-offset-2 transition-colors hover:text-accent hover:decoration-accent/60"
						>Embark Studios AB</a
					>.
				</p>
				<p>
					All ARC RAIDERS names, trademarks, artwork, music, sound, and game assets are the property
					of <a
						href="https://www.embark-studios.com/"
						target="_blank"
						rel="noopener noreferrer"
						class="text-fg-body underline decoration-hairline underline-offset-2 transition-colors hover:text-accent hover:decoration-accent/60"
						>Embark Studios AB</a
					> or their respective rights holders. We make no claim of ownership and intend no infringement.
				</p>
			</div>
		</div>
	</div>
{/if}
