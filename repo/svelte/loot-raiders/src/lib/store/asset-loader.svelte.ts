import { ITEM_DB } from '$lib/config/items';
import { PRELOAD_URLS } from '$lib/config/preload';
import { SCENE_IMAGE_URLS } from '$lib/components/backdrop/scenes';

const UI_ASSETS: readonly string[] = [
	'/assets/ui/icon-actions.webp',
	'/assets/ui/drop.webp',
	'/assets/ui/invalid.webp',
	'/assets/ui/Icon_Quest.webp',
	'/assets/ui/Coins.webp'
];

const WATCHDOG_MS = 8000;

class AssetLoader {
	total = $state(0);
	loaded = $state(0);
	ready = $state(false);

	progress = $derived(this.total > 0 ? this.loaded / this.total : 0);

	private started = false;
	private resolveReady!: () => void;
	readonly readyPromise = new Promise<void>((r) => (this.resolveReady = r));

	async preload(): Promise<void> {
		if (this.started) return;
		this.started = true;

		const urls = new Set<string>();

		for (const def of Object.values(ITEM_DB)) {
			if (def.image) urls.add(def.image);
			if (def.categoryIcon) urls.add(def.categoryIcon);
			for (const slot of def.attachmentSlots ?? []) {
				if (slot.placeholder) urls.add(slot.placeholder);
			}
		}
		for (const url of PRELOAD_URLS) urls.add(url);
		for (const url of UI_ASSETS) urls.add(url);
		for (const url of SCENE_IMAGE_URLS) urls.add(url);

		this.total = urls.size;

		const allLoaded = Promise.all([...urls].map((u) => this.loadOne(u)));
		const watchdog = new Promise<void>((resolve) =>
			setTimeout(() => {
				if (!this.ready) {
					console.warn(
						`[AssetLoader] watchdog fired: ${this.loaded}/${this.total} loaded after ${WATCHDOG_MS}ms`
					);
				}
				resolve();
			}, WATCHDOG_MS)
		);

		await Promise.race([allLoaded, watchdog]);

		this.ready = true;
		this.resolveReady();
	}

	private async loadOne(url: string): Promise<void> {
		try {
			const img = new Image();
			img.src = url;
			await img.decode();
		} catch {
			/* missing asset falls back to lazy load when the <img> mounts */
		}
		this.loaded++;
	}
}

export const assetLoader = new AssetLoader();
