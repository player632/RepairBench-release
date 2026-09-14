<script lang="ts">
	interface Props {
		duration?: number;
		onscanned?: () => void;
		pause?: boolean;
		wipe?: boolean;
		direction?: 'horizontal' | 'vertical';
	}

	let {
		duration = 0.3,
		onscanned,
		pause = false,
		wipe = false,
		direction = 'horizontal'
	}: Props = $props();

	const playState = $derived(pause ? 'paused' : 'running');
</script>

{#if wipe}
	<div
		class="scanner-wipe"
		class:vertical={direction === 'vertical'}
		style="--duration: {duration}s; animation-play-state: {playState};"
	></div>
{/if}
<div
	class="scanner-beam pointer-events-none absolute inset-0"
	class:vertical={direction === 'vertical'}
	style="--duration: {duration}s; animation-play-state: {playState};"
	onanimationend={onscanned}
></div>

<style>
	.scanner-wipe {
		position: absolute;
		inset: 0;
		background: black;
		opacity: 0.8;
		clip-path: inset(0 100% 0 0);
		animation: wipe-h var(--duration) ease-in forwards;
	}

	.scanner-wipe.vertical {
		clip-path: inset(0 0 0 0);
		animation: wipe-v var(--duration) ease-in forwards;
	}

	.scanner-beam {
		transform: translateX(-100%);

		background: linear-gradient(
			to right,
			transparent 0%,
			rgba(192, 38, 211, 0) 10%,
			rgba(192, 38, 211, 0.6) 40%,
			rgba(34, 211, 238, 0.9) 75%,
			rgba(255, 255, 255, 1) 95%,
			transparent 100%
		);

		mix-blend-mode: screen;
		animation: sweep-h var(--duration) linear forwards;
		width: 100%;
		height: 100%;
	}

	.scanner-beam.vertical {
		transform: translateY(100%);
		background: linear-gradient(
			to top,
			transparent 0%,
			rgba(192, 38, 211, 0) 10%,
			rgba(192, 38, 211, 0.6) 40%,
			rgba(34, 211, 238, 0.9) 75%,
			rgba(255, 255, 255, 1) 95%,
			transparent 100%
		);
		animation: sweep-v var(--duration) linear forwards;
	}

	@keyframes wipe-h {
		0% {
			clip-path: inset(0 100% 0 0);
		}
		100% {
			clip-path: inset(0 -5% 0 0);
		}
	}

	@keyframes wipe-v {
		0% {
			clip-path: inset(100% 0 0 0);
		}
		100% {
			clip-path: inset(-5% 0 0 0);
		}
	}

	@keyframes sweep-h {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	@keyframes sweep-v {
		0% {
			transform: translateY(100%);
		}
		100% {
			transform: translateY(-100%);
		}
	}
</style>
