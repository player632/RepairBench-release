<script lang="ts">
	import { fade } from 'svelte/transition';
	import { getGameContext } from '$lib/store/game.svelte';

	const { device } = getGameContext();
</script>

{#snippet rotateIcon()}
	<svg
		class="rotate-device-icon"
		viewBox="-30 -20 200 180"
		aria-label="Rotate your device to landscape"
		role="img"
	>
		<g class="rdi-group">
			<rect x="40" y="10" width="60" height="100" rx="10" ry="10" class="rdi-stroke" />
			<rect x="46" y="19" width="48" height="78" rx="3" ry="3" class="rdi-screen" />
			<circle cx="70" cy="103" r="2.4" class="rdi-ink-fill" />
			<rect x="62" y="14" width="16" height="2" rx="1" class="rdi-screen" />
		</g>
		<circle class="rdi-pulse-ring rdi-accent" cx="100" cy="10" r="10" />
		<circle class="rdi-pulse-dot rdi-accent-fill" cx="100" cy="10" r="3.5" />
	</svg>
{/snippet}

{#snippet androidInstall()}
	<div class="flex flex-col items-center gap-3 text-center">
		<p class="max-w-72 text-xs leading-relaxed text-white/40">
			For a smoother experience, install Loot Raiders as an app.
		</p>
		<button
			class="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
			onclick={() => device.install()}
		>
			Install app
		</button>
	</div>
{/snippet}

{#snippet iphoneInstall()}
	<div class="flex flex-col items-center gap-3 text-center">
		<p class="max-w-72 text-xs leading-relaxed text-white/40">
			For a smoother experience, install Loot Raiders as an app.
		</p>
		<ol class="flex flex-col gap-1.5 text-xs text-white/60">
			<li>1. Tap the <span class="text-white/90">Share</span> icon</li>
			<li>2. Choose <span class="text-white/90">Add to Home Screen</span></li>
			<li>3. Tap <span class="text-white/90">Add</span></li>
		</ol>
	</div>
{/snippet}

{#if device.isPortraitMobile}
	<div
		class="fixed inset-0 z-[9999] flex h-full flex-col items-center bg-black/95 p-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] backdrop-blur-md"
		transition:fade={{ duration: 200 }}
	>
		<div class="flex flex-1 flex-col items-center justify-center gap-6">
			{@render rotateIcon()}

			<div class="flex flex-col items-center gap-2 text-center">
				<h2 class="text-lg font-bold tracking-wide text-white/90">Rotate Your Device</h2>
				<p class="max-w-64 text-sm leading-relaxed text-white/50">
					Loot Raiders requires landscape.
				</p>
			</div>
		</div>

		{#if device.deferredPrompt}
			<div class="flex flex-col items-center gap-6">
				<div class="h-px w-32 bg-white/10"></div>
				{@render androidInstall()}
			</div>
		{:else if device.isIPhone && !device.isStandalone}
			<div class="flex flex-col items-center gap-6">
				<div class="h-px w-32 bg-white/10"></div>
				{@render iphoneInstall()}
			</div>
		{/if}
	</div>
{/if}

<style>
	.rotate-device-icon {
		width: 8rem;
		height: 8rem;
		overflow: visible;
	}

	.rdi-group {
		transform-box: fill-box;
		transform-origin: 50% 60%;
		animation: rdi-tilt 2.6s ease-in-out infinite;
	}

	.rdi-pulse-ring,
	.rdi-pulse-dot {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: rdi-pulse 2.6s ease-in-out infinite;
	}

	.rdi-pulse-dot {
		animation-delay: 0.1s;
	}

	@keyframes rdi-tilt {
		0%,
		18% {
			transform: rotate(0deg);
		}
		50%,
		68% {
			transform: rotate(-88deg);
		}
		100% {
			transform: rotate(0deg);
		}
	}

	@keyframes rdi-pulse {
		0%,
		18% {
			opacity: 0;
			transform: scale(0.6);
		}
		30% {
			opacity: 0.85;
			transform: scale(1);
		}
		50%,
		68% {
			opacity: 0;
			transform: scale(1.4);
		}
		100% {
			opacity: 0;
			transform: scale(0.6);
		}
	}

	.rdi-stroke {
		stroke: rgb(255 255 255 / 0.6);
		fill: none;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.rdi-accent {
		stroke: #ffb800;
		fill: none;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.rdi-accent-fill {
		fill: #ffb800;
	}

	.rdi-ink-fill {
		fill: rgb(255 255 255 / 0.6);
	}

	.rdi-screen {
		fill: rgb(255 255 255 / 0.05);
	}

	@media (prefers-reduced-motion: reduce) {
		.rdi-group {
			animation: none;
			transform: rotate(-88deg);
		}
		.rdi-pulse-ring,
		.rdi-pulse-dot {
			animation: none;
			opacity: 0;
		}
	}
</style>
