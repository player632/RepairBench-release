export type SoundConfig = {
	src: string;
	volume?: number;
	loop?: boolean;
	offset?: number;
};

export const SOUNDS = {
	bgm: {
		src: 'assets/audio/bgm.mp3',
		volume: 0.03,
		loop: true
	},
	rare_loot: {
		src: 'assets/audio/rare_loot.mp3',
		volume: 0.015,
		loop: false
	},
	drag: {
		src: 'assets/audio/drag.wav',
		volume: 0.04,
		loop: false,
		offset: 15
	},
	match: {
		src: 'assets/audio/match.wav',
		volume: 0.12,
		loop: false,
		offset: 18
	},
	selected: {
		src: 'assets/audio/selected.wav',
		volume: 0.1,
		loop: false,
		offset: 12
	},
	recycle: {
		src: 'assets/audio/recycle.wav',
		volume: 0.06,
		loop: false,
		offset: 15
	},
	sheild: {
		src: 'assets/audio/shield.wav',
		volume: 0.1,
		loop: false,
		offset: 15
	},
	attach: {
		src: 'assets/audio/attach.wav',
		volume: 0.1,
		loop: false,
		offset: 14
	},
	drop: {
		src: 'assets/audio/drop.wav',
		volume: 0.08,
		loop: false
	},
	swap: {
		src: 'assets/audio/swap.wav',
		volume: 0.06,
		loop: false,
		offset: 15
	},
	chest: {
		src: 'assets/audio/latch.wav',
		volume: 0.01,
		loop: false
	},
	click: {
		src: 'assets/audio/click_ui.wav',
		volume: 0.03,
		loop: false
	}
} satisfies Record<string, SoundConfig>;

export type SoundKey = keyof typeof SOUNDS;
