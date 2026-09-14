import { SvelteSet } from 'svelte/reactivity';
import type { AudioManager } from './audio.svelte';

const MAX_SELECTION = 10;

export class Selection {
	private audio: AudioManager;
	ids = new SvelteSet<string>();

	constructor(audio: AudioManager) {
		this.audio = audio;
	}

	isSelected(uid: string): boolean {
		return this.ids.has(uid);
	}

	select(uid: string): void {
		this.ids.clear();
		this.ids.add(uid);
		this.audio.play('selected');
	}

	toggle(uid: string): void {
		if (this.ids.has(uid)) {
			this.ids.delete(uid);
		} else {
			if (this.ids.size >= MAX_SELECTION) return;
			this.ids.add(uid);
		}
	}

	deselect(uid: string): void {
		this.ids.delete(uid);
	}

	clear(): void {
		this.ids.clear();
	}
}
