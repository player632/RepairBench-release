import type { ItemLocation } from '$lib/types';

export function isEqualLocation(a: ItemLocation, b: ItemLocation): boolean {
	if (a.type !== b.type) return false;
	if (a.type === 'slot' && b.type === 'slot') {
		return a.storageId === b.storageId && a.index === b.index;
	}
	if (a.type === 'attachment' && b.type === 'attachment') {
		if (a.attachIndex !== b.attachIndex) return false;
		const pa = a.parentLocation;
		const pb = b.parentLocation;
		return (
			pa.type === 'slot' &&
			pb.type === 'slot' &&
			pa.storageId === pb.storageId &&
			pa.index === pb.index
		);
	}
	return false;
}

export function randInt(min: number, max: number): number {
	return min + Math.floor(Math.random() * (max - min + 1));
}

export function uuid(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
		(+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
	);
}

export const formatTime = (seconds: number) => {
	const mins = Math.floor(Math.floor(seconds) / 60);
	const secs = Math.floor(seconds) % 60;
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function formatCompact(n: number): string {
	if (n < 1000) return String(n);
	const unit = n < 1_000_000 ? { div: 1000, suffix: 'k' } : { div: 1_000_000, suffix: 'M' };
	return (n / unit.div).toFixed(1).replace(/\.0$/, '') + unit.suffix;
}

export function trackLayout(getEls: () => HTMLElement[], measure: () => void): () => void {
	measure();
	const ro = new ResizeObserver(measure);
	for (const el of getEls()) ro.observe(el);
	window.addEventListener('resize', measure);
	window.addEventListener('scroll', measure, true);
	return () => {
		ro.disconnect();
		window.removeEventListener('resize', measure);
		window.removeEventListener('scroll', measure, true);
	};
}

export interface Radii {
	tl: number;
	tr: number;
	br: number;
	bl: number;
}

// Per-corner radius from computed style, so a generated cut matches the real `rounded-*` of the element.
export function cornerRadii(el: HTMLElement): Radii {
	const s = getComputedStyle(el);
	return {
		tl: parseFloat(s.borderTopLeftRadius) || 0,
		tr: parseFloat(s.borderTopRightRadius) || 0,
		br: parseFloat(s.borderBottomRightRadius) || 0,
		bl: parseFloat(s.borderBottomLeftRadius) || 0
	};
}

// A rounded-rect SVG path with independent corner radii (an `<rect rx>` only does one uniform
// radius). Each radius is clamped to half the box so it never self-overlaps.
export function roundedRectPath(x: number, y: number, w: number, h: number, r: Radii): string {
	const lim = Math.min(w, h) / 2;
	const tl = Math.min(r.tl, lim);
	const tr = Math.min(r.tr, lim);
	const br = Math.min(r.br, lim);
	const bl = Math.min(r.bl, lim);
	return (
		`M${x + tl},${y} H${x + w - tr} A${tr},${tr} 0 0 1 ${x + w},${y + tr} ` +
		`V${y + h - br} A${br},${br} 0 0 1 ${x + w - br},${y + h} ` +
		`H${x + bl} A${bl},${bl} 0 0 1 ${x},${y + h - bl} ` +
		`V${y + tl} A${tl},${tl} 0 0 1 ${x + tl},${y} Z`
	);
}

// An element's bounding box as a rounded-rect SVG path, optionally inflated by `pad` and with its
// corner radii forced to `forceRadius`. Radii grow with the box so an inflated shape keeps its rounding.
export function elementToPath(el: HTMLElement, pad = 0, forceRadius?: number): string {
	const r = el.getBoundingClientRect();
	const cr =
		forceRadius !== undefined
			? { tl: forceRadius, tr: forceRadius, br: forceRadius, bl: forceRadius }
			: cornerRadii(el);
	const grow = (v: number): number => (v > 0 ? v + pad : pad > 0 ? pad : 0);
	return roundedRectPath(r.left - pad, r.top - pad, r.width + pad * 2, r.height + pad * 2, {
		tl: grow(cr.tl),
		tr: grow(cr.tr),
		br: grow(cr.br),
		bl: grow(cr.bl)
	});
}
