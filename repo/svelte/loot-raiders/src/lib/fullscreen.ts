type ElementWithWebkit = HTMLElement & {
	webkitRequestFullscreen?: () => Promise<void>;
};

type DocumentWithWebkit = Document & {
	webkitExitFullscreen?: () => Promise<void>;
};

export function enterFullscreen() {
	if (typeof document === 'undefined' || document.fullscreenElement) return;
	const el = document.documentElement as ElementWithWebkit;
	if (el.requestFullscreen) {
		el.requestFullscreen().catch(() => {});
	} else if (el.webkitRequestFullscreen) {
		el.webkitRequestFullscreen();
	}
}

export function exitFullscreen() {
	if (typeof document === 'undefined' || !document.fullscreenElement) return;
	const doc = document as DocumentWithWebkit;
	if (doc.exitFullscreen) {
		doc.exitFullscreen().catch(() => {});
	} else if (doc.webkitExitFullscreen) {
		doc.webkitExitFullscreen();
	}
}

export function toggleFullscreen() {
	if (typeof document === 'undefined') return;
	if (document.fullscreenElement) {
		exitFullscreen();
	} else {
		enterFullscreen();
	}
}

export function isTouchDevice() {
	return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}
