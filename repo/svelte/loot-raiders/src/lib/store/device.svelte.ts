interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PORTRAIT_MOBILE_QUERY = '(orientation: portrait) and (max-width: 1023px)';
const COARSE_POINTER_QUERY = '(pointer: coarse)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export class Device {
	isIPhone = $state(false);
	isStandalone = $state(false);
	deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
	isPortraitMobile = $state(
		typeof window !== 'undefined' && window.matchMedia(PORTRAIT_MOBILE_QUERY).matches
	);
	isCoarsePointer = $state(
		typeof window !== 'undefined' && window.matchMedia(COARSE_POINTER_QUERY).matches
	);
	isFullscreen = $state(typeof document !== 'undefined' && !!document.fullscreenElement);
	prefersReducedMotion = $state(
		typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches
	);

	private started = false;

	init() {
		if (this.started) return;
		if (typeof navigator === 'undefined') return;
		this.started = true;

		const ua = navigator.userAgent;
		this.isIPhone = /iPhone|iPod/.test(ua);
		this.isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as { standalone?: boolean }).standalone === true;

		const portrait = window.matchMedia(PORTRAIT_MOBILE_QUERY);
		this.isPortraitMobile = portrait.matches;
		portrait.addEventListener('change', () => {
			this.isPortraitMobile = portrait.matches;
		});

		const coarse = window.matchMedia(COARSE_POINTER_QUERY);
		this.isCoarsePointer = coarse.matches;
		coarse.addEventListener('change', () => {
			this.isCoarsePointer = coarse.matches;
		});

		const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
		this.prefersReducedMotion = reducedMotion.matches;
		reducedMotion.addEventListener('change', () => {
			this.prefersReducedMotion = reducedMotion.matches;
		});

		this.isFullscreen = !!document.fullscreenElement;
		document.addEventListener('fullscreenchange', () => {
			this.isFullscreen = !!document.fullscreenElement;
		});

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			this.deferredPrompt = e as BeforeInstallPromptEvent;
		});

		window.addEventListener('appinstalled', () => {
			this.deferredPrompt = null;
		});
	}

	async install() {
		if (!this.deferredPrompt) return;
		await this.deferredPrompt.prompt();
		this.deferredPrompt = null;
	}
}
