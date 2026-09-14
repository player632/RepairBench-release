import { getDef } from '$lib/config/items';
import { generateLootItems, pickQuestItems } from './loot-table';
import type { Inventory } from './inventory.svelte';
import type { Quest } from './quest.svelte';
import type { Overlay } from './overlay.svelte';
import type { Interaction } from './interaction.svelte';
import type { InstanceItem, ItemLocation } from '$lib/types';
import { randInt } from '$lib/utils';
import { SvelteSet } from 'svelte/reactivity';
import type { AudioManager } from './audio.svelte';

function isInLootBack(loc: ItemLocation): boolean {
	if (loc.type === 'slot') return loc.storageId === 'lootBack';
	if (loc.type === 'attachment') return isInLootBack(loc.parentLocation);
	return false;
}

type LoadingStatus = 'idle' | 'loading' | 'done';

export class LootGenerator {
	private inventory: Inventory;
	private audio: AudioManager;
	private quest: Quest;
	private overlay: Overlay;
	private interaction: Interaction;
	phase = $state<LoadingStatus>('idle');
	private lootQueue = $state<string[]>([]);
	private scanIndex = $state(-1);
	shineQueue = new SvelteSet<string>();
	cooldown = $state(0);
	chestsOpened = $state(0);

	scriptedDrop: (() => InstanceItem[]) | null = null;

	constructor(
		inventory: Inventory,
		audio: AudioManager,
		quest: Quest,
		overlay: Overlay,
		interaction: Interaction
	) {
		this.inventory = inventory;
		this.audio = audio;
		this.quest = quest;
		this.overlay = overlay;
		this.interaction = interaction;
	}

	tick(dt: number): void {
		if (this.phase === 'loading') return;
		this.cooldown -= dt;
		if (this.cooldown <= 0) {
			this.next();
		}
	}

	private generateQuestItems(): InstanceItem[] {
		const unmatched = this.quest.items.filter((q) => !q.matched);
		const picks = pickQuestItems(
			unmatched.map((q) => ({ defId: q.defId, count: q.count })),
			this.quest.stageDef.questPity
		);
		return picks.map((p) => this.inventory.createItem(p.defId, p.count));
	}

	next(): void {
		const modal = this.overlay.recycleModal;
		if (modal && modal.locations.some(isInLootBack)) {
			this.overlay.closeRecycleModal();
		}

		const drag = this.interaction.dragState;
		if (drag && isInLootBack(drag.sourceLocation)) {
			this.interaction.cancel();
		}

		this.cooldown = this.quest.stageDef.lootCooldown;
		this.inventory.clearStorage('lootBack');
		this.shineQueue.clear();

		const items = this.scriptedDrop ? this.scriptedDrop() : this.generateRandomDrop();

		this.inventory.fillStorage('lootBack', items);
		this.lootQueue = items.map((i) => i.uid);
		this.scanIndex = 0;
		this.phase = 'loading';
		this.chestsOpened++;
		this.audio.play('chest');
	}

	private generateRandomDrop(): InstanceItem[] {
		const { lootProfile, chestSize } = this.quest.stageDef;

		const questItems = this.generateQuestItems();
		const randomCount = Math.max(0, randInt(chestSize.min, chestSize.max) - questItems.length);
		const rawItems = generateLootItems(lootProfile, randomCount);

		const items: InstanceItem[] = rawItems.map((raw) => {
			const item = this.inventory.createItem(raw.def.id, raw.count);
			if (raw.attachments && item.attachments) {
				item.attachments = raw.attachments.map((attDef) =>
					attDef ? this.inventory.createItem(attDef.id, 1) : null
				);
			}
			return item;
		});

		// Insert quest items at random positions
		for (const qi of questItems) {
			const pos = randInt(0, items.length);
			items.splice(pos, 0, qi);
		}

		return items;
	}

	slotScanned(): void {
		const uid = this.lootQueue[this.scanIndex];
		if (uid) this.shineQueue.add(uid);
		const loc: ItemLocation = { type: 'slot', storageId: 'lootBack', index: this.scanIndex };
		const item = this.inventory.getItem(loc);
		if (item) {
			const def = getDef(item.defId);
			if (def.rarity === 'legendary' || def.rarity === 'epic') {
				this.audio.play('rare_loot');
			}
		}
		this.scanIndex++;
		if (this.scanIndex > this.lootQueue.length) {
			this.phase = 'done';
		}
	}

	clearShine(uid: string): void {
		this.shineQueue.delete(uid);
	}

	scanning(uid: string): boolean {
		return this.phase === 'loading' && this.lootQueue[this.scanIndex] === uid;
	}

	hidden(uid: string): boolean {
		if (this.phase !== 'loading') return false;
		const idx = this.lootQueue.indexOf(uid);
		return idx >= 0 && idx > this.scanIndex;
	}
	reset() {
		this.phase = 'idle';
		this.scanIndex = -1;
		this.lootQueue = [];
		this.shineQueue.clear();
		this.chestsOpened = 0;
		this.cooldown = 0;
		this.scriptedDrop = null;
	}
}
