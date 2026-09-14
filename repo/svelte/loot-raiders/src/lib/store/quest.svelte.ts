import { ITEM_DB } from '$lib/config/items';
import { uuid } from '$lib/utils';
import { STAGES } from '$lib/config/stages';
import type { StageDef } from '$lib/config/stages';
import type { Inventory } from './inventory.svelte';
import type { AudioManager } from './audio.svelte';
import type { ItemDefinition } from '$lib/types';

export interface QuestItem {
	id: string;
	defId: string;
	count: number;
	def: ItemDefinition;
	matched: boolean;
}

export class Quest {
	private inventory: Inventory;
	private audio: AudioManager;

	items = $state<QuestItem[]>([]);
	currentStage = $state(0);
	totalQuestsCompleted = $state(0);

	stageDef = $derived(STAGES[this.currentStage]);
	completed = $derived(this.items.filter((i) => i.matched).length);
	total = $derived(this.items.length);
	stageCompleted = $derived(this.items.length > 0 && this.items.some((i) => i.matched));
	allStagesCompleted = $derived(this.currentStage >= STAGES.length - 1 && this.stageCompleted);
	stagesCleared = $derived(this.allStagesCompleted ? STAGES.length : this.currentStage);

	constructor(inventory: Inventory, audio: AudioManager) {
		this.inventory = inventory;
		this.audio = audio;
	}

	loadStage(index: number) {
		this.currentStage = index;
		const stage = STAGES[index];
		this.items = stage.quests.map((q) => ({
			id: uuid(),
			defId: q.defId,
			count: q.count,
			def: ITEM_DB[q.defId],
			matched: false
		}));
	}

	advanceStage(): StageDef | null {
		const next = this.currentStage + 1;
		if (next >= STAGES.length) return null;
		this.loadStage(next);
		return STAGES[next];
	}

	reset() {
		this.totalQuestsCompleted = 0;
		this.loadStage(0);
	}

	getCollected(defId: string): number {
		return this.inventory.countAvailable(defId);
	}

	checkMatches(): QuestItem[] {
		const completed: QuestItem[] = [];

		for (const quest of this.items) {
			if (quest.matched) continue;
			const available = this.inventory.countAvailable(quest.defId);
			if (available < quest.count) continue;

			this.inventory.consumeMatched(quest.defId, quest.count);
			quest.matched = true;
			this.totalQuestsCompleted++;
			completed.push(quest);
			this.audio.play('match');
		}

		return completed;
	}
}
