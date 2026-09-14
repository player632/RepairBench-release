<script module lang="ts">
	function hexToRgba(hex: string, alpha = 1): string {
		if (!hex) return `rgba(0,0,0,${alpha})`;
		let h = hex.replace('#', '');
		if (h.length === 3)
			h = h
				.split('')
				.map((c) => c + c)
				.join('');
		const int = parseInt(h, 16);
		const r = (int >> 16) & 255;
		const g = (int >> 8) & 255;
		const b = int & 255;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}
</script>

<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { cn } from '../utils/cn';

	interface ComponentProps {
		/**
		 * Content rendered inside the bordered box.
		 */
		children?: Snippet;
		/**
		 * Arc / border color. Accepts any hex color.
		 */
		color?: string;
		/**
		 * Animation speed multiplier.
		 */
		speed?: number;
		/**
		 * Noise amplitude — how jagged and chaotic the arcs look.
		 */
		chaos?: number;
		/**
		 * Corner radius in pixels.
		 */
		borderRadius?: number;
		/**
		 * One-shot trigger. When provided, the border stays hidden and only flashes
		 * for `flashMs` each time this number increases. Omit it for an always-on border.
		 */
		pulse?: number;
		/**
		 * How long a single pulse stays visible, in ms.
		 */
		flashMs?: number;
		/**
		 * Additional CSS classes for the container.
		 */
		class?: string;
		/**
		 * Inline styles for the container.
		 */
		style?: string;
	}

	let {
		children,
		color = '#FF8A4C',
		speed = 1,
		chaos = 0.12,
		borderRadius = 24,
		pulse,
		flashMs = 1500,
		class: className = '',
		style = ''
	}: ComponentProps = $props();

	let canvas = $state<HTMLCanvasElement>();
	let container = $state<HTMLDivElement>();

	const fadeMs = 600;

	let active = $state(untrack(() => pulse === undefined));
	let dimming = $state(false);
	// Plain (non-reactive) on purpose: only read/written inside the effect below.
	// As $state it would make the effect depend on its own write, re-run, and tear
	// down its own timers — leaving the border stuck on.
	let seenPulse = untrack(() => pulse ?? 0);

	$effect(() => {
		if (pulse === undefined) return;
		if (pulse === seenPulse) return;
		seenPulse = pulse;
		active = true;
		dimming = false;
		const startFade = setTimeout(() => (dimming = true), flashMs);
		const unmount = setTimeout(() => (active = false), flashMs + fadeMs);
		return () => {
			clearTimeout(startFade);
			clearTimeout(unmount);
		};
	});

	$effect(() => {
		if (!active) return;
		const cv = canvas;
		const host = container;
		if (!cv || !host) return;
		const ctx = cv.getContext('2d');
		if (!ctx) return;

		const octaves = 10;
		const lacunarity = 1.6;
		const gain = 0.7;
		const frequency = 10;
		const baseFlatness = 0;
		const displacement = 60;
		const borderOffset = 60;

		let time = 0;
		let lastFrame = 0;
		let raf: number | null = null;

		const random = (x: number) => (Math.sin(x * 12.9898) * 43758.5453) % 1;
		const noise2D = (x: number, y: number) => {
			const i = Math.floor(x);
			const j = Math.floor(y);
			const fx = x - i;
			const fy = y - j;
			const a = random(i + j * 57);
			const b = random(i + 1 + j * 57);
			const c = random(i + (j + 1) * 57);
			const d = random(i + 1 + (j + 1) * 57);
			const ux = fx * fx * (3 - 2 * fx);
			const uy = fy * fy * (3 - 2 * fy);
			return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
		};
		const octavedNoise = (x: number, t: number, seed: number) => {
			let y = 0;
			let amp = chaos;
			let freq = frequency;
			for (let i = 0; i < octaves; i++) {
				let oa = amp;
				if (i === 0) oa *= baseFlatness;
				y += oa * noise2D(freq * x + seed * 100, t * freq * 0.3);
				freq *= lacunarity;
				amp *= gain;
			}
			return y;
		};
		const cornerPoint = (
			cx: number,
			cy: number,
			r: number,
			startA: number,
			arcLen: number,
			p: number
		) => {
			const a = startA + p * arcLen;
			return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
		};
		const rectPoint = (t: number, l: number, tp: number, w: number, h: number, r: number) => {
			const sw = w - 2 * r;
			const sh = h - 2 * r;
			const ca = (Math.PI * r) / 2;
			const total = 2 * sw + 2 * sh + 4 * ca;
			const d = t * total;
			let acc = 0;
			if (d <= acc + sw) return { x: l + r + ((d - acc) / sw) * sw, y: tp };
			acc += sw;
			if (d <= acc + ca)
				return cornerPoint(l + w - r, tp + r, r, -Math.PI / 2, Math.PI / 2, (d - acc) / ca);
			acc += ca;
			if (d <= acc + sh) return { x: l + w, y: tp + r + ((d - acc) / sh) * sh };
			acc += sh;
			if (d <= acc + ca)
				return cornerPoint(l + w - r, tp + h - r, r, 0, Math.PI / 2, (d - acc) / ca);
			acc += ca;
			if (d <= acc + sw) return { x: l + w - r - ((d - acc) / sw) * sw, y: tp + h };
			acc += sw;
			if (d <= acc + ca)
				return cornerPoint(l + r, tp + h - r, r, Math.PI / 2, Math.PI / 2, (d - acc) / ca);
			acc += ca;
			if (d <= acc + sh) return { x: l, y: tp + h - r - ((d - acc) / sh) * sh };
			acc += sh;
			return cornerPoint(l + r, tp + r, r, Math.PI, Math.PI / 2, (d - acc) / ca);
		};

		let width = 0;
		let height = 0;
		const updateSize = () => {
			const rect = host.getBoundingClientRect();
			width = rect.width + borderOffset * 2;
			height = rect.height + borderOffset * 2;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			cv.width = width * dpr;
			cv.height = height * dpr;
			cv.style.width = `${width}px`;
			cv.style.height = `${height}px`;
			ctx.scale(dpr, dpr);
		};
		updateSize();

		const draw = (now: number) => {
			const dt = (now - lastFrame) / 1000;
			time += dt * speed;
			lastFrame = now;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, cv.width, cv.height);
			ctx.scale(dpr, dpr);
			ctx.strokeStyle = color;
			ctx.lineWidth = 1;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			const left = borderOffset;
			const top = borderOffset;
			const bw = width - 2 * borderOffset;
			const bh = height - 2 * borderOffset;
			const maxR = Math.min(bw, bh) / 2;
			const r = Math.min(borderRadius, maxR);
			const perim = 2 * (bw + bh) + 2 * Math.PI * r;
			const samples = Math.floor(perim / 2);
			ctx.beginPath();
			for (let i = 0; i <= samples; i++) {
				const p = i / samples;
				const pt = rectPoint(p, left, top, bw, bh, r);
				const xn = octavedNoise(p * 8, time, 0);
				const yn = octavedNoise(p * 8, time, 1);
				const dx = pt.x + xn * displacement;
				const dy = pt.y + yn * displacement;
				if (i === 0) ctx.moveTo(dx, dy);
				else ctx.lineTo(dx, dy);
			}
			ctx.closePath();
			ctx.stroke();
			raf = requestAnimationFrame(draw);
		};

		const ro = new ResizeObserver(updateSize);
		ro.observe(host);
		raf = requestAnimationFrame(draw);

		return () => {
			if (raf) cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});
</script>

<div
	bind:this={container}
	class={cn('relative isolate overflow-visible', className)}
	style="--electric-border-color:{color};border-radius:{borderRadius}px;{style}"
>
	{#if active}
		<div
			class="pointer-events-none absolute top-1/2 left-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 transition-opacity ease-out"
			style="opacity:{dimming ? 0 : 1};transition-duration:{fadeMs}ms"
		>
			<canvas bind:this={canvas} class="block"></canvas>
		</div>
		<div
			class="pointer-events-none absolute inset-0 z-0 rounded-[inherit] transition-opacity ease-out"
			style="opacity:{dimming ? 0 : 1};transition-duration:{fadeMs}ms"
		>
			<div
				class="pointer-events-none absolute inset-0 rounded-[inherit]"
				style="border:2px solid {hexToRgba(color, 0.6)};filter:blur(1px);"
			></div>
			<div
				class="pointer-events-none absolute inset-0 rounded-[inherit]"
				style="border:2px solid {color};filter:blur(4px);"
			></div>
			<div
				class="pointer-events-none absolute inset-0 -z-[1] scale-110 rounded-[inherit] opacity-30"
				style="filter:blur(32px);background:linear-gradient(-30deg, {color}, transparent, {color});"
			></div>
		</div>
	{/if}
	<div class="relative z-[1] rounded-[inherit]">{@render children?.()}</div>
</div>
