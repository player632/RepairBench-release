import { Howl, Howler } from 'howler';
import { SOUNDS, type SoundKey, type SoundConfig } from '$lib/config/sounds';

const DUCK = 0.3;
const MASTER = 0.8;

export class AudioManager {
	volume = $state(2);
	muted = $state(false);
	private ducked = false;
	private howls = new Map<SoundKey, Howl>();
	private bgm: Howl | null = null;

	private bgmTarget(): number {
		return SOUNDS.bgm.volume * this.volume * MASTER * (this.ducked ? DUCK : 1);
	}

	constructor() {
		this.preload();
	}

	private preload() {
		for (const [key, config] of Object.entries(SOUNDS) as [SoundKey, SoundConfig][]) {
			const howl = new Howl({
				src: [config.src],
				volume: config.volume ?? this.volume,
				loop: config.loop ?? false
			});
			this.howls.set(key, howl);
		}
		this.bgm = this.howls.get('bgm') ?? null;
	}
	play(key: SoundKey) {
		const howl = this.howls.get(key);
		if (!howl || this.muted) return;
		const cfg = SOUNDS[key] as SoundConfig;
		howl.volume((cfg.volume ?? 1) * this.volume * MASTER);
		const id = howl.play();

		if (cfg.offset) howl.seek(cfg.offset / 1000, id);
	}
	playBGM() {
		if (!this.bgm) return;
		this.bgm.off('fade');
		this.bgm.volume(this.bgmTarget());
		if (!this.bgm.playing()) this.bgm.play();
	}
	duckBGM() {
		this.ducked = true;
		this.bgm?.fade(this.bgm.volume(), this.bgmTarget(), 400);
	}

	unduckBGM() {
		this.ducked = false;
		this.bgm?.fade(this.bgm.volume(), this.bgmTarget(), 400);
	}

	stopBGM() {
		if (!this.bgm) return;
		this.bgm.once('fade', () => this.bgm?.stop());
		this.bgm.fade(this.bgm.volume(), 0, 500);
	}

	setVolume(v: number) {
		this.volume = v;
		if (this.bgm?.playing()) {
			this.bgm.volume(this.bgmTarget());
		}
	}

	toggleMute() {
		this.muted = !this.muted;
		Howler.mute(this.muted);
	}

	suspend() {
		Howler.mute(true);
	}

	resume() {
		Howler.mute(this.muted);
	}
}
