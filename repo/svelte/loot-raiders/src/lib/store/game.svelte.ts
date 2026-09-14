import { setContext, getContext } from 'svelte';
import { browser } from '$app/environment';
import { formatTime } from '$lib/utils';
import { Inventory } from './inventory.svelte';
import { Interaction } from './interaction.svelte';
import { Overlay } from './overlay.svelte';
import { LootGenerator } from './loot.svelte';
import { Selection } from './selection.svelte';
import { GameLoop } from './game-loop.svelte';
import { AudioManager } from './audio.svelte';
import { Quest } from './quest.svelte';
import { Augment } from './augment.svelte';
import { Device } from './device.svelte';
import { Leaderboard } from './leaderboard.svelte';
import { Notifications } from './notifications.svelte';
import { Tutorial } from './tutorial.svelte';

export class Game {
	audio = new AudioManager();
	selection = new Selection(this.audio);
	inventory = new Inventory(this.selection, this.audio);
	overlay = new Overlay();
	notifications = new Notifications();
	augment = new Augment(this.inventory, this.notifications);
	device = new Device();
	interaction = new Interaction(this.inventory, this.overlay, this.selection, this.audio);
	quest = new Quest(this.inventory, this.audio);
	loot = new LootGenerator(this.inventory, this.audio, this.quest, this.overlay, this.interaction);
	gameLoop = new GameLoop(
		this.inventory,
		this.audio,
		this.selection,
		this.overlay,
		this.loot,
		this.quest,
		this.notifications,
		this.augment
	);
	leaderboard = new Leaderboard();
	tutorial = new Tutorial(
		this.gameLoop,
		this.loot,
		this.inventory,
		this.quest,
		this.augment,
		this.overlay,
		this.device
	);

	constructor() {
		this.interaction.setTutorial(this.tutorial);
	}
}

const GAME_KEY = Symbol('GAME');

// Repair-Bench instrumentation: read-only probe bridge for black-box checkpoints.
function registerProbes(game: Game): void {
	let maxTimeLeft = 0;
	$effect.root(() => {
		$effect(() => {
			const t = game.gameLoop.timeLeft;
			if (t > maxTimeLeft) maxTimeLeft = t;
		});
	});

	const read = () => {
		const gl = game.gameLoop;
		const inv = game.inventory;
		const q = game.quest;
		const loot = game.loot;
		const tut = game.tutorial;
		const storages: Record<string, ({ defId: string; count: number; match: boolean } | null)[]> = {};
		for (const sid of ['lootBack', 'backpack', 'weapon', 'augment', 'shield'] as const) {
			const size = inv.getStorageSize(sid);
			const arr: ({ defId: string; count: number; match: boolean } | null)[] = [];
			for (let i = 0; i < size; i++) {
				const it = inv.getItem({ type: 'slot', storageId: sid, index: i });
				arr.push(it ? { defId: it.defId, count: it.count, match: !!it.match } : null);
			}
			storages[sid] = arr;
		}
		let ftueSeen = false;
		try {
			ftueSeen = window.localStorage.getItem('lr_ftue_v1') === '1';
		} catch {}
		return {
			status: gl.status,
			timeLeft: gl.timeLeft,
			elapsedTime: gl.elapsedTime,
			shieldTimeBonus: gl.shieldTimeBonus,
			questTimeBonus: gl.questTimeBonus,
			maxTimeLeft,
			chestsOpened: loot.chestsOpened,
			lootPhase: loot.phase,
			lootCooldown: loot.cooldown,
			currentStage: q.currentStage,
			stageName: q.stageDef.name,
			questsTotal: q.total,
			questsCompleted: q.completed,
			totalQuestsCompleted: q.totalQuestsCompleted,
			stageCompleted: q.stageCompleted,
			stagesCleared: q.stagesCleared,
			questItems: q.items.map((i) => ({ defId: i.defId, count: i.count, matched: i.matched })),
			totalExtract: inv.totalExtract,
			totalWeight: inv.totalWeight,
			maxWeight: inv.maxWeight,
			weightMultiplier: inv.weightMultiplier,
			scoredExtract: inv.scoredExtract,
			isOverweight: inv.isOverweight,
			backpackSize: inv.getStorageSize('backpack'),
			augmentDefId: inv.augmentItem?.defId ?? null,
			shieldDefId: inv.shieldItem?.defId ?? null,
			upgradePulse: game.augment.upgradePulse,
			recyclePulse: inv.recyclePulse,
			selectionCount: game.selection.ids.size,
			storages,
			toasts: game.notifications.toasts.map((t) => ({
				kind: t.kind,
				label: t.label,
				message: t.message ?? null,
				amount: t.amount ?? null
			})),
			overlay: {
				leaderboard: game.overlay.leaderboard,
				questSheet: game.overlay.questSheet,
				recycleModal: game.overlay.recycleModal !== null,
				contextMenu: game.overlay.contextMenu !== null,
				augmentPanel: game.overlay.augmentPanel !== null
			},
			tutorial: {
				active: tut.active,
				index: tut.index,
				stepId: tut.step?.id ?? null,
				stepNumber: tut.stepNumber,
				total: tut.total
			},
			nickname: game.leaderboard.nickname,
			ftueSeen
		};
	};

	(window as unknown as Record<string, unknown>).__lr = read;
	(window as unknown as Record<string, unknown>).__lrGame = game;
	(window as unknown as Record<string, unknown>).__lrFormat = formatTime;
}

export const initGame = () => {
	const game = new Game();
	setContext(GAME_KEY, game);
	if (browser) registerProbes(game);
	return game;
};
export const getGameContext = () => getContext<Game>(GAME_KEY);
