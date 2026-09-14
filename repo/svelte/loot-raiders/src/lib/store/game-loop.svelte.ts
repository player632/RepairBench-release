import { getDef } from '$lib/config/items';
import type { Inventory } from './inventory.svelte';
import type { AudioManager } from './audio.svelte';
import type { LootGenerator } from './loot.svelte';
import type { Selection } from './selection.svelte';
import type { Overlay } from './overlay.svelte';
import type { Quest } from './quest.svelte';
import type { Notifications } from './notifications.svelte';
import type { Augment } from './augment.svelte';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'tutorial' | 'over';

const QUEST_TIME_BONUS = 3;

export class GameLoop {
	private inventory: Inventory;
	private audio: AudioManager;
	private selection: Selection;
	private overlay: Overlay;
	private loot: LootGenerator;
	private quest: Quest;
	private notifications: Notifications;
	private augment: Augment;
	private rafId = 0;
	private lastTime = 0;
	private appliedShieldRarities = new Set<string>();
	private pendingMatchTime = 0;

	timeLeft = $state(0);
	elapsedTime = $state(0);
	status = $state<GameStatus>('idle');
	shieldTimeBonus = $state(0);
	questTimeBonus = $state(0);

	// The game board is mounted for both a normal run and a Tutorial Mode session.
	inSession = $derived(this.status === 'playing' || this.status === 'tutorial');

	constructor(
		inventory: Inventory,
		audio: AudioManager,
		selection: Selection,
		overlay: Overlay,
		loot: LootGenerator,
		quest: Quest,
		notifications: Notifications,
		augment: Augment
	) {
		this.audio = audio;
		this.inventory = inventory;
		this.selection = selection;
		this.overlay = overlay;
		this.loot = loot;
		this.quest = quest;
		this.notifications = notifications;
		this.augment = augment;

		$effect.root(() => {
			/* shield bonus */
			$effect(() => {
				const shield = this.inventory.shieldItem;
				if (!shield) return;
				const def = getDef(shield.defId);
				if (this.appliedShieldRarities.has(def.rarity)) return;
				const bonus = def.timeBonus ?? 0;
				this.timeLeft += bonus;
				this.shieldTimeBonus = bonus;
				this.appliedShieldRarities.add(def.rarity);
				if (this.status === 'playing') {
					this.audio.play('sheild');
					if (bonus > 0) {
						this.notifications.push({
							kind: 'shield',
							label: 'Shield bonus',
							amount: bonus,
							suffix: 's'
						});
					}
				}
			});

			/* quest checkMatches */
			$effect(() => {
				if (!this.inSession) return;
				const completed = this.quest.checkMatches();
				if (completed.length === 0) return;
				this.pendingMatchTime += completed.length * QUEST_TIME_BONUS;
				this.questTimeBonus = completed.length * QUEST_TIME_BONUS;
			});

			/* augment autoUpgrade */
			$effect(() => {
				if (!this.inSession) return;
				this.augment.autoUpgrade();
			});
		});
	}

	private setupSession() {
		cancelAnimationFrame(this.rafId);
		this.quest.reset();
		this.elapsedTime = 0;

		const augItem = this.inventory.createItem('aug_free_loadout', 1);
		this.inventory.fillStorage('augment', [augItem]);

		this.timeLeft = this.quest.stageDef.timeLimit;
	}

	start() {
		this.setupSession();

		this.status = 'playing';
		this.audio.playBGM();

		this.lastTime = performance.now();
		this.rafId = requestAnimationFrame((t) => this.tick(t));
	}

	startTutorial() {
		this.setupSession();

		this.status = 'tutorial';
	}

	stop() {
		cancelAnimationFrame(this.rafId);
		this.status = 'over';
		this.overlay.closeAll();
		this.audio.duckBGM();
	}

	// Tutorial Mode can't be paused: its clock is already frozen, so there is nothing to suspend.
	pause() {
		if (this.status !== 'playing') return;
		cancelAnimationFrame(this.rafId);
		this.status = 'paused';
		this.overlay.closeAll();
		this.audio.duckBGM();
	}

	resume() {
		if (this.status !== 'paused') return;
		this.audio.unduckBGM();
		this.status = 'playing';
		this.rafId = requestAnimationFrame((t) => this.tick(t));
	}

	attachAutoPause(): () => void {
		const isFullscreen = () =>
			!!(
				document.fullscreenElement ||
				(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
			);
		const pauseIfActive = () => {
			if (this.status === 'playing') this.pause();
		};
		const onFullscreenChange = () => {
			if (!isFullscreen()) pauseIfActive();
		};
		const onVisibilityChange = () => {
			if (document.hidden) {
				this.audio.suspend();
				pauseIfActive();
			} else {
				this.audio.resume();
			}
		};

		document.addEventListener('fullscreenchange', onFullscreenChange);
		document.addEventListener('webkitfullscreenchange', onFullscreenChange);
		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			document.removeEventListener('fullscreenchange', onFullscreenChange);
			document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}

	private tick(now: number) {
		const dt = (now - this.lastTime) / 1000;
		this.lastTime = now;

		this.step(dt);

		if (this.status === 'playing') {
			this.rafId = requestAnimationFrame((t) => this.tick(t));
		}
	}

	// Advances the run by `dt` seconds. Frozen unless a normal run is in progress, so a
	// Tutorial Mode session leaves the clock and loot cadence untouched across a tick.
	step(dt: number) {
		if (this.status !== 'playing') return;

		this.timeLeft -= dt;
		this.elapsedTime += dt;
		if (this.timeLeft <= 0) {
			this.timeLeft = 0;
			this.stop();
			return;
		}

		this.loot.tick(dt);


		if (this.quest.stageCompleted && !this.quest.allStagesCompleted) {
			const clearedName = this.quest.stageDef.name;
			const nextStage = this.quest.advanceStage();
			if (nextStage) {
				this.timeLeft = nextStage.timeLimit;
				this.notifications.push({
					kind: 'stage',
					label: 'Stage cleared',
					message: clearedName
				});
			}
		}
	}

	private resetState() {
		cancelAnimationFrame(this.rafId);

		this.selection.clear();
		this.overlay.closeAll();
		this.loot.reset();
		this.quest.reset();
		this.inventory.clearStorage('backpack');
		this.inventory.clearStorage('lootBack');
		this.inventory.clearStorage('weapon');
		this.inventory.clearStorage('augment');
		this.inventory.clearStorage('shield');
		this.appliedShieldRarities.clear();
		this.pendingMatchTime = 0;
		this.questTimeBonus = 0;
		this.notifications.clear();
	}

	restart() {
		this.resetState();
		this.start();
	}

	quit() {
		this.resetState();
		this.audio.stopBGM();
		this.timeLeft = 0;
		this.elapsedTime = 0;
		this.status = 'idle';
	}
}
